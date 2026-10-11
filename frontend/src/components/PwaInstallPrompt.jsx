import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in this session
    const isDismissed = sessionStorage.getItem('fc_pwa_prompt_dismissed');
    if (isDismissed) return;

    const handleBeforeInstall = (e) => {
      // Prevent default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      sessionStorage.setItem('fc_pwa_prompt_dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('fc_pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Install Fouzas Creation App"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-white/95 backdrop-blur-md border border-blush-200/80 rounded-3xl p-4 shadow-elevated flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blush-500 to-gold-400 flex items-center justify-center text-white shrink-0 shadow-soft">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
            Install Fouzas Creation
          </h4>
          <p className="text-[11px] text-stone-500 truncate">
            Fast access, gift tracker & offline studio.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white text-xs font-semibold shadow-soft transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
