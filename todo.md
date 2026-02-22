# Calculadora de Juros em Crédito Rural - TODO

## Backend / Banco de Dados
- [x] Schema: tabela `calculos_tcr` para histórico de cálculos
- [x] Schema: tabela `users` para usuários autenticados
- [x] Rotas tRPC: calcular TCR pós-fixada (TCRpós)
- [x] Rotas tRPC: calcular TCR prefixada (TCRpré)
- [x] Rotas tRPC: calcular saldo devedor com juros remuneratórios e de mora
- [x] Rotas tRPC: validação de conformidade legal (limites 12% a.a. e 1% a.a.)
- [x] Rotas tRPC: salvar histórico de cálculos
- [x] Rotas tRPC: listar histórico de cálculos
- [x] Rotas tRPC: deletar cálculo do histórico
- [x] Rotas tRPC: gerar parecer técnico-jurídico via LLM
- [x] Rotas tRPC: obter limites legais vigentes
- [x] Rotas tRPC: obter jurisprudência relevante

## Frontend - Páginas
- [x] Layout principal com sidebar (DashboardLayout customizado)
- [x] Página Home (painel com limites legais e estatísticas)
- [x] Página Calculadora TCR (formulário completo)
- [x] Página Resultado do Cálculo (memória de cálculo detalhada)
- [x] Página Histórico de Cálculos (tabela com conformidade)
- [x] Página Fundamentação Legal (legislação, jurisprudência, doutrina)

## Frontend - Componentes
- [x] Formulário de dados do financiamento com validação zod
- [x] Seletor de modalidade (custeio/investimento/comercialização)
- [x] Seletor de tipo de taxa (pré/pós-fixada)
- [x] Painel de resultado com análise de conformidade
- [x] Tabela de histórico com ações (deletar)
- [x] Badge de status legal (conforme/atenção/não conforme)
- [x] Componente de memória de cálculo detalhada (accordion)
- [x] Componente de fundamentação jurídica
- [x] Alertas em tempo real de violação de limites legais
- [x] Parecer técnico-jurídico via IA (LLM)
- [x] Geração de PDF via impressão do navegador

## Qualidade
- [x] Testes vitest para funções auxiliares de cálculo
- [x] Testes vitest para TCRpós e TCRpré
- [x] Testes vitest para validação de limites legais
- [x] Testes vitest para conformidade legal
- [x] 27 testes passando com sucesso

## OCR — Análise de Contratos PDF
- [x] Backend: rota de upload de PDF com multer
- [x] Backend: extração de texto do PDF com pdf-parse
- [x] Backend: análise jurídica do contrato via OpenAI (GPT-4o)
- [x] Backend: extração estruturada de dados do contrato (valor, taxas, datas, modalidade)
- [x] Backend: validação automática de conformidade legal sobre os dados extraídos
- [x] Frontend: página "Análise de Contrato" com upload de PDF
- [x] Frontend: visualização do texto extraído (OCR)
- [x] Frontend: exibição dos dados estruturados extraídos
- [x] Frontend: análise de conformidade com base nos dados extraídos
- [x] Frontend: botão para pré-preencher calculadora TCR com dados do contrato
- [x] Testes vitest para extração e análise

## Laudo Completo e Integração BCB
- [x] Integração com API do Banco Central (IPCA, TCR, Resoluções CMN)
- [x] Gerador de laudo técnico-jurídico com memória de cálculo completa
- [x] Jurisprudência real com números de processos (STJ, STF, TRF)
- [x] Página de Dados do BCB com atualizações automáticas
- [x] Laudo integrado ao fluxo de análise de contrato PDF
- [x] Laudo integrado ao resultado da calculadora TCR
- [x] Exportação do laudo em PDF

## Gerador de Petição de Revisão Contratual
- [x] Backend: módulo gerador de laudo técnico-jurídico completo com jurisprudência real
- [x] Backend: módulo gerador de petição de Ação de Revisão Contratual de Crédito Rural
- [x] Backend: integração BCB (SELIC, IPCA, PTAX, MDCR) nas rotas tRPC
- [x] Backend: rota tRPC para buscar dados atualizados do BCB
- [x] Frontend: página "Petição de Revisão" com formulário de dados do contrato e evento
- [x] Frontend: visualização e edição da petição gerada
- [x] Frontend: exportação da petição em PDF
- [x] Frontend: página "Dados do BCB" com indicadores atualizados em tempo real
- [x] Frontend: integração do laudo ao resultado da calculadora TCR
- [x] Frontend: integração do laudo à análise de contrato PDF

