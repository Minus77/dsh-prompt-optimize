# Modelos

[中文](./TEMPLATES.md) · [English](./TEMPLATES.en.md) · [Español](./TEMPLATES.es.md) · [Français](./TEMPLATES.fr.md) · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md) · **Português (BR)**

O plugin vem com quinze modelos. Você os alterna no canto superior direito do painel do otimizador; alternar muda **como o rascunho é reescrito**, nunca o próprio rascunho.

Cada modelo cobre uma faceta diferente do mesmo problema:

- **Básico** — transforma uma frase em uma tarefa completa (resumo da tarefa, contrato de papel, persona do agente);
- **Estrutura** — traz os critérios de aceitação para o início (contrato de entrega);
- **Exemplos** — fixa estilo e formato com amostras (exemplos trabalhados);
- **Raciocínio** — força execução passo a passo com pontos de checagem (etapas de raciocínio);
- **Iterar** — edições mínimas sobre uma versão existente (edição incremental).

---

## Resumo da tarefa

**Mode**: prompt · **Group**: básico · **Padrão**

A opção de uso geral. Melhor para rascunhos que declaram um objetivo mas nenhum detalhe: "write me something", "take a look at this".

**Formato da saída**: objetivo / informações conhecidas / entregável / restrições / formato de saída. Lacunas viram `待确认：…` (a confirmar) em vez de fatos inventados.

**Quando usar**

- o rascunho é uma frase, mas você sabe o que quer;
- um pedido falado precisa virar algo que outra pessoa consiga executar;
- você quer um prompt enviável sem acrescentar contexto à mão.

**Quando evitar**

- o requisito já tem critérios de aceitação rígidos (use contrato de entrega);
- o estilo importa mais que a estrutura e só exemplos conseguem transmiti-lo (use exemplos trabalhados).

**Exemplo**

> Rascunho: write a launch note for our new release, shipping Friday, for existing users

Vira mais ou menos:

```
Goal: a launch announcement for existing users about the release shipping this Friday.
Known: ships Friday; readers already use the product, so no from-scratch intro.
Deliverable: publishable Chinese note, under 300 characters.
Constraints: no overclaiming, no promises about unreleased features, no pricing.
Format: headline + three paragraphs + one call to action.
To confirm: what is the headline feature of this release?
```

---

## Contrato de entrega

**Mode**: prompt · **Group**: estrutura

Coloca "o que conta como pronto" em primeiro lugar. Melhor para trabalhos que serão revisados repetidamente: documentação, relatórios, mudanças de código, limpeza de dados.

**Formato da saída**: tarefa / entrada / especificação de saída / critérios de aceitação (3–6 itens verificáveis) / limites e exceções / proibições.

**Quando usar**

- outra pessoa vai conferir o resultado;
- as tentativas anteriores voltaram porque o padrão nunca foi escrito;
- o modelo deve pedir o material que falta em vez de adivinhar.

**Quando evitar**

- a tarefa é exploratória e o padrão ainda não é conhecido;
- um pedido de uma linha bastaria — um contrato só acrescenta peso.

**Exemplo**

> Rascunho: turn this weekly report into a one-pager for my manager

A reescrita acrescenta: qual relatório é a entrada, os campos e a ordem do one-pager, critérios de aceitação (conclusão primeiro, toda afirmação respaldada por um número, nenhuma sigla inexplicada) e o que fazer quando o texto ficar longo.

---

## Exemplos trabalhados

**Mode**: prompt · **Group**: exemplos

Para quando dois exemplos valem mais que um parágrafo de adjetivos. Modelos imitam formato muito melhor do que interpretam "make it professional".

**Formato da saída**: tarefa e escopo → 2–3 pares entrada → saída esperada → regras para entradas fora dos exemplos → uma observação de que as amostras são ilustrativas.

**Quando usar**

- o formato é rígido: colunas de tabela, tom de voz, estilo de código;
- você já tem duas ou três amostras do tipo "write it like this";
- a cobertura importa mais que repetir um único caso.

