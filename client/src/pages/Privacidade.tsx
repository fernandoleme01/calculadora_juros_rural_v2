import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ULTIMA_ATUALIZACAO = "23 de fevereiro de 2026";
const EMPRESA = "LoboLab Tecnologia Jurídica";
const CNPJ = ""; // Preencher quando disponível
const EMAIL_DPO = "privacidade@jurosrurais.pro";
const EMAIL_SUPORTE = "contato@jurosrurais.pro";

export default function Privacidade() {
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
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Política de Privacidade</span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
          <p className="text-muted-foreground text-sm">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Identificação do Controlador</h2>
            <p className="text-muted-foreground">
              A plataforma <strong>Juros Rurais Pro</strong> é operada por <strong>{EMPRESA}</strong>
              {CNPJ && `, inscrita no CNPJ sob o nº ${CNPJ}`}, com sede no Brasil. Para questões relacionadas
              à proteção de dados pessoais, o responsável pelo tratamento pode ser contatado pelo e-mail{" "}
              <a href={`mailto:${EMAIL_DPO}`} className="text-amber-500 hover:underline">{EMAIL_DPO}</a>.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Dados Coletados</h2>
            <p className="text-muted-foreground">
              A plataforma coleta os seguintes dados pessoais para a prestação dos serviços:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Categoria</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Dados</th>
                    <th className="text-left py-2 font-semibold text-foreground">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 align-top font-medium text-foreground">Cadastro</td>
                    <td className="py-2 pr-4 align-top">Nome, e-mail, foto de perfil</td>
                    <td className="py-2 align-top">Autenticação e identificação do usuário</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 align-top font-medium text-foreground">Dados do contrato</td>
                    <td className="py-2 pr-4 align-top">Valor, taxas, datas, modalidade, banco</td>
                    <td className="py-2 align-top">Realização dos cálculos de TCR e análise contratual</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 align-top font-medium text-foreground">Dados do devedor</td>
                    <td className="py-2 pr-4 align-top">Nome, CPF/CNPJ (informados pelo usuário)</td>
                    <td className="py-2 align-top">Identificação nos documentos gerados (laudo, petição)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 align-top font-medium text-foreground">Documentos PDF</td>
                    <td className="py-2 pr-4 align-top">Conteúdo do DED/DDC ou contrato enviado</td>
                    <td className="py-2 align-top">Extração automática de dados via IA para pré-preenchimento</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 align-top font-medium text-foreground">Uso da plataforma</td>
                    <td className="py-2 pr-4 align-top">Logs de acesso, IP, navegador, páginas visitadas</td>
                    <td className="py-2 align-top">Segurança, diagnóstico técnico e melhoria do serviço</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top font-medium text-foreground">Cookies</td>
                    <td className="py-2 pr-4 align-top">Sessão, preferências, analytics</td>
                    <td className="py-2 align-top">Autenticação, personalização e análise de uso</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Base Legal para o Tratamento</h2>
            <p className="text-muted-foreground">
              O tratamento dos dados pessoais é realizado com base nas seguintes hipóteses legais previstas
              na Lei 13.709/2018 (LGPD):
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong className="text-foreground">Execução de contrato</strong> (art. 7º, V): dados necessários para a prestação do serviço contratado</li>
              <li><strong className="text-foreground">Legítimo interesse</strong> (art. 7º, IX): logs de segurança e prevenção de fraudes</li>
              <li><strong className="text-foreground">Consentimento</strong> (art. 7º, I): cookies de analytics e comunicações de marketing</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              Os dados pessoais dos usuários <strong>não são vendidos</strong> a terceiros. O compartilhamento
              ocorre apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong className="text-foreground">Provedores de infraestrutura</strong>: servidores de hospedagem e banco de dados (Manus Platform), com obrigações contratuais de confidencialidade</li>
              <li><strong className="text-foreground">Serviços de IA</strong>: os dados dos documentos enviados são processados por APIs de inteligência artificial para extração de informações; os dados não são usados para treinamento de modelos</li>
              <li><strong className="text-foreground">Obrigação legal</strong>: quando exigido por autoridade competente, decisão judicial ou órgão regulador</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Retenção dos Dados</h2>
            <p className="text-muted-foreground">
              Os dados são mantidos pelo período necessário para a prestação do serviço e pelo prazo legal
              aplicável. Especificamente: dados de cadastro e histórico de cálculos são mantidos enquanto
              a conta estiver ativa; após o encerramento da conta, os dados são excluídos em até 90 dias,
              salvo obrigação legal de retenção. Documentos PDF enviados são excluídos do armazenamento
              em nuvem em até 30 dias após o processamento.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Direitos do Titular</h2>
            <p className="text-muted-foreground">
              Nos termos da LGPD (art. 18), o titular dos dados tem os seguintes direitos, exercíveis
              mediante solicitação ao e-mail <a href={`mailto:${EMAIL_DPO}`} className="text-amber-500 hover:underline">{EMAIL_DPO}</a>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ["Acesso", "Obter confirmação da existência e acesso aos dados tratados"],
                ["Correção", "Solicitar a correção de dados incompletos, inexatos ou desatualizados"],
                ["Exclusão", "Solicitar a eliminação dos dados tratados com base no consentimento"],
                ["Portabilidade", "Receber os dados em formato estruturado e interoperável"],
                ["Revogação", "Revogar o consentimento a qualquer momento"],
                ["Oposição", "Opor-se ao tratamento realizado com base em legítimo interesse"],
              ].map(([titulo, desc]) => (
                <div key={titulo} className="rounded-lg border border-border/50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground">{titulo}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              As solicitações serão respondidas em até 15 dias úteis. O titular também pode apresentar
              reclamação à Autoridade Nacional de Proteção de Dados (ANPD) em{" "}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">www.gov.br/anpd</a>.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Segurança dos Dados</h2>
            <p className="text-muted-foreground">
              A plataforma adota medidas técnicas e organizacionais para proteger os dados pessoais,
              incluindo: transmissão criptografada via HTTPS/TLS, autenticação via OAuth 2.0, controle
              de acesso por sessão autenticada, banco de dados gerenciado com backups automáticos e
              monitoramento de acessos. Em caso de incidente de segurança que possa acarretar risco ou
              dano relevante aos titulares, a ANPD e os usuários afetados serão notificados nos termos
              do art. 48 da LGPD.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
            <p className="text-muted-foreground">
              A plataforma utiliza cookies essenciais (necessários para autenticação e funcionamento),
              cookies de preferências (armazenam configurações do usuário) e cookies de analytics
              (medem o uso da plataforma de forma agregada e anonimizada). O usuário pode gerenciar
              suas preferências de cookies a qualquer momento pelo banner de consentimento ou pelas
              configurações do navegador.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Alterações desta Política</h2>
            <p className="text-muted-foreground">
              Esta Política de Privacidade pode ser atualizada periodicamente. Alterações relevantes
              serão comunicadas aos usuários por e-mail ou por aviso na plataforma com antecedência
              mínima de 15 dias. A versão vigente estará sempre disponível nesta página, com a data
              da última atualização indicada no topo.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Contato</h2>
            <p className="text-muted-foreground">
              Para exercer seus direitos, esclarecer dúvidas ou apresentar reclamações relacionadas
              à proteção de dados, entre em contato com o Encarregado de Dados (DPO) pelo e-mail{" "}
              <a href={`mailto:${EMAIL_DPO}`} className="text-amber-500 hover:underline">{EMAIL_DPO}</a>{" "}
              ou pelo suporte geral em{" "}
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
            <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
