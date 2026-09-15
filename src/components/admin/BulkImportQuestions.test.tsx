import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BulkImportQuestions } from './BulkImportQuestions';
import { createTestQueryClient, muiWrapper } from '@/test/utils/testWrappers';

const mockExisting = vi.fn<[], Record<string, unknown>[]>();
const mockUpsert = vi.fn();
const mockDownload = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ in: () => Promise.resolve({ data: mockExisting(), error: null }) }),
      upsert: (...args: unknown[]) => {
        mockUpsert(...args);
        return Promise.resolve({ error: null });
      },
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/downloadFile', () => ({ downloadFile: (...a: unknown[]) => mockDownload(...a) }));

const HEADER =
  'id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group,explanation';

const row = (id: string, answer: string, text = 'What is a dipole?', explanation = 'Because.') =>
  `${id},"${text}","a","b","c","d",${answer},T1,T1A,"${explanation}"`;

const ONE_GOOD_ROW = `${HEADER}\n${row('T1A01', 'B')}`;

/**
 * A "4" is impossible in a 0-based key (0=A…3=D), so the parser flags the file
 * as possibly 1-based. The second row keeps one question valid, since a file
 * with nothing importable shows no action button at all.
 */
const ONE_BASED_FILE = `${HEADER}\n${row('T1A01', '2')}\n${row('T1A02', '4')}`;

const CONFIRM_LABEL = "I've verified these answer keys are 0-based — import anyway.";

const renderImporter = () => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<BulkImportQuestions testType="technician" />, { wrapper });
};

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  renderImporter();
  await user.click(screen.getByRole('button', { name: 'Bulk Import' }));
};

const upload = (user: ReturnType<typeof userEvent.setup>, csv: string) =>
  user.upload(
    screen.getByLabelText('Click to upload CSV, JSON, or DOCX'),
    new File([csv], 'questions.csv', { type: 'text/csv' })
  );

