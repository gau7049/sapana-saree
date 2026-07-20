"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { saveAddress } from "@/actions/profile";
import { handleAction } from "@/lib/action-handler";

export function AddressForm({
  addressLine1,
  addressLine2,
  city,
  state,
  country,
  postalCode,
  phone,
  onSuccess,
}: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await handleAction(saveAddress(formData), { onSuccess });
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              name="address_line1"
              defaultValue={addressLine1}
              placeholder="House no., street"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2 (optional)</Label>
            <Input
              id="address_line2"
              name="address_line2"
              defaultValue={addressLine2}
              placeholder="Apartment, suite, landmark"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={city} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={state} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={country || "India"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">PIN/ZIP Code</Label>
              <Input
                id="postal_code"
                name="postal_code"
                defaultValue={postalCode}
                placeholder="e.g., 400001"
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                maxLength={6}
                title="Enter a valid 6-digit PIN code"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={phone}
              placeholder="e.g., 9876543210"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              title="Enter a valid 10-digit mobile number"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Address
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
