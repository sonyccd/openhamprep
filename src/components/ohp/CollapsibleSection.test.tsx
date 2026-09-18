import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleSection } from './CollapsibleSection';
import { muiWrapper } from '@/test/utils/testWrappers';

describe('CollapsibleSection', () => {
  it('is a real button that says what it controls', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Related Questions" count={3}>
        <p>the questions</p>
      </CollapsibleSection>,
      { wrapper: muiWrapper }
    );

    const toggle = screen.getByRole('button', { name: /Related Questions 3/ });
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).not.toBeNull();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * The old mobile copies put the toggle on a CardHeader <div>. Radix's
   * asChild gave it aria-expanded and a click handler, but a div has no role
   * and no tab stop, so a keyboard could not open the panel on a phone.
   */
  it('keeps the toggle a button in the card variant too', () => {
    render(
      <CollapsibleSection title="Resources" count={2} variant="card">
        <p>the resources</p>
      </CollapsibleSection>,
      { wrapper: muiWrapper }
    );

    const toggle = screen.getByRole('button', { name: /Resources 2/ });
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders a static heading with no toggle when told to stay open', () => {
    render(
      <CollapsibleSection title="Resources" count={2} static>
        <p>the resources</p>
      </CollapsibleSection>,
      { wrapper: muiWrapper }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('the resources')).toBeVisible();
  });

  it('opens on request', () => {
    render(
      <CollapsibleSection title="Resources" defaultOpen>
        <p>the resources</p>
      </CollapsibleSection>,
      { wrapper: muiWrapper }
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * Two guarantees MUI provides by default that this component relies on.
   * Pinned so a change to how the toggle or the region is rendered cannot
   * quietly drop either.
   */
  describe('what MUI provides that we depend on', () => {
    /** A native <button> defaults to type="submit"; inside a form that would
     *  submit it. ButtonBase sets type="button" itself. */
    it('is not a submit button', () => {
      render(
        <CollapsibleSection title="Section">
          <p>body</p>
        </CollapsibleSection>,
        { wrapper: muiWrapper }
      );

      expect(screen.getByRole('button', { name: 'Section' })).toHaveAttribute('type', 'button');
    });

    /**
     * The closed region stays mounted (no unmountOnExit), so what keeps its
     * contents out of the tab order and the accessibility tree is Collapse's
     * own visibility:hidden. Testing-library computes visibility, so a
     * control inside a closed section must not be findable by role.
     */
    it('hides a closed section\'s controls from assistive tech and the tab order', async () => {
      const user = userEvent.setup();
      render(
        <CollapsibleSection title="Section">
          <button type="button">inside</button>
        </CollapsibleSection>,
        { wrapper: muiWrapper }
      );

      // Closed: the element is in the DOM but visibility:hidden, so it has no
      // role match, no accessible name (the accname algorithm skips hidden
      // text), and is not visible.
      expect(screen.queryByRole('button', { name: 'inside' })).not.toBeInTheDocument();
      expect(screen.getByText('inside')).not.toBeVisible();

      await user.click(screen.getByRole('button', { name: 'Section' }));

      expect(screen.getByRole('button', { name: 'inside' })).toBeVisible();
    });
  });
});
