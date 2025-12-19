import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FigureUpload } from './FigureUpload';

// Mock Supabase client
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('FigureUpload', () => {
  const defaultProps = {
    questionId: 'E9B05',
    currentFigureUrl: null,
    onUpload: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/question-figures/E9B05.png' },
    });
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload button when no figure exists', () => {
      render(<FigureUpload {...defaultProps} />);
      expect(screen.getByText('Upload Figure')).toBeInTheDocument();
    });

    it('should render replace button when figure exists', () => {
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/figures/E9B05.png"
        />
      );
      expect(screen.getByText('Replace Figure')).toBeInTheDocument();
    });

    it('should render current figure preview when URL exists', () => {
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/figures/E9B05.png"
        />
      );
      const img = screen.getByAltText('Figure for E9B05');
      expect(img).toHaveAttribute('src', 'https://storage.example.com/figures/E9B05.png');
    });

    it('should render delete button when figure exists', () => {
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/figures/E9B05.png"
        />
      );
      // Delete button is inside the component
      const deleteButton = document.querySelector('[class*="text-destructive"]');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should render file size info text', () => {
      render(<FigureUpload {...defaultProps} />);
      expect(screen.getByText(/Max size: 2 MB/)).toBeInTheDocument();
    });

    it('should render supported formats text', () => {
      render(<FigureUpload {...defaultProps} />);
      expect(screen.getByText(/PNG, JPEG, GIF, WebP, SVG/)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept image files', () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml');
    });

    it('should trigger file input when upload button is clicked', () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(screen.getByText('Upload Figure'));
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('should reject files larger than 2MB', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Create a file larger than 2MB
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('File too large. Maximum size is 2 MB.');
      });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should reject non-image file types', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      Object.defineProperty(fileInput, 'files', {
        value: [textFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid file type. Please upload PNG, JPEG, GIF, WebP, or SVG.');
      });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should accept PNG files', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [pngFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should accept JPEG files', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [jpegFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should accept GIF files', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const gifFile = new File(['test'], 'test.gif', { type: 'image/gif' });

      Object.defineProperty(fileInput, 'files', {
        value: [gifFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should accept WebP files', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

      Object.defineProperty(fileInput, 'files', {
        value: [webpFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should accept SVG files', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });

      Object.defineProperty(fileInput, 'files', {
        value: [svgFile],
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });
  });

  describe('Upload Process', () => {
    it('should show loading state during upload', async () => {
      // Make upload take time with controllable promise
      let resolveUpload: (value: { error: null }) => void;
      mockUpload.mockImplementation(() => new Promise(resolve => {
        resolveUpload = resolve;
      }));

      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [pngFile] });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });

      // Resolve the mock to allow cleanup to complete properly
      resolveUpload!({ error: null });

      // Wait for the upload to complete
      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should call onUpload with URL on successful upload', async () => {
      const onUpload = vi.fn();
      render(<FigureUpload {...defaultProps} onUpload={onUpload} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [pngFile] });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalled();
        // URL should contain cache-busting parameter
        expect(onUpload.mock.calls[0][0]).toContain('https://storage.example.com/question-figures/E9B05.png');
      });
    });

    it('should show success toast on successful upload', async () => {
      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [pngFile] });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Figure uploaded successfully');
      });
    });

    it('should show error toast on upload failure', async () => {
      mockUpload.mockResolvedValue({ error: { message: 'Upload failed' } });

      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [pngFile] });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to upload figure'));
      });
    });

    it('should use question ID as filename', async () => {
      render(<FigureUpload {...defaultProps} questionId="T1A01" />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'original-name.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [pngFile] });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          'T1A01.png',
          expect.any(File),
          expect.any(Object)
        );
      });
    });
  });

  describe('Delete Process', () => {
    it('should show confirmation dialog when delete is clicked', async () => {
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/figures/E9B05.png"
        />
      );

      // Find and click the delete button
      const deleteButton = document.querySelector('[class*="text-destructive"]') as HTMLElement;
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Remove Figure')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to remove this figure/)).toBeInTheDocument();
      });
    });

    it('should call onRemove on successful delete', async () => {
      const onRemove = vi.fn();
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/question-figures/E9B05.png"
          onRemove={onRemove}
        />
      );

      // Click delete button
      const deleteButton = document.querySelector('[class*="text-destructive"]') as HTMLElement;
      fireEvent.click(deleteButton);

      // Wait for dialog and click confirm
      await waitFor(() => {
        expect(screen.getByText('Remove Figure')).toBeInTheDocument();
      });

      // Click the confirm button in dialog
      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalled();
      });
    });

    it('should show success toast on successful delete', async () => {
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/question-figures/E9B05.png"
        />
      );

      const deleteButton = document.querySelector('[class*="text-destructive"]') as HTMLElement;
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Remove Figure')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Figure removed successfully');
      });
    });

    it('should not delete when cancel is clicked', async () => {
      const onRemove = vi.fn();
      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/figures/E9B05.png"
          onRemove={onRemove}
        />
      );

      const deleteButton = document.querySelector('[class*="text-destructive"]') as HTMLElement;
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Remove Figure')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('should disable upload button while uploading', async () => {
      let resolveUpload: (value: { error: null }) => void;
      mockUpload.mockImplementation(() => new Promise(resolve => {
        resolveUpload = resolve;
      }));

      render(<FigureUpload {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', { value: [pngFile] });

      fireEvent.change(fileInput);

      await waitFor(() => {
        const uploadButton = screen.getByText('Uploading...').closest('button');
        expect(uploadButton).toBeDisabled();
      });

      // Resolve the mock to allow cleanup to complete properly
      resolveUpload!({ error: null });

      // Wait for the upload to complete
      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should disable delete button while removing', async () => {
      let resolveRemove: (value: { error: null }) => void;
      mockRemove.mockImplementation(() => new Promise(resolve => {
        resolveRemove = resolve;
      }));

      render(
        <FigureUpload
          {...defaultProps}
          currentFigureUrl="https://storage.example.com/question-figures/E9B05.png"
        />
      );

      const deleteButton = document.querySelector('[class*="text-destructive"]') as HTMLElement;
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Remove Figure')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^Remove$/i });
      fireEvent.click(confirmButton);

      // The button should be disabled during remove
      await waitFor(() => {
        const removeBtn = document.querySelector('[class*="text-destructive"]');
        // During remove, the button shows a loader
        expect(removeBtn?.querySelector('.animate-spin') || removeBtn?.hasAttribute('disabled')).toBeTruthy();
      });

      // Resolve the mock to allow cleanup to complete properly
      resolveRemove!({ error: null });

      // Wait for the remove operation to complete
      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalled();
      });
    });
  });
});
