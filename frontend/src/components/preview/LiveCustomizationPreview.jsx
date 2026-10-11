import React, { useId } from 'react';
import { Sparkles, Type, Palette, Layout, Info } from 'lucide-react';

export const PREVIEW_FONTS = [
  { id: 'playfair', name: 'Serif Classic', family: "'Playfair Display', Georgia, serif" },
  { id: 'inter', name: 'Modern Clean', family: "Inter, system-ui, sans-serif" },
  { id: 'georgia', name: 'Traditional', family: "Georgia, serif" },
  { id: 'courier', name: 'Typewriter', family: "'Courier New', Courier, monospace" },
];

export const PREVIEW_COLORS = [
  { id: 'rose', name: 'Rose Gold', hex: '#C4486A' },
  { id: 'gold', name: 'Regal Gold', hex: '#D4AF37' },
  { id: 'charcoal', name: 'Charcoal', hex: '#1E293B' },
  { id: 'crimson', name: 'Crimson', hex: '#991B1B' },
  { id: 'emerald', name: 'Emerald', hex: '#065F46' },
  { id: 'navy', name: 'Royal Navy', hex: '#1E3A8A' },
];

export const PREVIEW_THEMES = [
  { id: 'floral', name: 'Floral Filigree' },
  { id: 'minimal', name: 'Minimal Border' },
  { id: 'celebration', name: 'Celebration Stars' },
  { id: 'vintage', name: 'Classic Plaque' },
];

/**
 * Word wraps text into lines fitting within SVG width without cutting words mid-character.
 */
function wrapSvgText(text, maxCharsPerLine = 22) {
  if (!text || !text.trim()) return ['Your Custom Inscription'];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxCharsPerLine) {
        // Break very long single word
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          lines.push(word.slice(i, i + maxCharsPerLine));
        }
        currentLine = '';
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4); // Cap at 4 lines
}