**Quando evitar**

- o rascunho não tem nada em que basear amostras — exemplos inventados enganam;
- o trabalho é aberto e criativo.

---

## Etapas de raciocínio

**Mode**: prompt · **Group**: raciocínio

Divide a tarefa em etapas executáveis e diz onde fazer a autoverificação e onde recuar.

**Formato da saída**: objetivo reafirmado → 3–7 etapas (entrada / ação / sinal de conclusão) → pontos de checagem → tratamento de falhas → formato de entrega.

**Quando usar**

- análise em várias etapas, depuração ou comparação de opções;
- resultados intermediários precisam de uma checagem humana;
- execuções anteriores foram até o fim pelo caminho errado.

**Quando evitar**

- a tarefa é de uma única etapa;
- o trabalho exige criatividade livre.

---

## Contrato de papel

**Mode**: prompt de sistema · **Group**: básico

Transforma uma linha de descrição de papel em um prompt de sistema que um agente consegue seguir por muito tempo. O painel ainda não expõe o modo sistema; use `POST /prompt-optimize/optimize` com `optimizationMode: "system"`.

**Formato da saída**: identidade / responsabilidades / fluxo de trabalho / limites / acordo de saída.

**Quando usar**

- o mesmo papel é reutilizado entre sessões;
- o papel precisa de critérios de julgamento, não apenas de um título.

**Quando evitar**

- você precisa de um prompt de tarefa pontual.

---

## Persona do agente

**Mode**: prompt de sistema · **Group**: básico

Escreve um arquivo que parece uma pessoa: como ela fala, como decide, o que oferece por conta própria, o que nunca faz, além de uma resposta de exemplo.

**Quando usar**

- o assistente precisa de uma voz e de um caráter estáveis;
- você quer uma persona, não uma descrição de cargo.

**Quando evitar**

- a redação de conformidade precisa permanecer estrita; o texto de persona atrapalha.

---

## Edição incremental

**Mode**: iterar · **Group**: iterar

Aplica uma nota de mudança ao resultado anterior com movimento mínimo: só as partes mencionadas mudam, todo o resto é preservado palavra por palavra.

**Formato da saída**: o prompt completo (não um diff). Quando a nota conflita com o texto, a nota vence.

**Quando usar**

- o resultado está no geral certo e você quer ajustar tom, comprimento ou um trecho;
- uma nota vaga como "make it more formal" precisa chegar a algo concreto.

**Quando evitar**

- a direção está errada — uma nova execução é mais rápida que uma cirurgia frase a frase.

**Exemplo**

> Nota: lighter tone, and collapse the long "to confirm" list into three lines

Só a formulação relacionada ao tom e essa lista mudam; títulos, pontuação e o resto permanecem idênticos.

---

## Revisão de código

**Mode**: Prompt · **Group**: Engenharia

Transforma "have a look at this code" em uma revisão com escopo e prioridades: declara para que serve a mudança, classifica as preocupações e fixa o formato de saída para você não receber uma lista rasa de opiniões de estilo.

**Saída**: escopo / prioridades / formato (severidade, local, problema, impacto, correção) / fora do escopo / evidências.

**Bom para**

- autorrevisão antes de um commit, ou pedido de revisão de PR;
- mudanças que atravessam vários arquivos e podem quebrar chamadores;
- feedback que dá para discutir, não "consider refactoring".

**Não serve para**: explicar o que um trecho de código faz (resumo da tarefa) ou implementar a correção (tarefa de implementação).

**Exemplo**

> Rascunho: have a look at this code, anything wrong?

Vira mais ou menos: escopo = os três arquivos deste PR, que adiciona idempotência ao checkout; prioridades = correção > concorrência > desempenho > legibilidade; cada achado cita arquivo:linha; nada de reescrever arquivos inteiros, nada de implicância com nomes, nada de adivinhar os chamadores upstream.

---

## Tarefa de implementação

**Mode**: Prompt · **Group**: Engenharia

