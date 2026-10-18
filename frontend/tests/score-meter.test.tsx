import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreMeter, criterionLabel } from '@/components/score-meter';

describe('ScoreMeter', () => {
  it('renders a human readable criterion and numeric score', () => {
    render(<ScoreMeter criterion="code_quality" item={{ score: 8, explanation: 'Clear, maintainable implementation.' }} />);
    expect(screen.getByText('Code quality')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByLabelText('Code quality score 8 out of 10')).toBeInTheDocument();
  });

  it('formats known rubric labels', () => {
    expect(criterionLabel('code_quality')).toBe('Code quality');
  });
});
