import { Router, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import fs from 'fs';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth';
import { requireLicenseModule } from '../middlewares/license';
import { multerUpload } from '../controllers/storage.controller';
import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from '../services/audit.service';
import { estadoExtraccao, registarExtraccaoIa } from '../services/extraccao-regras.service';
import {
  documentoPrincipal, extrairPorIa, extrairPorRegras, motivoPdfRecusado, NOME_TIPO, ResultadoExtraccao, textoDoPdf, tipoPeloConteudo,
} from '../services/invoice-extraction.service';
import { consultarNif } from '../services/nif-lookup.service';
import { procurarFacturasDuplicadas } from '../services/factura-duplicados.service';
import { StorageService } from '../services/storage.service';

const router = Router();

/**
 * O que o utilizador pode usar no registo automatico de facturas: extraccao
 * sem IA, com IA, e quantas extraccoes com IA ainda lhe restam (limite do utilizador).
 * O cliente usa isto para mostrar/esconder as opcoes da Nova Factura.
 */
router.get('/estado', requireAuth as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({ success: true, ...(await estadoExtraccao({ id: req.user!.id, role: req.user!.role })) });
  } catch (error) {
    next(error);
  }
});

// 20 extraccoes por hora por utilizador (cada uma le um PDF e pode custar IA).
const limiteExtraccoes = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Atingiu o limite de 20 extracções por hora. Continue no modo Manual ou tente mais tarde.' },
});

function removerFicheiro(caminho?: string) {
  if (caminho) fs.promises.unlink(caminho).catch(() => undefined);
}

/**
 * POST /extraccao-facturas/extrair (multipart, campo "file"; ?motor=auto|regras|ia)
 * Le o PDF/imagem e devolve os campos para o utilizador rever. NAO cria a factura.
 * O ficheiro fica guardado como anexo (devolvido em "anexo") - mesmo quando a
 * extraccao falha, para o utilizador continuar no modo Manual com ele anexado.
 */
