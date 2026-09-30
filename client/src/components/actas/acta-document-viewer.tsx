/**
 * ============================================
 * VISUALIZADOR DE ACTA - ESTRUTURA JSON OFICIAL
 * ============================================
 * 
 * Segue EXATAMENTE a estrutura hierárquica definida no JSON:
 * 
 * acta {
 *   cabecalho { titulo, texto_abertura, quorum }
 *   agenda { descricao, pontos[] }
 *   discussoes [{ numero, titulo, texto }]
 *   deliberacoes [{ numero, titulo, texto }]
 *   recomendacoes { lista[], nota }
 *   encerramento { texto, local_data }
 *   assinaturas { presidente{nome,cargo}, secretario{nome,cargo} }
 *   participantes: string
 * }
 */

import { Card, CardContent } from "../ui/card";
import { SquareCheck, Square } from "lucide-react";

interface ActaDocumentViewerProps {
  acta: any;
}

/**
 * Função auxiliar para converter qualquer valor em string segura
 */
function toSafeString(value: any): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object' && value !== null) {
    // Se for objeto com propriedade 'titulo', usar ela
    if (value.titulo) return value.titulo;
    if (value.nome) return value.nome;
    // Caso contrário, retornar stringificação
    return JSON.stringify(value);
  }
  return String(value || '');
}

