import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Quadro Kanban com arrastar e soltar, etiquetas, filtros e tema escuro.",
};

// Roda antes da primeira pintura: aplica o tema salvo (ou o do sistema) sem "piscar" o tema claro.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
