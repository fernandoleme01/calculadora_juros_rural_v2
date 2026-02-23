import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Resolve o caminho do diretório de build do cliente.
 * Tenta múltiplos candidatos para garantir compatibilidade em todos os
 * ambientes de produção.
 */
function resolveDistPath(): string {
  const candidates = [
    // Quando o bundle está em dist/index.js → dist/public
    path.resolve(import.meta.dirname, "public"),
    // Quando executado a partir da raiz do projeto
    path.resolve(import.meta.dirname, "../..", "dist", "public"),
    // Caminho absoluto baseado em process.cwd()
    path.resolve(process.cwd(), "dist", "public"),
    // Fallback: um nível acima do dirname
    path.resolve(import.meta.dirname, "..", "public"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      console.log(`[serveStatic] distPath resolvido: ${candidate}`);
      return candidate;
    }
  }

  const fallback = candidates[0];
  console.error(
    `[serveStatic] AVISO: index.html não encontrado. Candidatos testados:\n` +
    candidates.map((c) => `  - ${c}`).join("\n") +
    `\nUsando fallback: ${fallback}`
  );
  return fallback;
}

export function serveStatic(app: Express) {
  const distPath = resolveDistPath();
  const indexPath = path.resolve(distPath, "index.html");

  // Health check — confirma que o Express está respondendo
  app.get("/__health", (_req, res) => {
    res.json({
      status: "ok",
      distPath,
      indexExists: fs.existsSync(indexPath),
      cwd: process.cwd(),
      dirname: import.meta.dirname,
    });
  });

  // Arquivos estáticos (JS, CSS, assets)
  app.use(express.static(distPath));

  // SPA fallback: qualquer GET que não seja API ou arquivo estático
  // Usar app.get em vez de app.use para evitar conflitos com outros métodos
  app.get("*", (_req, res) => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send(
        `[Juros Rurais Pro] Erro: index.html não encontrado em ${indexPath}. ` +
        `Verifique o build do cliente.`
      );
    }
  });
}
