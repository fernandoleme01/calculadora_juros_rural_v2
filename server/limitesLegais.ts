/**
 * limitesLegais.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tabela de encargos financeiros máximos por modalidade de crédito rural,
 * conforme o Manual de Crédito Rural (MCR) do Banco Central do Brasil.
 *
 * Base normativa principal:
 *   - MCR 7-1, Tabela 1: Encargos Financeiros para Financiamentos sem
 *     Vinculação a Programa Específico (Res. CMN 5.234, art. 2º)
 *   - MCR 7-6, Tabela 1: Encargos Financeiros para o Pronaf
 *   - MCR 7-4, Tabela 1: Encargos Financeiros para o Pronamp
 *   - Decreto nº 22.626/33 (Lei de Usura): limite geral de 12% a.a.
 *   - STJ: REsp 1.061.530/RS (repetitivo) — revisão de encargos abusivos
 *
 * Atualização: MCR nº 752, de 19 de janeiro de 2026
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ModalidadeCredito =
  | "custeio_obrigatorio"       // Custeio com recursos obrigatórios (MCR 6-2)
  | "custeio_livre"             // Custeio com recursos livres / não controlados
  | "investimento_subvencionado" // Investimento subvencionado pela União (equalização)
  | "investimento_livre"        // Investimento com recursos livres
  | "comercializacao"           // Crédito de comercialização
  | "industrializacao"          // Crédito de industrialização
  | "pronaf_b"                  // Pronaf Grupo B (microcrédito)
  | "pronaf_custeio"            // Pronaf custeio (grupos C, D, E, V)
  | "pronaf_investimento"       // Pronaf investimento (Mais Alimentos, etc.)
  | "pronaf_agroecologia"       // Pronaf Agroecologia
  | "pronamp_custeio"           // Pronamp custeio
  | "pronamp_investimento"      // Pronamp investimento
  | "nao_controlado";           // Recursos não controlados (livre pactuação)

export type FonteRecurso =
  | "obrigatorio"     // Recursos obrigatórios (MCR 6-2)
  | "poupanca_rural"  // Poupança rural (MCR 6-4)
  | "livre"           // Recursos livres
  | "pronaf"          // Recursos do Pronaf
  | "pronamp"         // Recursos do Pronamp
  | "nao_controlado"; // Recursos não controlados

export interface LimiteLegal {
  modalidade: ModalidadeCredito;
  taxaMaximaPrefixada: number | null;   // % a.a. — null = livre pactuação
  taxaMaximaPosFixada?: string | null;  // Descrição da taxa pós-fixada (ex: "5,69% + FAM")
  programa?: string;                    // Nome do programa (ex: "Pronaf", "Pronamp")
  fundamentacao: FundamentacaoLimite;
  observacoes?: string;
}

export interface FundamentacaoLimite {
  mcrSecao: string;         // Ex: "MCR 7-1, Tabela 1, item 1"
  resolucao: string;        // Ex: "Res. CMN 5.234, art. 2º"
  atualizacaoMCR: string;   // Ex: "Atualização MCR nº 752, de 19/01/2026"
  descricao: string;        // Descrição textual para uso nos laudos
}

// ─── Tabela de Limites Legais ─────────────────────────────────────────────────

export const LIMITES_LEGAIS: Record<ModalidadeCredito, LimiteLegal> = {

  // ── MCR 7-1, Tabela 1, item 1 ─────────────────────────────────────────────
  custeio_obrigatorio: {
    modalidade: "custeio_obrigatorio",
    taxaMaximaPrefixada: 14.0,
    taxaMaximaPosFixada: null,
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-1",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Custeio (MCR 3-2), Créditos de Comercialização (MCR 3-4) e Créditos de Industrialização (MCR 3-5), com Recursos Obrigatórios (MCR 6-2) ou quando subvencionados pela União sob a forma de equalização de encargos financeiros. Taxa efetiva de juros de até 14,0% a.a.",
    },
    observacoes: "Aplica-se o disposto no MCR 3-2-6-A aos créditos de custeio contratados com Recursos Obrigatórios.",
  },

  // ── MCR 7-1, Tabela 1, item 2 ─────────────────────────────────────────────
  investimento_subvencionado: {
    modalidade: "investimento_subvencionado",
    taxaMaximaPrefixada: 12.5,
    taxaMaximaPosFixada: "5,69% + FAM",
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-2",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Investimento (MCR 3-3), quando subvencionados pela União sob a forma de equalização de encargos financeiros — investimento empresarial. Taxa efetiva de juros de até 12,5% a.a. (prefixada) ou 5,69% + FAM (pós-fixada). A taxa pós-fixada não se aplica a financiamentos com recursos da Poupança Rural (MCR 6-4).",
    },
  },

  // ── MCR 7-1, Tabela 1, item 4 ─────────────────────────────────────────────
  nao_controlado: {
    modalidade: "nao_controlado",
    taxaMaximaPrefixada: null,
    taxaMaximaPosFixada: null,
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-4",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Todas as finalidades, em operações de crédito rural com recursos não controlados. Encargos financeiros livremente pactuados entre as partes. No caso de recursos da Poupança Rural, deve-se tomar por base a remuneração básica dos depósitos de poupança acrescida de taxa efetiva de juros, ou taxa efetiva de juros prefixada.",
    },
    observacoes: "Embora os encargos sejam de livre pactuação, o STJ aplica o limite do Decreto nº 22.626/33 (Lei de Usura — 12% a.a.) nas revisões judiciais de contratos rurais. Ver REsp 1.061.530/RS (repetitivo).",
  },

  // ── Custeio com recursos livres ───────────────────────────────────────────
  custeio_livre: {
    modalidade: "custeio_livre",
    taxaMaximaPrefixada: null, // Livre, mas STJ aplica 12% a.a. na revisão
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-4",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Crédito de custeio com recursos não controlados. Encargos livremente pactuados. Para fins de revisão judicial, o STJ aplica o limite de 12% a.a. (Decreto nº 22.626/33) como parâmetro de abusividade.",
    },
    observacoes: "Para fins de revisão judicial, usar 12% a.a. como taxa de comparação (Lei de Usura + STJ REsp 1.061.530/RS).",
  },

  // ── Investimento com recursos livres ──────────────────────────────────────
  investimento_livre: {
    modalidade: "investimento_livre",
    taxaMaximaPrefixada: null,
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-4",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Crédito de investimento com recursos não controlados. Encargos livremente pactuados. Para fins de revisão judicial, o STJ aplica o limite de 12% a.a. como parâmetro.",
    },
  },

  // ── Comercialização ───────────────────────────────────────────────────────
  comercializacao: {
    modalidade: "comercializacao",
    taxaMaximaPrefixada: 14.0,
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-1",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Comercialização (MCR 3-4), inclusive FEE (MCR 3-4-11), com Recursos Obrigatórios (MCR 6-2) ou quando subvencionados pela União. Taxa efetiva de juros de até 14,0% a.a.",
    },
  },

  // ── Industrialização ──────────────────────────────────────────────────────
  industrializacao: {
    modalidade: "industrializacao",
    taxaMaximaPrefixada: 14.0,
    fundamentacao: {
      mcrSecao: "MCR 7-1, Tabela 1, item 1.1-1",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Industrialização (MCR 3-5) com Recursos Obrigatórios (MCR 6-2) ou quando subvencionados pela União. Taxa efetiva de juros de até 14,0% a.a.",
    },
  },

  // ── Pronaf Grupo B (Microcrédito) ─────────────────────────────────────────
  pronaf_b: {
    modalidade: "pronaf_b",
    taxaMaximaPrefixada: 0.5,
    programa: "Pronaf Grupo B",
    fundamentacao: {
      mcrSecao: "MCR 7-6, Tabela 1, item 13 (Microcrédito Produtivo Rural — Grupo B)",
      resolucao: "Res. CMN 5.099 e Res. CMN 5.234",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Microcrédito Produtivo Rural (Pronaf Grupo B). Taxa efetiva de juros de 0,5% a.a. Destinado a agricultores familiares com renda bruta anual familiar de até R$ 20.000,00.",
    },
    observacoes: "Taxa mais baixa do sistema de crédito rural. Qualquer cobrança acima de 0,5% a.a. é ilegal para contratos Pronaf Grupo B.",
  },

  // ── Pronaf Custeio ────────────────────────────────────────────────────────
  pronaf_custeio: {
    modalidade: "pronaf_custeio",
    taxaMaximaPrefixada: 5.0,
    programa: "Pronaf Custeio",
    fundamentacao: {
      mcrSecao: "MCR 7-6, Tabela 1, item 4 (Créditos de Custeio)",
      resolucao: "Res. CMN 5.099 e Res. CMN 5.234",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Custeio do Pronaf para beneficiários dos grupos C, D, E e V. Taxa efetiva de juros de até 5% a.a. (podendo ser menor conforme o grupo e o enquadramento).",
    },
    observacoes: "A taxa pode ser reduzida em 0,5 p.p. para operações com boas práticas agropecuárias (MCR 3-2-6-A). Verificar o enquadramento exato do beneficiário.",
  },

  // ── Pronaf Investimento ───────────────────────────────────────────────────
  pronaf_investimento: {
    modalidade: "pronaf_investimento",
    taxaMaximaPrefixada: 5.0,
    programa: "Pronaf Investimento (Mais Alimentos)",
    fundamentacao: {
      mcrSecao: "MCR 7-6, Tabela 1, item 5 (Créditos de Investimento — Mais Alimentos)",
      resolucao: "Res. CMN 5.099 e Res. CMN 5.234",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Investimento do Pronaf (Mais Alimentos). Taxa efetiva de juros de até 5% a.a. para a maioria dos beneficiários. Pode ser de 3% a.a. para investimentos em agroecologia, sistemas agroflorestais e semiárido.",
    },
  },

  // ── Pronaf Agroecologia ───────────────────────────────────────────────────
  pronaf_agroecologia: {
    modalidade: "pronaf_agroecologia",
    taxaMaximaPrefixada: 3.0,
    programa: "Pronaf Agroecologia / Floresta / Semiárido",
    fundamentacao: {
      mcrSecao: "MCR 7-6, Tabela 1, itens 7, 8 e 14",
      resolucao: "Res. CMN 5.099 e Res. CMN 5.234",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Investimento para Sistemas Agroflorestais (Pronaf Floresta), Adaptação às Mudanças Climáticas e Convivência com o Semiárido (Pronaf Semiárido) e Agroecologia (Pronaf Agroecologia). Taxa efetiva de juros de até 3% a.a.",
    },
  },

  // ── Pronamp Custeio ───────────────────────────────────────────────────────
  pronamp_custeio: {
    modalidade: "pronamp_custeio",
    taxaMaximaPrefixada: 8.0,
    programa: "Pronamp (Médio Produtor Rural)",
    fundamentacao: {
      mcrSecao: "MCR 7-4, Tabela 1, item 1.1-1 (Créditos de Custeio)",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Custeio do Programa Nacional de Apoio ao Médio Produtor Rural (Pronamp). Taxa efetiva de juros de até 8% a.a. Destinado a produtores rurais com renda bruta anual de até R$ 2.400.000,00.",
    },
  },

  // ── Pronamp Investimento ──────────────────────────────────────────────────
  pronamp_investimento: {
    modalidade: "pronamp_investimento",
    taxaMaximaPrefixada: 8.5,
    programa: "Pronamp (Médio Produtor Rural) — Investimento",
    fundamentacao: {
      mcrSecao: "MCR 7-4, Tabela 1, item 1.1-2 (Créditos de Investimento)",
      resolucao: "Res. CMN 5.234, art. 2º",
      atualizacaoMCR: "Atualização MCR nº 752, de 19/01/2026",
      descricao: "Créditos de Investimento do Programa Nacional de Apoio ao Médio Produtor Rural (Pronamp). Taxa efetiva de juros de até 8,5% a.a.",
    },
  },
};

// ─── Taxa de comparação para revisão judicial ─────────────────────────────────

/**
 * Taxa de referência para revisão judicial quando a modalidade usa recursos
 * não controlados (livre pactuação). O STJ aplica o limite do Decreto nº
 * 22.626/33 (Lei de Usura) como parâmetro de abusividade.
 *
 * Fundamentação: STJ — REsp 1.061.530/RS (repetitivo); AgRg no REsp 1.370.585/RS
 */
