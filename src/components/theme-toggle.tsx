"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
      aria-label="Alternar tema claro/escuro"
    >
      {/* Os dois ícones existem no HTML; o CSS mostra o certo, então não há divergência na hidratação. */}
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}
