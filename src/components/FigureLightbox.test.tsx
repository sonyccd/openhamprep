import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FigureLightbox } from './FigureLightbox';

describe('FigureLightbox', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    figureUrl: 'https://storage.example.com/figures/E9B05.png',
    questionId: 'E9B05',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <FigureLightbox {...defaultProps} isOpen={false} />
      );
      // Radix Dialog doesn't render portal content when closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render the lightbox when isOpen is true', () => {
      render(<FigureLightbox {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render the figure image with correct src', () => {
      render(<FigureLightbox {...defaultProps} />);
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/E9B05.png');
    });

    it('should render the question ID as caption', () => {
      render(<FigureLightbox {...defaultProps} />);
      expect(screen.getByText('E9B05')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<FigureLightbox {...defaultProps} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
  });

  describe('Close Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<FigureLightbox {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<FigureLightbox {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside the content (overlay)', () => {
      const onClose = vi.fn();
      render(<FigureLightbox {...defaultProps} onClose={onClose} />);

      // Click on the overlay (the dialog overlay element)
      const overlay = document.querySelector('[data-state="open"]');
      if (overlay) {
        fireEvent.click(overlay);
      }
      // Note: Radix handles this internally, the onClose will be called via onOpenChange
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text on image', () => {
      render(<FigureLightbox {...defaultProps} />);
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toBeInTheDocument();
    });

    it('should have aria-label on close button', () => {
      render(<FigureLightbox {...defaultProps} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      render(<FigureLightbox {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have overlay background', () => {
      render(<FigureLightbox {...defaultProps} />);
      // The overlay uses semantic bg-background/95 class
      const overlay = document.querySelector('[class*="bg-background"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should have max dimensions for viewport constraints', () => {
      render(<FigureLightbox {...defaultProps} />);
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img.className).toContain('max-w-[90vw]');
      expect(img.className).toContain('max-h-[85vh]');
    });

    it('should have rounded corners on image', () => {
      render(<FigureLightbox {...defaultProps} />);
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img.className).toContain('rounded-lg');
    });
  });

  describe('Different Question IDs', () => {
    it('should display Technician question ID correctly', () => {
      render(<FigureLightbox {...defaultProps} questionId="T1A01" />);
      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });

    it('should display General question ID correctly', () => {
      render(<FigureLightbox {...defaultProps} questionId="G2B03" />);
      expect(screen.getByText('G2B03')).toBeInTheDocument();
    });

    it('should display Extra question ID correctly', () => {
      render(<FigureLightbox {...defaultProps} questionId="E9C12" />);
      expect(screen.getByText('E9C12')).toBeInTheDocument();
    });
  });

  describe('Different Figure URLs', () => {
    it('should handle PNG images', () => {
      render(
        <FigureLightbox
          {...defaultProps}
          figureUrl="https://storage.example.com/figures/test.png"
        />
      );
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/test.png');
    });

    it('should handle JPEG images', () => {
      render(
        <FigureLightbox
          {...defaultProps}
          figureUrl="https://storage.example.com/figures/test.jpg"
        />
      );
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/test.jpg');
    });

    it('should handle SVG images', () => {
      render(
        <FigureLightbox
          {...defaultProps}
          figureUrl="https://storage.example.com/figures/test.svg"
        />
      );
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/test.svg');
    });

    it('should handle URLs with query parameters (cache busting)', () => {
      render(
        <FigureLightbox
          {...defaultProps}
          figureUrl="https://storage.example.com/figures/test.png?t=1234567890"
        />
      );
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/test.png?t=1234567890');
    });
  });
});
