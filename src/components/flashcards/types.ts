/**
 * Which direction the deck is studied in.
 *
 * Lives here rather than in FlashcardStart: the start screen picks the mode,
 * but the deck and the face both read it, and a sibling importing a type from
 * the screen that happens to set it points the dependency the wrong way.
 */
export type FlashcardMode = "term-to-definition" | "definition-to-term";
