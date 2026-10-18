import { CRITERIA, type CandidateResult, type Evaluation } from '@/lib/types';
import { ScoreMeter } from './score-meter';

function CandidateCard({ label, candidate, isWinner }: { label: 'A' | 'B'; candidate: CandidateResult; isWinner: boolean }) {
  return (
    <section className={`rounded-2xl border p-5 ${isWinner ? 'border-ember/50 bg-ember/[.07] shadow-glow' : 'border-white/10 bg-panel/80'}`} aria-label={`Response ${label} scorecard`}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-500">Response {label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{candidate.average.toFixed(1)}<span className="text-base text-zinc-500"> / 10</span></div>
        </div>
        {isWinner && <span className="rounded-full border border-ember/40 bg-ember/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ember">Leading</span>}
      </div>
      <div className="grid gap-2">
        {CRITERIA.map((criterion) => <ScoreMeter key={criterion} criterion={criterion} item={candidate.scores[criterion]} />)}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{candidate.summary}</p>
    </section>
  );
}

export function ComparisonPanel({ evaluation }: { evaluation: Evaluation }) {
  const winnerText = evaluation.winner === 'tie' ? 'It’s a tie' : `Response ${evaluation.winner} wins`;
  return (
    <section className="mt-8" aria-live="polite" data-testid="comparison-result">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-ember">Evaluation complete</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Evidence, not vibes.</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">{evaluation.engine} · {evaluation.confidence}% confidence</span>
      </div>
      <div className="mb-4 rounded-2xl border border-ember/30 bg-gradient-to-r from-forge/15 to-ember/10 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ember text-lg text-ink">✦</span>
          <div>
            <h3 className="font-semibold">{winnerText}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-300">{evaluation.rationale}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CandidateCard label="A" candidate={evaluation.candidate_a} isWinner={evaluation.winner === 'A'} />
        <CandidateCard label="B" candidate={evaluation.candidate_b} isWinner={evaluation.winner === 'B'} />
      </div>
    </section>
  );
}
