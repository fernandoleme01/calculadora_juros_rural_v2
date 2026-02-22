import Stripe from "stripe";
import { ENV } from "./_core/env";
import { PRODUTOS, PlanoId } from "./stripeProducts";

// Instância singleton do Stripe
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

/**
 * Cria ou recupera o Customer do Stripe para o usuário
 */
export async function obterOuCriarCustomer(
  userId: number,
  email: string | null | undefined,
  nome: string | null | undefined,
  stripeCustomerIdExistente?: string | null
): Promise<string> {
  const stripe = getStripe();

  if (stripeCustomerIdExistente) {
    // Verificar se o customer ainda existe no Stripe
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerIdExistente);
      if (!customer.deleted) return stripeCustomerIdExistente;
    } catch {
      // Customer não existe mais, criar novo
    }
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: nome ?? undefined,
    metadata: {
      userId: userId.toString(),
    },
  });

  return customer.id;
}

/**
 * Cria uma sessão de checkout do Stripe para assinatura
 */
export async function criarSessaoCheckout(params: {
  userId: number;
  email: string | null | undefined;
  nome: string | null | undefined;
  stripeCustomerId: string | null | undefined;
  planoId: PlanoId;
  periodicidade: "mensal" | "anual";
  origin: string;
}): Promise<{ url: string; customerId: string }> {
  const stripe = getStripe();
  const produto = PRODUTOS[params.planoId];

  // Garantir que o customer existe
  const customerId = await obterOuCriarCustomer(
    params.userId,
    params.email,
    params.nome,
    params.stripeCustomerId
  );

  // Criar o preço inline (sem necessidade de pré-criar no dashboard)
  const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
    currency: "brl",
    product_data: {
      name: produto.nome,
      description: produto.descricao,
    },
    unit_amount: params.periodicidade === "mensal" ? produto.precoMensal : produto.precoAnual,
    recurring: {
      interval: params.periodicidade === "mensal" ? "month" : "year",
    },
  };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price_data: priceData, quantity: 1 }],
    success_url: `${params.origin}/app/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/app/assinatura`,
    allow_promotion_codes: true,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      plano_id: params.planoId,
      periodicidade: params.periodicidade,
      customer_email: params.email ?? "",
      customer_name: params.nome ?? "",
    },
    subscription_data: {
      metadata: {
        user_id: params.userId.toString(),
        plano_id: params.planoId,
      },
    },
  });

  if (!session.url) throw new Error("Stripe não retornou URL de checkout");

  return { url: session.url, customerId };
}

/**
 * Cria uma sessão do Portal do Cliente Stripe (gerenciar assinatura)
 */
export async function criarPortalCliente(params: {
  stripeCustomerId: string;
  origin: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: `${params.origin}/app`,
  });

  return session.url;
}

/**
 * Processa eventos do webhook do Stripe
 * Retorna { planoId, stripeCustomerId, stripeSubscriptionId, userId } quando relevante
 */
export async function processarWebhookEvento(
  payload: Buffer,
  signature: string
): Promise<{
  tipo: string;
  userId?: number;
  planoId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  ativo?: boolean;
} | null> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado");
    return null;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Assinatura inválida:", err);
    throw new Error("Assinatura do webhook inválida");
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id ?? session.client_reference_id ?? "0");
      const planoId = session.metadata?.plano_id;
      const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (!userId || !planoId) {
        console.warn("[Stripe Webhook] checkout.session.completed sem userId ou planoId");
        return null;
      }

      return {
        tipo: "checkout.session.completed",
        userId,
        planoId,
        stripeCustomerId,
        stripeSubscriptionId,
        ativo: true,
      };
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = parseInt(subscription.metadata?.user_id ?? "0");
      const planoId = subscription.metadata?.plano_id;
      const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
      const ativo = subscription.status === "active" || subscription.status === "trialing";

      if (!userId) return null;

      return {
        tipo: "customer.subscription.updated",
        userId,
        planoId: ativo ? planoId : "free",
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        ativo,
      };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = parseInt(subscription.metadata?.user_id ?? "0");
      const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

      if (!userId) return null;

      return {
        tipo: "customer.subscription.deleted",
        userId,
        planoId: "free",
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        ativo: false,
      };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      console.warn(`[Stripe Webhook] Pagamento falhou para customer: ${stripeCustomerId}`);
      return { tipo: "invoice.payment_failed", stripeCustomerId };
    }

    default:
      console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
      return null;
  }
}
