import { createMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Set a new password for your account",
  path: "/reset-password",
});

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
