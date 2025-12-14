import { useEffect, useMemo, useCallback, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface UseAppTourOptions {
  onComplete?: () => void;
  onCancel?: () => void;
  onOpenMobileMenu?: () => void;
  onCloseMobileMenu?: () => void;
}

// Check if we're on mobile (matches Tailwind's md breakpoint)
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

export function useAppTour({ onComplete, onCancel, onOpenMobileMenu, onCloseMobileMenu }: UseAppTourOptions = {}) {
  // Use refs to always have access to the latest callback functions
  // This prevents stale closure issues when the tour emits events
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  const onOpenMobileMenuRef = useRef(onOpenMobileMenu);
  const onCloseMobileMenuRef = useRef(onCloseMobileMenu);

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    onOpenMobileMenuRef.current = onOpenMobileMenu;
  }, [onOpenMobileMenu]);

  useEffect(() => {
    onCloseMobileMenuRef.current = onCloseMobileMenu;
  }, [onCloseMobileMenu]);

  const tour = useMemo(() => {
    const mobile = isMobile();

    const tourInstance = new Shepherd.Tour({
      // On mobile, disable modal overlay since we show centered modals
      // On desktop, use overlay to focus attention on attached elements
      useModalOverlay: !mobile,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true,
        },
        // Help with positioning in complex layouts
        popperOptions: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 12],
              },
            },
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                padding: 16,
              },
            },
          ],
        },
      },
    });

    // Helper to create step config
    const createStep = (
      id: string,
      title: string,
      text: string,
      selector: string,
      isFirst = false,
      isLast = false
    ) => {
      const buttons: Array<{ text: string; classes: string; action: () => void }> = [];

      if (!isFirst) {
        buttons.push({
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action: () => { tourInstance.back(); },
        });
      }

      buttons.push({
        text: isLast ? 'Get Started!' : 'Next',
        classes: 'shepherd-button-primary',
        action: () => {
          if (isLast) {
            tourInstance.complete();
          } else {
            tourInstance.next();
          }
        },
      });

      return {
        id,
        title,
        text,
        // On desktop, attach to elements. On mobile, show centered modals
        ...(!mobile && selector ? {
          attachTo: {
            element: selector,
            on: 'right' as const,
          },
        } : {}),
        buttons,
      };
    };

    // Step 1: Dashboard overview - centered modal, no attachment
    tourInstance.addStep({
      id: 'dashboard',
      title: 'Welcome to Open Ham Prep!',
      text: 'This is your dashboard where you track progress and access all study features.',
      classes: 'shepherd-theme-custom shepherd-mobile-welcome',
      buttons: [
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action: () => {
            // On mobile, open the sidebar menu before showing sidebar steps
            if (isMobile() && onOpenMobileMenuRef.current) {
              onOpenMobileMenuRef.current();
              // Give the sheet time to open and render
              setTimeout(() => {
                tourInstance.next();
              }, 350);
            } else {
              tourInstance.next();
            }
          },
        },
      ],
    });

    // Step 2: License selector
    tourInstance.addStep(createStep(
      'license-selector',
      'License Selector',
      'Studying for a different license? Click here to switch between Technician, General, and Extra at any time.',
      '[data-tour="license-selector"]'
    ));

    // Step 3: Practice Test
    tourInstance.addStep(createStep(
      'practice-test',
      'Practice Tests',
      'Take full-length practice exams just like the real test. Track your progress and see if you\'re ready to pass!',
      '[data-tour="practice-test"]'
    ));

    // Step 4: Random Practice
    tourInstance.addStep(createStep(
      'random-practice',
      'Random Practice',
      'Quick study sessions with random questions. Perfect for daily practice and building streaks!',
      '[data-tour="random-practice"]'
    ));

    // Step 5: Study by Topic
    tourInstance.addStep(createStep(
      'study-by-topic',
      'Study by Topic',
      'Focus on specific subelements to master each section of the exam. Great for targeted learning!',
      '[data-tour="subelement-practice"]'
    ));

    // Step 6: Weak Areas
    tourInstance.addStep(createStep(
      'weak-areas',
      'Weak Areas',
      'We track which questions you miss most often. Review them here to turn weaknesses into strengths!',
      '[data-tour="weak-questions"]'
    ));

    // Step 7: Glossary
    tourInstance.addStep(createStep(
      'glossary',
      'Glossary & Flashcards',
      'Learn key terms and definitions with our glossary. Use flashcards for effective memorization!',
      '[data-tour="glossary"]'
    ));

    // Step 8: Find Test Site
    tourInstance.addStep(createStep(
      'find-test-site',
      'Find a Test Site',
      'Ready to take the real exam? Find testing sessions near you and set your target exam date!',
      '[data-tour="find-test-site"]'
    ));

    // Step 9: Forum / Community
    tourInstance.addStep(createStep(
      'forum',
      'Join Our Community',
      'Have questions? Want to share tips? Join our forum to connect with other ham radio enthusiasts, get help, and share your knowledge!',
      '[data-tour="forum"]'
    ));

    // Step 10: Encouraging completion message - close sidebar first on mobile
    tourInstance.addStep({
      id: 'complete',
      title: "You're All Set!",
      text: `
        <div style="text-align: center;">
          <p style="margin-bottom: 8px;">
            You're ready to start your ham radio journey!
          </p>
          <p style="color: var(--muted-foreground); font-size: 0.9em;">
            Start with a practice test to see where you stand.
          </p>
          <p style="margin-top: 12px; font-weight: 600; color: var(--primary);">
            73 and good luck! 📻
          </p>
        </div>
      `,
      classes: 'shepherd-theme-custom shepherd-mobile-welcome',
      beforeShowPromise: () => {
        return new Promise<void>((resolve) => {
          // Close mobile menu before showing final step
          if (isMobile() && onCloseMobileMenuRef.current) {
            onCloseMobileMenuRef.current();
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
      buttons: [
        {
          text: 'Get Started!',
          classes: 'shepherd-button-primary',
          action: () => { tourInstance.complete(); },
        },
      ],
    });

    return tourInstance;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - we use refs for callbacks to avoid recreating the tour

  // Set up event handlers using refs to avoid stale closure issues
  useEffect(() => {
    const handleComplete = () => {
      onCompleteRef.current?.();
    };

    const handleCancel = () => {
      onCancelRef.current?.();
    };

    tour.on('complete', handleComplete);
    tour.on('cancel', handleCancel);

    return () => {
      tour.off('complete', handleComplete);
      tour.off('cancel', handleCancel);
    };
  }, [tour]);

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
