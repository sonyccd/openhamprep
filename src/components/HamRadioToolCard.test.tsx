import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HamRadioToolCard } from './HamRadioToolCard';
import { HamRadioTool } from '@/hooks/useHamRadioTools';

// Mock getToolImageUrl
vi.mock('@/hooks/useHamRadioTools', async () => {
  const actual = await vi.importActual('@/hooks/useHamRadioTools');
  return {
    ...actual,
    getToolImageUrl: vi.fn((tool: HamRadioTool) => {
      if (tool.storage_path) return `https://storage.example.com/${tool.storage_path}`;
      return tool.image_url;
    }),
  };
});

// Sample tool data
const mockTool: HamRadioTool = {
  id: 'tool-123',
  title: 'WSJT-X',
  description: 'Weak signal communication software supporting FT8, FT4, JT65, and other digital modes.',
  url: 'https://wsjt.sourceforge.io/',
  image_url: null,
  storage_path: 'tool-123.png',
  is_published: true,
  display_order: 1,
  category: {
    id: 'cat-1',
    name: 'Digital Modes',
    slug: 'digital-modes',
    description: 'Software for FT8, JS8Call, RTTY',
    display_order: 1,
    icon_name: 'Radio',
  },
  edit_history: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('HamRadioToolCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render tool title', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      expect(screen.getByText('WSJT-X')).toBeInTheDocument();
    });

    it('should render tool description', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      expect(screen.getByText(/Weak signal communication software/)).toBeInTheDocument();
    });

    it('should render category badge when category is present', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      expect(screen.getByText('Digital Modes')).toBeInTheDocument();
    });

    it('should not render category badge when category is null', () => {
      const toolWithoutCategory = { ...mockTool, category: null };
      render(<HamRadioToolCard tool={toolWithoutCategory} />);
      expect(screen.queryByText('Digital Modes')).not.toBeInTheDocument();
    });

    it('should show thumbnail image when imageUrl is available', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      const img = screen.getByAltText('WSJT-X');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/tool-123.png');
    });

    it('should show placeholder icon when no image is available', () => {
      const toolWithoutImage = { ...mockTool, storage_path: null, image_url: null };
      render(<HamRadioToolCard tool={toolWithoutImage} />);
      // Wrench icon should be rendered as placeholder
      expect(document.querySelector('.lucide-wrench')).toBeInTheDocument();
    });

    it('should render external link indicator', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      // ExternalLink icon should be present
      expect(document.querySelector('.lucide-external-link')).toBeInTheDocument();
    });
  });

  describe('Link Behavior', () => {
    it('should have correct href attribute', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://wsjt.sourceforge.io/');
    });

    it('should open in new tab', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should have noopener noreferrer for security', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible aria-label', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'WSJT-X (opens in new tab)');
    });

    it('should have focus-visible ring styles', () => {
      render(<HamRadioToolCard tool={mockTool} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring-2');
    });

    it('should have cursor-pointer class for clickability indication', () => {
      const { container } = render(<HamRadioToolCard tool={mockTool} />);
      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open link on Enter keypress', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<HamRadioToolCard tool={mockTool} />);

      const card = document.querySelector('[class*="cursor-pointer"]');
      fireEvent.keyDown(card!, { key: 'Enter' });

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://wsjt.sourceforge.io/',
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('should open link on Space keypress', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<HamRadioToolCard tool={mockTool} />);

      const card = document.querySelector('[class*="cursor-pointer"]');
      fireEvent.keyDown(card!, { key: ' ' });

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://wsjt.sourceforge.io/',
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('should not open link on other keypresses', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<HamRadioToolCard tool={mockTool} />);

      const card = document.querySelector('[class*="cursor-pointer"]');
      fireEvent.keyDown(card!, { key: 'Tab' });

      expect(windowOpenSpy).not.toHaveBeenCalled();

      windowOpenSpy.mockRestore();
    });
  });

  describe('Different Tool Configurations', () => {
    it('should handle tool with image_url instead of storage_path', () => {
      const toolWithImageUrl = {
        ...mockTool,
        storage_path: null,
        image_url: 'https://example.com/external-image.png',
      };
      render(<HamRadioToolCard tool={toolWithImageUrl} />);
      const img = screen.getByAltText('WSJT-X');
      expect(img).toHaveAttribute('src', 'https://example.com/external-image.png');
    });

    it('should handle tool with long title (line-clamp)', () => {
      const toolWithLongTitle = {
        ...mockTool,
        title: 'This is a very long tool title that should be truncated with line-clamp-2',
      };
      render(<HamRadioToolCard tool={toolWithLongTitle} />);
      const title = screen.getByText(/This is a very long tool title/);
      expect(title).toHaveClass('line-clamp-2');
    });

    it('should handle tool with long description (line-clamp)', () => {
      const toolWithLongDescription = {
        ...mockTool,
        description: 'This is a very long description that should be truncated. It contains many words and should be limited to two lines for better UI consistency.',
      };
      render(<HamRadioToolCard tool={toolWithLongDescription} />);
      const description = screen.getByText(/This is a very long description/);
      expect(description).toHaveClass('line-clamp-2');
    });
  });
});
