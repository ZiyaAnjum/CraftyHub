import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, Sparkles, Package } from 'lucide-react';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found | Fouzas Creation';
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blush-100 text-rose-800 text-xs font-semibold tracking-wider uppercase border border-blush-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>404 - Page Not Found</span>
        </div>

        {/* Heading & Copy */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
            Looking for something special?
          </h1>
          <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            The page you are looking for may have been moved, renamed, or is currently being handcrafted. Let’s guide you back to our bespoke studio.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all shadow-soft active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            to="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-blush-50 text-stone-900 font-semibold text-sm border border-stone-200 transition-all shadow-xs active:scale-[0.98]"
          >
            <Compass className="w-4 h-4 text-rose-600" />
            <span>Explore Catalogue</span>
          </Link>

          <Link
            to="/track"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-blush-50 text-stone-900 font-semibold text-sm border border-stone-200 transition-all shadow-xs active:scale-[0.98]"
          >
            <Package className="w-4 h-4 text-gold-600" />
            <span>Track Order</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
