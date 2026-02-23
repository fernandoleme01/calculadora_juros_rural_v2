/**
 * Lógica de checklist de verificação do DED/DDC.
 * Classifica campos ausentes por severidade e sugere ações corretivas.
 */

import { type DadosDEDDDC } from "@/components/UploadDEDDDC";

export type Severidade = "critico" | "importante" | "opcional";

export interface ItemChecklist {
  campo: keyof DadosDEDDDC;
  label: string;
  severidade: Severidade;
  descricao: string;
  acaoCorretiva: string;
  fundamentacaoLegal?: string;
  presente: boolean;
  valor?: string;
}

export interface ResultadoChecklist {
  itens: ItemChecklist[];
  criticos: ItemChecklist[];
  importantes: ItemChecklist[];
  opcionais: ItemChecklist[];
  podeCalcular: boolean;
  totalCampos: number;
  camposPresentes: number;
  percentualCompleto: number;
  resumo: string;
}

// Definição de todos os campos com metadados
const DEFINICAO_CAMPOS: Omit<ItemChecklist, "presente" | "valor">[] = [
  // ── CRÍTICOS — sem eles o cálculo TCR é impossível ──────────────────────
  {
    campo: "valorPrincipal",
    label: "Valor Principal do Contrato",
    severidade: "critico",
    descricao: "Valor original financiado, sem juros. Base de todo o recálculo.",
    acaoCorretiva: "Solicite ao banco o demonstrativo completo com o valor da cédula original (art. 6º, III do CDC + Res. CMN 5.004/2022).",
    fundamentacaoLegal: "Res. CMN 5.004/2022, art. 6º III CDC",
  },
  {
    campo: "taxaJurosRemuneratoriosAA",
    label: "Taxa de Juros Remuneratórios (a.a.)",
    severidade: "critico",
    descricao: "Taxa de juros pactuada ao ano. Essencial para verificar conformidade com o MCR.",
    acaoCorretiva: "Localize na cláusula de encargos da cédula ou solicite o DED/DDC ao banco. O banco é obrigado a informar (Res. CMN 5.004/2022).",
    fundamentacaoLegal: "MCR 7-6, Res. CMN 5.004/2022",
  },
  {
    campo: "dataContratacao",
    label: "Data de Contratação",
    severidade: "critico",
    descricao: "Data de assinatura do contrato. Determina qual resolução CMN se aplica.",
    acaoCorretiva: "Verifique a data no cabeçalho da cédula de crédito rural ou no extrato bancário.",
    fundamentacaoLegal: "DL 167/67, art. 9º",
  },
  {
    campo: "dataVencimento",
    label: "Data de Vencimento",
    severidade: "critico",
    descricao: "Data final do contrato. Necessária para calcular o prazo e os juros acumulados.",
    acaoCorretiva: "Consta na cláusula de vencimento da cédula. Solicite cópia integral ao banco.",
    fundamentacaoLegal: "DL 167/67, art. 10",
  },
  {
    campo: "prazoMeses",
    label: "Prazo do Contrato (meses)",
    severidade: "critico",
    descricao: "Duração total do financiamento em meses. Usado no cálculo de amortização.",
    acaoCorretiva: "Calcule a diferença entre data de contratação e vencimento, ou solicite o cronograma de pagamentos ao banco.",
  },

  // ── IMPORTANTES — afetam significativamente o resultado ──────────────────
  {
    campo: "taxaJurosMoraAA",
    label: "Taxa de Juros de Mora (a.a.)",
    severidade: "importante",
    descricao: "Taxa aplicada em caso de inadimplência. Limite legal: 1% a.m. (Decreto 22.626/33).",
    acaoCorretiva: "Localize na cláusula de mora da cédula. Se ausente, o sistema usará o limite legal de 12% a.a.",
    fundamentacaoLegal: "Decreto 22.626/33, Súmula 379 STJ",
  },
  {
    campo: "sistemaAmortizacao",
    label: "Sistema de Amortização (Price/SAC/SAF)",
    severidade: "importante",
    descricao: "Método de cálculo das parcelas. Impacta diretamente o saldo devedor.",
    acaoCorretiva: "Verifique na cláusula de pagamento da cédula. Contratos Pronaf geralmente usam SAF; contratos comerciais usam Price.",
  },
  {
    campo: "modalidade",
    label: "Modalidade (Custeio/Investimento/Comercialização)",
    severidade: "importante",
    descricao: "Determina os limites legais de taxa aplicáveis conforme o MCR.",
    acaoCorretiva: "Consta no cabeçalho da cédula de crédito rural. Solicite cópia ao banco.",
    fundamentacaoLegal: "MCR 7-6, Lei 4.829/65",
  },
  {
    campo: "linhaCredito",
    label: "Linha de Crédito (Pronaf, FCO, Moderfrota etc.)",
    severidade: "importante",
    descricao: "Identifica o programa de crédito e os limites de taxa específicos aplicáveis.",
    acaoCorretiva: "Consta no contrato e no extrato bancário. Essencial para verificar equalização de taxas Pronaf/Pronamp.",
    fundamentacaoLegal: "MCR 7-6, Lei 11.326/2006 (Pronaf)",
  },
  {
    campo: "saldoDevedorAtual",
    label: "Saldo Devedor Atual (conforme banco)",
    severidade: "importante",
    descricao: "Valor cobrado pelo banco. Comparado com o saldo revisado para calcular o excesso.",
    acaoCorretiva: "Solicite o extrato atualizado ou o DED/DDC completo ao banco (Res. CMN 5.004/2022).",
    fundamentacaoLegal: "Res. CMN 5.004/2022",
  },
  {
    campo: "numeroParcelas",
    label: "Número de Parcelas",
    severidade: "importante",
    descricao: "Total de parcelas do contrato. Necessário para análise de amortização.",
    acaoCorretiva: "Consta no cronograma de pagamentos da cédula.",
  },

  // ── OPCIONAIS — enriquecem a análise mas não bloqueiam o cálculo ─────────
  {
    campo: "iof",
    label: "IOF Cobrado (R$)",
    severidade: "opcional",
    descricao: "Imposto sobre Operações Financeiras. Verificado no cálculo do CET.",
    acaoCorretiva: "Consta no extrato de tarifas ou nota de crédito. Limite: Decreto 6.306/2007.",
    fundamentacaoLegal: "Decreto 6.306/2007",
  },
  {
    campo: "tac",
    label: "TAC — Tarifa de Abertura de Crédito (R$)",
    severidade: "opcional",
    descricao: "Tarifa cobrada na contratação. Vedada em contratos de crédito rural (Res. CMN 3.518/2007).",
    acaoCorretiva: "Se cobrada, é abusiva e deve ser restituída. Solicite o extrato de tarifas ao banco.",
    fundamentacaoLegal: "Res. CMN 3.518/2007, Súmula 566 STJ",
  },
  {
    campo: "tec",
    label: "TEC — Tarifa de Emissão de Carnê (R$)",
    severidade: "opcional",
    descricao: "Tarifa de emissão de boleto/carnê. Verificada no cálculo do CET.",
    acaoCorretiva: "Consta no extrato de tarifas. Verifique se está dentro dos limites da Res. CMN 3.919/2010.",
    fundamentacaoLegal: "Res. CMN 3.919/2010",
  },
  {
    campo: "taxaMulta",
    label: "Multa Contratual (%)",
    severidade: "opcional",
    descricao: "Percentual de multa por inadimplência. Limite: 2% (CDC, art. 52, §1º).",
    acaoCorretiva: "Localize na cláusula de penalidades da cédula.",
    fundamentacaoLegal: "CDC art. 52, §1º",
  },
  {
    campo: "totalPago",
    label: "Total Pago pelo Devedor",
    severidade: "opcional",
    descricao: "Soma de todos os pagamentos realizados. Usado para calcular o valor a restituir.",
    acaoCorretiva: "Solicite o extrato completo de movimentações ao banco.",
  },
  {
    campo: "nomeBanco",
    label: "Nome do Banco",
    severidade: "opcional",
    descricao: "Identificação da instituição financeira.",
    acaoCorretiva: "Consta no cabeçalho da cédula.",
  },
  {
    campo: "nomeDevedor",
    label: "Nome do Devedor",
    severidade: "opcional",
    descricao: "Identificação do mutuário para o laudo pericial.",
    acaoCorretiva: "Consta no cabeçalho da cédula.",
  },
];