router.post(
  '/extrair',
  requireAuth as any,
  requireLicenseModule('invoices') as any,
  limiteExtraccoes,
  multerUpload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const inicio = Date.now();
    const ficheiro = req.file;
    try {
      const user = req.user!;
      if (!ficheiro) return res.status(400).json({ error: 'BAD_REQUEST', message: 'Nenhum ficheiro enviado.' });

      const estado = await estadoExtraccao({ id: user.id, role: user.role });
      if (!estado.regras && !estado.ia) {
        removerFicheiro(ficheiro.path);
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: estado.modo_servidor === 'off'
            ? 'O registo automático de facturas está desligado no servidor.'
            : (estado.motivo_ia_indisponivel || 'O seu perfil não tem permissão para o registo automático de facturas.'),
        });
      }

      const buffer = await fs.promises.readFile(ficheiro.path);
      const tipo = tipoPeloConteudo(buffer);
      if (!tipo) {
        removerFicheiro(ficheiro.path);
        return res.status(400).json({ error: 'INVALID_FILE_TYPE', message: 'Só são aceites PDF, JPG ou PNG (o conteúdo do ficheiro não corresponde a nenhum destes).' });
      }
      const recusa = tipo === 'application/pdf' ? motivoPdfRecusado(buffer) : null;
      if (recusa) {
        removerFicheiro(ficheiro.path);
        return res.status(400).json({ error: 'PDF_RECUSADO', message: recusa });
      }

      // O ficheiro passa a anexo (igual a /storage/upload).
      const url = `${req.protocol}://${req.get('host')}/uploads/${ficheiro.filename}`;
      await prisma.uploadedFile.create({
        data: {
          id: ficheiro.filename, userId: user.id, originalName: ficheiro.originalname, filename: ficheiro.filename,
          path: ficheiro.path, url, mimetype: tipo, size: ficheiro.size, module: 'facturas',
        },
      }).catch((error) => logger.error('Falha ao registar o upload da extraccao:', error));
      const anexo = {
        id: ficheiro.filename, nome: ficheiro.originalname, url, tamanho: ficheiro.size, tipo, uploaded_at: new Date().toISOString(),
      };

      // Escolha do motor: regras locais primeiro; IA quando as regras nao chegam
      // (modo hibrido), quando so a IA e permitida, ou quando pedida (?motor=ia).
      const pedido = String(req.query.motor || 'auto');
      const modo = estado.modo_servidor;
      let documentos: ResultadoExtraccao[] = [];
      let motorUsado: 'regras' | 'ia' | null = null;
      const avisosMotor: string[] = [];

      const podeRegras = estado.regras && pedido !== 'ia' && modo !== 'ia';
      if (podeRegras && tipo === 'application/pdf') {
        try {
          const texto = await textoDoPdf(buffer);
          if (texto.replace(/\s/g, '').length >= 40) {
            documentos = [extrairPorRegras(texto)];
            motorUsado = 'regras';
          } else {
            avisosMotor.push('O PDF não tem texto (é uma digitalização) - as regras locais não o conseguem ler.');
          }
        } catch (error: any) {
          avisosMotor.push(`Não foi possível ler o texto do PDF (${error?.message || 'erro'}).`);
        }
      } else if (podeRegras) {
        avisosMotor.push('Imagens (JPG/PNG) só podem ser lidas com IA.');
      }

      const regrasChegam = documentos.length > 0 && documentos[0].completo;
      const querIa = pedido === 'ia' || (!regrasChegam && (modo === 'hibrido' || modo === 'ia' || !estado.regras));
      if (querIa && pedido !== 'regras') {
        if (estado.ia) {
          try {
            documentos = await extrairPorIa(buffer, tipo);
            motorUsado = 'ia';
            await registarExtraccaoIa(user, { ficheiro: ficheiro.originalname, documentos: documentos.length });
          } catch (error: any) {
            logger.warn('Falha na extraccao com IA:', error?.message || error);
            const msg = error?.status === 401 ? 'chave da API inválida'
              : /credit balance/i.test(error?.message || '') ? 'a conta da IA não tem créditos'
              : error?.message || 'erro';
            avisosMotor.push(`A extracção com IA falhou (${msg}).`);
          }
        } else if (estado.motivo_ia_indisponivel && !regrasChegam) {
          avisosMotor.push(estado.motivo_ia_indisponivel);
        }
      }

      const principal = documentos.length ? documentoPrincipal(documentos) : -1;
      const escolhido = principal >= 0 ? documentos[principal] : null;

      // Fornecedor cadastrado com o mesmo NIF, dados da AGT e duplicados - para o documento proposto.
      let fornecedor: { id: string; nome: string | null } | null = null;
      let agt: any = null;
      let duplicados: any[] = [];
      const nif = escolhido?.campos.fornecedor_nif || '';
      if (nif) {
        const [f, a, d] = await Promise.all([
          prisma.fornecedor.findFirst({ where: { nif, deletedAt: null } as any, select: { id: true, nome: true } }).catch(() => null),
          consultarNif(nif).catch(() => null),
          procurarFacturasDuplicadas(nif, escolhido!.campos.numero_fornecedor).catch(() => []),
        ]);
        fornecedor = f;
        agt = a;
        duplicados = d;
        if (a?.encontrado && a.dados?.nome && escolhido!.campos.fornecedor_nome
          && !semelhante(a.dados.nome, escolhido!.campos.fornecedor_nome)) {
          escolhido!.avisos.push(`O nome na AGT ("${a.dados.nome}") é diferente do nome no documento ("${escolhido!.campos.fornecedor_nome}").`);
        }
      }

      const resultado = !escolhido ? 'falha' : escolhido.completo ? 'sucesso' : 'parcial';
      await auditService.logAction('FACTURA_EXTRAIDA', resultado === 'falha' ? 'warning' : 'info', {
        ficheiro: ficheiro.originalname,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        tamanho: ficheiro.size,
        motor: motorUsado,
        duracao_ms: Date.now() - inicio,
        resultado,
        documentos: documentos.map((d) => `${NOME_TIPO[d.tipo_original]} ${d.campos.numero_fornecedor}`.trim()),
      }, {
        userId: user.id, userEmail: user.email, userRole: user.role, resource: 'factura', success: resultado !== 'falha',
      });

      return res.status(200).json({
        success: true,
        motor: motorUsado,
        resultado,
        documentos,
        principal,
        fornecedor,
        agt,
        duplicados,
        anexo,
        avisos_motor: avisosMotor,
        estado: await estadoExtraccao({ id: user.id, role: user.role }),
      });
    } catch (error) {
      if (ficheiro) StorageService.deleteFile(ficheiro.filename).catch(() => undefined);
      next(error);
    }
  }
);

function semelhante(a: string, b: string): boolean {
  const limpar = (s: string) => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(LDA|LIMITADA|SA|SU|COMERCIO|SERVICOS|PRESTACAO|DE|E|DO|DA)\b/g, '').replace(/[^A-Z0-9]/g, '');
  const x = limpar(a), y = limpar(b);
  return !!x && !!y && (x.includes(y) || y.includes(x) || x.slice(0, 6) === y.slice(0, 6));
}

export default router;
