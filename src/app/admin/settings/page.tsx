import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSettingsPage() {
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
              How to manage admin users.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              To promote a user to admin, run this SQL in the Supabase SQL
              editor:
            </p>
            <pre className="mt-2 rounded-md bg-muted p-3 text-xs">
              {`UPDATE profiles\nSET role = 'admin'\nWHERE email = 'user@example.com';`}
            </pre>
            <p className="mt-2">
              Available roles: <code>customer</code>, <code>admin</code>,{" "}
              <code>super_admin</code>
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
                name="Supabase"
                description="Database + Auth"
                configured={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
              />
              <ServiceRow
                name="Cloudinary"
                description="Image storage"
                configured={!!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
              />
              <ServiceRow
                name="Resend"
                description="Email service"
                configured={!!process.env.RESEND_API_KEY}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ServiceRow({
  name,
  description,
  configured,
}: {
  name: string;
  description: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          configured
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        }`}
      >
        {configured ? "Connected" : "Not configured"}
      </span>
    </div>
  );
}
