# Cartão compartilhado — proposta técnica mínima, ainda não integrada

Este pacote é uma proposta revisável. Não é uma migração registrada em `supabase/migrations`, não foi aplicada ao Supabase e não habilita persistência na demo do cartão.

## Modelo e regras

Cinco tabelas novas, aditivas: `credit_cards` (espaço, fechamento, vencimento, autoria), `card_purchases` (valor total, data, categoria/contexto e parcelas), `card_invoices` (ciclo com datas congeladas), `card_installments` (centavos por fatura) e `card_invoice_payments` (pagamento, conta de origem e movimentação de caixa única). Nenhum registro histórico é reclassificado.

- `record_card_purchase(id, card, description, date, amount, count, category?, project?)`: transação única cria compra e parcelas, sem criar saída de caixa. UUID fornecido pelo cliente permite retry; payload diferente com o mesmo UUID é recusado. Compra no fechamento entra no próximo ciclo, premissa visível que precisa corresponder ao emissor.
- `pay_card_invoice(invoice, account, date, request, expected_amount)`: bloqueia a fatura, verifica valor e conta do mesmo espaço, gera uma única saída em `transactions` e vincula o pagamento. Repetir, inclusive pelo outro integrante, retorna o mesmo movimento. Uma compra posterior não altera silenciosamente uma fatura paga.
- A compra é o detalhe da despesa no cartão; o pagamento é a saída de caixa, não uma segunda compra. Início continua apresentando fluxo de caixa. Análise de categorias deve usar compras do cartão e excluir pagamentos identificados por `card_invoice_payments.transaction_id` da soma de despesas por competência.
- `card_cash_allocations` distribui o pagamento por contexto/categoria das parcelas. O total das alocações é o mesmo pagamento, sem criar lançamentos adicionais. Isso evita atribuir arbitrariamente uma fatura mista a Casa, Açaí ou Marketing.
- Categoria e projeto são opcionais e validados contra o mesmo espaço; categoria não representa a atividade. Não se escolhe conta ou categoria automaticamente sem contexto válido.

Os ciclos só são configurados na criação nesta proposta. Alteração do fechamento/vencimento com histórico exige versionamento por vigência; o cliente não pode mudar esses campos diretamente. Pagamentos são integrais. Estorno, juros, pagamento parcial, parcelamento da fatura, ajuste de ciclo e conciliação com fatura paga ainda exigem regras próprias; não estão implementados no SQL ou na UI.

## Segurança

RLS habilitada nas cinco tabelas; leitura somente por integrante ativo do espaço. Anônimo sem grants. Cliente só cadastra cartão e altera nome/ativo; autoria, espaço, datas e totais não podem ser reassociados diretamente. Compras, faturas, parcelas e pagamentos são somente leitura para o cliente, escritos pelos RPCs transacionais.

Entradas públicas são `SECURITY INVOKER`. Implementações privilegiadas ficam em `private`, com `search_path=''`, autenticação e associação ativa verificadas explicitamente, e execução revogada de PUBLIC/anon. Não usam `user_metadata` para autorização e não aceitam autoria/espaço fornecidos pelo cliente. A view é `security_invoker`, exigindo PostgreSQL 15 ou superior.

Antes de adoção real, revisar com o schema/RLS reais, advisors e equipe responsável. Os testes em memória usam `auth.uid()` e associação sintéticos, não validam JWT real nem a exposição de schemas do PostgREST.

## Recorrentes

Água/luz e outros pagamentos já usam a Agenda existente. Para cobrança recorrente **no cartão**, a próxima mudança precisa de `credit_card_id` opcional em `financial_commitments` e vínculo único `(source_commitment_id, source_occurrence_date)` na compra. Ao confirmar a ocorrência no cartão, um RPC deve criar a compra idempotente em vez de chamar a liquidação bancária atual. As datas continuam saindo de `commitmentOccurrences`, sem outro motor. Esse adaptador não faz parte de `up.sql` e não deve ser anunciado como pronto.

## Migração e rollback

`up.sql` é aditivo e não altera tabelas existentes; depende de `households`, `accounts`, `categories`, `projects`, `transactions`, `auth.users`, `auth.uid()` e `private.is_active_member()` com o contrato atual. Nenhuma migração histórica deve ser reaplicada cegamente: há scripts antigos com operações destrutivas.

`down.sql` só reverte quando todas as tabelas novas estão vazias. Com qualquer dado de cartão presente, falha atomicamente e preserva tudo. Para rollback após uso real, primeiro desligar a funcionalidade na aplicação e manter tabelas/dados; arquivamento/exportação e eventual remoção precisam de plano específico. Não existe rollback seguro que simplesmente apague movimentações financeiras.

## Testes executados em isolamento

Execução realizada com `@electric-sql/pglite@0.5.11` instalado apenas em `task-3/qa-tools`, fora das dependências da aplicação. O harness instancia PostgreSQL 18.6 em memória, cria apenas pré-requisitos fictícios, executa up/testes/down e descarta a instância. Não recebe URL ou credencial de banco e não abre conexão com Supabase. Veja `result.json` para evidência.

Para repetir, instale essa versão em uma pasta temporária. Defina `PGLITE_MODULE` como o URL `file:///.../node_modules/@electric-sql/pglite/dist/index.js` da instalação e execute `node docs/proposals/card-persistence/test.mjs` a partir de `rebuild/`. Esse valor é só o caminho de uma biblioteca local, não um endpoint ou credencial. Se a biblioteca já estiver resolvível como dependência local, a variável é dispensável.

Passaram 14 grupos de verificações: criação, dois integrantes do mesmo espaço, autoria, campos imutáveis, outro espaço, integrante inativo, referências cruzadas, divisão de centavos, idempotência da compra, ciclo, pagamento único por dois integrantes, alocação de contexto, recusa de alteração de fatura paga, anônimo, rollback com dados bloqueado e rollback vazio preservando tabela/transação preexistente. Os grupos relacionados são consolidados em `result.json`.

Não executados: concorrência com duas conexões reais, PostgREST/JWT/RLS do projeto real, migração remota e integração de UI persistida. PGlite usa uma conexão; não demonstra ausência de deadlock/corrida real. Repetir em um ambiente Supabase isolado autorizado antes de integrar.

Referência da instância efêmera: [API oficial do PGlite](https://pglite.dev/docs/api).

## Dependências reais e próximo passo viável

O preview atual foi compilado com o endpoint público `qeuiiixxwfndczjlxkqi.supabase.co`. A consulta pública de disponibilidade falhou em resolução de nome e o conector disponível negou acesso ao projeto. Isso não prova que ele foi apagado ou pausado; seu estado permanece não confirmado. Não houve reativação, troca de endpoint, criação de credenciais ou tentativa por outra conta.

É viável continuar validando usabilidade em `/demo`, que não cria cliente Supabase e tem armazenamento fictício próprio. Uso diário compartilhado depende primeiro de acesso autorizado a um ambiente Supabase isolado, confirmação dos usuários/associação ao espaço e teste de autenticação sem pedir senhas em chat. Depois: revisar/registrar a migração aditiva, testar RLS e concorrência reais, ligar consultas/RPCs ao app com distinção de caixa/competência e validar Nikson/Brenda. Produção continua fora deste pacote.
