export type SettingsView = "main" | "account" | "appearance" | "accessibility";

export interface ProfileUserInfo {
  displayName: string | null;
  email: string | null;
  forumUsername: string | null;
}

/** The small icon + label heading used above each settings section. */
export const sectionHeading = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  fontWeight: 500,
  color: "text.secondary",
} as const;
