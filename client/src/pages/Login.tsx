import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Shield, FileText, TrendingUp, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Se já autenticado, redireciona para o painel
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo LoboLab */}
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">LoboLab</p>
            <p className="text-slate-400 text-xs">Advocacia & Tecnologia Jurídica</p>
          </div>
        </div>
        <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs hidden sm:flex">
          Em conformidade com a Lei 4.829/65 · DL 167/67
        </Badge>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Card de login */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
            {/* Logo central */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Juros Rurais Pro</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Plataforma técnico-jurídica de crédito rural
                </p>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-white/10" />

            {/* Apresentação */}
            <div className="space-y-3">
              <p className="text-slate-300 text-sm text-center">
                Acesse a plataforma para calcular TCR, analisar contratos, gerar laudos periciais e petições de revisão contratual.
              </p>

              {/* Features resumidas */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: TrendingUp, label: "Calculadora TCR" },
                  { icon: FileText, label: "Laudo Pericial" },
                  { icon: Shield, label: "Conformidade Legal" },
                  { icon: Scale, label: "Gerador de Petição" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão de acesso */}
            <Button
              onClick={handleLogin}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold h-12 text-base shadow-lg"
              disabled={loading}
            >
              {loading ? (
                "Verificando..."
              ) : (
                <>
                  Acessar o Sistema
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {/* Segurança */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              <span>Acesso seguro via autenticação OAuth</span>
            </div>
          </div>

          {/* Rodapé do card */}
          <div className="text-center space-y-2">
            <p className="text-slate-500 text-xs">
              Em conformidade com a Lei 4.829/65 · DL 167/67 · Resoluções CMN
            </p>
            <p className="text-slate-600 text-xs">
              © 2026 LoboLab Advocacia & Tecnologia Jurídica · JurosRurais.pro
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