export const TAXA_REVISAO_JUDICIAL = 12.0; // % a.a.

// ─── Funções auxiliares ───────────────────────────────────────────────────────

/**
 * Retorna o limite legal para uma modalidade específica.
 * Se a modalidade usa recursos não controlados (livre pactuação),
 * retorna a taxa de revisão judicial (12% a.a.) como referência.
 */
export function getTaxaLimite(modalidade: ModalidadeCredito): {
  taxa: number;
  ehLivrePactuacao: boolean;
  limite: LimiteLegal;
} {
  const limite = LIMITES_LEGAIS[modalidade];
  const ehLivrePactuacao = limite.taxaMaximaPrefixada === null;
  const taxa = ehLivrePactuacao ? TAXA_REVISAO_JUDICIAL : limite.taxaMaximaPrefixada!;
  return { taxa, ehLivrePactuacao, limite };
}

/**
 * Verifica se uma taxa contratada excede o limite legal para a modalidade.
 * Retorna o excesso em pontos percentuais e a fundamentação.
 */
export function verificarExcessoTaxa(
  taxaContratada: number,
  modalidade: ModalidadeCredito
): {
  excede: boolean;
  excessoPontos: number;
  taxaLimite: number;
  ehLivrePactuacao: boolean;
  fundamentacao: FundamentacaoLimite;
  textoLaudo: string;
} {
  const { taxa, ehLivrePactuacao, limite } = getTaxaLimite(modalidade);
  const excede = taxaContratada > taxa;
  const excessoPontos = Math.max(0, taxaContratada - taxa);

  let textoLaudo: string;
  if (!excede) {
    textoLaudo = `A taxa de juros contratada de ${taxaContratada.toFixed(2)}% a.a. está dentro do limite legal de ${taxa.toFixed(2)}% a.a. estabelecido pelo ${limite.fundamentacao.mcrSecao} (${limite.fundamentacao.resolucao}).`;
  } else if (ehLivrePactuacao) {
    textoLaudo = `A taxa de juros contratada de ${taxaContratada.toFixed(2)}% a.a. excede em ${excessoPontos.toFixed(2)} pontos percentuais o limite de ${taxa.toFixed(2)}% a.a. aplicado pelo STJ como parâmetro de abusividade para contratos de crédito rural com recursos não controlados, nos termos do Decreto nº 22.626/33 (Lei de Usura) e do entendimento consolidado no REsp 1.061.530/RS (recurso repetitivo). Embora o ${limite.fundamentacao.mcrSecao} (${limite.fundamentacao.resolucao}) permita a livre pactuação dos encargos financeiros nesta modalidade, o Poder Judiciário tem sistematicamente aplicado o limite de 12% a.a. como parâmetro de revisão contratual.`;
  } else {
    textoLaudo = `A taxa de juros contratada de ${taxaContratada.toFixed(2)}% a.a. excede em ${excessoPontos.toFixed(2)} pontos percentuais o limite legal de ${taxa.toFixed(2)}% a.a. estabelecido pelo ${limite.fundamentacao.mcrSecao} (${limite.fundamentacao.resolucao}, ${limite.fundamentacao.atualizacaoMCR}). A cobrança de encargos acima deste limite é ilegal e passível de revisão judicial com devolução em dobro dos valores cobrados a maior (art. 42, parágrafo único, do CDC).`;
  }

  return {
    excede,
    excessoPontos,
    taxaLimite: taxa,
    ehLivrePactuacao,
    fundamentacao: limite.fundamentacao,
    textoLaudo,
  };
}

