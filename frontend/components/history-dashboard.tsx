'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchHistory } from '@/lib/api';
import type { EvaluationHistoryItem } from '@/lib/types';

function winnerLabel(winner: EvaluationHistoryItem['winner']) {
  return winner === 'tie' ? 'Tie' : `Response ${winner}`;
}

export function HistoryDashboard() {
  const [items, setItems] = useState<EvaluationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory().then(setItems).catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load history.')).finally(() => setLoading(false));
  }, []);

  const aWins = items.filter((item) => item.winner === 'A').length;
  const bWins = items.filter((item) => item.winner === 'B').length;
  const ties = items.filter((item) => item.winner === 'tie').length;

  return (
    <main className="grid-lines min-h-[calc(100vh-4rem)] px-5 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-ember">Evaluation ledger</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-semibold tracking-[-.04em]">History that holds up.</h1><p className="mt-2 text-zinc-400">Every decision, score, and judge recorded in one place.</p></div><Link href="/" className="rounded-xl bg-forge px-4 py-2.5 text-sm font-semibold hover:bg-[#f37b4f]">New evaluation →</Link></div>
        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          {[['Total', items.length], ['A wins', aWins], ['B wins', bWins], ['Ties', ties]].map(([label, value]) => <div className="rounded-2xl border border-white/10 bg-panel/80 p-4" key={String(label)}><div className="text-xs uppercase tracking-widest text-zinc-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>)}
        </section>
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-panel/85">
          <div className="border-b border-white/10 px-5 py-4 text-sm font-medium">Recent evaluations</div>
          {loading ? <p className="p-8 text-sm text-zinc-500">Loading evaluation history…</p> : error ? <p role="alert" className="m-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p> : items.length === 0 ? <div className="p-10 text-center"><p className="text-zinc-400">No evaluations yet.</p><Link href="/" className="mt-2 inline-block text-sm text-ember">Forge your first comparison →</Link></div> : <div className="divide-y divide-white/8">{items.map((item) => <article key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="line-clamp-1 font-medium text-zinc-200">{item.prompt}</p><p className="mt-1 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()} · {item.engine}</p></div><div className="flex gap-3 text-sm"><span className="text-zinc-500">A <b className="text-zinc-200">{item.candidate_a_average.toFixed(1)}</b></span><span className="text-zinc-500">B <b className="text-zinc-200">{item.candidate_b_average.toFixed(1)}</b></span></div><span className="justify-self-start rounded-full border border-ember/30 bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember md:justify-self-end">{winnerLabel(item.winner)} · {item.confidence}%</span></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
