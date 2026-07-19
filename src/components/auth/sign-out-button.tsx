"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";
import { useAuthStore } from "@/stores/auth-store";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        // Clear shared auth state immediately so the header updates without
        // waiting for the server round-trip.
        useAuthStore.getState().clear();
        signOut();
      }}
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
