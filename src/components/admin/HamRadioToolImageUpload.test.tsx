import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { HamRadioToolImageUpload } from './HamRadioToolImageUpload';

const mockUpload = vi.fn();
const mockRemove = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        remove: (...args: unknown[]) => mockRemove(...args),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example.com/${path}` } }),
      }),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

const props = {
  toolId: 'tool-1',
  currentStoragePath: null as string | null,
  onUpload: vi.fn(),
  onRemove: vi.fn(),
};

const png = (size = 10) =>
  Object.defineProperty(new File(['x'], 'photo.png', { type: 'image/png' }), 'size', { value: size }) as File;

/** This component had no tests before the MUI port. */
describe('HamRadioToolImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  it('offers an upload and no remove when there is no image', () => {
    render(<HamRadioToolImageUpload {...props} />);

    expect(screen.getByRole('button', { name: 'Upload Image' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the stored image and offers replace and remove', () => {
    render(<HamRadioToolImageUpload {...props} currentStoragePath="tool-1.png" />);

    expect(screen.getByRole('img', { name: 'Tool image' })).toHaveAttribute('src', 'https://cdn.example.com/tool-1.png');
    expect(screen.getByRole('button', { name: 'Replace Image' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove image' })).toBeInTheDocument();
  });

  it('names the object from the tool id and the MIME type, not the file name', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<HamRadioToolImageUpload {...props} onUpload={onUpload} />);

    await user.upload(screen.getByLabelText('Choose image to upload'), png());

    await waitFor(() => expect(mockUpload).toHaveBeenCalled());
    expect(mockUpload.mock.calls[0][0]).toBe('tool-1.png');
    expect(mockUpload.mock.calls[0][2]).toEqual({ cacheControl: '3600', upsert: true });
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith('tool-1.png'));
    expect(toast.success).toHaveBeenCalledWith('Image uploaded successfully');
  });

  /** upsert covers the same name; a different extension would otherwise be orphaned. */
  it('clears an old object whose extension differs, and not one that matches', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<HamRadioToolImageUpload {...props} currentStoragePath="tool-1.webp" />);

    await user.upload(screen.getByLabelText('Choose image to upload'), png());
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(['tool-1.webp']));
    unmount();

    mockRemove.mockClear();
    render(<HamRadioToolImageUpload {...props} currentStoragePath="tool-1.png" />);
    await user.upload(screen.getByLabelText('Choose image to upload'), png());
    await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(2));
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('rejects a file over 2 MB before uploading anything', async () => {
    const user = userEvent.setup();
    render(<HamRadioToolImageUpload {...props} />);

    await user.upload(screen.getByLabelText('Choose image to upload'), png(3 * 1024 * 1024));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('File too large. Maximum size is 2 MB.'));
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects a type it does not take', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<HamRadioToolImageUpload {...props} />);

    await user.upload(screen.getByLabelText('Choose image to upload'), new File(['x'], 'a.svg', { type: 'image/svg+xml' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid file type. Please upload PNG, JPEG, GIF, or WebP.')
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('reports a failed upload and tells the caller nothing', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    mockUpload.mockResolvedValueOnce({ error: { message: 'bucket full' } });
    render(<HamRadioToolImageUpload {...props} onUpload={onUpload} />);

    await user.upload(screen.getByLabelText('Choose image to upload'), png());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to upload image')));
    expect(onUpload).not.toHaveBeenCalled();
  });

  describe('removing', () => {
    it('asks first, and does nothing on cancel', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<HamRadioToolImageUpload {...props} currentStoragePath="tool-1.png" onRemove={onRemove} />);

      await user.click(screen.getByRole('button', { name: 'Remove image' }));
      const dialog = await screen.findByRole('alertdialog', { name: 'Remove Image' });
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(mockRemove).not.toHaveBeenCalled();
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('deletes the object and tells the caller once confirmed', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<HamRadioToolImageUpload {...props} currentStoragePath="tool-1.png" onRemove={onRemove} />);

      await user.click(screen.getByRole('button', { name: 'Remove image' }));
      await user.click(await screen.findByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(['tool-1.png']));
      expect(onRemove).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Image removed successfully');
    });

    it('reports a failed delete and leaves the caller alone', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      mockRemove.mockResolvedValueOnce({ error: { message: 'denied' } });
      render(<HamRadioToolImageUpload {...props} currentStoragePath="tool-1.png" onRemove={onRemove} />);

      await user.click(screen.getByRole('button', { name: 'Remove image' }));
      await user.click(await screen.findByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to remove image: denied'));
      expect(onRemove).not.toHaveBeenCalled();
    });
  });
});
