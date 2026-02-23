/**
 * formatters.ts — Módulo centralizado de formatação numérica defensiva
 *
 * Todas as funções aceitam `unknown` como entrada e garantem que:
 *   - null / undefined → valor neutro (0 ou string vazia, conforme o contexto)
 *   - string → parseFloat com fallback para 0 quando NaN
 *   - Infinity / -Infinity → 0
 *   - NaN → 0
 *
 * Isso evita o erro "TypeError: x.toFixed is not a function" que ocorre quando
 * o ORM (Drizzle/MySQL) serializa colunas DECIMAL como string, ou quando campos
 * opcionais chegam como undefined do backend.
 */

// ─── Núcleo ───────────────────────────────────────────────────────────────────

/**
 * Converte qualquer valor para number de forma segura.
 * Nunca retorna NaN, Infinity ou -Infinity — sempre retorna um número finito.
 *
 * @param value  Valor de entrada (qualquer tipo)
 * @param fallback  Valor retornado quando a conversão falha (padrão: 0)
 */
export function toNum(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return isFinite(n) ? n : fallback;
}

// ─── Moeda ────────────────────────────────────────────────────────────────────

/**
 * Formata um valor como moeda brasileira (R$).
 *
 * @example
 *   fmtBRL(1234.5)       → "R$ 1.234,50"
 *   fmtBRL("1234.5")     → "R$ 1.234,50"
 *   fmtBRL(undefined)    → "—"
 *   fmtBRL(null)         → "—"
 */
export function fmtBRL(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = toNum(value);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Formata um valor como moeda brasileira sem o símbolo R$.
 *
 * @example
 *   fmtBRLNum(1234.5)    → "1.234,50"
 */
export function fmtBRLNum(value: unknown, decimals = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  return toNum(value).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── Percentual ───────────────────────────────────────────────────────────────

/**
 * Formata um valor já em percentual (ex: 12.5 → "12.5000%").
 *
 * @param value     Valor percentual (ex: 12.5 para 12,5%)
 * @param decimals  Casas decimais (padrão: 4)
 *
 * @example
 *   fmtPct(12.5)         → "12.5000%"
 *   fmtPct("12.5", 2)    → "12.50%"
 *   fmtPct(undefined)    → "0.0000%"
 */
export function fmtPct(value: unknown, decimals = 4): string {
  return `${toNum(value).toFixed(decimals)}%`;
}

/**
 * Formata um valor em fração (0–1) como percentual (ex: 0.125 → "12.5000%").
 *
 * @param value     Valor fracionário (ex: 0.125 para 12,5%)
 * @param decimals  Casas decimais (padrão: 4)
 *
 * @example
 *   fmtPctFrac(0.125)    → "12.5000%"
 *   fmtPctFrac(0.125, 2) → "12.50%"
 */
export function fmtPctFrac(value: unknown, decimals = 4): string {
  return `${(toNum(value) * 100).toFixed(decimals)}%`;
}

// ─── Número genérico ──────────────────────────────────────────────────────────

/**
 * Formata um número com casas decimais fixas.
 *
 * @example
 *   fmtFixed(1.23456789, 6)  → "1.234568"
 *   fmtFixed(undefined, 2)   → "0.00"
 */
export function fmtFixed(value: unknown, decimals = 2): string {
  return toNum(value).toFixed(decimals);
}

/**
 * Formata um número com separadores de milhar no padrão pt-BR.
 *
 * @example
 *   fmtNum(1234567.89, 2)  → "1.234.567,89"
 */
export function fmtNum(value: unknown, decimals = 2): string {
  return toNum(value).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── Data ─────────────────────────────────────────────────────────────────────

/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA).
 *
 * @example
 *   fmtDate("2024-03-15")  → "15/03/2024"
 *   fmtDate(null)          → "—"
 */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

/**
 * Formata uma data com hora no padrão brasileiro.
 *
 * @example
 *   fmtDateTime("2024-03-15T14:30:00Z")  → "15/03/2024 11:30"
 */
export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}
