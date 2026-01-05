import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAInstallBanner } from './PWAInstallBanner';

// Mock the usePWAInstall hook
const mockTriggerInstall = vi.fn();
const mockDismissPrompt = vi.fn();

vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(() => ({
    showPrompt: true,
    isIOS: false,
    triggerInstall: mockTriggerInstall,
    dismissPrompt: mockDismissPrompt,
  })),
}));

// Import after mocking
import { usePWAInstall } from '@/hooks/usePWAInstall';

describe('PWAInstallBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when showPrompt is false', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: false,
      isIOS: false,
      canInstall: false,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    expect(screen.queryByText('Install Open Ham Prep')).not.toBeInTheDocument();
  });

  it('should render banner when showPrompt is true', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: false,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    expect(screen.getByText('Install Open Ham Prep')).toBeInTheDocument();
    expect(
      screen.getByText('Quick access from your home screen')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Not now' })
    ).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: false,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    const banner = screen.getByRole('alertdialog');
    expect(banner).toHaveAttribute('aria-labelledby', 'pwa-install-title');
    expect(banner).toHaveAttribute(
      'aria-describedby',
      'pwa-install-description'
    );
  });

  it('should call triggerInstall when Install button is clicked', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: false,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Install' }));

    expect(mockTriggerInstall).toHaveBeenCalledTimes(1);
  });

  it('should call dismissPrompt when Not now button is clicked', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: false,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

    expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
  });

  it('should call dismissPrompt when X button is clicked', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: false,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    fireEvent.click(screen.getByLabelText('Dismiss install prompt'));

    expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
  });

  it('should call dismissPrompt when Escape key is pressed', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: false,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
  });

  it('should render iOS dialog when isIOS is true', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: true,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    // iOS dialog has step-by-step instructions
    expect(screen.getByText(/Tap the/)).toBeInTheDocument();
    expect(screen.getByText(/button in Safari/)).toBeInTheDocument();
    expect(screen.getByText(/Scroll down and tap/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
  });

  it('should call dismissPrompt when Got it button is clicked in iOS dialog', () => {
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      isIOS: true,
      canInstall: true,
      isInstalled: false,
      triggerInstall: mockTriggerInstall,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAInstallBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

    expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
  });
});
