/**
 * Testes para o módulo de Perfil Profissional e Amortização
 */

import { describe, it, expect } from "vitest";
import {
  calcularAmortizacao,
  taxaAnualParaPeriodica,
  calcularPrestacaoPrice,
  gerarPlanilhaPrice,
  gerarPlanilhaSAC,
  gerarPlanilhaSAF,
} from "./amortizacao";

// ─── Testes de conversão de taxa ──────────────────────────────────────────────

describe("taxaAnualParaPeriodica", () => {
  it("deve retornar taxa anual direta para periodicidade anual", () => {
    const taxa = taxaAnualParaPeriodica(12, "anual");
    expect(taxa).toBeCloseTo(0.12, 6);
  });

  it("deve converter taxa anual para mensal por capitalização composta", () => {
    const taxa = taxaAnualParaPeriodica(12, "mensal");
    // (1 + 0.12)^(1/12) - 1 ≈ 0.009489
    expect(taxa).toBeCloseTo(0.009489, 4);
  });

  it("deve retornar 0 para taxa 0% anual", () => {
    const taxa = taxaAnualParaPeriodica(0, "anual");
    expect(taxa).toBe(0);
  });
});

// ─── Testes de prestação Price ────────────────────────────────────────────────

describe("calcularPrestacaoPrice", () => {
  it("deve calcular prestação correta para 12% a.a. anual, 5 parcelas, R$ 100.000", () => {
    const prestacao = calcularPrestacaoPrice(100000, 0.12, 5);
    // PMT = 100000 * [0.12 * (1.12)^5] / [(1.12)^5 - 1]
    // (1.12)^5 = 1.76234
    // PMT = 100000 * (0.12 * 1.76234) / (1.76234 - 1) = 100000 * 0.21148 / 0.76234 ≈ 27740.97
    expect(prestacao).toBeCloseTo(27740.97, 0);
  });

  it("deve retornar principal/n quando taxa é 0", () => {
    const prestacao = calcularPrestacaoPrice(60000, 0, 6);
    expect(prestacao).toBeCloseTo(10000, 2);
  });
});

// ─── Testes do sistema Price ──────────────────────────────────────────────────

describe("gerarPlanilhaPrice", () => {
  it("deve gerar planilha com número correto de linhas", () => {
    const planilha = gerarPlanilhaPrice(100000, 0.12, 5, 0.12);
    expect(planilha).toHaveLength(5);
  });

  it("deve ter saldo final zero na última parcela (Price)", () => {
    const planilha = gerarPlanilhaPrice(100000, 0.12, 5, 0.12);
    expect(planilha[4].saldoFinal).toBeCloseTo(0, 0);
  });

  it("deve ter prestações iguais em todas as linhas (Price)", () => {
    const planilha = gerarPlanilhaPrice(100000, 0.12, 5, 0.12);
    const primeiraPrestacao = planilha[0].prestacao;
    planilha.forEach(linha => {
      expect(linha.prestacao).toBeCloseTo(primeiraPrestacao, 2);
    });
  });

  it("deve calcular excesso corretamente quando taxa contratada > taxa legal", () => {
    // Taxa contratada: 15% a.a., taxa legal: 12% a.a.
    const planilha = gerarPlanilhaPrice(100000, 0.15, 5, 0.12);
    planilha.forEach(linha => {
      expect(linha.excessoCobrado).toBeGreaterThan(0);
    });
  });

  it("deve ter excesso zero quando taxa contratada = taxa legal", () => {
    const planilha = gerarPlanilhaPrice(100000, 0.12, 5, 0.12);
    planilha.forEach(linha => {
      expect(linha.excessoCobrado).toBeCloseTo(0, 6);
    });
  });
});

// ─── Testes do sistema SAC ────────────────────────────────────────────────────

describe("gerarPlanilhaSAC", () => {
  it("deve gerar planilha com número correto de linhas", () => {
    const planilha = gerarPlanilhaSAC(100000, 0.12, 5, 0.12);
    expect(planilha).toHaveLength(5);
  });

  it("deve ter amortização constante em todas as linhas (SAC)", () => {
    const planilha = gerarPlanilhaSAC(100000, 0.12, 5, 0.12);
    const amortizacaoConstante = planilha[0].amortizacao;
    planilha.forEach(linha => {
      expect(linha.amortizacao).toBeCloseTo(amortizacaoConstante, 2);
    });
  });

  it("deve ter prestações decrescentes no SAC", () => {
    const planilha = gerarPlanilhaSAC(100000, 0.12, 5, 0.12);
    for (let i = 1; i < planilha.length; i++) {
      expect(planilha[i].prestacao).toBeLessThan(planilha[i - 1].prestacao);
    }
  });

  it("deve ter saldo final zero na última parcela (SAC)", () => {
    const planilha = gerarPlanilhaSAC(100000, 0.12, 5, 0.12);
    expect(planilha[4].saldoFinal).toBeCloseTo(0, 0);
  });
});

