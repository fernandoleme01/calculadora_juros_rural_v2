import { describe, expect, it } from "vitest";
import {
  calcularTCRPos,
  calcularTCRPre,
  analisarConformidade,
  calcularFAM,
  calcularFII,
  calcularDiasCorridos,
  calcularMeses,
  LIMITE_JUROS_REMUNERATORIOS_AA,
  LIMITE_JUROS_MORA_AA,
} from "./calculoTcr";

// ─── Testes de Funções Auxiliares ────────────────────────────────────────────

describe("calcularDiasCorridos", () => {
  it("deve calcular dias corridos entre duas datas", () => {
    const inicio = new Date("2024-01-01");
    const fim = new Date("2024-07-01");
    const dias = calcularDiasCorridos(inicio, fim);
    expect(dias).toBe(182);
  });

  it("deve retornar 0 para datas iguais", () => {
    const data = new Date("2024-01-01");
    expect(calcularDiasCorridos(data, data)).toBe(0);
  });
});

describe("calcularMeses", () => {
  it("deve calcular meses entre duas datas", () => {
    const inicio = new Date("2024-01-01");
    const fim = new Date("2024-07-01");
    expect(calcularMeses(inicio, fim)).toBe(6);
  });

  it("deve calcular meses entre anos diferentes", () => {
    const inicio = new Date("2023-06-01");
    const fim = new Date("2024-06-01");
    expect(calcularMeses(inicio, fim)).toBe(12);
  });
});

describe("calcularFAM", () => {
  it("deve calcular o FAM com variações mensais do IPCA", () => {
    // IPCA de 0.44% ao mês por 3 meses
    const ipcaMensal = [0.44, 0.44, 0.44];
    const fam = calcularFAM(ipcaMensal);
    // FAM = (1.0044)^3 ≈ 1.013258
    expect(fam).toBeCloseTo(1.013258, 4);
  });

  it("deve retornar 1 para array vazio", () => {
    expect(calcularFAM([])).toBe(1);
  });

  it("deve calcular corretamente com variações diferentes", () => {
    const ipcaMensal = [0.50, 0.30, 0.45];
    const fam = calcularFAM(ipcaMensal);
    const expected = 1.005 * 1.003 * 1.0045;
    expect(fam).toBeCloseTo(expected, 6);
  });
});

describe("calcularFII", () => {
  it("deve calcular o FII corretamente", () => {
    // FII = (1 + PRE/100) / (1 + Jm/100)
    const fii = calcularFII(13.5, 8.0);
    const expected = 1.135 / 1.08;
    expect(fii).toBeCloseTo(expected, 6);
  });

  it("deve retornar 1 quando Jm é 0", () => {
    expect(calcularFII(10, 0)).toBe(1);
  });
});

// ─── Testes de Conformidade Legal ────────────────────────────────────────────

describe("analisarConformidade", () => {
  it("deve retornar conforme para taxas dentro dos limites legais", () => {
    const resultado = analisarConformidade(8.0, 1.0, 8.0);
    expect(resultado.limiteRemuneratorios).toBe("conforme");
    expect(resultado.limiteMora).toBe("conforme");
    expect(resultado.alertas).toHaveLength(0);
  });

  it("deve retornar nao_conforme para juros remuneratórios acima de 12% a.a.", () => {
    const resultado = analisarConformidade(15.0, 1.0, 15.0);
    expect(resultado.limiteRemuneratorios).toBe("nao_conforme");
    expect(resultado.alertas.length).toBeGreaterThan(0);
    expect(resultado.alertas[0]).toContain("EXCEDE o limite legal");
  });

  it("deve retornar nao_conforme para juros de mora acima de 1% a.a.", () => {
    const resultado = analisarConformidade(10.0, 12.0, 10.0); // 12% a.a. de mora
    expect(resultado.limiteMora).toBe("nao_conforme");
    expect(resultado.alertas.some(a => a.includes("mora"))).toBe(true);
  });

  it("deve retornar atencao para taxas próximas do limite (>90% do limite)", () => {
    // 11% é > 90% de 12%
    const resultado = analisarConformidade(11.0, 1.0, 11.0);
    expect(resultado.limiteRemuneratorios).toBe("atencao");
  });

  it("deve verificar os limites legais corretos", () => {
    expect(LIMITE_JUROS_REMUNERATORIOS_AA).toBe(12.0);
    expect(LIMITE_JUROS_MORA_AA).toBe(1.0);
  });
});

// ─── Testes de Cálculo TCRpós ────────────────────────────────────────────────

