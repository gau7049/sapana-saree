import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  checkBrevoHealth,
  checkCloudinaryHealth,
  type ServiceHealth,
} from "@/lib/service-health";

export default async function AdminSettingsPage() {
  const [brevoHealth, cloudinaryHealth] = await Promise.all([
    checkBrevoHealth(),
    checkCloudinaryHealth(),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure your store settings.
      </p>

      <div className="mt-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Configure store name, contact details, and WhatsApp number.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Store settings are configured via environment variables. Update
              them in your Netlify dashboard or <code>.env.local</code> file:
            </p>
            <ul className="mt-3 space-y-1 list-disc pl-5">
              <li>
                <code>NEXT_PUBLIC_SITE_URL</code> — Your domain
              </li>
              <li>
                <code>NEXT_PUBLIC_WHATSAPP_NUMBER</code> — WhatsApp number
                (with country code, e.g., 91XXXXXXXXXX)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              How admin login currently works.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Accounts sign in with a username and password (no email
              required). Any account with the <code>admin</code> or{" "}
              <code>super_admin</code> role can access this dashboard —
              promote an account&apos;s role directly in the Supabase{" "}
              <code>profiles</code> table.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External Services</CardTitle>
            <CardDescription>
              Connected services and their status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <ServiceRow
                name="Cloudinary"
                description="Image storage"
                health={cloudinaryHealth}
              />
              <ServiceRow
                name="Brevo"
                description="Email service (verification & password reset)"
                health={brevoHealth}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Status is checked live against each service&apos;s API on page load —
              &ldquo;Connection failed&rdquo; usually means an invalid API key or an
              unverified sender.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const HEALTH_BADGE: Record<ServiceHealth, { label: string; className: string }> = {
  ok: {
    label: "Connected",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  error: {
    label: "Connection failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  not_configured: {
    label: "Not configured",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
};

function ServiceRow({
  name,
  description,
  health,
}: {
  name: string;
  description: string;
  health: ServiceHealth;
}) {
  const badge = HEALTH_BADGE[health];
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    </div>
  );
}
