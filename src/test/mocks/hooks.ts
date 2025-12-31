import { vi } from 'vitest';

/**
 * Factory for creating useAuth mock with customizable user state.
 * Usage: vi.mocked(useAuth).mockReturnValue(createAuthMock({ user: mockUser }));
 */
export function createAuthMock(overrides: {
  user?: { id: string; email: string } | null;
  loading?: boolean;
  signIn?: ReturnType<typeof vi.fn>;
  signOut?: ReturnType<typeof vi.fn>;
  signUp?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    user: overrides.user ?? null,
    loading: overrides.loading ?? false,
    signIn: overrides.signIn ?? vi.fn().mockResolvedValue({ error: null }),
    signOut: overrides.signOut ?? vi.fn().mockResolvedValue(undefined),
    signUp: overrides.signUp ?? vi.fn().mockResolvedValue({ error: null }),
  };
}

/**
 * Factory for creating useBookmarks mock.
 */
export function createBookmarksMock(overrides: {
  bookmarks?: Array<{ question_id: string; notes?: string }>;
  isBookmarked?: (id: string) => boolean;
  addBookmark?: ReturnType<typeof vi.fn>;
  removeBookmark?: ReturnType<typeof vi.fn>;
  updateBookmarkNotes?: ReturnType<typeof vi.fn>;
  isLoading?: boolean;
} = {}) {
  return {
    bookmarks: overrides.bookmarks ?? [],
    isBookmarked: overrides.isBookmarked ?? vi.fn(() => false),
    addBookmark: overrides.addBookmark ?? vi.fn().mockResolvedValue(undefined),
    removeBookmark: overrides.removeBookmark ?? vi.fn().mockResolvedValue(undefined),
    updateBookmarkNotes: overrides.updateBookmarkNotes ?? vi.fn().mockResolvedValue(undefined),
    isLoading: overrides.isLoading ?? false,
  };
}

/**
 * Factory for creating useProgress mock.
 */
export function createProgressMock(overrides: {
  saveTestResult?: ReturnType<typeof vi.fn>;
  saveRandomAttempt?: ReturnType<typeof vi.fn>;
  saveSubelementAttempt?: ReturnType<typeof vi.fn>;
  saveWeakQuestionAttempt?: ReturnType<typeof vi.fn>;
  isLoading?: boolean;
} = {}) {
  return {
    saveTestResult: overrides.saveTestResult ?? vi.fn().mockResolvedValue({ id: 'test-result-1' }),
    saveRandomAttempt: overrides.saveRandomAttempt ?? vi.fn().mockResolvedValue(undefined),
    saveSubelementAttempt: overrides.saveSubelementAttempt ?? vi.fn().mockResolvedValue(undefined),
    saveWeakQuestionAttempt: overrides.saveWeakQuestionAttempt ?? vi.fn().mockResolvedValue(undefined),
    isLoading: overrides.isLoading ?? false,
  };
}

/**
 * Factory for creating useQuestions mock.
 */
export function createQuestionsMock(overrides: {
  data?: Array<{
    id: string;
    displayName: string;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    subelement: string;
    group: string;
    links?: Array<{ url: string; title: string; type: string }>;
    explanation?: string;
  }>;
  isLoading?: boolean;
  error?: Error | null;
} = {}) {
  return {
    data: overrides.data ?? [],
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
  };
}

/**
 * Factory for creating useAdmin mock.
 */
export function createAdminMock(overrides: {
  isAdmin?: boolean;
  isLoading?: boolean;
} = {}) {
  return {
    isAdmin: overrides.isAdmin ?? false,
    isLoading: overrides.isLoading ?? false,
  };
}

/**
 * Factory for creating useAppNavigation mock.
 */
export function createAppNavigationMock(overrides: {
  currentView?: string;
  setCurrentView?: ReturnType<typeof vi.fn>;
  reviewingTestId?: string | null;
  setReviewingTestId?: ReturnType<typeof vi.fn>;
  selectedTopicSlug?: string | null;
  navigateToTopics?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    currentView: overrides.currentView ?? 'dashboard',
    setCurrentView: overrides.setCurrentView ?? vi.fn(),
    reviewingTestId: overrides.reviewingTestId ?? null,
    setReviewingTestId: overrides.setReviewingTestId ?? vi.fn(),
    selectedTopicSlug: overrides.selectedTopicSlug ?? null,
    navigateToTopics: overrides.navigateToTopics ?? vi.fn(),
  };
}

// Common mock user for tests
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

// Common mock admin user for tests
export const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
};
