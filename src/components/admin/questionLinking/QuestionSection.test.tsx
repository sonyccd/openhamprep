import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { muiWrapper } from '@/test/utils';
import { QuestionSection } from './QuestionSection';

describe('QuestionSection', () => {
  it('puts the count in the heading as phrasing content', () => {
    render(
      <QuestionSection title="Linked Questions" count={2} countVariant="filled">
        <li>a</li>
        <li>b</li>
      </QuestionSection>,
      { wrapper: muiWrapper }
    );

    const heading = screen.getByRole('heading', { name: /Linked Questions/ });
    expect(heading).toHaveTextContent(/Linked Questions\s*2/);
    expect(heading.querySelector('div')).toBeNull();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('shows the empty line instead of a list when there are no rows', () => {
    render(<QuestionSection title="Available Questions" count={0} countVariant="outlined" empty="Nothing here" />, {
      wrapper: muiWrapper,
    });

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
