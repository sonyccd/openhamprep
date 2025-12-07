import { useState } from "react";
import { Calculator as CalculatorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalculatorProps {
  className?: string;
}

export function Calculator({ className }: CalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

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

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
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

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const buttons = [
    ["C", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  const handleButtonClick = (btn: string) => {
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
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <CalculatorIcon className="w-4 h-4" />
        {isOpen ? "Close" : "Calculator"}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-0 translate-x-[calc(100%+0.5rem)] bg-card border border-border rounded-lg p-3 shadow-lg w-56 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Calculator</span>
          </div>
          
          <div className="bg-secondary rounded-md p-3 mb-2 text-right">
            <span className="font-mono text-xl text-foreground">
              {display.length > 12 ? parseFloat(display).toExponential(6) : display}
            </span>
          </div>

          <div className="grid gap-1">
            {buttons.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-1">
                {row.map((btn) => (
                  <Button
                    key={btn}
                    variant={["+", "-", "×", "÷", "=", "C"].includes(btn) ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 font-mono text-sm",
                      btn === "0" && "col-span-2",
                      btn === "C" && "col-span-3"
                    )}
                    onClick={() => handleButtonClick(btn)}
                  >
                    {btn}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

}
