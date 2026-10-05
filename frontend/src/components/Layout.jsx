import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { pageTransition } from '../lib/motion';
import { Home, Compass, Gift, Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from './layout/SiteHeader';

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const pageVariants = shouldReduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : pageTransition;

  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/create', label: 'Create', icon: Gift, isPrimary: true },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: user ? '/account' : '/signin', label: user ? 'Account' : 'Sign In', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-800">
      {/* Site Header across the site */}
      <SiteHeader />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar (Design for 360px+ width) */}
      <nav
        aria-label="Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-blush-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-bottom"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center tap-target relative -top-3 ${
                      isActive ? 'scale-105' : ''
                    } transition-transform`
                  }
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blush-500 to-blush-600 text-white flex items-center justify-center shadow-elevated border-2 border-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-blush-600 mt-0.5">
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 rounded-xl tap-target transition-colors ${
                    isActive ? 'text-blush-600 font-semibold' : 'text-stone-500 hover:text-stone-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px]' : 'stroke-1.5'}`} />
                    <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
                    {isActive && (
                      <span className="w-1 h-1 rounded-full bg-blush-500 mt-0.5"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
