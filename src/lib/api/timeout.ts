import { API_TIMEOUT_MS } from "@/lib/constants";
import { common } from "@/lib/messages";

// Races a promise against a timer so a hung external call (Cloudinary, Brevo)
// fails fast instead of leaving the request hanging indefinitely.
export function withTimeout<T>(
  promise: Promise<T>,
  ms = API_TIMEOUT_MS,
  message = common.REQUEST_TIMEOUT
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
