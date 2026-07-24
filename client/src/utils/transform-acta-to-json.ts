/**
 * ============================================
 * TRANSFORMAÇÃO DE ACTA PARA JSON OFICIAL
 * ============================================
 * 
 * Transforma a acta do formato plano para a estrutura JSON hierárquica oficial
 * IMPORTANTE: Esta é a MESMA lógica do backend, duplicada no frontend para uso offline
 */

export interface ActaTransformada {
  cabecalho: {
    titulo: string;
    texto_abertura: string;
    quorum: string;
  };
  agenda: {
    descricao: string;
    pontos: Array<{
      titulo: string;
      observacao: string;
    }>;
  };
  discussoes: Array<{
    numero: string;
    titulo: string;
    texto: string;
    intervencoes: Array<{
      nome: string;
      cargo: string;
      texto: string;
    }>;
  }>;
  deliberacoes: Array<{
    numero: string;
    titulo: string;
    texto: string;
  }>;
  recomendacoes: {
    lista: string[];
    nota: string;
  };
  encerramento: {
    texto: string;
    local_data: string;
  };
  assinaturas: {
    presidente: {
      nome: string;
      cargo: string;
    };
    secretario: {
      nome: string;
      cargo: string;
    };
  };
  participantes: string;
}

/**
 * Funções auxiliares
 */
const getMesNome = (mes: number): string => {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return meses[mes] || 'janeiro';
};

const converterAnoParaTexto = (ano: number): string => {
  const anos: { [key: number]: string } = {
    2023: 'dois mil e vinte e três',
    2024: 'dois mil e vinte e quatro',
    2025: 'dois mil e vinte e cinco',
    2026: 'dois mil e vinte e seis',
    2027: 'dois mil e vinte e sete',
    2028: 'dois mil e vinte e oito',
    2029: 'dois mil e vinte e nove',
    2030: 'dois mil e trinta'
  };
  return anos[ano] || ano.toString();
};

const converterNumeroParaTexto = (num: number): string => {
  const numeros: { [key: number]: string } = {
    1: 'Um', 2: 'Dois', 3: 'Três', 4: 'Quatro', 5: 'Cinco',
    6: 'Seis', 7: 'Sete', 8: 'Oito', 9: 'Nove', 10: 'Dez',
    11: 'Onze', 12: 'Doze', 13: 'Treze', 14: 'Catorze', 15: 'Quinze',
    16: 'Dezasseis', 17: 'Dezassete', 18: 'Dezoito', 19: 'Dezanove', 20: 'Vinte'
  };
  return numeros[num] || num.toString();
};

/**
 * Transforma a acta do formato plano para a estrutura JSON hierárquica oficial
 */