export function LiveCustomizationPreview({
  text = '',
  subtext = '',
  font = "'Playfair Display', Georgia, serif",
  color = '#C4486A',
  theme = 'floral',
  onTextChange,
  onSubtextChange,
  onFontChange,
  onColorChange,
  onThemeChange,
}) {
  const componentId = useId();
  const gradId = `grad-${componentId.replace(/:/g, '')}`;

  const cleanText = text.trim() || 'Aarav & Diya';
  const cleanSubtext = subtext.trim();
  const lines = wrapSvgText(cleanText, 22);

  // Dynamic font sizing based on length
  const totalLength = cleanText.length;
  let fontSize = 28;
  let lineHeight = 34;
  if (totalLength > 60 || lines.length >= 4) {
    fontSize = 16;
    lineHeight = 22;
  } else if (totalLength > 32 || lines.length >= 3) {
    fontSize = 20;
    lineHeight = 26;
  } else if (totalLength > 18 || lines.length >= 2) {
    fontSize = 24;
    lineHeight = 30;
  }

  // Calculate vertical center
  const totalTextHeight = lines.length * lineHeight;
  const startY = 175 - totalTextHeight / 2 + (cleanSubtext ? -8 : 0);

  return (
    <div className="space-y-4">
      {/* SVG Canvas Preview Container (No horizontal overflow on 320px+ phones) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#FDFBF7] to-[#F5EFE6] border border-blush-200/80 shadow-soft p-2 sm:p-4">
        <div className="w-full max-w-[460px] mx-auto aspect-[5/3.6] relative select-none">
          <svg
            viewBox="0 0 500 360"
            className="w-full h-full drop-shadow-sm"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Handcrafted live custom preview"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FAF5EE" stopOpacity="0.95" />
              </linearGradient>

              {/* Drop shadow for decorative elements */}
              <filter id="preview-shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* Inner Plaque Background */}
            <rect
              x="20"
              y="20"
              width="460"
              height="320"
              rx="24"
              fill={`url(#${gradId})`}
              stroke={color}
              strokeWidth="2.5"
              strokeOpacity="0.75"
              filter="url(#preview-shadow)"
            />

            {/* THEME DECORATIONS */}
            {theme === 'floral' && (
              <g stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8">
                {/* Top-left floral corner */}
                <path d="M 36 60 C 36 44 48 36 64 36 C 56 46 56 56 36 60 Z" fill={color} fillOpacity="0.15" />
                <path d="M 40 40 Q 60 40 60 60" />
                <circle cx="68" cy="36" r="2.5" fill={color} />
                <circle cx="36" cy="68" r="2.5" fill={color} />

                {/* Top-right floral corner */}
                <path d="M 464 60 C 464 44 452 36 436 36 C 444 46 444 56 464 60 Z" fill={color} fillOpacity="0.15" />
                <path d="M 460 40 Q 440 40 440 60" />
                <circle cx="432" cy="36" r="2.5" fill={color} />
                <circle cx="464" cy="68" r="2.5" fill={color} />

                {/* Bottom-left floral corner */}
                <path d="M 36 300 C 36 316 48 324 64 324 C 56 314 56 304 36 300 Z" fill={color} fillOpacity="0.15" />
                <path d="M 40 320 Q 60 320 60 300" />
                <circle cx="68" cy="324" r="2.5" fill={color} />
                <circle cx="36" cy="292" r="2.5" fill={color} />

                {/* Bottom-right floral corner */}
                <path d="M 464 300 C 464 316 452 324 436 324 C 444 314 444 304 464 300 Z" fill={color} fillOpacity="0.15" />
                <path d="M 460 320 Q 440 320 440 300" />
                <circle cx="432" cy="324" r="2.5" fill={color} />
                <circle cx="464" cy="292" r="2.5" fill={color} />
              </g>
            )}

            {theme === 'minimal' && (
              <g stroke={color} strokeWidth="1" opacity="0.65" fill="none">
                <rect x="32" y="32" width="436" height="296" rx="16" strokeDasharray="6 4" />
                {/* Corner diamonds */}
                <polygon points="32,32 37,27 42,32 37,37" fill={color} stroke="none" />
                <polygon points="468,32 463,27 458,32 463,37" fill={color} stroke="none" />
                <polygon points="32,328 37,323 42,328 37,333" fill={color} stroke="none" />
                <polygon points="468,328 463,323 458,328 463,333" fill={color} stroke="none" />
              </g>
            )}

            {theme === 'celebration' && (
              <g fill={color} opacity="0.75">
                {/* Little 4-point stars */}
                <path d="M 70 55 Q 70 65 60 65 Q 70 65 70 75 Q 70 65 80 65 Q 70 65 70 55" />
                <path d="M 430 55 Q 430 65 420 65 Q 430 65 430 75 Q 430 65 440 65 Q 430 65 430 55" />
                <path d="M 90 295 Q 90 305 80 305 Q 90 305 90 315 Q 90 305 100 305 Q 90 305 90 295" />
                <path d="M 410 295 Q 410 305 400 305 Q 410 305 410 315 Q 410 305 420 305 Q 410 305 410 295" />
                <circle cx="250" cy="46" r="3" />
                <circle cx="250" cy="314" r="3" />
              </g>
            )}

            {theme === 'vintage' && (
              <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.7">
                <path d="M 50 45 L 450 45" />
                <path d="M 50 315 L 450 315" />
                <circle cx="250" cy="45" r="4" fill={color} />
                <circle cx="250" cy="315" r="4" fill={color} />
                <path d="M 45 60 L 45 300" strokeDasharray="3 3" />
                <path d="M 455 60 L 455 300" strokeDasharray="3 3" />
              </g>
            )}

            {/* Studio Brand Header Mark */}
            <text
              x="250"
              y="68"
              textAnchor="middle"
              fill={color}
              opacity="0.65"
              fontSize="9"
              letterSpacing="3"
              style={{ fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', fontWeight: 600 }}
            >
              FOUZAS CREATION BESPOKE
            </text>

            {/* Custom Inscription Text (React JSX escapes lines automatically) */}
            <text
              x="250"
              textAnchor="middle"
              fill={color}
              style={{
                fontFamily: font,
                fontSize: `${fontSize}px`,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {lines.map((lineText, idx) => (
                <tspan
                  key={idx}
                  x="250"
                  y={startY + idx * lineHeight}
                >
                  {lineText}
                </tspan>
              ))}
            </text>

            {/* Optional Subtext / Date */}
            {cleanSubtext && (
              <text
                x="250"
                y={startY + lines.length * lineHeight + 12}
                textAnchor="middle"
                fill={color}
                opacity="0.8"
                fontSize="12"
                letterSpacing="1.5"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                {cleanSubtext}
              </text>
            )}

            {/* Bottom Subtle Tagline */}
            <text
              x="250"
              y="305"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="8"
              letterSpacing="2"
              style={{ fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}
            >
              Handcrafted in Bengaluru
            </text>
          </svg>
        </div>

        {/* Clear Approximation Disclaimer Banner */}
        <div className="mt-2.5 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900 leading-tight">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Preview approximation:</strong> Final physical piece will feature authentic handcrafted calligraphy, laser precision, or framing embellishments adjusted by our artisan.
          </p>
        </div>
      </div>

      {/* Interactive Controls (Mobile-First Friendly) */}
      <div className="bg-white rounded-2xl p-4 border border-blush-100 shadow-2xs space-y-3.5">
        {/* 1. Custom Text Input */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blush-600" />
              <span>Custom Text / Inscription</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">{text.length}/80 chars</span>
          </label>
          <input
            type="text"
            maxLength={80}
            value={text}
            onChange={(e) => onTextChange?.(e.target.value)}
            placeholder="e.g. Aarav & Diya, Happy 25th Anniversary..."
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-xs sm:text-sm focus:bg-white focus:border-blush-500 transition-colors"
          />
        </div>

        {/* 2. Optional Subtitle / Date */}
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">
            Optional Date / Sub-caption (e.g. 14.02.2025, Forever & Always)
          </label>
          <input
            type="text"
            maxLength={40}
            value={subtext}
            onChange={(e) => onSubtextChange?.(e.target.value)}
            placeholder="e.g. 14th February 2025"
            className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-xs focus:bg-white focus:border-blush-500 transition-colors"
          />
        </div>

        {/* 3. Font Selection Pills */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            Typography Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PREVIEW_FONTS.map((f) => {
              const isSelected = font === f.family;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFontChange?.(f.family)}
                  className={`px-2.5 py-2 rounded-xl border text-xs text-center transition-all ${
                    isSelected
                      ? 'border-blush-600 bg-blush-50 text-blush-900 font-bold shadow-2xs'
                      : 'border-stone-200 bg-cream-50/40 text-stone-600 hover:border-stone-300'
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Color Swatches */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            <Palette className="w-3.5 h-3.5 text-gold-600" />
            <span>Accent Inscription Color</span>
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {PREVIEW_COLORS.map((c) => {
              const isSelected = color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onColorChange?.(c.hex)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-stone-900 scale-110 shadow-xs'
                      : 'hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={`Select ${c.name} color`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Theme / Frame Borders */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            <Layout className="w-3.5 h-3.5 text-blush-600" />
            <span>Frame & Border Style</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PREVIEW_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onThemeChange?.(t.id)}
                  className={`px-2 py-1.5 rounded-xl border text-[11px] text-center font-medium transition-all ${
                    isSelected
                      ? 'border-gold-500 bg-gold-50/80 text-stone-900 font-bold'
                      : 'border-stone-200 bg-cream-50/30 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
