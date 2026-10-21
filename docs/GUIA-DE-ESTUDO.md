# Guia de estudo

Conceitos usados neste projeto, na ordem sugerida de estudo. Para cada um: o que é, onde aparece no código, um exercício
e onde aprender mais. Depois de cada exercício, rode `npm test` e `npm run test:e2e`.

## Parte 1: React

### 1. Componentes, props e estado

Um componente React é uma função que recebe **props** e devolve a interface. **Estado** (`useState`) é o que muda com a
interação; quando muda, o componente renderiza de novo. Dados descem por props, e eventos sobem por callbacks
(`onOpenCard`, `dispatch`).

- **No código:** [`column-view.tsx`](../src/components/column-view.tsx) usa estado local para "renomeando" e
  "adicionando".
- **Exercício:** mostre no cabeçalho da coluna quantos cartões têm a etiqueta Urgente.
- **Leia:** [react.dev: Thinking in React](https://react.dev/learn/thinking-in-react).

### 2. Reducer e imutabilidade

Em vez de espalhar mudanças pelo código, toda alteração vira uma **ação** (`{ type: "moveCard", ... }`) tratada por uma
função pura, o **reducer**: recebe o estado e a ação e devolve um estado **novo**, sem alterar o antigo. Isso deixa a
lógica previsível e fácil de testar, e o React detecta mudanças comparando referências.

- **No código:** `boardReducer` em [`board.ts`](../src/lib/board.ts); o teste "não altera o estado original".
- **Exercício:** crie a ação `duplicateCard` e o teste dela.
- **Leia:** [react.dev: Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer).

### 3. Estado normalizado

Guardar os cartões dentro das colunas obrigaria a procurar e copiar listas aninhadas a cada mudança. Normalizado, cada
cartão existe uma vez (`cards[id]`) e as colunas guardam só a **ordem** dos ids. Mover um cartão é mexer em duas listas
de strings.

- **Para pensar:** como ficaria `moveCard` se os cartões estivessem dentro de `columns[i].cards`?

### 4. Store externo com `useSyncExternalStore`

O quadro vive fora do React, num objeto com `getSnapshot`, `subscribe` e `dispatch`. `useSyncExternalStore` conecta esse
store aos componentes. O terceiro argumento (`getServerSnapshot`) diz o que renderizar no servidor; aqui é `null`,
porque o localStorage só existe no navegador. O evento `storage` mantém várias abas sincronizadas.

- **No código:** [`store.ts`](../src/lib/store.ts).
- **Exercício:** abra o app em duas abas, mova um cartão numa e veja a outra atualizar.
- **Leia:** [react.dev: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).

## Parte 2: Next.js

### 5. App Router, Server e Client Components

No App Router, cada pasta em `src/app` é uma rota, e `layout.tsx` envolve as páginas. Por padrão os componentes rodam no
**servidor**; `"use client"` marca os que precisam de interatividade (estado, eventos, APIs do navegador). Aqui,
`page.tsx` e `layout.tsx` são de servidor e o quadro é cliente.

- **No código:** [`src/app`](../src/app) e o `"use client"` no topo dos componentes.
- **Leia:** a documentação que vem com o pacote, em `node_modules/next/dist/docs/01-app/01-getting-started/` (comece por
  `05-server-and-client-components.md`).

### 6. Renderização estática e hidratação

`next build` gera o HTML da página de antemão (rota marcada com ○). No navegador, o React **hidrata**: liga os eventos
ao HTML que já está lá. Se o primeiro render no cliente for diferente do HTML do servidor, dá **erro de hidratação**.
Por isso o quadro só aparece depois de ler o localStorage, e antes disso mostra um esqueleto igual nos dois lados.

- **No código:** `BoardSkeleton` em [`kanban-app.tsx`](../src/components/kanban-app.tsx); o teste E2E falha se houver
  erro no console.
- **Leia:** `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.

### 7. Tema sem flash

Se o tema fosse aplicado num `useEffect`, a página apareceria clara por um instante antes de ficar escura. Um script
inline no `<head>` roda **antes da primeira pintura** e aplica `data-theme`. O ícone do botão usa CSS (`dark:hidden`) em
vez de estado, para o HTML ser o mesmo no servidor e no cliente.

- **No código:** `themeScript` em [`layout.tsx`](../src/app/layout.tsx) e [`theme-toggle.tsx`](../src/components/theme-toggle.tsx).

## Parte 3: Interface

### 8. Tailwind CSS 4

Classes utilitárias (`flex`, `gap-4`, `rounded-lg`) estilizam direto no JSX. O Tailwind 4 se configura no próprio CSS:
`@custom-variant dark` faz o prefixo `dark:` seguir o atributo `data-theme` em vez de só a preferência do sistema.

- **No código:** [`globals.css`](../src/app/globals.css).
- **Exercício:** adicione um terceiro tema ("sépia") com outro valor de `data-theme`.
- **Leia:** [Tailwind CSS: Dark mode](https://tailwindcss.com/docs/dark-mode).

### 9. Arrastar e soltar com dnd-kit

- **Sensores** traduzem mouse, toque e teclado em arraste. O `PointerSensor` só começa depois de 5px, para um clique
  abrir o cartão.
- **Droppables e sortables:** cada coluna é uma área de soltar, e cada cartão é um item ordenável.
- **`onDragOver`** move o cartão para a outra coluna durante o arraste, para ela abrir espaço; **`onDragEnd`**
  reordena; **`onDragCancel`** restaura a foto tirada no início.
- **`DragOverlay`** desenha a cópia que segue o cursor.

- **No código:** [`board-view.tsx`](../src/components/board-view.tsx).
- **Caso real:** a cópia flutuante era girada com `rotate-2` no elemento que o dnd-kit mede. A caixa girada "vazava"
  2px para a esquerda, e a seta → no teclado escolhia o cartão de cima em vez da próxima coluna. O teste E2E pegou o
  bug; a correção foi girar só um elemento interno.
- **Leia:** [dnd-kit: documentação](https://docs.dndkit.com).

### 10. Acessibilidade

- O cartão é focável e tem `aria-roledescription`; Espaço pega, setas movem, Espaço solta, Esc cancela.
- Os **anúncios** (`announcements`) informam o leitor de tela sobre cada passo, em português.
- O `<dialog>` nativo prende o foco e fecha com Esc. Botões de etiqueta usam `aria-pressed`.
- As colunas são `section` com `aria-label`, o que os testes também usam para achar elementos (`getByRole("region")`).

- **Exercício:** navegue pelo app só com o teclado e anote o que ficou difícil.
- **Leia:** [MDN: ARIA](https://developer.mozilla.org/pt-BR/docs/Web/Accessibility/ARIA) e
  [WAI-ARIA: drag and drop](https://www.w3.org/WAI/ARIA/apg/).

### 11. Validação de dados externos

Um JSON importado pode vir de qualquer lugar. `parseBoard` confere cada campo, descarta o que não reconhece e nunca
confia no formato. A mesma função valida o que vem do localStorage, que o usuário também pode editar.

- **No código:** `parseBoard` em `board.ts`.
- **Exercício:** compare com a biblioteca [Zod](https://zod.dev) e reescreva `parseBoard` com ela.

## Parte 4: Testes e entrega

### 12. Testes unitários com Vitest

O reducer, os filtros, a validação e o store são testados sem navegador real (`jsdom` simula o `localStorage`).

- **No código:** [`board.test.ts`](../src/lib/board.test.ts) e [`store.test.ts`](../src/lib/store.test.ts).
- **Leia:** `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`.

### 13. Testes de ponta a ponta com Playwright

O Playwright abre um Chromium de verdade contra o build de produção e simula um usuário: clica, digita, arrasta com o
mouse e com o teclado, recarrega a página. Há um projeto que emula um celular (Pixel 7). Os seletores usam papéis e
rótulos acessíveis (`getByRole`, `getByLabel`), o que também garante que a interface é acessível.

- **No código:** [`e2e/`](../e2e) e [`playwright.config.ts`](../playwright.config.ts).
- **Exercício:** rode `npx playwright test --ui` e assista aos testes passo a passo.
- **Leia:** [Playwright: Writing tests](https://playwright.dev/docs/writing-tests).

### 14. CI e deploy

O workflow roda lint, formatação, tipos, testes unitários, build e testes E2E a cada push. Se um E2E falha, o relatório
HTML fica disponível como artefato. Na Vercel, cada push na `main` vira deploy e cada PR ganha uma URL de prévia.

- **No código:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Próximos passos

- **Backend:** salvar os quadros num banco (por exemplo, Postgres) usando Server Functions e `useOptimistic`, como no
  guia `node_modules/next/dist/docs/01-app/02-guides/interactive-apps.md`. O `links-api` mostra como fazer a parte da
  API com autenticação.
- **Vários quadros** com rotas dinâmicas (`app/quadros/[id]/page.tsx`).
- **Desfazer/refazer** guardando o histórico de ações do reducer.
- **PWA** para funcionar offline e ser instalado no celular.