## Integração SICOR/MDCR — Matriz de Dados do Crédito Rural
- [ ] Mapear endpoints SICOR disponíveis (programas, subprogramas, taxas, fontes de recursos)
- [ ] Backend: módulo sicor.ts com cache inteligente e fallback para dados offline
- [ ] Backend: endpoint tRPC para programas de crédito rural (PRONAF, PRONAMP, etc.)
- [ ] Backend: endpoint tRPC para taxas vigentes por programa/subprograma
- [ ] Backend: endpoint tRPC para fontes de recursos (MCR, FAT, Poupança Rural, etc.)
- [ ] Backend: endpoint tRPC para parâmetros Jm e FII por programa
- [ ] Frontend: seletor de programa/subprograma na calculadora TCR com preenchimento automático
- [ ] Frontend: página "Parâmetros MDCR" com tabela completa de taxas por programa
- [ ] Frontend: indicador de origem dos dados (BCB ao vivo vs. fallback offline)
- [ ] Testes vitest para o módulo SICOR

## Landing Page e Sistema SaaS
- [ ] Schema: adicionar campo `plano` (free/pro/admin) na tabela users
- [ ] Schema: adicionar campo `planoExpiracao` e `stripeCustomerId` na tabela users
- [ ] Migração do banco de dados com pnpm db:push
- [ ] Backend: rota tRPC para buscar plano do usuário atual
- [ ] Backend: rota tRPC para admin gerenciar planos
- [ ] Landing page: seção hero com headline e CTA de login
- [ ] Landing page: seção de funcionalidades (cards com ícones)
- [ ] Landing page: seção de planos (Free vs Pro) com tabela comparativa
- [ ] Landing page: seção de fundamentação legal (credibilidade)
- [ ] Landing page: rodapé com links e aviso legal
- [ ] Dashboard: banner de upgrade para usuários free
- [ ] Dashboard: bloqueio de funcionalidades premium (laudo IA, petição, OCR) para free
- [ ] App.tsx: rota pública `/` para landing page (sem DashboardLayout)
- [ ] App.tsx: rota `/app` para o dashboard (com DashboardLayout)
- [ ] Testes vitest para controle de acesso por plano

## Atualização de Planos e Preços
- [x] Landing page: 3 planos (Standard R$149/10 laudos, Premium R$329/25 laudos, Supreme R$1990/ilimitado)
- [x] Schema: atualizar enum de plano para standard/premium/supreme
- [x] Backend: controle de limite de laudos por plano
- [x] Landing page: toggle mensal/anual com desconto de 25% na seção de planos

## Controle de Acesso por Plano
- [x] Backend: rota tRPC para verificar plano e laudos usados do usuário
- [x] Backend: incrementar contador de laudos ao gerar laudo
- [x] Backend: bloquear geração de laudo após 1 uso no plano Free
- [x] Frontend: bloquear botão de exportar PDF para usuários Free
- [x] Frontend: bloquear impressão via CSS @media print para usuários Free
- [x] Frontend: exibir banner de upgrade quando Free atingir o limite
- [x] Landing page: adicionar plano Free (1 laudo, sem PDF/impressão) na seção de planos

## Painel Administrativo
- [x] Backend: rotas admin (listar usuários, alterar plano, estatísticas)
- [x] Backend: adminProcedure com verificação de role=admin
- [x] Frontend: página /app/admin com tabs (Clientes, Assinaturas, Financeiro, Laudos)
- [x] Frontend: bloqueio PDF/impressão para plano Free
- [x] Frontend: banner de upgrade para usuários Free
- [x] Landing page: adicionar plano Free (1 laudo, sem PDF)

