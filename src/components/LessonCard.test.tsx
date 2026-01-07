import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonCard } from './LessonCard';
import { Lesson } from '@/types/lessons';

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
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('Getting Started with Ham Radio')).toBeInTheDocument();
    });

    it('should render lesson description', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('Learn the basics of amateur radio')).toBeInTheDocument();
    });

    it('should not render description if not provided', () => {
      const lessonWithoutDescription = { ...mockLesson, description: null };
      render(<LessonCard lesson={lessonWithoutDescription} completion={mockCompletion} onClick={mockOnClick} />);
      expect(screen.queryByText('Learn the basics of amateur radio')).not.toBeInTheDocument();
    });

    it('should show placeholder when no thumbnail', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      // The Route icon is rendered as placeholder
      expect(document.querySelector('.lucide-route')).toBeInTheDocument();
    });

    it('should show thumbnail image when provided', () => {
      const lessonWithThumbnail = { ...mockLesson, thumbnail_url: 'https://example.com/thumb.jpg' };
      render(<LessonCard lesson={lessonWithThumbnail} completion={mockCompletion} onClick={mockOnClick} />);
      const img = screen.getByAltText('Getting Started with Ham Radio');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });
  });

  describe('Completion State', () => {
    it('should not show completed badge when not fully completed', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });

    it('should show completed badge when 100% complete', () => {
      const fullCompletion = { total: 5, completed: 5, percentage: 100 };
      render(<LessonCard lesson={mockLesson} completion={fullCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should have success ring styling when completed', () => {
      const fullCompletion = { total: 5, completed: 5, percentage: 100 };
      const { container } = render(<LessonCard lesson={mockLesson} completion={fullCompletion} onClick={mockOnClick} />);
      expect(container.querySelector('.ring-success\\/50')).toBeInTheDocument();
    });

    it('should not have success ring styling when not completed', () => {
      const { container } = render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(container.querySelector('.ring-success\\/50')).not.toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show topic count badge', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('2/5 topics')).toBeInTheDocument();
    });

    it('should show percentage complete', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('40% complete')).toBeInTheDocument();
    });

    it('should show 0% for no completion', () => {
      const noCompletion = { total: 5, completed: 0, percentage: 0 };
      render(<LessonCard lesson={mockLesson} completion={noCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('should show 100% for full completion', () => {
      const fullCompletion = { total: 5, completed: 5, percentage: 100 };
      render(<LessonCard lesson={mockLesson} completion={fullCompletion} onClick={mockOnClick} />);
      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      fireEvent.click(screen.getByText('Getting Started with Ham Radio'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class for clickability', () => {
      const { container } = render(<LessonCard lesson={mockLesson} completion={mockCompletion} onClick={mockOnClick} />);
      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });
  });
});
