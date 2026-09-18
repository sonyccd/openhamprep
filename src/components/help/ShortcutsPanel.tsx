import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Kbd } from "@/components/ohp/Kbd";
import { tokenAlpha } from "@/theme/muiTheme";

interface ShortcutItem {
  keys: string[];
  description: string;
}
interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["→"], description: "Next question" },
      { keys: ["←"], description: "Previous question" },
      { keys: ["S"], description: "Skip question" },
      { keys: ["Esc"], description: "Go back / Close" },
      { keys: ["?"], description: "Show help" },
    ],
  },
];

// Answer keys shown separately in a compact grid
const ANSWER_KEYS = ["A", "B", "C", "D"];

function GroupHeading({ children }: { children: string }) {
  return (
    <Typography component="h3" sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.secondary", mb: 1 }}>
      {children}
    </Typography>
  );
}

/** The keyboard shortcuts tab of the help dialog. */
export function ShortcutsPanel() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <GroupHeading>Answer Selection</GroupHeading>
        <Box sx={{ display: "flex", gap: 1 }}>
          {ANSWER_KEYS.map((key) => (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.75,
                borderRadius: "6px",
                bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
              }}
            >
              <Kbd sx={{ width: 24, px: 0, bgcolor: "background.default" }}>{key}</Kbd>
              <Typography component="span" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                Answer {key}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {SHORTCUT_GROUPS.map((group) => (
        <Box key={group.title}>
          <GroupHeading>{group.title}</GroupHeading>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {group.shortcuts.map((shortcut) => (
              <Box
                key={shortcut.description}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}
              >
                <Typography component="span" sx={{ fontSize: "0.875rem" }}>
                  {shortcut.description}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {shortcut.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