## Integração Stripe — Cobrança de Assinaturas
- [x] Ativar feature Stripe no projeto (webdev_add_feature)
- [x] Configurar chaves STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET
- [x] Backend: criar produtos e preços no Stripe (Standard/Premium/Supreme mensal e anual)
- [x] Backend: rota tRPC para criar sessão de checkout do Stripe
- [x] Backend: webhook Stripe para atualizar plano após pagamento confirmado
- [x] Backend: rota tRPC para criar portal do cliente (gerenciar assinatura)
- [x] Backend: rota tRPC para cancelar assinatura
- [x] Schema: adicionar campo stripeCustomerId e stripeSubscriptionId na tabela users
- [x] Frontend: página de assinatura com cards de planos e botão de checkout
- [x] Frontend: redirecionamento após pagamento bem-sucedido
- [x] Frontend: botão "Gerenciar Assinatura" no dashboard para usuários pagos
- [x] Frontend: exibir status da assinatura (ativa, cancelada, expirada)
- [x] Painel Admin: exibir stripeCustomerId e status de assinatura por usuário
- [x] Testes vitest para lógica de webhook e atualização de plano

## Tradução da Interface
- [x] DashboardLayout: traduzir tela de login para português
- [x] DashboardLayout: traduzir botão "Sign out" para "Sair"

## Amortização com Periodicidade Configurável (Crédito Rural)
- [x] Backend: módulo amortizacao.ts com Price, SAC e SAF
- [x] Backend: periodicidade configurável (anual ou mensal) em todos os sistemas
- [x] Backend: cálculo de saldo devedor revisado após N parcelas pagas
- [x] Backend: tabela completa de amortização (planilha) com cada parcela
- [x] Backend: recálculo com taxa legal máxima (12% a.a.) para comparação
- [x] Backend: rota tRPC calcularAmortizacao
- [x] Frontend: seletor de periodicidade (anual / mensal) no formulário
- [x] Frontend: seletor de sistema de amortização (Price / SAC / SAF)
- [x] Frontend: campo de número total de parcelas e parcelas pagas
- [x] Frontend: tabela de parcelas pagas com valor informado pelo usuário
- [x] Frontend: exibição da planilha de amortização no resultado
- [x] Frontend: comparativo saldo contrato vs. saldo taxa legal
- [x] Frontend: valor do excesso cobrado por parcela

## Perfil Profissional — Advogado e Perito Técnico
- [x] Schema: tabela perfilAdvogado (userId, nome, OAB, CPF, email, telefone, escritório, endereço, cidade, estado, CEP)
- [x] Schema: tabela perfilPerito (userId, nome, categoria (contador/economista/administrador/tecnico_contabil), registro (CRC/CRA/CFC), CPF, email, telefone, empresa, endereço, cidade, estado, CEP)
- [x] Backend: rotas tRPC salvarPerfilAdvogado, buscarPerfilAdvogado
- [x] Backend: rotas tRPC salvarPerfilPerito, buscarPerfilPerito
- [x] Frontend: página /app/perfil com duas abas (Advogado e Perito Técnico)
- [x] Frontend: item de menu "Perfil Profissional" no DashboardLayout
- [x] Frontend: rota no App.tsx
- [x] Integração: petição de revisão contratual usa dados do perfilAdvogado na qualificação e assinatura
- [x] Integração: laudo técnico-jurídico usa dados do perfilPerito na assinatura e rodapé
- [x] Integração: GeradorPeticao.tsx pré-preenche campos do advogado com dados do perfil
- [x] Integração: laudo gerado inclui bloco de assinatura com nome, categoria e registro do perito

## Revisão das Fórmulas de Amortização e Campo de Parcela Paga
- [ ] Revisar fórmula Price: verificar conversão taxa anual → periódica (capitalização composta vs. simples)
- [ ] Revisar fórmula SAC: verificar cálculo de juros sobre saldo devedor por período
- [ ] Revisar fórmula SAF: verificar lógica de amortização francês adaptado
- [ ] Implementar campo "Valor da Parcela Paga" (o que o banco cobrou de fato)
- [ ] Calcular diferença: valor pago - valor legal = excesso por parcela
- [ ] Exibir coluna "Valor Pago" e "Diferença" na planilha de amortização
- [ ] Calcular excesso total acumulado com base nos valores reais pagos
- [ ] Memória de cálculo: mostrar passo a passo de cada fórmula com valores reais
- [ ] Testes vitest para as fórmulas corrigidas