/**
 * Retorna o texto de fundamentação completo para uso em laudos e petições,
 * descrevendo os limites legais aplicáveis à modalidade.
 */
export function getFundamentacaoLimite(modalidade: ModalidadeCredito): string {
  const limite = LIMITES_LEGAIS[modalidade];
  const taxa = limite.taxaMaximaPrefixada;

  if (taxa === null) {
    return `Para a modalidade "${modalidade}", o ${limite.fundamentacao.mcrSecao} (${limite.fundamentacao.resolucao}) permite a livre pactuação dos encargos financeiros. Contudo, o Superior Tribunal de Justiça, em sede de recurso repetitivo (REsp 1.061.530/RS), consolidou o entendimento de que o limite de 12% a.a. previsto no Decreto nº 22.626/33 (Lei de Usura) serve como parâmetro de abusividade para revisão judicial de contratos de crédito rural.`;
  }

  return `Para a modalidade "${limite.fundamentacao.descricao}", o ${limite.fundamentacao.mcrSecao} (${limite.fundamentacao.resolucao}, ${limite.fundamentacao.atualizacaoMCR}) estabelece taxa efetiva de juros de até ${taxa.toFixed(1)}% a.a. como encargo financeiro máximo.${limite.observacoes ? " " + limite.observacoes : ""}`;
}

