"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppIcon } from "@/components/shared/icons";
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
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1da851]"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
