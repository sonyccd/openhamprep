import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionFiltersBar } from './QuestionFiltersBar';

describe('QuestionFiltersBar', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    showNegativeFeedbackOnly: false,
    onNegativeFeedbackChange: vi.fn(),
    filteredCount: 100,
  };

  it('renders search input', () => {
    render(<QuestionFiltersBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument();
  });

  it('displays search term in input', () => {
    render(<QuestionFiltersBar {...defaultProps} searchTerm="T1A" />);
    expect(screen.getByDisplayValue('T1A')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<QuestionFiltersBar {...defaultProps} onSearchChange={onSearchChange} />);

    const input = screen.getByPlaceholderText('Search questions...');
    await user.type(input, 'test');

    expect(onSearchChange).toHaveBeenCalled();
  });

  it('displays filtered count with correct pluralization for multiple questions', () => {
    render(<QuestionFiltersBar {...defaultProps} filteredCount={50} />);
    expect(screen.getByText('50 questions')).toBeInTheDocument();
  });

  it('displays filtered count with correct pluralization for single question', () => {
    render(<QuestionFiltersBar {...defaultProps} filteredCount={1} />);
    expect(screen.getByText('1 question')).toBeInTheDocument();
  });

  it('displays filtered count for zero questions', () => {
    render(<QuestionFiltersBar {...defaultProps} filteredCount={0} />);
    expect(screen.getByText('0 questions')).toBeInTheDocument();
  });

  it('renders negative feedback checkbox', () => {
    render(<QuestionFiltersBar {...defaultProps} />);
    expect(screen.getByLabelText(/negative feedback/i)).toBeInTheDocument();
  });

  it('checkbox reflects showNegativeFeedbackOnly state', () => {
    render(<QuestionFiltersBar {...defaultProps} showNegativeFeedbackOnly={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onNegativeFeedbackChange when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onNegativeFeedbackChange = vi.fn();
    render(
      <QuestionFiltersBar
        {...defaultProps}
        onNegativeFeedbackChange={onNegativeFeedbackChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onNegativeFeedbackChange).toHaveBeenCalledWith(true);
  });

  it('shows clear filter button when negative feedback filter is active', () => {
    render(<QuestionFiltersBar {...defaultProps} showNegativeFeedbackOnly={true} />);
    expect(screen.getByText('Clear filter')).toBeInTheDocument();
  });

  it('does not show clear filter button when negative feedback filter is inactive', () => {
    render(<QuestionFiltersBar {...defaultProps} showNegativeFeedbackOnly={false} />);
    expect(screen.queryByText('Clear filter')).not.toBeInTheDocument();
  });

  it('calls onNegativeFeedbackChange with false when clear filter is clicked', async () => {
    const user = userEvent.setup();
    const onNegativeFeedbackChange = vi.fn();
    render(
      <QuestionFiltersBar
        {...defaultProps}
        showNegativeFeedbackOnly={true}
        onNegativeFeedbackChange={onNegativeFeedbackChange}
      />
    );

    const clearButton = screen.getByText('Clear filter');
    await user.click(clearButton);

    expect(onNegativeFeedbackChange).toHaveBeenCalledWith(false);
  });
});
