"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { handleAction } from "@/lib/action-handler";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function ProfileForm({
  username,
  fullName,
}: {
  username: string;
  fullName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await handleAction(updateProfile(formData));
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={fullName}
              placeholder="Your full name"
              required
              minLength={2}
              pattern="[A-Za-z][A-Za-z .'-]*"
              title="Enter a valid name (letters only)"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <SignOutButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
