import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Flower2, Search, User, Package, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getShopWhatsAppUrl } from '../../lib/whatsapp';

export function SiteHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const { scrollY } = useScroll();

  // Detect prefers-reduced-motion safely
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Update scrolled state at ~40px scroll
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  const isHome = location.pathname === '/';
  const isSolid = !isHome || scrolled;

  // Close mobile menu on route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle body scroll locking and Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          toggleRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Focus first link in modal
      const timer = setTimeout(() => {
        const firstFocusable = menuRef.current?.querySelector('a, button');
        firstFocusable?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/explore', label: 'Explore' },
    { to: '/create', label: 'Create' },
    { to: '/track', label: 'Track' },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ to: '/admin/orders', label: 'Admin' });
  }

  const whatsappUrl = getShopWhatsAppUrl('Hello Fouzas Creation, I would like to enquire about bespoke gifts.');
  const isWhatsAppExternal = whatsappUrl !== '#';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-[76px] sm:h-[84px] md:h-[90px] flex items-center transition-all duration-300 ${
          isSolid
            ? 'bg-[#FBF5EC] border-b border-blush-100 shadow-sm text-stone-900'
            : 'bg-black/15 backdrop-blur-md border-b border-white/10 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between relative">
          {/* 1. Left: Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-[0.8rem] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] focus-visible:ring-offset-2 rounded-lg py-1 px-1.5 -ml-1.5"
            style={!isSolid ? { textShadow: '0 2px 12px rgba(0,0,0,0.35)' } : undefined}
          >
            <Flower2
              className={`w-5 h-5 transition-transform duration-300 group-hover:rotate-12 ${
                isSolid ? 'text-[#C4486A]' : 'text-rose-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
              }`}
              strokeWidth={2}
            />
            <span
              className={`text-[1.15rem] font-medium tracking-[2px] uppercase select-none transition-colors ${
                isSolid ? 'text-stone-900' : 'text-white'
              }`}
            >
              FOUZAS CREATION
            </span>
          </Link>

          {/* 2. Center Nav (Absolutely centered, hidden <=992px) */}
          <nav
            aria-label="Main Navigation"
            className="hidden min-[993px]:flex items-center gap-10 absolute left-1/2 -translate-x-1/2 text-[0.9rem] font-light"
            style={!isSolid ? { textShadow: '0 2px 12px rgba(0,0,0,0.35)' } : undefined}
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] rounded-sm ${
                    isActive
                      ? isSolid
                        ? 'text-stone-950 font-normal'
                        : 'text-white font-medium'
                      : isSolid
                        ? 'text-stone-600 hover:text-stone-900'
                        : 'text-white/85 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.label}</span>
                    {isActive && (
                      <span
                        className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C4486A] shadow-[0_1px_4px_rgba(196,72,106,0.6)]"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 3. Right: Search, Account, Get in Touch, Hamburger */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search Button */}
            <Link
              to="/explore"
              aria-label="Search gifts catalog"
              className={`p-2 rounded-full tap-target transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] ${
                isSolid
                  ? 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/70'
                  : 'text-white/95 hover:text-white hover:bg-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
              }`}
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Account / Orders Icon Button */}
            <Link
              to={user ? '/orders' : '/signin'}
              aria-label={user ? 'My Orders and Account' : 'Sign in to account'}
              className={`p-2 rounded-full tap-target relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] ${
                isSolid
                  ? 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/70'
                  : 'text-white/95 hover:text-white hover:bg-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
              }`}
            >
              {user ? <Package className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </Link>

            {/* Outline pill button "Get in Touch" */}
            {isWhatsAppExternal ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase px-5 py-2.5 rounded-full border transition-all duration-200 tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] focus-visible:ring-offset-2 ${
                  isSolid
                    ? 'border-stone-300 text-stone-800 hover:border-stone-500 hover:bg-stone-50'
                    : 'border-white/40 text-white hover:border-white hover:bg-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
                }`}
                style={!isSolid ? { textShadow: '0 2px 10px rgba(0,0,0,0.35)' } : undefined}
              >
                <span>Get in Touch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Link
                to="/explore"
                className={`hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase px-5 py-2.5 rounded-full border transition-all duration-200 tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] focus-visible:ring-offset-2 ${
                  isSolid
                    ? 'border-stone-300 text-stone-800 hover:border-stone-500 hover:bg-stone-50'
                    : 'border-white/40 text-white hover:border-white hover:bg-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
                }`}
                style={!isSolid ? { textShadow: '0 2px 10px rgba(0,0,0,0.35)' } : undefined}
              >
                <span>Get in Touch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Mobile Hamburger Toggle (Visible <=992px) */}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu-overlay"
              className={`min-[993px]:hidden p-2 rounded-xl tap-target transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] ${
                isSolid
                  ? 'text-stone-800 hover:text-stone-950 hover:bg-stone-100/70'
                  : 'text-white hover:bg-white/10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for non-Home pages so content starts below fixed header */}
      {!isHome && (
        <div className="h-[76px] sm:h-[84px] md:h-[90px]" aria-hidden="true" />
      )}

      {/* Full-screen Mobile Overlay Menu (Framer Motion, <=992px) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu-overlay"
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.25 }}
            className="fixed inset-0 z-50 bg-[#1c1417]/95 backdrop-blur-xl text-white flex flex-col justify-between p-6 sm:p-10 min-[993px]:hidden"
          >
            {/* Top Bar inside Overlay */}
            <div className="flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3"
              >
                <Flower2 className="w-6 h-6 text-[#C4486A]" />
                <span className="text-lg font-medium tracking-[2px] uppercase">
                  FOUZAS CREATION
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 tap-target text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stacked Large Nav Links */}
            <nav className="flex flex-col gap-6 my-auto text-left py-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `font-display text-3xl sm:text-4xl transition-colors tap-target ${
                      isActive ? 'text-[#C4486A] font-medium' : 'text-stone-200 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {user ? (
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className="font-display text-2xl text-stone-300 hover:text-white tap-target"
                >
                  My Profile ({user.name?.split(' ')[0]})
                </Link>
              ) : (
                <Link
                  to="/signin"
                  onClick={() => setIsOpen(false)}
                  className="font-display text-2xl text-[#C4486A] hover:text-white tap-target"
                >
                  Sign In / Register
                </Link>
              )}
            </nav>

            {/* Bottom Actions inside Overlay */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {isWhatsAppExternal ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#C4486A] hover:bg-[#b03b5a] text-white font-medium text-sm tracking-wide uppercase shadow-[0_10px_25px_-5px_rgba(196,72,106,0.4)] tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B]"
                >
                  <span>Chat on WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  to="/explore"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#C4486A] hover:bg-[#b03b5a] text-white font-medium text-sm tracking-wide uppercase shadow-[0_10px_25px_-5px_rgba(196,72,106,0.4)] tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B]"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <p className="text-xs text-stone-400 tracking-wider uppercase text-center sm:text-right">
                Made for your special moments
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
