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
      const { container } = render(<TopicContent content="This is **bold** text." />);
      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong).toHaveTextContent('bold');
    });

    it('should render italic text', () => {
      const { container } = render(<TopicContent content="This is *italic* text." />);
      const em = container.querySelector('em');
      expect(em).toBeInTheDocument();
      expect(em).toHaveTextContent('italic');
    });

    it('should render inline code', () => {
      const { container } = render(<TopicContent content="Use `console.log()` for debugging." />);
      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code).toHaveTextContent('console.log()');
    });
  });

  describe('Lists', () => {
    it('should render unordered lists', () => {
      const content = `- Item 1
- Item 2
- Item 3`;
      const { container } = render(<TopicContent content={content} />);
      expect(container.querySelector('ul')).toBeInTheDocument();
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(3);
      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
      expect(container.textContent).toContain('Item 3');
    });

    it('should render ordered lists', () => {
      const content = `1. First
2. Second
3. Third`;
      const { container } = render(<TopicContent content={content} />);
      expect(container.querySelector('ol')).toBeInTheDocument();
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(3);
      expect(container.textContent).toContain('First');
      expect(container.textContent).toContain('Second');
      expect(container.textContent).toContain('Third');
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
      const blockquote = document.querySelector('blockquote');
      expect(blockquote).toBeInTheDocument();
      expect(blockquote).toHaveTextContent('This is a quote');
    });
  });

  describe('Code Blocks', () => {
    it('should render code blocks', () => {
      const content = `\`\`\`
const x = 1;
\`\`\``;
      const { container } = render(<TopicContent content={content} />);
      expect(container.querySelector('pre')).toBeInTheDocument();
      expect(container.textContent).toContain('const x = 1;');
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
      const { container } = render(<TopicContent content="---" />);
      expect(container.querySelector('hr')).toBeInTheDocument();
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
      expect(container.querySelector('strong')).toHaveTextContent('bold');
      expect(container.querySelector('em')).toHaveTextContent('italic');
      expect(screen.getByText('Feature one')).toBeInTheDocument();
      expect(container).toHaveTextContent('const example = true;');
      expect(screen.getByText('Important note here')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'our site' })).toBeInTheDocument();
    });
  });
});
