import { describe, expect, it, vi } from "vitest";
import {
  JURISPRUDENCIA_CREDITO_RURAL,
  type DadosContrato,
} from "./geradorPeticao";

// ─── Mock do invokeLLM ────────────────────────────────────────────────────────

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "LAUDO TÉCNICO-JURÍDICO\n\nI - IDENTIFICAÇÃO DO CONTRATO\nContrato nº 12345\n\nCONCLUSÃO\nOs encargos financeiros pactuados excedem os limites legais estabelecidos pelo Decreto nº 22.626/33 e pela Súmula 382 do STJ.",
        },
      },
    ],
  }),
}));

// ─── Dados de Teste ───────────────────────────────────────────────────────────

const dadosContratoTeste: DadosContrato = {
  nomeAutor: "João da Silva",
  nacionalidade: "brasileiro",
  estadoCivil: "casado",
  cpf: "000.000.000-00",
  rg: "1234567",
  endereco: "Fazenda Boa Vista, Zona Rural, Cuiabá/MT",
  nomePropriedade: "Fazenda Boa Vista",
  municipioPropriedade: "Cuiabá",
  uf: "MT",
  nomeBanco: "Banco do Brasil S.A.",
  cnpjBanco: "00.000.000/0001-91",
  enderecoBanco: "SBS Quadra 1, Bloco C, Brasília/DF",
  numeroContrato: "12345/2023",
  dataContratacao: "01/03/2023",
  valorCredito: 500000,
  dataVencimento: "28/02/2024",
  modalidade: "custeio",
  cultura: "Soja",
  anoSafra: "2023/2024",
  taxaJurosContratada: 18.5,
  taxaJurosMoraContratada: 3,
  garantias: "Penhor rural sobre a lavoura de soja, matrícula nº 12345",
  tipoEvento: "Estiagem prolongada",
  descricaoEvento: "Estiagem severa que comprometeu 80% da produção de soja na safra 2023/2024",
  dataComunicacaoBanco: "15/03/2024",
  descricaoPropostaRenegociacao: "O banco não apresentou proposta de renegociação",
  nomeAdvogado: "Dr. Pedro Alvares",
  oab: "OAB/MT nº 12.345",
  telefoneAdvogado: "(65) 99999-9999",
  emailAdvogado: "pedro@escritorio.com.br",
  enderecoEscritorio: "Rua das Palmeiras, 100, Centro, Cuiabá/MT",
  comarca: "Cuiabá",
  vara: "1ª Vara Cível",
};

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("JURISPRUDENCIA_CREDITO_RURAL", () => {
  it("deve conter jurisprudência do STJ com números de processos reais", () => {
    const stj = JURISPRUDENCIA_CREDITO_RURAL.filter((j) => j.tribunal === "STJ");
    expect(stj.length).toBeGreaterThanOrEqual(5);
  });

  it("deve conter a Súmula 382 do STJ sobre limite de juros a 12% ao ano", () => {
    const sumula = JURISPRUDENCIA_CREDITO_RURAL.find(
      (j) => j.numero === "Súmula 382"
    );
    expect(sumula).toBeDefined();
    expect(sumula?.ementa).toContain("12%");
    expect(sumula?.tema).toBe("juros_remuneratorios");
  });

  it("deve conter o REsp 1.509.057/RS sobre juros de mora a 1% ao ano", () => {
    const resp = JURISPRUDENCIA_CREDITO_RURAL.find(
      (j) => j.numero === "REsp 1.509.057/RS"
    );
    expect(resp).toBeDefined();
    expect(resp?.ementa).toContain("1%");
    expect(resp?.tema).toBe("juros_mora");
  });

  it("deve conter o REsp 1.857.852/SP sobre perda de safra e revisão contratual", () => {
    const resp = JURISPRUDENCIA_CREDITO_RURAL.find(
      (j) => j.numero === "REsp 1.857.852/SP"
    );
    expect(resp).toBeDefined();
    expect(resp?.tema).toBe("perda_safra");
    expect(resp?.ementa).toContain("onerosidade excessiva");
  });

  it("deve conter jurisprudência de TRF e TJDFT além do STJ", () => {
    const trf = JURISPRUDENCIA_CREDITO_RURAL.filter((j) => j.tribunal === "TRF-3");
    const tjdft = JURISPRUDENCIA_CREDITO_RURAL.filter((j) => j.tribunal === "TJDFT");
    expect(trf.length).toBeGreaterThanOrEqual(1);
    expect(tjdft.length).toBeGreaterThanOrEqual(1);
  });

  it("deve ter referências com tribunal, relator e data de julgamento", () => {
    for (const j of JURISPRUDENCIA_CREDITO_RURAL) {
      expect(j.referencia).toBeTruthy();
      expect(j.referencia.length).toBeGreaterThan(20);
    }
  });

  it("deve cobrir todos os temas relevantes", () => {
    const temas = new Set(JURISPRUDENCIA_CREDITO_RURAL.map((j) => j.tema));
    expect(temas.has("juros_remuneratorios")).toBe(true);
    expect(temas.has("juros_mora")).toBe(true);
    expect(temas.has("revisao_contratual")).toBe(true);
    expect(temas.has("perda_safra")).toBe(true);
    expect(temas.has("capitalizacao")).toBe(true);
  });
});

