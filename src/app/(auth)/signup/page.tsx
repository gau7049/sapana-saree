import { createMetadata } from "@/lib/seo";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = createMetadata({
  title: "Create Account",
  description: "Create your Sapana Saree account to start shopping",
  path: "/signup",
});

export default function SignupPage() {
  return <SignupForm />;
}
