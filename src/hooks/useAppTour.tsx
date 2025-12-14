import { useEffect, useMemo, useCallback } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface UseAppTourOptions {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function useAppTour({ onComplete, onCancel }: UseAppTourOptions = {}) {
  const tour = useMemo(() => {
    const tourInstance = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true,
        },
      },
    });

    // Step 1: Dashboard overview - centered modal, no attachment
    tourInstance.addStep({
      id: 'dashboard',
      title: 'Your Dashboard',
      text: 'This is your home base. Here you can see your test readiness, weekly goals, key stats, and track your progress towards passing the exam.',
      buttons: [
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 2: License selector
    tourInstance.addStep({
      id: 'license-selector',
      title: 'License Selector',
      text: 'Studying for a different license? Click here to switch between Technician, General, and Extra at any time.',
      attachTo: {
        element: '[data-tour="license-selector"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 3: Practice Test
    tourInstance.addStep({
      id: 'practice-test',
      title: 'Practice Tests',
      text: 'Take full-length practice exams just like the real test. Track your progress and see if you\'re ready to pass!',
      attachTo: {
        element: '[data-tour="practice-test"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 4: Random Practice
    tourInstance.addStep({
      id: 'random-practice',
      title: 'Random Practice',
      text: 'Quick study sessions with random questions. Perfect for daily practice and building streaks!',
      attachTo: {
        element: '[data-tour="random-practice"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 5: Study by Topic
    tourInstance.addStep({
      id: 'study-by-topic',
      title: 'Study by Topic',
      text: 'Focus on specific subelements to master each section of the exam. Great for targeted learning!',
      attachTo: {
        element: '[data-tour="subelement-practice"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 6: Weak Areas
    tourInstance.addStep({
      id: 'weak-areas',
      title: 'Weak Areas',
      text: 'We track which questions you miss most often. Review them here to turn weaknesses into strengths!',
      attachTo: {
        element: '[data-tour="weak-questions"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 7: Glossary
    tourInstance.addStep({
      id: 'glossary',
      title: 'Glossary & Flashcards',
      text: 'Learn key terms and definitions with our glossary. Use flashcards for effective memorization!',
      attachTo: {
        element: '[data-tour="glossary"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 8: Find Test Site
    tourInstance.addStep({
      id: 'find-test-site',
      title: 'Find a Test Site',
      text: 'Ready to take the real exam? Find testing sessions near you and set your target exam date!',
      attachTo: {
        element: '[data-tour="find-test-site"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 9: Forum / Community
    tourInstance.addStep({
      id: 'forum',
      title: 'Join Our Community',
      text: 'Have questions? Want to share tips? Join our forum to connect with other ham radio enthusiasts, get help, and share your knowledge!',
      attachTo: {
        element: '[data-tour="forum"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: tourInstance.back,
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: tourInstance.next,
        },
      ],
    });

    // Step 10: Encouraging completion message
    tourInstance.addStep({
      id: 'complete',
      title: "You're All Set! 🎉",
      text: `
        <div style="text-align: center;">
          <p style="font-size: 1.1em; margin-bottom: 12px;">
            You're ready to start your journey to becoming a licensed amateur radio operator!
          </p>
          <p style="color: var(--muted-foreground); margin-bottom: 8px;">
            Remember: Consistent practice is the key to success.
          </p>
          <p style="color: var(--muted-foreground);">
            We recommend starting with a practice test to see where you stand, then focus on your weak areas.
          </p>
          <p style="margin-top: 16px; font-weight: 600; color: var(--primary);">
            73 and good luck! 📻
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Get Started!',
          classes: 'shepherd-button-primary',
          action: tourInstance.complete,
        },
      ],
    });

    return tourInstance;
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (onComplete) {
      tour.on('complete', onComplete);
    }
    if (onCancel) {
      tour.on('cancel', onCancel);
    }

    return () => {
      if (onComplete) {
        tour.off('complete', onComplete);
      }
      if (onCancel) {
        tour.off('cancel', onCancel);
      }
    };
  }, [tour, onComplete, onCancel]);

  const startTour = useCallback(() => {
    // Small delay to ensure elements are rendered
    setTimeout(() => {
      tour.start();
    }, 300);
  }, [tour]);

  const cancelTour = useCallback(() => {
    tour.cancel();
  }, [tour]);

  return {
    tour,
    startTour,
    cancelTour,
  };
}
