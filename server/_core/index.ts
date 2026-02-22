import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { processarContratoRural } from "../analisadorContrato";
import { processarWebhookEvento } from "../stripeService";
import { atualizarPlanoStripe } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Webhook Stripe (DEVE vir ANTES do express.json) ─────────────────────
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      res.status(400).json({ error: "Assinatura Stripe ausente" });
      return;
    }
    try {
      const resultado = await processarWebhookEvento(req.body as Buffer, signature);
      if (resultado && resultado.userId && resultado.planoId) {
        await atualizarPlanoStripe({
          userId: resultado.userId,
          planoId: resultado.planoId as "free" | "standard" | "premium" | "supreme" | "admin",
          stripeCustomerId: resultado.stripeCustomerId,
          stripeSubscriptionId: resultado.stripeSubscriptionId,
        });
        console.log(`[Stripe Webhook] Plano atualizado: userId=${resultado.userId} → ${resultado.planoId}`);
      }
      res.json({ received: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no webhook";
      console.error("[Stripe Webhook] Erro:", msg);
      res.status(400).json({ error: msg });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // ─── Upload de PDF para análise de contrato ──────────────────────────────
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Apenas arquivos PDF são aceitos."));
      }
    },
  });

  app.post("/api/analisar-contrato", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhum arquivo PDF enviado." });
        return;
      }
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "Chave da API OpenAI não configurada." });
        return;
      }
      const resultado = await processarContratoRural(req.file.buffer, apiKey);
      res.json({ success: true, resultado });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno ao processar o contrato.";
      res.status(500).json({ error: msg });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
