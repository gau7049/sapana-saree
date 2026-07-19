"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password-strength";

const STRENGTH_BAR_COLOR = ["bg-destructive", "bg-yellow-500", "bg-green-600"];
const STRENGTH_TEXT_COLOR = [
  "text-destructive",
  "text-yellow-600 dark:text-yellow-500",
  "text-green-600 dark:text-green-500",
];

interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "onChange"> {
  showStrength?: boolean;
  /** When set, renders a live match/mismatch indicator against this value (use on a confirm-password field). */
  compareValue?: string;
  onValueChange?: (value: string) => void;
}

export function PasswordInput({
  showStrength,
  compareValue,
  onValueChange,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  const strength = showStrength && value ? getPasswordStrength(value) : null;
  const isConfirmField = compareValue !== undefined;
  const matches = isConfirmField && value.length > 0 && value === compareValue;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          {...props}
          type={visible ? "text" : "password"}
          className={cn("pr-10", props.className)}
          onChange={(e) => {
            setValue(e.target.value);
            onValueChange?.(e.target.value);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {strength && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-muted",
                  i <= strength.score && STRENGTH_BAR_COLOR[strength.score]
                )}
              />
            ))}
          </div>
          <p className={cn("text-xs", STRENGTH_TEXT_COLOR[strength.score])}>
            {strength.label}
            {strength.score < 2 && " — use 8+ characters with a mix of letters, numbers, and symbols"}
          </p>
        </div>
      )}

      {isConfirmField && value.length > 0 && (
        <p
          className={cn(
            "text-xs",
            matches ? "text-green-600 dark:text-green-500" : "text-destructive"
          )}
        >
          {matches ? "Passwords match" : "Passwords don't match"}
        </p>
      )}
    </div>
  );
}
