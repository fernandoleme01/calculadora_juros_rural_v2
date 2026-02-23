import { type DadosDEDDDC } from "@/components/UploadDEDDDC";
import { executarChecklist, type ItemChecklist, type ResultadoChecklist } from "@/lib/checklistDEDDDC";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle, CheckCircle2, XCircle, Info,
  ChevronRight, BookOpen, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface Props {
  dados: DadosDEDDDC;
  onCalcular?: () => void;
  className?: string;
}

function BadgeSeveridade({ severidade }: { severidade: ItemChecklist["severidade"] }) {
  if (severidade === "critico") {
    return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Crítico</Badge>;
  }
  if (severidade === "importante") {
    return <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 hover:bg-amber-500 text-white">Importante</Badge>;
  }
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Opcional</Badge>;
}

function IconeStatus({ presente, severidade }: { presente: boolean; severidade: ItemChecklist["severidade"] }) {
  if (presente) return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  if (severidade === "critico") return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  if (severidade === "importante") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function ItemChecklistRow({ item }: { item: ItemChecklist }) {
  return (
    <AccordionItem value={item.campo} className="border-0">
      <AccordionTrigger
        className={cn(
          "py-2 px-3 rounded-lg hover:no-underline hover:bg-muted/50 transition-colors",
          item.presente && "opacity-70"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <IconeStatus presente={item.presente} severidade={item.severidade} />
          <span className="text-sm font-medium truncate flex-1">{item.label}</span>
          {item.presente && item.valor && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
              {item.valor}
            </span>
          )}
          {!item.presente && <BadgeSeveridade severidade={item.severidade} />}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className="ml-6 space-y-2">
          <p className="text-xs text-muted-foreground">{item.descricao}</p>
          {!item.presente && (
            <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Ação recomendada
              </p>
              <p className="text-xs text-muted-foreground">{item.acaoCorretiva}</p>
              {item.fundamentacaoLegal && (
                <p className="text-[10px] text-primary/70 flex items-center gap-1 mt-1">
                  <BookOpen className="h-3 w-3" />
                  {item.fundamentacaoLegal}
                </p>
              )}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ChecklistDEDDDC({ dados, onCalcular, className }: Props) {
  const resultado: ResultadoChecklist = executarChecklist(dados);
  const [, setLocation] = useLocation();

  const corProgresso =
    resultado.percentualCompleto >= 80
      ? "bg-green-500"
      : resultado.percentualCompleto >= 50
      ? "bg-amber-500"
      : "bg-red-500";

  const itensCriticosAusentes = resultado.itens.filter(
    (i) => i.severidade === "critico" && !i.presente
  );
  const itensImportantesAusentes = resultado.itens.filter(
    (i) => i.severidade === "importante" && !i.presente
  );
  const itensPresentes = resultado.itens.filter((i) => i.presente);
  const itensOpcionaisAusentes = resultado.itens.filter(
    (i) => i.severidade === "opcional" && !i.presente
  );

  return (
    <Card className={cn("border-0 shadow-none", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Verificação do DED/DDC</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{resultado.resumo}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold tabular-nums">
              {resultado.percentualCompleto}%
            </span>
            <p className="text-[10px] text-muted-foreground">completo</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3 space-y-1">
          <Progress value={resultado.percentualCompleto} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{resultado.camposPresentes} de {resultado.totalCampos} campos encontrados</span>
            <span>
              {itensCriticosAusentes.length > 0 && (
                <span className="text-red-500 font-medium">
                  {itensCriticosAusentes.length} crítico{itensCriticosAusentes.length > 1 ? "s" : ""} ausente{itensCriticosAusentes.length > 1 ? "s" : ""}
                </span>
              )}
              {itensCriticosAusentes.length === 0 && itensImportantesAusentes.length > 0 && (
                <span className="text-amber-500 font-medium">
                  {itensImportantesAusentes.length} importante{itensImportantesAusentes.length > 1 ? "s" : ""} ausente{itensImportantesAusentes.length > 1 ? "s" : ""}
                </span>
              )}
              {itensCriticosAusentes.length === 0 && itensImportantesAusentes.length === 0 && (
                <span className="text-green-500 font-medium">Pronto para calcular</span>
              )}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerta de campos críticos ausentes */}
        {itensCriticosAusentes.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-3">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Cálculo bloqueado — {itensCriticosAusentes.length} campo{itensCriticosAusentes.length > 1 ? "s" : ""} crítico{itensCriticosAusentes.length > 1 ? "s" : ""} ausente{itensCriticosAusentes.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                  Expanda os itens abaixo para ver como obter os dados faltantes.
                  Você também pode{" "}
                  <button
                    onClick={() => setLocation("/app/peticao-ded")}
                    className="underline font-medium hover:no-underline"
                  >
                    gerar uma petição de exibição de documentos
                  </button>{" "}
                  se o banco se recusar a fornecer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de campos importantes ausentes */}
        {itensCriticosAusentes.length === 0 && itensImportantesAusentes.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Cálculo possível com ressalvas
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                  {itensImportantesAusentes.length} campo{itensImportantesAusentes.length > 1 ? "s" : ""} importante{itensImportantesAusentes.length > 1 ? "s" : ""} ausente{itensImportantesAusentes.length > 1 ? "s" : ""}. O resultado pode ser menos preciso. Recomenda-se complementar os dados antes de usar o laudo em juízo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de campos por grupo */}
        <Accordion type="multiple" className="space-y-0.5">
          {/* Campos críticos ausentes */}
          {itensCriticosAusentes.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500/70 px-1 mb-1">
                Campos Críticos Ausentes
              </p>
              {itensCriticosAusentes.map((item) => (
                <ItemChecklistRow key={item.campo} item={item} />
              ))}
            </div>
          )}

          {/* Campos importantes ausentes */}
          {itensImportantesAusentes.length > 0 && (
            <div className="space-y-0.5 mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 px-1 mb-1">
                Campos Importantes Ausentes
              </p>
              {itensImportantesAusentes.map((item) => (
                <ItemChecklistRow key={item.campo} item={item} />
              ))}
            </div>
          )}

          {/* Campos presentes */}
          {itensPresentes.length > 0 && (
            <div className="space-y-0.5 mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-500/70 px-1 mb-1">
                Campos Encontrados ({itensPresentes.length})
              </p>
              {itensPresentes.map((item) => (
                <ItemChecklistRow key={item.campo} item={item} />
              ))}
            </div>
          )}

          {/* Campos opcionais ausentes */}
          {itensOpcionaisAusentes.length > 0 && (
            <div className="space-y-0.5 mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-1 mb-1">
                Campos Opcionais Ausentes ({itensOpcionaisAusentes.length})
              </p>
              {itensOpcionaisAusentes.map((item) => (
                <ItemChecklistRow key={item.campo} item={item} />
              ))}
            </div>
          )}
        </Accordion>

        {/* Botão de ação */}
        <div className="pt-2 flex gap-2">
          {resultado.podeCalcular ? (
            <Button
              onClick={onCalcular}
              className="flex-1 gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Preencher Calculadora
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setLocation("/app/peticao-ded")}
                className="flex-1 gap-2 text-xs"
              >
                <BookOpen className="h-4 w-4" />
                Gerar Petição de Exibição
              </Button>
              <Button
                variant="secondary"
                onClick={onCalcular}
                className="flex-1 gap-2 text-xs"
              >
                Calcular mesmo assim
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
