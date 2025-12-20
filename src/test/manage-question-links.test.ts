import { describe, it, expect } from "vitest";

/**
 * Unit tests for the manage-question-links edge function.
 *
 * These tests verify the URL extraction logic used by the extract-from-explanation action.
 * Integration tests would require mocking Deno runtime and Supabase client.
 */

// =============================================================================
// EXTRACTED FUNCTIONS FOR TESTING
// These mirror the implementations in index.ts
// =============================================================================

/**
 * Extracts all URLs from explanation text.
 * Handles both markdown links [text](url) and bare URLs (https://...).
 */
function extractUrlsFromText(text: string): string[] {
  if (!text) return [];

  const urls: string[] = [];
  const seen = new Set<string>();

  // Extract URLs from markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi;
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const url = match[2];
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  // Extract bare URLs (not inside markdown links)
  const textWithoutMarkdownLinks = text.replace(markdownLinkRegex, '');
  const bareUrlRegex = /https?:\/\/[^\s<>[\]()]+/gi;
  while ((match = bareUrlRegex.exec(textWithoutMarkdownLinks)) !== null) {
    const url = match[0].replace(/[.,;:!?'"]+$/, ''); // Clean trailing punctuation
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

// =============================================================================
// TESTS: URL EXTRACTION
// =============================================================================

describe("extractUrlsFromText", () => {
  describe("markdown links", () => {
    it("should extract URLs from markdown links", () => {
      const text = "Check out [ARRL](https://arrl.org) for more info";
      expect(extractUrlsFromText(text)).toEqual(["https://arrl.org"]);
    });

    it("should extract multiple markdown links", () => {
      const text = "Visit [ARRL](https://arrl.org) and [FCC](https://fcc.gov)";
      expect(extractUrlsFromText(text)).toEqual([
        "https://arrl.org",
        "https://fcc.gov",
      ]);
    });

    it("should handle markdown links with complex URLs", () => {
      const text =
        "See [docs](https://example.com/path/to/page?query=value&foo=bar)";
      expect(extractUrlsFromText(text)).toEqual([
        "https://example.com/path/to/page?query=value&foo=bar",
      ]);
    });

    it("should handle http links (not just https)", () => {
      const text = "Old site: [example](http://example.com)";
      expect(extractUrlsFromText(text)).toEqual(["http://example.com"]);
    });

    it("should handle links with spaces in text", () => {
      const text = "See [Ham Radio Resources](https://example.com)";
      expect(extractUrlsFromText(text)).toEqual(["https://example.com"]);
    });
  });

  describe("bare URLs", () => {
    it("should extract bare https URLs", () => {
      const text = "Visit https://arrl.org for more info";
      expect(extractUrlsFromText(text)).toEqual(["https://arrl.org"]);
    });

    it("should extract bare http URLs", () => {
      const text = "Old site: http://example.com";
      expect(extractUrlsFromText(text)).toEqual(["http://example.com"]);
    });

    it("should extract multiple bare URLs", () => {
      const text = "Check https://first.com and https://second.com";
      expect(extractUrlsFromText(text)).toEqual([
        "https://first.com",
        "https://second.com",
      ]);
    });

    it("should extract URLs with paths and query strings", () => {
      const text = "See https://example.com/path/to/page?q=test";
      expect(extractUrlsFromText(text)).toEqual([
        "https://example.com/path/to/page?q=test",
      ]);
    });

    it("should clean trailing punctuation from bare URLs", () => {
      const text = "Check out https://arrl.org. It has great resources!";
      expect(extractUrlsFromText(text)).toEqual(["https://arrl.org"]);
    });

    it("should clean various trailing punctuation marks", () => {
      expect(extractUrlsFromText("URL: https://example.com,")).toEqual([
        "https://example.com",
      ]);
      expect(extractUrlsFromText("URL: https://example.com;")).toEqual([
        "https://example.com",
      ]);
      expect(extractUrlsFromText("URL: https://example.com:")).toEqual([
        "https://example.com",
      ]);
      expect(extractUrlsFromText("URL: https://example.com!")).toEqual([
        "https://example.com",
      ]);
      expect(extractUrlsFromText("URL: https://example.com?")).toEqual([
        "https://example.com",
      ]);
    });
  });

  describe("mixed content", () => {
    it("should extract both markdown and bare URLs", () => {
      const text = "See [ARRL](https://arrl.org) or visit https://fcc.gov";
      expect(extractUrlsFromText(text)).toEqual([
        "https://arrl.org",
        "https://fcc.gov",
      ]);
    });

    it("should preserve order (markdown first, then bare)", () => {
      const text =
        "First https://first.com then [second](https://second.com) then https://third.com";
      const urls = extractUrlsFromText(text);
      // Markdown links are extracted first
      expect(urls[0]).toBe("https://second.com");
      expect(urls).toContain("https://first.com");
      expect(urls).toContain("https://third.com");
    });
  });

  describe("deduplication", () => {
    it("should deduplicate identical bare URLs", () => {
      const text = "Visit https://arrl.org and also https://arrl.org again";
      expect(extractUrlsFromText(text)).toEqual(["https://arrl.org"]);
    });

    it("should deduplicate when same URL in markdown and bare", () => {
      const text = "[ARRL](https://arrl.org) or just https://arrl.org";
      expect(extractUrlsFromText(text)).toEqual(["https://arrl.org"]);
    });

    it("should deduplicate multiple markdown links with same URL", () => {
      const text =
        "[link1](https://example.com) and [link2](https://example.com)";
      expect(extractUrlsFromText(text)).toEqual(["https://example.com"]);
    });
  });

  describe("edge cases", () => {
    it("should return empty array for empty string", () => {
      expect(extractUrlsFromText("")).toEqual([]);
    });

    it("should return empty array for null/undefined", () => {
      expect(extractUrlsFromText(null as unknown as string)).toEqual([]);
      expect(extractUrlsFromText(undefined as unknown as string)).toEqual([]);
    });

    it("should return empty array for text without URLs", () => {
      expect(
        extractUrlsFromText("Plain text without any links")
      ).toEqual([]);
    });

    it("should ignore non-http protocols", () => {
      const text = "Try ftp://files.example.com or mailto:test@example.com";
      expect(extractUrlsFromText(text)).toEqual([]);
    });

    it("should handle multiline text", () => {
      const text = `
        Line 1: https://first.com
        Line 2: [link](https://second.com)
        Line 3: https://third.com
      `;
      const urls = extractUrlsFromText(text);
      expect(urls).toHaveLength(3);
      expect(urls).toContain("https://first.com");
      expect(urls).toContain("https://second.com");
      expect(urls).toContain("https://third.com");
    });

    it("should handle URLs with hash fragments", () => {
      const text = "See https://example.com/page#section";
      expect(extractUrlsFromText(text)).toEqual([
        "https://example.com/page#section",
      ]);
    });
  });

  describe("real-world examples", () => {
    it("should extract links from a typical explanation", () => {
      const text = `
        The correct answer is **20 meters**. According to the [ARRL Band Plan](https://arrl.org/band-plan),
        the 20-meter band extends from 14.000 to 14.350 MHz. For more details, see the
        [FCC Part 97 regulations](https://fcc.gov/part97) or visit https://ham.study for practice.
      `;
      const urls = extractUrlsFromText(text);
      expect(urls).toEqual([
        "https://arrl.org/band-plan",
        "https://fcc.gov/part97",
        "https://ham.study",
      ]);
    });

    it("should handle YouTube video links", () => {
      const text =
        "Watch this [explanation](https://youtube.com/watch?v=abc123)";
      expect(extractUrlsFromText(text)).toEqual([
        "https://youtube.com/watch?v=abc123",
      ]);
    });

    it("should handle explanation with markdown formatting", () => {
      const text = `
        This is **bold** text with a [link](https://example.com).

        Here's some more info:
        - First point with https://first.com
        - Second point with [another link](https://second.com)

        Final URL: https://third.com
      `;
      const urls = extractUrlsFromText(text);
      expect(urls).toHaveLength(4);
    });
  });
});

// =============================================================================
// TESTS: EXTRACT-FROM-EXPLANATION ACTION LOGIC
// =============================================================================

describe("extract-from-explanation action logic", () => {
  interface UnfurledLink {
    url: string;
    title: string;
    description: string;
    image: string;
    type: "video" | "article" | "website";
    siteName: string;
    unfurledAt: string;
  }

  /**
   * Simulates the logic for determining which links need unfurling
   * and which can be kept from existing data.
   */
  function processLinks(
    extractedUrls: string[],
    existingLinks: UnfurledLink[]
  ): { urlsToUnfurl: string[]; linksToKeep: UnfurledLink[] } {
    const existingUrlMap = new Map(existingLinks.map((l) => [l.url, l]));

    const urlsToUnfurl: string[] = [];
    const linksToKeep: UnfurledLink[] = [];

    for (const url of extractedUrls) {
      if (existingUrlMap.has(url)) {
        linksToKeep.push(existingUrlMap.get(url)!);
      } else {
        urlsToUnfurl.push(url);
      }
    }

    return { urlsToUnfurl, linksToKeep };
  }

  describe("link processing", () => {
    it("should identify new URLs that need unfurling", () => {
      const extractedUrls = ["https://new.com", "https://another.com"];
      const existingLinks: UnfurledLink[] = [];

      const result = processLinks(extractedUrls, existingLinks);

      expect(result.urlsToUnfurl).toEqual([
        "https://new.com",
        "https://another.com",
      ]);
      expect(result.linksToKeep).toEqual([]);
    });

    it("should keep existing links that are still in the explanation", () => {
      const existingLink: UnfurledLink = {
        url: "https://existing.com",
        title: "Existing Page",
        description: "A page that was already unfurled",
        image: "https://existing.com/image.jpg",
        type: "website",
        siteName: "existing.com",
        unfurledAt: "2024-01-01T00:00:00Z",
      };

      const extractedUrls = ["https://existing.com"];
      const existingLinks = [existingLink];

      const result = processLinks(extractedUrls, existingLinks);

      expect(result.urlsToUnfurl).toEqual([]);
      expect(result.linksToKeep).toEqual([existingLink]);
    });

    it("should handle mix of new and existing URLs", () => {
      const existingLink: UnfurledLink = {
        url: "https://existing.com",
        title: "Existing",
        description: "",
        image: "",
        type: "website",
        siteName: "",
        unfurledAt: "2024-01-01T00:00:00Z",
      };

      const extractedUrls = ["https://existing.com", "https://new.com"];
      const existingLinks = [existingLink];

      const result = processLinks(extractedUrls, existingLinks);

      expect(result.urlsToUnfurl).toEqual(["https://new.com"]);
      expect(result.linksToKeep).toEqual([existingLink]);
    });

    it("should remove links that are no longer in the explanation", () => {
      const oldLink: UnfurledLink = {
        url: "https://old.com",
        title: "Old Link",
        description: "",
        image: "",
        type: "website",
        siteName: "",
        unfurledAt: "2024-01-01T00:00:00Z",
      };

      const extractedUrls = ["https://new.com"];
      const existingLinks = [oldLink];

      const result = processLinks(extractedUrls, existingLinks);

      expect(result.urlsToUnfurl).toEqual(["https://new.com"]);
      expect(result.linksToKeep).toEqual([]); // Old link is NOT kept
    });

    it("should preserve order of extracted URLs", () => {
      const existingLinks: UnfurledLink[] = [];
      const extractedUrls = [
        "https://first.com",
        "https://second.com",
        "https://third.com",
      ];

      const result = processLinks(extractedUrls, existingLinks);

      expect(result.urlsToUnfurl).toEqual([
        "https://first.com",
        "https://second.com",
        "https://third.com",
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty explanation (no URLs)", () => {
      const result = processLinks([], []);
      expect(result.urlsToUnfurl).toEqual([]);
      expect(result.linksToKeep).toEqual([]);
    });

    it("should handle empty existing links", () => {
      const result = processLinks(["https://example.com"], []);
      expect(result.urlsToUnfurl).toEqual(["https://example.com"]);
    });

    it("should handle case where all URLs already exist", () => {
      const existingLinks: UnfurledLink[] = [
        {
          url: "https://a.com",
          title: "A",
          description: "",
          image: "",
          type: "website",
          siteName: "",
          unfurledAt: "2024-01-01T00:00:00Z",
        },
        {
          url: "https://b.com",
          title: "B",
          description: "",
          image: "",
          type: "website",
          siteName: "",
          unfurledAt: "2024-01-01T00:00:00Z",
        },
      ];

      const extractedUrls = ["https://a.com", "https://b.com"];
      const result = processLinks(extractedUrls, existingLinks);

      expect(result.urlsToUnfurl).toEqual([]);
      expect(result.linksToKeep).toHaveLength(2);
    });
  });
});

// =============================================================================
// TESTS: LINK TYPE DETECTION (simulated)
// =============================================================================

describe("link type detection logic", () => {
  /**
   * Simulates the detectType function from the edge function.
   */
  function detectType(
    url: string,
    ogType: string = ""
  ): "video" | "article" | "website" {
    const urlLower = url.toLowerCase();

    // Video platforms
    if (
      urlLower.includes("youtube.com") ||
      urlLower.includes("youtu.be") ||
      urlLower.includes("vimeo.com") ||
      urlLower.includes("dailymotion.com") ||
      urlLower.includes("twitch.tv")
    ) {
      return "video";
    }

    // OpenGraph type
    if (ogType.includes("video")) return "video";
    if (ogType.includes("article")) return "article";

    // URL patterns
    if (
      urlLower.includes("/blog/") ||
      urlLower.includes("/article/") ||
      urlLower.includes("/post/")
    ) {
      return "article";
    }

    return "website";
  }

  describe("video detection", () => {
    it("should detect YouTube videos", () => {
      expect(detectType("https://youtube.com/watch?v=abc")).toBe("video");
      expect(detectType("https://www.youtube.com/watch?v=abc")).toBe("video");
      expect(detectType("https://youtu.be/abc")).toBe("video");
    });

    it("should detect Vimeo videos", () => {
      expect(detectType("https://vimeo.com/123456")).toBe("video");
    });

    it("should detect Twitch", () => {
      expect(detectType("https://twitch.tv/channel")).toBe("video");
    });

    it("should detect video via OG type", () => {
      expect(detectType("https://example.com", "video.other")).toBe("video");
    });
  });

  describe("article detection", () => {
    it("should detect articles via URL pattern", () => {
      expect(detectType("https://example.com/blog/post")).toBe("article");
      expect(detectType("https://example.com/article/123")).toBe("article");
      expect(detectType("https://example.com/post/something")).toBe("article");
    });

    it("should detect articles via OG type", () => {
      expect(detectType("https://example.com", "article")).toBe("article");
    });
  });

  describe("website detection", () => {
    it("should default to website for other URLs", () => {
      expect(detectType("https://arrl.org")).toBe("website");
      expect(detectType("https://fcc.gov")).toBe("website");
      expect(detectType("https://example.com/page")).toBe("website");
    });
  });
});
