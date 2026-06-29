"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { common } from "@/lib/messages";
import type { ProductWithImages } from "@/types";

export function BuyNowButton({ product }: { product: ProductWithImages }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleBuyNow() {
    if (!user) {
      router.push(`/login?redirect=/sarees/${product.slug}`);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      const userName = profile?.full_name ?? user.email ?? "Customer";
      const userPhone = profile?.phone ?? undefined;

      const whatsappUrl = buildWhatsAppUrl({
        productTitle: product.title,
        productId: product.id,
        category: product.categories?.name ?? "Uncategorized",
        price: product.price,
        userName,
        userPhone,
      });

      await supabase.from("inquiries").insert({
        user_id: user.id,
        product_id: product.id,
        whatsapp_message: decodeURIComponent(
          whatsappUrl.split("?text=")[1] ?? ""
        ),
      });

      window.open(whatsappUrl, "_blank");
      toast.success("Opening WhatsApp... Your inquiry has been recorded.");
    } catch {
      toast.error(common.SOMETHING_WENT_WRONG);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="lg"
      className="w-full gap-2"
      onClick={handleBuyNow}
      disabled={loading || authLoading}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageCircle className="h-5 w-5" />
      )}
      Buy Now via WhatsApp
    </Button>
  );
}
