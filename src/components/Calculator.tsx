import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import { Calculator as CalculatorIcon } from "lucide-react";

const OPERATORS = ["+", "-", "×", "÷", "=", "C"];

/**
 * A pocket calculator that drops out beside the question actions.
 *
 * The panel is positioned, not portalled: it lives in the same stacking
 * context as the button that opens it and closes with it, which is how it
 * behaved before the port. No className prop any more — nothing passed one.
 */
export function Calculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = useCallback((digit: string) => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      return prev === "0" ? digit : prev + digit;
    });
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return "0.";
      }
      if (!prev.includes(".")) {
        return prev + ".";
      }
      return prev;
    });
  }, [waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const performOperation = useCallback((nextOperation: string) => {
    setDisplay(prev => {
      const inputValue = parseFloat(prev);

      if (previousValue === null) {
        setPreviousValue(inputValue);
      } else if (operation) {
        const currentValue = previousValue || 0;
        let result: number;

        switch (operation) {
          case "+":
            result = currentValue + inputValue;
            break;
          case "-":
            result = currentValue - inputValue;
            break;
          case "×":
            result = currentValue * inputValue;
            break;
          case "÷":
            result = inputValue !== 0 ? currentValue / inputValue : 0;
            break;
          default:
            result = inputValue;
        }

        setPreviousValue(result);
        setWaitingForOperand(true);
        setOperation(nextOperation);
        return String(result);
      }

      setWaitingForOperand(true);
      setOperation(nextOperation);
      return prev;
    });
  }, [previousValue, operation]);

  const calculate = useCallback(() => {
    if (!operation || previousValue === null) return;

    setDisplay(prev => {
      const inputValue = parseFloat(prev);
      let result: number;

      switch (operation) {
        case "+":
          result = previousValue + inputValue;
          break;
        case "-":
          result = previousValue - inputValue;
          break;
        case "×":
          result = previousValue * inputValue;
          break;
        case "÷":
          result = inputValue !== 0 ? previousValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
      return String(result);
    });
  }, [operation, previousValue]);

  const buttons = [
    ["C", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  // Accessible labels for operator buttons
  const buttonLabels: Record<string, string> = {
    "C": "Clear",
    "÷": "Divide",
    "×": "Multiply",
    "-": "Subtract",
    "+": "Add",
    "=": "Equals",
    ".": "Decimal point",
  };

  const handleButtonClick = useCallback((btn: string) => {
    if (btn === "C") {
      clear();
    } else if (btn === "=") {
      calculate();
    } else if (["+", "-", "×", "÷"].includes(btn)) {
      performOperation(btn);
    } else if (btn === ".") {
      inputDecimal();
    } else {
      inputDigit(btn);
    }
  }, [clear, calculate, performOperation, inputDecimal, inputDigit]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys to avoid interfering with page
      if (/^[0-9.+\-*/=]$/.test(e.key) || e.key === "Enter" || e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
      }

      if (/^[0-9]$/.test(e.key)) {
        handleButtonClick(e.key);
      } else if (e.key === ".") {
        handleButtonClick(".");
      } else if (e.key === "+") {
        handleButtonClick("+");
      } else if (e.key === "-") {
        handleButtonClick("-");
      } else if (e.key === "*") {
        handleButtonClick("×");
      } else if (e.key === "/") {
        handleButtonClick("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        handleButtonClick("=");
      } else if (e.key === "Escape" || e.key === "Backspace") {
        handleButtonClick("C");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleButtonClick]);

  return (
    <Box sx={{ position: "relative" }}>
      <Tooltip title={isOpen ? "Close calculator" : "Open calculator for calculations"}>
        <Button
          variant="text"
          size="small"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close calculator" : "Open calculator"}
          aria-expanded={isOpen}
          startIcon={<Box component={CalculatorIcon} aria-hidden="true" sx={{ width: 16, height: 16, flexShrink: 0 }} />}
          sx={{
            minWidth: 0,
            width: { xs: 32, sm: 112 },
            px: { xs: 0, sm: 1.5 },
            justifyContent: { xs: "center", sm: "flex-start" },
            color: "text.secondary",
            "&:hover": { bgcolor: "muted", color: "text.primary" },
            "& .MuiButton-startIcon": { m: { xs: 0, sm: undefined } },
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {isOpen ? "Close" : "Calculator"}
          </Box>
        </Button>
      </Tooltip>

      {isOpen && (
        <Paper
          variant="outlined"
          sx={{
            position: "absolute",
            right: 0,
            top: 0,
            transform: "translateX(calc(100% + 0.5rem))",
            p: 1.5,
            width: 224,
            zIndex: (t) => t.zIndex.modal,
            boxShadow: 6,
            borderRadius: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "text.secondary" }}>
              Calculator
            </Box>
          </Box>

          <Box
            role="status"
            aria-live="polite"
            aria-label="Calculator display"
            sx={{ bgcolor: "secondary.main", borderRadius: "6px", p: 1.5, mb: 1, textAlign: "right" }}
          >
            <Box component="span" sx={{ fontFamily: "monospace", fontSize: "1.25rem" }}>
              {display.length > 12 ? parseFloat(display).toExponential(6) : display}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 0.5 }}>
            {buttons.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}>
                {row.map((btn) => (
                  <Button
                    key={btn}
                    variant={OPERATORS.includes(btn) ? "contained" : "outlined"}
                    {...(OPERATORS.includes(btn) && { color: "secondary" })}
                    size="small"
                    onClick={() => handleButtonClick(btn)}
                    aria-label={buttonLabels[btn] || btn}
                    sx={{
                      height: 36,
                      minWidth: 0,
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      ...(btn === "0" && { gridColumn: "span 2" }),
                      ...(btn === "C" && { gridColumn: "span 3" }),
                    }}
                  >
                    {btn}
                  </Button>
                ))}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
