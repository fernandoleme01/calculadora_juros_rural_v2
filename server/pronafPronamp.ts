/**
 * pronafPronamp.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo especializado para análise de contratos Pronaf e Pronamp.
 *
 * Base normativa:
 *   - MCR 7-6 (Pronaf): Encargos financeiros diferenciados por grupo/linha
 *   - MCR 7-4 (Pronamp): Encargos para médio produtor rural
 *   - Lei 11.326/2006: Política Nacional da Agricultura Familiar
 *   - Res. CMN 5.099/2022: Regulamenta o Pronaf
 *   - Res. CMN 5.234/2022: Regulamenta encargos do crédito rural
 *   - Atualização MCR nº 752, de 19 de janeiro de 2026
 *
 * Estrutura:
 *   1. Grupos Pronaf com critérios de enquadramento e taxas
 *   2. Linhas especiais do Pronaf (Mulher, Jovem, Agroecologia, etc.)
 *   3. Grupos Pronamp com critérios e taxas
 *   4. Funções de análise: enquadramento, comparativo e geração de laudo
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type GrupoPronaf =
  | "A"        // Assentados da reforma agrária / PNRA
  | "A/C"      // Assentados — crédito de custeio após grupo A
  | "B"        // Microcrédito produtivo rural
  | "C"        // Renda bruta anual até R$ 80.000
  | "D"        // Renda bruta anual até R$ 360.000
  | "E"        // Renda bruta anual até R$ 500.000
  | "V"        // Agricultores familiares em geral (sem enquadramento em A-E)
  | "Mulher"   // Linha Pronaf Mulher
  | "Jovem"    // Linha Pronaf Jovem Rural
  | "Agroecologia"  // Sistemas agroecológicos
  | "Floresta"      // Sistemas agroflorestais
  | "Semiarido"     // Convivência com o Semiárido
  | "Bioeconomia"   // Bioeconomia e sociobiodiversidade
  | "Custeio"       // Custeio geral (C/D/E/V)
  | "Investimento"; // Investimento geral (Mais Alimentos)

export type FinalidadeCredito = "custeio" | "investimento" | "comercializacao";

export interface GrupoPronafInfo {
  grupo: GrupoPronaf;
  nome: string;
  descricao: string;
  criteriosEnquadramento: string[];
  rendaBrutaMaximaAnual: number | null;  // R$ — null = sem limite de renda específico
  taxaCusteioAA: number | null;          // % a.a. para custeio
  taxaInvestimentoAA: number | null;     // % a.a. para investimento
  limiteFinanciamentoAnual?: number;     // R$ — limite por beneficiário/ano
  fundamentacaoMCR: string;
  resolucao: string;
  observacoes?: string;
}

export interface GrupoPronampInfo {
  nome: string;
  descricao: string;
  criteriosEnquadramento: string[];
  rendaBrutaMaximaAnual: number;         // R$ 2.400.000
  taxaCusteioAA: number;                 // 8,0% a.a.
  taxaInvestimentoAA: number;            // 8,5% a.a.
  limiteFinanciamentoAnual: number;      // R$ 430.000 por beneficiário/ano
  fundamentacaoMCR: string;
  resolucao: string;
  observacoes?: string;
}

export interface ResultadoComparativoPronaf {
  programa: "Pronaf" | "Pronamp";
  grupo: string;
  nomeGrupo: string;
  finalidade: FinalidadeCredito;
  taxaContratadaAA: number;
  taxaLimiteAA: number;
  diferencaPP: number;               // Diferença em pontos percentuais (positivo = excesso)
  excede: boolean;
  percentualExcesso: number;         // Excesso em % relativo à taxa limite
  excessoJurosEstimadoR?: number;    // Excesso em R$ (se principal e prazo informados)
  // Bônus de adimplência (Pronaf A e B)
  temBonusAdimplencia: boolean;       // Se o grupo tem direito ao bônus
  percentualBonus: number;            // Percentual do bônus (0 ou 25)
  taxaEfetivaComBonusAA?: number;     // Taxa efetiva após aplicação do bônus
  economiaBonusR?: number;            // Economia em R$ com o bônus (se principal e prazo informados)
  veredicto: "regular" | "excesso" | "nao_enquadrado";
  textoVeredicto: string;
  fundamentacaoLegal: string;
  textoLaudo: string;
  alertas: string[];
}

export interface DadosAnalise {
  taxaContratadaAA: number;
  finalidade: FinalidadeCredito;
  grupoPronaf?: GrupoPronaf;
  valorPrincipal?: number;
  prazoMeses?: number;
  dataContrato?: string;
  nomeBeneficiario?: string;
  nomeInstituicao?: string;
  numeroCedula?: string;
}

// ─── Dados dos Grupos Pronaf (MCR 7-6) ───────────────────────────────────────

export const GRUPOS_PRONAF: Record<string, GrupoPronafInfo> = {

  // ── Grupo A: Assentados da Reforma Agrária ────────────────────────────────
  A: {
    grupo: "A",
    nome: "Pronaf Grupo A — Assentados da Reforma Agrária",
    descricao: "Destinado a agricultores familiares assentados pelo Programa Nacional de Reforma Agrária (PNRA) ou beneficiários do Programa Nacional de Crédito Fundiário (PNCF) que ainda não contrataram o Pronaf A.",
    criteriosEnquadramento: [
      "Ser assentado do PNRA ou beneficiário do PNCF",
      "Não ter contratado o Pronaf A anteriormente",
      "Residir na propriedade ou em local próximo ao estabelecimento",
      "Possuir DAP/CAF ativa emitida por entidade credenciada",
    ],
    rendaBrutaMaximaAnual: null, // Sem limite de renda — critério é ser assentado
    taxaCusteioAA: null,         // Grupo A não tem custeio separado
    taxaInvestimentoAA: 1.5,
    limiteFinanciamentoAnual: 25000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 1",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Bônus de adimplência de 25% sobre os juros para pagamento em dia. Prazo máximo de 10 anos com até 3 anos de carência.",
  },

  // ── Grupo A/C: Assentados — custeio após grupo A ──────────────────────────
  "A/C": {
    grupo: "A/C",
    nome: "Pronaf Grupo A/C — Assentados (Custeio Subsequente)",
    descricao: "Destinado a agricultores assentados que já contrataram o Pronaf A e necessitam de crédito de custeio para a continuidade das atividades produtivas.",
    criteriosEnquadramento: [
      "Ter contratado o Pronaf A anteriormente",
      "Ser assentado do PNRA ou beneficiário do PNCF",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: null,
    taxaCusteioAA: 1.5,
    taxaInvestimentoAA: null,
    limiteFinanciamentoAnual: 7500,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 2",
    resolucao: "Res. CMN 5.099/2022",
  },

  // ── Grupo B: Microcrédito Produtivo Rural ─────────────────────────────────
  B: {
    grupo: "B",
    nome: "Pronaf Grupo B — Microcrédito Produtivo Rural",
    descricao: "Microcrédito destinado a agricultores familiares com menor renda, incluindo quilombolas, indígenas, pescadores artesanais e extrativistas. Taxa mais baixa do sistema de crédito rural.",
    criteriosEnquadramento: [
      "Renda bruta anual familiar de até R$ 20.000,00",
      "Residir e trabalhar no imóvel rural ou em comunidade rural",
      "Possuir DAP/CAF ativa",
      "Inclui quilombolas, indígenas, pescadores artesanais e extrativistas",
    ],
    rendaBrutaMaximaAnual: 20000,
    taxaCusteioAA: 0.5,
    taxaInvestimentoAA: 0.5,
    limiteFinanciamentoAnual: 5000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 13 (Microcrédito Produtivo Rural)",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Bônus de adimplência de 25% sobre os juros para pagamento em dia. Qualquer cobrança acima de 0,5% a.a. é ilegal para este grupo.",
  },

  // ── Grupo C: Pequenos agricultores familiares ─────────────────────────────
  C: {
    grupo: "C",
    nome: "Pronaf Grupo C",
    descricao: "Agricultores familiares com renda bruta anual de até R$ 80.000,00, excluídas as transferências governamentais.",
    criteriosEnquadramento: [
      "Renda bruta anual familiar de até R$ 80.000,00 (excluídas transferências governamentais)",
      "Explorar parcela de terra como proprietário, posseiro, arrendatário, parceiro ou concessionário do PNRA",
      "Residir na propriedade ou em local próximo",
      "Ter no mínimo 50% da renda familiar proveniente de atividades agropecuárias",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 80000,
    taxaCusteioAA: 4.0,
    taxaInvestimentoAA: 4.0,
    limiteFinanciamentoAnual: 20000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 4",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Redução de 0,5 p.p. para operações com boas práticas agropecuárias (MCR 3-2-6-A).",
  },

  // ── Grupo D ───────────────────────────────────────────────────────────────
  D: {
    grupo: "D",
    nome: "Pronaf Grupo D",
    descricao: "Agricultores familiares com renda bruta anual de até R$ 360.000,00, excluídas as transferências governamentais.",
    criteriosEnquadramento: [
      "Renda bruta anual familiar acima de R$ 80.000,00 e até R$ 360.000,00",
      "Explorar parcela de terra como proprietário, posseiro, arrendatário, parceiro ou concessionário",
      "Ter no mínimo 50% da renda familiar proveniente de atividades agropecuárias",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 360000,
    taxaCusteioAA: 5.0,
    taxaInvestimentoAA: 5.0,
    limiteFinanciamentoAnual: 80000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 4",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Redução de 0,5 p.p. para operações com boas práticas agropecuárias (MCR 3-2-6-A).",
  },

  // ── Grupo E ───────────────────────────────────────────────────────────────
  E: {
    grupo: "E",
    nome: "Pronaf Grupo E",
    descricao: "Agricultores familiares com renda bruta anual de até R$ 500.000,00, excluídas as transferências governamentais. Limite máximo do Pronaf.",
    criteriosEnquadramento: [
      "Renda bruta anual familiar acima de R$ 360.000,00 e até R$ 500.000,00",
      "Explorar parcela de terra como proprietário, posseiro, arrendatário, parceiro ou concessionário",
      "Ter no mínimo 50% da renda familiar proveniente de atividades agropecuárias",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 5.0,
    taxaInvestimentoAA: 5.0,
    limiteFinanciamentoAnual: 250000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 4",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Grupo com maior limite de financiamento no Pronaf. Redução de 0,5 p.p. para boas práticas agropecuárias.",
  },

  // ── Pronaf Mulher ─────────────────────────────────────────────────────────
  Mulher: {
    grupo: "Mulher",
    nome: "Pronaf Mulher",
    descricao: "Linha de crédito destinada exclusivamente a mulheres agricultoras familiares, para financiamento de atividades produtivas e de beneficiamento.",
    criteriosEnquadramento: [
      "Ser mulher agricultora familiar enquadrada nos critérios gerais do Pronaf",
      "Possuir DAP/CAF ativa em nome próprio",
      "Destinar o crédito a atividades produtivas de responsabilidade da beneficiária",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 5.0,
    taxaInvestimentoAA: 5.0,
    limiteFinanciamentoAnual: 80000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 6",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Linha com foco em autonomia econômica da mulher rural. Pode ser cumulativa com outras linhas do Pronaf.",
  },

  // ── Pronaf Jovem ──────────────────────────────────────────────────────────
  Jovem: {
    grupo: "Jovem",
    nome: "Pronaf Jovem Rural",
    descricao: "Linha de crédito destinada a jovens agricultores familiares entre 16 e 29 anos, para implantação ou ampliação de projetos produtivos.",
    criteriosEnquadramento: [
      "Ter entre 16 e 29 anos de idade",
      "Ser agricultor familiar enquadrado nos critérios gerais do Pronaf",
      "Possuir DAP/CAF ativa",
      "Ter concluído ou estar cursando ensino técnico agropecuário ou curso de gestão rural",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 5.0,
    taxaInvestimentoAA: 5.0,
    limiteFinanciamentoAnual: 15000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 10",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Linha com foco em sucessão rural e formação de novos agricultores familiares.",
  },

  // ── Pronaf Agroecologia ───────────────────────────────────────────────────
  Agroecologia: {
    grupo: "Agroecologia",
    nome: "Pronaf Agroecologia",
    descricao: "Linha de crédito para implantação ou manutenção de sistemas de produção agroecológicos ou orgânicos, incluindo a estruturação de unidades de beneficiamento.",
    criteriosEnquadramento: [
      "Ser agricultor familiar enquadrado nos critérios gerais do Pronaf",
      "Destinar o crédito a sistemas de produção agroecológicos ou orgânicos certificados",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 3.0,
    taxaInvestimentoAA: 3.0,
    limiteFinanciamentoAnual: 165000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 7",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Taxa diferenciada de 3% a.a. para incentivar a transição agroecológica. Exige certificação ou processo de certificação em andamento.",
  },

  // ── Pronaf Floresta ───────────────────────────────────────────────────────
  Floresta: {
    grupo: "Floresta",
    nome: "Pronaf Floresta — Sistemas Agroflorestais",
    descricao: "Linha de crédito para implantação e manutenção de sistemas agroflorestais, recuperação de reservas legais e áreas de preservação permanente.",
    criteriosEnquadramento: [
      "Ser agricultor familiar enquadrado nos critérios gerais do Pronaf",
      "Destinar o crédito a sistemas agroflorestais ou recuperação de áreas degradadas",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 3.0,
    taxaInvestimentoAA: 3.0,
    limiteFinanciamentoAnual: 35000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 8",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Taxa diferenciada de 3% a.a. para incentivo a práticas florestais e recuperação ambiental.",
  },

  // ── Pronaf Semiárido ──────────────────────────────────────────────────────
  Semiarido: {
    grupo: "Semiarido",
    nome: "Pronaf Semiárido — Convivência com o Semiárido",
    descricao: "Linha de crédito para implantação de projetos de convivência com o Semiárido, incluindo cisternas, barragens subterrâneas e outras tecnologias de captação e armazenamento de água.",
    criteriosEnquadramento: [
      "Ser agricultor familiar enquadrado nos critérios gerais do Pronaf",
      "Residir e produzir em municípios do Semiárido brasileiro",
      "Destinar o crédito a tecnologias de convivência com o Semiárido",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 3.0,
    taxaInvestimentoAA: 3.0,
    limiteFinanciamentoAnual: 18000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 14",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Taxa diferenciada de 3% a.a. para regiões do Semiárido. Inclui municípios do Polígono das Secas.",
  },

  // ── Pronaf Bioeconomia ────────────────────────────────────────────────────
  Bioeconomia: {
    grupo: "Bioeconomia",
    nome: "Pronaf Bioeconomia",
    descricao: "Linha de crédito para atividades produtivas baseadas na bioeconomia e sociobiodiversidade, incluindo extrativismo sustentável e produtos da sociobiodiversidade.",
    criteriosEnquadramento: [
      "Ser agricultor familiar, extrativista, quilombola ou indígena",
      "Destinar o crédito a atividades da bioeconomia ou sociobiodiversidade",
      "Possuir DAP/CAF ativa",
    ],
    rendaBrutaMaximaAnual: 500000,
    taxaCusteioAA: 3.0,
    taxaInvestimentoAA: 3.0,
    limiteFinanciamentoAnual: 50000,
    fundamentacaoMCR: "MCR 7-6, Tabela 1, item 15",
    resolucao: "Res. CMN 5.099/2022",
    observacoes: "Linha criada para valorizar a biodiversidade e os conhecimentos tradicionais.",
  },
};

// ─── Dados do Pronamp (MCR 7-4) ───────────────────────────────────────────────

export const PRONAMP_INFO: GrupoPronampInfo = {
  nome: "Pronamp — Programa Nacional de Apoio ao Médio Produtor Rural",
  descricao: "Programa destinado a médios produtores rurais com renda bruta anual de até R$ 2.400.000,00, oferecendo taxas de juros diferenciadas em relação ao crédito rural convencional.",
  criteriosEnquadramento: [
    "Renda bruta anual de até R$ 2.400.000,00 (excluídas transferências governamentais)",
    "Explorar imóvel rural como proprietário, posseiro, arrendatário ou parceiro",
    "Residir na propriedade ou em local próximo ao estabelecimento",
    "Ter no mínimo 80% da renda proveniente de atividades agropecuárias",
    "Não ser beneficiário do Pronaf (renda acima do limite do Pronaf)",
  ],
  rendaBrutaMaximaAnual: 2400000,
  taxaCusteioAA: 8.0,
  taxaInvestimentoAA: 8.5,
  limiteFinanciamentoAnual: 430000,
  fundamentacaoMCR: "MCR 7-4, Tabela 1",
  resolucao: "Res. CMN 5.234/2022",
  observacoes: "O Pronamp atende a faixa intermediária entre o Pronaf (agricultura familiar) e o crédito rural convencional. A renda bruta anual é calculada considerando o exercício anterior ao da solicitação.",
};

// ─── Tabela Comparativa Completa ──────────────────────────────────────────────

export interface LinhaComparativa {
  id: string;
  programa: "Pronaf" | "Pronamp" | "Convencional";
  grupo: string;
  nome: string;
  finalidade: "custeio" | "investimento" | "ambos";
  taxaAA: number | null;
  rendaMaxima: number | null;
  limiteAnual: number | null;
  fundamentacao: string;
  destaque?: string;
}

export const TABELA_COMPARATIVA: LinhaComparativa[] = [
  // Pronaf — ordem crescente de taxa
  { id: "pronaf_b",           programa: "Pronaf",      grupo: "B",           nome: "Pronaf B — Microcrédito",           finalidade: "ambos",       taxaAA: 0.5,  rendaMaxima: 20000,    limiteAnual: 5000,    fundamentacao: "MCR 7-6, item 13", destaque: "Menor taxa do sistema" },
  { id: "pronaf_a",           programa: "Pronaf",      grupo: "A",           nome: "Pronaf A — Assentados",             finalidade: "investimento", taxaAA: 1.5,  rendaMaxima: null,     limiteAnual: 25000,   fundamentacao: "MCR 7-6, item 1" },
  { id: "pronaf_ac",          programa: "Pronaf",      grupo: "A/C",         nome: "Pronaf A/C — Custeio Assentados",   finalidade: "custeio",     taxaAA: 1.5,  rendaMaxima: null,     limiteAnual: 7500,    fundamentacao: "MCR 7-6, item 2" },
  { id: "pronaf_agroecologia",programa: "Pronaf",      grupo: "Agroecologia",nome: "Pronaf Agroecologia",               finalidade: "ambos",       taxaAA: 3.0,  rendaMaxima: 500000,   limiteAnual: 165000,  fundamentacao: "MCR 7-6, item 7", destaque: "Sistemas orgânicos/agroecológicos" },
  { id: "pronaf_floresta",    programa: "Pronaf",      grupo: "Floresta",    nome: "Pronaf Floresta",                   finalidade: "ambos",       taxaAA: 3.0,  rendaMaxima: 500000,   limiteAnual: 35000,   fundamentacao: "MCR 7-6, item 8" },
  { id: "pronaf_semiarido",   programa: "Pronaf",      grupo: "Semiárido",   nome: "Pronaf Semiárido",                  finalidade: "ambos",       taxaAA: 3.0,  rendaMaxima: 500000,   limiteAnual: 18000,   fundamentacao: "MCR 7-6, item 14" },
  { id: "pronaf_bioeconomia", programa: "Pronaf",      grupo: "Bioeconomia", nome: "Pronaf Bioeconomia",                finalidade: "ambos",       taxaAA: 3.0,  rendaMaxima: 500000,   limiteAnual: 50000,   fundamentacao: "MCR 7-6, item 15" },
  { id: "pronaf_c",           programa: "Pronaf",      grupo: "C",           nome: "Pronaf C — Custeio/Investimento",   finalidade: "ambos",       taxaAA: 4.0,  rendaMaxima: 80000,    limiteAnual: 20000,   fundamentacao: "MCR 7-6, item 4" },
  { id: "pronaf_d",           programa: "Pronaf",      grupo: "D",           nome: "Pronaf D — Custeio/Investimento",   finalidade: "ambos",       taxaAA: 5.0,  rendaMaxima: 360000,   limiteAnual: 80000,   fundamentacao: "MCR 7-6, item 4" },
  { id: "pronaf_e",           programa: "Pronaf",      grupo: "E",           nome: "Pronaf E — Custeio/Investimento",   finalidade: "ambos",       taxaAA: 5.0,  rendaMaxima: 500000,   limiteAnual: 250000,  fundamentacao: "MCR 7-6, item 4" },
  { id: "pronaf_mulher",      programa: "Pronaf",      grupo: "Mulher",      nome: "Pronaf Mulher",                     finalidade: "ambos",       taxaAA: 5.0,  rendaMaxima: 500000,   limiteAnual: 80000,   fundamentacao: "MCR 7-6, item 6" },
  { id: "pronaf_jovem",       programa: "Pronaf",      grupo: "Jovem",       nome: "Pronaf Jovem Rural",                finalidade: "ambos",       taxaAA: 5.0,  rendaMaxima: 500000,   limiteAnual: 15000,   fundamentacao: "MCR 7-6, item 10" },
  // Pronamp
  { id: "pronamp_custeio",    programa: "Pronamp",     grupo: "Custeio",     nome: "Pronamp — Custeio",                 finalidade: "custeio",     taxaAA: 8.0,  rendaMaxima: 2400000,  limiteAnual: 430000,  fundamentacao: "MCR 7-4, Tabela 1, item 1.1-1" },
  { id: "pronamp_investimento",programa: "Pronamp",    grupo: "Investimento",nome: "Pronamp — Investimento",            finalidade: "investimento", taxaAA: 8.5,  rendaMaxima: 2400000,  limiteAnual: 430000,  fundamentacao: "MCR 7-4, Tabela 1, item 1.1-2" },
  // Convencional
  { id: "custeio_obrigatorio",programa: "Convencional",grupo: "Obrigatório", nome: "Custeio — Recursos Obrigatórios",  finalidade: "custeio",     taxaAA: 14.0, rendaMaxima: null,     limiteAnual: null,    fundamentacao: "MCR 7-1, Tabela 1, item 1.1-1" },
  { id: "investimento_sub",   programa: "Convencional",grupo: "Equalização", nome: "Investimento — Equalização",       finalidade: "investimento", taxaAA: 12.5, rendaMaxima: null,     limiteAnual: null,    fundamentacao: "MCR 7-1, Tabela 1, item 1.1-2" },
];

// ─── Funções de Análise ───────────────────────────────────────────────────────

/**
 * Calcula o comparativo entre a taxa contratada e o limite legal do Pronaf/Pronamp.
 * Retorna análise completa com veredicto pericial e texto para laudo.
 */
