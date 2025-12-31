import { useMemo } from 'react';
import type { ReadinessLevel } from '@/lib/readinessConfig';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface UseMotivationalMessageOptions {
  readinessLevel: ReadinessLevel;
  weakQuestionCount: number;
  totalTests: number;
}

/**
 * Get a motivational message based on time of day and user progress.
 */
export function useMotivationalMessage({
  readinessLevel,
  weakQuestionCount,
  totalTests,
}: UseMotivationalMessageOptions): string {
  return useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay: TimeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    // Progress-based messages
    if (readinessLevel === 'ready') {
      const readyMessages = [
        "You've put in the work. Time to get that license!",
        "Your practice has paid off. You're exam ready!",
        'Confidence earned through preparation. Go get it!',
      ];
      return readyMessages[Math.floor(Math.random() * readyMessages.length)];
    }

    if (readinessLevel === 'getting-close') {
      const closeMessages = [
        "Almost there! A few more sessions and you'll be ready.",
        'Great progress! Keep pushing through the finish line.',
        "You're in the home stretch. Stay focused!",
      ];
      return closeMessages[Math.floor(Math.random() * closeMessages.length)];
    }

    if (weakQuestionCount > 10) {
      return 'Focus on your weak areas today. Small improvements add up!';
    }

    if (totalTests === 0) {
      const newUserMessages: Record<TimeOfDay, string> = {
        morning: 'Good morning! Ready to start your ham radio journey?',
        afternoon: 'Great time to begin studying. Take your first practice test!',
        evening: "Evening study sessions can be very effective. Let's go!",
        night: "Night owl studying? Let's make some progress!",
      };
      return newUserMessages[timeOfDay];
    }

    // Time-based encouragement for regular users
    const timeMessages: Record<TimeOfDay, string[]> = {
      morning: [
        'Morning studies stick best. Great time to learn!',
        'Early bird catches the license! Let\'s study.',
        'Fresh mind, fresh start. Ready to practice?',
      ],
      afternoon: [
        'Afternoon study break? Perfect timing!',
        'Keep the momentum going this afternoon.',
        'A little progress each day leads to big results.',
      ],
      evening: [
        'Wind down with some practice questions.',
        "Evening review helps lock in what you've learned.",
        'Consistent evening practice builds lasting knowledge.',
      ],
      night: [
        'Late night study session? Your dedication is inspiring!',
        'Burning the midnight oil? Every bit of practice counts.',
        'Night study can be peaceful and productive.',
      ],
    };

    const messages = timeMessages[timeOfDay];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [readinessLevel, weakQuestionCount, totalTests]);
}