export function ActaDocumentViewer({ acta }: ActaDocumentViewerProps) {
  // Se não houver dados transformados, não renderizar nada
  if (!acta.cabecalho && !acta.agenda && !acta.discussoes) {
    return (
      <Card className="acta-document-container print:shadow-none">
        <CardContent className="p-8 md:p-12">
          <p className="text-center text-muted-foreground">
            Dados da acta não disponíveis ou ainda não processados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="acta-document-container print:shadow-none">
      <CardContent className="p-8 md:p-12 space-y-6 print:p-0">
        
        {/* ============================================ */}
        {/* 1️⃣ CABEÇALHO */}
        {/* ============================================ */}
        <section className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase mb-4">
            {toSafeString(acta.cabecalho?.titulo || 'ACTA')}
          </h1>
        </section>

        {/* Texto de Abertura (ESTÁTICO do JSON) */}
        {acta.cabecalho?.texto_abertura && (
          <section className="mb-6">
            <p className="text-justify leading-relaxed text-base">
              {toSafeString(acta.cabecalho.texto_abertura)}
            </p>
          </section>
        )}

        {/* Quórum (ESTÁTICO do JSON) */}
        {acta.cabecalho?.quorum && (
          <section className="mb-6">
            <p className="text-justify leading-relaxed text-base">
              {toSafeString(acta.cabecalho.quorum)}
            </p>
          </section>
        )}

        {/* ============================================ */}
        {/* 2️⃣ AGENDA */}
        {/* ============================================ */}
        {acta.agenda && acta.agenda.pontos && (
          <section className="mb-8">
            <h2 className="font-bold mb-3 uppercase text-lg">Ordem de Trabalhos</h2>
            
            {/* Descrição da agenda */}
            {acta.agenda.descricao && (
              <p className="text-justify leading-relaxed mb-3 text-base">
                {toSafeString(acta.agenda.descricao)}
              </p>
            )}
            
            {/* Lista de pontos - com título E observação */}
            {Array.isArray(acta.agenda.pontos) && acta.agenda.pontos.length > 0 && (
              <ol className="list-decimal ml-6 space-y-2">
                {acta.agenda.pontos.map((ponto: any, index: number) => (
                  <li key={index} className="text-justify text-base">
                    {/* Se for objeto com título e observação */}
                    {typeof ponto === 'object' && ponto !== null ? (
                      <>
                        <strong>{toSafeString(ponto.titulo)}</strong>
                        {ponto.observacao && (
                          <span className="block mt-1 text-muted-foreground">
                            {toSafeString(ponto.observacao)}
                          </span>
                        )}
                      </>
                    ) : (
                      /* Se for string simples */
                      toSafeString(ponto)
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {/* ============================================ */}
        {/* 3️⃣ DISCUSSÕES */}
        {/* ============================================ */}
        <section className="mb-8">
          <h2 className="font-bold mb-4 uppercase text-lg">Discussões</h2>
          {acta.discussoes && Array.isArray(acta.discussoes) && acta.discussoes.length > 0 ? (
            <div className="space-y-6">
              {acta.discussoes.map((discussao: any, index: number) => (
                <div key={index} className="mb-6">
                  {/* Cabeçalho do ponto */}
                  <div className="mb-3 pb-2 border-b">
                    <h3 className="font-bold text-base text-primary">
                      {toSafeString(discussao.numero)}
                    </h3>
                    <p className="text-sm text-muted-foreground italic mt-1">
                      {toSafeString(discussao.titulo)}
                    </p>
                  </div>

                  {/* Texto da discussão */}
                  <p className="text-justify leading-relaxed text-base mb-3">
                    {toSafeString(discussao.texto)}
                  </p>

                  {/* Intervenções registadas */}
                  {discussao.intervencoes && discussao.intervencoes.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-muted">
                      <p className="text-sm font-semibold mb-2">Intervenções registadas:</p>
                      <ul className="space-y-2">
                        {discussao.intervencoes.map((intervencao: any, intIdx: number) => (
                          <li key={intIdx} className="text-sm text-justify">
                            <strong>{toSafeString(intervencao.nome)}</strong>
                            {intervencao.cargo && (
                              <span className="text-muted-foreground"> ({toSafeString(intervencao.cargo)})</span>
                            )}
                            : {toSafeString(intervencao.texto)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-justify leading-relaxed text-base text-muted-foreground italic">
              Não foram registadas discussões para os pontos de agenda.
            </p>
          )}
        </section>

        {/* ============================================ */}
        {/* 4️⃣ DELIBERAÇÕES */}
        {/* ============================================ */}
        <section className="mb-8">
          <h2 className="font-bold mb-4 uppercase text-lg">Deliberações</h2>
          {acta.deliberacoes && Array.isArray(acta.deliberacoes) && acta.deliberacoes.length > 0 ? (
            <div className="space-y-5">
              {acta.deliberacoes.map((delib: any, index: number) => (
                <div key={index} className="mb-5">
                  {/* Cabeçalho do ponto */}
                  <div className="mb-3 pb-2 border-b">
                    <h3 className="font-bold text-base text-primary">
                      {toSafeString(delib.numero)}
                    </h3>
                    <p className="text-sm text-muted-foreground italic mt-1">
                      {toSafeString(delib.titulo)}
                    </p>
                  </div>

                  {/* Texto da deliberação (template profissional) */}
                  <p className="text-justify leading-relaxed text-base">
                    {toSafeString(delib.texto)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-justify leading-relaxed text-base text-muted-foreground italic">
              Não foram registadas deliberações para os pontos de agenda.
            </p>
          )}
        </section>

        {/* ============================================ */}
        {/* 5️⃣ RECOMENDAÇÕES */}
        {/* ============================================ */}
        {acta.recomendacoes && acta.recomendacoes.lista && Array.isArray(acta.recomendacoes.lista) && acta.recomendacoes.lista.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold mb-4 uppercase text-lg">Recomendações</h2>
            
            {/* Lista de recomendações */}
            <ol className="list-decimal ml-6 space-y-2 mb-3">
              {acta.recomendacoes.lista.map((rec: any, idx: number) => (
                <li key={idx} className="text-justify text-base">{toSafeString(rec)}</li>
              ))}
            </ol>
            
            {/* Nota (ESTÁTICO do JSON) */}
            {acta.recomendacoes.nota && (
              <p className="text-sm italic text-muted-foreground mt-3">
                {toSafeString(acta.recomendacoes.nota)}
              </p>
            )}
          </section>
        )}

        {/* ============================================ */}
        {/* 6️⃣ ENCERRAMENTO */}
        {/* ============================================ */}
        <section className="mb-8">
          <h2 className="font-bold mb-4 uppercase text-lg">Encerramento</h2>
          {acta.encerramento && acta.encerramento.texto ? (
            <p className="text-justify leading-relaxed text-base">
              {toSafeString(acta.encerramento.texto)}
            </p>
          ) : (
            <p className="text-justify leading-relaxed text-base text-muted-foreground italic">
              Texto de encerramento não disponível.
            </p>
          )}
        </section>

        {/* Local e Data (ESTÁTICO do JSON) */}
        {acta.encerramento?.local_data && (
          <div className="text-right mb-12">
            <p className="italic text-base">{toSafeString(acta.encerramento.local_data)}</p>
          </div>
        )}

        {/* ============================================ */}
        {/* 7️⃣ ASSINATURAS */}
        {/* ============================================ */}
        {acta.assinaturas && (
          <section className="space-y-12 mt-16">
            
            {/* Presidente */}
            {acta.assinaturas.presidente && (
              <div className="text-center">
                <div className="mb-2">
                  <p className="text-center">_________________________________________</p>
                </div>
                <p className="font-bold text-base">O/A Presidente</p>
                <p className="text-base mt-1">{toSafeString(acta.assinaturas.presidente.nome)}</p>
                {acta.assinaturas.presidente.cargo && (
                  <p className="text-sm text-muted-foreground">
                    {toSafeString(acta.assinaturas.presidente.cargo)}
                  </p>
                )}
              </div>
            )}

            {/* Secretário */}
            {acta.assinaturas.secretario && (
              <div className="text-center">
                <div className="mb-2">
                  <p className="text-center">_________________________________________</p>
                </div>
                <p className="font-bold text-base">O/A Secretário(a)</p>
                <p className="text-base mt-1">{toSafeString(acta.assinaturas.secretario.nome)}</p>
                {acta.assinaturas.secretario.cargo && (
                  <p className="text-sm text-muted-foreground">
                    {toSafeString(acta.assinaturas.secretario.cargo)}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ============================================ */}
        {/* 8️⃣ PARTICIPANTES (STRING do JSON) */}
        {/* ============================================ */}
        {acta.participantes && (
          <section className="mt-16 pt-8 border-t-2 border-border">
            <h2 className="font-bold mb-6 uppercase text-center text-lg">
              Lista de Presenças
            </h2>
            
            {/* Renderizar como string se for string, ou converter array para string */}
            {typeof acta.participantes === 'string' ? (
              <div className="text-justify text-base whitespace-pre-wrap">
                {acta.participantes}
              </div>
            ) : Array.isArray(acta.participantes) ? (
              <div className="space-y-3">
                {acta.participantes.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-medium text-base">{toSafeString(p.nome || p)}</p>
                      {p.cargo && (
                        <p className="text-sm text-muted-foreground">{toSafeString(p.cargo)}</p>
                      )}
                    </div>
                    {typeof p === 'object' && p !== null && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          {p.presente ? <><SquareCheck className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Presente</> : <><Square className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Ausente</>}
                        </span>
                        <div className="w-40 border-b-2 border-gray-400">
                          {/* Linha de assinatura */}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-justify text-base">
                {toSafeString(acta.participantes)}
              </div>
            )}
          </section>
        )}

      </CardContent>
    </Card>
  );
}