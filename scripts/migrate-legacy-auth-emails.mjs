import { createClient } from "@supabase/supabase-js";

const AUTH_EMAIL_DOMAIN = "accounts.sapanasaree.internal";
const synthesizeAuthEmail = (username) => `${username}@${AUTH_EMAIL_DOMAIN}`;

// Explicit, reviewed mapping — not derived algorithmically, since this is a
// one-time migration of real production accounts.
const LEGACY_ACCOUNTS = [
  { email: "gautampaliwal.ce@gmail.com", username: "gautampaliwalce" },
  { email: "sapana0@gmail.com", username: "sapana0" },
];

const THROWAWAY_TEST_EMAIL = "sapana.test.admin@gmail.com";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set.");
    console.error("Run with: node --env-file=.env.local scripts/migrate-legacy-auth-emails.mjs");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  for (const account of LEGACY_ACCOUNTS) {
    const user = list.users.find((u) => u.email === account.email);
    if (!user) {
      console.warn(`No auth.users row found for ${account.email}, skipping.`);
      continue;
    }
    const newEmail = synthesizeAuthEmail(account.username);
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Updated ${account.email} -> ${newEmail} (username: ${account.username})`);
  }

  const testUser = list.users.find((u) => u.email === THROWAWAY_TEST_EMAIL);
  if (testUser) {
    const { error } = await admin.auth.admin.deleteUser(testUser.id);
    if (error) throw error;
    console.log(`Deleted throwaway test account ${THROWAWAY_TEST_EMAIL}`);
  } else {
    console.log(`Throwaway test account ${THROWAWAY_TEST_EMAIL} not found, nothing to delete.`);
  }

  console.log("Done.");
}

main()
  .then(() => process.exitCode = 0)
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  });
