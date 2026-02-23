import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, Info, Search, Calculator,
  BookOpen, Copy, ChevronDown, ChevronUp, Sprout, Users, TrendingDown
} from "lucide-react";

// ─── Helpers de formatação ────────────────────────────────────────────────────

function toNum(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") { const n = parseFloat(v.replace(",", ".")); return isNaN(n) ? 0 : n; }
  return 0;
}

function fmtBRL(v: unknown): string {
  return toNum(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(v: unknown, dec = 2): string {
  return `${toNum(v).toFixed(dec)}% a.a.`;
}

function fmtRenda(v: number | null): string {
  if (v === null) return "Sem limite";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Componente: Card de Grupo ────────────────────────────────────────────────

interface GrupoCardProps {
  grupo: {
    grupo: string;
    nome: string;
    descricao: string;
    criteriosEnquadramento: string[];
    rendaBrutaMaximaAnual: number | null;
    taxaCusteioAA: number | null;
    taxaInvestimentoAA: number | null;
    limiteFinanciamentoAnual?: number;
    fundamentacaoMCR: string;
    resolucao: string;
    observacoes?: string;
  };
  onSelecionar: (grupo: string) => void;
}

function GrupoCard({ grupo, onSelecionar }: GrupoCardProps) {
  const [expandido, setExpandido] = useState(false);

  const taxaMin = Math.min(
    grupo.taxaCusteioAA ?? Infinity,
    grupo.taxaInvestimentoAA ?? Infinity
  );

      const corBadge = taxaMin <= 0.5 ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : taxaMin <= 3.0 ? "bg-green-100 text-green-800 border-green-200"
    : taxaMin <= 5.0 ? "bg-blue-100 text-blue-800 border-blue-200"
    : "bg-amber-100 text-amber-800 border-amber-200";

  const temBonus = grupo.grupo === "A" || grupo.grupo === "A/C" || grupo.grupo === "B";

  return (
    <Card className="border hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight">{grupo.nome}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">{grupo.descricao}</CardDescription>
            {temBonus && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Sprout className="h-3 w-3" />
                Bônus adimplência 25%
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
                            {grupo.taxaCusteioAA !== null && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${corBadge}`}>
                                Custeio: {fmtPct(grupo.taxaCusteioAA)}
                              </span>
                            )}
                            {grupo.taxaInvestimentoAA !== null && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${corBadge}`}>
                                Invest.: {fmtPct(grupo.taxaInvestimentoAA)}
                              </span>
                            )}
                            {temBonus && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                ↓ 25% bônus
                              </span>
                            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <p className="text-muted-foreground font-medium">Renda máx. anual</p>
            <p className="font-semibold mt-0.5">{fmtRenda(grupo.rendaBrutaMaximaAnual)}</p>
          </div>
          {grupo.limiteFinanciamentoAnual && (
            <div className="bg-muted/50 rounded p-2">
              <p className="text-muted-foreground font-medium">Limite anual</p>
              <p className="font-semibold mt-0.5">{fmtBRL(grupo.limiteFinanciamentoAnual)}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpandido(!expandido)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expandido ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expandido ? "Ocultar critérios" : "Ver critérios de enquadramento"}
        </button>

        {expandido && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Critérios de enquadramento:</p>
            <ul className="space-y-1">
              {grupo.criteriosEnquadramento.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            {grupo.observacoes && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                <strong>Obs.:</strong> {grupo.observacoes}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              <strong>Base legal:</strong> {grupo.fundamentacaoMCR} — {grupo.resolucao}
            </p>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onSelecionar(grupo.grupo)}
        >
          <Calculator className="h-3 w-3 mr-1" />
          Usar neste grupo
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PronafPronamp() {
  const { data: dadosGrupos, isLoading } = trpc.pronaf.listarGrupos.useQuery();
  const calcularMutation = trpc.pronaf.calcularComparativo.useMutation();

  // Filtros da tabela
  const [filtroPrograma, setFiltroPrograma] = useState<"todos" | "Pronaf" | "Pronamp" | "Convencional">("todos");
  const [filtroFinalidade, setFiltroFinalidade] = useState<"todos" | "custeio" | "investimento">("todos");
  const [busca, setBusca] = useState("");

  // Formulário de comparativo
  const [programa, setPrograma] = useState<"Pronaf" | "Pronamp">("Pronaf");
  const [grupoPronaf, setGrupoPronaf] = useState("D");
  const [finalidade, setFinalidade] = useState<"custeio" | "investimento">("custeio");
  const [taxaContratada, setTaxaContratada] = useState("");
  const [valorPrincipal, setValorPrincipal] = useState("");
  const [prazoMeses, setPrazoMeses] = useState("");
  const [nomeBeneficiario, setNomeBeneficiario] = useState("");
  const [nomeInstituicao, setNomeInstituicao] = useState("");
  const [numeroCedula, setNumeroCedula] = useState("");
  const [dataContrato, setDataContrato] = useState("");

  // Simulador de enquadramento
  const [rendaBruta, setRendaBruta] = useState("");
  const [sugestaoEnquadramento, setSugestaoEnquadramento] = useState<{
    programa: string; grupo?: string; nome: string;
    taxaCusteioAA: number | null; taxaInvestimentoAA: number | null; observacao: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const [resultado, setResultadoState] = useState<{
    programa: string; grupo: string; nomeGrupo: string; finalidade: string;
    taxaContratadaAA: number; taxaLimiteAA: number; diferencaPP: number;
    excede: boolean; percentualExcesso: number; excessoJurosEstimadoR?: number;
    // Bônus de adimplência
    temBonusAdimplencia: boolean; percentualBonus: number;
    taxaEfetivaComBonusAA?: number; economiaBonusR?: number;
    veredicto: string; textoVeredicto: string; fundamentacaoLegal: string;
    textoLaudo: string; alertas: string[];
  } | null>(() => {
    // Restaurar do sessionStorage ao montar (sobrevive a reload)
    try {
      const raw = sessionStorage.getItem("pronaf_resultado");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  function setResultado(val: typeof resultado) {
    setResultadoState(val);
    try {
      if (val) sessionStorage.setItem("pronaf_resultado", JSON.stringify(val));
      else sessionStorage.removeItem("pronaf_resultado");
    } catch { /* ignore */ }
  }

  // Filtrar tabela comparativa
  const linhasFiltradas = useMemo(() => {
    if (!dadosGrupos?.tabelaComparativa) return [];
    return dadosGrupos.tabelaComparativa.filter(l => {
      const matchPrograma = filtroPrograma === "todos" || l.programa === filtroPrograma;
      const matchFinalidade = filtroFinalidade === "todos" || l.finalidade === filtroFinalidade || l.finalidade === "ambos";
      const matchBusca = !busca || l.nome.toLowerCase().includes(busca.toLowerCase()) || l.grupo.toLowerCase().includes(busca.toLowerCase());
      return matchPrograma && matchFinalidade && matchBusca;
    });
  }, [dadosGrupos, filtroPrograma, filtroFinalidade, busca]);

  // Grupos Pronaf para o select
  const gruposPronafSelect = useMemo(() => {
    if (!dadosGrupos?.grupos) return [];
    return dadosGrupos.grupos.map(g => ({ value: g.grupo, label: g.nome }));
  }, [dadosGrupos]);

  async function handleCalcular() {
    const taxa = parseFloat(taxaContratada.replace(",", "."));
    if (isNaN(taxa) || taxa <= 0) {
      toast.error("Informe a taxa de juros contratada (% a.a.)");
      return;
    }

    try {
      const res = await calcularMutation.mutateAsync({
        programa,
        grupoPronaf: programa === "Pronaf" ? grupoPronaf : undefined,
        finalidade,
        taxaContratadaAA: taxa,
        valorPrincipal: valorPrincipal ? parseFloat(valorPrincipal.replace(/[^\d,]/g, "").replace(",", ".")) : undefined,
        prazoMeses: prazoMeses ? parseInt(prazoMeses) : undefined,
        nomeBeneficiario: nomeBeneficiario || undefined,
        nomeInstituicao: nomeInstituicao || undefined,
        numeroCedula: numeroCedula || undefined,
        dataContrato: dataContrato || undefined,
      });
      setResultado(res);
      toast.success("Comparativo calculado com sucesso!");
    } catch (err) {
      toast.error("Erro ao calcular comparativo. Verifique os dados informados.");
    }
  }

  async function handleSugerirEnquadramento() {
    const renda = parseFloat(rendaBruta.replace(/[^\d,]/g, "").replace(",", "."));
    if (isNaN(renda) || renda <= 0) {
      toast.error("Informe a renda bruta anual");
      return;
    }
    try {
      const res = await utils.pronaf.sugerirEnquadramento.fetch({ rendaBrutaAnual: renda });
      setSugestaoEnquadramento(res);
    } catch {
      toast.error("Erro ao consultar enquadramento");
    }
  }

  function handleSelecionarGrupo(grupo: string) {
    setPrograma("Pronaf");
    setGrupoPronaf(grupo);
    // Scroll para o formulário
    document.getElementById("form-comparativo")?.scrollIntoView({ behavior: "smooth" });
    toast.info(`Grupo ${grupo} selecionado. Preencha a taxa contratada para calcular.`);
  }

  function copiarLaudo() {
    if (!resultado?.textoLaudo) return;
    navigator.clipboard.writeText(resultado.textoLaudo);
    toast.success("Texto do laudo copiado para a área de transferência!");
  }

  const corVeredicto = resultado?.excede
    ? "border-red-200 bg-red-50"
    : resultado?.veredicto === "regular"
    ? "border-green-200 bg-green-50"
    : "border-gray-200 bg-gray-50";

  const iconVeredicto = resultado?.excede
    ? <AlertTriangle className="h-5 w-5 text-red-600" />
    : <CheckCircle2 className="h-5 w-5 text-green-600" />;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sprout className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Merriweather, serif" }}>
            Módulo Pronaf / Pronamp
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Taxas diferenciadas do MCR 7-6 (Pronaf) e MCR 7-4 (Pronamp) com comparativo automático de conformidade legal.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="text-xs">MCR 7-6 — Pronaf</Badge>
          <Badge variant="outline" className="text-xs">MCR 7-4 — Pronamp</Badge>
          <Badge variant="outline" className="text-xs">Res. CMN 5.099/2022</Badge>
          <Badge variant="outline" className="text-xs">Lei 11.326/2006</Badge>
          <Badge variant="outline" className="text-xs">Atualização MCR nº 752/2026</Badge>
        </div>
      </div>

      <Tabs defaultValue="tabela">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tabela" className="text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Tabela de Taxas
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="text-xs sm:text-sm">
            <Calculator className="h-3.5 w-3.5 mr-1.5" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="enquadramento" className="text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Enquadramento
          </TabsTrigger>
        </TabsList>

        {/* ── ABA 1: TABELA DE TAXAS ─────────────────────────────────────────── */}
        <TabsContent value="tabela" className="space-y-4 mt-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar linha de crédito..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={filtroPrograma} onValueChange={(v: typeof filtroPrograma) => setFiltroPrograma(v)}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os programas</SelectItem>
                <SelectItem value="Pronaf">Pronaf</SelectItem>
                <SelectItem value="Pronamp">Pronamp</SelectItem>
                <SelectItem value="Convencional">Convencional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroFinalidade} onValueChange={(v: typeof filtroFinalidade) => setFiltroFinalidade(v)}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Finalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as finalidades</SelectItem>
                <SelectItem value="custeio">Custeio</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando dados do MCR...</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Programa</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Linha / Grupo</th>
                      <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Taxa Máx. (a.a.)</th>
                      <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Renda Máx. Anual</th>
                      <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Limite Anual</th>
                      <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Bônus</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Base Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasFiltradas.map((linha, i) => {
                      const corTaxa = (linha.taxaAA ?? 99) <= 1 ? "text-emerald-700 font-bold"
                        : (linha.taxaAA ?? 99) <= 3 ? "text-green-700 font-bold"
                        : (linha.taxaAA ?? 99) <= 5 ? "text-blue-700 font-semibold"
                        : (linha.taxaAA ?? 99) <= 8.5 ? "text-amber-700 font-semibold"
                        : "text-red-700 font-semibold";

                      const corPrograma = linha.programa === "Pronaf" ? "bg-green-100 text-green-800"
                        : linha.programa === "Pronamp" ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700";

                      return (
                        <tr key={linha.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corPrograma}`}>
                              {linha.programa}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-sm leading-tight">{linha.nome}</p>
                              {linha.destaque && (
                                <p className="text-xs text-muted-foreground mt-0.5">{linha.destaque}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-base ${corTaxa}`}>
                              {linha.taxaAA !== null ? `${linha.taxaAA.toFixed(1)}%` : "Livre"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {linha.rendaMaxima !== null ? fmtBRL(linha.rendaMaxima) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {linha.limiteAnual !== null ? fmtBRL(linha.limiteAnual) : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {["A", "A/C", "B"].includes(linha.grupo) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <Sprout className="h-3 w-3" />
                                25%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-48">
                            {linha.fundamentacao}
                          </td>
                        </tr>
                      );
                    })}
                    {linhasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          Nenhuma linha encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cards dos grupos Pronaf */}
          {!isLoading && dadosGrupos && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div>
                <h2 className="text-base font-semibold mb-1">Grupos Pronaf — Detalhamento Completo</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Critérios de enquadramento, limites e observações de cada grupo. Clique em "Usar neste grupo" para calcular o comparativo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {dadosGrupos.grupos.map(g => (
                    <GrupoCard key={g.grupo} grupo={g} onSelecionar={handleSelecionarGrupo} />
                  ))}
                </div>
              </div>

              {/* Card Pronamp */}
              <Separator />
              <div>
                <h2 className="text-base font-semibold mb-1">Pronamp — Médio Produtor Rural</h2>
                <Card className="border-blue-200">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Descrição</p>
                          <p className="text-sm">{dadosGrupos.pronamp.descricao}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Critérios de Enquadramento</p>
                          <ul className="space-y-1">
                            {dadosGrupos.pronamp.criteriosEnquadramento.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs">
                                <CheckCircle2 className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-blue-600 font-medium">Custeio</p>
                            <p className="text-2xl font-bold text-blue-700">{dadosGrupos.pronamp.taxaCusteioAA}%</p>
                            <p className="text-xs text-blue-500">a.a. máx.</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-blue-600 font-medium">Investimento</p>
                            <p className="text-2xl font-bold text-blue-700">{dadosGrupos.pronamp.taxaInvestimentoAA}%</p>
                            <p className="text-xs text-blue-500">a.a. máx.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-muted-foreground font-medium">Renda máx. anual</p>
                            <p className="font-semibold mt-0.5">{fmtBRL(dadosGrupos.pronamp.rendaBrutaMaximaAnual)}</p>
                          </div>
                          <div className="bg-muted/50 rounded p-2">
                            <p className="text-muted-foreground font-medium">Limite anual</p>
                            <p className="font-semibold mt-0.5">{fmtBRL(dadosGrupos.pronamp.limiteFinanciamentoAnual)}</p>
                          </div>
                        </div>
                        {dadosGrupos.pronamp.observacoes && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                            <strong>Obs.:</strong> {dadosGrupos.pronamp.observacoes}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => { setPrograma("Pronamp"); document.getElementById("form-comparativo")?.scrollIntoView({ behavior: "smooth" }); toast.info("Pronamp selecionado. Preencha a taxa contratada."); }}
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Calcular Comparativo Pronamp
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ABA 2: COMPARATIVO ────────────────────────────────────────────── */}
        <TabsContent value="comparativo" className="space-y-4 mt-4">
          <div id="form-comparativo" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Dados do Contrato</CardTitle>
                <CardDescription className="text-xs">
                  Informe os dados do contrato para calcular a conformidade com os limites legais do Pronaf/Pronamp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Programa */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Programa *</Label>
                    <Select value={programa} onValueChange={(v: "Pronaf" | "Pronamp") => setPrograma(v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pronaf">Pronaf</SelectItem>
                        <SelectItem value="Pronamp">Pronamp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {programa === "Pronaf" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Grupo Pronaf *</Label>
                      <Select value={grupoPronaf} onValueChange={setGrupoPronaf}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gruposPronafSelect.map(g => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.value} — {g.label.replace(/Pronaf\s+/i, "").split("—")[0].trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Finalidade e Taxa */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Finalidade *</Label>
                    <Select value={finalidade} onValueChange={(v: "custeio" | "investimento") => setFinalidade(v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custeio">Custeio</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Taxa Contratada (% a.a.) *</Label>
                    <Input
                      placeholder="Ex.: 12,50"
                      value={taxaContratada}
                      onChange={e => setTaxaContratada(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Valor e Prazo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Valor Principal (R$)</Label>
                    <Input
                      placeholder="Ex.: 50000"
                      value={valorPrincipal}
                      onChange={e => setValorPrincipal(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Prazo (meses)</Label>
                    <Input
                      placeholder="Ex.: 60"
                      value={prazoMeses}
                      onChange={e => setPrazoMeses(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <Separator />
                <p className="text-xs text-muted-foreground font-medium">Dados opcionais (para o laudo pericial)</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome do Beneficiário</Label>
                    <Input
                      placeholder="Nome completo"
                      value={nomeBeneficiario}
                      onChange={e => setNomeBeneficiario(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Instituição Financeira</Label>
                    <Input
                      placeholder="Nome do banco"
                      value={nomeInstituicao}
                      onChange={e => setNomeInstituicao(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nº da Cédula</Label>
                    <Input
                      placeholder="Número do contrato"
                      value={numeroCedula}
                      onChange={e => setNumeroCedula(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Data do Contrato</Label>
                    <Input
                      type="date"
                      value={dataContrato}
                      onChange={e => setDataContrato(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCalcular}
                  disabled={calcularMutation.isPending}
                  className="w-full"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {calcularMutation.isPending ? "Calculando..." : "Calcular Comparativo"}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado */}
            <div className="space-y-4">
              {!resultado ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Calculator className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados do contrato e clique em "Calcular Comparativo" para ver o resultado.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Veredicto */}
                  <Card className={`border-2 ${corVeredicto}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {iconVeredicto}
                        <div className="flex-1">
                          <p className="font-semibold text-sm leading-tight">{resultado.textoVeredicto}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="text-center">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs text-muted-foreground">Taxa Contratada</p>
                        <p className="text-lg font-bold text-foreground">{fmtPct(resultado.taxaContratadaAA)}</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs text-muted-foreground">Limite Legal</p>
                        <p className={`text-lg font-bold ${resultado.excede ? "text-green-700" : "text-foreground"}`}>
                          {fmtPct(resultado.taxaLimiteAA)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs text-muted-foreground">Diferença</p>
                        <p className={`text-lg font-bold ${resultado.excede ? "text-red-600" : "text-green-600"}`}>
                          {resultado.excede ? "+" : ""}{toNum(resultado.diferencaPP).toFixed(2)} p.p.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs text-muted-foreground">Excesso Relativo</p>
                        <p className={`text-lg font-bold ${resultado.excede ? "text-red-600" : "text-green-600"}`}>
                          {resultado.excede ? toNum(resultado.percentualExcesso).toFixed(1) + "%" : "0%"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Excesso em R$ */}
                  {resultado.excede && resultado.excessoJurosEstimadoR && resultado.excessoJurosEstimadoR > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800 text-sm">Excesso de Juros Estimado</AlertTitle>
                      <AlertDescription className="text-red-700 text-xs">
                        Com base no sistema Price, o excesso de juros ao longo do contrato é estimado em{" "}
                        <strong>{fmtBRL(resultado.excessoJurosEstimadoR)}</strong>.
                        Em caso de devolução em dobro (art. 42, § único, CDC), o valor seria de{" "}
                        <strong>{fmtBRL(toNum(resultado.excessoJurosEstimadoR) * 2)}</strong>.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Bônus de Adimplência */}
                  {resultado.temBonusAdimplencia && (
                    <Card className="border-emerald-200 bg-emerald-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                          <Sprout className="h-4 w-4 text-emerald-600" />
                          Bônus de Adimplência — {resultado.percentualBonus}% de Desconto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-xs text-emerald-700">
                          O <strong>{resultado.nomeGrupo}</strong> tem direito a bônus de{" "}
                          <strong>{resultado.percentualBonus}% sobre os encargos financeiros</strong>{" "}
                          para pagamento em dia, conforme MCR 7-6, Tabela 1 (Res. CMN 5.099/2022).
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/70 rounded-lg border border-emerald-200 p-3 text-center">
                            <p className="text-xs text-emerald-600 font-medium">Taxa Limite Legal</p>
                            <p className="text-xl font-bold text-emerald-800">{fmtPct(resultado.taxaLimiteAA)}</p>
                            <p className="text-xs text-emerald-500">sem bônus</p>
                          </div>
                          <div className="bg-emerald-100 rounded-lg border border-emerald-300 p-3 text-center">
                            <p className="text-xs text-emerald-600 font-medium">Taxa Efetiva c/ Bônus</p>
                            <p className="text-xl font-bold text-emerald-900">{fmtPct(resultado.taxaEfetivaComBonusAA ?? 0)}</p>
                            <p className="text-xs text-emerald-600 font-semibold">↓ {resultado.percentualBonus}% de desconto</p>
                          </div>
                        </div>
                        {resultado.economiaBonusR !== undefined && resultado.economiaBonusR > 0 && (
                          <div className="bg-white/70 rounded-lg border border-emerald-200 p-3">
                            <p className="text-xs text-emerald-700 font-semibold mb-1">Economia Estimada com o Bônus</p>
                            <p className="text-lg font-bold text-emerald-800">{fmtBRL(resultado.economiaBonusR)}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                              Calculado pelo sistema Price sobre o prazo informado.
                              Se o banco não aplicou o bônus a que o beneficiário faz jus, este valor pode ser objeto de restituição.
                            </p>
                          </div>
                        )}
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                          <strong>Atenção:</strong> O bônus de adimplência só é aplicado se o beneficiário estiver em dia com
                          todos os pagamentos. A não aplicação indevida do bônus pode ser questionada judicialmente.
                          Base legal: MCR 7-6, Tabela 1; Res. CMN 5.099/2022.
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alertas */}
                  {resultado.alertas.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          Alertas e Observações
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="space-y-1.5">
                          {resultado.alertas.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fundamentação */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Fundamentação Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{resultado.fundamentacaoLegal}</p>
                    </CardContent>
                  </Card>

                  {/* Texto do Laudo */}
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Texto para Laudo Pericial</CardTitle>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copiarLaudo}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded p-3 max-h-64 overflow-y-auto leading-relaxed">
                        {resultado.textoLaudo}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        ⚠ Este texto é gerado automaticamente como subsídio técnico. O advogado ou perito deve revisá-lo e adaptá-lo às circunstâncias específicas do caso.
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── ABA 3: ENQUADRAMENTO ──────────────────────────────────────────── */}
        <TabsContent value="enquadramento" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulador */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Simulador de Enquadramento
                </CardTitle>
                <CardDescription className="text-xs">
                  Informe a renda bruta anual do produtor para identificar o programa e grupo mais adequado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Renda Bruta Anual (R$)</Label>
                  <Input
                    placeholder="Ex.: 150000"
                    value={rendaBruta}
                    onChange={e => setRendaBruta(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Excluídas as transferências governamentais (bolsas, aposentadorias, etc.)
                  </p>
                </div>
                <Button onClick={handleSugerirEnquadramento} className="w-full" variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Verificar Enquadramento
                </Button>

                {sugestaoEnquadramento && (
                  <div className="space-y-3 pt-2">
                    <div className={`rounded-lg border p-4 ${
                      sugestaoEnquadramento.programa === "Pronaf" ? "border-green-200 bg-green-50"
                      : sugestaoEnquadramento.programa === "Pronamp" ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          sugestaoEnquadramento.programa === "Pronaf" ? "bg-green-600"
                          : sugestaoEnquadramento.programa === "Pronamp" ? "bg-blue-600"
                          : "bg-gray-600"
                        }>
                          {sugestaoEnquadramento.programa}
                          {sugestaoEnquadramento.grupo ? ` — Grupo ${sugestaoEnquadramento.grupo}` : ""}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">{sugestaoEnquadramento.nome}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {sugestaoEnquadramento.taxaCusteioAA !== null && (
                          <div className="bg-white/70 rounded p-2 text-center">
                            <p className="text-xs text-muted-foreground">Taxa Custeio</p>
                            <p className="text-lg font-bold">{sugestaoEnquadramento.taxaCusteioAA}%</p>
                          </div>
                        )}
                        {sugestaoEnquadramento.taxaInvestimentoAA !== null && (
                          <div className="bg-white/70 rounded p-2 text-center">
                            <p className="text-xs text-muted-foreground">Taxa Investimento</p>
                            <p className="text-lg font-bold">{sugestaoEnquadramento.taxaInvestimentoAA}%</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground">{sugestaoEnquadramento.observacao}</p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (sugestaoEnquadramento.programa === "Pronamp") {
                          setPrograma("Pronamp");
                        } else {
                          setPrograma("Pronaf");
                          if (sugestaoEnquadramento.grupo) setGrupoPronaf(sugestaoEnquadramento.grupo);
                        }
                        document.getElementById("form-comparativo")?.scrollIntoView({ behavior: "smooth" });
                        toast.info("Enquadramento aplicado ao formulário de comparativo.");
                      }}
                    >
                      Usar no Comparativo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabela de faixas */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Faixas de Enquadramento</CardTitle>
                <CardDescription className="text-xs">
                  Resumo das faixas de renda e programas correspondentes (MCR 7-6 e 7-4).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { faixa: "Até R$ 20.000", programa: "Pronaf B", taxa: "0,5%", cor: "bg-emerald-50 border-emerald-200" },
                    { faixa: "Até R$ 80.000", programa: "Pronaf C", taxa: "4,0%", cor: "bg-green-50 border-green-200" },
                    { faixa: "Até R$ 360.000", programa: "Pronaf D", taxa: "5,0%", cor: "bg-teal-50 border-teal-200" },
                    { faixa: "Até R$ 500.000", programa: "Pronaf E", taxa: "5,0%", cor: "bg-blue-50 border-blue-200" },
                    { faixa: "Até R$ 2.400.000", programa: "Pronamp", taxa: "8,0–8,5%", cor: "bg-indigo-50 border-indigo-200" },
                    { faixa: "Acima de R$ 2.400.000", programa: "Crédito Rural Conv.", taxa: "12,5–14,0%", cor: "bg-gray-50 border-gray-200" },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${item.cor}`}>
                      <div>
                        <p className="text-xs font-semibold">{item.programa}</p>
                        <p className="text-xs text-muted-foreground">{item.faixa}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{item.taxa}</p>
                        <p className="text-xs text-muted-foreground">a.a. máx.</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Linhas especiais (Agroecologia, Floresta, Semiárido) têm taxa de 3% a.a. independentemente do grupo.
                  Assentados (Grupo A) têm taxa de 1,5% a.a.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerta jurídico */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 text-sm">Importância do Enquadramento Correto</AlertTitle>
            <AlertDescription className="text-amber-700 text-xs space-y-1">
              <p>
                O enquadramento incorreto do beneficiário em um programa de crédito rural pode configurar cobrança ilegal de juros.
                Se o produtor preenche os requisitos do Pronaf mas o banco contratou como crédito convencional, há excesso de encargos passível de revisão judicial.
              </p>
              <p>
                <strong>Fundamentação:</strong> MCR 7-6 (Pronaf) e MCR 7-4 (Pronamp); Res. CMN 5.099/2022;
                Lei 11.326/2006; STJ, REsp 1.061.530/RS (recurso repetitivo).
              </p>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
