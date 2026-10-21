"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";

import type { Action, Card, Column } from "@/lib/board";

import { CardItem } from "./card-item";

interface ColumnViewProps {
  column: Column;
  cards: Card[];
  totalCards: number;
  dragDisabled: boolean;
  dispatch: (action: Action) => void;
  onOpenCard: (id: string) => void;
}

export function ColumnView({ column, cards, totalCards, dragDisabled, dispatch, onOpenCard }: ColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: "column", columnId: column.id },
  });
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function addCard() {
    if (draft.trim()) dispatch({ type: "addCard", columnId: column.id, title: draft });
    setDraft("");
  }

  function deleteColumn() {
    const message =
      totalCards > 0
        ? `Excluir a coluna "${column.title}" e seus ${totalCards} cartões?`
        : `Excluir a coluna "${column.title}"?`;
    if (confirm(message)) dispatch({ type: "deleteColumn", id: column.id });
  }

  return (
    <section
      aria-label={column.title}
      data-testid="column"
      className="flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-slate-200/70 dark:bg-slate-900"
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        {renaming ? (
          <input
            autoFocus
            defaultValue={column.title}
            aria-label="Nome da coluna"
            className="min-w-0 flex-1 rounded border border-blue-500 bg-white px-2 py-1 text-sm font-semibold dark:bg-slate-800"
            onBlur={(e) => {
              dispatch({ type: "renameColumn", id: column.id, title: e.target.value });
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <h2 className="min-w-0 flex-1 truncate">
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="max-w-full truncate text-sm font-semibold hover:underline"
              title="Renomear coluna"
            >
              {column.title}
            </button>
          </h2>
        )}
        <span className="rounded-full bg-slate-300 px-2 text-xs dark:bg-slate-700" aria-label={`${totalCards} cartões`}>
          {totalCards}
        </span>
        <button
          type="button"
          onClick={deleteColumn}
          className="rounded px-1 text-slate-500 hover:bg-slate-300 hover:text-red-600 dark:hover:bg-slate-700"
          aria-label={`Excluir coluna ${column.title}`}
        >
          ✕
        </button>
      </header>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={`flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2 transition-colors ${
            isOver ? "rounded-lg bg-blue-100/60 dark:bg-blue-950/40" : ""
          }`}
        >
          {cards.map((card) => (
            <CardItem key={card.id} card={card} columnId={column.id} disabled={dragDisabled} onOpen={onOpenCard} />
          ))}
        </ul>
      </SortableContext>

      <div className="px-3 pb-3">
        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addCard();
            }}
          >
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addCard();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Título do cartão"
              aria-label="Título do novo cartão"
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="mt-1 flex gap-2">
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-md px-3 py-1 text-sm hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-300 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            + Adicionar cartão
          </button>
        )}
      </div>
    </section>
  );
}
