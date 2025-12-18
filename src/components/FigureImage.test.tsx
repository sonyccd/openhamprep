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
    it('should render nothing when no figureUrl and no figure reference in question', () => {
      const { container } = render(
        <FigureImage
          figureUrl={null}
          questionId="T1A01"
          questionText="What is the minimum age required to obtain an amateur radio license?"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when figureUrl is undefined and no figure reference', () => {
      const { container } = render(
        <FigureImage
          figureUrl={undefined}
          questionId="T1A01"
          questionText="What frequency band is available for Technician licensees?"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render placeholder when question references a figure but no URL provided', () => {
      render(
        <FigureImage
          figureUrl={null}
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );
      expect(screen.getByText('Figure not available')).toBeInTheDocument();
    });

    it('should render figure image when figureUrl is provided', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );
      const img = screen.getByAltText('Figure for question E9B05');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/E9B05.png');
    });

    it('should render expand button', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );
      expect(screen.getByLabelText('Expand figure')).toBeInTheDocument();
    });
  });

  describe('Figure Reference Detection', () => {
    it('should detect "Figure E9-2" pattern', () => {
      render(
        <FigureImage
          figureUrl={null}
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );
      expect(screen.getByText('Figure not available')).toBeInTheDocument();
    });

    it('should detect "Figure T1" pattern', () => {
      render(
        <FigureImage
          figureUrl={null}
          questionId="T1A01"
          questionText="Refer to Figure T1 for the schematic diagram."
        />
      );
      expect(screen.getByText('Figure not available')).toBeInTheDocument();
    });

    it('should detect "Figure 1" pattern (numeric only)', () => {
      render(
        <FigureImage
          figureUrl={null}
          questionId="G1A01"
          questionText="See Figure 1 for details."
        />
      );
      expect(screen.getByText('Figure not available')).toBeInTheDocument();
    });

    it('should detect case-insensitive "FIGURE" pattern', () => {
      render(
        <FigureImage
          figureUrl={null}
          questionId="G1A01"
          questionText="What is shown in FIGURE G2-1?"
        />
      );
      expect(screen.getByText('Figure not available')).toBeInTheDocument();
    });

    it('should detect "figure" lowercase pattern', () => {
      render(
        <FigureImage
          figureUrl={null}
          questionId="G1A01"
          questionText="The circuit in figure 5 shows..."
        />
      );
      expect(screen.getByText('Figure not available')).toBeInTheDocument();
    });

    it('should not show placeholder for non-figure text', () => {
      const { container } = render(
        <FigureImage
          figureUrl={null}
          questionId="T1A01"
          questionText="What is the proper way to configure your radio?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      fireEvent.load(img);

      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      });
    });

    it('should show placeholder on image error when figure is referenced', async () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/invalid.png"
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText('Figure not available')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text on image', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );

      expect(screen.getByLabelText('Expand figure')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <FigureImage
          figureUrl="https://storage.example.com/figures/E9B05.png"
          questionId="E9B05"
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
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
          questionText="What type of antenna pattern is shown in Figure E9-2?"
        />
      );

      const img = screen.getByAltText('Figure for question E9B05');
      // Check that the image has the responsive max-height classes
      expect(img.className).toContain('max-h-[200px]');
      expect(img.className).toContain('md:max-h-[300px]');
    });
  });
});
