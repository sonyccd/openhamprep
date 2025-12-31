import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTargetExam } from './DashboardTargetExam';

describe('DashboardTargetExam', () => {
  const mockExamSession = {
    location_name: 'Community Center',
    title: 'Amateur Radio Exam',
    exam_date: '2024-02-15T09:00:00Z',
    city: 'Raleigh',
    state: 'NC',
  };

  const defaultProps = {
    userTarget: { exam_session: mockExamSession },
    onFindTestSite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('With Target Exam', () => {
    it('displays the location name', () => {
      render(<DashboardTargetExam {...defaultProps} />);
      expect(screen.getByText('Community Center')).toBeInTheDocument();
    });

    it('displays the exam date formatted', () => {
      render(<DashboardTargetExam {...defaultProps} />);
      // Date format: weekday, month day, year
      expect(screen.getByText(/Thursday, February 15, 2024/)).toBeInTheDocument();
    });

    it('displays city and state', () => {
      render(<DashboardTargetExam {...defaultProps} />);
      expect(screen.getByText(/Raleigh, NC/)).toBeInTheDocument();
    });

    it('shows Change button', () => {
      render(<DashboardTargetExam {...defaultProps} />);
      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    });

    it('calls onFindTestSite when Change is clicked', () => {
      render(<DashboardTargetExam {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /change/i }));
      expect(defaultProps.onFindTestSite).toHaveBeenCalledTimes(1);
    });

    it('uses title as fallback when location_name is missing', () => {
      render(
        <DashboardTargetExam
          userTarget={{
            exam_session: { ...mockExamSession, location_name: undefined },
          }}
          onFindTestSite={vi.fn()}
        />
      );
      expect(screen.getByText('Amateur Radio Exam')).toBeInTheDocument();
    });

    it('uses default text when both location_name and title are missing', () => {
      render(
        <DashboardTargetExam
          userTarget={{
            exam_session: {
              ...mockExamSession,
              location_name: undefined,
              title: undefined,
            },
          }}
          onFindTestSite={vi.fn()}
        />
      );
      expect(screen.getByText('Exam Session')).toBeInTheDocument();
    });
  });

  describe('Without Target Exam', () => {
    it('shows no exam selected message', () => {
      render(<DashboardTargetExam userTarget={null} onFindTestSite={vi.fn()} />);
      expect(screen.getByText('No exam date selected')).toBeInTheDocument();
    });

    it('shows find test site prompt', () => {
      render(<DashboardTargetExam userTarget={null} onFindTestSite={vi.fn()} />);
      expect(screen.getByText('Find a test session near you')).toBeInTheDocument();
    });

    it('shows Find Test Site button', () => {
      render(<DashboardTargetExam userTarget={null} onFindTestSite={vi.fn()} />);
      expect(screen.getByRole('button', { name: /find test site/i })).toBeInTheDocument();
    });

    it('calls onFindTestSite when Find Test Site is clicked', () => {
      const onFindTestSite = vi.fn();
      render(<DashboardTargetExam userTarget={null} onFindTestSite={onFindTestSite} />);
      fireEvent.click(screen.getByRole('button', { name: /find test site/i }));
      expect(onFindTestSite).toHaveBeenCalledTimes(1);
    });
  });

  describe('With Empty Exam Session', () => {
    it('shows no exam message when exam_session is null', () => {
      render(
        <DashboardTargetExam
          userTarget={{ exam_session: null }}
          onFindTestSite={vi.fn()}
        />
      );
      expect(screen.getByText('No exam date selected')).toBeInTheDocument();
    });

    it('shows no exam message when userTarget is undefined', () => {
      render(<DashboardTargetExam userTarget={undefined} onFindTestSite={vi.fn()} />);
      expect(screen.getByText('No exam date selected')).toBeInTheDocument();
    });
  });
});
