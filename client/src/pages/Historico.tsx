import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calculator, Trash2, CheckCircle, AlertTriangle, XCircle, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { fmtBRL, fmtDate } from "@/lib/formatters";

function ConformeBadge({ status }: { status: string | null }) {
  if (status === "sim") return (
    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs flex items-center gap-1 w-fit">
      <CheckCircle className="h-3 w-3" /> Conforme
    </Badge>
  );
  if (status === "atencao") return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs flex items-center gap-1 w-fit">
      <AlertTriangle className="h-3 w-3" /> Atenção
    </Badge>
  );
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs flex items-center gap-1 w-fit">
      <XCircle className="h-3 w-3" /> Não Conforme
    </Badge>
  );
}

const formatBRL = fmtBRL;
const formatDate = fmtDate;

const modalidadeLabel: Record<string, string> = {
  custeio: "Custeio",
  investimento: "Investimento",
  comercializacao: "Comercialização",
};

const tipoTaxaLabel: Record<string, string> = {
  pre_fixada: "Pré-Fixada",
  pos_fixada: "Pós-Fixada",
};

export default function Historico() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: historico, isLoading } = trpc.historico.listar.useQuery();

  const deletarMutation = trpc.historico.deletar.useMutation({
    onSuccess: () => {
      toast.success("Cálculo removido do histórico.");
      utils.historico.listar.invalidate();
    },
    onError: () => {
      toast.error("Erro ao remover o cálculo.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <span className="text-sm">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Cálculos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {historico?.length ?? 0} cálculo(s) registrado(s)
            {!isAuthenticated && " — Faça login para salvar e acessar seu histórico pessoal"}
          </p>
        </div>
        <Button onClick={() => setLocation("/calculadora")}>
          <Calculator className="h-4 w-4 mr-2" />
          Novo Cálculo
        </Button>
      </div>

      {(!historico || historico.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <History className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-medium text-muted-foreground">Nenhum cálculo no histórico</p>
              <p className="text-sm text-muted-foreground mt-1">
                Realize um cálculo e marque a opção "Salvar no histórico" para que ele apareça aqui.
              </p>
            </div>
            <Button onClick={() => setLocation("/calculadora")}>
              <Calculator className="h-4 w-4 mr-2" />
              Realizar Primeiro Cálculo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cálculos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Devedor / Cédula</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Total Devido</TableHead>
                    <TableHead>TCR Efetiva</TableHead>
                    <TableHead>Conformidade</TableHead>
                    <TableHead>Data</TableHead>
                    {isAuthenticated && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((calc) => (
                    <TableRow key={calc.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{calc.nomeDevedor || "—"}</p>
                          {calc.numeroCedula && (
                            <p className="text-xs text-muted-foreground">{calc.numeroCedula}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {modalidadeLabel[calc.modalidade] ?? calc.modalidade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {tipoTaxaLabel[calc.tipoTaxa] ?? calc.tipoTaxa}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatBRL(calc.valorPrincipal)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {formatBRL(calc.totalDevido)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {calc.tcrEfetiva ? `${(isNaN(parseFloat(calc.tcrEfetiva)) ? 0 : parseFloat(calc.tcrEfetiva)).toFixed(4)}% a.a.` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Rem.:</span>
                            <ConformeBadge status={calc.conformeLimiteRemuneratorios} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Mora:</span>
                            <ConformeBadge status={calc.conformeLimiteMora} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(calc.createdAt)}
                      </TableCell>
                      {isAuthenticated && (
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover cálculo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O cálculo será removido permanentemente do histórico.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletarMutation.mutate({ id: calc.id })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
