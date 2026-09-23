import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { muiWrapper } from '@/test/utils';
import { BulkExport } from './BulkExport';

const mockDownload = vi.fn();
vi.mock('@/lib/downloadFile', () => ({ downloadFile: (...args: unknown[]) => mockDownload(...args) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: muiWrapper });

interface Term { term: string; definition: string }
const rows: Term[] = [
  { term: 'QSO', definition: 'A contact' },
  { term: 'QRM', definition: 'Interference, man-made' },
];

const props = {
  data: rows,
  filename: 'glossary',
  formatCSV: (items: Term[]) => items.map((i) => `${i.term},${i.definition}`).join('\n'),
  formatJSON: (items: Term[]) => items.map((i) => ({ ...i })),
  itemLabel: 'terms',
};

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Export' }));
  return user;
};

/** This component had no tests before the MUI port. */
describe('BulkExport', () => {
  beforeEach(() => vi.clearAllMocks());

  /** The trigger is aria-hidden behind MUI's modal Menu once open, so hold the node. */
  it('keeps the menu closed until the button is used', async () => {
    render(<BulkExport {...props} />);
    const trigger = screen.getByRole('button', { name: 'Export' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await openMenu();

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('downloads a CSV named after the filename', async () => {
    render(<BulkExport {...props} />);
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Export as CSV' }));

    expect(mockDownload).toHaveBeenCalledWith('glossary.csv', 'QSO,A contact\nQRM,Interference, man-made', 'text/csv');
    expect(toast.success).toHaveBeenCalledWith('Exported 2 terms as CSV');
  });

  it('downloads indented JSON', async () => {
    render(<BulkExport {...props} />);
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Export as JSON' }));

    const [name, content, mime] = mockDownload.mock.calls[0];
    expect(name).toBe('glossary.json');
    expect(mime).toBe('application/json');
    expect(JSON.parse(content as string)).toEqual(rows);
    expect(content).toContain('\n  ');
  });

  it('closes the menu after exporting', async () => {
    render(<BulkExport {...props} />);
    const trigger = screen.getByRole('button', { name: 'Export' });
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Export as CSV' }));

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('says there is nothing to export rather than downloading an empty file', async () => {
    render(<BulkExport {...props} data={[]} />);
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Export as CSV' }));

    expect(mockDownload).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('No terms to export');
  });
});
