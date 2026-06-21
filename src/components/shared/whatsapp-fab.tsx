"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGenericWhatsAppUrl } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export function WhatsAppFAB() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!WHATSAPP_NUMBER) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={buildGenericWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
