import { Link } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ULTIMA_ATUALIZACAO = "23 de fevereiro de 2026";
const EMPRESA = "LoboLab Tecnologia Jurídica";
const EMAIL_SUPORTE = "contato@jurosrurais.pro";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Termos de Uso</span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
          <p className="text-muted-foreground text-sm">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Leia atentamente antes de utilizar a plataforma.</strong> Ao acessar ou usar o Juros Rurais Pro,
            você concorda com estes Termos de Uso. Se não concordar com qualquer disposição, não utilize o serviço.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Definições</h2>
            <p className="text-muted-foreground">
              Para fins destes Termos de Uso, as seguintes definições se aplicam:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong className="text-foreground">Plataforma:</strong> o serviço Juros Rurais Pro, acessível em jurosrurais.pro e subdomínios</li>
              <li><strong className="text-foreground">Operador:</strong> {EMPRESA}, responsável pela operação da plataforma</li>
              <li><strong className="text-foreground">Usuário:</strong> advogado, perito, contador ou profissional jurídico que acessa a plataforma</li>
              <li><strong className="text-foreground">Conteúdo gerado por IA:</strong> laudos periciais, petições, pareceres e análises produzidos automaticamente pela plataforma</li>
              <li><strong className="text-foreground">DED/DDC:</strong> Documento de Evolução da Dívida / Demonstrativo de Débito Consolidado</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Natureza do Serviço</h2>
            <p className="text-muted-foreground">
              O <strong className="text-foreground">Juros Rurais Pro</strong> é uma <strong className="text-foreground">ferramenta de apoio técnico</strong> destinada
              exclusivamente a profissionais habilitados (advogados, peritos contábeis, contadores) que atuam em processos
              de revisão de contratos de crédito rural, recuperação judicial de produtores rurais e perícias contábeis.
            </p>
            <p className="text-muted-foreground">
              A plataforma <strong className="text-foreground">não presta serviços jurídicos</strong> diretamente a consumidores finais,
              não substitui a atuação do advogado e não configura exercício da advocacia. Todo conteúdo gerado
              automaticamente constitui <strong className="text-foreground">minuta para revisão e assinatura do profissional responsável</strong>,
              nos termos do Provimento OAB nº 205/2021 e do Estatuto da Advocacia (Lei 8.906/1994).
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Cadastro e Acesso</h2>
            <p className="text-muted-foreground">
              O acesso à plataforma requer autenticação via conta Google (OAuth 2.0). O usuário é responsável
              pela veracidade das informações fornecidas e pela segurança de suas credenciais de acesso.
              É vedado compartilhar o acesso com terceiros não cadastrados. O Operador reserva-se o direito
              de suspender ou encerrar contas que violem estes Termos.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Limitações e Responsabilidades</h2>

            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">4.1 Conteúdo gerado por Inteligência Artificial</h3>
              <p className="text-muted-foreground">
                Os laudos periciais, petições, pareceres e análises gerados automaticamente pela plataforma são
                produzidos por sistemas de inteligência artificial e têm caráter de <strong className="text-foreground">minuta preliminar</strong>.
                O Operador não garante a precisão, completude ou adequação jurídica do conteúdo gerado.
                O profissional usuário é o único responsável pela revisão, validação técnica, assinatura e
                utilização de qualquer documento em processo judicial ou extrajudicial.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">4.2 Cálculos e resultados</h3>
              <p className="text-muted-foreground">
                Os cálculos de TCR, amortização, comparativo MCR e demais análises financeiras são baseados
                nos dados informados pelo usuário. A precisão dos resultados depende da qualidade e completude
                dos dados inseridos. O Operador não se responsabiliza por erros decorrentes de dados incorretos,
                incompletos ou desatualizados fornecidos pelo usuário.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">4.3 Disponibilidade do serviço</h3>
              <p className="text-muted-foreground">
                O Operador envida esforços para manter a plataforma disponível, mas não garante disponibilidade
                ininterrupta. Manutenções programadas serão comunicadas com antecedência. O Operador não se
                responsabiliza por danos decorrentes de indisponibilidade temporária do serviço.
              </p>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Uso Permitido e Proibido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Permitido</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-2">
                  <li>Calcular TCR e analisar contratos de crédito rural</li>
                  <li>Gerar minutas de laudos periciais para revisão</li>
                  <li>Gerar minutas de petições para revisão e assinatura</li>
                  <li>Importar DED/DDC para extração de dados</li>
                  <li>Consultar dados do BCB e taxas MCR como referência</li>
                  <li>Usar os resultados em processos judiciais sob responsabilidade do advogado</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Proibido</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-2">
                  <li>Usar a plataforma para prestar consultoria jurídica direta a consumidores</li>
                  <li>Reproduzir, vender ou licenciar o conteúdo da plataforma sem autorização</li>
                  <li>Tentar acessar sistemas ou dados de outros usuários</li>
                  <li>Usar meios automatizados para extração massiva de dados (scraping)</li>
                  <li>Inserir dados falsos ou fraudulentos nos formulários</li>
                  <li>Usar a plataforma para fins ilícitos ou contrários à ética profissional</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              A plataforma, seus algoritmos, interface, marca e conteúdo editorial são de propriedade
              exclusiva do Operador, protegidos pela Lei 9.610/1998 (Lei de Direitos Autorais) e demais
              normas aplicáveis. O usuário recebe uma licença limitada, não exclusiva e intransferível
              para uso pessoal e profissional da plataforma, nos termos destes Termos de Uso.
            </p>
            <p className="text-muted-foreground">
              Os dados inseridos pelo usuário permanecem de sua propriedade. O Operador não reivindica
              direitos sobre os dados dos contratos, processos ou documentos inseridos na plataforma.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Planos e Pagamentos</h2>
            <p className="text-muted-foreground">
              A plataforma oferece planos gratuitos e pagos. As condições de cada plano, incluindo
              funcionalidades, limites de uso e valores, estão descritas na página de preços. O pagamento
              é processado por meio de plataforma segura de terceiros (Stripe). O cancelamento pode ser
              realizado a qualquer momento, com efeito ao final do período já pago. Não há reembolso
              proporcional por período não utilizado, salvo disposição legal em contrário.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Privacidade e Proteção de Dados</h2>
            <p className="text-muted-foreground">
              O tratamento de dados pessoais é regido pela{" "}
              <Link href="/privacidade" className="text-amber-500 hover:underline">Política de Privacidade</Link>,
              que integra estes Termos de Uso e está em conformidade com a Lei 13.709/2018 (LGPD)
              e o Marco Civil da Internet (Lei 12.965/2014).
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Alterações dos Termos</h2>
            <p className="text-muted-foreground">
              O Operador pode alterar estes Termos de Uso a qualquer momento. Alterações relevantes
              serão comunicadas por e-mail ou aviso na plataforma com antecedência mínima de 15 dias.
              O uso continuado da plataforma após a vigência das alterações implica aceitação dos
              novos termos.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Foro e Lei Aplicável</h2>
            <p className="text-muted-foreground">
              Estes Termos de Uso são regidos pela legislação brasileira. Para dirimir quaisquer
              controvérsias decorrentes deste instrumento, fica eleito o foro da comarca de domicílio
              do Operador, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              Antes de qualquer medida judicial, as partes comprometem-se a buscar solução amigável
              mediante comunicação ao e-mail{" "}
              <a href={`mailto:${EMAIL_SUPORTE}`} className="text-amber-500 hover:underline">{EMAIL_SUPORTE}</a>.
            </p>
          </section>

        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-border/40 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {EMPRESA}. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
