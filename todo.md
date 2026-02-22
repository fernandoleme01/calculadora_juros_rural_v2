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
