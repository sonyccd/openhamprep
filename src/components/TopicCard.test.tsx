import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopicCard } from './TopicCard';
import { Topic } from '@/hooks/useTopics';

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
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
    });

    it('should render topic description', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      expect(screen.getByText('Introduction to amateur radio')).toBeInTheDocument();
    });

    it('should not render description if not provided', () => {
      const topicWithoutDescription = { ...mockTopic, description: null };
      render(<TopicCard topic={topicWithoutDescription} onClick={mockOnClick} />);
      expect(screen.queryByText('Introduction to amateur radio')).not.toBeInTheDocument();
    });

    it('should show placeholder when no thumbnail', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      // The BookOpen icon is rendered as placeholder
      expect(document.querySelector('.lucide-book-open')).toBeInTheDocument();
    });

    it('should show thumbnail image when provided', () => {
      const topicWithThumbnail = { ...mockTopic, thumbnail_url: 'https://example.com/thumb.jpg' };
      render(<TopicCard topic={topicWithThumbnail} onClick={mockOnClick} />);
      const img = screen.getByAltText('Amateur Radio Basics');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });
  });

  describe('Completion State', () => {
    it('should not show completed badge by default', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });

    it('should show completed badge when isCompleted is true', () => {
      render(<TopicCard topic={mockTopic} isCompleted={true} onClick={mockOnClick} />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should have success ring styling when completed', () => {
      const { container } = render(<TopicCard topic={mockTopic} isCompleted={true} onClick={mockOnClick} />);
      expect(container.querySelector('.ring-success\\/50')).toBeInTheDocument();
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
      render(<TopicCard topic={topicWithSubelements} onClick={mockOnClick} />);
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
      render(<TopicCard topic={topicWithManySubelements} onClick={mockOnClick} />);
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
      expect(screen.getByText('T1C')).toBeInTheDocument();
      expect(screen.queryByText('T1D')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show subelements section when empty', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
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
      render(<TopicCard topic={topicWithResources} onClick={mockOnClick} />);
      expect(screen.getByText('2 resources')).toBeInTheDocument();
    });

    it('should show singular "resource" for single resource', () => {
      const topicWithOneResource = {
        ...mockTopic,
        resources: [
          { id: 'r1', topic_id: 'topic-123', resource_type: 'video', title: 'Video 1', url: null, storage_path: null, description: null, display_order: 1, created_at: '' },
        ],
      };
      render(<TopicCard topic={topicWithOneResource} onClick={mockOnClick} />);
      expect(screen.getByText('1 resource')).toBeInTheDocument();
    });

    it('should not show resource count when no resources', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      expect(screen.queryByText(/resource/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      fireEvent.click(screen.getByText('Amateur Radio Basics'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class for clickability', () => {
      const { container } = render(<TopicCard topic={mockTopic} onClick={mockOnClick} />);
      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });
  });
});