// ─── Tabela LINHAS (PeríciaCR) ───────────────────────────────────────────────
/**
 * Tabela de linhas de crédito rural com taxas-limite do MCR, no formato
 * compatível com o comparativo automático (inspirado no PeríciaCR).
 * Inclui programas federais, fundos constitucionais e recursos livres.
 */
export interface LinhaCredito {
  id: string;
  label: string;
  grupo: "pronaf" | "pronamp" | "moderacao" | "fundos" | "livre";
  taxaLimiteAA: number | null;   // % a.a. — null = livre pactuação
  fundamentacao: string;          // Referência MCR/Resolução
  observacoes?: string;
}

export const LINHAS_CREDITO: LinhaCredito[] = [
  // ── Pronaf ──────────────────────────────────────────────────────────────────
  { id: "pronaf_b",           label: "Pronaf – Grupo B (Microcrédito)",          grupo: "pronaf",    taxaLimiteAA: 0.5,  fundamentacao: "MCR 7-6, item 13; Res. CMN 5.099" },
  { id: "pronaf_a",           label: "Pronaf – Grupo A (Assentados)",            grupo: "pronaf",    taxaLimiteAA: 1.5,  fundamentacao: "MCR 7-6, item 1; Res. CMN 5.099" },
  { id: "pronaf_custeio",     label: "Pronaf – Custeio (Grupos C/D/E/V)",        grupo: "pronaf",    taxaLimiteAA: 5.0,  fundamentacao: "MCR 7-6, item 4; Res. CMN 5.099" },
  { id: "pronaf_agroecologia",label: "Pronaf – Agroecologia / Floresta / Semiárido", grupo: "pronaf", taxaLimiteAA: 3.0, fundamentacao: "MCR 7-6, itens 7, 8 e 14; Res. CMN 5.099" },
  { id: "pronaf_investimento",label: "Pronaf – Investimento (Mais Alimentos)",   grupo: "pronaf",    taxaLimiteAA: 5.0,  fundamentacao: "MCR 7-6, item 5; Res. CMN 5.099" },
  { id: "pronaf_mulher",      label: "Pronaf – Mulher",                           grupo: "pronaf",    taxaLimiteAA: 5.0,  fundamentacao: "MCR 7-6, item 6; Res. CMN 5.099" },
  { id: "pronaf_jovem",       label: "Pronaf – Jovem Rural",                      grupo: "pronaf",    taxaLimiteAA: 5.0,  fundamentacao: "MCR 7-6, item 10; Res. CMN 5.099" },
  // ── Pronamp ─────────────────────────────────────────────────────────────────
  { id: "pronamp_custeio",    label: "Pronamp – Custeio (Médio Produtor)",       grupo: "pronamp",   taxaLimiteAA: 8.0,  fundamentacao: "MCR 7-4, Tabela 1, item 1.1-1; Res. CMN 5.234" },
  { id: "pronamp_investimento",label: "Pronamp – Investimento (Médio Produtor)", grupo: "pronamp",   taxaLimiteAA: 8.5,  fundamentacao: "MCR 7-4, Tabela 1, item 1.1-2; Res. CMN 5.234" },
  // ── Moderação / Programas federais ──────────────────────────────────────────
  { id: "moderfrota",         label: "Moderfrota (máquinas e equipamentos)",     grupo: "moderacao", taxaLimiteAA: 9.5,  fundamentacao: "MCR 7-1, Tabela 1; Res. CMN 5.234" },
  { id: "moderagro",          label: "Moderagro (defesa agropecuária)",           grupo: "moderacao", taxaLimiteAA: 9.75, fundamentacao: "MCR 7-1, Tabela 1; Res. CMN 5.234" },
  { id: "inovagro",           label: "Inovagro (inovação tecnológica)",           grupo: "moderacao", taxaLimiteAA: 8.0,  fundamentacao: "MCR 7-1, Tabela 1; Res. CMN 5.234" },
  { id: "pca",                label: "PCA – Construção / Reforma",                grupo: "moderacao", taxaLimiteAA: 8.0,  fundamentacao: "MCR 7-1, Tabela 1; Res. CMN 5.234" },
  { id: "custeio_obrigatorio",label: "Custeio – Recursos Obrigatórios",          grupo: "moderacao", taxaLimiteAA: 14.0, fundamentacao: "MCR 7-1, Tabela 1, item 1.1-1; Res. CMN 5.234" },
  { id: "investimento_subvencionado", label: "Investimento – Subvencionado (equalização)", grupo: "moderacao", taxaLimiteAA: 12.5, fundamentacao: "MCR 7-1, Tabela 1, item 1.1-2; Res. CMN 5.234" },
  // ── Fundos Constitucionais ───────────────────────────────────────────────────
  { id: "fco",                label: "FCO Rural (Centro-Oeste)",                  grupo: "fundos",    taxaLimiteAA: 7.0,  fundamentacao: "Lei 7.827/1989; Res. CMN 5.234" },
  { id: "fne",                label: "FNE Rural (Nordeste)",                      grupo: "fundos",    taxaLimiteAA: 7.0,  fundamentacao: "Lei 7.827/1989; Res. CMN 5.234" },
  { id: "fno",                label: "FNO Rural (Norte)",                         grupo: "fundos",    taxaLimiteAA: 7.0,  fundamentacao: "Lei 7.827/1989; Res. CMN 5.234" },
  // ── Recursos Livres ──────────────────────────────────────────────────────────
  { id: "livre",              label: "Recursos Livres (livre pactuação)",         grupo: "livre",     taxaLimiteAA: null, fundamentacao: "MCR 7-1, Tabela 1, item 1.1-4; Res. CMN 5.234", observacoes: "STJ aplica 12% a.a. como parâmetro de abusividade (REsp 1.061.530/RS)" },
];

