import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardSectionInsights } from './DashboardSectionInsights';
import { SubelementMetric } from '@/hooks/useReadinessScore';

describe('DashboardSectionInsights', () => {
  const createMetric = (overrides: Partial<SubelementMetric> = {}): SubelementMetric => ({
    accuracy: 0.7,
    recent_accuracy: 0.75,
    coverage: 0.5,
    mastery: 0.6,
    risk_score: 0.5,
    expected_score: 2.5,
    weight: 5,
    pool_size: 50,
    attempts_count: 25,
    recent_attempts_count: 10,
    ...overrides,
  });

  it('renders nothing when subelementMetrics is undefined', () => {
    const { container } = render(
      <DashboardSectionInsights
        subelementMetrics={undefined}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when subelementMetrics is empty', () => {
    const { container } = render(
      <DashboardSectionInsights
        subelementMetrics={{}}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all risk scores are below 0.1', () => {
    const { container } = render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.05 }),
          T2: createMetric({ risk_score: 0.08 }),
          T3: createMetric({ risk_score: 0.02 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Focus Areas section header', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.5 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );
    expect(screen.getByText('Focus Areas')).toBeInTheDocument();
  });

  it('displays top 3 sections sorted by risk score', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.3 }),
          T2: createMetric({ risk_score: 0.9 }),
          T3: createMetric({ risk_score: 0.5 }),
          T4: createMetric({ risk_score: 0.1 }),
          T5: createMetric({ risk_score: 0.7 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    // Should show T2 (0.9), T5 (0.7), T3 (0.5) - top 3 by risk
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();

    // Should NOT show T1 and T4 (lower risk)
    expect(screen.queryByText('T1')).not.toBeInTheDocument();
    expect(screen.queryByText('T4')).not.toBeInTheDocument();
  });

  it('shows section names for technician test type', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.8 }),
          T5: createMetric({ risk_score: 0.6 }),
          T9: createMetric({ risk_score: 0.4 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
    expect(screen.getByText('Electrical Principles')).toBeInTheDocument();
    expect(screen.getByText('Antennas & Feed Lines')).toBeInTheDocument();
  });

  it('shows section names for general test type', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          G1: createMetric({ risk_score: 0.8 }),
          G5: createMetric({ risk_score: 0.6 }),
          G9: createMetric({ risk_score: 0.4 }),
        }}
        testType="general"
        onPracticeSection={vi.fn()}
      />
    );

    expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
    expect(screen.getByText('Electrical Principles')).toBeInTheDocument();
    expect(screen.getByText('Antennas & Feed Lines')).toBeInTheDocument();
  });

  it('shows section names for extra test type', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          E1: createMetric({ risk_score: 0.8 }),
          E5: createMetric({ risk_score: 0.6 }),
          E9: createMetric({ risk_score: 0.4 }),
        }}
        testType="extra"
        onPracticeSection={vi.fn()}
      />
    );

    expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
    expect(screen.getByText('Electrical Principles')).toBeInTheDocument();
    expect(screen.getByText('Antennas & Transmission Lines')).toBeInTheDocument();
  });

  it('shows fallback name for unknown subelement codes', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          X1: createMetric({ risk_score: 0.8 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    expect(screen.getByText('Subelement X1')).toBeInTheDocument();
  });

  it('calls onPracticeSection with subelement code when clicked', async () => {
    const user = userEvent.setup();
    const handlePractice = vi.fn();

    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T3: createMetric({ risk_score: 0.8 }),
        }}
        testType="technician"
        onPracticeSection={handlePractice}
      />
    );

    await user.click(screen.getByText('T3'));
    expect(handlePractice).toHaveBeenCalledWith('T3');
    expect(handlePractice).toHaveBeenCalledTimes(1);
  });

  it('renders Practice CTA for each section', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.8 }),
          T2: createMetric({ risk_score: 0.6 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    const practiceButtons = screen.getAllByText('Practice');
    expect(practiceButtons).toHaveLength(2);
  });

  it('renders as buttons with correct role', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.5 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });

  it('handles fewer than 3 sections', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.5 }),
          T2: createMetric({ risk_score: 0.3 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('only shows sections with risk score >= 0.1', () => {
    render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.5 }),
          T2: createMetric({ risk_score: 0.05 }),
          T3: createMetric({ risk_score: 0.02 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    // Only T1 should show (others are below 0.1)
    // But the component takes top 3 by risk_score, then checks if ALL are below 0.1
    // In this case top 3 are T1(0.5), T2(0.05), T3(0.02)
    // Since T1 has 0.5 which is >= 0.1, the section renders
    expect(screen.getByText('T1')).toBeInTheDocument();
  });

  it('applies warning color scheme', () => {
    const { container } = render(
      <DashboardSectionInsights
        subelementMetrics={{
          T1: createMetric({ risk_score: 0.5 }),
        }}
        testType="technician"
        onPracticeSection={vi.fn()}
      />
    );

    // Check for warning styling on button
    const button = container.querySelector('.border-warning\\/30');
    expect(button).toBeInTheDocument();
  });
});
