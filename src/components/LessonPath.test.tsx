import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonPath } from './LessonPath';
import { LessonTopic } from '@/types/lessons';

// Sample lesson topic data
const mockTopics: LessonTopic[] = [
  {
    id: 'lt-1',
    lesson_id: 'lesson-123',
    topic_id: 'topic-1',
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    topic: {
      id: 'topic-1',
      slug: 'intro-to-circuits',
      title: 'Introduction to Circuits',
      description: 'Learn the basics of electrical circuits',
      thumbnail_url: null,
      is_published: true,
      subelements: [
        { id: 'sub-1', subelement: 'T1A', topic_id: 'topic-1' },
      ],
    },
  },
  {
    id: 'lt-2',
    lesson_id: 'lesson-123',
    topic_id: 'topic-2',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    topic: {
      id: 'topic-2',
      slug: 'ohms-law',
      title: "Ohm's Law",
      description: 'Understanding voltage, current, and resistance',
      thumbnail_url: null,
      is_published: true,
      subelements: [
        { id: 'sub-2', subelement: 'T1B', topic_id: 'topic-2' },
      ],
    },
  },
  {
    id: 'lt-3',
    lesson_id: 'lesson-123',
    topic_id: 'topic-3',
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    topic: {
      id: 'topic-3',
      slug: 'power-calculations',
      title: 'Power Calculations',
      description: 'Calculate power in electrical circuits',
      thumbnail_url: null,
      is_published: true,
      subelements: [],
    },
  },
];

const mockTopicProgress = [
  { topic_id: 'topic-1', is_completed: true },
];

describe('LessonPath', () => {
  const mockOnTopicClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all topic titles', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      expect(screen.getByText('Introduction to Circuits')).toBeInTheDocument();
      expect(screen.getByText("Ohm's Law")).toBeInTheDocument();
      expect(screen.getByText('Power Calculations')).toBeInTheDocument();
    });

    it('should render topic descriptions', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      expect(screen.getByText('Learn the basics of electrical circuits')).toBeInTheDocument();
      expect(screen.getByText('Understanding voltage, current, and resistance')).toBeInTheDocument();
    });

    it('should render subelement badges', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
    });

    it('should show empty state when no topics', () => {
      render(
        <LessonPath
          topics={[]}
          topicProgress={[]}
          currentTopicIndex={0}
          onTopicClick={mockOnTopicClick}
        />
      );
      expect(screen.getByText('No topics have been added to this lesson yet.')).toBeInTheDocument();
    });
  });

  describe('Topic States', () => {
    it('should show checkmark for completed topics', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      // The Check icon should be present for completed topic
      expect(document.querySelector('.lucide-check')).toBeInTheDocument();
    });

    it('should show "Next" badge for current topic', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should show Zap icon for current topic', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      expect(document.querySelector('.lucide-zap')).toBeInTheDocument();
    });

    it('should show lock icon for locked topics', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      // Topic 3 (index 2) should be locked since current is 1 and it's not completed
      expect(document.querySelector('.lucide-lock')).toBeInTheDocument();
    });

    it('should show step number badge for completed topics', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      // Completed topic should have its step number as a small badge
      const stepBadge = screen.getByText('1');
      expect(stepBadge).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onTopicClick when clicking a completed topic', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      fireEvent.click(screen.getByText('Introduction to Circuits'));
      expect(mockOnTopicClick).toHaveBeenCalledWith('intro-to-circuits');
    });

    it('should call onTopicClick when clicking the current topic', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      fireEvent.click(screen.getByText("Ohm's Law"));
      expect(mockOnTopicClick).toHaveBeenCalledWith('ohms-law');
    });

    it('should not call onTopicClick when clicking a locked topic', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      fireEvent.click(screen.getByText('Power Calculations'));
      expect(mockOnTopicClick).not.toHaveBeenCalled();
    });

    it('should disable button for locked topics', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={mockTopicProgress}
          currentTopicIndex={1}
          onTopicClick={mockOnTopicClick}
        />
      );
      // Find the button containing the locked topic title
      const lockedButton = screen.getByText('Power Calculations').closest('button');
      expect(lockedButton).toBeDisabled();
    });
  });

  describe('Progress States', () => {
    it('should handle no progress (all topics accessible from start)', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={[]}
          currentTopicIndex={0}
          onTopicClick={mockOnTopicClick}
        />
      );
      // First topic should be current (not locked)
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should handle all topics completed', () => {
      const allCompleted = [
        { topic_id: 'topic-1', is_completed: true },
        { topic_id: 'topic-2', is_completed: true },
        { topic_id: 'topic-3', is_completed: true },
      ];
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={allCompleted}
          currentTopicIndex={3}
          onTopicClick={mockOnTopicClick}
        />
      );
      // All topics should have checkmarks
      const checkIcons = document.querySelectorAll('.lucide-check');
      expect(checkIcons.length).toBe(3);
    });

    it('should handle undefined topicProgress', () => {
      render(
        <LessonPath
          topics={mockTopics}
          topicProgress={undefined}
          currentTopicIndex={0}
          onTopicClick={mockOnTopicClick}
        />
      );
      // Should render without errors
      expect(screen.getByText('Introduction to Circuits')).toBeInTheDocument();
    });
  });

  describe('Subelement Badges', () => {
    it('should limit subelements to 4 and show overflow count', () => {
      const topicWithManySubelements: LessonTopic[] = [
        {
          id: 'lt-1',
          lesson_id: 'lesson-123',
          topic_id: 'topic-1',
          display_order: 0,
          created_at: '2024-01-01T00:00:00Z',
          topic: {
            id: 'topic-1',
            slug: 'test-topic',
            title: 'Test Topic',
            description: null,
            thumbnail_url: null,
            is_published: true,
            subelements: [
              { id: 'sub-1', subelement: 'T1A', topic_id: 'topic-1' },
              { id: 'sub-2', subelement: 'T1B', topic_id: 'topic-1' },
              { id: 'sub-3', subelement: 'T1C', topic_id: 'topic-1' },
              { id: 'sub-4', subelement: 'T1D', topic_id: 'topic-1' },
              { id: 'sub-5', subelement: 'T1E', topic_id: 'topic-1' },
              { id: 'sub-6', subelement: 'T1F', topic_id: 'topic-1' },
            ],
          },
        },
      ];

      render(
        <LessonPath
          topics={topicWithManySubelements}
          topicProgress={[]}
          currentTopicIndex={0}
          onTopicClick={mockOnTopicClick}
        />
      );

      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
      expect(screen.getByText('T1C')).toBeInTheDocument();
      expect(screen.getByText('T1D')).toBeInTheDocument();
      expect(screen.queryByText('T1E')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });
});
