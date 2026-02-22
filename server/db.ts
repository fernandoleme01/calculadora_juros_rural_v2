import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, calculosTcr, InsertCalculoTcr } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Cálculos TCR ───────────────────────────────────────────────────────────

export async function salvarCalculo(dados: InsertCalculoTcr) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calculosTcr).values(dados);
  return result;
}

export async function listarCalculos(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = db.select().from(calculosTcr).orderBy(desc(calculosTcr.createdAt)).limit(50);
  return await query;
}

export async function listarCalculosPorUsuario(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(calculosTcr)
    .where(eq(calculosTcr.userId, userId))
    .orderBy(desc(calculosTcr.createdAt))
    .limit(50);
}

export async function buscarCalculoPorId(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(calculosTcr).where(eq(calculosTcr.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function deletarCalculo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(calculosTcr).where(eq(calculosTcr.id, id));
}

// ─── Controle de Plano e Laudos ─────────────────────────────────────────────

/** Limites de laudos por plano (total acumulado para free, mensal para pagos) */
export const LIMITES_LAUDO = {
  standard: 10,
  premium: 25,
  supreme: Infinity,
  admin: Infinity,
  free: 1, // legado — 1 laudo total
} as const;

/** Retorna o plano e laudos usados do usuário */
export async function getPlanoUsuario(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({
    plano: users.plano,
    calculosRealizados: users.calculosRealizados,
    planoExpiracao: users.planoExpiracao,
  }).from(users).where(eq(users.id, userId)).limit(1);
  if (!result.length) throw new Error("Usuário não encontrado");
  const u = result[0]!;
  const limite = LIMITES_LAUDO[u.plano as keyof typeof LIMITES_LAUDO] ?? 1;
  // Para planos pagos, conta laudos do mês corrente
  let laudosMes = 0;
  if (u.plano !== 'standard' || true) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const [row] = await db.select({ count: sql<number>`count(*)` })
      .from(calculosTcr)
      .where(eq(calculosTcr.userId, userId));
    laudosMes = Number(row?.count ?? 0);
  }
  const planoStr = u.plano as string;
  const podeGerar = planoStr === 'supreme' || planoStr === 'admin'
    ? true
    : u.calculosRealizados < limite;
  // Free: 1 laudo total, sem PDF e sem impressão
  // Standard: 10 laudos/mês, com PDF e impressão
  // Premium/Supreme/Admin: sem restrição
  const podePDF = planoStr !== 'free';
  const podeImprimir = planoStr !== 'free';
  return {
    plano: u.plano,
    laudosUsados: u.calculosRealizados,
    laudosMes,
    limite,
    podeGerar,
    podePDF,
    podeImprimir,
    planoExpiracao: u.planoExpiracao,
  };
}

/** Incrementa o contador de laudos do usuário */
export async function incrementarLaudos(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({ calculosRealizados: sql`${users.calculosRealizados} + 1` })
    .where(eq(users.id, userId));
}

// ─── Administração ──────────────────────────────────────────────────────────

/** Lista todos os usuários com seus dados de plano e uso */
export async function listarTodosUsuarios() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    openId: users.openId,
    role: users.role,
    plano: users.plano,
    planoExpiracao: users.planoExpiracao,
    calculosRealizados: users.calculosRealizados,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

/** Altera o plano de um usuário */
export async function alterarPlanoUsuario(
  userId: number,
  novoPlano: "standard" | "premium" | "supreme" | "admin",
  expiracao?: Date | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({
      plano: novoPlano,
      planoExpiracao: expiracao ?? null,
      calculosRealizados: 0, // Zera o contador ao trocar de plano
    })
    .where(eq(users.id, userId));
}

/** Reseta o contador de laudos de um usuário */
export async function resetarLaudosUsuario(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({ calculosRealizados: 0 })
    .where(eq(users.id, userId));
}

/** Estatísticas gerais para o painel admin */
export async function getEstatisticasAdmin() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [totalUsuarios] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalLaudos] = await db.select({ count: sql<number>`count(*)` }).from(calculosTcr);

  // Usuários por plano
  const porPlano = await db.select({
    plano: users.plano,
    count: sql<number>`count(*)`,
  }).from(users).groupBy(users.plano);

  // Laudos gerados no mês corrente
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const [laudosMes] = await db.select({ count: sql<number>`count(*)` })
    .from(calculosTcr)
    .where(sql`${calculosTcr.createdAt} >= ${inicioMes}`);

  // Últimos 5 usuários cadastrados
  const ultimosCadastros = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    plano: users.plano,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(5);

  // Receita estimada por plano (valores em centavos para evitar float)
  const PRECOS: Record<string, number> = {
    standard: 14900,
    premium: 32900,
    supreme: 199000,
    admin: 0,
  };

  const receitaEstimada = porPlano.reduce((acc, row) => {
    const preco = PRECOS[row.plano as string] ?? 0;
    return acc + (Number(row.count) * preco);
  }, 0);

  return {
    totalUsuarios: Number(totalUsuarios?.count ?? 0),
    totalLaudos: Number(totalLaudos?.count ?? 0),
    laudosMes: Number(laudosMes?.count ?? 0),
    porPlano: porPlano.map(r => ({ plano: r.plano, count: Number(r.count) })),
    ultimosCadastros,
    receitaEstimadaCentavos: receitaEstimada,
    receitaEstimadaReais: receitaEstimada / 100,
  };
}

/** Atualiza o plano do usuário após confirmação de pagamento pelo Stripe */
export async function atualizarPlanoStripe(params: {
  userId: number;
  planoId: "free" | "standard" | "premium" | "supreme" | "admin";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    plano: params.planoId,
    calculosRealizados: 0, // Zera o contador ao ativar novo plano
  };

  if (params.stripeCustomerId) {
    updateData.stripeCustomerId = params.stripeCustomerId;
  }
  if (params.stripeSubscriptionId) {
    updateData.stripeSubscriptionId = params.stripeSubscriptionId;
  }

  // Define expiração para planos pagos (30 dias a partir de hoje para mensal)
  if (params.planoId !== "free") {
    const expiracao = new Date();
    expiracao.setMonth(expiracao.getMonth() + 1);
    updateData.planoExpiracao = expiracao;
  } else {
    updateData.planoExpiracao = null;
  }

  await db.update(users)
    .set(updateData as Parameters<typeof db.update>[0] extends { set: infer S } ? S : never)
    .where(eq(users.id, params.userId));
}

/** Atualiza apenas os IDs Stripe do usuário (stripeCustomerId) */
export async function salvarStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({ stripeCustomerId })
    .where(eq(users.id, userId));
}
