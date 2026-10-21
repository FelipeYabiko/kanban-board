import { describe, expect, it } from "vitest";

import { type Board, boardReducer, createSampleBoard, matchesFilter, parseBoard } from "./board";

function board(): Board {
  return createSampleBoard();
}

describe("boardReducer", () => {
  it("adiciona cartão no fim da coluna e ignora título vazio", () => {
    const b = boardReducer(board(), { type: "addCard", columnId: "done", title: "  Novo  ", id: "n1" });
    expect(b.columns[2]!.cardIds).toEqual(["c6", "n1"]);
    expect(b.cards.n1!.title).toBe("Novo");

    const same = board();
    expect(boardReducer(same, { type: "addCard", columnId: "done", title: "   " })).toBe(same);
  });

  it("não altera o estado original (imutabilidade)", () => {
    const original = board();
    const before = JSON.stringify(original);
    boardReducer(original, { type: "moveCard", id: "c1", toColumnId: "done", toIndex: 0 });
    boardReducer(original, { type: "deleteCard", id: "c2" });
    expect(JSON.stringify(original)).toBe(before);
  });

  it("move cartão entre colunas na posição pedida", () => {
    const b = boardReducer(board(), { type: "moveCard", id: "c1", toColumnId: "doing", toIndex: 1 });
    expect(b.columns[0]!.cardIds).toEqual(["c2", "c3"]);
    expect(b.columns[1]!.cardIds).toEqual(["c4", "c1", "c5"]);
  });

  it("reordena dentro da mesma coluna", () => {
    const b = boardReducer(board(), { type: "moveCard", id: "c1", toColumnId: "todo", toIndex: 2 });
    expect(b.columns[0]!.cardIds).toEqual(["c2", "c3", "c1"]);
  });

  it("limita o índice ao tamanho da coluna", () => {
    const b = boardReducer(board(), { type: "moveCard", id: "c1", toColumnId: "done", toIndex: 99 });
    expect(b.columns[2]!.cardIds).toEqual(["c6", "c1"]);
  });

  it("edita cartão mantendo o título se vier vazio", () => {
    const b = boardReducer(board(), {
      type: "updateCard",
      id: "c5",
      patch: { title: " ", description: "corrigido", labels: ["bug"] },
    });
    expect(b.cards.c5).toMatchObject({
      title: "Corrigir bug no modo escuro",
      description: "corrigido",
      labels: ["bug"],
    });
  });

  it("exclui cartão e o remove da coluna", () => {
    const b = boardReducer(board(), { type: "deleteCard", id: "c4" });
    expect(b.cards.c4).toBeUndefined();
    expect(b.columns[1]!.cardIds).toEqual(["c5"]);
  });

  it("cria, renomeia e exclui coluna junto com os cartões", () => {
    let b = boardReducer(board(), { type: "addColumn", title: "Revisão", id: "review" });
    b = boardReducer(b, { type: "renameColumn", id: "review", title: "Em revisão" });
    expect(b.columns.at(-1)).toEqual({ id: "review", title: "Em revisão", cardIds: [] });

    b = boardReducer(b, { type: "deleteColumn", id: "todo" });
    expect(b.columns.map((c) => c.id)).toEqual(["doing", "done", "review"]);
    expect(Object.keys(b.cards)).not.toContain("c1");
  });
});

describe("matchesFilter", () => {
  const card = board().cards.c5!;

  it("busca sem diferenciar acentos e maiúsculas", () => {
    expect(matchesFilter(card, { query: "ESCURO", label: null })).toBe(true);
    expect(matchesFilter({ ...card, title: "Ação" }, { query: "acao", label: null })).toBe(true);
    expect(matchesFilter(card, { query: "inexistente", label: null })).toBe(false);
  });

  it("filtra por etiqueta", () => {
    expect(matchesFilter(card, { query: "", label: "urgente" })).toBe(true);
    expect(matchesFilter(card, { query: "", label: "docs" })).toBe(false);
  });
});

describe("parseBoard", () => {
  it("aceita um quadro exportado", () => {
    const original = board();
    expect(parseBoard(JSON.parse(JSON.stringify(original)))).toEqual(original);
  });

  it("recusa formatos inválidos", () => {
    expect(parseBoard(null)).toBeNull();
    expect(parseBoard({ version: 2, columns: [], cards: {} })).toBeNull();
    expect(parseBoard({ version: 1, columns: [{ id: "a" }], cards: {} })).toBeNull();
  });

  it("descarta referências quebradas, duplicadas e etiquetas desconhecidas", () => {
    const parsed = parseBoard({
      version: 1,
      cards: { x: { id: "x", title: "X", labels: ["bug", "hackeado"] } },
      columns: [
        { id: "a", title: "A", cardIds: ["x", "fantasma"] },
        { id: "b", title: "B", cardIds: ["x"] },
      ],
    });
    expect(parsed?.columns.map((c) => c.cardIds)).toEqual([["x"], []]);
    expect(parsed?.cards.x!.labels).toEqual(["bug"]);
  });
});
