"use client";

import {
  type Announcements,
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRef, useState } from "react";

import { type Action, type Board, type Filter, findColumnOfCard, isFilterActive, matchesFilter } from "@/lib/board";

import { CardContent } from "./card-item";
import { ColumnView } from "./column-view";

interface BoardViewProps {
  board: Board;
  filter: Filter;
  dispatch: (action: Action) => void;
  onOpenCard: (id: string) => void;
}

type DragData = { type: "card" | "column"; columnId: string };

export function BoardView({ board, filter, dispatch, onOpenCard }: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Guarda o quadro do início do arraste para desfazer tudo se o usuário apertar Esc.
  const snapshot = useRef<Board | null>(null);
  const lastDragEnd = useRef(0);

  const sensors = useSensors(
    // 5px de tolerância: um clique simples abre o cartão em vez de começar a arrastar.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const filtering = isFilterActive(filter);
  const columnTitle = (cardId: string) => findColumnOfCard(board, cardId)?.title ?? "";
  const cardTitle = (cardId: string | number) => board.cards[String(cardId)]?.title ?? "cartão";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Cartão "${cardTitle(active.id)}" selecionado. Use as setas para mover.`,
    onDragOver: ({ active }) => `"${cardTitle(active.id)}" está na coluna ${columnTitle(String(active.id))}.`,
    onDragEnd: ({ active }) => `"${cardTitle(active.id)}" solto na coluna ${columnTitle(String(active.id))}.`,
    onDragCancel: ({ active }) => `Movimento de "${cardTitle(active.id)}" cancelado.`,
  };

  function targetOf(event: DragOverEvent | DragEndEvent) {
    const over = event.over;
    if (!over) return null;
    const data = over.data.current as DragData | undefined;
    if (!data) return null;
    const column = board.columns.find((c) => c.id === data.columnId);
    if (!column) return null;
    // Sobre uma coluna vazia (ou o fim dela): vai para o final. Sobre um cartão: assume o lugar dele.
    const index = data.type === "column" ? column.cardIds.length : column.cardIds.indexOf(String(over.id));
    return { column, index };
  }

  function handleDragStart({ active }: DragStartEvent) {
    snapshot.current = board;
    setActiveId(String(active.id));
  }

  // Entre colunas, o cartão muda de lugar enquanto ainda está sendo arrastado, para a coluna abrir espaço.
  function handleDragOver(event: DragOverEvent) {
    const id = String(event.active.id);
    const from = findColumnOfCard(board, id);
    const target = targetOf(event);
    if (!from || !target || from.id === target.column.id) return;
    dispatch({ type: "moveCard", id, toColumnId: target.column.id, toIndex: target.index });
  }

  // Dentro da mesma coluna, só reordena ao soltar.
  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const target = targetOf(event);
    if (target && target.index >= 0) {
      dispatch({ type: "moveCard", id, toColumnId: target.column.id, toIndex: target.index });
    }
    finishDrag();
  }

  function handleDragCancel() {
    if (snapshot.current) dispatch({ type: "replace", board: snapshot.current });
    finishDrag();
  }

  function finishDrag() {
    snapshot.current = null;
    lastDragEnd.current = Date.now();
    setActiveId(null);
  }

  function openCard(id: string) {
    // O navegador dispara um clique ao soltar o mouse; isso não deve abrir o cartão.
    if (Date.now() - lastDragEnd.current > 200) onOpenCard(id);
  }

  const activeCard = activeId ? board.cards[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Para mover um cartão, aperte Espaço, use as setas e aperte Espaço de novo para soltar. Esc cancela. Enter abre o cartão.",
        },
      }}
    >
      <div className="flex h-full items-start gap-4 overflow-x-auto p-4 sm:p-6">
        {board.columns.map((column) => {
          const cards = column.cardIds.map((id) => board.cards[id]!).filter(Boolean);
          return (
            <ColumnView
              key={column.id}
              column={column}
              cards={filtering ? cards.filter((c) => matchesFilter(c, filter)) : cards}
              totalCards={cards.length}
              dragDisabled={filtering}
              dispatch={dispatch}
              onOpenCard={openCard}
            />
          );
        })}
        <AddColumn onAdd={(title) => dispatch({ type: "addColumn", title })} />
      </div>
      <DragOverlay>
        {activeCard && (
          // A rotação fica no filho: o dnd-kit mede a caixa do elemento externo para achar o destino,
          // e uma caixa girada "vaza" para os lados e confunde a navegação pelo teclado.
          <div className="cursor-grabbing">
            <div className="rotate-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <CardContent card={activeCard} />
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function AddColumn({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="w-72 shrink-0"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(title);
        setTitle("");
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="+ Nova coluna"
        aria-label="Nome da nova coluna"
        className="w-full rounded-xl border border-dashed border-slate-400 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-500 focus:border-solid focus:border-blue-500 focus:outline-none dark:border-slate-600"
      />
    </form>
  );
}
