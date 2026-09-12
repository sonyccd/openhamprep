import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HamRadioToolCard } from './HamRadioToolCard';
import { HamRadioTool } from '@/hooks/useHamRadioTools';
import { muiWrapper } from '@/test/utils';

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
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      expect(screen.getByText('WSJT-X')).toBeInTheDocument();
    });

    it('should render tool description', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      expect(screen.getByText(/Weak signal communication software/)).toBeInTheDocument();
    });

    it('should render category badge when category is present', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      expect(screen.getByText('Digital Modes')).toBeInTheDocument();
    });

    it('should not render category badge when category is null', () => {
      const toolWithoutCategory = { ...mockTool, category: null };
      render(<HamRadioToolCard tool={toolWithoutCategory} />, { wrapper: muiWrapper });
      expect(screen.queryByText('Digital Modes')).not.toBeInTheDocument();
    });

    it('should show thumbnail image when imageUrl is available', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      const img = screen.getByAltText('WSJT-X');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/tool-123.png');
    });

    it('should show placeholder icon when no image is available', () => {
      const toolWithoutImage = { ...mockTool, storage_path: null, image_url: null };
      render(<HamRadioToolCard tool={toolWithoutImage} />, { wrapper: muiWrapper });
      // No <img> is rendered; the placeholder takes its place.
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render external link indicator', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      // "opens in new tab" is the part of the indicator assistive tech gets.
      expect(screen.getByRole('link', { name: /opens in new tab/i })).toBeInTheDocument();
    });
  });

  describe('Link Behavior', () => {
    it('should have correct href attribute', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://wsjt.sourceforge.io/');
    });

    it('should open in new tab', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should have noopener noreferrer for security', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible aria-label', () => {
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'WSJT-X (opens in new tab)');
    });

  });

  describe('Keyboard Navigation', () => {
    // Replaces two tests that asserted window.open was called on Enter and on
    // Space. They only passed by dispatching keydown at
    // getByRole('link').firstElementChild — the Card div, which never receives
    // focus — and their own comments said as much ("See #272"). They were
    // asserting that a handler existed, not that anything worked.
    //
    // The handler is gone. This is a real anchor, so Enter activation is the
    // browser's job and needs no handler and no test. Space was never correct
    // on a link anyway: it scrolls the page.
    it('is reachable by keyboard', async () => {
      const user = userEvent.setup();
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });

      await user.tab();

      expect(screen.getByRole('link', { name: /WSJT-X/ })).toHaveFocus();
    });

    it('opens the tool without a click handler of its own', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<HamRadioToolCard tool={mockTool} />, { wrapper: muiWrapper });

      fireEvent.keyDown(screen.getByRole('link'), { key: 'Enter' });

      // Nothing scripted should fire: navigation comes from the href. A second
      // window.open on top of the browser's own activation would open the tool
      // twice, which is what moving the old handler onto the link would have done.
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
      render(<HamRadioToolCard tool={toolWithImageUrl} />, { wrapper: muiWrapper });
      const img = screen.getByAltText('WSJT-X');
      expect(img).toHaveAttribute('src', 'https://example.com/external-image.png');
    });

    it('should render a long title without crashing', () => {
      const toolWithLongTitle = {
        ...mockTool,
        title: 'This is a very long tool title that should be truncated with line-clamp-2',
      };
      render(<HamRadioToolCard tool={toolWithLongTitle} />, { wrapper: muiWrapper });
      expect(screen.getByText(/This is a very long tool title/)).toBeInTheDocument();
    });

    it('should render a long description without crashing', () => {
      const toolWithLongDescription = {
        ...mockTool,
        description: 'This is a very long description that should be truncated. It contains many words and should be limited to two lines for better UI consistency.',
      };
      render(<HamRadioToolCard tool={toolWithLongDescription} />, { wrapper: muiWrapper });
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });
  });
});
