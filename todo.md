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
- [ ] Integração com API do Banco Central (IPCA, TCR, Resoluções CMN)
- [ ] Gerador de laudo técnico-jurídico com memória de cálculo completa
- [ ] Jurisprudência real com números de processos (STJ, STF, TRF)
- [ ] Página de Dados do BCB com atualizações automáticas
- [ ] Laudo integrado ao fluxo de análise de contrato PDF
- [ ] Laudo integrado ao resultado da calculadora TCR
- [ ] Exportação do laudo em PDF

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
