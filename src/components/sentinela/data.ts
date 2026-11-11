export const monthlyTrend = [
  { mes: "Jun", ocorrencias: 268, confirmadas: 191 },
  { mes: "Jul", ocorrencias: 312, confirmadas: 224 },
  { mes: "Ago", ocorrencias: 289, confirmadas: 216 },
];

export const weeklyTrend = [
  { semana: "S1", ocorrencias: 62 },
  { semana: "S2", ocorrencias: 74 },
  { semana: "S3", ocorrencias: 69 },
  { semana: "S4", ocorrencias: 84 },
  { semana: "S5", ocorrencias: 71 },
  { semana: "S6", ocorrencias: 79 },
];

export const byWeekday = [
  { dia: "Seg", ocorrencias: 38 },
  { dia: "Ter", ocorrencias: 42 },
  { dia: "Qua", ocorrencias: 47 },
  { dia: "Qui", ocorrencias: 51 },
  { dia: "Sex", ocorrencias: 72 },
  { dia: "Sáb", ocorrencias: 81 },
  { dia: "Dom", ocorrencias: 58 },
];

export const byHour = [
  { hora: "00h", ocorrencias: 21 },
  { hora: "04h", ocorrencias: 9 },
  { hora: "08h", ocorrencias: 26 },
  { hora: "12h", ocorrencias: 34 },
  { hora: "16h", ocorrencias: 48 },
  { hora: "20h", ocorrencias: 67 },
];

export const byType = [
  { tipo: "Furto", valor: 124 },
  { tipo: "Roubo", valor: 86 },
  { tipo: "Dano", valor: 41 },
  { tipo: "Ameaça", valor: 27 },
  { tipo: "Violência", valor: 19 },
  { tipo: "Outros", valor: 32 },
];

export const bySource = [
  { origem: "População", valor: 143 },
  { origem: "Registros policiais", valor: 168 },
  { origem: "Outras fontes", valor: 18 },
];

export const occurrences = [
  { protocolo: "SNT-2026-002291", tipo: "Furto", regiao: "Centro", data: "24/08/2026", hora: "19:40", origem: "População", status: "Em análise", confiabilidade: 62 },
  { protocolo: "SNT-2026-002288", tipo: "Roubo", regiao: "Centro", data: "23/08/2026", hora: "21:05", origem: "Registro policial", status: "Confirmada", confiabilidade: 88 },
  { protocolo: "SNT-2026-002280", tipo: "Dano", regiao: "Norte", data: "22/08/2026", hora: "13:20", origem: "População", status: "Recebida", confiabilidade: 45 },
  { protocolo: "SNT-2026-002271", tipo: "Ameaça", regiao: "Leste", data: "21/08/2026", hora: "23:10", origem: "Registro policial", status: "Encaminhada", confiabilidade: 79 },
  { protocolo: "SNT-2026-002265", tipo: "Acidente", regiao: "Litoral", data: "20/08/2026", hora: "08:15", origem: "Outras fontes", status: "Encerrada", confiabilidade: 91 },
  { protocolo: "SNT-2026-002260", tipo: "Furto", regiao: "Sul", data: "19/08/2026", hora: "17:55", origem: "População", status: "Confirmada", confiabilidade: 74 },
];

export const predictions = [
  {
    regiao: "Região Centro",
    periodo: "26/08 a 01/09/2026",
    tipo: "Furto e roubo",
    nivel: "Alto" as const,
    confiabilidade: 78,
    fatores: ["Aumento de ocorrências recentes", "Concentração histórica", "Faixa das 19h às 23h"],
    gerada: "25/08/2026",
    validade: "01/09/2026",
  },
  {
    regiao: "Itapuã",
    periodo: "26/08 a 01/09/2026",
    tipo: "Dano ao patrimônio",
    nivel: "Médio" as const,
    confiabilidade: 61,
    fatores: ["Tendência de 3 meses", "Concentração em fins de semana"],
    gerada: "25/08/2026",
    validade: "01/09/2026",
  },
  {
    regiao: "Cajazeiras",
    periodo: "26/08 a 01/09/2026",
    tipo: "Furto",
    nivel: "Baixo" as const,
    confiabilidade: 54,
    fatores: ["Redução observada", "Baixo volume confirmado"],
    gerada: "25/08/2026",
    validade: "01/09/2026",
  },
];

