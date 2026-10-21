// Estado do quadro fora do React, persistido no localStorage.
// Os componentes leem com useSyncExternalStore, que também resolve a renderização no servidor.

import { useSyncExternalStore } from "react";

import { type Action, type Board, boardReducer, createSampleBoard, parseBoard } from "./board";

export const STORAGE_KEY = "kanban-board:v1";

type Listener = () => void;

export function createBoardStore(storage: Storage | null) {
  let board: Board | null = null;
  const listeners = new Set<Listener>();

  function load(): Board {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      return (raw && parseBoard(JSON.parse(raw))) || createSampleBoard();
    } catch {
      return createSampleBoard();
    }
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function getSnapshot(): Board {
    board ??= load();
    return board;
  }

  return {
    getSnapshot,
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(action: Action) {
      const next = boardReducer(getSnapshot(), action);
      if (next === board) return;
      board = next;
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Sem espaço ou modo privado: o quadro continua funcionando, só não é salvo.
      }
      emit();
    },
    /** Recarrega quando outra aba altera o mesmo localStorage. */
    reloadFromStorage() {
      board = load();
      emit();
    },
  };
}

export type BoardStore = ReturnType<typeof createBoardStore>;

const browserStore = typeof window === "undefined" ? null : createBoardStore(window.localStorage);

if (browserStore) {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) browserStore.reloadFromStorage();
  });
}

const noop = () => () => {};

/**
 * Retorna o quadro e o dispatch. No servidor (e na hidratação) o quadro é `null`,
 * porque o localStorage só existe no navegador; a página mostra um esqueleto nesse momento.
 */
export function useBoard(): [Board | null, (action: Action) => void] {
  const board = useSyncExternalStore(
    browserStore?.subscribe ?? noop,
    () => browserStore?.getSnapshot() ?? null,
    () => null,
  );
  return [board, (action) => browserStore?.dispatch(action)];
}
