import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { muiWrapper } from '@/test/utils';
import { Toaster } from './Toaster';

const showToast = async (fire: () => void) => {
  const { baseElement } = render(<Toaster />, { wrapper: muiWrapper });
  fire();
  await waitFor(() => expect(baseElement.querySelector('[data-sonner-toaster]')).not.toBeNull());
  return baseElement;
};

/**
 * sonner stays as the toast system, but it must follow the MUI theme without
 * Tailwind: it reads its own CSS custom properties, which are fed the
 * palette's variables.
 */
describe('Toaster', () => {
  it('feeds sonner the palette through its own variables', async () => {
    const baseElement = await showToast(() => toast('Hello'));
    const root = baseElement.querySelector('[data-sonner-toaster]') as HTMLElement;

    expect(root.style.getPropertyValue('--normal-bg')).toBe('var(--mui-palette-background-default)');
    expect(root.style.getPropertyValue('--normal-text')).toBe('var(--mui-palette-text-primary)');
    expect(root.style.getPropertyValue('--normal-border')).toBe('var(--mui-palette-divider)');
  });

  it('gives each severity its palette colour', async () => {
    const baseElement = await showToast(() => toast.success('Saved'));
    const root = baseElement.querySelector('[data-sonner-toaster]') as HTMLElement;

    expect(root.style.getPropertyValue('--success-text')).toBe('var(--mui-palette-success-main)');
    expect(root.style.getPropertyValue('--error-text')).toBe('var(--mui-palette-error-main)');
    expect(root.style.getPropertyValue('--warning-text')).toBe('var(--mui-palette-warning-main)');
    expect(root.style.getPropertyValue('--info-text')).toBe('var(--mui-palette-info-main)');
  });

  /** The Tailwind class names it used to carry would stop resolving in C7. */
  it('carries no class names of its own', async () => {
    const baseElement = await showToast(() => toast('Hello'));

    const root = baseElement.querySelector('[data-sonner-toaster]') as HTMLElement;
    const item = baseElement.querySelector('[data-sonner-toast]') as HTMLElement;
    expect(root.className).not.toMatch(/toaster|group/);
    expect(item.className).toBe('');
    expect(item.style.boxShadow).toBe('var(--mui-shadows-8)');
  });

  it('still shows what it was given', async () => {
    const baseElement = await showToast(() => toast.success('Content saved successfully'));

    expect(baseElement.textContent).toContain('Content saved successfully');
  });
});