export const explanationFactors = [
  { fator: "Aumento de ocorrências recentes", peso: 32 },
  { fator: "Concentração histórica na região", peso: 24 },
  { fator: "Horário de maior ocorrência (19h–23h)", peso: 18 },
  { fator: "Dia da semana (sexta e sábado)", peso: 13 },
  { fator: "Tendência dos últimos 3 meses", peso: 8 },
  { fator: "Registros confirmados por órgão", peso: 5 },
];

export const auditLog = [
  { data: "25/08/2026", hora: "14:12", usuario: "ag.silva@sspx.gov.br", acao: "Visualizou previsão da Região Centro", modulo: "Previsões", decisao: "—", justificativa: "Consulta operacional", resultado: "Registrado" },
  { data: "25/08/2026", hora: "11:48", usuario: "auditor.mendes", acao: "Previsão revisada por auditor", modulo: "Auditoria", decisao: "Mantida", justificativa: "Dados consistentes", resultado: "Concluído" },
  { data: "24/08/2026", hora: "18:03", usuario: "sistema", acao: "Contestação recebida", modulo: "Contestações", decisao: "Triagem", justificativa: "Solicitação do cidadão", resultado: "Pendente" },
  { data: "24/08/2026", hora: "09:27", usuario: "sistema", acao: "Decisão automatizada encaminhada para revisão humana", modulo: "Revisão", decisao: "Encaminhada", justificativa: "Impacto individual", resultado: "Em revisão" },
  { data: "23/08/2026", hora: "16:41", usuario: "ag.costa@sspx.gov.br", acao: "Confirmou ocorrência SNT-2026-002288", modulo: "Ocorrências", decisao: "Confirmada", justificativa: "Registro policial correspondente", resultado: "Concluído" },
];

export const biasRows = [
  { grupo: "Região Centro", previsoes: 128, acerto: 74, falsoPositivo: 18, confiab: 76 },
  { grupo: "Itapuã", previsoes: 96, acerto: 69, falsoPositivo: 23, confiab: 68 },
  { grupo: "Cajazeiras", previsoes: 74, acerto: 71, falsoPositivo: 17, confiab: 65 },
  { grupo: "Bairro Sul", previsoes: 58, acerto: 58, falsoPositivo: 29, confiab: 61 },
];

export const myOccurrences = [
  { protocolo: "SNT-2026-002291", tipo: "Furto", data: "24/08/2026", local: "Centro — proximidades", status: "Em análise", etapa: 1 },
  { protocolo: "SNT-2026-002104", tipo: "Dano", data: "02/08/2026", local: "Cajazeiras", status: "Confirmada", etapa: 2 },
  { protocolo: "SNT-2026-001877", tipo: "Ameaça", data: "14/07/2026", local: "Itapuã", status: "Encerrada", etapa: 4 },
];

export const notifications = [
  { tipo: "Ocorrência atualizada", texto: "SNT-2026-002291 passou para Em análise.", quando: "há 2 h", tone: "info" },
  { tipo: "Contestação atualizada", texto: "Sua contestação CT-2026-0143 entrou em triagem.", quando: "há 5 h", tone: "warning" },
  { tipo: "Revisão concluída", texto: "Revisão humana finalizada para CT-2026-0121.", quando: "ontem", tone: "success" },
  { tipo: "Alerta de segurança", texto: "Região Centro em nível de atenção alto nesta semana.", quando: "ontem", tone: "danger" },
  { tipo: "Relatório disponível", texto: "Relatório mensal de desempenho da IA publicado.", quando: "2 dias", tone: "neutral" },
  { tipo: "Previsão atualizada", texto: "Previsão de Itapuã recalculada (61% de confiabilidade).", quando: "3 dias", tone: "info" },
];