export function calcularComparativoPronaf(dados: DadosAnalise): ResultadoComparativoPronaf {
  const grupo = dados.grupoPronaf ?? "D";
  const grupoInfo = GRUPOS_PRONAF[grupo];

  if (!grupoInfo) {
    return {
      programa: "Pronaf",
      grupo,
      nomeGrupo: `Pronaf Grupo ${grupo}`,
      finalidade: dados.finalidade,
      taxaContratadaAA: dados.taxaContratadaAA,
      taxaLimiteAA: 5.0,
      diferencaPP: dados.taxaContratadaAA - 5.0,
      excede: dados.taxaContratadaAA > 5.0,
      percentualExcesso: 0,
      temBonusAdimplencia: false,
      percentualBonus: 0,
      veredicto: "nao_enquadrado",
      textoVeredicto: "Grupo Pronaf não identificado.",
      fundamentacaoLegal: "MCR 7-6; Res. CMN 5.099/2022",
      textoLaudo: "Grupo Pronaf não identificado. Verificar enquadramento.",
      alertas: ["Grupo Pronaf não reconhecido. Verificar DAP/CAF e enquadramento."],
    };
  }

  const taxaLimite = dados.finalidade === "custeio"
    ? (grupoInfo.taxaCusteioAA ?? grupoInfo.taxaInvestimentoAA ?? 5.0)
    : (grupoInfo.taxaInvestimentoAA ?? grupoInfo.taxaCusteioAA ?? 5.0);

  const diferenca = dados.taxaContratadaAA - taxaLimite;
  const excede = diferenca > 0.001; // tolerância de 0,001 p.p.
  const percentualExcesso = taxaLimite > 0 ? (diferenca / taxaLimite) * 100 : 0;

  // ── Bônus de adimplência (Pronaf A, A/C e B) ─────────────────────────────
  // MCR 7-6, Tabela 1: grupos A, A/C e B têm direito a bônus de 25% sobre os
  // encargos financeiros para pagamento em dia (adimplência).
  const GRUPOS_COM_BONUS: string[] = ["A", "A/C", "B"];
  const PERCENTUAL_BONUS = 25; // 25% de desconto sobre os juros

  const temBonusAdimplencia = GRUPOS_COM_BONUS.includes(grupo);
  const percentualBonus = temBonusAdimplencia ? PERCENTUAL_BONUS : 0;
  const taxaEfetivaComBonusAA = temBonusAdimplencia
    ? taxaLimite * (1 - PERCENTUAL_BONUS / 100)
    : undefined;

  // Calcular excesso em R$ e economia do bônus (Price simplificado)
  let excessoJurosEstimadoR: number | undefined;
  let economiaBonusR: number | undefined;

  const calcJuros = (taxaAA: number) => {
    if (!dados.valorPrincipal || !dados.prazoMeses || dados.prazoMeses <= 0) return 0;
    const im = Math.pow(1 + taxaAA / 100, 1 / 12) - 1;
    if (im === 0) return 0;
    const pmt = (dados.valorPrincipal * im * Math.pow(1 + im, dados.prazoMeses)) /
                (Math.pow(1 + im, dados.prazoMeses) - 1);
    return pmt * dados.prazoMeses - dados.valorPrincipal;
  };

  if (dados.valorPrincipal && dados.prazoMeses && dados.prazoMeses > 0) {
    if (excede) {
      excessoJurosEstimadoR = Math.max(0, calcJuros(dados.taxaContratadaAA) - calcJuros(taxaLimite));
    }
    if (temBonusAdimplencia && taxaEfetivaComBonusAA !== undefined) {
      // Economia = juros sem bônus - juros com bônus (calculado sobre a taxa limite)
      economiaBonusR = Math.max(0, calcJuros(taxaLimite) - calcJuros(taxaEfetivaComBonusAA));
    }
  }

  const alertas: string[] = [];

  if (excede) {
    alertas.push(
      `Taxa contratada (${dados.taxaContratadaAA.toFixed(2)}% a.a.) excede o limite do ${grupoInfo.nome} em ${diferenca.toFixed(2)} p.p.`
    );
    alertas.push(
      `Fundamentação para revisão: ${grupoInfo.fundamentacaoMCR} (${grupoInfo.resolucao})`
    );
    if (excessoJurosEstimadoR && excessoJurosEstimadoR > 0) {
      alertas.push(
        `Excesso estimado de juros: R$ ${excessoJurosEstimadoR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      );
    }
    alertas.push(
      "Cabível revisão judicial com devolução em dobro dos valores cobrados a maior (art. 42, parágrafo único, CDC)."
    );
  } else {
    alertas.push(
      `Taxa contratada dentro do limite legal para o ${grupoInfo.nome}.`
    );
  }

  if (grupoInfo.observacoes) {
    alertas.push(`Observação: ${grupoInfo.observacoes}`);
  }

  const textoVeredicto = excede
    ? `EXCESSO IDENTIFICADO: A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. excede em ${diferenca.toFixed(2)} pontos percentuais (${percentualExcesso.toFixed(1)}% acima) o limite legal de ${taxaLimite.toFixed(2)}% a.a. estabelecido para o ${grupoInfo.nome} pelo ${grupoInfo.fundamentacaoMCR} (${grupoInfo.resolucao}).`
    : `REGULAR: A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. está dentro do limite legal de ${taxaLimite.toFixed(2)}% a.a. para o ${grupoInfo.nome} (${grupoInfo.fundamentacaoMCR}).`;

  const textoLaudo = gerarTextoLaudoPronaf({
    grupoInfo,
    dados,
    taxaLimite,
    diferenca,
    excede,
    percentualExcesso,
    excessoJurosEstimadoR,
  });

  return {
    programa: "Pronaf",
    grupo,
    nomeGrupo: grupoInfo.nome,
    finalidade: dados.finalidade,
    taxaContratadaAA: dados.taxaContratadaAA,
    taxaLimiteAA: taxaLimite,
    diferencaPP: diferenca,
    excede,
    percentualExcesso,
    excessoJurosEstimadoR,
    temBonusAdimplencia,
    percentualBonus,
    taxaEfetivaComBonusAA,
    economiaBonusR,
    veredicto: excede ? "excesso" : "regular",
    textoVeredicto,
    fundamentacaoLegal: `${grupoInfo.fundamentacaoMCR}; ${grupoInfo.resolucao}; Lei 11.326/2006`,
    textoLaudo,
    alertas,
  };
}

/**
 * Calcula o comparativo para contratos Pronamp.
 */
export function calcularComparativoPronamp(dados: DadosAnalise): ResultadoComparativoPronaf {
  const taxaLimite = dados.finalidade === "custeio"
    ? PRONAMP_INFO.taxaCusteioAA
    : PRONAMP_INFO.taxaInvestimentoAA;

  const diferenca = dados.taxaContratadaAA - taxaLimite;
  const excede = diferenca > 0.001;
  const percentualExcesso = (diferenca / taxaLimite) * 100;

  let excessoJurosEstimadoR: number | undefined;
  if (dados.valorPrincipal && dados.prazoMeses && dados.prazoMeses > 0 && excede) {
    const calcJuros = (taxaAA: number) => {
      const im = Math.pow(1 + taxaAA / 100, 1 / 12) - 1;
      if (im === 0) return 0;
      const pmt = (dados.valorPrincipal! * im * Math.pow(1 + im, dados.prazoMeses!)) /
                  (Math.pow(1 + im, dados.prazoMeses!) - 1);
      return pmt * dados.prazoMeses! - dados.valorPrincipal!;
    };
    excessoJurosEstimadoR = Math.max(0, calcJuros(dados.taxaContratadaAA) - calcJuros(taxaLimite));
  }

  const alertas: string[] = [];
  if (excede) {
    alertas.push(`Taxa contratada (${dados.taxaContratadaAA.toFixed(2)}% a.a.) excede o limite Pronamp em ${diferenca.toFixed(2)} p.p.`);
    alertas.push(`Fundamentação: ${PRONAMP_INFO.fundamentacaoMCR} (${PRONAMP_INFO.resolucao})`);
    if (excessoJurosEstimadoR && excessoJurosEstimadoR > 0) {
      alertas.push(`Excesso estimado: R$ ${excessoJurosEstimadoR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    alertas.push("Cabível revisão judicial com devolução em dobro (art. 42, parágrafo único, CDC).");
  } else {
    alertas.push(`Taxa contratada dentro do limite legal para o Pronamp (${taxaLimite.toFixed(1)}% a.a.).`);
  }

  const textoVeredicto = excede
    ? `EXCESSO IDENTIFICADO: A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. excede em ${diferenca.toFixed(2)} p.p. o limite legal de ${taxaLimite.toFixed(2)}% a.a. para o Pronamp (${PRONAMP_INFO.fundamentacaoMCR}).`
    : `REGULAR: A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. está dentro do limite legal de ${taxaLimite.toFixed(2)}% a.a. para o Pronamp.`;

  const textoLaudo = `
ANÁLISE DE CONFORMIDADE — PRONAMP

Contrato analisado: ${dados.numeroCedula ?? "não informado"}
Beneficiário: ${dados.nomeBeneficiario ?? "não informado"}
Instituição financeira: ${dados.nomeInstituicao ?? "não informada"}
Finalidade: ${dados.finalidade === "custeio" ? "Custeio" : "Investimento"}
Data do contrato: ${dados.dataContrato ?? "não informada"}

ENQUADRAMENTO NORMATIVO:
O Programa Nacional de Apoio ao Médio Produtor Rural (Pronamp) é regulamentado pelo ${PRONAMP_INFO.fundamentacaoMCR} (${PRONAMP_INFO.resolucao}), destinado a produtores rurais com renda bruta anual de até R$ ${PRONAMP_INFO.rendaBrutaMaximaAnual.toLocaleString("pt-BR")}.

TAXA LIMITE LEGAL:
Para operações de ${dados.finalidade === "custeio" ? "custeio" : "investimento"} no âmbito do Pronamp, o encargo financeiro máximo é de ${taxaLimite.toFixed(1)}% a.a. (${PRONAMP_INFO.fundamentacaoMCR}).

TAXA CONTRATADA:
${dados.taxaContratadaAA.toFixed(4)}% a.a.

RESULTADO:
${excede
  ? `A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. EXCEDE em ${diferenca.toFixed(2)} pontos percentuais (${percentualExcesso.toFixed(1)}% acima) o limite legal de ${taxaLimite.toFixed(2)}% a.a. estabelecido para o Pronamp. ${excessoJurosEstimadoR ? `O excesso de juros estimado ao longo do contrato é de R$ ${excessoJurosEstimadoR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` : ""} A cobrança de encargos acima do limite legal é passível de revisão judicial com devolução em dobro dos valores cobrados a maior, nos termos do art. 42, parágrafo único, do Código de Defesa do Consumidor.`
  : `A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. está DENTRO do limite legal de ${taxaLimite.toFixed(2)}% a.a. para o Pronamp. Não foram identificados encargos financeiros abusivos neste contrato.`
}

FUNDAMENTAÇÃO LEGAL:
- ${PRONAMP_INFO.fundamentacaoMCR} (${PRONAMP_INFO.resolucao})
- Lei 11.326/2006 (Política Nacional da Agricultura Familiar)
- Decreto nº 22.626/33 (Lei de Usura) — parâmetro subsidiário
- STJ, REsp 1.061.530/RS (recurso repetitivo) — revisão de encargos abusivos
`.trim();

  return {
    programa: "Pronamp",
    grupo: dados.finalidade === "custeio" ? "Custeio" : "Investimento",
    nomeGrupo: `Pronamp — ${dados.finalidade === "custeio" ? "Custeio" : "Investimento"}`,
    finalidade: dados.finalidade,
    taxaContratadaAA: dados.taxaContratadaAA,
    taxaLimiteAA: taxaLimite,
    diferencaPP: diferenca,
    excede,
    percentualExcesso,
    excessoJurosEstimadoR,
    temBonusAdimplencia: false,  // Pronamp não tem bônus de adimplência
    percentualBonus: 0,
    veredicto: excede ? "excesso" : "regular",
    textoVeredicto,
    fundamentacaoLegal: `${PRONAMP_INFO.fundamentacaoMCR}; ${PRONAMP_INFO.resolucao}`,
    textoLaudo,
    alertas,
  };
}

// ─── Gerador de Texto de Laudo ────────────────────────────────────────────────

function gerarTextoLaudoPronaf(params: {
  grupoInfo: GrupoPronafInfo;
  dados: DadosAnalise;
  taxaLimite: number;
  diferenca: number;
  excede: boolean;
  percentualExcesso: number;
  excessoJurosEstimadoR?: number;
}): string {
  const { grupoInfo, dados, taxaLimite, diferenca, excede, percentualExcesso, excessoJurosEstimadoR } = params;

  return `
ANÁLISE DE CONFORMIDADE — PRONAF

Contrato analisado: ${dados.numeroCedula ?? "não informado"}
Beneficiário: ${dados.nomeBeneficiario ?? "não informado"}
Instituição financeira: ${dados.nomeInstituicao ?? "não informada"}
Programa: ${grupoInfo.nome}
Finalidade: ${dados.finalidade === "custeio" ? "Custeio" : "Investimento"}
Data do contrato: ${dados.dataContrato ?? "não informada"}

ENQUADRAMENTO NORMATIVO:
O Programa Nacional de Fortalecimento da Agricultura Familiar (Pronaf) é regulamentado pela Lei 11.326/2006 e pelas Resoluções do Conselho Monetário Nacional, com encargos financeiros definidos no ${grupoInfo.fundamentacaoMCR} (${grupoInfo.resolucao}).

CRITÉRIOS DE ENQUADRAMENTO DO ${grupoInfo.grupo.toUpperCase()}:
${grupoInfo.criteriosEnquadramento.map((c, i) => `${i + 1}. ${c}`).join("\n")}
${grupoInfo.rendaBrutaMaximaAnual ? `\nLimite de renda bruta anual: R$ ${grupoInfo.rendaBrutaMaximaAnual.toLocaleString("pt-BR")}` : ""}

TAXA LIMITE LEGAL:
Para operações de ${dados.finalidade === "custeio" ? "custeio" : "investimento"} no âmbito do ${grupoInfo.nome}, o encargo financeiro máximo é de ${taxaLimite.toFixed(1)}% a.a. (${grupoInfo.fundamentacaoMCR}).

TAXA CONTRATADA:
${dados.taxaContratadaAA.toFixed(4)}% a.a.

RESULTADO:
${excede
  ? `A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. EXCEDE em ${diferenca.toFixed(2)} pontos percentuais (${percentualExcesso.toFixed(1)}% acima) o limite legal de ${taxaLimite.toFixed(2)}% a.a. estabelecido para o ${grupoInfo.nome}. ${excessoJurosEstimadoR ? `O excesso de juros estimado ao longo do contrato é de R$ ${excessoJurosEstimadoR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` : ""} A cobrança de encargos acima do limite legal é passível de revisão judicial com devolução em dobro dos valores cobrados a maior, nos termos do art. 42, parágrafo único, do Código de Defesa do Consumidor.`
  : `A taxa contratada de ${dados.taxaContratadaAA.toFixed(2)}% a.a. está DENTRO do limite legal de ${taxaLimite.toFixed(2)}% a.a. para o ${grupoInfo.nome}. Não foram identificados encargos financeiros abusivos neste contrato.`
}

FUNDAMENTAÇÃO LEGAL:
- ${grupoInfo.fundamentacaoMCR} (${grupoInfo.resolucao})
- Lei 11.326/2006 (Política Nacional da Agricultura Familiar)
- Decreto nº 22.626/33 (Lei de Usura) — parâmetro subsidiário
- STJ, REsp 1.061.530/RS (recurso repetitivo) — revisão de encargos abusivos
${grupoInfo.observacoes ? `\nOBSERVAÇÕES ADICIONAIS:\n${grupoInfo.observacoes}` : ""}
`.trim();
}

/**
 * Sugere o enquadramento mais adequado com base na renda bruta anual informada.
 */
export function sugerirEnquadramento(rendaBrutaAnual: number): {
  programa: "Pronaf" | "Pronamp" | "Convencional";
  grupo?: string;
  nome: string;
  taxaCusteioAA: number | null;
  taxaInvestimentoAA: number | null;
  observacao: string;
} {
  if (rendaBrutaAnual <= 20000) {
    return {
      programa: "Pronaf", grupo: "B",
      nome: "Pronaf Grupo B (Microcrédito)",
      taxaCusteioAA: 0.5, taxaInvestimentoAA: 0.5,
      observacao: "Menor taxa do sistema. Verificar se o beneficiário possui DAP/CAF ativa.",
    };
  }
  if (rendaBrutaAnual <= 80000) {
    return {
      programa: "Pronaf", grupo: "C",
      nome: "Pronaf Grupo C",
      taxaCusteioAA: 4.0, taxaInvestimentoAA: 4.0,
      observacao: "Verificar se pelo menos 50% da renda é proveniente de atividades agropecuárias.",
    };
  }
  if (rendaBrutaAnual <= 360000) {
    return {
      programa: "Pronaf", grupo: "D",
      nome: "Pronaf Grupo D",
      taxaCusteioAA: 5.0, taxaInvestimentoAA: 5.0,
      observacao: "Verificar se pelo menos 50% da renda é proveniente de atividades agropecuárias.",
    };
  }
  if (rendaBrutaAnual <= 500000) {
    return {
      programa: "Pronaf", grupo: "E",
      nome: "Pronaf Grupo E",
      taxaCusteioAA: 5.0, taxaInvestimentoAA: 5.0,
      observacao: "Limite máximo do Pronaf. Verificar enquadramento completo.",
    };
  }
  if (rendaBrutaAnual <= 2400000) {
    return {
      programa: "Pronamp",
      nome: "Pronamp (Médio Produtor Rural)",
      taxaCusteioAA: 8.0, taxaInvestimentoAA: 8.5,
      observacao: "Verificar se pelo menos 80% da renda é proveniente de atividades agropecuárias.",
    };
  }
  return {
    programa: "Convencional",
    nome: "Crédito Rural Convencional",
    taxaCusteioAA: 14.0, taxaInvestimentoAA: 12.5,
    observacao: "Renda acima do limite do Pronamp. Aplicam-se as taxas do MCR 7-1.",
  };
}
