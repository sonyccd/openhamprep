import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkPreview } from './LinkPreview';
import type { LinkData } from '@/hooks/useQuestions';

describe('LinkPreview', () => {
  const createLink = (overrides: Partial<LinkData> = {}): LinkData => ({
    url: 'https://example.com',
    title: 'Example Link',
    type: 'website',
    ...overrides,
  });

  describe('Link Types', () => {
    it('renders video type with correct icon and label', () => {
      const link = createLink({ type: 'video', title: 'Test Video' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('renders article type with correct icon and label', () => {
      const link = createLink({ type: 'article', title: 'Test Article' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('Article')).toBeInTheDocument();
    });

    it('renders website type with correct icon and label', () => {
      const link = createLink({ type: 'website', title: 'Test Website' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('Website')).toBeInTheDocument();
    });
  });

  describe('Type Colors', () => {
    it('applies destructive styling for video type', () => {
      const link = createLink({ type: 'video' });
      render(<LinkPreview link={link} />);

      const badge = screen.getByText('Video').closest('span');
      expect(badge).toHaveClass('text-destructive', 'bg-destructive/10');
    });

    it('applies info styling for article type', () => {
      const link = createLink({ type: 'article' });
      render(<LinkPreview link={link} />);

      const badge = screen.getByText('Article').closest('span');
      expect(badge).toHaveClass('text-info', 'bg-info/10');
    });

    it('applies muted styling for website type', () => {
      const link = createLink({ type: 'website' });
      render(<LinkPreview link={link} />);

      const badge = screen.getByText('Website').closest('span');
      expect(badge).toHaveClass('text-muted-foreground', 'bg-secondary');
    });
  });

  describe('Link Content', () => {
    it('displays link title', () => {
      const link = createLink({ title: 'My Awesome Article' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('My Awesome Article')).toBeInTheDocument();
    });

    it('displays URL when title is missing', () => {
      const link = createLink({ title: undefined, url: 'https://example.com/page' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('https://example.com/page')).toBeInTheDocument();
    });

    it('displays description when provided', () => {
      const link = createLink({ description: 'This is a great resource for learning.' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('This is a great resource for learning.')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const link = createLink({ description: undefined });
      render(<LinkPreview link={link} />);

      const descriptionParagraphs = document.querySelectorAll('p.text-sm.text-muted-foreground');
      expect(descriptionParagraphs.length).toBe(0);
    });

    it('displays site name when provided', () => {
      const link = createLink({ siteName: 'Example Site' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });

    it('does not render site name when not provided', () => {
      const link = createLink({ siteName: undefined });
      const { container } = render(<LinkPreview link={link} />);

      // Find spans with text-xs text-muted-foreground truncate class
      const siteNameSpans = container.querySelectorAll('span.text-xs.text-muted-foreground.truncate');
      expect(siteNameSpans.length).toBe(0);
    });
  });

  describe('Image Handling', () => {
    it('renders image when provided', () => {
      const link = createLink({ image: 'https://example.com/image.jpg', title: 'Test' });
      render(<LinkPreview link={link} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', 'Test');
    });

    it('does not render image container when image is not provided', () => {
      const link = createLink({ image: undefined });
      const { container } = render(<LinkPreview link={link} />);

      const img = container.querySelector('img');
      expect(img).not.toBeInTheDocument();
    });

    it('hides image on error', () => {
      const link = createLink({ image: 'https://example.com/broken.jpg' });
      render(<LinkPreview link={link} />);

      const img = screen.getByRole('img');
      fireEvent.error(img);

      expect(img).toHaveStyle({ display: 'none' });
    });
  });

  describe('Link Behavior', () => {
    it('renders as anchor element', () => {
      const link = createLink({ url: 'https://example.com' });
      render(<LinkPreview link={link} />);

      const anchor = screen.getByRole('link');
      expect(anchor).toBeInTheDocument();
    });

    it('has correct href', () => {
      const link = createLink({ url: 'https://example.com/resource' });
      render(<LinkPreview link={link} />);

      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/resource');
    });

    it('opens in new tab', () => {
      const link = createLink();
      render(<LinkPreview link={link} />);

      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    });

    it('has security attributes', () => {
      const link = createLink();
      render(<LinkPreview link={link} />);

      expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Styling', () => {
    it('has card-like styling', () => {
      const link = createLink();
      render(<LinkPreview link={link} />);

      const anchor = screen.getByRole('link');
      expect(anchor).toHaveClass('rounded-lg', 'border', 'border-border');
    });

    it('has hover effects', () => {
      const link = createLink();
      render(<LinkPreview link={link} />);

      const anchor = screen.getByRole('link');
      expect(anchor).toHaveClass('hover:bg-secondary/50', 'hover:border-primary/30');
    });

    it('has group class for nested hover effects', () => {
      const link = createLink();
      render(<LinkPreview link={link} />);

      const anchor = screen.getByRole('link');
      expect(anchor).toHaveClass('group');
    });
  });
});
