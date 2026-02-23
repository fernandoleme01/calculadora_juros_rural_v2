import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Scale, BookOpen, History, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: limites } = trpc.tcr.limitesLegais.useQuery();
  const { data: historico } = trpc.historico.listar.useQuery();

  const totalCalculos = historico?.length ?? 0;
  const naoConformes = historico?.filter(h =>
    h.conformeLimiteRemuneratorios === "nao" || h.conformeLimiteMora === "nao"
  ).length ?? 0;
  const conformes = historico?.filter(h =>
    h.conformeLimiteRemuneratorios === "sim" && h.conformeLimiteMora === "sim"
  ).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">
            Calculadora de Juros em Crédito Rural
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Ferramenta técnico-jurídica para cálculo e enquadramento de taxas de juros em financiamentos rurais, em conformidade com a legislação e jurisprudência vigentes.
        </p>
      </div>

      {/* Limites Legais Vigentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Limite — Juros Remuneratórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {limites?.jurosRemuneratoriosMaxAA ?? 12}% a.a.
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Decreto nº 22.626/33 (Lei de Usura) + STJ
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Limite — Juros de Mora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-foreground">
              {limites?.jurosMoraMaxAA ?? 1}% a.a.
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Decreto-Lei nº 167/67, art. 5º
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Limite — Multa Contratual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">
              {limites?.multaMax ?? 2}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Código Civil, art. 412 c/c legislação específica
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do Histórico */}
      {totalCalculos > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Cálculos</p>
                  <p className="text-2xl font-bold">{totalCalculos}</p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Conformidade</p>
                  <p className="text-2xl font-bold text-emerald-600">{conformes}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Não Conformes</p>
                  <p className="text-2xl font-bold text-red-600">{naoConformes}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/app/calculadora")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              Nova Calculadora TCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Calcule a Taxa de Custo Real (TCR) pré ou pós-fixada de financiamentos rurais com validação automática dos limites legais.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">TCRpós (IPCA)</Badge>
              <Badge variant="secondary">TCRpré (LTN/NTN-F)</Badge>
              <Badge variant="secondary">Validação Legal</Badge>
            </div>
            <Button className="w-full mt-4" onClick={() => setLocation("/app/calculadora")}>
              Iniciar Cálculo
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/app/fundamentacao")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 bg-accent/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-accent-foreground" />
              </div>
              Fundamentação Legal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulte a legislação, jurisprudência do STJ e doutrina aplicáveis ao crédito rural e aos limites de juros.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Lei 4.829/65</Badge>
              <Badge variant="outline">DL 167/67</Badge>
              <Badge variant="outline">Lei de Usura</Badge>
              <Badge variant="outline">Res. CMN</Badge>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setLocation("/app/fundamentacao")}>
              Ver Fundamentação
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Aviso Legal */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Aviso Técnico-Jurídico</p>
              <p className="text-xs text-amber-700 mt-1">
                Esta ferramenta fornece cálculos baseados na legislação e jurisprudência vigentes (Lei nº 4.829/65, Decreto-Lei nº 167/67, Decreto nº 22.626/33, Resoluções CMN nº 4.883/2020 e 4.913/2021). Os resultados têm caráter orientativo e não substituem análise jurídica especializada. Recomenda-se consulta a advogado habilitado para casos específicos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
