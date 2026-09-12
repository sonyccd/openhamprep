import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicCard } from './TopicCard';
import { Topic } from '@/hooks/useTopics';
import { muiWrapper } from '@/test/utils';

// Sample topic data
const mockTopic: Topic = {
  id: 'topic-123',
  slug: 'amateur-radio-basics',
  title: 'Amateur Radio Basics',
  description: 'Introduction to amateur radio',
  thumbnail_url: null,
  display_order: 1,
  is_published: true,
  license_types: ['technician', 'general'],
  content_path: 'articles/amateur-radio-basics.md',
  edit_history: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  subelements: [],
  resources: [],
};

describe('TopicCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render topic title', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
    });

    it('should render topic description', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('Introduction to amateur radio')).toBeInTheDocument();
    });

    it('should not render description if not provided', () => {
      const topicWithoutDescription = { ...mockTopic, description: null };
      render(<TopicCard topic={topicWithoutDescription} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByText('Introduction to amateur radio')).not.toBeInTheDocument();
    });

    it('should show placeholder when no thumbnail', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should show thumbnail image when provided', () => {
      const topicWithThumbnail = { ...mockTopic, thumbnail_url: 'https://example.com/thumb.jpg' };
      render(<TopicCard topic={topicWithThumbnail} onClick={mockOnClick} />, { wrapper: muiWrapper });
      const img = screen.getByAltText('Amateur Radio Basics');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });
  });

  describe('Completion State', () => {
    it('should not show completed badge by default', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });

    it('should show completed badge when isCompleted is true', () => {
      render(<TopicCard topic={mockTopic} isCompleted={true} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should announce completion when completed', () => {
      render(<TopicCard topic={mockTopic} isCompleted={true} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByLabelText(/\(completed\)$/)).toBeInTheDocument();
    });
  });

  describe('Subelements', () => {
    it('should show subelement badges when present', () => {
      const topicWithSubelements = {
        ...mockTopic,
        subelements: [
          { id: 'sub-1', subelement: 'T1A', topic_id: 'topic-123' },
          { id: 'sub-2', subelement: 'T1B', topic_id: 'topic-123' },
        ],
      };
      render(<TopicCard topic={topicWithSubelements} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
    });

    it('should limit displayed subelements to 3 and show overflow count', () => {
      const topicWithManySubelements = {
        ...mockTopic,
        subelements: [
          { id: 'sub-1', subelement: 'T1A', topic_id: 'topic-123' },
          { id: 'sub-2', subelement: 'T1B', topic_id: 'topic-123' },
          { id: 'sub-3', subelement: 'T1C', topic_id: 'topic-123' },
          { id: 'sub-4', subelement: 'T1D', topic_id: 'topic-123' },
          { id: 'sub-5', subelement: 'T1E', topic_id: 'topic-123' },
        ],
      };
      render(<TopicCard topic={topicWithManySubelements} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
      expect(screen.getByText('T1C')).toBeInTheDocument();
      expect(screen.queryByText('T1D')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show subelements section when empty', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByText('T1A')).not.toBeInTheDocument();
    });
  });

  describe('Resources', () => {
    it('should show resource count when resources exist', () => {
      const topicWithResources = {
        ...mockTopic,
        resources: [
          { id: 'r1', topic_id: 'topic-123', resource_type: 'video', title: 'Video 1', url: null, storage_path: null, description: null, display_order: 1, created_at: '' },
          { id: 'r2', topic_id: 'topic-123', resource_type: 'article', title: 'Article 1', url: null, storage_path: null, description: null, display_order: 2, created_at: '' },
        ],
      };
      render(<TopicCard topic={topicWithResources} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('2 resources')).toBeInTheDocument();
    });

    it('should show singular "resource" for single resource', () => {
      const topicWithOneResource = {
        ...mockTopic,
        resources: [
          { id: 'r1', topic_id: 'topic-123', resource_type: 'video', title: 'Video 1', url: null, storage_path: null, description: null, display_order: 1, created_at: '' },
        ],
      };
      render(<TopicCard topic={topicWithOneResource} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.getByText('1 resource')).toBeInTheDocument();
    });

    it('should not show resource count when no resources', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      expect(screen.queryByText(/resource/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });
      fireEvent.click(screen.getByText('Amateur Radio Basics'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    // Same reasoning as LessonCard: the old div-as-button carried an untested
    // Enter/Space handler, and the identical pattern in HamRadioToolCard never
    // fired (#272). CardActionArea is a real button, so this is native.
    it('is reachable by keyboard and activates on Enter', async () => {
      const user = userEvent.setup();
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />, { wrapper: muiWrapper });

      await user.tab();
      expect(screen.getByRole('button', { name: /Amateur Radio Basics/ })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});
