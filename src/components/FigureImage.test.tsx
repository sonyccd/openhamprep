import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { FigureImage } from './FigureImage';

// Mock FigureLightbox
vi.mock('./FigureLightbox', () => ({
  FigureLightbox: ({ isOpen, onClose, figureUrl, questionId }: {
    isOpen: boolean;
    onClose: () => void;
    figureUrl: string;
    questionId: string;
  }) => isOpen ? (
    <div data-testid="lightbox">
      <img src={figureUrl} alt={`Figure for ${questionId}`} />
      <button onClick={onClose}>Close</button>
    </div>
  ) : null
}));

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

describe('FigureImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when figureUrl is null', () => {
      const { container } = render(
        <FigureImage
          figureUrl={null}
          questionId="T1A01"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when figureUrl is undefined', () => {
      const { container } = render(
        <FigureImage
          figureUrl={undefined}
          questionId="T1A01"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render figure image when figureUrl is provided', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/E9B05.png');
    });

    /**
     * The thumbnail is one control. The expand mark is decoration inside it,
     * not a second button: the old markup nested a <button> inside a
     * role="button" div, which is invalid and gave two tab stops for one action.
     */
    it('exposes the thumbnail as a single labelled control', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const control = screen.getByRole('button', { name: /view figure for question E9B05/i });
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(control.querySelector('button')).toBeNull();
      expect(screen.queryByLabelText('Expand figure')).not.toBeInTheDocument();
    });

    it('should not render for questions that mention "figure" in text but have no URL', () => {
      // The component should NOT try to detect figure references in question text
      // It only renders if figureUrl is explicitly provided
      const { container } = render(
        <FigureImage
          figureUrl={null}
          questionId="E9B05"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Lightbox Interaction', () => {
    it('should open lightbox when clicking on image container', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const imageContainer = screen.getByRole('button', { name: /view figure/i });
      fireEvent.click(imageContainer);

      await waitFor(() => {
        expect(screen.getByTestId('lightbox')).toBeInTheDocument();
      });
    });

    it('shows the expand mark on hover and focus of that control', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const control = screen.getByRole('button', { name: /view figure/i });
      const mark = control.querySelector('.FigureImage-expand');
      expect(mark).not.toBeNull();
      expect(mark).toHaveAttribute('aria-hidden', 'true');

      const cls = [...control.classList].find((c) => c.startsWith('css-'))!;
      const rules = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .map((rule) => rule.cssText.replace(/\s+/g, ' '))
        .filter((text) => text.includes(cls) && text.includes('FigureImage-expand'));
      expect(rules.join('\n')).toMatch(/:hover .*opacity: 1/);
      expect(rules.join('\n')).toMatch(/Mui-focusVisible .*opacity: 1/);
    });

    it('should close lightbox when close button is clicked', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      // Open lightbox
      fireEvent.click(screen.getByRole('button', { name: /view figure/i }));

      await waitFor(() => {
        expect(screen.getByTestId('lightbox')).toBeInTheDocument();
      });

      // Close lightbox
      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
      });
    });

    it('should open lightbox via keyboard Enter key', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      // A real <button> activates on keypress; fireEvent.keyDown alone does not
      // dispatch the click, so drive it the way a user would.
      const user = userEvent.setup();
      screen.getByRole('button', { name: /view figure/i }).focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('lightbox')).toBeInTheDocument();
      });
    });

    it('should open lightbox via keyboard Space key', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const user = userEvent.setup();
      screen.getByRole('button', { name: /view figure/i }).focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByTestId('lightbox')).toBeInTheDocument();
      });
    });
  });

  describe('Image Loading States', () => {
    it('should show loading spinner initially', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const spinner = screen.queryByTestId('figure-loading');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner after image loads', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      fireEvent.load(img);

      await waitFor(() => {
        const spinner = screen.queryByTestId('figure-loading');
        expect(spinner).not.toBeInTheDocument();
      });
    });

    it('should show error state on image load failure', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/invalid.png"
          questionId="E9B05"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText('Figure failed to load')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text on image', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toBeInTheDocument();
    });

    it('names the control after the question it shows', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      expect(
        screen.getByRole('button', { name: 'View figure for question E9B05 in full size' })
      ).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const control = screen.getByRole('button', { name: /view figure/i });
      // A real <button> is in the tab order without a tabindex of its own.
      expect(control.tagName).toBe('BUTTON');
      expect(control).not.toHaveAttribute('tabindex', '-1');
      control.focus();
      expect(control).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('should have lazy loading attribute on image', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Different Question IDs', () => {
    it('should work with Technician question IDs', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/T7D01.png"
          questionId="T7D01"
        />
      );
      expect(screen.getByAltText('Figure for question T7D01')).toBeInTheDocument();
    });

    it('should work with General question IDs', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/G7B03.png"
          questionId="G7B03"
        />
      );
      expect(screen.getByAltText('Figure for question G7B03')).toBeInTheDocument();
    });

    it('should work with Extra question IDs', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E4C05.png"
          questionId="E4C05"
        />
      );
      expect(screen.getByAltText('Figure for question E4C05')).toBeInTheDocument();
    });
  });
});
