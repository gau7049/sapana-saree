import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{SITE_NAME}</h1>
      </Link>
      {children}
    </div>
  );
}
