import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Campos SaaS
  plano: mysqlEnum("plano", ["free", "standard", "premium", "supreme", "admin"]).default("free").notNull(),
  planoExpiracao: timestamp("planoExpiracao"),
  calculosRealizados: int("calculosRealizados").default(0).notNull(),
  // Campos Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de histórico de cálculos de TCR
export const calculosTcr = mysqlTable("calculos_tcr", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),

  // Dados do financiamento
  nomeDevedor: varchar("nomeDevedor", { length: 255 }),
  numeroCedula: varchar("numeroCedula", { length: 100 }),
  modalidade: mysqlEnum("modalidade", ["custeio", "investimento", "comercializacao"]).notNull(),
  tipoTaxa: mysqlEnum("tipoTaxa", ["pre_fixada", "pos_fixada"]).notNull(),
  valorPrincipal: decimal("valorPrincipal", { precision: 18, scale: 2 }).notNull(),
  dataContratacao: timestamp("dataContratacao").notNull(),
  dataVencimento: timestamp("dataVencimento").notNull(),
  dataCalculo: timestamp("dataCalculo").notNull(),
  prazoMeses: int("prazoMeses").notNull(),

  // Taxas pactuadas
  taxaJurosRemuneratorios: decimal("taxaJurosRemuneratorios", { precision: 8, scale: 4 }).notNull(),
  taxaJurosMora: decimal("taxaJurosMora", { precision: 8, scale: 4 }),
  taxaMulta: decimal("taxaMulta", { precision: 8, scale: 4 }),

  // Componentes TCR
  fatorPrograma: decimal("fatorPrograma", { precision: 12, scale: 7 }),
  fatorAjuste: decimal("fatorAjuste", { precision: 12, scale: 7 }),
  fatorInflacaoImplicita: decimal("fatorInflacaoImplicita", { precision: 12, scale: 7 }),
  taxaJm: decimal("taxaJm", { precision: 8, scale: 4 }),
  ipcaAcumulado: decimal("ipcaAcumulado", { precision: 8, scale: 4 }),

  // Resultados
  saldoDevedorAtualizado: decimal("saldoDevedorAtualizado", { precision: 18, scale: 2 }),
  jurosRemuneratoriosCalculados: decimal("jurosRemuneratoriosCalculados", { precision: 18, scale: 2 }),
  jurosMoraCalculados: decimal("jurosMoraCalculados", { precision: 18, scale: 2 }),
  multaCalculada: decimal("multaCalculada", { precision: 18, scale: 2 }),
  totalDevido: decimal("totalDevido", { precision: 18, scale: 2 }),
  tcrEfetiva: decimal("tcrEfetiva", { precision: 8, scale: 4 }),

  // Análise de conformidade
  conformeLimiteRemuneratorios: mysqlEnum("conformeLimiteRemuneratorios", ["sim", "nao", "atencao"]).default("sim"),
  conformeLimiteMora: mysqlEnum("conformeLimiteMora", ["sim", "nao", "atencao"]).default("sim"),
  alertasConformidade: text("alertasConformidade"),

  // Memória de cálculo (JSON estruturado)
  memoriaCalculo: json("memoriaCalculo"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalculoTcr = typeof calculosTcr.$inferSelect;
export type InsertCalculoTcr = typeof calculosTcr.$inferInsert;

// ─── Perfil do Advogado ───────────────────────────────────────────────────────
export const perfilAdvogado = mysqlTable("perfil_advogado", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  oab: varchar("oab", { length: 30 }).notNull(),          // Ex: OAB/SP 123.456
  cpf: varchar("cpf", { length: 14 }),                    // Ex: 000.000.000-00
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  escritorio: varchar("escritorio", { length: 255 }),
  endereco: varchar("endereco", { length: 255 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 9 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerfilAdvogado = typeof perfilAdvogado.$inferSelect;
export type InsertPerfilAdvogado = typeof perfilAdvogado.$inferInsert;

// ─── Perfil do Perito Técnico ─────────────────────────────────────────────────
export const perfilPerito = mysqlTable("perfil_perito", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  // Categoria profissional
  categoria: mysqlEnum("categoria", [
    "contador",
    "economista",
    "administrador",
    "tecnico_contabil",
    "outro",
  ]).notNull(),
  // Registro profissional (CRC para contador/técnico, CRA para administrador, CORECON para economista)
  registroProfissional: varchar("registroProfissional", { length: 50 }).notNull(), // Ex: CRC/SP 123456
  cpf: varchar("cpf", { length: 14 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  empresa: varchar("empresa", { length: 255 }),
  endereco: varchar("endereco", { length: 255 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 9 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerfilPerito = typeof perfilPerito.$inferSelect;
export type InsertPerfilPerito = typeof perfilPerito.$inferInsert;

// ─── Cadeia de Contratos — Análise de Operação Mata-Mata e Aditivos ───────────

/**
 * Agrupa uma cadeia de contratos vinculados (contrato original + aditivos/refinanciamentos)
 * Permite detectar rolagem de dívida, capitalização indevida e operações "mata-mata"
 */
export const cadeiaContratos = mysqlTable("cadeia_contratos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),           // Ex: "Financiamento Safra 2020/2021 - Banco X"
  banco: varchar("banco", { length: 255 }).notNull(),
  descricao: text("descricao"),
  // Resultado da análise (salvo após geração do laudo)
  laudoGerado: text("laudoGerado"),
  laudoGeradoEm: timestamp("laudoGeradoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CadeiaContratos = typeof cadeiaContratos.$inferSelect;
export type InsertCadeiaContratos = typeof cadeiaContratos.$inferInsert;

/**
 * Cada contrato individual dentro de uma cadeia
 * Pode ser: contrato original, aditivo, refinanciamento, novação ou renegociação
 */
export const contratosCadeia = mysqlTable("contratos_cadeia", {
  id: int("id").autoincrement().primaryKey(),
  cadeiaId: int("cadeiaId").notNull(),
  ordem: int("ordem").notNull(),                              // 1 = original, 2 = primeiro aditivo, etc.
  tipo: mysqlEnum("tipo", [
    "original",         // Contrato original
    "aditivo",          // Aditivo ao contrato original (mesmo número, nova cláusula)
    "refinanciamento",  // Novo contrato para quitar o anterior (mata-mata)
    "novacao",          // Novação: extinção do anterior e criação de novo
    "renegociacao",     // Renegociação de prazo/encargos
  ]).notNull(),
  // Dados do contrato
  numeroContrato: varchar("numeroContrato", { length: 100 }).notNull(),
  dataContratacao: varchar("dataContratacao", { length: 20 }).notNull(),
  dataVencimento: varchar("dataVencimento", { length: 20 }).notNull(),
  modalidade: mysqlEnum("modalidade", ["custeio", "investimento", "comercializacao", "outro"]).notNull(),
  // Valores
  valorContrato: decimal("valorContrato", { precision: 18, scale: 2 }).notNull(),  // Valor nominal do novo contrato
  valorPrincipalOriginal: decimal("valorPrincipalOriginal", { precision: 18, scale: 2 }),  // Saldo devedor do contrato anterior (se houver)
  valorEncargosIncorporados: decimal("valorEncargosIncorporados", { precision: 18, scale: 2 }),  // Juros/multas embutidos no novo principal
  // Taxas
  taxaJurosAnual: decimal("taxaJurosAnual", { precision: 8, scale: 4 }).notNull(),
  taxaJurosMora: decimal("taxaJurosMora", { precision: 8, scale: 4 }),
  numeroParcelas: int("numeroParcelas"),
  sistemaAmortizacao: mysqlEnum("sistemaAmortizacao", ["price", "sac", "saf", "outro"]),
  // Garantias e observações
  garantias: text("garantias"),
  observacoes: text("observacoes"),
  // Análise automática
  alertasDetectados: json("alertasDetectados"),               // Array de strings com alertas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContratoCadeia = typeof contratosCadeia.$inferSelect;
export type InsertContratoCadeia = typeof contratosCadeia.$inferInsert;
