export type PasswordStrengthLabel = "Weak" | "Medium" | "Strong";

export interface PasswordStrength {
  score: 0 | 1 | 2;
  label: PasswordStrengthLabel;
}

// Simple point-based heuristic for the signup form's strength meter — not a
// real entropy calculation, just enough signal to nudge users off "password1".
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Weak" };

  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^a-zA-Z0-9]/.test(password)) points++;

  if (points <= 1) return { score: 0, label: "Weak" };
  if (points <= 3) return { score: 1, label: "Medium" };
  return { score: 2, label: "Strong" };
}