Preenche um pedido de programação até virar um briefing de engenharia: objetivo e aceitação, restrições técnicas, contratos de interface, casos de borda e tratamento de falhas, formato de entrega. Produz uma **descrição de tarefa**, não o código.

**Saída**: objetivo e aceitação / restrições / interfaces / bordas e falhas / entrega / questões em aberto.

**Bom para**

- entregar uma mudança de porte médio a um agente ou a um colega;
- um pedido de uma linha cujos critérios de aceitação você já conhece;
- módulos compartilhados em que as interfaces precisam ser acordadas primeiro.

**Não serve para**: protótipos exploratórios em que o design surge enquanto se codifica.

**Exemplo**

> Rascunho: make export async so it stops blocking the request

Vira mais ou menos: endpoint de disparo, campo de status do job, polling ou callback, limite de concorrência, retry e timeout, checagens de permissão, como a UI mostra o progresso e quais chamadores existentes precisam mudar junto.

---

## Consulta SQL

**Mode**: Prompt · **Group**: Engenharia

Escreve um pedido de dados como uma tarefa de consulta com definições explícitas, campos e limites de desempenho, e pede que as premissas sejam listadas à parte.

**Saída**: tabelas e campos / definições (tempo, deduplicação, nulos, unidades) / formato do resultado / limites de desempenho / permissões / premissas.

**Bom para**

- relatórios, dashboards e análises ad hoc;
- métricas fáceis de definir de outra forma (ativo, retenção, GMV);
- varreduras grandes em que índice e intervalo devem ser declarados desde o início.

**Não serve para**: explicar uma consulta existente ou migrações de schema.

**Exemplo**

> Rascunho: new users per channel last week

Vira mais ou menos: definição de novo usuário (primeiro cadastro ou primeiro pedido), campo de canal e chave de deduplicação, fuso horário e os limites exatos da semana, se contas de teste contam, ordenação, além do intervalo de varredura e do índice permitidos.

---

## Design de testes

**Mode**: Prompt · **Group**: Engenharia

Escreve um pedido de testes como uma tabela de casos cobrindo caminho feliz, fronteiras, falhas e permissões, com prioridades e o que deve ser automatizado primeiro.

**Saída**: alvo e riscos / tabela de casos (id, pré-condições, passos, esperado) / cobertura / prioridade / recomendação de automação.

**Bom para**

- preencher casos antes de uma release;
- confirmar que não houve regressão depois de corrigir um bug;
- dar a quem não conhece a funcionalidade uma checklist acionável.

**Não serve para**: pedir scripts de automação diretamente (só quando o rascunho pedir isso).

**Exemplo**

> Rascunho: write test cases for login

Vira mais ou menos: login por senha, SMS e terceiros cobertos; bloqueio após N falhas; entrada vazia, muito longa e com caracteres especiais; e-mail não verificado; diferenças visíveis por papel; cada caso numerado e priorizado.

---

## Extração estruturada

**Mode**: Prompt · **Group**: Estrutura

Transforma "pull a few fields out of this" em uma tarefa de extração guiada por schema, com saída JSON estrita e regras explícitas para valores ausentes.

**Saída**: formato da entrada / schema (nome, tipo, obrigatório, enum) / regras para ausentes e conflitos / apenas JSON / um exemplo.

**Bom para**

- transformar contratos, e-mails, tickets ou páginas em dados estruturados;
- execuções em lote cuja saída precisa entrar direto em um banco de dados;
- deixar em branco em vez de adivinhar.

**Não serve para**: resumir ou reescrever conteúdo; imagens que precisam de OCR.

**Exemplo**

> Rascunho: get company, contact and amount from these emails

Vira mais ou menos: empresa a partir do corpo ou da assinatura, contato com ou sem cargo, moeda e tratamento tributário do valor, qual valor vence quando aparecem vários, null quando ausente, apenas JSON.

---

## Tradução

**Mode**: Prompt · **Group**: Escrita

Escreve um pedido de tradução como uma tarefa de localização com público, glossário e regras de formato. O ponto é o que não pode mudar: nomes de marca, nomes de campos, marcadores (placeholders), estrutura Markdown.

