# Revisão mobile — Plano a Dois

Base: `feat/rebuild-foundation`, commit `f289580b0a4c9400d02b8ca630c4b24d215a55a8`.
Branch: `feat/mobile-simplification`. Produção/main não é alvo desta revisão.

## Para testar

O caminho `/demo` é uma entrada pública da aplicação para fixtures, separado do login real (a proteção externa da Vercel permanece). Nele, o provider não instancia Supabase, a navegação usa `/demo/...` e o armazenamento usa `plano-a-dois-public-demo-v1`. O modo real continua em `/login` e nas rotas normais. O link de preview não fornece uma sessão da aplicação.

Verificação adicional: build com endpoint remoto fictício configurado, 30 testes unitários e `scripts/public-demo-qa.mjs`. Testado zero requisições Supabase, nenhuma chave de sessão, armazenamento do modo real intacto, registro/recorrente fictícios, navegação e recarga em 320/375/390/430/1366. O dashboard normal continuou protegido e redirecionou ao login. Nenhum dado real foi usado como fixture.

1. Em Início, toque em **Adicionar conta recorrente**. Informe título, valor previsto, primeiro vencimento e conta. A repetição padrão é mensal; é possível escolher uma única vez.
2. Na Agenda, confirme **Paguei/Recebi**, ajustando o valor efetivo quando necessário. Só a ocorrência escolhida é liquidada. Cancelar uma recorrência cancela a série; pagamentos anteriores permanecem.
3. Em Dinheiro, registre entrada ou saída com valor, descrição e conta. A categoria pode ficar vazia; conta não é escolhida automaticamente quando há várias. Data padrão é hoje. Data, situação, categoria, observação e autoria ficam em detalhes opcionais.
4. Selecione um projeto em Contexto e abra um registro novo: ele herda o `projectId`. Tudo não atribui projeto. Casa/Açaí/Marketing só podem ser selecionados depois que existirem como projetos; não há reclassificação do histórico.
5. Mais preserva acesso a contas, categorias, projetos, metas, membros, convites e configurações.

## Cartão: demonstração, ainda sem persistência compartilhada

`/cartao-demo` é um protótipo explícito e transitório. Não chama Supabase, não usa localStorage e não modifica AppState. Sair da página ou recarregar apaga os exemplos. Não é uma funcionalidade financeira persistida para uso diário.

Modelo puro em `src/domain/cards.ts`: configuração de fechamento/vencimento, compras, parcelas em centavos e pagamentos de fatura separados. A compra cria obrigação, não saída de caixa; o pagamento é contado separadamente, sem criar uma segunda compra. Divisão preserva o total de centavos. Pagamento repetido da mesma fatura é idempotente no modelo.

Premissa visível: compra no dia do fechamento entra no próximo ciclo. Dias 29/30/31 são limitados ao último dia do mês sem desviar os meses seguintes. Não há integração com banco; total previsto depende da completude dos lançamentos e das regras reais do emissor.

Dependência para uso compartilhado: o schema atual NÃO contém cartões, ciclos de fatura, compras ou parcelas. Antes de ligar este modelo aos dados reais, precisa de desenho/revisão de tabelas de cartões (household, fechamento, vencimento), compras/parcelas (categoria/projeto/autoria), faturas e pagamentos (conta de origem, data, valor, vínculo único com movimentação), RLS por household e operação transacional idempotente de pagamento. É preciso separar despesa por competência de saída de caixa, inclusive em pagamentos parciais, estornos, juros e fechamento. Nenhuma migração foi criada ou executada. Não foi improvisada persistência em notas/categorias.

## Correções

- Resultado filtrado considera somente realizados, com sinal correto; não inclui previstos/pendentes/cancelados.
- Mês de realizado usa a data efetiva de pagamento/recebimento; previsão usa vencimento, com fallback para data do registro.
- Início resume Entrou, Saiu, Resultado e Ainda a pagar, sem chamar resultado de saldo bancário.
- Próximos compromissos exclui ocorrências liquidadas e séries concluídas/canceladas.
- Datas mensais preservam dia âncora em meses curtos, usando o motor existente da Agenda.
- Edição preserva autoria e vínculos de ocorrência. O checkbox que só marcava booleano foi substituído por link para a Agenda; indicadores históricos são preservados.
- Modal com Escape, foco contido, retorno de foco e confirmação de descarte. Campos de dinheiro usam teclado decimal e botões têm ao menos 48 px nas telas novas.

## Açaí

`/acai-demo` mantém receita estimada ajustável e semana canônica fictícia fora dos dados financeiros. 217 garrafas, R$ 2.500 de receitas. Consumo parcial R$ 767,15; compras pagas R$ 778,96; combustível do negócio R$ 139; alimentação pessoal R$ 123. Variação de caixa R$ 1.459,04, comparação parcial R$ 1.470,85, diferença de estoque R$ 11,81. Consumo e compras não são descontados duas vezes. Não se apresenta lucro líquido. Venda no contexto Açaí permite quantidade opcional, explicitamente salva na observação existente; não cria consumo/despesa estimada nem novo campo no banco.

## Verificação

Testes locais automatizados: lint, typecheck, testes unitários e build Next. `npm run test:mobile` inicia um navegador novo com fixture fictícia e usa exclusivamente `http://localhost:3103`. Execute antes `npm run build`, `npm run start -- --port 3103` e `npx playwright install chromium`. No Windows, pode ser necessário configurar PLAYWRIGHT_BROWSERS_PATH para a instalação existente. Evidências são escritas em `../../qa-results`.

Navegador: 320, 375, 390, 430 e 1366 px, nas telas Início, Dinheiro, Agenda, Mais e Cartão; sem overflow horizontal. Exercitados entrada/saída sem detalhes, contexto herdado, autoria Brenda ao editar como Nikson, cancelamento de descarte, Escape, foco circular, recorrência mensal, valor variável ao pagar, cancelamento da série preservando pagamento, parcelas e pagamento isolados do histórico e descarte da demo ao recarregar. Zero pageerrors nessa execução.

Não executado: autenticação com os dois usuários reais, testes de RLS/concorrência no banco ou pagamento real. Não há sessão de teste autorizada disponível neste ambiente; nenhuma senha foi solicitada. A função remota `settle_financial_commitment` e o índice único existentes foram preservados. Supabase não foi reativado. A demo local de confirmação agora funciona para poder testar UX sem o banco.

Instalação identificou 9 avisos de dependências herdadas (1 moderado, 5 altos, 3 críticos). Não foi aplicado `audit fix --force` ou atualização ampla neste lote de UX. Revisar antes de qualquer promoção de produção.

## Rollback e exclusões

Rollback: manter main e a base intactos; descartar/reverter apenas esta branch de revisão. Não houve alteração de schema, exclusão de dados, criação de credenciais, serviço pago, PWA, WhatsApp ou trabalho em Orion/Elias/GTM.
