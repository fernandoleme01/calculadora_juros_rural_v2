import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, X, Zap, Star, Crown, CreditCard, Settings, ArrowRight, Shield } from "lucide-react";

const PLANOS_CONFIG = [
  {
    id: "standard" as const,
    nome: "Standard",
    icon: Zap,
    cor: "text-blue-600",
    bgCor: "bg-blue-50 border-blue-200",
    destaque: false,
    laudosPorMes: 10,
    precoMensal: 149,
    precoAnual: 111.75, // 149 * 0.75
    recursos: [
      { texto: "10 laudos técnico-jurídicos/mês", incluido: true },
      { texto: "Calculadora TCR pré e pós-fixada", incluido: true },
      { texto: "Análise de contratos PDF (OCR)", incluido: true },
      { texto: "Gerador de petição de revisão", incluido: true },
      { texto: "Dados do BCB em tempo real", incluido: true },
      { texto: "Exportação em PDF", incluido: true },
      { texto: "Laudos ilimitados", incluido: false },
      { texto: "Suporte prioritário", incluido: false },
    ],
  },
  {
    id: "premium" as const,
    nome: "Premium",
    icon: Star,
    cor: "text-amber-600",
    bgCor: "bg-amber-50 border-amber-300",
    destaque: true,
    laudosPorMes: 25,
    precoMensal: 329,
    precoAnual: 246.75, // 329 * 0.75
    recursos: [
      { texto: "25 laudos técnico-jurídicos/mês", incluido: true },
      { texto: "Calculadora TCR pré e pós-fixada", incluido: true },
      { texto: "Análise de contratos PDF (OCR)", incluido: true },
      { texto: "Gerador de petição de revisão", incluido: true },
      { texto: "Dados do BCB em tempo real", incluido: true },
      { texto: "Exportação em PDF", incluido: true },
      { texto: "Jurisprudência real com nº de processos", incluido: true },
      { texto: "Suporte prioritário", incluido: true },
    ],
  },
  {
    id: "supreme" as const,
    nome: "Supreme",
    icon: Crown,
    cor: "text-purple-600",
    bgCor: "bg-purple-50 border-purple-300",
    destaque: false,
    laudosPorMes: null,
    precoMensal: 1990,
    precoAnual: 1492.5, // 1990 * 0.75
    recursos: [
      { texto: "Laudos ilimitados por mês", incluido: true },
      { texto: "Calculadora TCR pré e pós-fixada", incluido: true },
      { texto: "Análise de contratos PDF (OCR)", incluido: true },
      { texto: "Gerador de petição de revisão", incluido: true },
      { texto: "Dados do BCB em tempo real", incluido: true },
      { texto: "Exportação em PDF", incluido: true },
      { texto: "Jurisprudência real com nº de processos", incluido: true },
      { texto: "Suporte prioritário (SLA 4h)", incluido: true },
    ],
  },
];

