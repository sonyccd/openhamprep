import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionReviewTable } from './QuestionReviewTable';
import type { Question } from './types';

const makeQuestion = (overrides?: Partial<Question>): Question => ({
  id: 'uuid-1',
  display_name: 'T1A01',
  question: 'What is amateur radio?',
  options: ['A radio hobby', 'Commercial radio', 'TV broadcasting', 'Satellite radio'],
  correct_answer: 0,
  explanation: 'Amateur radio is a hobby and a service.',
  links: [],
  edit_history: [],
  figure_url: null,
  forum_url: null,
  discourse_sync_status: null,
  discourse_sync_at: null,
  discourse_sync_error: null,
  linked_topic_ids: [],
  arrl_chapter_id: null,
  arrl_page_reference: null,
  ...overrides,
});

describe('QuestionReviewTable', () => {
  it('renders column headers', () => {
    render(<QuestionReviewTable questions={[]} onEdit={vi.fn()} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('Answer')).toBeInTheDocument();
    expect(screen.getByText('Explanation')).toBeInTheDocument();
  });

  it('renders a row for each question', () => {
    const questions = [
      makeQuestion({ id: 'uuid-1', display_name: 'T1A01' }),
      makeQuestion({ id: 'uuid-2', display_name: 'T1A02' }),
    ];
    render(<QuestionReviewTable questions={questions} onEdit={vi.fn()} />);
    expect(screen.getByText('T1A01')).toBeInTheDocument();
    expect(screen.getByText('T1A02')).toBeInTheDocument();
  });

  it('shows question text', () => {
    render(<QuestionReviewTable questions={[makeQuestion()]} onEdit={vi.fn()} />);
    expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
  });

  it('shows correct answer text for answer index 0 (A)', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ correct_answer: 0 })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('A radio hobby')).toBeInTheDocument();
    expect(screen.getByText('A.')).toBeInTheDocument();
  });

  it('shows correct answer text for answer index 1 (B)', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ correct_answer: 1 })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('Commercial radio')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
  });

  it('shows correct answer text for answer index 2 (C)', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ correct_answer: 2 })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('TV broadcasting')).toBeInTheDocument();
    expect(screen.getByText('C.')).toBeInTheDocument();
  });

  it('shows correct answer text for answer index 3 (D)', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ correct_answer: 3 })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('Satellite radio')).toBeInTheDocument();
    expect(screen.getByText('D.')).toBeInTheDocument();
  });

  it('shows explanation text', () => {
    render(<QuestionReviewTable questions={[makeQuestion()]} onEdit={vi.fn()} />);
    expect(screen.getByText('Amateur radio is a hobby and a service.')).toBeInTheDocument();
  });

  it('shows em dash when explanation is null', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ explanation: null })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows em dash when explanation is empty string', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ explanation: '' })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onEdit with the correct question when pencil is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const question = makeQuestion();
    render(<QuestionReviewTable questions={[question]} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Edit T1A01' }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(question);
  });

  it('calls onEdit with the correct question when multiple rows exist', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const q1 = makeQuestion({ id: 'uuid-1', display_name: 'T1A01' });
    const q2 = makeQuestion({ id: 'uuid-2', display_name: 'T1A02', question: 'Second question?' });
    render(<QuestionReviewTable questions={[q1, q2]} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Edit T1A02' }));

    expect(onEdit).toHaveBeenCalledWith(q2);
  });

  it('renders an edit button for each row', () => {
    const questions = [
      makeQuestion({ id: 'uuid-1', display_name: 'T1A01' }),
      makeQuestion({ id: 'uuid-2', display_name: 'T1A02' }),
      makeQuestion({ id: 'uuid-3', display_name: 'T1A03' }),
    ];
    render(<QuestionReviewTable questions={questions} onEdit={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('shows fallback for out-of-bounds correct_answer', () => {
    render(
      <QuestionReviewTable
        questions={[makeQuestion({ correct_answer: 9 as any })]}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('?.')).toBeInTheDocument();
    expect(screen.getByText('(missing)')).toBeInTheDocument();
  });

  it('applies highlight class to the matching row', () => {
    const questions = [
      makeQuestion({ id: 'uuid-1', display_name: 'T1A01' }),
      makeQuestion({ id: 'uuid-2', display_name: 'T1A02' }),
    ];
    const { container } = render(
      <QuestionReviewTable
        questions={questions}
        onEdit={vi.fn()}
        highlightQuestionId="T1A01"
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].className).toContain('bg-amber-500/10');
    expect(rows[1].className).not.toContain('bg-amber-500/10');
  });

  it('applies no highlight when highlightQuestionId is not set', () => {
    const { container } = render(
      <QuestionReviewTable questions={[makeQuestion()]} onEdit={vi.fn()} />
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].className).not.toContain('bg-amber-500/10');
  });
});
