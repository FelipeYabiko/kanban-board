import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSampleBoard } from "./board";
import { createBoardStore, STORAGE_KEY } from "./store";

describe("createBoardStore", () => {
  beforeEach(() => localStorage.clear());

  it("começa com o quadro de exemplo quando não há nada salvo", () => {
    const store = createBoardStore(localStorage);
    expect(store.getSnapshot().columns.map((c) => c.title)).toEqual(["A fazer", "Fazendo", "Feito"]);
  });

  it("salva cada alteração e recarrega depois", () => {
    const store = createBoardStore(localStorage);
    store.dispatch({ type: "addCard", columnId: "todo", title: "Persistido", id: "p1" });

    const reloaded = createBoardStore(localStorage);
    expect(reloaded.getSnapshot().cards.p1?.title).toBe("Persistido");
  });

  it("avisa os inscritos só quando o estado muda", () => {
    const store = createBoardStore(localStorage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: "addCard", columnId: "todo", title: "" });
    expect(listener).not.toHaveBeenCalled();

    store.dispatch({ type: "addCard", columnId: "todo", title: "Novo" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignora dados corrompidos", () => {
    localStorage.setItem(STORAGE_KEY, "{não é json");
    expect(createBoardStore(localStorage).getSnapshot()).toEqual(
      expect.objectContaining({ columns: createSampleBoard().columns }),
    );
  });

  it("funciona sem storage disponível", () => {
    const store = createBoardStore(null);
    store.dispatch({ type: "deleteCard", id: "c1" });
    expect(store.getSnapshot().cards.c1).toBeUndefined();
  });
});