export default function Assinatura() {
  const { user } = useAuth();
  const [periodicidade, setPeriodicidade] = useState<"mensal" | "anual">("mensal");
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null);

  const { data: planoAtual } = trpc.plano.meuPlano.useQuery(undefined, {
    enabled: !!user,
  });

  const criarCheckout = trpc.assinatura.criarCheckout.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
      toast.success("Redirecionando para o checkout seguro...");
      setLoadingPlano(null);
    },
    onError: (err) => {
      toast.error(`Erro ao iniciar checkout: ${err.message}`);
      setLoadingPlano(null);
    },
  });

  const abrirPortal = trpc.assinatura.abrirPortal.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
      toast.success("Abrindo portal de gerenciamento...");
    },
    onError: (err) => {
      toast.error(`Erro ao abrir portal: ${err.message}`);
    },
  });

  const handleAssinar = (planoId: "standard" | "premium" | "supreme") => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar um plano.");
      return;
    }
    setLoadingPlano(planoId);
    criarCheckout.mutate({
      planoId,
      periodicidade,
      origin: window.location.origin,
    });
  };

  const handleGerenciarAssinatura = () => {
    abrirPortal.mutate({ origin: window.location.origin });
  };

  const formatarPreco = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const planoAtualStr = planoAtual?.plano ?? "free";
  const temPlano = planoAtualStr !== "free";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Merriweather, serif" }}>
          Planos e Assinaturas
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Escolha o plano ideal para o seu escritório. Todos os planos incluem acesso completo às ferramentas jurídicas de crédito rural.
        </p>
      </div>

      {/* Status do plano atual */}
      {user && planoAtual && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">
                    Plano atual:{" "}
                    <span className="capitalize text-primary">{planoAtualStr}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {planoAtual.laudosUsados} laudo(s) utilizados
                    {planoAtual.limite !== Infinity && ` de ${planoAtual.limite}`}
                    {planoAtual.planoExpiracao && ` · Expira em ${new Date(planoAtual.planoExpiracao).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
              </div>
              {temPlano && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGerenciarAssinatura}
                  disabled={abrirPortal.isPending}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toggle mensal/anual */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setPeriodicidade("mensal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              periodicidade === "mensal"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriodicidade("anual")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              periodicidade === "anual"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
              -25%
            </Badge>
          </button>
        </div>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANOS_CONFIG.map((plano) => {
          const Icon = plano.icon;
          const preco = periodicidade === "mensal" ? plano.precoMensal : plano.precoAnual;
          const isAtual = planoAtualStr === plano.id;
          const isLoading = loadingPlano === plano.id;

          return (
            <Card
              key={plano.id}
              className={`relative flex flex-col border-2 transition-all ${
                plano.destaque
                  ? "border-amber-400 shadow-lg shadow-amber-100"
                  : "border-border"
              } ${isAtual ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white border-0 px-3">
                    Mais Popular
                  </Badge>
                </div>
              )}
              {isAtual && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-primary text-primary-foreground border-0 px-3">
                    Plano Atual
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plano.bgCor}`}>
                    <Icon className={`h-5 w-5 ${plano.cor}`} />
                  </div>
                  <CardTitle className="text-lg">{plano.nome}</CardTitle>
                </div>
                <div className="space-y-1">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">{formatarPreco(preco)}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mês</span>
                  </div>
                  {periodicidade === "anual" && (
                    <p className="text-xs text-green-600 font-medium">
                      {formatarPreco(preco * 12)}/ano · Economize {formatarPreco((plano.precoMensal - preco) * 12)}/ano
                    </p>
                  )}
                  <CardDescription className="text-xs">
                    {plano.laudosPorMes === null
                      ? "Laudos ilimitados por mês"
                      : `${plano.laudosPorMes} laudos por mês`}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                <Separator className="mb-4" />
                <ul className="space-y-2">
                  {plano.recursos.map((recurso, i) => (
                    <li key={`assinatura-item-${i}`} className="flex items-start gap-2 text-sm">
                      {recurso.incluido ? (
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      )}
                      <span className={recurso.incluido ? "" : "text-muted-foreground/50"}>
                        {recurso.texto}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  className="w-full"
                  variant={plano.destaque ? "default" : "outline"}
                  onClick={() => handleAssinar(plano.id)}
                  disabled={isAtual || isLoading || criarCheckout.isPending}
                >
                  {isLoading ? (
                    <>Aguarde...</>
                  ) : isAtual ? (
                    <>Plano Ativo</>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Assinar {plano.nome}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Aviso de teste */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">Ambiente de testes ativo</p>
              <p>
                Para testar o pagamento, use o cartão <strong>4242 4242 4242 4242</strong>, qualquer data futura e qualquer CVV de 3 dígitos.
                Nenhum valor real será cobrado durante os testes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sucesso após checkout */}
      {window.location.pathname.includes("/assinatura/sucesso") && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-green-800">Assinatura confirmada!</h2>
            <p className="text-sm text-green-700">
              Seu plano foi ativado com sucesso. Você já pode utilizar todos os recursos disponíveis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
