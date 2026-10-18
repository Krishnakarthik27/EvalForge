export const CRITERIA = ['correctness', 'code_quality', 'efficiency', 'helpfulness', 'safety'] as const;

export type Criterion = (typeof CRITERIA)[number];
export type Winner = 'A' | 'B' | 'tie';

export type CriterionScore = { score: number; explanation: string };
export type CandidateResult = {
  scores: Record<Criterion, CriterionScore>;
  average: number;
  summary: string;
};

export type Evaluation = {
  id: string;
  prompt: string;
  response_a: string;
  response_b: string;
  candidate_a: CandidateResult;
  candidate_b: CandidateResult;
  winner: Winner;
  rationale: string;
  confidence: number;
  engine: string;
  created_at: string;
};

export type EvaluationHistoryItem = Pick<Evaluation, 'id' | 'prompt' | 'winner' | 'confidence' | 'engine' | 'created_at'> & {
  candidate_a_average: number;
  candidate_b_average: number;
};
