import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import { MotionBox } from "./MotionBox";
import { muiTheme } from "@/theme/muiTheme";

describe("MUI setup", () => {
  it("renders a themed MUI component under the app's theme", () => {
    render(
      <ThemeProvider theme={muiTheme} storageManager={null} noSsr>
        <Button>Sign in</Button>
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders MotionBox with motion props applied to a real DOM node", () => {
    render(
      <ThemeProvider theme={muiTheme} storageManager={null} noSsr>
        <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="motion-box">
          Ready
        </MotionBox>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("motion-box")).toHaveTextContent("Ready");
  });
});
