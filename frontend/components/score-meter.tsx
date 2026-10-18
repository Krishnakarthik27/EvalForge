import type { CriterionScore } from '@/lib/types';

const labels: Record<string, string> = {
  correctness: 'Correctness',
  code_quality: 'Code quality',
  efficiency: 'Efficiency',
  helpfulness: 'Helpfulness',
  safety: 'Safety'
};

export function criterionLabel(key: string) {
  return labels[key] ?? key;
}

export function ScoreMeter({ criterion, item }: { criterion: string; item: CriterionScore }) {
  const tone = item.score >= 8 ? 'bg-emerald-400' : item.score >= 6 ? 'bg-ember' : 'bg-rose-400';
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-3" data-testid={`score-${criterion}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-300">{criterionLabel(criterion)}</span>
        <span className="text-xs font-semibold tabular-nums text-white">{item.score}<span className="text-zinc-500">/10</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-label={`${criterionLabel(criterion)} score ${item.score} out of 10`}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${item.score * 10}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{item.explanation}</p>
    </div>
  );
}
