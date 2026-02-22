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
