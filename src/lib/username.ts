const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,19}$/;
const AUTH_EMAIL_DOMAIN = "accounts.sapanasaree.internal";

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

// Supabase Auth requires an email address per account, but this app signs
// users up with just a username (a real email is optional, added later for
// verification/recovery). This synthesizes a fake-but-valid, unique address
// from the username so Supabase's auth.users table is happy — it's never
// used to actually send mail. See migration 006_username_auth.sql.
export function synthesizeAuthEmail(username: string): string {
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}
