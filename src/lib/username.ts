const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,19}$/;
const AUTH_EMAIL_DOMAIN = "accounts.sapanasaree.internal";

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function synthesizeAuthEmail(username: string): string {
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}
