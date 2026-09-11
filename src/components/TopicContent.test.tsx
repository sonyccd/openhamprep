import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TopicContent } from './TopicContent';

describe('TopicContent', () => {
  describe('Headings', () => {
    it('should render h1 heading with correct ID', () => {
      render(<TopicContent content="# Hello World" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Hello World');
      expect(heading).toHaveAttribute('id', 'hello-world');
    });

    it('should render h2 heading with correct ID', () => {
      render(<TopicContent content="## Section Title" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Section Title');
      expect(heading).toHaveAttribute('id', 'section-title');
    });

    it('should render h3 heading with correct ID', () => {
      render(<TopicContent content="### Subsection" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Subsection');
      expect(heading).toHaveAttribute('id', 'subsection');
    });
  });

  describe('Text Formatting', () => {
    it('should render paragraphs', () => {
      render(<TopicContent content="This is a paragraph." />);
      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
    });

    it('should render bold text', () => {
      render(<TopicContent content="This is **bold** text." />);
      expect(screen.getByRole('strong')).toHaveTextContent('bold');
    });

    it('should render italic text', () => {
      render(<TopicContent content="This is *italic* text." />);
      expect(screen.getByRole('emphasis')).toHaveTextContent('italic');
    });

    it('should render inline code', () => {
      render(<TopicContent content="Use `console.log()` for debugging." />);
      expect(screen.getByRole('code')).toHaveTextContent('console.log()');
    });
  });

  describe('Lists', () => {
    it('should render unordered lists', () => {
      const content = `- Item 1
- Item 2
- Item 3`;
      render(<TopicContent content={content} />);
      expect(screen.getByRole('list').tagName).toBe('UL');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should render ordered lists', () => {
      const content = `1. First
2. Second
3. Third`;
      render(<TopicContent content={content} />);
      expect(screen.getByRole('list').tagName).toBe('OL');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should render links with target="_blank"', () => {
      render(<TopicContent content="Visit [Example](https://example.com)" />);
      const link = screen.getByRole('link', { name: 'Example' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Blockquotes', () => {
    it('should render blockquotes', () => {
      render(<TopicContent content="> This is a quote" />);
      expect(screen.getByRole('blockquote')).toHaveTextContent('This is a quote');
    });
  });

  describe('Code Blocks', () => {
    it('should render code blocks', () => {
      const content = `\`\`\`
const x = 1;
\`\`\``;
      render(<TopicContent content={content} />);
      expect(screen.getByRole('code')).toHaveTextContent('const x = 1;');
    });
  });

  describe('Images', () => {
    it('should render images with alt text', () => {
      render(<TopicContent content="![Alt text](https://example.com/image.jpg)" />);
      const img = screen.getByAltText('Alt text');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  describe('Horizontal Rules', () => {
    it('should render horizontal rules', () => {
      render(<TopicContent content="---" />);
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });

  describe('Tables (GFM)', () => {
    it('should render tables', () => {
      const tableMarkdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;

      render(<TopicContent content={tableMarkdown} />);
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Header 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should render mixed content correctly', () => {
      const content = `# Main Title

This is an introduction paragraph with **bold** and *italic* text.

## Features

- Feature one
- Feature two
- Feature three

### Code Example

\`\`\`
const example = true;
\`\`\`

> Important note here

Visit [our site](https://example.com) for more info.`;

      const { container } = render(<TopicContent content={content} />);

      expect(screen.getByRole('heading', { level: 1, name: 'Main Title' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Features' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Code Example' })).toBeInTheDocument();
      expect(screen.getByRole('strong')).toHaveTextContent('bold');
      expect(screen.getByRole('emphasis')).toHaveTextContent('italic');
      expect(screen.getByText('Feature one')).toBeInTheDocument();
      expect(container).toHaveTextContent('const example = true;');
      expect(screen.getByText('Important note here')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'our site' })).toBeInTheDocument();
    });
  });
});
