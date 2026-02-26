import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ?? "https://jurosrurais.pro/api/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const openId = `google_${profile.id}`;
        const email = profile.emails?.[0]?.value ?? null;
        const name = profile.displayName ?? null;

        await db.upsertUser({
          openId,
          name,
          email,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });

        const user = await db.getUserByOpenId(openId);
        return done(null, user ?? false);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export function registerOAuthRoutes(app: Express) {
  app.use(passport.initialize());

  // Rota que inicia o fluxo de login com Google
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  // Callback do Google após autenticação
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/?error=auth_failed" }),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as { openId: string; name: string | null } | undefined;
        if (!user || !user.openId) {
          res.redirect("/?error=auth_failed");
          return;
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      } catch (error) {
        console.error("[Google OAuth] Callback failed", error);
        res.redirect("/?error=auth_failed");
      }
    }
  );

  // Compatibilidade com rota antiga
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/api/auth/google");
  });
}
