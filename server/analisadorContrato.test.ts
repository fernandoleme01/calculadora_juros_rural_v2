import { describe, expect, it } from "vitest";
import {
  analisarConformidadeContrato,
  type DadosContratoExtraidos,
} from "./analisadorContrato";

// ─── Dados de teste base ──────────────────────────────────────────────────────

const dadosConformes: DadosContratoExtraidos = {
  nomeDevedor: "João da Silva",
  cpfCnpjDevedor: "123.456.789-00",
  nomeCredor: "Banco do Brasil S.A.",
  numeroCedula: "CCR-2024-001",
  dataContratacao: "01/01/2024",
  dataVencimento: "31/12/2024",
  valorPrincipal: 500000,
  moeda: "BRL",
  prazoMeses: 12,
  modalidade: "custeio",
  finalidade: "Custeio de safra de soja",
  taxaJurosRemuneratorios: 7.0, // dentro do limite de 12%
  taxaJurosMora: 1.0,           // exatamente no limite de 1% a.a.
  taxaMulta: 2.0,
  tipoTaxa: "pos_fixada",
  indiceCorrecao: "IPCA",
  garantias: ["Penhor de safra", "Alienação fiduciária de equipamentos"],
  clausulasRelevantes: ["Vencimento antecipado em caso de inadimplência"],
  observacoes: null,
};

// ─── Testes de Conformidade ───────────────────────────────────────────────────

describe("analisarConformidadeContrato", () => {
  it("deve retornar conforme para taxas dentro dos limites legais", () => {
    const resultado = analisarConformidadeContrato(dadosConformes);
    expect(resultado.statusGeral).toBe("conforme");
    expect(resultado.jurosRemuneratorios.status).toBe("conforme");
    expect(resultado.jurosMora.status).toBe("conforme");
    expect(resultado.alertas).toHaveLength(0);
  });

  it("deve detectar juros remuneratórios acima do limite de 12% a.a.", () => {
    const dados = { ...dadosConformes, taxaJurosRemuneratorios: 18.0 };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.statusGeral).toBe("nao_conforme");
    expect(resultado.jurosRemuneratorios.status).toBe("nao_conforme");
    expect(resultado.jurosRemuneratorios.excesso).toBeCloseTo(6.0, 2);
    expect(resultado.alertas.length).toBeGreaterThan(0);
    expect(resultado.alertas[0]).toContain("EXCEDEM o limite legal");
    expect(resultado.alertas[0]).toContain("18.00%");
  });

  it("deve detectar juros de mora acima do limite de 1% a.a.", () => {
    // Banco cobra 1% ao MÊS = 12% ao ano (ilegal — limite é 1% ao ANO)
    const dados = { ...dadosConformes, taxaJurosMora: 12.0 };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.statusGeral).toBe("nao_conforme");
    expect(resultado.jurosMora.status).toBe("nao_conforme");
    expect(resultado.jurosMora.excesso).toBeCloseTo(11.0, 2);
    expect(resultado.alertas.some(a => a.includes("mora"))).toBe(true);
  });

  it("deve retornar atenção para taxa remuneratória próxima do limite (>90%)", () => {
    // 11% é > 90% de 12%
    const dados = { ...dadosConformes, taxaJurosRemuneratorios: 11.0 };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.jurosRemuneratorios.status).toBe("atencao");
    expect(resultado.statusGeral).toBe("atencao");
  });

  it("deve retornar nao_identificado quando taxas são null", () => {
    const dados: DadosContratoExtraidos = {
      ...dadosConformes,
      taxaJurosRemuneratorios: null,
      taxaJurosMora: null,
      taxaMulta: null,
    };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.statusGeral).toBe("inconclusivo");
    expect(resultado.jurosRemuneratorios.status).toBe("nao_identificado");
    expect(resultado.jurosMora.status).toBe("nao_identificado");
    expect(resultado.pontosAtencao.length).toBeGreaterThan(0);
  });

  it("deve detectar multa acima do limite de 2%", () => {
    const dados = { ...dadosConformes, taxaMulta: 5.0 };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.multa.status).toBe("nao_conforme");
    expect(resultado.alertas.some(a => a.includes("Multa"))).toBe(true);
  });

  it("deve incluir fundamentação legal correta para juros remuneratórios", () => {
    const resultado = analisarConformidadeContrato(dadosConformes);
    expect(resultado.jurosRemuneratorios.fundamentacao).toContain("Decreto nº 22.626/33");
    expect(resultado.jurosRemuneratorios.fundamentacao).toContain("12%");
  });

  it("deve incluir fundamentação legal correta para juros de mora", () => {
    const resultado = analisarConformidadeContrato(dadosConformes);
    expect(resultado.jurosMora.fundamentacao).toContain("Decreto-Lei nº 167/67");
    expect(resultado.jurosMora.fundamentacao).toContain("art. 5º");
  });

  it("deve retornar os limites máximos corretos", () => {
    const resultado = analisarConformidadeContrato(dadosConformes);
    expect(resultado.jurosRemuneratorios.limiteMaximo).toBe(12.0);
    expect(resultado.jurosMora.limiteMaximo).toBe(1.0);
    expect(resultado.multa.limiteMaximo).toBe(2.0);
  });

  it("deve retornar as taxas encontradas corretamente", () => {
    const resultado = analisarConformidadeContrato(dadosConformes);
    expect(resultado.jurosRemuneratorios.taxaEncontrada).toBe(7.0);
    expect(resultado.jurosMora.taxaEncontrada).toBe(1.0);
    expect(resultado.multa.taxaEncontrada).toBe(2.0);
  });

  it("deve adicionar ponto de atenção quando mora não é identificada", () => {
    const dados = { ...dadosConformes, taxaJurosMora: null };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.pontosAtencao.some(p => p.includes("mora"))).toBe(true);
  });

  it("deve tratar contrato com todas as taxas ilegais", () => {
    const dados = {
      ...dadosConformes,
      taxaJurosRemuneratorios: 24.0, // 24% a.a. — ilegal
      taxaJurosMora: 12.0,           // 12% a.a. — ilegal (deveria ser 1%)
      taxaMulta: 10.0,               // 10% — ilegal
    };
    const resultado = analisarConformidadeContrato(dados);
    expect(resultado.statusGeral).toBe("nao_conforme");
    expect(resultado.jurosRemuneratorios.status).toBe("nao_conforme");
    expect(resultado.jurosMora.status).toBe("nao_conforme");
    expect(resultado.multa.status).toBe("nao_conforme");
    expect(resultado.alertas.length).toBeGreaterThanOrEqual(3);
  });
});
