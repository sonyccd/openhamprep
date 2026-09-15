import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BulkImportGlossary } from './BulkImportGlossary';
import { createTestQueryClient, muiWrapper } from '@/test/utils/testWrappers';

const mockExisting = vi.fn<[], Record<string, unknown>[]>();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDownload = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: mockExisting(), error: null }),
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return Promise.resolve({ error: null });
      },
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/downloadFile', () => ({ downloadFile: (...a: unknown[]) => mockDownload(...a) }));

const CSV_HEADER = 'term,definition';
const ONE_GOOD_ROW = `${CSV_HEADER}\nAntenna,"A radiator"`;

const renderImporter = () => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<BulkImportGlossary />, { wrapper });
};

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  renderImporter();
  await user.click(screen.getByRole('button', { name: 'Bulk Import' }));
};

/** The file input is the control; the dashed button is its <label>. */
const upload = (user: ReturnType<typeof userEvent.setup>, csv: string, name = 'terms.csv') =>
  user.upload(
    screen.getByLabelText('Click to upload CSV or JSON'),
    new File([csv], name, { type: 'text/csv' })
  );

describe('BulkImportGlossary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExisting.mockReturnValue([]);
  });

  describe('the dialog', () => {
    it('names itself', async () => {
      const user = userEvent.setup();
      await open(user);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Bulk Import Glossary Terms');
    });

    /**
     * Both example downloads were buttons reading only "Example", so they were
     * indistinguishable by name — each now carries its format.
     */
    it('tells the two example downloads apart', async () => {
      const user = userEvent.setup();
      await open(user);

      await user.click(screen.getByRole('button', { name: 'Example CSV file' }));
      expect(mockDownload).toHaveBeenCalledWith(
        'example_glossary.csv',
        expect.stringContaining('term,definition'),
        'text/csv'
      );

      await user.click(screen.getByRole('button', { name: 'Example JSON file' }));
      expect(mockDownload).toHaveBeenCalledWith(
        'example_glossary.json',
        expect.stringContaining('"term"'),
        'application/json'
      );
    });

    /**
     * A finished import closes the dialog from inside the hook, which is the
     * one close path no close handler sees — so the reset hangs off opening.
     * Cancel and Escape would both pass against a reset-on-close too; this is
     * the case that tells the two apart.
     */
    it('forgets the previous file after an import closes it', async () => {
      const user = userEvent.setup();
      await open(user);
      await upload(user, ONE_GOOD_ROW);
      await user.click(await screen.findByRole('button', { name: 'Import 1 Terms' }));
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));

      await user.click(screen.getByRole('button', { name: 'Bulk Import' }));

      expect(screen.queryByText('1 Valid')).not.toBeInTheDocument();
    });

    it('forgets the previous file after Cancel', async () => {
      const user = userEvent.setup();
      await open(user);
      await upload(user, ONE_GOOD_ROW);
      await screen.findByText('1 Valid');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: 'Bulk Import' }));

      expect(screen.queryByText('1 Valid')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('tallies valid rows and names each bad one', async () => {
      const user = userEvent.setup();
      await open(user);

      await upload(user, `${CSV_HEADER}\nAntenna,"A radiator"\nDipole,`);

      expect(await screen.findByText('1 Valid')).toBeInTheDocument();
      expect(screen.getByText('1 Errors')).toBeInTheDocument();
      // Row 1 is the header, so the second record is row 3.
      expect(screen.getByText('Row 3 (Dipole)')).toBeInTheDocument();
      expect(screen.getByText('Missing definition')).toBeInTheDocument();
    });

    it('offers no import action when nothing parsed', async () => {
      const user = userEvent.setup();
      await open(user);

      await upload(user, `${CSV_HEADER}\n,`);

      await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /^Import/ })).not.toBeInTheDocument();
    });
  });

  describe('importing', () => {
    it('inserts the new terms and closes', async () => {
      const user = userEvent.setup();
      await open(user);
      await upload(user, ONE_GOOD_ROW);

      await user.click(await screen.findByRole('button', { name: 'Import 1 Terms' }));

      expect(mockInsert).toHaveBeenCalledWith({ term: 'Antenna', definition: 'A radiator' });
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    });
  });

  describe('conflicts', () => {
    const existingAntenna = [{ id: 'g1', term: 'antenna', definition: 'The old wording' }];

    const reachConflicts = async (user: ReturnType<typeof userEvent.setup>) => {
      mockExisting.mockReturnValue(existingAntenna);
      await open(user);
      await upload(user, ONE_GOOD_ROW);
      await user.click(await screen.findByRole('button', { name: 'Resolve 1 Conflicts' }));
    };

    it('matches an existing term regardless of case', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Resolve Import Conflicts');
      expect(screen.getByRole('radiogroup', { name: 'Resolution for Antenna' })).toBeInTheDocument();
    });

    it('writes nothing when every conflict is kept', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      await reachConflicts(user);

      await user.click(screen.getByRole('button', { name: 'Apply Resolutions' }));

      await waitFor(() =>
        expect(toast.info).toHaveBeenCalledWith(
          'No terms to import (all conflicts set to keep existing)'
        )
      );
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('replaces with the incoming definition', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      await user.click(screen.getByRole('radio', { name: 'Replace' }));
      await user.click(screen.getByRole('button', { name: 'Apply Resolutions' }));

      await waitFor(() =>
        expect(mockUpdate).toHaveBeenCalledWith({ term: 'Antenna', definition: 'A radiator' })
      );
    });

    /**
     * A merge keeps curated wording: the existing definition wins whenever
     * there is one, so an import can never quietly overwrite it.
     */
    it('keeps the existing definition on a merge', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      await user.click(screen.getByRole('radio', { name: 'Merge' }));
      expect(
        within(screen.getByRole('dialog')).getByText('(Kept existing)')
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Apply Resolutions' }));

      await waitFor(() =>
        expect(mockUpdate).toHaveBeenCalledWith({ term: 'Antenna', definition: 'The old wording' })
      );
    });

    /**
     * Cancelling used to clear the conflicts as well, which left an
     * "Import 0 Terms" button and no way back to the conflict screen without
     * re-uploading the file. The route back has to survive.
     */
    it('returns to the upload step with the conflicts still offered', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Bulk Import Glossary Terms');
      expect(screen.getByText('1 Valid')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Resolve 1 Conflicts' })).toBeInTheDocument();
    });
  });
});