describe('BulkImportQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExisting.mockReturnValue([]);
  });

  describe('the dialog', () => {
    it('names itself and states the ID prefix it requires', async () => {
      const user = userEvent.setup();
      await open(user);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Bulk Import Questions');
      expect(
        screen.getByText('Question IDs must start with "T" for technician exam')
      ).toBeInTheDocument();
    });

    it('offers an example per downloadable format, and none for DOCX', async () => {
      const user = userEvent.setup();
      await open(user);

      expect(screen.getByText('NCVEC Word Document (.docx)')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Example/ })).toHaveLength(2);

      await user.click(screen.getByRole('button', { name: 'Example CSV file' }));
      expect(mockDownload).toHaveBeenCalledWith(
        'example_questions_technician.csv',
        expect.stringContaining('T1A01'),
        'text/csv'
      );
    });
  });

  describe('validation', () => {
    it('rejects IDs from another licence class and names the row', async () => {
      const user = userEvent.setup();
      await open(user);

      await upload(user, `${HEADER}\n${row('T1A01', 'B')}\n${row('G1A01', 'C')}`);

      expect(await screen.findByText('1 Valid')).toBeInTheDocument();
      expect(screen.getByText('Row 3 (G1A01)')).toBeInTheDocument();
      expect(
        screen.getByText('ID must start with "T" for technician questions')
      ).toBeInTheDocument();
    });

    it('imports a clean file', async () => {
      const user = userEvent.setup();
      await open(user);
      await upload(user, ONE_GOOD_ROW);

      await user.click(await screen.findByRole('button', { name: 'Import 1 Questions' }));

      await waitFor(() =>
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ display_name: 'T1A01', correct_answer: 1 }),
          { onConflict: 'display_name' }
        )
      );
    });
  });

  /**
   * A 1-based answer key imports every answer shifted by one, silently. The
   * parser can only guess, so the gate is an explicit confirmation rather than
   * a hard rejection — but nothing may import past it unacknowledged.
   */
  describe('the 1-based answer key gate', () => {
    it('shows the warning and blocks import until it is acknowledged', async () => {
      const user = userEvent.setup();
      await open(user);
      await upload(user, ONE_BASED_FILE);

      expect(await screen.findByText('1 warning')).toBeInTheDocument();
      expect(screen.getByText(/may be 1-based/)).toBeInTheDocument();

      const importButton = screen.getByRole('button', { name: 'Import 1 Questions' });
      expect(importButton).toBeDisabled();

      await user.click(screen.getByRole('checkbox', { name: CONFIRM_LABEL }));

      expect(importButton).toBeEnabled();
      await user.click(importButton);
      await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    });

    it('blocks the conflict route too, and restates the warning there', async () => {
      const user = userEvent.setup();
      mockExisting.mockReturnValue([
        {
          display_name: 'T1A01',
          question: 'Old text',
          options: ['a', 'b', 'c', 'd'],
          correct_answer: 0,
          subelement: 'T1',
          question_group: 'T1A',
          explanation: 'Old explanation',
          links: [],
        },
      ]);
      await open(user);
      await upload(user, ONE_BASED_FILE);

      const resolve = await screen.findByRole('button', { name: 'Resolve 1 Conflicts' });
      expect(resolve).toBeDisabled();

      await user.click(screen.getByRole('checkbox', { name: CONFIRM_LABEL }));
      await user.click(resolve);

      expect(screen.getByText(/double-check merged answers below/)).toBeInTheDocument();
    });

    it('drops the gate when a later file has unambiguous keys', async () => {
      const user = userEvent.setup();
      await open(user);
      await upload(user, ONE_BASED_FILE);
      await screen.findByText('1 warning');

      await upload(user, ONE_GOOD_ROW);

      await waitFor(() => expect(screen.queryByText('1 warning')).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Import 1 Questions' })).toBeEnabled();
    });
  });

  describe('conflicts', () => {
    const existing = {
      display_name: 'T1A01',
      question: 'Old text',
      options: ['a', 'b', 'c', 'd'],
      correct_answer: 0,
      subelement: 'T1',
      question_group: 'T1A',
      explanation: 'Old explanation',
      links: [{ url: 'https://example.com' }],
    };

    const reachConflicts = async (user: ReturnType<typeof userEvent.setup>) => {
      mockExisting.mockReturnValue([existing]);
      await open(user);
      await upload(user, `${HEADER}\n${row('T1A01', 'B', 'New text', 'New explanation')}`);
      await user.click(await screen.findByRole('button', { name: 'Resolve 1 Conflicts' }));
    };

    /**
     * Only the incoming side of a conflict has been through
     * validateQuestions — the database side is read straight off the row, so
     * an out-of-range key reaches the preview. It must say what is stored
     * rather than render an empty "Answer:".
     */
    it('shows an out-of-range stored answer rather than a blank', async () => {
      const user = userEvent.setup();
      mockExisting.mockReturnValue([{ ...existing, correct_answer: 7 }]);
      await open(user);
      await upload(user, ONE_GOOD_ROW);
      await user.click(await screen.findByRole('button', { name: 'Resolve 1 Conflicts' }));

      expect(screen.getByText('Answer: invalid (7)')).toBeInTheDocument();
      expect(screen.getByText('Answer: B')).toBeInTheDocument();
    });

    it('lists the clash under its question ID', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Resolve Import Conflicts');
      expect(screen.getByRole('radiogroup', { name: 'Resolution for T1A01' })).toBeInTheDocument();
    });

    /** A merge takes the new wording but never discards a curated explanation. */
    it('says what a merge would keep, then writes that', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      await user.click(screen.getByRole('radio', { name: 'Merge' }));

      const dialog = within(screen.getByRole('dialog'));
      expect(dialog.getByText('Explanation: Kept')).toBeInTheDocument();
      expect(dialog.getByText('Links: 1 (Kept)')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Apply Resolutions' }));

      await waitFor(() =>
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            question: 'New text',
            correct_answer: 1,
            explanation: 'Old explanation',
          }),
          { onConflict: 'display_name' }
        )
      );
    });

    it('keeps the parsed file when the conflict screen is cancelled', async () => {
      const user = userEvent.setup();
      await reachConflicts(user);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Bulk Import Questions');
      expect(screen.getByText('1 Conflicts')).toBeInTheDocument();
    });
  });

  it('forgets the previous file after an import closes it', async () => {
    const user = userEvent.setup();
    await open(user);
    await upload(user, ONE_GOOD_ROW);
    await user.click(await screen.findByRole('button', { name: 'Import 1 Questions' }));
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));

    await user.click(screen.getByRole('button', { name: 'Bulk Import' }));

    expect(screen.queryByText('1 Valid')).not.toBeInTheDocument();
  });
});
