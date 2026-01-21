import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardNotifications } from './useDashboardNotifications';

// Mock dependent hooks
const mockUseDailyStreak = vi.fn();
const mockUseReadinessScore = vi.fn();
const mockUseReadinessSnapshots = vi.fn();
const mockUsePushNotifications = vi.fn();
const mockGetLocalDateString = vi.fn();

vi.mock('@/hooks/useDailyStreak', () => ({
  useDailyStreak: () => mockUseDailyStreak(),
}));

vi.mock('@/hooks/useReadinessScore', () => ({
  useReadinessScore: () => mockUseReadinessScore(),
}));

vi.mock('@/hooks/useReadinessSnapshots', () => ({
  useReadinessSnapshots: () => mockUseReadinessSnapshots(),
  calculateTrend: vi.fn(() => 'stable'),
}));

vi.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: () => mockUsePushNotifications(),
}));

vi.mock('@/lib/streakConstants', () => ({
  getLocalDateString: () => mockGetLocalDateString(),
}));

// Mock localStorage
let mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    mockStorage = {};
  }),
  length: 0,
  key: vi.fn(),
};

// Default props
const defaultOptions = {
  examType: 'technician' as const,
  userId: 'user-123',
  thisWeekQuestions: 30,
  questionsGoal: 50,
  userTarget: null,
  onNavigate: vi.fn(),
  maxVisible: 1,
};

// Default hook return values
const defaultStreakData = {
  lastActivityDate: '2026-01-21',
  isLoading: false,
};

const defaultReadinessData = {
  data: {
    readiness_score: 70,
    last_study_at: '2026-01-21',
  },
  isLoading: false,
};

const defaultSnapshotsData = {
  data: [],
  isLoading: false,
};

const defaultPushData = {
  permission: 'default' as NotificationPermission,
  isSupported: true,
  hasAskedPermission: false,
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
};

