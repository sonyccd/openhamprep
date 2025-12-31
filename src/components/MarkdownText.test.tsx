import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  describe('basic formatting', () => {
    it('renders plain text correctly', () => {
      const { getByText } = render(<MarkdownText text="Hello world" />);
      expect(getByText('Hello world')).toBeInTheDocument();
    });

    it('renders bold text correctly', () => {
      const { getByText } = render(<MarkdownText text="This is **bold** text" />);
      const boldElement = getByText('bold');
      expect(boldElement.tagName).toBe('STRONG');
    });

    it('renders italic text correctly', () => {
      const { getByText } = render(<MarkdownText text="This is *italic* text" />);
      const italicElement = getByText('italic');
      expect(italicElement.tagName).toBe('EM');
    });

    it('renders inline code correctly', () => {
      const { getByText } = render(<MarkdownText text="Use `const` keyword" />);
      const codeElement = getByText('const');
      expect(codeElement.tagName).toBe('CODE');
    });

    it('handles multiple formatting in one text', () => {
      const { getByText } = render(<MarkdownText text="**Bold** and *italic* and `code`" />);

      expect(getByText('Bold').tagName).toBe('STRONG');
      expect(getByText('italic').tagName).toBe('EM');
      expect(getByText('code').tagName).toBe('CODE');
    });

    it('handles line breaks', () => {
      const { container } = render(<MarkdownText text="Line 1\nLine 2" />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles empty text', () => {
      const { container } = render(<MarkdownText text="" />);
      expect(container.textContent).toBe('');
    });

    it('renders text without formatting unchanged', () => {
      const { getByText } = render(<MarkdownText text="Plain text without any markdown" />);
      expect(getByText('Plain text without any markdown')).toBeInTheDocument();
    });
  });

  describe('markdown links', () => {
    it('renders markdown links as clickable anchor tags', () => {
      render(<MarkdownText text="Check out [ARRL](https://arrl.org) for info" />);

      const link = screen.getByRole('link', { name: /ARRL/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://arrl.org');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders multiple markdown links', () => {
      render(<MarkdownText text="Visit [ARRL](https://arrl.org) and [FCC](https://fcc.gov)" />);

      const arrlLink = screen.getByRole('link', { name: /ARRL/i });
      const fccLink = screen.getByRole('link', { name: /FCC/i });

      expect(arrlLink).toHaveAttribute('href', 'https://arrl.org');
      expect(fccLink).toHaveAttribute('href', 'https://fcc.gov');
    });

    it('renders link text with spaces correctly', () => {
      render(<MarkdownText text="See [Ham Radio Resources](https://example.com)" />);

      const link = screen.getByRole('link', { name: /Ham Radio Resources/i });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('handles markdown link with complex URL', () => {
      render(<MarkdownText text="See [docs](https://example.com/path?query=value&foo=bar)" />);

      const link = screen.getByRole('link', { name: /docs/i });
      expect(link).toHaveAttribute('href', 'https://example.com/path?query=value&foo=bar');
    });

    it('ignores invalid/unsafe URLs in markdown links', () => {
      render(<MarkdownText text="Bad link [click](javascript:alert('xss'))" />);

      // Should not render as a link
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      // But should still show the text
      expect(screen.getByText('click')).toBeInTheDocument();
    });

    it('handles http links (not just https)', () => {
      render(<MarkdownText text="Old site: [example](http://example.com)" />);

      const link = screen.getByRole('link', { name: /example/i });
      expect(link).toHaveAttribute('href', 'http://example.com');
    });
  });

  describe('bare URLs', () => {
    it('auto-links bare https URLs', () => {
      render(<MarkdownText text="Visit https://arrl.org for more info" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://arrl.org');
      expect(link).toHaveTextContent('https://arrl.org');
    });

    it('auto-links bare http URLs', () => {
      render(<MarkdownText text="Old site at http://example.com here" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'http://example.com');
    });

    it('renders multiple bare URLs', () => {
      render(<MarkdownText text="Check https://first.com and https://second.com" />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', 'https://first.com');
      expect(links[1]).toHaveAttribute('href', 'https://second.com');
    });

    it('handles URLs with paths and query strings', () => {
      render(<MarkdownText text="See https://example.com/path/to/page?q=test" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com/path/to/page?q=test');
    });
  });

  describe('mixed content', () => {
    it('renders markdown links and bare URLs together', () => {
      render(<MarkdownText text="Visit [ARRL](https://arrl.org) or https://fcc.gov" />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);

      expect(links[0]).toHaveTextContent('ARRL');
      expect(links[0]).toHaveAttribute('href', 'https://arrl.org');

      expect(links[1]).toHaveTextContent('https://fcc.gov');
      expect(links[1]).toHaveAttribute('href', 'https://fcc.gov');
    });

    it('renders links with other formatting', () => {
      render(<MarkdownText text="**Bold** text with [link](https://example.com) and `code`" />);

      expect(screen.getByText('Bold').tagName).toBe('STRONG');
      expect(screen.getByRole('link', { name: /link/i })).toHaveAttribute('href', 'https://example.com');
      expect(screen.getByText('code').tagName).toBe('CODE');
    });

    it('handles links across multiple lines', () => {
      render(<MarkdownText text="Line 1 [link1](https://first.com)\nLine 2 https://second.com" />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('handles text starting with a link', () => {
      render(<MarkdownText text="[ARRL](https://arrl.org) is a great resource" />);

      const link = screen.getByRole('link', { name: /ARRL/i });
      expect(link).toHaveAttribute('href', 'https://arrl.org');
    });

    it('handles text ending with a link', () => {
      render(<MarkdownText text="Learn more at [ARRL](https://arrl.org)" />);

      const link = screen.getByRole('link', { name: /ARRL/i });
      expect(link).toHaveAttribute('href', 'https://arrl.org');
    });

    it('handles adjacent links', () => {
      render(<MarkdownText text="[link1](https://first.com)[link2](https://second.com)" />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('does not create links for text that looks like but is not a URL', () => {
      render(<MarkdownText text="Use http in your code" />);

      // "http" alone should not become a link
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('handles square brackets that are not links', () => {
      render(<MarkdownText text="Array [0] and [1] are valid" />);

      // Should not create links for bare brackets
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText(/Array/)).toBeInTheDocument();
    });
  });

  describe('math rendering', () => {
    it('renders inline math with $ delimiters', () => {
      const { container } = render(<MarkdownText text="The formula is $E = mc^2$ here" />);
      // KaTeX renders math into span elements with katex class
      const katexElement = container.querySelector('.katex');
      expect(katexElement).toBeInTheDocument();
    });

    it('renders block math with $$ delimiters', () => {
      const { container } = render(<MarkdownText text="The formula is:\n$$E = mc^2$$" />);
      // Block math also renders with katex class
      const katexElement = container.querySelector('.katex');
      expect(katexElement).toBeInTheDocument();
    });

    it('renders math with LaTeX commands', () => {
      const { container } = render(<MarkdownText text="Convert: $1.5 \\times 1000 = 1500$" />);
      const katexElement = container.querySelector('.katex');
      expect(katexElement).toBeInTheDocument();
    });
  });

  describe('real-world examples', () => {
    it('renders a typical explanation with links', () => {
      const text = `The correct answer is **20 meters**. According to the [ARRL Band Plan](https://arrl.org/band-plan), the 20-meter band extends from 14.000 to 14.350 MHz.`;

      render(<MarkdownText text={text} />);

      expect(screen.getByText('20 meters').tagName).toBe('STRONG');
      expect(screen.getByRole('link', { name: /ARRL Band Plan/i })).toHaveAttribute('href', 'https://arrl.org/band-plan');
    });

    it('handles YouTube links', () => {
      render(<MarkdownText text="Watch this [tutorial](https://youtube.com/watch?v=abc123)" />);

      const link = screen.getByRole('link', { name: /tutorial/i });
      expect(link).toHaveAttribute('href', 'https://youtube.com/watch?v=abc123');
    });
  });
});