/**
 * Retorna uma linha de crédito pelo ID.
 */
export function getLinhaCreditoPorId(id: string): LinhaCredito | undefined {
  return LINHAS_CREDITO.find(l => l.id === id);
}

/**
 * Calcula o comparativo de taxas: taxa contratada vs. taxa-limite da linha.
 * Retorna o veredicto pericial e o excesso de juros em R$ (se informado o principal e prazo).
 */
export function calcularComparativoMCR(params: {
  taxaContratadaAA: number;
  linhaId: string;
  valorPrincipal?: number;
  prazoMeses?: number;
  sistema?: "price" | "sac";
}): {
  linha: LinhaCredito | null;
  taxaLimite: number | null;
  taxaContratada: number;
  diferencaPP: number | null;     // Diferença em pontos percentuais
  excede: boolean;
  excessoJurosTotal: number | null; // Excesso de juros em R$ (se principal e prazo informados)
  veredicto: "regular" | "excesso" | "livre_pactuacao";
  textoVeredicto: string;
  fundamentacao: string;
} {
  const linha = getLinhaCreditoPorId(params.linhaId);
  if (!linha) {
    return {
      linha: null, taxaLimite: null, taxaContratada: params.taxaContratadaAA,
      diferencaPP: null, excede: false, excessoJurosTotal: null,
      veredicto: "livre_pactuacao",
      textoVeredicto: "Linha de crédito não identificada.",
      fundamentacao: "",
    };
  }

  const taxaLimiteEfetiva = linha.taxaLimiteAA ?? TAXA_REVISAO_JUDICIAL;
  const ehLivre = linha.taxaLimiteAA === null;
  const diferenca = params.taxaContratadaAA - taxaLimiteEfetiva;
  const excede = diferenca > 0;

  // Calcular excesso de juros em R$ (Price simplificado)
  let excessoJurosTotal: number | null = null;
  if (params.valorPrincipal && params.prazoMeses && params.prazoMeses > 0) {
    const calcJurosTotal = (taxa: number) => {
      const im = Math.pow(1 + taxa / 100, 1 / 12) - 1;
      if (im === 0) return 0;
      const pmt = (params.valorPrincipal! * im * Math.pow(1 + im, params.prazoMeses!)) /
                  (Math.pow(1 + im, params.prazoMeses!) - 1);
      return pmt * params.prazoMeses! - params.valorPrincipal!;
    };
    const jurosContratado = calcJurosTotal(params.taxaContratadaAA);
    const jurosLimite = calcJurosTotal(taxaLimiteEfetiva);
    excessoJurosTotal = excede ? Math.max(0, jurosContratado - jurosLimite) : 0;
  }

  const veredicto = ehLivre ? "livre_pactuacao" : excede ? "excesso" : "regular";

  const textoVeredicto = !excede
    ? `A taxa contratada de ${params.taxaContratadaAA.toFixed(2)}% a.a. está dentro do limite de ${taxaLimiteEfetiva.toFixed(2)}% a.a. estabelecido para a linha ${linha.label} (${linha.fundamentacao}).`
    : ehLivre
    ? `A taxa contratada de ${params.taxaContratadaAA.toFixed(2)}% a.a. excede em ${diferenca.toFixed(2)} p.p. o limite de ${taxaLimiteEfetiva.toFixed(2)}% a.a. aplicado pelo STJ como parâmetro de abusividade para recursos livres (REsp 1.061.530/RS — recurso repetitivo).`
    : `A taxa contratada de ${params.taxaContratadaAA.toFixed(2)}% a.a. excede em ${diferenca.toFixed(2)} p.p. o limite legal de ${taxaLimiteEfetiva.toFixed(2)}% a.a. estabelecido para a linha ${linha.label} (${linha.fundamentacao}). A cobrança acima deste limite é ilegal e passível de revisão judicial com devolução em dobro (art. 42, parágrafo único, CDC).`;

  return {
    linha,
    taxaLimite: taxaLimiteEfetiva,
    taxaContratada: params.taxaContratadaAA,
    diferencaPP: diferenca,
    excede,
    excessoJurosTotal,
    veredicto,
    textoVeredicto,
    fundamentacao: linha.fundamentacao,
  };
}

