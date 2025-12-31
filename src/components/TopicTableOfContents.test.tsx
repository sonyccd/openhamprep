import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopicTableOfContents } from './TopicTableOfContents';

describe('TopicTableOfContents', () => {
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when content is empty', () => {
      const { container } = render(
        <TopicTableOfContents content="" onItemClick={mockOnItemClick} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when content has no headings', () => {
      const { container } = render(
        <TopicTableOfContents content="Just some text without headings" onItemClick={mockOnItemClick} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render h1 headings', () => {
      render(
        <TopicTableOfContents
          content="# First Heading"
          onItemClick={mockOnItemClick}
        />
      );
      // Both desktop and mobile views render the same heading
      expect(screen.getAllByText('First Heading').length).toBeGreaterThanOrEqual(1);
    });

    it('should render h2 headings', () => {
      render(
        <TopicTableOfContents
          content="## Second Level Heading"
          onItemClick={mockOnItemClick}
        />
      );
      expect(screen.getAllByText('Second Level Heading').length).toBeGreaterThanOrEqual(1);
    });

    it('should render h3 headings', () => {
      render(
        <TopicTableOfContents
          content="### Third Level Heading"
          onItemClick={mockOnItemClick}
        />
      );
      expect(screen.getAllByText('Third Level Heading').length).toBeGreaterThanOrEqual(1);
    });

    it('should render multiple headings in order', () => {
      const content = `# Main Title
## Section 1
### Subsection 1.1
## Section 2`;

      render(
        <TopicTableOfContents content={content} onItemClick={mockOnItemClick} />
      );

      expect(screen.getAllByText('Main Title').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Section 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Subsection 1.1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Section 2').length).toBeGreaterThanOrEqual(1);
    });

    it('should show Contents header on desktop', () => {
      render(
        <TopicTableOfContents
          content="# Test Heading"
          onItemClick={mockOnItemClick}
        />
      );
      expect(screen.getByText('Contents')).toBeInTheDocument();
    });

    it('should show Table of Contents button on mobile view', () => {
      render(
        <TopicTableOfContents
          content="# Test Heading"
          onItemClick={mockOnItemClick}
        />
      );
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    });
  });

  describe('ID Generation', () => {
    it('should generate URL-friendly IDs from headings', () => {
      const content = "# Hello World";
      render(
        <TopicTableOfContents content={content} onItemClick={mockOnItemClick} />
      );

      // Click the first item (desktop view)
      const items = screen.getAllByText('Hello World');
      fireEvent.click(items[0]);
      expect(mockOnItemClick).toHaveBeenCalledWith('hello-world');
    });

    it('should handle special characters in headings', () => {
      const content = "# What's New? (2024)";
      render(
        <TopicTableOfContents content={content} onItemClick={mockOnItemClick} />
      );

      const items = screen.getAllByText("What's New? (2024)");
      fireEvent.click(items[0]);
      expect(mockOnItemClick).toHaveBeenCalledWith('whats-new-2024');
    });
  });

  describe('Active State', () => {
    it('should highlight active item', () => {
      const content = `# First
## Second`;

      const { container } = render(
        <TopicTableOfContents
          content={content}
          activeId="first"
          onItemClick={mockOnItemClick}
        />
      );

      // Check for the active styling class
      const activeItem = container.querySelector('.text-primary.bg-primary\\/10');
      expect(activeItem).toBeInTheDocument();
      expect(activeItem).toHaveTextContent('First');
    });
  });

  describe('Interactions', () => {
    it('should call onItemClick with correct ID when clicking heading', () => {
      render(
        <TopicTableOfContents
          content="# Test Heading"
          onItemClick={mockOnItemClick}
        />
      );

      const items = screen.getAllByText('Test Heading');
      fireEvent.click(items[0]);
      expect(mockOnItemClick).toHaveBeenCalledWith('test-heading');
    });

    it('should call onItemClick for each heading independently', () => {
      const content = `# First
## Second`;

      render(
        <TopicTableOfContents content={content} onItemClick={mockOnItemClick} />
      );

      const firstItems = screen.getAllByText('First');
      fireEvent.click(firstItems[0]);
      expect(mockOnItemClick).toHaveBeenCalledWith('first');

      const secondItems = screen.getAllByText('Second');
      fireEvent.click(secondItems[0]);
      expect(mockOnItemClick).toHaveBeenCalledWith('second');
    });
  });

  describe('Heading Levels', () => {
    it('should not parse h4 or deeper headings', () => {
      const content = `# H1
## H2
### H3
#### H4
##### H5`;

      render(
        <TopicTableOfContents content={content} onItemClick={mockOnItemClick} />
      );

      expect(screen.getAllByText('H1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('H2').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('H3').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('H4')).not.toBeInTheDocument();
      expect(screen.queryByText('H5')).not.toBeInTheDocument();
    });
  });
});
