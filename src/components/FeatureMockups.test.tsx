import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RandomPracticeMockup,
  PracticeTestMockup,
  StudyByTopicsMockup,
  WeakQuestionsMockup,
  FindExamSessionsMockup,
  BookmarksMockup,
  GlossaryMockup,
} from './FeatureMockups';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('FeatureMockups', () => {
  describe('RandomPracticeMockup', () => {
    it('renders question with answer options', () => {
      render(<RandomPracticeMockup />);
      
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText(/Part 97/)).toBeInTheDocument();
      expect(screen.getByText('Streak: 7')).toBeInTheDocument();
    });
  });

  describe('PracticeTestMockup', () => {
    it('renders progress bar and question info', () => {
      render(<PracticeTestMockup />);
      
      expect(screen.getByText('Practice Test')).toBeInTheDocument();
      expect(screen.getByText('Question 21 of 35')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  describe('StudyByTopicsMockup', () => {
    it('renders topic list with progress bars', () => {
      render(<StudyByTopicsMockup />);
      
      expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
      expect(screen.getByText('Station Operation')).toBeInTheDocument();
      expect(screen.getByText('Radio Wave')).toBeInTheDocument();
    });
  });

  describe('WeakQuestionsMockup', () => {
    it('renders weak questions list', () => {
      render(<WeakQuestionsMockup />);
      
      expect(screen.getByText('Weak Questions')).toBeInTheDocument();
      expect(screen.getByText('12 to review')).toBeInTheDocument();
      expect(screen.getByText('T5C06')).toBeInTheDocument();
      expect(screen.getByText('Start Review Session')).toBeInTheDocument();
    });
  });

  describe('FindExamSessionsMockup', () => {
    it('renders map preview with markers and session list', () => {
      render(<FindExamSessionsMockup />);
      
      expect(screen.getByText('Find Exam Sessions')).toBeInTheDocument();
      expect(screen.getByText('Near 27601')).toBeInTheDocument();
      expect(screen.getByText('Raleigh Community Center')).toBeInTheDocument();
      expect(screen.getByText('Durham Public Library')).toBeInTheDocument();
      expect(screen.getByText('Set Target Date')).toBeInTheDocument();
    });

    it('shows walk-ins badge for eligible sessions', () => {
      render(<FindExamSessionsMockup />);
      
      expect(screen.getByText('Walk-ins')).toBeInTheDocument();
    });
  });

  describe('BookmarksMockup', () => {
    it('renders bookmarked questions with notes', () => {
      render(<BookmarksMockup />);
      
      expect(screen.getByText('Saved Questions')).toBeInTheDocument();
      expect(screen.getByText('T1B03')).toBeInTheDocument();
      expect(screen.getByText('"Review antenna regulations"')).toBeInTheDocument();
    });
  });

  describe('GlossaryMockup', () => {
    it('renders flashcard with term', () => {
      render(<GlossaryMockup />);
      
      expect(screen.getByText('Flashcard Mode')).toBeInTheDocument();
      expect(screen.getByText('SWR')).toBeInTheDocument();
      expect(screen.getByText('Need Practice')).toBeInTheDocument();
      expect(screen.getByText('Got It!')).toBeInTheDocument();
    });
  });
});