**Saída**: idioma e região / público e tom / glossário / formato / sem adições nem omissões.

**Bom para**

- textos de produto, páginas de ajuda e e-mail;
- um mercado específico em que reescrever vale mais que traduzir literalmente;
- textos contendo `{{variables}}`, blocos de código ou links.

**Não serve para**: textos jurídicos que ainda precisam de revisão humana.

**Exemplo**

> Rascunho: translate this into Japanese for a customer

Vira mais ou menos: japonês de negócios para um cliente corporativo japonês; manter nomes de produtos e `{{user_name}}`; manter títulos e listas em Markdown; nenhuma informação adicionada ou removida; produzir apenas a tradução.

---

## Polimento de texto

**Mode**: Prompt · **Group**: Escrita

Escreve um pedido de polimento como uma tarefa de revisão delimitada: até onde as edições podem ir, o que precisa ser preservado e nenhuma expansão. Impede que o modelo acrescente alegações, exemplos ou comprimento.

**Saída**: registro e leitor / profundidade de edição permitida / o que manter / o que é proibido / texto completo mais até três notas.

**Bom para**

- rascunhos cujos fatos estão corretos, mas cujo fluxo não;
- manter uma única voz em textos de comunicação externa;
- limitar a mudança à redação, não à estrutura.

**Não serve para**: conteúdo que carece do argumento e precisa de reescrita.

**Exemplo**

> Rascunho: make this sound more formal

Vira mais ou menos: quão formal (aviso público vs e-mail interno), se a ordem dos parágrafos pode mudar, quais números e conclusões devem permanecer literais, se as frases podem ser fundidas e uma lista curta das principais mudanças no final.

---

## Perguntas e respostas ancoradas em fontes

**Mode**: Prompt · **Group**: Raciocínio

Escreve "answer from these materials" como uma tarefa ancorada, com citações e um veredito explícito de "not covered" (não coberto), e pede que conflitos sejam listados com as fontes antes de qualquer julgamento.

**Saída**: escopo do material / regras de citação / declaração de não cobertura / tratamento de conflitos / estrutura (resposta, evidências, lacunas).

**Bom para**

- responder a partir de documentação, políticas ou contratos;
- respostas que precisam ser rastreáveis até uma fonte;
- material que pode se contradizer.

**Não serve para**: perguntas sem material em que se ancorar.

**Exemplo**

> Rascunho: how is annual leave calculated, per the handbook

Vira mais ou menos: apenas o manual, citando números de cláusula; dizer "not covered" (não coberto) para qualquer item ausente (por exemplo, proporcionalidade na rescisão); quando o manual e um aviso posterior discordarem, citar os dois primeiro e só então julgar.

---

## Modelos personalizados

O último item do menu de modelos é "New custom template", com três campos:

| Campo | Finalidade |
| --- | --- |
| Name | Exibido no menu; até 40 caracteres |
| Rewrite instruction | Como o modelo deve reescrever; até 2000 caracteres |
| Applies to | Uma linha sobre quais rascunhos se encaixam; opcional |

Modelos personalizados vivem no `localStorage` deste navegador e desaparecem com os dados do site. Use a exportação e a importação em JSON no editor para levá-los a outra máquina ou compartilhá-los.

---

## Como escolher

| Sua situação | Modelo |
| --- | --- |
| Uma frase que precisa virar uma tarefa completa | Resumo da tarefa |
| Outra pessoa vai aceitar o resultado | Contrato de entrega |
| Você tem amostras e teme desvio de formato | Exemplos trabalhados |
| Trabalho em várias etapas que costuma se perder | Etapas de raciocínio |
| No geral bom, você quer um ajuste pequeno | Edição incremental |

Mais modelos não é melhor: o mesmo rascunho sob modelos diferentes produz estruturas visivelmente diferentes. Escolha um padrão e troque só quando o trabalho mudar.

Voltar ao [README principal](./../README_en.md).