/**
 * Lista todas as modalidades disponíveis com suas taxas máximas,
 * para uso em seletores de formulário.
 */
export function listarModalidades(): Array<{
  valor: ModalidadeCredito;
  label: string;
  taxaMaxima: number | null;
  programa?: string;
}> {
  return [
    { valor: "custeio_obrigatorio", label: "Custeio — Recursos Obrigatórios", taxaMaxima: 14.0 },
    { valor: "custeio_livre", label: "Custeio — Recursos Livres", taxaMaxima: null },
    { valor: "investimento_subvencionado", label: "Investimento — Subvencionado (equalização)", taxaMaxima: 12.5 },
    { valor: "investimento_livre", label: "Investimento — Recursos Livres", taxaMaxima: null },
    { valor: "comercializacao", label: "Comercialização", taxaMaxima: 14.0 },
    { valor: "industrializacao", label: "Industrialização", taxaMaxima: 14.0 },
    { valor: "pronaf_b", label: "Pronaf Grupo B (Microcrédito)", taxaMaxima: 0.5, programa: "Pronaf" },
    { valor: "pronaf_custeio", label: "Pronaf Custeio (Grupos C, D, E, V)", taxaMaxima: 5.0, programa: "Pronaf" },
    { valor: "pronaf_investimento", label: "Pronaf Investimento (Mais Alimentos)", taxaMaxima: 5.0, programa: "Pronaf" },
    { valor: "pronaf_agroecologia", label: "Pronaf Agroecologia / Floresta / Semiárido", taxaMaxima: 3.0, programa: "Pronaf" },
    { valor: "pronamp_custeio", label: "Pronamp Custeio (Médio Produtor)", taxaMaxima: 8.0, programa: "Pronamp" },
    { valor: "pronamp_investimento", label: "Pronamp Investimento (Médio Produtor)", taxaMaxima: 8.5, programa: "Pronamp" },
    { valor: "nao_controlado", label: "Recursos Não Controlados (livre pactuação)", taxaMaxima: null },
  ];
}