/**
 * Formata o valor de um campo para exibição.
 */
function formatarValor(campo: keyof DadosDEDDDC, dados: DadosDEDDDC): string | undefined {
  const val = dados[campo];
  if (val === null || val === undefined) return undefined;
  if (typeof val === "number") {
    if (["taxaJurosRemuneratoriosAA", "taxaJurosMoraAA", "taxaMulta"].includes(campo)) {
      return `${val.toFixed(2)}% a.a.`;
    }
    if (["valorPrincipal", "saldoDevedorAtual", "totalPago", "iof", "tac", "tec"].includes(campo)) {
      return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
    if (campo === "prazoMeses") return `${val} meses`;
    if (campo === "numeroParcelas") return `${val} parcelas`;
    return String(val);
  }
  if (campo === "sistemaAmortizacao") {
    const map: Record<string, string> = { price: "Tabela Price", sac: "SAC", saf: "SAF" };
    return map[String(val)] ?? String(val);
  }
  if (campo === "modalidade") {
    const map: Record<string, string> = {
      custeio: "Custeio",
      investimento: "Investimento",
      comercializacao: "Comercialização",
    };
    return map[String(val)] ?? String(val);
  }
  return String(val);
}

/**
 * Verifica se um campo está presente e válido nos dados extraídos.
 */
function campoPresente(campo: keyof DadosDEDDDC, dados: DadosDEDDDC): boolean {
  const val = dados[campo];
  if (val === null || val === undefined) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  if (typeof val === "number" && (isNaN(val) || val <= 0)) return false;
  return true;
}

/**
 * Executa o checklist completo sobre os dados extraídos do DED/DDC.
 */
export function executarChecklist(dados: DadosDEDDDC): ResultadoChecklist {
  const itens: ItemChecklist[] = DEFINICAO_CAMPOS.map((def) => ({
    ...def,
    presente: campoPresente(def.campo, dados),
    valor: formatarValor(def.campo, dados),
  }));

  const criticos = itens.filter((i) => i.severidade === "critico" && !i.presente);
  const importantes = itens.filter((i) => i.severidade === "importante" && !i.presente);
  const opcionais = itens.filter((i) => i.severidade === "opcional" && !i.presente);

  const totalCampos = itens.length;
  const camposPresentes = itens.filter((i) => i.presente).length;
  const percentualCompleto = Math.round((camposPresentes / totalCampos) * 100);
  const podeCalcular = criticos.length === 0;

  let resumo: string;
  if (podeCalcular && importantes.length === 0) {
    resumo = "Documento completo. Todos os campos essenciais foram encontrados.";
  } else if (podeCalcular && importantes.length > 0) {
    resumo = `Cálculo possível, mas ${importantes.length} campo(s) importante(s) estão ausentes. O resultado pode ser menos preciso.`;
  } else {
    resumo = `${criticos.length} campo(s) crítico(s) ausente(s). O cálculo TCR não pode ser realizado sem esses dados.`;
  }

  return {
    itens,
    criticos,
    importantes,
    opcionais,
    podeCalcular,
    totalCampos,
    camposPresentes,
    percentualCompleto,
    resumo,
  };
}
