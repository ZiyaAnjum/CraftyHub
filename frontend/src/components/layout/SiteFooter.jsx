import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Shield, Package, Gift, Compass } from 'lucide-react';
import { getShopWhatsAppUrl } from '../../lib/whatsapp';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = getShopWhatsAppUrl(
    'Hello Fouzas Creation! I would like to enquire about bespoke gifts.'
  );

  return (
    <footer className="bg-cream-100/80 border-t border-blush-100 mt-auto text-stone-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-blush-500 to-gold-400 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900 group-hover:text-blush-600 transition-colors">
                Fouzas Creation
              </span>
            </Link>
            <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
              Handcrafted bespoke gifts, floral hampers, custom frames, and personalized keepsakes made with love in Bengaluru. Every creation tells your unique story.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="text-stone-600 hover:text-blush-600 transition-colors">
                  Explore Catalog
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-stone-600 hover:text-blush-600 transition-colors">
                  Design a Gift
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-stone-600 hover:text-blush-600 transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-stone-600 hover:text-blush-600 transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Trust & Support
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-stone-600 hover:text-blush-600 transition-colors font-medium">
                  Privacy Policy & Consent
                </Link>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-600 hover:text-emerald-700 transition-colors"
                >
                  WhatsApp Studio Support
                </a>
              </li>
              <li>
                <Link to="/account" className="text-stone-600 hover:text-blush-600 transition-colors">
                  Account Settings
                </Link>
              </li>
              <li>
                <span className="text-stone-400">Bengaluru, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-blush-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {currentYear} Fouzas Creation. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <span>Handmade with</span>
            <Heart className="w-3 h-3 text-blush-500 fill-blush-500 inline" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
