import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

// Exempt from the semantic-query conversion in #257. Applying the right class
// per variant and size IS this primitive's contract — drop the class assertion
// and there is no behaviour left to test. The file retires with the primitive
// itself when shadcn is removed in #266.
describe('Button', () => {
  it('renders correctly with default props', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { getByRole, rerender } = render(<Button variant="default">Default</Button>);
    expect(getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(getByRole('button')).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(getByRole('button')).toHaveClass('hover:bg-muted');
  });

  it('applies size classes correctly', () => {
    const { getByRole, rerender } = render(<Button size="default">Default</Button>);
    expect(getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="sm">Small</Button>);
    expect(getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="icon">Icon</Button>);
    expect(getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    const { getByRole } = render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = getByRole('button');

    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as child component when asChild is true', () => {
    const { getByRole, queryByRole } = render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    expect(getByRole('link', { name: /link button/i })).toBeInTheDocument();
    expect(queryByRole('button')).not.toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { getByRole } = render(<Button className="custom-class">Custom</Button>);
    expect(getByRole('button')).toHaveClass('custom-class');
  });
});
