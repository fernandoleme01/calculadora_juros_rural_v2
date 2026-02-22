/**
 * Módulo de Análise de Contratos de Crédito Rural via OCR + OpenAI
 *
 * Fluxo:
 * 1. Recebe o PDF do contrato (buffer)
 * 2. Extrai o texto via pdf-parse
 * 3. Envia o texto à API OpenAI (GPT-4o) para extração estruturada
 * 4. Retorna os dados extraídos + análise de conformidade legal
 */

import { PDFParse } from "pdf-parse";
import OpenAI from "openai";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface DadosContratoExtraidos {
  // Identificação
  nomeDevedor: string | null;
  cpfCnpjDevedor: string | null;
  nomeCredor: string | null;
  numeroCedula: string | null;
  dataContratacao: string | null;
  dataVencimento: string | null;

  // Financeiro
  valorPrincipal: number | null;
  moeda: string;
  prazoMeses: number | null;
  modalidade: "custeio" | "investimento" | "comercializacao" | null;
  finalidade: string | null;

  // Taxas pactuadas
  taxaJurosRemuneratorios: number | null; // % ao ano
  taxaJurosMora: number | null; // % ao ano
  taxaMulta: number | null; // %
  tipoTaxa: "pre_fixada" | "pos_fixada" | null;
  indiceCorrecao: string | null; // IPCA, IGP-M, etc.

  // Garantias
  garantias: string[];

  // Outros
  clausulasRelevantes: string[];
  observacoes: string | null;
}

export interface ResultadoAnaliseContrato {
  textoExtraido: string;
  totalPaginas: number;
  dadosExtraidos: DadosContratoExtraidos;
  analiseConformidade: AnaliseConformidadeContrato;
  parecerJuridico: string;
  confiancaExtracao: number; // 0-100
}

export interface AnaliseConformidadeContrato {
  statusGeral: "conforme" | "nao_conforme" | "atencao" | "inconclusivo";
  jurosRemuneratorios: {
    status: "conforme" | "nao_conforme" | "atencao" | "nao_identificado";
    taxaEncontrada: number | null;
    limiteMaximo: number;
    excesso: number | null;
    fundamentacao: string;
  };
  jurosMora: {
    status: "conforme" | "nao_conforme" | "atencao" | "nao_identificado";
    taxaEncontrada: number | null;
    limiteMaximo: number;
    excesso: number | null;
    fundamentacao: string;
  };
  multa: {
    status: "conforme" | "nao_conforme" | "atencao" | "nao_identificado";
    taxaEncontrada: number | null;
    limiteMaximo: number;
    fundamentacao: string;
  };
  alertas: string[];
  pontosAtencao: string[];
}

// ─── Extração de Texto do PDF ─────────────────────────────────────────────────

