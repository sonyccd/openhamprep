import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuestionRedirect from './QuestionRedirect';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderQuestionRedirect = (path: string) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/q/:id" element={<QuestionRedirect />} />
        <Route path="/questions/:id" element={<div data-testid="question-page">Question Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('QuestionRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects /q/:id to /questions/:id', async () => {
    renderQuestionRedirect('/q/t1a01');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/questions/t1a01', { replace: true });
    });
  });

  it('preserves question ID case', async () => {
    renderQuestionRedirect('/q/T1A01');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/questions/T1A01', { replace: true });
    });
  });

  it('handles General license question IDs', async () => {
    renderQuestionRedirect('/q/g2b03');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/questions/g2b03', { replace: true });
    });
  });

  it('handles Extra license question IDs', async () => {
    renderQuestionRedirect('/q/E3C12');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/questions/E3C12', { replace: true });
    });
  });

  it('uses replace option to avoid adding /q/:id to browser history', async () => {
    renderQuestionRedirect('/q/t1a01');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ replace: true })
      );
    });
  });

  it('renders nothing while redirecting', () => {
    const { container } = renderQuestionRedirect('/q/t1a01');

    // The component returns null, so container should only have the router wrapper
    expect(container.firstChild).toBeNull();
  });

  it('navigates only once per mount', async () => {
    renderQuestionRedirect('/q/t1a01');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