export function transformarActaParaJSON(acta: any): any {
  // Se já está transformada, retornar como está
  if (acta.cabecalho && acta.agenda && acta.assinaturas) {
    return acta;
  }

  // Função auxiliar para gerar lista de participantes
  const gerarListaParticipantes = (): string => {
    if (!acta.participantes || acta.participantes.length === 0) {
      return '[lista de participantes]';
    }
    const presentes = acta.participantes
      .filter((p: any) => p.presente)
      .map((p: any) => `${p.nome} (${p.cargo})`)
      .join(', ');
    return presentes || '[nenhum participante presente]';
  };

  // Processar data
  const data = new Date(acta.data_reuniao);
  const dia = data.getDate();
  const mes = getMesNome(data.getMonth());
  const ano = data.getFullYear();
  const anoExtenso = converterAnoParaTexto(ano);

  // 1️⃣ CABEÇALHO - SEMPRE USAR O PADRÃO OFICIAL (não aceitar texto customizado)
  const cabecalho = {
    titulo: acta.numero || `ACTA N.º ${ano}`,
    texto_abertura: `Aos ${dia} dias do mês de ${mes} do ano de ${anoExtenso}, pelas ${acta.hora_inicio || '[hora_inicio]'}, nas instalações de ${acta.entidade || '[entidade]'}, sitas em ${acta.endereco_completo || '[endereco_completo]'}, realizou-se a ${acta.numero_reuniao || '[numero_reuniao]'}ª reunião ${acta.tipo_reuniao === 'ordinaria' ? 'ordinária' : acta.tipo_reuniao === 'extraordinaria' ? 'extraordinária' : '[tipo_reuniao]'} de ${acta.orgao || '[orgao]'}, devidamente convocada nos termos legais e estatutários aplicáveis, sob a presidência de ${acta.presidente || '[presidente]'}, contando com a presença de ${gerarListaParticipantes()}, conforme lista de presenças, tendo sido designado(a) ${acta.secretario || '[secretario]'} para secretariar os trabalhos.`,
    quorum: 'Verificada a existência de quórum legal, o Senhor(a) Presidente declarou aberta a sessão.'
  };

  // 2️⃣ AGENDA - Incluir título E observações de cada ponto
  const agenda = {
    descricao: 'A reunião decorreu de acordo com a seguinte agenda:',
    pontos: acta.pontos_agenda?.map((p: any) => {
      // Se for objeto, retornar objeto completo com título e observação
      if (typeof p === 'object' && p !== null) {
        return {
          titulo: p.titulo || p.descricao || '',
          observacao: p.observacao || p.descricao_completa || p.detalhes || ''
        };
      }
      // Se for string simples, retornar como objeto
      return {
        titulo: p,
        observacao: ''
      };
    }) || []
  };

  // 3️⃣ DISCUSSÕES - FORMATO PROFISSIONAL COM TEMPLATES VARIADOS
  const discussoes = acta.pontos_agenda?.filter((p: any) => {
    if (typeof p === 'object' && p !== null) {
      return p.discussao || p.intervencoes?.length > 0;
    }
    return false;
  }).map((ponto: any, index: number) => {
    const pontoNumero = converterNumeroParaTexto(index + 1);
    const pontoTitulo = ponto.titulo || `Ponto ${pontoNumero}`;
    
    // 🔥 TEMPLATES VARIADOS POR PONTO
    let textoDiscussao = '';
    const materiaDiscutida = ponto.discussao || ponto.descricao || 'as questões apresentadas';
    
    // Template específico baseado no índice do ponto
    if (index === 0) {
      // PONTO 1: "No âmbito do Ponto Um, referente a [título], foram apresentadas e discutidas as matérias relacionadas com [discussão]"
      textoDiscussao = `No âmbito do Ponto ${pontoNumero}, referente a ${pontoTitulo}, foram apresentadas e discutidas as matérias relacionadas com ${materiaDiscutida}`;
      
      if (ponto.intervencoes && ponto.intervencoes.length > 0) {
        textoDiscussao += ', tendo os membros manifestado as seguintes posições: ';
        const intervencoesTexto = ponto.intervencoes.map((i: any) => {
          const nome = i.participante_nome || '';
          const cargo = i.participante_cargo || '';
          const texto = i.texto || '';
          const prefixo = nome && cargo ? `${nome} (${cargo})` : nome || 'Participante';
          return `${prefixo} referiu que ${texto}`;
        }).join('; ');
        textoDiscussao += intervencoesTexto + '.';
      } else {
        textoDiscussao += '.';
      }
      
    } else if (index === 1) {
      // PONTO 2: "Relativamente ao Ponto Dois, procedeu-se à discussão de [título], tendo sido analisado [discussão]"
      textoDiscussao = `Relativamente ao Ponto ${pontoNumero}, procedeu-se à discussão de ${pontoTitulo}, tendo sido analisado ${materiaDiscutida}`;
      
      if (ponto.intervencoes && ponto.intervencoes.length > 0) {
        textoDiscussao += ', com os contributos registados de ';
        const intervencoesTexto = ponto.intervencoes.map((i: any) => {
          const nome = i.participante_nome || '';
          const cargo = i.participante_cargo || '';
          const texto = i.texto || '';
          const prefixo = nome && cargo ? `${nome} (${cargo})` : nome || 'Participante';
          return `${prefixo} referiu que ${texto}`;
        }).join('; ');
        textoDiscussao += intervencoesTexto + '.';
      } else {
        textoDiscussao += '.';
      }
      
    } else if (index === 2) {
      // PONTO 3: "Quanto ao Ponto Três, foi discutido [título], nos termos seguintes: [discussão]"
      textoDiscussao = `Quanto ao Ponto ${pontoNumero}, foi discutido ${pontoTitulo}, nos termos seguintes: ${materiaDiscutida}`;
      
      if (ponto.intervencoes && ponto.intervencoes.length > 0) {
        textoDiscussao += '. Registaram-se as seguintes intervenções: ';
        const intervencoesTexto = ponto.intervencoes.map((i: any) => {
          const nome = i.participante_nome || '';
          const cargo = i.participante_cargo || '';
          const texto = i.texto || '';
          const prefixo = nome && cargo ? `${nome} (${cargo})` : nome || 'Participante';
          return `${prefixo} referiu que ${texto}`;
        }).join('; ');
        textoDiscussao += intervencoesTexto + '.';
      } else {
        textoDiscussao += '.';
      }
      
    } else {
      // PONTOS 4+: Ciclar entre os 3 templates anteriores
      const templateIndex = index % 3;
      
      if (templateIndex === 0) {
        // Usar template do Ponto 1
        textoDiscussao = `No âmbito do Ponto ${pontoNumero}, referente a ${pontoTitulo}, foram apresentadas e discutidas as matérias relacionadas com ${materiaDiscutida}`;
        
        if (ponto.intervencoes && ponto.intervencoes.length > 0) {
          textoDiscussao += ', tendo os membros manifestado as seguintes posições: ';
          const intervencoesTexto = ponto.intervencoes.map((i: any) => {
            const nome = i.participante_nome || '';
            const cargo = i.participante_cargo || '';
            const texto = i.texto || '';
            const prefixo = nome && cargo ? `${nome} (${cargo})` : nome || 'Participante';
            return `${prefixo} referiu que ${texto}`;
          }).join('; ');
          textoDiscussao += intervencoesTexto + '.';
        } else {
          textoDiscussao += '.';
        }
        
      } else if (templateIndex === 1) {
        // Usar template do Ponto 2
        textoDiscussao = `Relativamente ao Ponto ${pontoNumero}, procedeu-se à discussão de ${pontoTitulo}, tendo sido analisado ${materiaDiscutida}`;
        
        if (ponto.intervencoes && ponto.intervencoes.length > 0) {
          textoDiscussao += ', com os contributos registados de ';
          const intervencoesTexto = ponto.intervencoes.map((i: any) => {
            const nome = i.participante_nome || '';
            const cargo = i.participante_cargo || '';
            const texto = i.texto || '';
            const prefixo = nome && cargo ? `${nome} (${cargo})` : nome || 'Participante';
            return `${prefixo} referiu que ${texto}`;
          }).join('; ');
          textoDiscussao += intervencoesTexto + '.';
        } else {
          textoDiscussao += '.';
        }
        
      } else {
        // Usar template do Ponto 3
        textoDiscussao = `Quanto ao Ponto ${pontoNumero}, foi discutido ${pontoTitulo}, nos termos seguintes: ${materiaDiscutida}`;
        
        if (ponto.intervencoes && ponto.intervencoes.length > 0) {
          textoDiscussao += '. Registaram-se as seguintes intervenções: ';
          const intervencoesTexto = ponto.intervencoes.map((i: any) => {
            const nome = i.participante_nome || '';
            const cargo = i.participante_cargo || '';
            const texto = i.texto || '';
            const prefixo = nome && cargo ? `${nome} (${cargo})` : nome || 'Participante';
            return `${prefixo} referiu que ${texto}`;
          }).join('; ');
          textoDiscussao += intervencoesTexto + '.';
        } else {
          textoDiscussao += '.';
        }
      }
    }

    return {
      numero: `PONTO ${pontoNumero.toUpperCase()}`,
      titulo: pontoTitulo,
      texto: textoDiscussao
    };
  }) || [];

  // 4️⃣ DELIBERAÇÕES - FORMATO PROFISSIONAL COM TEMPLATES VARIADOS
  const deliberacoes = acta.pontos_agenda?.filter((p: any) => {
    if (typeof p === 'object' && p !== null) {
      return p.decisao;
    }
    return false;
  }).map((ponto: any, index: number) => {
    const pontoNumero = converterNumeroParaTexto(index + 1);
    const pontoTitulo = ponto.titulo || `Ponto ${pontoNumero}`;
    
    // Preparar texto da votação
    let votacaoTexto = '';
    if (ponto.tipo_votacao === 'unanimidade') {
      votacaoTexto = 'aprovada por unanimidade';
    } else if (ponto.tipo_votacao === 'maioria') {
      const favor = ponto.votos_favor || 0;
      const contra = ponto.votos_contra || 0;
      const abstencoes = ponto.abstencoes || 0;
      votacaoTexto = `aprovada por maioria, com ${favor} votos a favor, ${contra} votos contra e ${abstencoes} abstenções`;
    } else if (ponto.tipo_votacao === 'sem_votacao') {
      votacaoTexto = 'tomada sem votação formal';
    } else {
      votacaoTexto = 'aprovada';
    }

    const decisao = ponto.decisao || '';
    
    // 🔥 TEMPLATES VARIADOS POR PONTO
    let textoDeliberacao = '';
    
    if (index === 0) {
      // PONTO 1: "Foi deliberado [decisão], tendo a deliberação sido [votação]."
      textoDeliberacao = `Foi deliberado ${decisao}, tendo a deliberação sido ${votacaoTexto}.`;
    } else if (index === 1) {
      // PONTO 2: "Foi deliberado [decisão], com o seguinte resultado: [votação]."
      textoDeliberacao = `Foi deliberado ${decisao}, com o seguinte resultado: ${votacaoTexto}.`;
    } else if (index === 2) {
      // PONTO 3: "Foi deliberado [decisão], ficando registado que [votação]."
      textoDeliberacao = `Foi deliberado ${decisao}, ficando registado que ${votacaoTexto}.`;
    } else {
      // PONTOS 4+: Ciclar entre os 3 templates
      const templateIndex = index % 3;
      
      if (templateIndex === 0) {
        textoDeliberacao = `Foi deliberado ${decisao}, tendo a deliberação sido ${votacaoTexto}.`;
      } else if (templateIndex === 1) {
        textoDeliberacao = `Foi deliberado ${decisao}, com o seguinte resultado: ${votacaoTexto}.`;
      } else {
        textoDeliberacao = `Foi deliberado ${decisao}, ficando registado que ${votacaoTexto}.`;
      }
    }

    return {
      numero: `PONTO ${pontoNumero.toUpperCase()}`,
      titulo: pontoTitulo,
      texto: textoDeliberacao
    };
  }) || [];

  // 5️⃣ RECOMENDAÇÕES
  const recomendacoes = {
    lista: acta.recomendacoes || [],
    nota: 'As recomendações acima deverão ser consideradas para implementação ou acompanhamento nos termos definidos pelos órgãos competentes.'
  };

  // 6️⃣ ENCERRAMENTO - SEMPRE USAR O PADRÃO OFICIAL (não aceitar texto customizado)
  const encerramento = {
    texto: `Nada mais havendo a tratar, o Senhor(a) Presidente deu por encerrada a sessão pelas ${acta.hora_fim || '[hora_fim]'}, da qual se lavrou a presente acta que, após leitura e aprovação, vai ser assinada por mim, ${acta.secretario || '[secretario]'}, e pelo Senhor(a) Presidente.`,
    local_data: `${acta.cidade || 'Luanda'}, ${dia} de ${mes} de ${ano}`
  };

  // 7️⃣ ASSINATURAS
  const assinaturas = {
    presidente: {
      nome: acta.presidente || '[Nome do Presidente]',
      cargo: acta.cargo_presidente || '[Cargo do Presidente]'
    },
    secretario: {
      nome: acta.secretario || '[Nome do Secretário]',
      cargo: acta.cargo_secretario || '[Cargo do Secretário]'
    }
  };

  // 8️⃣ PARTICIPANTES (como string)
  let participantesTexto = '';
  if (acta.participantes && acta.participantes.length > 0) {
    participantesTexto = acta.participantes
      .map((p: any) => `${p.nome} - ${p.cargo}${p.departamento ? ' - ' + p.departamento : ''} - ${p.presente ? 'Presente' : 'Ausente'}`)
      .join('\n');
  } else {
    participantesTexto = '[lista_participantes_completa_com_cargos]';
  }

  // Retornar estrutura JSON oficial
  return {
    ...acta, // Manter campos originais para compatibilidade
    cabecalho,
    agenda,
    discussoes,
    deliberacoes,
    recomendacoes,
    encerramento,
    assinaturas,
    participantes: participantesTexto
  };
}