// ─── Testes do sistema SAF ────────────────────────────────────────────────────

describe("gerarPlanilhaSAF", () => {
  it("deve gerar planilha com número correto de linhas", () => {
    const planilha = gerarPlanilhaSAF(100000, 0.12, 5, 0.12);
    expect(planilha).toHaveLength(5);
  });

  it("deve ter saldo final próximo de zero na última parcela (SAF)", () => {
    const planilha = gerarPlanilhaSAF(100000, 0.12, 5, 0.12);
    expect(planilha[4].saldoFinal).toBeCloseTo(0, 0);
  });
});

// ─── Testes de calcularAmortizacao (função principal) ─────────────────────────

describe("calcularAmortizacao", () => {
  it("deve calcular amortização Price anual corretamente", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 12,
      numeroParcelas: 5,
      parcelasPagas: 0,
      sistema: "price",
      periodicidade: "anual",
    });

    expect(resultado.valorPrincipal).toBe(100000);
    expect(resultado.taxaJurosAnual).toBe(12);
    expect(resultado.numeroParcelas).toBe(5);
    expect(resultado.parcelasPagas).toBe(0);
    expect(resultado.sistema).toBe("price");
    expect(resultado.planilha).toHaveLength(5);
    expect(resultado.saldoDevedorAtual).toBeCloseTo(100000, 0); // 0 parcelas pagas = saldo inicial
    expect(resultado.excessoTotal).toBeCloseTo(0, 2); // taxa = limite legal
  });

  it("deve detectar excesso quando taxa > 12% a.a. (com parcelas pagas)", () => {
    // excessoTotal é calculado sobre as parcelas já pagas
    // Com parcelasPagas: 3, há 3 períodos de juros para comparar
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 18, // 50% acima do limite legal
      numeroParcelas: 5,
      parcelasPagas: 3,
      sistema: "price",
      periodicidade: "anual",
    });

    expect(resultado.excessoTotal).toBeGreaterThan(0);
    expect(resultado.totalJuros).toBeGreaterThan(resultado.totalJurosLegal);
  });

  it("deve calcular saldo devedor após parcelas pagas", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 12,
      numeroParcelas: 5,
      parcelasPagas: 2,
      sistema: "sac",
      periodicidade: "anual",
    });

    // SAC: amortização constante = 100000/5 = 20000 por parcela
    // Após 2 parcelas: saldo = 100000 - 2*20000 = 60000
    expect(resultado.saldoDevedorAtual).toBeCloseTo(60000, 0);
  });

  it("deve incluir memória de cálculo", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 12,
      numeroParcelas: 5,
      parcelasPagas: 0,
      sistema: "price",
      periodicidade: "anual",
    });

    expect(resultado.memoriaCalculo).toBeInstanceOf(Array);
    expect(resultado.memoriaCalculo.length).toBeGreaterThan(0);
  });

  it("deve incluir fundamentação legal", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 12,
      numeroParcelas: 5,
      parcelasPagas: 0,
      sistema: "price",
      periodicidade: "anual",
    });

    expect(resultado.fundamentacao).toBeDefined();
    expect(resultado.fundamentacao.normas).toBeInstanceOf(Array);
    expect(resultado.fundamentacao.normas.length).toBeGreaterThan(0);
    expect(resultado.fundamentacao.jurisprudencia).toBeInstanceOf(Array);
  });

  it("deve calcular corretamente com periodicidade mensal", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 60000,
      taxaJurosAnual: 12,
      numeroParcelas: 12,
      parcelasPagas: 0,
      sistema: "price",
      periodicidade: "mensal",
    });

    expect(resultado.planilha).toHaveLength(12);
    // Taxa mensal ≈ 0.9489% (capitalização composta)
    expect(resultado.taxaPeriodica).toBeCloseTo(0.009489, 4);
  });

  it("deve emitir alerta quando taxa > 12% a.a.", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 15,
      numeroParcelas: 5,
      parcelasPagas: 0,
      sistema: "price",
      periodicidade: "anual",
    });

    expect(resultado.fundamentacao.alertas.length).toBeGreaterThan(0);
    const alertaJuros = resultado.fundamentacao.alertas.some(a =>
      a.includes("12%") || a.includes("limite") || a.includes("Usura")
    );
    expect(alertaJuros).toBe(true);
  });

  it("deve processar valores pagos quando fornecidos", () => {
    const resultado = calcularAmortizacao({
      valorPrincipal: 100000,
      taxaJurosAnual: 12,
      numeroParcelas: 3,
      parcelasPagas: 2,
      sistema: "price",
      periodicidade: "anual",
      valoresPagos: [30000, 35000, 0],
    });

    expect(resultado.planilha[0].valorPago).toBe(30000);
    expect(resultado.planilha[1].valorPago).toBe(35000);
    expect(resultado.planilha[0].diferencaPago).toBeDefined();
  });
});
