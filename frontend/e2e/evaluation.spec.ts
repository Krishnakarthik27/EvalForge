import { expect, test } from '@playwright/test';

const mockedEvaluation = {
  id: 'demo-1',
  prompt: 'Write a safe Python parser.',
  response_a: 'return int(value)',
  response_b: 'try: return int(value) except ValueError: return None',
  candidate_a: { average: 6.4, summary: 'A terse answer.', scores: {
    correctness: { score: 7, explanation: 'Relevant.' }, code_quality: { score: 6, explanation: 'Basic.' }, efficiency: { score: 7, explanation: 'Linear.' }, helpfulness: { score: 4, explanation: 'Terse.' }, safety: { score: 8, explanation: 'No unsafe actions.' }
  } },
  candidate_b: { average: 8.6, summary: 'A safer response.', scores: {
    correctness: { score: 9, explanation: 'Complete.' }, code_quality: { score: 9, explanation: 'Defensive.' }, efficiency: { score: 8, explanation: 'Simple.' }, helpfulness: { score: 9, explanation: 'Explained.' }, safety: { score: 8, explanation: 'Safe.' }
  } },
  winner: 'B',
  rationale: 'Response B handles invalid input and explains the trade-off.',
  confidence: 88,
  engine: 'local-rubric',
  created_at: '2025-01-01T00:00:00Z'
};

test('evaluates two responses and shows a winner', async ({ page }) => {
  await page.route('**/api/v1/evaluations', async (route) => {
    if (route.request().method() === 'POST') await route.fulfill({ json: mockedEvaluation });
    else await route.fulfill({ json: [] });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find the response you can trust.' })).toBeVisible();
  await page.getByRole('button', { name: 'Evaluate responses' }).click();
  await expect(page.getByTestId('comparison-result')).toBeVisible();
  await expect(page.getByText('Response B wins')).toBeVisible();
  await expect(page.getByLabel('Response B scorecard')).toContainText('8.6');
});