describe('useDashboardNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    mockGetLocalDateString.mockReturnValue('2026-01-21');

    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Set default mock return values
    mockUseDailyStreak.mockReturnValue(defaultStreakData);
    mockUseReadinessScore.mockReturnValue(defaultReadinessData);
    mockUseReadinessSnapshots.mockReturnValue(defaultSnapshotsData);
    mockUsePushNotifications.mockReturnValue(defaultPushData);

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('returns isLoading true when streak is loading', () => {
      mockUseDailyStreak.mockReturnValue({ ...defaultStreakData, isLoading: true });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading true when readiness is loading', () => {
      mockUseReadinessScore.mockReturnValue({ ...defaultReadinessData, isLoading: true });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading true when snapshots are loading', () => {
      mockUseReadinessSnapshots.mockReturnValue({ ...defaultSnapshotsData, isLoading: true });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading false when all data is loaded', () => {
      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Exam Urgent Notification', () => {
    it('shows exam urgent when exam is in 7 days and readiness < 75%', () => {
      const options = {
        ...defaultOptions,
        userTarget: {
          id: 'target-1',
          user_id: 'user-123',
          exam_session_id: null,
          custom_exam_date: '2026-01-28', // 7 days from now
          created_at: '2026-01-01',
          exam_session: null,
        },
      };

      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 70, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(options));

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('exam-urgent');
      expect(result.current.notifications[0].priority).toBe(1);
    });

    it('does not show exam urgent when readiness >= 75%', () => {
      const options = {
        ...defaultOptions,
        userTarget: {
          id: 'target-1',
          user_id: 'user-123',
          exam_session_id: null,
          custom_exam_date: '2026-01-28',
          created_at: '2026-01-01',
          exam_session: null,
        },
      };

      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 80, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(options));

      const examUrgent = result.current.notifications.find((n) => n.type === 'exam-urgent');
      expect(examUrgent).toBeUndefined();
    });

    it('does not show exam urgent when exam is more than 7 days away', () => {
      const options = {
        ...defaultOptions,
        userTarget: {
          id: 'target-1',
          user_id: 'user-123',
          exam_session_id: null,
          custom_exam_date: '2026-02-01', // 11 days from now
          created_at: '2026-01-01',
          exam_session: null,
        },
      };

      const { result } = renderHook(() => useDashboardNotifications(options));

      const examUrgent = result.current.notifications.find((n) => n.type === 'exam-urgent');
      expect(examUrgent).toBeUndefined();
    });

    it('does not show exam urgent when no target exam', () => {
      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const examUrgent = result.current.notifications.find((n) => n.type === 'exam-urgent');
      expect(examUrgent).toBeUndefined();
    });
  });

  describe('Inactivity Notification', () => {
    it('shows inactivity when last study was 3+ days ago', () => {
      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 70, last_study_at: '2026-01-18' }, // 3+ days ago
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const inactivity = result.current.notifications.find((n) => n.type === 'inactivity');
      expect(inactivity).toBeDefined();
      // The exact day count may vary depending on time zone, just verify it shows inactivity
      expect(inactivity?.title).toMatch(/haven't studied in \d+ days/);
    });

    it('does not show inactivity when last study was less than 3 days ago', () => {
      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 70, last_study_at: '2026-01-20' }, // 1 day ago
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const inactivity = result.current.notifications.find((n) => n.type === 'inactivity');
      expect(inactivity).toBeUndefined();
    });
  });

  describe('Weekly Goal Close Notification', () => {
    it('shows weekly goal close when 80-99% complete', () => {
      const options = {
        ...defaultOptions,
        thisWeekQuestions: 40,
        questionsGoal: 50, // 80% complete
      };

      const { result } = renderHook(() => useDashboardNotifications(options));

      const weeklyGoal = result.current.notifications.find((n) => n.type === 'weekly-goal-close');
      expect(weeklyGoal).toBeDefined();
      expect(weeklyGoal?.title).toContain('80%');
    });

    it('does not show weekly goal close when less than 80% complete', () => {
      const options = {
        ...defaultOptions,
        thisWeekQuestions: 35,
        questionsGoal: 50, // 70% complete
      };

      const { result } = renderHook(() => useDashboardNotifications(options));

      const weeklyGoal = result.current.notifications.find((n) => n.type === 'weekly-goal-close');
      expect(weeklyGoal).toBeUndefined();
    });

    it('does not show weekly goal close when 100% complete', () => {
      const options = {
        ...defaultOptions,
        thisWeekQuestions: 50,
        questionsGoal: 50, // 100% complete
      };

      const { result } = renderHook(() => useDashboardNotifications(options));

      const weeklyGoal = result.current.notifications.find((n) => n.type === 'weekly-goal-close');
      expect(weeklyGoal).toBeUndefined();
    });
  });

  describe('Readiness Milestone Notification', () => {
    it('shows milestone notification at 70% readiness', () => {
      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 70, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const milestone = result.current.notifications.find((n) => n.type === 'readiness-milestone');
      expect(milestone).toBeDefined();
      expect(milestone?.id).toBe('readiness-milestone-70');
    });

    it('shows 80% milestone when readiness is 80-89%', () => {
      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 85, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const milestone = result.current.notifications.find((n) => n.type === 'readiness-milestone');
      expect(milestone).toBeDefined();
      expect(milestone?.id).toBe('readiness-milestone-80');
    });

    it('shows 90% milestone when readiness is 90+', () => {
      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 92, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const milestone = result.current.notifications.find((n) => n.type === 'readiness-milestone');
      expect(milestone).toBeDefined();
      expect(milestone?.id).toBe('readiness-milestone-90');
    });

    it('does not show milestone when below 70%', () => {
      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 65, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const milestone = result.current.notifications.find((n) => n.type === 'readiness-milestone');
      expect(milestone).toBeUndefined();
    });
  });

  describe('Dismissal', () => {
    it('dismissNotification saves to localStorage for dismissible notifications', () => {
      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      act(() => {
        result.current.dismissNotification('exam-urgent');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'notification-dismissed-exam-urgent-2026-01-21',
        'true'
      );
    });

    it('dismissNotification handles milestone notifications', () => {
      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      act(() => {
        result.current.dismissNotification('readiness-milestone-80');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'notification-dismissed-readiness-milestone-80',
        'true'
      );
    });

    it('dismissed notifications do not show again', () => {
      mockStorage['notification-dismissed-readiness-milestone-70'] = 'true';

      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 70, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      const milestone = result.current.notifications.find((n) => n.type === 'readiness-milestone');
      expect(milestone).toBeUndefined();
    });
  });

  describe('Priority and Limiting', () => {
    it('returns notifications sorted by priority', () => {
      const options = {
        ...defaultOptions,
        thisWeekQuestions: 40,
        questionsGoal: 50,
        maxVisible: 5,
        userTarget: {
          id: 'target-1',
          user_id: 'user-123',
          exam_session_id: null,
          custom_exam_date: '2026-01-25', // 4 days away
          created_at: '2026-01-01',
          exam_session: null,
        },
      };

      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 72, last_study_at: '2026-01-18' }, // 3 days inactive
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(options));

      // Should be sorted by priority
      const priorities = result.current.notifications.map((n) => n.priority);
      expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
    });

    it('limits notifications to maxVisible', () => {
      const options = {
        ...defaultOptions,
        thisWeekQuestions: 40,
        questionsGoal: 50,
        maxVisible: 1,
      };

      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 72, last_study_at: '2026-01-18' },
        isLoading: false,
      });

      const { result } = renderHook(() => useDashboardNotifications(options));

      expect(result.current.notifications.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Cross-tab Sync', () => {
    it('listens for storage events', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useDashboardNotifications(defaultOptions));

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('cleans up storage listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useDashboardNotifications(defaultOptions));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });

  describe('Push Notification Integration', () => {
    it('exposes push notification state', () => {
      mockUsePushNotifications.mockReturnValue({
        ...defaultPushData,
        permission: 'granted',
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      expect(result.current.push.permission).toBe('granted');
      expect(result.current.push.isSupported).toBe(true);
    });

    it('does not send push when tab is visible', () => {
      mockUsePushNotifications.mockReturnValue({
        ...defaultPushData,
        permission: 'granted',
        sendNotification: vi.fn(),
      });

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      const options = {
        ...defaultOptions,
        userTarget: {
          id: 'target-1',
          user_id: 'user-123',
          exam_session_id: null,
          custom_exam_date: '2026-01-25',
          created_at: '2026-01-01',
          exam_session: null,
        },
      };

      mockUseReadinessScore.mockReturnValue({
        data: { readiness_score: 70, last_study_at: '2026-01-21' },
        isLoading: false,
      });

      renderHook(() => useDashboardNotifications(options));

      expect(mockUsePushNotifications().sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('localStorage Error Handling', () => {
    it('handles localStorage errors gracefully in isDismissed', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => {
        renderHook(() => useDashboardNotifications(defaultOptions));
      }).not.toThrow();
    });

    it('handles localStorage errors gracefully in dismissNotification', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useDashboardNotifications(defaultOptions));

      // Should not throw
      expect(() => {
        act(() => {
          result.current.dismissNotification('exam-urgent');
        });
      }).not.toThrow();
    });
  });
});
