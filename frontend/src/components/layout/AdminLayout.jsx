import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Operations, alerts & metrics',
    },
    {
      to: '/admin/orders',
      label: 'Orders',
      icon: ShoppingBag,
      description: 'Customer enquiries & workflow',
    },
    {
      to: '/admin/items',
      label: 'Catalogue Items',
      icon: Package,
      description: 'Manage gifts, pricing & visibility',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-stone-900 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blush-500 to-gold-400 flex items-center justify-center text-white shadow-soft">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-stone-900 tracking-tight">Fouzas</span>
            <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-gold-700 bg-gold-50 border border-gold-200 px-1.5 py-0.5 rounded-full">Admin</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-stone-900/40 backdrop-blur-xs pt-14">
          <div className="bg-white border-b border-stone-200 px-4 py-6 space-y-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between p-3 rounded-2xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blush-50 text-blush-800 font-semibold'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-blush-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200 text-stone-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-blush-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Storefront</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-stone-200/90 shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blush-500 to-gold-400 flex items-center justify-center text-white shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif font-bold text-lg text-stone-900 tracking-tight leading-none">
                Fouzas Creation
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-400">
                <ShieldCheck className="w-3 h-3 text-gold-600" />
                <span>Admin Console</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Management
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs lg:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blush-50 text-blush-900 font-semibold shadow-xs border border-blush-100/80'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-stone-400 group-hover:text-blush-600 transition-colors" />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cream-100 text-stone-500 border border-stone-200/60">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </NavLink>
          ))}

          <div className="pt-6 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Quick Links
          </div>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs lg:text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-stone-400" />
            <span>Open Storefront</span>
          </Link>
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-stone-100 bg-cream-50/50">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-stone-900 truncate">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[11px] text-stone-400 truncate">
                {user?.email || 'admin@fouzascreation.com'}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-800 border border-gold-200">
              Admin
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold border border-stone-200/80 transition-all shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
