"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Coins, Loader2 } from "lucide-react";
import { adjustUserPoints } from "@/actions/loyalty";
import { handleAction } from "@/lib/action-handler";

export function AdminPointsAdjust({
  userId,
  pointsBalance,
}: {
  userId: string;
  pointsBalance: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"submit" | "zero" | null>(null);

  async function submit(points: number) {
    if (!Number.isInteger(points) || points === 0) return;
    setLoading(points === -pointsBalance ? "zero" : "submit");
    await handleAction(adjustUserPoints(userId, points, note || undefined), {
      onSuccess: () => {
        setOpen(false);
        setAmount("");
        setNote("");
        router.refresh();
      },
    });
    setLoading(null);
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Coins className="h-3.5 w-3.5" />
        Adjust points
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust loyalty points</DialogTitle>
            <DialogDescription>
              Current balance: {pointsBalance} points. Enter a positive number
              to add points, or a negative number to remove them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="points-amount">Points (+/-)</Label>
              <Input
                id="points-amount"
                type="number"
                placeholder="e.g. 10 or -10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points-note">Note (optional)</Label>
              <Input
                id="points-note"
                placeholder="Reason for this adjustment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <Button
              variant="outline"
              disabled={loading !== null || pointsBalance === 0}
              onClick={() => submit(-pointsBalance)}
            >
              {loading === "zero" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zero out balance
            </Button>
            <div className="flex gap-2">
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button
                disabled={loading !== null || !Number.isInteger(Number(amount)) || Number(amount) === 0}
                onClick={() => submit(Number(amount))}
              >
                {loading === "submit" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