describe("calcularTCRPos", () => {
  const dadosBase = {
    valorPrincipal: 100000,
    dataContratacao: new Date("2024-01-01"),
    dataVencimento: new Date("2025-01-01"),
    dataCalculo: new Date("2024-07-01"),
    prazoMeses: 12,
    taxaJurosRemuneratorios: 7.0,
    taxaJurosMora: 1.0,
    taxaMulta: 2.0,
    tipoTaxa: "pos_fixada" as const,
    modalidade: "custeio" as const,
    ipcaMensal: [0.44, 0.44, 0.44, 0.44, 0.44, 0.44], // 6 meses
    fatorPrograma: 0.1896008,
    fatorAjuste: 0,
  };

  it("deve calcular o saldo devedor atualizado corretamente", () => {
    const resultado = calcularTCRPos(dadosBase);
    expect(resultado.saldoDevedorAtualizado).toBeGreaterThan(dadosBase.valorPrincipal);
    expect(resultado.fam).toBeGreaterThan(1);
  });

  it("deve retornar o valor principal original", () => {
    const resultado = calcularTCRPos(dadosBase);
    expect(resultado.valorPrincipal).toBe(100000);
  });

  it("deve calcular juros remuneratórios positivos", () => {
    const resultado = calcularTCRPos(dadosBase);
    expect(resultado.jurosRemuneratorios).toBeGreaterThan(0);
  });

  it("deve retornar total devido maior que o principal", () => {
    const resultado = calcularTCRPos(dadosBase);
    expect(resultado.totalDevido).toBeGreaterThan(dadosBase.valorPrincipal);
  });

  it("deve retornar conformidade para taxa de 7% a.a.", () => {
    const resultado = calcularTCRPos(dadosBase);
    expect(resultado.conformidade.limiteRemuneratorios).toBe("conforme");
    expect(resultado.conformidade.limiteMora).toBe("conforme");
  });

  it("deve detectar não conformidade para taxa acima de 12% a.a.", () => {
    const dadosIlegais = { ...dadosBase, taxaJurosRemuneratorios: 18.0 };
    const resultado = calcularTCRPos(dadosIlegais);
    expect(resultado.conformidade.limiteRemuneratorios).toBe("nao_conforme");
  });

  it("deve gerar memória de cálculo com etapas", () => {
    const resultado = calcularTCRPos(dadosBase);
    expect(resultado.memoriaCalculo.etapas.length).toBeGreaterThan(0);
    expect(resultado.memoriaCalculo.fundamentacaoLegal.normas.length).toBeGreaterThan(0);
    expect(resultado.memoriaCalculo.jurisprudencia.length).toBeGreaterThan(0);
  });

  it("deve calcular juros de mora quando há inadimplência", () => {
    // Data de cálculo após o vencimento
    const dadosInadimplente = {
      ...dadosBase,
      dataVencimento: new Date("2024-06-01"),
      dataCalculo: new Date("2024-07-01"),
    };
    const resultado = calcularTCRPos(dadosInadimplente);
    expect(resultado.jurosMora).toBeGreaterThan(0);
  });
});

// ─── Testes de Cálculo TCRpré ────────────────────────────────────────────────

describe("calcularTCRPre", () => {
  const dadosBase = {
    valorPrincipal: 100000,
    dataContratacao: new Date("2024-01-01"),
    dataVencimento: new Date("2025-01-01"),
    dataCalculo: new Date("2024-07-01"),
    prazoMeses: 12,
    taxaJurosRemuneratorios: 8.0,
    taxaJurosMora: 1.0,
    taxaMulta: 2.0,
    tipoTaxa: "pre_fixada" as const,
    modalidade: "investimento" as const,
    taxaJm: 8.0,
    fatorInflacaoImplicita: 1.05,
    fatorPrograma: 0.1896008,
    fatorAjuste: 0,
  };

  it("deve calcular o saldo devedor atualizado com taxa prefixada", () => {
    const resultado = calcularTCRPre(dadosBase);
    expect(resultado.saldoDevedorAtualizado).toBeGreaterThan(dadosBase.valorPrincipal);
  });

  it("deve usar o FII no cálculo da TCRpré", () => {
    const resultado = calcularTCRPre(dadosBase);
    expect(resultado.fii).toBe(1.05);
  });

  it("deve retornar conformidade para taxa de 8% a.a.", () => {
    const resultado = calcularTCRPre(dadosBase);
    expect(resultado.conformidade.limiteRemuneratorios).toBe("conforme");
  });

  it("deve gerar memória de cálculo com fundamentação legal", () => {
    const resultado = calcularTCRPre(dadosBase);
    expect(resultado.memoriaCalculo.fundamentacaoLegal.normas).toContain(
      "Resolução CMN nº 4.913/2021 - Metodologia TCRpré"
    );
  });
});
