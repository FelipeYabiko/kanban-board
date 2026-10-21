"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { type Card, LABELS } from "@/lib/board";

interface CardItemProps {
  card: Card;
  columnId: string;
  disabled: boolean;
  onOpen: (id: string) => void;
}

export function CardItem({ card, columnId, disabled, onOpen }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", columnId },
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      // Enter abre o cartão; Espaço (tratado pelo dnd-kit) começa a arrastar.
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(card.id);
        else listeners?.onKeyDown?.(event);
      }}
      onClick={() => onOpen(card.id)}
      aria-roledescription="cartão arrastável"
      aria-label={card.title}
      data-testid="card"
      className={`cursor-grab touch-manipulation rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CardContent card={card} />
    </li>
  );
}

export function CardContent({ card }: { card: Card }) {
  return (
    <>
      {card.labels.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1" aria-label="Etiquetas">
          {card.labels.map((label) => (
            <li key={label} className={`rounded px-1.5 py-0.5 text-xs font-medium ${LABELS[label].className}`}>
              {LABELS[label].name}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm font-medium break-words">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs break-words text-slate-500 dark:text-slate-400">{card.description}</p>
      )}
    </>
  );
}