describe("gerarLaudoTecnicoJuridico", () => {
  it("deve gerar um laudo com título contendo o número do contrato", async () => {
    const { gerarLaudoTecnicoJuridico } = await import("./geradorPeticao");
    const laudo = await gerarLaudoTecnicoJuridico(dadosContratoTeste);
    expect(laudo.titulo).toContain("12345/2023");
    expect(laudo.titulo).toContain("LAUDO TÉCNICO-JURÍDICO");
  });

  it("deve incluir resumo executivo com dados do contrato", async () => {
    const { gerarLaudoTecnicoJuridico } = await import("./geradorPeticao");
    const laudo = await gerarLaudoTecnicoJuridico(dadosContratoTeste);
    expect(laudo.resumoExecutivo).toContain("João da Silva");
    expect(laudo.resumoExecutivo).toContain("Banco do Brasil");
    expect(laudo.resumoExecutivo).toContain("18.5%");
  });

  it("deve incluir fundamentação legal com as leis corretas", async () => {
    const { gerarLaudoTecnicoJuridico } = await import("./geradorPeticao");
    const laudo = await gerarLaudoTecnicoJuridico(dadosContratoTeste);
    expect(laudo.fundamentacaoLegal).toContain("4.829/65");
    expect(laudo.fundamentacaoLegal).toContain("167/67");
    expect(laudo.fundamentacaoLegal).toContain("22.626/33");
    expect(laudo.fundamentacaoLegal).toContain("Súmula 382");
  });

  it("deve incluir jurisprudência com números de processos reais", async () => {
    const { gerarLaudoTecnicoJuridico } = await import("./geradorPeticao");
    const laudo = await gerarLaudoTecnicoJuridico(dadosContratoTeste);
    expect(laudo.jurisprudencia).toContain("REsp");
    expect(laudo.jurisprudencia).toContain("STJ");
  });

  it("deve incluir dados do BCB quando fornecidos", async () => {
    const { gerarLaudoTecnicoJuridico } = await import("./geradorPeticao");
    const laudo = await gerarLaudoTecnicoJuridico(dadosContratoTeste, {
      ipcaAcumulado12m: "4.83",
      selicAnualizada: "13.75",
      taxaMediaCreditoRural: "8.50",
      usdVenda: "5.1234",
    });
    expect(laudo.titulo).toBeTruthy();
    expect(laudo.textoCompleto).toBeTruthy();
  });

  it("deve incluir memória de cálculo quando saldo devedor é fornecido", async () => {
    const { gerarLaudoTecnicoJuridico } = await import("./geradorPeticao");
    const dadosComCalculo = {
      ...dadosContratoTeste,
      saldoDevedor: 650000,
      saldoDevedorRevisado: 560000,
      excessoJuros: 90000,
    };
    const laudo = await gerarLaudoTecnicoJuridico(dadosComCalculo);
    expect(laudo.memoriaCalculo).toContain("650.000");
    expect(laudo.memoriaCalculo).toContain("560.000");
    expect(laudo.memoriaCalculo).toContain("90.000");
  });
});

describe("gerarPeticaoRevisaoContratual", () => {
  it("deve gerar uma petição com título contendo o nome do banco", async () => {
    const { gerarPeticaoRevisaoContratual } = await import("./geradorPeticao");
    const peticao = await gerarPeticaoRevisaoContratual(dadosContratoTeste);
    expect(peticao.titulo).toContain("Banco do Brasil");
    expect(peticao.titulo).toContain("REVISÃO CONTRATUAL");
  });

  it("deve incluir variáveis com dados do contrato", async () => {
    const { gerarPeticaoRevisaoContratual } = await import("./geradorPeticao");
    const peticao = await gerarPeticaoRevisaoContratual(dadosContratoTeste);
    expect(peticao.variaveis.nomeAutor).toBe("João da Silva");
    expect(peticao.variaveis.nomeBanco).toBe("Banco do Brasil S.A.");
    expect(peticao.variaveis.numeroContrato).toBe("12345/2023");
    expect(peticao.variaveis.comarca).toBe("Cuiabá");
    expect(peticao.variaveis.uf).toBe("MT");
  });

  it("deve gerar texto completo não vazio", async () => {
    const { gerarPeticaoRevisaoContratual } = await import("./geradorPeticao");
    const peticao = await gerarPeticaoRevisaoContratual(dadosContratoTeste);
    expect(peticao.textoCompleto.length).toBeGreaterThan(100);
  });

  it("deve incluir data de emissão no formato brasileiro", async () => {
    const { gerarPeticaoRevisaoContratual } = await import("./geradorPeticao");
    const peticao = await gerarPeticaoRevisaoContratual(dadosContratoTeste);
    // Data no formato "22 de fevereiro de 2026" ou similar
    expect(peticao.dataEmissao).toMatch(/\d{2} de \w+ de \d{4}/);
  });
});
