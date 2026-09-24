import { describe, it, expect } from 'vitest';
import { render as rtlRender, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { LinkPreview } from './LinkPreview';
import type { LinkData } from '@/hooks/useQuestions';

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

describe('LinkPreview', () => {
  const createLink = (overrides: Partial<LinkData> = {}): LinkData => ({
    url: 'https://example.com',
    title: 'Example Link',
    type: 'website',
    ...overrides,
  });

  describe('Link Types', () => {
    /**
     * Each kind kept its own tinted chip; bgClass supplied it before. The
     * tint is a color-mix(), which happy-dom drops from the CSSOM and from
     * computed style, so the assertion reads the raw emotion style text.
     */
    it('tints the type chip per kind, and leaves website neutral', () => {
      const chipBackground = (type: string) => {
        cleanup();
        const { container } = render(
          <LinkPreview link={{ type, url: 'https://x.co', title: 'T' } as never} />
        );
        const chip = [...container.querySelectorAll('span')].find((el) => el.textContent && el.textContent.length < 20)!;
        const cls = [...chip.classList].find((c) => c.startsWith('css-'))!;
        const raw = [...document.querySelectorAll('style')].map((el) => el.textContent ?? '').join('');
        const block = raw.slice(raw.indexOf(cls));
        return (block.slice(0, block.indexOf('}')).match(/background-color:[^;]+/) ?? [''])[0];
      };

      expect(chipBackground('video')).toContain('--mui-palette-error-main');
      expect(chipBackground('article')).toContain('--mui-palette-info-main');
      expect(chipBackground('website')).toContain('--mui-palette-secondary-main');
    });


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
      const description = 'This is a great resource for learning.';
      render(<LinkPreview link={createLink({ description })} />);
      expect(screen.getByText(description)).toBeInTheDocument();

      cleanup();
      render(<LinkPreview link={createLink({ description: undefined })} />);
      expect(screen.queryByText(description)).not.toBeInTheDocument();
    });

    it('displays site name when provided', () => {
      const link = createLink({ siteName: 'Example Site' });
      render(<LinkPreview link={link} />);

      expect(screen.getByText('Example Site')).toBeInTheDocument();
    });

    it('does not render site name when not provided', () => {
      render(<LinkPreview link={createLink({ siteName: 'Example Site' })} />);
      expect(screen.getByText('Example Site')).toBeInTheDocument();

      cleanup();
      render(<LinkPreview link={createLink({ siteName: undefined })} />);
      expect(screen.queryByText('Example Site')).not.toBeInTheDocument();
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
      render(<LinkPreview link={link} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
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
});
