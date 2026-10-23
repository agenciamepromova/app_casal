# Semana fictícia pela interface — verificação de usabilidade

Teste executado no preview remoto compartilhado do commit `eef9990`, em navegador de teste novo com toque emulado, sem sessão real. Foi automação da interface, não uma pessoa testando no celular. Nenhum lançamento foi inserido diretamente no storage ou no banco: todos foram submetidos pelos formulários. Storage foi somente lido para conferência. Isso não preenche o navegador de Nikson ou Brenda, pois cada navegador tem sua demo local.

## Registros efetivamente enviados pela UI

Foram excluídos pela UI os sete registros fictícios iniciais do navegador de teste. Em seguida foram enviados estes 13 registros, todos pagos/recebidos, com conta fictícia escolhida explicitamente. Categorias ficaram vazias, sem inventar classificação.

| Registro | Quantidade | Valor | Contexto |
|---|---:|---:|---|
| Segunda 19/10/2026 | 28 garrafas × R$ 13 | R$ 364,00 | Açaí |
| Terça 20/10/2026 | 30 × R$ 10 | R$ 300,00 | Açaí |
| Quarta 21/10/2026 | 31 × R$ 12 | R$ 372,00 | Açaí |
| Quinta 22/10/2026 | 32 × R$ 11 | R$ 352,00 | Açaí |
| Sexta 23/10/2026 | 33 × R$ 11 | R$ 363,00 | Açaí |
| Sábado 24/10/2026 | 35 × R$ 11 | R$ 385,00 | Açaí |
| Domingo 25/10/2026 | 28 × R$ 13 | R$ 364,00 | Açaí |
| Compra de polpa | 31 kg na descrição | R$ 465,00 | Açaí |
| Compra de açúcar | 2 pacotes na descrição | R$ 21,96 | Açaí |
| Compra de preparador | 5 pacotes na descrição | R$ 75,00 | Açaí |
| Compra de embalagens | 217 unidades na descrição | R$ 217,00 | Açaí |
| Combustível hipotético do negócio | — | R$ 139,00 | Açaí |
| Alimentação pessoal hipotética | — | R$ 123,00 | Casa |

Conferidos na tabela e em Início: **R$ 2.500,00 entrou, R$ 1.040,96 saiu, R$ 1.459,04 de variação de caixa**. As quantidades efetivamente enviadas no campo opcional somaram 217 nas observações das sete vendas. O produto não tem consolidação de quantidade/estoque; essa soma foi calculada pelo teste a partir dos registros enviados.

Compras pagas somam R$ 778,96. O custo consumido estimado de R$ 767,15 foi conferido somente no indicador separado de `/demo/acai-demo`, nunca lançado como outra despesa. R$ 11,81 de diferença de estoque são cálculo ilustrativo, não movimentação ou controle de estoque persistido. Nenhuma sobra é apresentada como lucro líquido.

## Caminho e contagem

Contexto Açaí selecionado uma vez para o grupo; Casa escolhido separadamente para alimentação pessoal. Conta escolhida em cada registro, porque existem várias contas fictícias e não há um padrão válido configurado.

- Venda diária com quantidade: 4 campos preenchidos (valor, descrição, conta e quantidade), aproximadamente **8 toques**.
- Despesa diária: 3 campos (valor, descrição e conta), aproximadamente **6 toques**.
- Para lançar retrospectivamente a semana, foi necessário abrir detalhes e ajustar Data e Pago/Recebido em: 3 toques e 2 campos adicionais por registro. Resultado: aproximadamente 11 toques/6 campos para venda e 9 toques/5 campos para despesa.

Toques em botões/campos foram emulados e contados; seleção nativa de conta usou `selectOption`, estimada como abrir e escolher (2 toques). Digitação, teclado do sistema, rolagem e esforço humano não foram medidos. Os números são uma medida operacional do caminho automatizado, não resultado de estudo humano de usabilidade. Detalhamento por lançamento em `week-simulation-ui-result.json`.

## Edição e exclusão

- Terça editada temporariamente de R$ 300 para R$ 310: resultado passou a R$ 1.469,04. Restaurada a R$ 300: voltou a R$ 1.459,04. Nenhum registro duplicado.
- Exclusão da alimentação pessoal primeiro cancelada: 13 registros preservados. Depois confirmada: somente esse registro saiu, restaram 12 e a variação passou a R$ 1.582,04. Alimentação foi reenviada pela UI e o estado canônico voltou a 13 registros/R$ 1.459,04.
- Recarga preservou os 13 registros no navegador de teste. Zero requisições Supabase e zero pageerrors.

## Zerar a demonstração

O preview compartilhado `eef9990` tem exclusão individual com confirmação, mas não tinha controle para zerar tudo. A alteração seguinte prepara **Configurações → Zerar demonstração**, visível somente no provider da demo isolada.

A confirmação informa que remove somente lançamentos, compromissos, metas e saldos iniciais fictícios deste navegador; preserva contas, categorias e contextos. Não faz chamadas ao Supabase. O método recusa execução fora de `/demo`, inclusive em modo offline sem cliente remoto, e recusa quando há cliente remoto.

Validação do controle feita no build local: cancelar mantém os registros; confirmar zera as listas/saldos; configurações e marcador do armazenamento do modo real ficam intactos; recarga continua vazia e Início mostra zeros. Zero requisições Supabase. Evidência em `demo-reset-result.json`, além dos dois testes de regra.

Se outro preview for gerado, ele não recebe automaticamente o link compartilhado do deployment anterior. A liberação de acesso ao novo alvo deve ser autorizada separadamente. Produção, PR draft e banco real não são alvo desses testes.
