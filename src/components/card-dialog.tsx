"use client";

import { useEffect, useRef, useState } from "react";

import { type Action, type Card, LABEL_IDS, LABELS, type LabelId } from "@/lib/board";

interface CardDialogProps {
  card: Card;
  dispatch: (action: Action) => void;
  onClose: () => void;
}

// <dialog> nativo: já cuida de foco preso, Esc para fechar e acessibilidade de modal.
export function CardDialog({ card, dispatch, onClose }: CardDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [labels, setLabels] = useState<LabelId[]>(card.labels);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function toggleLabel(label: LabelId) {
    setLabels((current) => (current.includes(label) ? current.filter((l) => l !== label) : [...current, label]));
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    dispatch({ type: "updateCard", id: card.id, patch: { title, description, labels } });
    ref.current?.close();
  }

  function remove() {
    if (!confirm(`Excluir o cartão "${card.title}"?`)) return;
    dispatch({ type: "deleteCard", id: card.id });
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="card-dialog-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl bg-white p-0 text-slate-900 shadow-xl dark:bg-slate-900 dark:text-slate-100"
    >
      <form onSubmit={save} className="flex flex-col gap-4 p-5">
        <h2 id="card-dialog-title" className="text-lg font-semibold">
          Editar cartão
        </h2>

        <label className="flex flex-col gap-1 text-sm">
          Título
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <fieldset className="text-sm">
          <legend className="mb-2">Etiquetas</legend>
          <div className="flex flex-wrap gap-2">
            {LABEL_IDS.map((label) => {
              const active = labels.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLabel(label)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-offset-2 transition dark:ring-offset-slate-900 ${
                    LABELS[label].className
                  } ${active ? "ring-2 ring-blue-500" : "opacity-60 hover:opacity-100"}`}
                >
                  {LABELS[label].name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={remove}
            className="mr-auto rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            Excluir
          </button>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Salvar
          </button>
        </div>
      </form>
    </dialog>
  );
}
