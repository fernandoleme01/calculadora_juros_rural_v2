import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Cookie, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "jurosrurais_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Pequeno delay para não aparecer imediatamente ao carregar
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "essential_only");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur shadow-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 rounded-lg bg-amber-500/10 p-2">
              <Cookie className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                Utilizamos cookies
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usamos cookies essenciais para o funcionamento da plataforma e cookies de analytics
                para melhorar a experiência. Seus dados são tratados conforme nossa{" "}
                <Link href="/privacidade" className="text-amber-500 hover:underline font-medium">
                  Política de Privacidade
                </Link>{" "}
                e a Lei 13.709/2018 (LGPD).
              </p>
            </div>
            <button
              onClick={decline}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 ml-0 sm:ml-11">
            <Button
              onClick={accept}
              size="sm"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black gap-2"
            >
              <Check className="h-3.5 w-3.5" />
              Aceitar todos
            </Button>
            <Button
              onClick={decline}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs"
            >
              Somente essenciais
            </Button>
            <Link href="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors sm:ml-auto">
              Saiba mais
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
