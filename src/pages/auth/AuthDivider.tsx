import Divider from "@mui/material/Divider";

interface AuthDividerProps {
  label: string;
  /** The "Or continue with" rule is set in caps; the plain "or" is not. */
  uppercase?: boolean;
}

/**
 * A labelled rule between the form and the alternatives below it.
 *
 * MUI's Divider takes the label as a child and handles the line-behind-text
 * itself, so the absolutely-positioned span the old markup used is gone.
 */
export function AuthDivider({ label, uppercase = false }: AuthDividerProps) {
  return (
    <Divider
      sx={{
        my: uppercase ? 3 : 2,
        "&::before, &::after": { borderColor: "divider" },
        "& .MuiDivider-wrapper": {
          fontSize: "0.75rem",
          color: "text.secondary",
          textTransform: uppercase ? "uppercase" : "none",
        },
      }}
    >
      {label}
    </Divider>
  );
}
