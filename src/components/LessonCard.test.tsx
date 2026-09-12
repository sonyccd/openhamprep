import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonCard } from './LessonCard';
import { Lesson } from '@/types/lessons';
import { muiWrapper } from '@/test/utils';

// Sample lesson data
const mockLesson: Lesson = {
  id: 'lesson-123',
  slug: 'getting-started-with-ham-radio',
  title: 'Getting Started with Ham Radio',
  description: 'Learn the basics of amateur radio',
  thumbnail_url: null,
  display_order: 1,
  is_published: true,
  license_types: ['technician', 'general'],
  edit_history: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  topics: [],
};

const mockCompletion = {
  total: 5,
  completed: 2,
  percentage: 40,
};

describe('LessonCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render lesson title', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('Getting Started with Ham Radio')).toBeInTheDocument();
    });

    it('should render lesson description', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('Learn the basics of amateur radio')).toBeInTheDocument();
    });

    it('should not render description if not provided', () => {
      const lessonWithoutDescription = { ...mockLesson, description: null };
      render(<LessonCard lesson={lessonWithoutDescription} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByText('Learn the basics of amateur radio')).not.toBeInTheDocument();
    });

    it('should show placeholder when no thumbnail', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      // No thumbnail <img> is rendered; the placeholder stands in for it.
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should show thumbnail image when provided', () => {
      const lessonWithThumbnail = { ...mockLesson, thumbnail_url: 'https://example.com/thumb.jpg' };
      render(<LessonCard lesson={lessonWithThumbnail} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      const img = screen.getByAltText('Getting Started with Ham Radio');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });
  });

  describe('Completion State', () => {
    it('should not show completed badge when not fully completed', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });

    it('should show completed badge when 100% complete', () => {
      const fullCompletion = { total: 5, completed: 5, percentage: 100 };
      render(<LessonCard lesson={mockLesson} completion={fullCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should announce completion when complete', () => {
      const fullCompletion = { total: 5, completed: 5, percentage: 100 };
      render(<LessonCard lesson={mockLesson} completion={fullCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByLabelText(/\(completed\)$/)).toBeInTheDocument();
    });

    it('should not announce completion when incomplete', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByLabelText(/\(completed\)$/)).not.toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show topic count badge', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('2/5 topics')).toBeInTheDocument();
    });

    it('should show percentage complete', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('40% complete')).toBeInTheDocument();
    });

    it('should show 0% for no completion', () => {
      const noCompletion = { total: 5, completed: 0, percentage: 0 };
      render(<LessonCard lesson={mockLesson} completion={noCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('should show 100% for full completion', () => {
      const fullCompletion = { total: 5, completed: 5, percentage: 100 };
      render(<LessonCard lesson={mockLesson} completion={fullCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });
      fireEvent.click(screen.getByText('Getting Started with Ham Radio'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    // The card used to be a div with role="button", tabIndex={0} and its own
    // Enter/Space handler, and nothing tested that handler — the identical
    // pattern in HamRadioToolCard turned out never to fire (#272). It is a real
    // button now, so these assert the contract rather than the implementation.
    // CardActionArea renders a real <button>, whose content model allows only
    // phrasing content — a heading or a <p> in there is invalid HTML, and a
    // heading also confuses assistive tech that navigates by heading. Nothing
    // is lost by dropping them: ARIA gives button presentational children, so
    // they were never exposed as a heading inside the old role="button" div
    // either, and the name comes from the button's aria-label.
    it('puts no heading or paragraph inside the button', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });

      const button = screen.getByRole('button', { name: /Getting Started with Ham Radio/ });

      expect(within(button).queryByRole('heading')).not.toBeInTheDocument();
      expect(button.querySelector('p')).toBeNull();
    });

    it('is reachable by keyboard', async () => {
      const user = userEvent.setup();
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });

      await user.tab();

      expect(screen.getByRole('button', { name: /Getting Started with Ham Radio/ })).toHaveFocus();
    });

    it.each(['{Enter}', ' '])('activates on %s', async (key) => {
      const user = userEvent.setup();
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />, { wrapper: muiWrapper });

      await user.tab();
      await user.keyboard(key);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});