export async function extrairTextoPDF(buffer: Buffer): Promise<{ texto: string; paginas: number }> {
  try {
    const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
    return {
      texto: (data as any).text || (data as any).content || "",
      paginas: (data as any).numpages || (data as any).pages?.length || 0,
    };
  } catch (error) {
    throw new Error(`Falha ao processar o PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

// ─── Análise via OpenAI ───────────────────────────────────────────────────────

export async function analisarContratoComOpenAI(
  textoContrato: string,
  apiKey: string
): Promise<{ dados: DadosContratoExtraidos; parecer: string; confianca: number }> {
  const client = new OpenAI({ apiKey });

  // Limitar o texto para não exceder o contexto (máx ~15.000 chars)
  const textoTruncado = textoContrato.length > 15000
    ? textoContrato.substring(0, 15000) + "\n\n[... texto truncado por limite de contexto ...]"
    : textoContrato;

  // ── Extração estruturada de dados ──
  const extractionResponse = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Você é um especialista em Direito Agrário e Crédito Rural com profundo conhecimento da Lei nº 4.829/65, Decreto-Lei nº 167/67, Decreto nº 22.626/33 (Lei de Usura) e Resoluções do CMN. Analise contratos de crédito rural e extraia dados com precisão técnico-jurídica.`,
      },
      {
        role: "user",
        content: `Analise o seguinte texto de contrato/cédula de crédito rural e extraia os dados em formato JSON estrito. Se um campo não for encontrado, use null.

TEXTO DO CONTRATO:
${textoTruncado}

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "nomeDevedor": "string ou null",
  "cpfCnpjDevedor": "string ou null",
  "nomeCredor": "string ou null",
  "numeroCedula": "string ou null",
  "dataContratacao": "DD/MM/AAAA ou null",
  "dataVencimento": "DD/MM/AAAA ou null",
  "valorPrincipal": número ou null,
  "moeda": "BRL",
  "prazoMeses": número inteiro ou null,
  "modalidade": "custeio" ou "investimento" ou "comercializacao" ou null,
  "finalidade": "string descritiva ou null",
  "taxaJurosRemuneratorios": número percentual ao ano ou null,
  "taxaJurosMora": número percentual ao ano ou null,
  "taxaMulta": número percentual ou null,
  "tipoTaxa": "pre_fixada" ou "pos_fixada" ou null,
  "indiceCorrecao": "IPCA" ou "IGP-M" ou "SELIC" ou "TR" ou null,
  "garantias": ["lista de garantias encontradas"],
  "clausulasRelevantes": ["cláusulas importantes sobre juros, mora, multa, vencimento antecipado"],
  "observacoes": "string com observações relevantes ou null",
  "confiancaExtracao": número de 0 a 100 indicando confiança na extração
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const dadosRaw = JSON.parse(
    extractionResponse.choices[0]?.message?.content ?? "{}"
  );

  const dados: DadosContratoExtraidos = {
    nomeDevedor: dadosRaw.nomeDevedor ?? null,
    cpfCnpjDevedor: dadosRaw.cpfCnpjDevedor ?? null,
    nomeCredor: dadosRaw.nomeCredor ?? null,
    numeroCedula: dadosRaw.numeroCedula ?? null,
    dataContratacao: dadosRaw.dataContratacao ?? null,
    dataVencimento: dadosRaw.dataVencimento ?? null,
    valorPrincipal: dadosRaw.valorPrincipal ?? null,
    moeda: dadosRaw.moeda ?? "BRL",
    prazoMeses: dadosRaw.prazoMeses ?? null,
    modalidade: dadosRaw.modalidade ?? null,
    finalidade: dadosRaw.finalidade ?? null,
    taxaJurosRemuneratorios: dadosRaw.taxaJurosRemuneratorios ?? null,
    taxaJurosMora: dadosRaw.taxaJurosMora ?? null,
    taxaMulta: dadosRaw.taxaMulta ?? null,
    tipoTaxa: dadosRaw.tipoTaxa ?? null,
    indiceCorrecao: dadosRaw.indiceCorrecao ?? null,
    garantias: Array.isArray(dadosRaw.garantias) ? dadosRaw.garantias : [],
    clausulasRelevantes: Array.isArray(dadosRaw.clausulasRelevantes) ? dadosRaw.clausulasRelevantes : [],
    observacoes: dadosRaw.observacoes ?? null,
  };

  const confianca = typeof dadosRaw.confiancaExtracao === "number"
    ? Math.min(100, Math.max(0, dadosRaw.confiancaExtracao))
    : 50;

  // ── Parecer jurídico ──
  const parecerResponse = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Você é um advogado especialista em Direito Agrário e Crédito Rural, com profundo conhecimento da Lei nº 4.829/65, Decreto-Lei nº 167/67, Decreto nº 22.626/33 (Lei de Usura), Resoluções CMN nº 4.883/2020 e 4.913/2021, e jurisprudência consolidada do STJ. Elabore pareceres técnicos precisos, objetivos e fundamentados.`,
      },
      {
        role: "user",
        content: `Com base nos dados extraídos do contrato de crédito rural abaixo, elabore um PARECER TÉCNICO-JURÍDICO sucinto (máximo 500 palavras) analisando:

1. A conformidade das taxas de juros com os limites legais (12% a.a. remuneratórios - Decreto 22.626/33; 1% a.a. mora - DL 167/67, art. 5º)
2. A validade das cláusulas de vencimento antecipado
3. Eventuais irregularidades ou cláusulas abusivas
4. Recomendações para o produtor rural / advogado

DADOS EXTRAÍDOS:
- Devedor: ${dados.nomeDevedor ?? "Não identificado"}
- Credor: ${dados.nomeCredor ?? "Não identificado"}
- Valor: R$ ${dados.valorPrincipal?.toLocaleString("pt-BR") ?? "Não identificado"}
- Modalidade: ${dados.modalidade ?? "Não identificada"}
- Taxa Remuneratória: ${dados.taxaJurosRemuneratorios != null ? dados.taxaJurosRemuneratorios + "% a.a." : "Não identificada"}
- Taxa de Mora: ${dados.taxaJurosMora != null ? dados.taxaJurosMora + "% a.a." : "Não identificada"}
- Multa: ${dados.taxaMulta != null ? dados.taxaMulta + "%" : "Não identificada"}
- Tipo de Taxa: ${dados.tipoTaxa ?? "Não identificado"}
- Índice de Correção: ${dados.indiceCorrecao ?? "Não identificado"}
- Garantias: ${dados.garantias.join(", ") || "Não identificadas"}
- Cláusulas Relevantes: ${dados.clausulasRelevantes.join("; ") || "Nenhuma identificada"}

Fundamente o parecer na legislação e jurisprudência do STJ aplicáveis ao crédito rural.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  const parecer = parecerResponse.choices[0]?.message?.content ?? "Não foi possível gerar o parecer.";

  return { dados, parecer, confianca };
}

// ─── Análise de Conformidade ──────────────────────────────────────────────────

export function analisarConformidadeContrato(
  dados: DadosContratoExtraidos
): AnaliseConformidadeContrato {
  const LIMITE_REM = 12.0;
  const LIMITE_MORA = 1.0;
  const LIMITE_MULTA = 2.0;

  const alertas: string[] = [];
  const pontosAtencao: string[] = [];

  // ── Juros Remuneratórios ──
  type StatusConformidade = "conforme" | "nao_conforme" | "atencao" | "nao_identificado";
  let statusRem: StatusConformidade = "nao_identificado";
  let excessoRem: number | null = null;

  if (dados.taxaJurosRemuneratorios != null) {
    const taxa = dados.taxaJurosRemuneratorios;
    excessoRem = taxa > LIMITE_REM ? parseFloat((taxa - LIMITE_REM).toFixed(4)) : null;
    if (taxa > LIMITE_REM) {
      statusRem = "nao_conforme";
      alertas.push(
        `ILEGALIDADE: Juros remuneratórios de ${taxa.toFixed(2)}% a.a. EXCEDEM o limite legal de ${LIMITE_REM}% a.a. (Decreto nº 22.626/33 — Lei de Usura + STJ). Excesso: ${excessoRem?.toFixed(2)}% a.a.`
      );
    } else if (taxa > LIMITE_REM * 0.9) {
      statusRem = "atencao";
      pontosAtencao.push(`Juros remuneratórios de ${taxa.toFixed(2)}% a.a. estão próximos do limite legal de ${LIMITE_REM}% a.a.`);
    } else {
      statusRem = "conforme";
    }
  } else {
    pontosAtencao.push("Taxa de juros remuneratórios não identificada no contrato. Verifique manualmente.");
  }

  // ── Juros de Mora ──
  let statusMora: StatusConformidade = "nao_identificado";
  let excessoMora: number | null = null;

  if (dados.taxaJurosMora != null) {
    const taxa = dados.taxaJurosMora;
    excessoMora = taxa > LIMITE_MORA ? parseFloat((taxa - LIMITE_MORA).toFixed(4)) : null;
    if (taxa > LIMITE_MORA) {
      statusMora = "nao_conforme";
      alertas.push(
        `ILEGALIDADE: Juros de mora de ${taxa.toFixed(3)}% a.a. EXCEDEM o limite legal de ${LIMITE_MORA}% a.a. (Decreto-Lei nº 167/67, art. 5º). Excesso: ${excessoMora?.toFixed(3)}% a.a.`
      );
    } else {
      statusMora = "conforme";
    }
  } else {
    pontosAtencao.push("Taxa de juros de mora não identificada. Verifique se o contrato prevê mora de 1% ao mês (ilegal — deve ser 1% ao ANO).");
  }

  // ── Multa ──
  let statusMulta: StatusConformidade = "nao_identificado";

  if (dados.taxaMulta != null) {
    const taxa = dados.taxaMulta;
    if (taxa > LIMITE_MULTA) {
      statusMulta = "nao_conforme";
      alertas.push(
        `ATENÇÃO: Multa contratual de ${taxa.toFixed(2)}% pode exceder o limite de ${LIMITE_MULTA}% (Código Civil, art. 412).`
      );
    } else {
      statusMulta = "conforme";
    }
  }

  // ── Status Geral ──
  let statusGeral: AnaliseConformidadeContrato["statusGeral"];
  if (statusRem === "nao_conforme" || statusMora === "nao_conforme" || statusMulta === "nao_conforme") {
    statusGeral = "nao_conforme";
  } else if (statusRem === "nao_identificado" && statusMora === "nao_identificado") {
    statusGeral = "inconclusivo";
  } else if ((statusRem as string) === "atencao" || (statusMora as string) === "atencao") {
    statusGeral = "atencao";
  } else {
    statusGeral = "conforme";
  }

  return {
    statusGeral,
    jurosRemuneratorios: {
      status: statusRem,
      taxaEncontrada: dados.taxaJurosRemuneratorios,
      limiteMaximo: LIMITE_REM,
      excesso: excessoRem,
      fundamentacao: "Decreto nº 22.626/33 (Lei de Usura) + Jurisprudência consolidada do STJ: limite de 12% a.a. na ausência de deliberação do CMN.",
    },
    jurosMora: {
      status: statusMora,
      taxaEncontrada: dados.taxaJurosMora,
      limiteMaximo: LIMITE_MORA,
      excesso: excessoMora,
      fundamentacao: "Decreto-Lei nº 167/67, art. 5º: juros moratórios em cédulas de crédito rural limitados a 1% ao ano.",
    },
    multa: {
      status: statusMulta,
      taxaEncontrada: dados.taxaMulta,
      limiteMaximo: LIMITE_MULTA,
      fundamentacao: "Código Civil, art. 412 c/c legislação específica do crédito rural.",
    },
    alertas,
    pontosAtencao,
  };
}

// ─── Função Principal ─────────────────────────────────────────────────────────

export async function processarContratoRural(
  pdfBuffer: Buffer,
  openAiApiKey: string
): Promise<ResultadoAnaliseContrato> {
  // 1. Extrair texto do PDF
  const { texto, paginas } = await extrairTextoPDF(pdfBuffer);

  if (!texto || texto.trim().length < 50) {
    throw new Error(
      "O PDF não contém texto legível suficiente. Verifique se o arquivo é um PDF com texto (não uma imagem escaneada sem OCR)."
    );
  }

  // 2. Analisar com OpenAI
  const { dados, parecer, confianca } = await analisarContratoComOpenAI(texto, openAiApiKey);

  // 3. Análise de conformidade
  const analiseConformidade = analisarConformidadeContrato(dados);

  return {
    textoExtraido: texto,
    totalPaginas: paginas,
    dadosExtraidos: dados,
    analiseConformidade,
    parecerJuridico: parecer,
    confiancaExtracao: confianca,
  };
}
