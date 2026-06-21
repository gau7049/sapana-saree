import { createMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = createMetadata({
  title: "Forgot Password",
  description: "Reset your Sapana Saree account password",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
