import UploadDEDDDC from "@/components/UploadDEDDDC";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSearch, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UploadDED() {
  return (
    <div className="container max-w-3xl py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Importar DED/DDC</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Faça upload do Documento de Evolução da Dívida (DED/DDC) ou da Cédula de Crédito Rural em PDF.
          A IA extrai automaticamente os dados financeiros e pré-preenche a calculadora TCR.
        </p>
      </div>

      {/* O que é o DED/DDC */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="pt-4 pb-3 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">O que é o DED/DDC?</p>
              <p className="text-muted-foreground">
                O <strong>Demonstrativo de Evolução da Dívida (DED/DDC)</strong> é o documento emitido
                pela instituição financeira que mostra mês a mês como a dívida evoluiu — incluindo
                principal, juros, encargos, pagamentos realizados e saldo devedor atualizado.
              </p>
              <p className="text-muted-foreground">
                Sua entrega é obrigatória pela <strong>Res. CMN 5.004/2022</strong>. Se o banco se
                recusar a fornecer, use o módulo <strong>Petição DED/DDC</strong> para gerar a petição
                de exibição fundamentada no art. 6º do CDC e arts. 396-399 do CPC.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">Res. CMN 5.004/2022</Badge>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">Art. 6º CDC</Badge>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">Arts. 396-399 CPC</Badge>
          </div>
        </CardContent>
      </Card>

      {/* O que a IA extrai */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <p className="text-sm font-medium text-foreground mb-3">A IA extrai automaticamente:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "Valor principal do contrato",
              "Taxa de juros remuneratórios (a.a.)",
              "Taxa de juros de mora (a.a.)",
              "IOF, TAC e TEC cobrados",
              "Prazo e número de parcelas",
              "Sistema de amortização (Price/SAC/SAF)",
              "Modalidade (custeio/investimento)",
              "Linha de crédito (Pronaf, FCO etc.)",
              "Saldo devedor atual e total pago",
              "Datas de contratação e vencimento",
              "Nome do banco e devedor",
              "CPF/CNPJ do devedor",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Componente de upload */}
      <UploadDEDDDC />
    </div>
  );
}
