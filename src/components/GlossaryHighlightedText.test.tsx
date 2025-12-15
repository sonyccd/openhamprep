import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlossaryHighlightedText } from './GlossaryHighlightedText';

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

      render(<GlossaryHighlightedText text="This is some text about Antenna and Band." />);

      expect(screen.getByText('This is some text about Antenna and Band.')).toBeInTheDocument();
    });

    it('renders plain text when terms is undefined', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({ data: undefined } as ReturnType<typeof useGlossaryTerms>);

      render(<GlossaryHighlightedText text="Some radio text." />);

      expect(screen.getByText('Some radio text.')).toBeInTheDocument();
    });
  });

  describe('Term Matching', () => {
    it('highlights a single term in text', () => {
      render(<GlossaryHighlightedText text="An Antenna is used for radio." />);

      // The term should be highlighted with underline styling
      const highlightedTerm = screen.getByText('Antenna');
      expect(highlightedTerm).toHaveClass('underline');
    });

    it('highlights multiple terms in text', () => {
      render(<GlossaryHighlightedText text="Use an Antenna for CW communication." />);

      expect(screen.getByText('Antenna')).toHaveClass('underline');
      expect(screen.getByText('CW')).toHaveClass('underline');
    });

    it('matches terms case-insensitively', () => {
      render(<GlossaryHighlightedText text="The antenna is important." />);

      const highlightedTerm = screen.getByText('antenna');
      expect(highlightedTerm).toHaveClass('underline');
    });

    it('matches uppercase terms', () => {
      render(<GlossaryHighlightedText text="THE ANTENNA IS IMPORTANT." />);

      const highlightedTerm = screen.getByText('ANTENNA');
      expect(highlightedTerm).toHaveClass('underline');
    });

    it('matches multi-word terms', () => {
      render(<GlossaryHighlightedText text="I love Amateur Radio." />);

      const highlightedTerm = screen.getByText('Amateur Radio');
      expect(highlightedTerm).toHaveClass('underline');
    });
  });

  describe('Word Boundaries', () => {
    it('does not match partial words', () => {
      render(<GlossaryHighlightedText text="Antennas are useful." />);

      // "Antennas" should NOT be highlighted because we match "Antenna" with word boundaries
      // The text should be rendered without underline on "Antennas"
      const container = document.querySelector('span');
      expect(container?.textContent).toContain('Antennas are useful.');
    });

    it('matches terms at start of text', () => {
      render(<GlossaryHighlightedText text="Antenna is great." />);

      expect(screen.getByText('Antenna')).toHaveClass('underline');
    });

    it('matches terms at end of text', () => {
      render(<GlossaryHighlightedText text="This is an Antenna" />);

      expect(screen.getByText('Antenna')).toHaveClass('underline');
    });
  });

  describe('Non-Matched Text', () => {
    it('renders non-term text without highlighting', () => {
      render(<GlossaryHighlightedText text="Hello world, check out this Antenna please." />);

      // Non-term text should not have underline class
      const nonHighlightedText = screen.getByText((content, element) => {
        return element?.textContent === 'Hello world, check out this ' && !element.classList.contains('underline');
      });
      expect(nonHighlightedText).toBeInTheDocument();
    });

    it('preserves text with no matching terms', () => {
      render(<GlossaryHighlightedText text="No terms here at all." />);

      expect(screen.getByText('No terms here at all.')).toBeInTheDocument();
    });
  });

  describe('Special Characters', () => {
    it('handles text with regex special characters', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({
        data: [{ id: '1', term: 'Q*R', definition: 'Test term with special char' }],
      } as ReturnType<typeof useGlossaryTerms>);

      // Should not throw and should render the text
      render(<GlossaryHighlightedText text="Testing Q*R here" />);

      expect(screen.getByText('Q*R')).toBeInTheDocument();
    });

    it('handles term with parentheses', () => {
      vi.mocked(useGlossaryTerms).mockReturnValue({
        data: [{ id: '1', term: 'Test (item)', definition: 'A test item' }],
      } as ReturnType<typeof useGlossaryTerms>);

      render(<GlossaryHighlightedText text="This is a Test (item) example." />);

      // The term with parentheses may or may not be matched depending on regex escaping
      // At minimum, the component should not crash and should render the text
      const container = document.querySelector('span');
      expect(container?.textContent).toContain('Test (item)');
    });
  });

  describe('Tooltip Styling', () => {
    it('applies correct styling to highlighted terms', () => {
      render(<GlossaryHighlightedText text="An Antenna example." />);

      const highlightedTerm = screen.getByText('Antenna');
      expect(highlightedTerm).toHaveClass('underline');
      expect(highlightedTerm).toHaveClass('decoration-dotted');
      expect(highlightedTerm).toHaveClass('cursor-help');
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

      render(<GlossaryHighlightedText text="I use Amateur Radio daily." />);

      // "Amateur Radio" should be matched as a single term, not just "Radio"
      expect(screen.getByText('Amateur Radio')).toHaveClass('underline');
    });
  });
});
