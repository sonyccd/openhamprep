import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContainer } from './page-container';

describe('PageContainer', () => {
  it('renders children correctly', () => {
    render(
      <PageContainer>
        <p>Test content</p>
      </PageContainer>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default standard width class', () => {
    const { container } = render(
      <PageContainer>
        <p>Content</p>
      </PageContainer>
    );
    const innerContainer = container.querySelector('.max-w-3xl');
    expect(innerContainer).toBeInTheDocument();
  });

  describe('width prop', () => {
    it('applies narrow width class (max-w-2xl)', () => {
      const { container } = render(
        <PageContainer width="narrow">
          <p>Narrow content</p>
        </PageContainer>
      );
      expect(container.querySelector('.max-w-2xl')).toBeInTheDocument();
      expect(container.querySelector('.max-w-3xl')).not.toBeInTheDocument();
    });

    it('applies standard width class (max-w-3xl)', () => {
      const { container } = render(
        <PageContainer width="standard">
          <p>Standard content</p>
        </PageContainer>
      );
      expect(container.querySelector('.max-w-3xl')).toBeInTheDocument();
    });

    it('applies wide width class (max-w-5xl)', () => {
      const { container } = render(
        <PageContainer width="wide">
          <p>Wide content</p>
        </PageContainer>
      );
      expect(container.querySelector('.max-w-5xl')).toBeInTheDocument();
      expect(container.querySelector('.max-w-3xl')).not.toBeInTheDocument();
    });

    it('applies full width class (max-w-7xl)', () => {
      const { container } = render(
        <PageContainer width="full">
          <p>Full content</p>
        </PageContainer>
      );
      expect(container.querySelector('.max-w-7xl')).toBeInTheDocument();
      expect(container.querySelector('.max-w-3xl')).not.toBeInTheDocument();
    });
  });

  describe('mobileNavPadding prop', () => {
    it('does not apply pb-24 class by default', () => {
      const { container } = render(
        <PageContainer>
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).not.toHaveClass('pb-24');
    });

    it('applies pb-24 class when mobileNavPadding is true', () => {
      const { container } = render(
        <PageContainer mobileNavPadding>
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('pb-24');
    });
  });

  describe('radioWaveBg prop', () => {
    it('does not apply radio-wave-bg class by default', () => {
      const { container } = render(
        <PageContainer>
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).not.toHaveClass('radio-wave-bg');
    });

    it('applies radio-wave-bg class when radioWaveBg is true', () => {
      const { container } = render(
        <PageContainer radioWaveBg>
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('radio-wave-bg');
    });
  });

  describe('className prop', () => {
    it('applies custom className to outer container', () => {
      const { container } = render(
        <PageContainer className="custom-outer-class">
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('custom-outer-class');
    });

    it('preserves default classes when adding custom className', () => {
      const { container } = render(
        <PageContainer className="custom-class">
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('flex-1');
      expect(outerContainer).toHaveClass('overflow-y-auto');
      expect(outerContainer).toHaveClass('custom-class');
    });
  });

  describe('contentClassName prop', () => {
    it('applies custom contentClassName to inner container', () => {
      const { container } = render(
        <PageContainer contentClassName="custom-inner-class">
          <p>Content</p>
        </PageContainer>
      );
      const innerContainer = container.querySelector('.mx-auto');
      expect(innerContainer).toHaveClass('custom-inner-class');
    });

    it('preserves width and mx-auto classes when adding contentClassName', () => {
      const { container } = render(
        <PageContainer width="wide" contentClassName="flex flex-col">
          <p>Content</p>
        </PageContainer>
      );
      const innerContainer = container.querySelector('.max-w-5xl');
      expect(innerContainer).toHaveClass('mx-auto');
      expect(innerContainer).toHaveClass('flex');
      expect(innerContainer).toHaveClass('flex-col');
    });
  });

  describe('default styling', () => {
    it('applies base padding classes', () => {
      const { container } = render(
        <PageContainer>
          <p>Content</p>
        </PageContainer>
      );
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('py-8');
      expect(outerContainer).toHaveClass('px-4');
    });

    it('applies mx-auto to center content', () => {
      const { container } = render(
        <PageContainer>
          <p>Content</p>
        </PageContainer>
      );
      const innerContainer = container.querySelector('.mx-auto');
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe('combined props', () => {
    it('applies multiple props correctly', () => {
      const { container } = render(
        <PageContainer
          width="wide"
          mobileNavPadding
          radioWaveBg
          className="custom-outer"
          contentClassName="custom-inner"
        >
          <p>Content</p>
        </PageContainer>
      );

      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass('pb-24');
      expect(outerContainer).toHaveClass('radio-wave-bg');
      expect(outerContainer).toHaveClass('custom-outer');

      const innerContainer = container.querySelector('.max-w-5xl');
      expect(innerContainer).toHaveClass('custom-inner');
      expect(innerContainer).toHaveClass('mx-auto');
    });
  });
});
