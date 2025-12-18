import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

    it('should render expand button when figureUrl is provided', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );
      expect(screen.getByLabelText('Expand figure')).toBeInTheDocument();
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

    it('should open lightbox when clicking expand button', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const expandButton = screen.getByLabelText('Expand figure');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByTestId('lightbox')).toBeInTheDocument();
      });
    });

    it('should close lightbox when close button is clicked', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      // Open lightbox
      const expandButton = screen.getByLabelText('Expand figure');
      fireEvent.click(expandButton);

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

      const imageContainer = screen.getByRole('button', { name: /view figure/i });
      fireEvent.keyDown(imageContainer, { key: 'Enter' });

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

      const imageContainer = screen.getByRole('button', { name: /view figure/i });
      fireEvent.keyDown(imageContainer, { key: ' ' });

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

      // Loading spinner should be present (has animate-spin class)
      const spinner = document.querySelector('.animate-spin');
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
        const spinner = document.querySelector('.animate-spin');
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

    it('should have proper aria-label on expand button', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      expect(screen.getByLabelText('Expand figure')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const imageContainer = screen.getByRole('button', { name: /view figure/i });
      expect(imageContainer).toHaveAttribute('tabIndex', '0');
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

    it('should have max-height constraints for responsive design', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      // Check that the image has the responsive max-height classes
      expect(img.className).toContain('max-h-[200px]');
      expect(img.className).toContain('md:max-h-[300px]');
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
