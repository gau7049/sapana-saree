import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your Sapana Saree account",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
