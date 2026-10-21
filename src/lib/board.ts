// Modelo do quadro e reducer. Tudo aqui é puro (sem React, sem localStorage), o que facilita testar.

export const LABELS = {
  bug: { name: "Bug", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
  feature: { name: "Feature", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
  design: { name: "Design", className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200" },
  docs: { name: "Docs", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  urgente: { name: "Urgente", className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
} as const;

export type LabelId = keyof typeof LABELS;
export const LABEL_IDS = Object.keys(LABELS) as LabelId[];

export interface Card {
  id: string;
  title: string;
  description: string;
  labels: LabelId[];
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

// Normalizado: as colunas guardam só a ordem dos ids, e os cartões ficam num mapa por id.
export interface Board {
  version: 1;
  columns: Column[];
  cards: Record<string, Card>;
}

export type Action =
  | { type: "addCard"; columnId: string; title: string; id?: string; now?: string }
  | { type: "updateCard"; id: string; patch: Partial<Pick<Card, "title" | "description" | "labels">> }
  | { type: "deleteCard"; id: string }
  | { type: "moveCard"; id: string; toColumnId: string; toIndex: number }
  | { type: "addColumn"; title: string; id?: string }
  | { type: "renameColumn"; id: string; title: string }
  | { type: "deleteColumn"; id: string }
  | { type: "replace"; board: Board };

export function newId(): string {
  return crypto.randomUUID();
}

export function boardReducer(board: Board, action: Action): Board {
  switch (action.type) {
    case "addCard": {
      const title = action.title.trim();
      if (!title || !findColumn(board, action.columnId)) return board;
      const card: Card = {
        id: action.id ?? newId(),
        title,
        description: "",
        labels: [],
        createdAt: action.now ?? new Date().toISOString(),
      };
      return {
        ...board,
        cards: { ...board.cards, [card.id]: card },
        columns: board.columns.map((c) => (c.id === action.columnId ? { ...c, cardIds: [...c.cardIds, card.id] } : c)),
      };
    }

    case "updateCard": {
      const card = board.cards[action.id];
      if (!card) return board;
      const patch = { ...action.patch };
      if (patch.title !== undefined) {
        patch.title = patch.title.trim();
        if (!patch.title) delete patch.title;
      }
      return { ...board, cards: { ...board.cards, [card.id]: { ...card, ...patch } } };
    }

    case "deleteCard": {
      if (!board.cards[action.id]) return board;
      const cards = { ...board.cards };
      delete cards[action.id];
      return {
        ...board,
        cards,
        columns: board.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((id) => id !== action.id) })),
      };
    }

    case "moveCard": {
      const from = findColumnOfCard(board, action.id);
      const to = findColumn(board, action.toColumnId);
      if (!from || !to) return board;
      const fromIndex = from.cardIds.indexOf(action.id);
      if (from.id === to.id && fromIndex === action.toIndex) return board;

      const columns = board.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((id) => id !== action.id) }));
      const target = columns.find((c) => c.id === to.id)!;
      const index = Math.max(0, Math.min(action.toIndex, target.cardIds.length));
      target.cardIds.splice(index, 0, action.id);
      return { ...board, columns };
    }

    case "addColumn": {
      const title = action.title.trim();
      if (!title) return board;
      return { ...board, columns: [...board.columns, { id: action.id ?? newId(), title, cardIds: [] }] };
    }

    case "renameColumn": {
      const title = action.title.trim();
      if (!title) return board;
      return { ...board, columns: board.columns.map((c) => (c.id === action.id ? { ...c, title } : c)) };
    }

    case "deleteColumn": {
      const column = findColumn(board, action.id);
      if (!column) return board;
      const cards = { ...board.cards };
      for (const id of column.cardIds) delete cards[id];
      return { ...board, cards, columns: board.columns.filter((c) => c.id !== action.id) };
    }

    case "replace":
      return action.board;
  }
}

export function findColumn(board: Board, columnId: string): Column | undefined {
  return board.columns.find((c) => c.id === columnId);
}

export function findColumnOfCard(board: Board, cardId: string): Column | undefined {
  return board.columns.find((c) => c.cardIds.includes(cardId));
}

export interface Filter {
  query: string;
  label: LabelId | null;
}

export function isFilterActive(filter: Filter): boolean {
  return filter.query.trim() !== "" || filter.label !== null;
}

export function matchesFilter(card: Card, filter: Filter): boolean {
  const query = normalize(filter.query.trim());
  const matchesQuery = !query || normalize(`${card.title} ${card.description}`).includes(query);
  const matchesLabel = filter.label === null || card.labels.includes(filter.label);
  return matchesQuery && matchesLabel;
}

// Busca sem diferenciar maiúsculas nem acentos: "acao" encontra "Ação".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Valida um JSON importado. Retorna o quadro ou null se o formato for inválido. */
export function parseBoard(value: unknown): Board | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.columns) || !isRecord(value.cards)) return null;
  const cards: Record<string, Card> = {};
  for (const [id, raw] of Object.entries(value.cards)) {
    if (!isRecord(raw) || typeof raw.title !== "string" || raw.id !== id) return null;
    cards[id] = {
      id,
      title: raw.title,
      description: typeof raw.description === "string" ? raw.description : "",
      labels: Array.isArray(raw.labels) ? raw.labels.filter((l): l is LabelId => l in LABELS) : [],
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
    };
  }
  const seen = new Set<string>();
  const columns: Column[] = [];
  for (const raw of value.columns) {
    if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.title !== "string" || !Array.isArray(raw.cardIds)) {
      return null;
    }
    // Ignora ids que não existem ou que aparecem em mais de uma coluna.
    const cardIds = raw.cardIds.filter((id): id is string => typeof id === "string" && id in cards && !seen.has(id));
    cardIds.forEach((id) => seen.add(id));
    columns.push({ id: raw.id, title: raw.title, cardIds });
  }
  return { version: 1, columns, cards };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createSampleBoard(): Board {
  const now = new Date().toISOString();
  const card = (id: string, title: string, description: string, labels: LabelId[]): Card => ({
    id,
    title,
    description,
    labels,
    createdAt: now,
  });
  const cards = [
    card("c1", "Arraste este cartão para outra coluna", "Use o mouse, o toque ou o teclado (Tab, Espaço e setas).", [
      "docs",
    ]),
    card("c2", "Clique num cartão para editar", "Dá para mudar título, descrição e etiquetas.", ["feature"]),
    card("c3", "Filtre por texto ou etiqueta", "A busca ignora acentos e maiúsculas.", ["feature"]),
    card("c4", "Montar layout responsivo", "Colunas rolam na horizontal no celular.", ["design"]),
    card("c5", "Corrigir bug no modo escuro", "", ["bug", "urgente"]),
    card("c6", "Configurar CI com testes", "Vitest para unidades e Playwright de ponta a ponta.", ["docs"]),
  ];
  return {
    version: 1,
    cards: Object.fromEntries(cards.map((c) => [c.id, c])),
    columns: [
      { id: "todo", title: "A fazer", cardIds: ["c1", "c2", "c3"] },
      { id: "doing", title: "Fazendo", cardIds: ["c4", "c5"] },
      { id: "done", title: "Feito", cardIds: ["c6"] },
    ],
  };
}
