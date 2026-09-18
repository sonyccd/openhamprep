import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopicResourcePanel } from './TopicResourcePanel';
import { muiWrapper } from '@/test/utils/testWrappers';
import { TopicResource } from '@/hooks/useTopics';

// Mock Supabase storage
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://storage.example.com/${path}` },
        })),
      })),
    },
  },
}));

const createResource = (overrides: Partial<TopicResource> = {}): TopicResource => ({
  id: `resource-${Math.random()}`,
  topic_id: 'topic-123',
  resource_type: 'link',
  title: 'Test Resource',
  url: 'https://example.com',
  storage_path: null,
  description: null,
  display_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('TopicResourcePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render nothing when resources is empty', () => {
      const { container } = render(<TopicResourcePanel resources={[]} />, { wrapper: muiWrapper });
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when resources is undefined', () => {
      // @ts-expect-error Testing undefined prop handling
      const { container } = render(<TopicResourcePanel resources={undefined} />, { wrapper: muiWrapper });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering Resources', () => {
    it('should show "Resources" header', () => {
      const resources = [createResource()];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Resources appears in both desktop and mobile views
      expect(screen.getAllByText('Resources').length).toBeGreaterThanOrEqual(1);
    });

    it('should show resource count badge', () => {
      const resources = [createResource(), createResource(), createResource()];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Count badge appears in both desktop and mobile
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });

    it('should display resource title after expanding group', () => {
      const resources = [createResource({ resource_type: 'video', title: 'My Video Tutorial' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      // Now the video resource should be visible
      expect(screen.getAllByText('My Video Tutorial').length).toBeGreaterThanOrEqual(1);
    });

    it('should display resource description when present', () => {
      const resources = [
        createResource({
          resource_type: 'video',
          title: 'Tutorial',
          description: 'A helpful tutorial for beginners',
        }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      // Now the description should be visible
      expect(screen.getAllByText('A helpful tutorial for beginners').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Resource Types', () => {
    it('should show Videos section for video resources', () => {
      const resources = [createResource({ resource_type: 'video', title: 'Video 1' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      expect(screen.getAllByText('Videos').length).toBeGreaterThanOrEqual(1);
    });

    it('should show Articles section for article resources', () => {
      const resources = [createResource({ resource_type: 'article', title: 'Article 1' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      expect(screen.getAllByText('Articles').length).toBeGreaterThanOrEqual(1);
    });

    it('should show Links section for link resources', () => {
      const resources = [createResource({ resource_type: 'link', title: 'Link 1' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      expect(screen.getAllByText('Links').length).toBeGreaterThanOrEqual(1);
    });

    it('should show PDFs section for pdf resources', () => {
      const resources = [createResource({ resource_type: 'pdf', title: 'PDF 1' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      expect(screen.getAllByText('PDFs').length).toBeGreaterThanOrEqual(1);
    });

    it('should show Images section for image resources', () => {
      const resources = [createResource({ resource_type: 'image', title: 'Image 1' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      expect(screen.getAllByText('Images').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Resource Grouping', () => {
    it('should group resources by type', () => {
      const resources = [
        createResource({ resource_type: 'video', title: 'Video 1' }),
        createResource({ resource_type: 'video', title: 'Video 2' }),
        createResource({ resource_type: 'article', title: 'Article 1' }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Group headers are always visible
      expect(screen.getAllByText('Videos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Articles').length).toBeGreaterThanOrEqual(1);

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      // Video items are now visible
      expect(screen.getAllByText('Video 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Video 2').length).toBeGreaterThanOrEqual(1);
      // Article group header shows count "1" indicating 1 article resource
      const articlesGroup = screen.getAllByText('Articles')[0];
      expect(articlesGroup.parentElement?.textContent).toContain('1');
    });

    it('should show count badge for each group', () => {
      const resources = [
        createResource({ resource_type: 'video', title: 'Video 1' }),
        createResource({ resource_type: 'video', title: 'Video 2' }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // The group should show count "2" (visible in group header even when collapsed)
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('External Links', () => {
    it('should render external link with correct href', () => {
      const resources = [
        createResource({
          resource_type: 'video',
          url: 'https://example.com/resource',
          title: 'External Resource',
        }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      // Get the first matching link
      const links = screen.getAllByText('External Resource');
      const link = links[0].closest('a');
      expect(link).toHaveAttribute('href', 'https://example.com/resource');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should open URL resources in a new tab', () => {
      const resources = [createResource({ resource_type: 'video', url: 'https://example.com' })];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      expect(screen.getAllByRole('link')[0]).toHaveAttribute('target', '_blank');
    });
  });

  describe('YouTube Detection', () => {
    it('should show YouTube badge for youtube.com URLs', () => {
      const resources = [
        createResource({
          resource_type: 'video',
          url: 'https://www.youtube.com/watch?v=12345',
          title: 'YouTube Video',
        }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      expect(screen.getAllByText('YouTube').length).toBeGreaterThanOrEqual(1);
    });

    it('should show YouTube badge for youtu.be URLs', () => {
      const resources = [
        createResource({
          resource_type: 'video',
          url: 'https://youtu.be/12345',
          title: 'YouTube Short Link',
        }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      expect(screen.getAllByText('YouTube').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Uploaded Files', () => {
    it('should show Download badge for uploaded files', () => {
      const resources = [
        createResource({
          resource_type: 'video',
          storage_path: 'resources/topic-123/file.mp4',
          url: null,
          title: 'Uploaded Video',
        }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      expect(screen.getAllByText('Download').length).toBeGreaterThanOrEqual(1);
    });

    it('should show download icon for uploaded files', () => {
      const resources = [
        createResource({
          resource_type: 'video',
          storage_path: 'resources/topic-123/file.mp4',
          url: null,
        }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      // A stored file is offered as a download rather than a plain link out.
      expect(screen.getAllByRole('link')[0]).toHaveAttribute('download');
    });
  });

  describe('Display Order', () => {
    it('should sort resources by display_order within groups', () => {
      const resources = [
        createResource({ resource_type: 'video', title: 'Video C', display_order: 3 }),
        createResource({ resource_type: 'video', title: 'Video A', display_order: 1 }),
        createResource({ resource_type: 'video', title: 'Video B', display_order: 2 }),
      ];
      render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

      // Click to expand the Videos group
      const videosButton = screen.getAllByText('Videos')[0];
      fireEvent.click(videosButton);

      // Get videos from desktop view (first set)
      const videos = screen.getAllByText(/Video [ABC]/);
      // First 3 are from desktop, next 3 from mobile
      expect(videos[0]).toHaveTextContent('Video A');
      expect(videos[1]).toHaveTextContent('Video B');
      expect(videos[2]).toHaveTextContent('Video C');
    });
  });

  /**
   * ResourceGroup sorts with a copy. The old code sorted in place, which
   * looked like the prop-mutation bug #305 fixed — but the array it sorted
   * was the per-type group built fresh by reduce on every render, so the
   * caller's array was never touched. This pins the contract that was met by
   * accident, so a future refactor that hands ResourceGroup the prop directly
   * cannot start mutating it.
   */
  it('does not reorder the array it was given', () => {
    const resources = [
      createResource({ id: 'r2', title: 'Second', display_order: 2 }),
      createResource({ id: 'r1', title: 'First', display_order: 1 }),
    ];
    const before = resources.map((r) => r.id);

    render(<TopicResourcePanel resources={resources} />, { wrapper: muiWrapper });

    expect(resources.map((r) => r.id)).toEqual(before);
  });

  /** On a phone the whole panel folds into a card; that fold has to be a button. */
  it('makes the mobile fold a real button', () => {
    render(<TopicResourcePanel resources={[createResource({ resource_type: 'link' })]} />, {
      wrapper: muiWrapper,
    });

    // happy-dom's default viewport is 1024px — the lg breakpoint — so the
    // mobile card is display:none here and excluded from the default query.
    // The contract being pinned (a real, expandable button) does not depend
    // on viewport, so the query includes hidden elements. Desktop's own
    // "Resources" heading is static, so this can only be the card's toggle.
    const toggle = screen.getByRole('button', { name: /^Resources 1$/, hidden: true });
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.closest('.MuiCard-root')).not.toBeNull();
  });
});
