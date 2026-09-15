import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AdminHamRadioTools } from './AdminHamRadioTools';
import { muiWrapper } from '@/test/utils/testWrappers';

const mockTools = vi.fn();
const mockCategories = vi.fn();
const mockCreate = vi.fn((_vars, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
const mockUpdate = vi.fn((_vars, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
const mockDelete = vi.fn((_id, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@/hooks/useHamRadioTools', () => ({
  useAdminHamRadioTools: () => ({ data: mockTools(), isLoading: false }),
  useHamRadioToolCategories: () => ({ data: mockCategories(), isLoading: false }),
  useCreateHamRadioTool: () => ({ mutate: mockCreate, isPending: false }),
  useUpdateHamRadioTool: () => ({ mutate: mockUpdate, isPending: false }),
  useDeleteHamRadioTool: () => ({ mutate: mockDelete, isPending: false }),
  getToolImageUrl: () => null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'admin@example.com' } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Uploading is its own component with its own storage concerns.
vi.mock('./HamRadioToolImageUpload', () => ({ HamRadioToolImageUpload: () => <div /> }));

const tool = (over: Record<string, unknown> = {}) => ({
  id: 'tool-1',
  category_id: 'cat-1',
  title: 'QRZ Callsign Lookup',
  description: 'Look up a callsign.',
  url: 'https://qrz.com',
  is_published: true,
  display_order: 0,
  image_url: null,
  storage_path: null,
  edit_history: [],
  category: { id: 'cat-1', name: 'Lookup', slug: 'lookup' },
  ...over,
});

const category = (over: Record<string, unknown> = {}) => ({
  id: 'cat-1',
  name: 'Lookup',
  slug: 'lookup',
  description: null,
  display_order: 0,
  icon_name: null,
  created_at: '',
  updated_at: '',
  ...over,
});

const renderTools = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<AdminHamRadioTools />, { wrapper });
};

describe('AdminHamRadioTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTools.mockReturnValue([tool()]);
    mockCategories.mockReturnValue([category()]);
  });

  describe('list', () => {
    it('shows the tool count and each tool', () => {
      renderTools();

      expect(screen.getByText('Ham Radio Tools (1)')).toBeInTheDocument();
      expect(screen.getByText('QRZ Callsign Lookup')).toBeInTheDocument();
      expect(screen.getByText('Look up a callsign.')).toBeInTheDocument();
    });

    it('marks published and draft tools differently', () => {
      mockTools.mockReturnValue([
        tool(),
        tool({ id: 'tool-2', title: 'Draft Tool', is_published: false }),
      ]);
      renderTools();

      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('filters by search term', async () => {
      const user = userEvent.setup();
      mockTools.mockReturnValue([tool(), tool({ id: 'tool-2', title: 'Grid Square Map' })]);
      renderTools();

      await user.type(screen.getByRole('textbox', { name: /search tools/i }), 'grid');

      expect(screen.getByText('Grid Square Map')).toBeInTheDocument();
      expect(screen.queryByText('QRZ Callsign Lookup')).not.toBeInTheDocument();
    });

    /** The old edit buttons were bare icons with no accessible name at all. */
    it('names each edit button after the tool it edits', () => {
      mockTools.mockReturnValue([tool(), tool({ id: 'tool-2', title: 'Grid Square Map' })]);
      renderTools();

      expect(screen.getByRole('button', { name: 'Edit QRZ Callsign Lookup' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit Grid Square Map' })).toBeInTheDocument();
    });

    /**
     * MUI renders a Select as a <div role="combobox">, so a <label htmlFor>
     * associates with nothing — the mistake #286 found. InputLabel + labelId
     * is what actually names it.
     */
    it('names the category filter', () => {
      renderTools();

      expect(screen.getByRole('combobox', { name: 'Category' })).toBeInTheDocument();
    });
  });

  describe('add dialog', () => {
    it('labels every field, including the category select', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: /add tool/i }));
      const dialog = within(screen.getByRole('dialog'));

      expect(dialog.getByRole('textbox', { name: 'Title' })).toBeInTheDocument();
      expect(dialog.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
      expect(dialog.getByRole('textbox', { name: 'URL' })).toBeInTheDocument();
      expect(dialog.getByRole('combobox', { name: 'Category' })).toBeInTheDocument();
      expect(dialog.getByRole('switch', { name: 'Published' })).toBeInTheDocument();
    });

    it('keeps submit disabled until title, description and URL are all filled', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: /add tool/i }));
      const dialog = within(screen.getByRole('dialog'));
      const submit = dialog.getByRole('button', { name: 'Add Tool' });

      expect(submit).toBeDisabled();
      await user.type(dialog.getByRole('textbox', { name: 'Title' }), 'Grid Map');
      expect(submit).toBeDisabled();
      await user.type(dialog.getByRole('textbox', { name: 'Description' }), 'Maps grids.');
      expect(submit).toBeDisabled();
      await user.type(dialog.getByRole('textbox', { name: 'URL' }), 'https://example.com');
      expect(submit).toBeEnabled();
    });

    it('submits the trimmed draft', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: /add tool/i }));
      const dialog = within(screen.getByRole('dialog'));
      await user.type(dialog.getByRole('textbox', { name: 'Title' }), '  Grid Map  ');
      await user.type(dialog.getByRole('textbox', { name: 'Description' }), 'Maps grids.');
      await user.type(dialog.getByRole('textbox', { name: 'URL' }), 'https://example.com');
      await user.click(dialog.getByRole('button', { name: 'Add Tool' }));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Grid Map', url: 'https://example.com' }),
        expect.anything()
      );
    });

    /** The leak #302 found: a save closes from the caller, bypassing any close handler. */
    it('reopens blank after a successful save', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: /add tool/i }));
      let dialog = within(screen.getByRole('dialog'));
      await user.type(dialog.getByRole('textbox', { name: 'Title' }), 'Grid Map');
      await user.type(dialog.getByRole('textbox', { name: 'Description' }), 'Maps grids.');
      await user.type(dialog.getByRole('textbox', { name: 'URL' }), 'https://example.com');
      await user.click(dialog.getByRole('button', { name: 'Add Tool' }));

      // MUI keeps the dialog mounted through its exit transition.
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: /add tool/i }));

      dialog = within(screen.getByRole('dialog'));
      expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('');
      expect(dialog.getByRole('textbox', { name: 'URL' })).toHaveValue('');
    });
  });

  describe('edit dialog', () => {
    it('opens filled with the chosen tool', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: 'Edit QRZ Callsign Lookup' }));
      const dialog = within(screen.getByRole('dialog'));

      expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue('QRZ Callsign Lookup');
      expect(dialog.getByRole('textbox', { name: 'URL' })).toHaveValue('https://qrz.com');
      expect(dialog.getByRole('switch', { name: 'Published' })).toBeChecked();
    });

    /**
     * The history entry is built by diffing the payload against the stored
     * tool, so only what actually changed should be recorded.
     */
    it('records only the changed fields in the edit history', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: 'Edit QRZ Callsign Lookup' }));
      const dialog = within(screen.getByRole('dialog'));
      const description = dialog.getByRole('textbox', { name: 'Description' });
      await user.clear(description);
      await user.type(description, 'Looks up callsigns worldwide.');
      await user.click(dialog.getByRole('button', { name: /save changes/i }));

      const payload = mockUpdate.mock.calls[0][0] as {
        edit_history: { changes: Record<string, unknown> }[];
      };
      const changes = payload.edit_history.at(-1)!.changes;
      expect(Object.keys(changes)).toEqual(['description']);
    });

    it('deletes once the confirmation is accepted', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: 'Edit QRZ Callsign Lookup' }));
      await user.click(screen.getByRole('button', { name: /delete tool/i }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' })
      );

      expect(mockDelete).toHaveBeenCalledWith('tool-1', expect.anything());
    });

    it('does not delete until the confirmation is accepted', async () => {
      const user = userEvent.setup();
      renderTools();

      await user.click(screen.getByRole('button', { name: 'Edit QRZ Callsign Lookup' }));
      await user.click(screen.getByRole('button', { name: /delete tool/i }));

      const confirm = screen.getByRole('alertdialog');
      expect(confirm).toHaveAccessibleName('Delete Tool');
      expect(confirm).toHaveAccessibleDescription(/cannot be undone/i);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
