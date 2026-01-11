import { useEffect, useState } from 'react';

/**
 * Hook to detect and manage Windows Controls Overlay (WCO) state.
 * WCO allows PWA to use the Windows title bar area for custom content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
 */
export function useWindowControlsOverlay() {
  const [isWcoEnabled, setIsWcoEnabled] = useState(false);

  useEffect(() => {
    // Check if the Window Controls Overlay API is available
    const wco = (navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlay }).windowControlsOverlay;

    if (!wco) {
      return;
    }

    // Update state based on current visibility
    const updateWcoState = () => {
      const isVisible = wco.visible;
      setIsWcoEnabled(isVisible);

      // Apply/remove body class for CSS styling
      if (isVisible) {
        document.body.classList.add('wco-enabled');
      } else {
        document.body.classList.remove('wco-enabled');
      }
    };

    // Initial check
    updateWcoState();

    // Listen for geometry changes (when WCO visibility changes)
    wco.addEventListener('geometrychange', updateWcoState);

    return () => {
      wco.removeEventListener('geometrychange', updateWcoState);
      document.body.classList.remove('wco-enabled');
    };
  }, []);

  return { isWcoEnabled };
}

// Type augmentation for Window Controls Overlay API
interface WindowControlsOverlay extends EventTarget {
  visible: boolean;
  getTitlebarAreaRect(): DOMRect;
}