## Análise de Cadeia Contratual — Operação Mata-Mata e Aditivos
- [x] Schema: tabela `cadeia_contratos` (userId, nome, banco, descricao, createdAt)
- [x] Schema: tabela `contrato_cadeia` (cadeiaId, ordem, tipo: original/aditivo/refinanciamento/novacao, numeroContrato, dataContratacao, valorContrato, valorPrincipalNovo, valorEncargosIncorporados, taxaJuros, numeroParcelas, modalidade, observacoes)
- [x] Backend: db helpers para CRUD de cadeias e contratos vinculados
- [x] Backend: função analisarCadeiaContratual() que detecta: rolagem de dívida, capitalização indevida de juros no novo principal, aumento abusivo do principal, violação do art. 39 do CDC e art. 478 do CC
- [x] Backend: router tRPC para criar, listar, buscar e deletar cadeias
- [x] Backend: router tRPC para analisar cadeia com IA (LLM) gerando laudo completo
- [x] Frontend: página /app/cadeia-contratos com lista de cadeias cadastradas
- [x] Frontend: formulário para criar nova cadeia e adicionar contratos vinculados
- [x] Frontend: visualização da cadeia em linha do tempo (timeline)
- [x] Frontend: painel de análise: valor original vs. valor atual, encargos incorporados, excesso acumulado
- [x] Frontend: detecção automática de "mata-mata" com alerta visual
- [x] Frontend: geração de laudo técnico-jurídico da cadeia contratual completa
- [x] Frontend: item de menu "Cadeia de Contratos" no DashboardLayout
- [x] Testes vitest para a lógica de detecção de rolagem de dívida

## Correção de Navegação
- [x] Corrigir redirecionamento automático: ao acessar "/" o sistema vai direto para /app sem mostrar a landing page
- [x] Landing page deve ser exibida sempre, com botão "Entrar" que redireciona para /app (ou login se não autenticado)

## Ajustes Visuais / Textuais
- [x] Atualizar badge de conformidade na landing page para incluir Manual de Crédito Rural e Jurisprudências

## Melhorias baseadas no MCR (Manual de Crédito Rural)

### 1. Limites Legais por Modalidade (MCR 7-1)
- [ ] Criar módulo `limitesLegais.ts` com tabela de taxas máximas por modalidade (MCR 7-1, Tabela 1)
- [ ] Custeio com recursos obrigatórios: 14% a.a. (Res. CMN 5.234)
- [ ] Investimento subvencionado: 12,5% a.a. (Res. CMN 5.234)
- [ ] Recursos não controlados: livre pactuação (mas sujeito à Lei de Usura para o STJ)
- [ ] Pronaf custeio: 5% a.a. (MCR 7-6)
- [ ] Pronaf microcrédito (Grupo B): 3% a.a. (MCR 7-6)
- [ ] Atualizar calculadora TCR para usar limite correto por modalidade
- [ ] Atualizar módulo de amortização para usar limite correto por modalidade
- [ ] Atualizar laudos e petições para citar o limite correto por modalidade

### 2. Módulo Pronaf (MCR 7-6)
- [ ] Criar página `/app/pronaf` com formulário específico para contratos Pronaf
- [ ] Identificar grupo do beneficiário (A, B, C, D, E, V, Agroindústria, etc.)
- [ ] Calcular taxa máxima permitida por grupo e finalidade
- [ ] Comparar taxa contratada vs. taxa máxima do Pronaf
- [ ] Gerar laudo específico para revisão de contratos Pronaf
- [ ] Adicionar item de menu "Pronaf" no DashboardLayout

### 3. Fundamentação dos Laudos com Citações do MCR
- [ ] Atualizar `geradorPeticao.ts` para incluir citações do MCR (seção, item, resolução)
- [ ] Atualizar `analiseCadeia.ts` para incluir citações do MCR nos alertas
- [ ] Atualizar `calculoTcr.ts` para referenciar MCR 2-4 (metodologia TCR)
- [ ] Atualizar `amortizacao.ts` para referenciar MCR 2-6 (reembolso) e MCR 7-1 (encargos)

## Identidade Visual / Nome da Plataforma
- [x] Substituir todas as ocorrências de nomes incorretos por "Juros Rurais Pro" em todos os arquivos

## Integração Dados BCB (TR, TJLP, Taxa Crédito Rural)
- [x] Adicionar TR (SGS 226), TJLP (SGS 256) e Taxa Média Crédito Rural (SGS 20714) à página Dados do BCB
- [x] Adicionar CDI Mês (BCB SGS 4391) ao backend e frontend da página Dados do BCB
