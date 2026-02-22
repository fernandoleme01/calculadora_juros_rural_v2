import {
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
