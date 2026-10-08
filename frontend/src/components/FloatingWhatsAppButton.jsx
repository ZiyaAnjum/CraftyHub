import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { getShopWhatsAppUrl } from '../lib/whatsapp';

export function FloatingWhatsAppButton() {
  const shouldReduceMotion = useReducedMotion();
  const whatsappUrl = getShopWhatsAppUrl(
    'Hello Fouzas Creation! I would like to enquire about placing a custom gift order.'
  );

  // If WhatsApp number is not configured or returns '#', do not render broken button
  if (!whatsappUrl || whatsappUrl === '#') {
    return null;
  }

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="fixed z-40 bottom-20 right-4 sm:bottom-24 sm:right-6 md:bottom-8 md:right-8 flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-elevated hover:shadow-2xl transition-colors duration-200 tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
      style={{
        boxShadow: '0 8px 24px -4px rgba(37, 211, 102, 0.45)',
      }}
    >
      <MessageCircle className="w-5 h-5 fill-current" />
      <span className="text-xs sm:text-sm font-semibold tracking-wide">
        Order on WhatsApp
      </span>
    </motion.a>
  );
}
