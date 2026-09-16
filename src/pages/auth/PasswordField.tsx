import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Rendered under the field when there is no error. */
  helperText?: React.ReactNode;
  autoComplete?: string;
}

/**
 * A password input with its own show/hide control.
 *
 * The toggle was previously a bare <button> holding only an Eye icon, with no
 * aria-label — so both of them announced as "button" and nothing else, and
 * neither said whether the password was currently visible. It is an IconButton
 * with a name that changes with the state, and aria-pressed so the state is
 * conveyed rather than implied by the icon.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      placeholder="••••••••"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={error ?? helperText}
      autoComplete={autoComplete}
      required
      fullWidth
      slotProps={{
        inputLabel: { shrink: true },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box
                component={Lock}
                aria-hidden="true"
                sx={{ width: 16, height: 16, color: "text.secondary" }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((shown) => !shown)}
                aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                aria-pressed={visible}
                edge="end"
                size="small"
              >
                <Box component={visible ? EyeOff : Eye} sx={{ width: 16, height: 16 }} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
