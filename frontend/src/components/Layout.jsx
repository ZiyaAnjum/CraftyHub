import React from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Home, Compass, Gift, Package, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/create', label: 'Create', icon: Gift, isPrimary: true },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: user ? '/account' : '/signin', label: user ? 'Account' : 'Sign In', icon: User },
  ];

  const pageVariants = shouldReduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
        exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
      };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-800">
      {/* Desktop Top Navigation Bar */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blush-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blush-500 to-gold-400 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform duration-300">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 group-hover:text-blush-600 transition-colors">
                Fouzas Creation
              </span>
              <p className="text-xs text-stone-500 font-sans tracking-wider">
                Made for your special moments
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 lg:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target ${
                  isActive
                    ? 'text-blush-600 bg-blush-50/80 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target ${
                  isActive
                    ? 'text-blush-600 bg-blush-50/80 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                }`
              }
            >
              Explore
            </NavLink>

            <NavLink
              to="/create"
              className={({ isActive }) =>
                `mx-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all tap-target flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-blush-500 to-blush-600 text-white shadow-soft ring-2 ring-blush-200'
                    : 'bg-blush-50 text-blush-600 hover:bg-blush-100'
                }`
              }
            >
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span>Create Gift</span>
            </NavLink>

            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target ${
                  isActive
                    ? 'text-blush-600 bg-blush-50/80 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                }`
              }
            >
              My Orders
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink
                to="/admin/gifts"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target ${
                    isActive
                      ? 'text-purple-700 bg-purple-50 font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                  }`
                }
              >
                Manage Gifts
              </NavLink>
            )}

            {user ? (
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `ml-2 px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target flex items-center gap-2 ${
                    isActive
                      ? 'text-blush-700 bg-blush-50 font-semibold'
                      : 'text-stone-700 hover:bg-stone-100/80'
                  }`
                }
              >
                <div className="w-7 h-7 rounded-full bg-gold-200 text-stone-800 flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[120px] truncate">{user.name?.split(' ')[0]}</span>
              </NavLink>
            ) : (
              <NavLink
                to="/signin"
                className="ml-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-soft tap-target"
              >
                Sign In
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blush-100/80 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blush-500 to-gold-400 flex items-center justify-center text-white shadow-xs">
            <Gift className="w-4 h-4" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
            Fouzas Creation
          </span>
        </Link>
        {user ? (
          <Link
            to="/account"
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-blush-50 text-xs font-medium text-blush-700 border border-blush-100"
          >
            <span className="w-5 h-5 rounded-full bg-gold-300 text-stone-900 flex items-center justify-center text-[10px] font-bold">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </span>
            <span className="max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
          </Link>
        ) : (
          <Link
            to="/signin"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-900 text-white"
          >
            Sign in
          </Link>
        )}
      </header>

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
