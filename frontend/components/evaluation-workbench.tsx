'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { evaluate } from '@/lib/api';
import type { Evaluation } from '@/lib/types';
import { ComparisonPanel } from './comparison-panel';

const example = {
  prompt: 'Write a safe Python function that parses an integer and explain how it handles invalid input.',
  response_a: '```python\ndef parse_integer(value):\n    return int(value)\n```',
  response_b: '```python\ndef parse_integer(value: str) -> int | None:\n    try:\n        return int(value)\n    except (TypeError, ValueError):\n        return None\n```\n\nThis avoids an unhandled exception and returns `None` when the input is invalid.'
};

export function EvaluationWorkbench() {
  const [form, setForm] = useState(example);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      setResult(await evaluate(form));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Evaluation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="grid-lines min-h-[calc(100vh-4rem)] px-5 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <section className="mb-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.24em] text-ember">AI evaluation workspace</p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Find the response you can trust.</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">EvalForge puts two AI answers under the same disciplined rubric — so quality decisions stay visible, comparable, and reusable.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-panel/70 p-5 text-sm shadow-glow">
            <div className="mb-3 flex items-center justify-between"><span className="font-medium">Rubric</span><span className="text-xs text-zinc-500">1–10 per criterion</span></div>
            <div className="flex flex-wrap gap-2">{['Correctness', 'Code quality', 'Efficiency', 'Helpfulness', 'Safety'].map((item) => <span key={item} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300">{item}</span>)}</div>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-panel/85 p-4 shadow-glow sm:p-6">
          <label className="block text-sm font-medium text-zinc-200" htmlFor="prompt">Evaluation prompt</label>
          <textarea id="prompt" value={form.prompt} onChange={(event) => update('prompt', event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-ember/60 focus:ring-2 focus:ring-ember/10" />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {(['response_a', 'response_b'] as const).map((field, index) => (
              <div key={field}>
                <label className="block text-sm font-medium text-zinc-200" htmlFor={field}>Response {index === 0 ? 'A' : 'B'}</label>
                <textarea id={field} value={form[field]} onChange={(event) => update(field, event.target.value)} className="mt-2 min-h-64 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-ember/60 focus:ring-2 focus:ring-ember/10" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <p className="text-xs leading-relaxed text-zinc-500">Each evaluation is saved to your history. Add an API key on the server for model-powered judging.</p>
            <button type="submit" disabled={isSubmitting || !form.prompt.trim() || !form.response_a.trim() || !form.response_b.trim()} className="inline-flex items-center gap-2 rounded-xl bg-forge px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f37b4f] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Forging evaluation…' : 'Evaluate responses'} <span aria-hidden>→</span>
            </button>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        </form>

        {result ? <ComparisonPanel evaluation={result} /> : <section className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center"><p className="text-sm text-zinc-500">Run an evaluation to reveal the comparison scorecards.</p><Link href="/history" className="mt-3 inline-block text-sm font-medium text-ember hover:text-white">Browse saved evaluations →</Link></section>}
      </div>
    </main>
  );
}
