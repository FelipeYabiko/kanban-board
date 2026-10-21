"use client";

import { useRef, useState } from "react";

import {
  createSampleBoard,
  type Filter,
  isFilterActive,
  LABEL_IDS,
  LABELS,
  type LabelId,
  parseBoard,
} from "@/lib/board";
import { useBoard } from "@/lib/store";

import { BoardView } from "./board-view";
import { CardDialog } from "./card-dialog";
import { ThemeToggle } from "./theme-toggle";

const buttonClass =
  "rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800";

export function KanbanApp() {
  const [board, dispatch] = useBoard();
  const [filter, setFilter] = useState<Filter>({ query: "", label: null });
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function exportBoard() {
    if (!board) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "kanban.json" });
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBoard(file: File) {
    try {
      const imported = parseBoard(JSON.parse(await file.text()));
      if (!imported) throw new Error("formato inválido");
      dispatch({ type: "replace", board: imported });
    } catch {
      alert("Não foi possível importar: o arquivo não é um quadro válido.");
    }
  }

  const openCard = board && openCardId ? board.cards[openCardId] : undefined;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mr-auto text-lg font-bold">📋 Kanban</h1>

        <input
          type="search"
          value={filter.query}
          onChange={(e) => setFilter({ ...filter, query: e.target.value })}
          placeholder="Buscar cartões..."
          aria-label="Buscar cartões"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm sm:w-56 dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={filter.label ?? ""}
          onChange={(e) => setFilter({ ...filter, label: (e.target.value || null) as LabelId | null })}
          aria-label="Filtrar por etiqueta"
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Todas as etiquetas</option>
          {LABEL_IDS.map((label) => (
            <option key={label} value={label}>
              {LABELS[label].name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button type="button" onClick={exportBoard} className={buttonClass}>
            Exportar
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
            Importar
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importBoard(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() =>
              confirm("Restaurar o quadro de exemplo? Seus cartões serão apagados.") &&
              dispatch({ type: "replace", board: createSampleBoard() })
            }
            className={buttonClass}
          >
            Restaurar
          </button>
          <ThemeToggle />
        </div>
      </header>

      {isFilterActive(filter) && (
        <p
          role="status"
          className="bg-amber-50 px-6 py-1.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Filtro ativo: arrastar fica desativado até limpar a busca.
        </p>
      )}

      <main className="min-h-0 flex-1">
        {board ? (
          <BoardView board={board} filter={filter} dispatch={dispatch} onOpenCard={setOpenCardId} />
        ) : (
          <BoardSkeleton />
        )}
      </main>

      {openCard && (
        <CardDialog key={openCard.id} card={openCard} dispatch={dispatch} onClose={() => setOpenCardId(null)} />
      )}
    </div>
  );
}

// Mostrado no HTML do servidor e durante a hidratação, antes de ler o localStorage.
function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-4 sm:p-6" aria-busy="true" aria-label="Carregando quadro">
      {[3, 2, 1].map((count, i) => (
        <div key={i} className="w-72 shrink-0 animate-pulse rounded-xl bg-slate-200/70 p-3 dark:bg-slate-900">
          <div className="mb-3 h-4 w-24 rounded bg-slate-300 dark:bg-slate-700" />
          {Array.from({ length: count }, (_, j) => (
            <div key={j} className="mb-2 h-14 rounded-lg bg-white dark:bg-slate-800" />
          ))}
        </div>
      ))}
    </div>
  );
}
