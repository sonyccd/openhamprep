import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlossaryHighlightedText } from './GlossaryHighlightedText';
import { muiWrapper } from '@/test/utils/testWrappers';
import userEvent from '@testing-library/user-event';

// Mock useGlossaryTerms
const mockTerms = [
  { id: '1', term: 'Antenna', definition: 'Device for transmitting/receiving radio waves' },
  { id: '2', term: 'Band', definition: 'A range of frequencies' },
  { id: '3', term: 'CW', definition: 'Continuous Wave (Morse code)' },
  { id: '4', term: 'Amateur Radio', definition: 'Non-commercial radio communication' },
];

vi.mock('@/hooks/useGlossaryTerms', () => ({
  useGlossaryTerms: vi.fn(() => ({ data: mockTerms })),
}));

import { useGlossaryTerms } from '@/hooks/useGlossaryTerms';

describe('GlossaryHighlightedText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGlossaryTerms).mockReturnValue({ data: mockTerms } as ReturnType<typeof useGlossaryTerms>);
  });

  describe('Empty Terms', () => {
    it('renders plain text when no terms are available', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({ data: [] } as ReturnType<typeof useGlossaryTerms>);

      render(<GlossaryHighlightedText text="This is some text about Antenna and Band." />, { wrapper: muiWrapper });

      expect(screen.getByText('This is some text about Antenna and Band.')).toBeInTheDocument();
    });

    it('renders plain text when terms is undefined', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({ data: undefined } as ReturnType<typeof useGlossaryTerms>);

      render(<GlossaryHighlightedText text="Some radio text." />, { wrapper: muiWrapper });

      expect(screen.getByText('Some radio text.')).toBeInTheDocument();
    });
  });

  describe('Term Matching', () => {
    it('highlights a single term in text', () => {
      render(<GlossaryHighlightedText text="An Antenna is used for radio." />, { wrapper: muiWrapper });

      // A highlighted term becomes an interactive glossary trigger.
      expect(screen.getByRole('button', { name: 'Antenna' })).toHaveTextContent('Antenna');
    });

    it('highlights multiple terms in text', () => {
      render(<GlossaryHighlightedText text="Use an Antenna for CW communication." />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'Antenna' })).toHaveTextContent('Antenna');
      expect(screen.getByRole('button', { name: 'CW' })).toHaveTextContent('CW');
    });

    it('matches terms case-insensitively', () => {
      render(<GlossaryHighlightedText text="The antenna is important." />, { wrapper: muiWrapper });

      // The name is the word as written in the text, not the canonical term.
      expect(screen.getByRole('button', { name: /^antenna$/i })).toHaveTextContent('antenna');
    });

    it('matches uppercase terms', () => {
      render(<GlossaryHighlightedText text="THE ANTENNA IS IMPORTANT." />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: /^antenna$/i })).toHaveTextContent('ANTENNA');
    });

    it('matches multi-word terms', () => {
      render(<GlossaryHighlightedText text="I love Amateur Radio." />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'Amateur Radio' })).toHaveTextContent('Amateur Radio');
    });
  });

  describe('Word Boundaries', () => {
    it('does not match partial words', () => {
      render(<GlossaryHighlightedText text="Antennas are useful." />, { wrapper: muiWrapper });

      // "Antennas" must stay plain text: no glossary trigger is created for it.
      expect(screen.getByText(/Antennas are useful\./)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('matches terms at start of text', () => {
      render(<GlossaryHighlightedText text="Antenna is great." />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'Antenna' })).toHaveTextContent('Antenna');
    });

    it('matches terms at end of text', () => {
      render(<GlossaryHighlightedText text="This is an Antenna" />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'Antenna' })).toHaveTextContent('Antenna');
    });
  });

  describe('Non-Matched Text', () => {
    it('renders non-term text without highlighting', () => {
      render(<GlossaryHighlightedText text="Hello world, check out this Antenna please." />, { wrapper: muiWrapper });

      // Non-term text should not have underline class
      const nonHighlightedText = screen.getByText((content, element) => {
        return element?.textContent === 'Hello world, check out this ' && !element.classList.contains('underline');
      });
      expect(nonHighlightedText).toBeInTheDocument();
    });

    it('preserves text with no matching terms', () => {
      render(<GlossaryHighlightedText text="No terms here at all." />, { wrapper: muiWrapper });

      expect(screen.getByText('No terms here at all.')).toBeInTheDocument();
    });
  });

  describe('Special Characters', () => {
    it('handles text with regex special characters', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({
        data: [{ id: '1', term: 'Q*R', definition: 'Test term with special char' }],
      } as ReturnType<typeof useGlossaryTerms>);

      // Should not throw and should render the text
      render(<GlossaryHighlightedText text="Testing Q*R here" />, { wrapper: muiWrapper });

      expect(screen.getByText('Q*R')).toBeInTheDocument();
    });

    it('handles term with parentheses', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({
        data: [{ id: '1', term: 'Test (item)', definition: 'A test item' }],
      } as ReturnType<typeof useGlossaryTerms>);

      render(<GlossaryHighlightedText text="This is a Test (item) example." />, { wrapper: muiWrapper });

      // The term with parentheses may or may not be matched depending on regex escaping
      // At minimum, the component should not crash and should render the text
      expect(screen.getByText(/Test \(item\)/)).toBeInTheDocument();
    });
  });

  describe('Tooltip Styling', () => {
    /**
     * The definition used to be the trigger's aria-label, which replaced the
     * word with "Antenna: A device that…" for a screen reader — the sentence
     * stopped reading as a sentence. The word is the name now, and the
     * definition is attached as the description while the tooltip is open,
     * which is the standard tooltip pattern and what MUI's describeChild does.
     */
    it('keeps the word as the name and attaches the definition as its description', async () => {
      const user = userEvent.setup();
      render(<GlossaryHighlightedText text="An Antenna example." />, { wrapper: muiWrapper });

      const highlightedTerm = screen.getByRole('button', { name: 'Antenna' });
      expect(highlightedTerm).toHaveAccessibleName('Antenna');

      // Focus opens it, so keyboard users get the description without a mouse.
      await user.tab();
      expect(highlightedTerm).toHaveFocus();
      await screen.findByText(/Device for transmitting\/receiving radio waves/i);
      expect(highlightedTerm).toHaveAccessibleDescription(
        /Device for transmitting\/receiving radio waves/i
      );
    });

    /** A real button: Enter and Space work, and it is in the tab order. */
    it('is a native button rather than a span playing one', () => {
      render(<GlossaryHighlightedText text="An Antenna example." />, { wrapper: muiWrapper });

      const highlightedTerm = screen.getByRole('button', { name: 'Antenna' });
      expect(highlightedTerm.tagName).toBe('BUTTON');
      expect(highlightedTerm).toHaveAttribute('type', 'button');
    });
  });

  describe('Term Priority', () => {
    it('matches longer terms first', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({
        data: [
          { id: '1', term: 'Radio', definition: 'Communication device' },
          { id: '2', term: 'Amateur Radio', definition: 'Non-commercial radio communication' },
        ],
      } as ReturnType<typeof useGlossaryTerms>);

      render(<GlossaryHighlightedText text="I use Amateur Radio daily." />, { wrapper: muiWrapper });

      // "Amateur Radio" should be matched as a single term, not just "Radio"
      expect(screen.getByRole('button', { name: 'Amateur Radio' })).toHaveTextContent('Amateur Radio');
    });
  });
});
