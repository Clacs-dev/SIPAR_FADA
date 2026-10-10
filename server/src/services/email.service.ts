import logger from '../config/logger';
import nodemailer, { type Transporter } from 'nodemailer';
import { SettingsService } from './settings.service';
import { avisoContactoResponsavelHtml, type ContactoResponsavel } from './email-templates';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /**
   * Utilizador responsavel (ex: quem publicou o pedido de procurement). O
   * e-mail continua a sair do endereco do sistema, mas mostra o nome dele no
   * remetente, responde-lhe (Reply-To) e leva o aviso "gerado pelo sistema -
   * envie a factura para ...".
   */
  contacto?: ContactoResponsavel | null;
  /** Ficheiros anexados (caminho no disco do servidor). */
  attachments?: { filename: string; path: string; contentType?: string }[];
}

/**
 * Serviço de e-mail integrado para notificações transacionais
 */
export class EmailService {
  private static transporter: Transporter | null = null;

  /** Chamar depois de gravar definicoes novas de email, para a proxima chamada reconstruir o transporter. */
  static resetTransporter() {
    this.transporter = null;
  }

  private static resolveConfig() {
    const gmailUser = SettingsService.get('email_gmail_user', 'GMAIL_USER') || process.env.GOOGLE_SMTP_USER;
    const gmailPass = SettingsService.get('email_gmail_app_password', 'GMAIL_APP_PASSWORD') || process.env.GOOGLE_SMTP_PASS;
    const smtpHostSetting = SettingsService.get('email_smtp_host', 'SMTP_HOST');
    const smtpHost = smtpHostSetting || (gmailUser && gmailPass ? 'smtp.gmail.com' : undefined);
    const smtpPort = parseInt(SettingsService.get('email_smtp_port', 'SMTP_PORT') || (smtpHost === 'smtp.gmail.com' ? '465' : '587'));
    const smtpUser = SettingsService.get('email_smtp_user', 'SMTP_USER') || gmailUser;
    const smtpPass = SettingsService.get('email_smtp_pass', 'SMTP_PASS') || gmailPass;
    const from = SettingsService.get('email_from', 'EMAIL_FROM') || smtpUser || gmailUser || 'sipar20@sistema.com';
    return { gmailUser, gmailPass, smtpHost, smtpPort, smtpUser, smtpPass, from };
  }

  private static getTransporter() {
    if (this.transporter) return this.transporter;

    const { smtpHost, smtpPort, smtpUser, smtpPass } = this.resolveConfig();

    if (smtpHost && smtpUser && smtpPass) {
      logger.info('[EmailService] Inicializando Nodemailer via SMTP...');
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } else {
      logger.warn('[EmailService] Configuracoes de SMTP ausentes. E-mails serao impressos apenas nos logs do sistema em desenvolvimento.');
    }

    return this.transporter;
  }

  /**
   * Envia um e-mail transacional
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    let fromAddress = options.from || this.resolveConfig().from;
    let html = options.html;
    let replyTo: string | undefined;
    const contacto = options.contacto?.email ? options.contacto : null;
    if (contacto) {
      html += avisoContactoResponsavelHtml(contacto);
      replyTo = contacto.nome ? `"${contacto.nome.replace(/"/g, '')}" <${contacto.email}>` : contacto.email;
      const enderecoSistema = /<([^>]+)>/.exec(fromAddress)?.[1] || fromAddress;
      fromAddress = `"${(contacto.nome || 'FADA').replace(/"/g, '')} via SIPAR-FADA" <${enderecoSistema}>`;
    }
    
    try {
      const transporter = this.getTransporter();
      
      if (transporter) {
        await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html,
          ...(replyTo ? { replyTo } : {}),
          ...(options.attachments?.length ? { attachments: options.attachments } : {}),
        });
        logger.info(`[EmailService] E-mail enviado com sucesso para ${options.to}`);
        return true;
      } else {
        // Fallback: imprimir nos logs do sistema
        logger.info('[EmailService] FALLBACK SIMULADO - CONTEUDO DO E-MAIL:');
        logger.info(`   De: ${fromAddress}`);
        logger.info(`   Para: ${options.to}`);
        if (replyTo) logger.info(`   Responder a: ${replyTo}`);
        if (options.attachments?.length) logger.info(`   Anexos: ${options.attachments.map((a) => a.filename).join(', ')}`);
        logger.info(`   Assunto: ${options.subject}`);
        logger.info(`   Corpo HTML (Resumo): ${html.substring(0, 300)}...`);
        return true;
      }
    } catch (error) {
      logger.error(`[EmailService] Erro ao enviar e-mail para ${options.to}:`, error);
      // Retornar true no ambiente de dev mesmo com falha para não travar os fluxos de aprovação
      return process.env.NODE_ENV === 'development';
    }
  }

  static getStatus() {
    const { smtpHost, smtpUser, smtpPass, from } = this.resolveConfig();

    return {
      configured: Boolean(smtpHost && smtpUser && smtpPass),
      provider: smtpHost === 'smtp.gmail.com' ? 'gmail' : smtpHost ? 'smtp' : 'logs',
      host: smtpHost || null,
      user: smtpUser ? smtpUser.replace(/(^.).*(@.*$)/, '$1***$2') : null,
      from,
    };
  }

  static async verifyConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) return { ok: false, error: 'SMTP/Gmail nao configurado' };
      await transporter.verify();
      return { ok: true };
    } catch (error: any) {
      logger.error('[EmailService] Falha ao verificar SMTP:', error);
      return { ok: false, error: error?.message || 'Falha ao verificar SMTP' };
    }
  }
}

export const emailService = EmailService;
