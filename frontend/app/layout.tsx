import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'EvalForge | AI response evaluation',
  description: 'A rigorous workspace for comparing AI responses.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
            <Link href="/" className="group flex items-center gap-3" aria-label="EvalForge home">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-forge text-lg font-black text-ink transition group-hover:rotate-6">E</span>
              <span className="font-semibold tracking-tight">EvalForge</span>
              <span className="hidden rounded-full border border-ember/30 bg-ember/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ember sm:block">Studio</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-zinc-400">
              <Link className="transition hover:text-white" href="/">Evaluate</Link>
              <Link className="transition hover:text-white" href="/history">History</Link>
              <a className="transition hover:text-white" href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API docs ↗</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
