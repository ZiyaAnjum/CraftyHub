import React, { useRef, useEffect, useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, Flower2 } from 'lucide-react';

export const heroContent = {
  subtitle: 'MADE FOR YOUR SPECIAL MOMENTS',
  headingLine1: 'Crafted with Love',
  headingLine2: 'for Every Moment',
  paragraph: 'Customized gifts, hampers, bouquets and frames<br>designed around your story.',
  primaryButton: 'Explore Collections',
  badgeTop: 'HANDPICKED',
  badgeBottom: 'WITH LOVE',
  scrollText: 'SCROLL TO DISCOVER',
};

export function Hero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef(null);
  const id = useId();
  const topPathId = `badge-top-${id.replace(/:/g, '')}`;
  const bottomPathId = `badge-bottom-${id.replace(/:/g, '')}`;

  // Robust reduced-motion detection
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Ensure video autoplay works across all browsers
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      if (!prefersReducedMotion) {
        videoRef.current.play().catch((err) => {
          console.warn('Autoplay was prevented by browser policy:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [prefersReducedMotion]);

  const scrollToNext = () => {
    const nextSection = document.getElementById('home-featured-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  // Entrance animation variants (Item 7)
  const containerVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.3 },
        },
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
          },
        },
      };

  const itemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.3 },
        },
      }
    : {
        hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.7,
            ease: [0.25, 1, 0.5, 1],
          },
        },
      };

  return (
    <section
      className="relative min-h-[100svh] flex flex-col justify-between text-white px-[5%] overflow-hidden pt-28 sm:pt-32 md:pt-36 pb-24 select-none"
      style={{
        background: 'linear-gradient(135deg, #2B1620 0%, #5A2A3C 55%, #8A3B54 100%)',
      }}
    >
      {/* 1. Self-hosted Video Background with Ken Burns Slow Scale */}
      <motion.div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        animate={prefersReducedMotion ? { scale: 1 } : { scale: [1, 1.06] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/videos/hero-poster.jpg"
          aria-hidden="true"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-flowers.webm" type="video/webm" />
        </video>
      </motion.div>

      {/* 2. Triple Scrim Overlays for Readability (z-10) */}
      {/* Base dark tint */}
      <div
        className="absolute inset-0 z-10 pointer-events-none bg-[#14080e]/35"
        aria-hidden="true"
      />
      {/* Vertical gradient overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.45) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Soft radial dark scrim behind text */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden="true"
      />

      {/* 3. Circular Rotating Badge (Hidden <=992px) */}
      <motion.div
        aria-hidden="true"
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="hidden min-[993px]:flex absolute right-[3%] xl:right-[5%] top-[18%] w-[140px] h-[140px] rounded-full border border-white/40 items-center justify-center p-3 pointer-events-none z-20"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            className={`w-full h-full ${
              prefersReducedMotion ? '' : 'animate-rotate-slow'
            }`}
          >
            <defs>
              {/* Top arc (clockwise) */}
              <path
                id={topPathId}
                d="M 16,60 A 44,44 0 0,1 104,60"
                fill="none"
              />
              {/* Bottom arc (sweep=0 counter-clockwise so text is completely upright & reads left-to-right) */}
              <path
                id={bottomPathId}
                d="M 16,60 A 44,44 0 0,0 104,60"
                fill="none"
              />
            </defs>

            {/* HANDPICKED on top arc */}
            <text
              className="fill-white font-sans text-[10.5px] font-medium tracking-[3.5px]"
              style={{
                fontFamily: 'Inter, sans-serif',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
              }}
            >
              <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
                {heroContent.badgeTop}
              </textPath>
            </text>

            {/* WITH LOVE on bottom arc */}
            <text
              className="fill-white font-sans text-[10.5px] font-medium tracking-[3.5px]"
              style={{
                fontFamily: 'Inter, sans-serif',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
              }}
            >
              <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">
                {heroContent.badgeBottom}
              </textPath>
            </text>

            {/* Project token rose dots at arc connection points */}
            <circle cx="16" cy="60" r="2.5" fill="#C4486A" />
            <circle cx="104" cy="60" r="2.5" fill="#C4486A" />
          </svg>

          {/* Static centered flower icon */}
          <Flower2
            className="absolute w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      </motion.div>

      {/* 4. Central Hero Content Area (Centered, Max-width 900px, z-20) */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-20 w-full max-w-6xl mx-auto my-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[900px] w-full flex flex-col items-center text-center px-4"
        >
          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xs sm:text-sm tracking-[3px] uppercase mb-4 sm:mb-6 font-sans font-medium text-white"
            style={{
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.45)',
            }}
          >
            {heroContent.subtitle}
          </motion.p>

          {/* Heading (Exact Two Lines on Desktop, Playfair Display Italic Gold Accent) */}
          <motion.h1
            variants={itemVariants}
            className="font-display font-normal text-white text-center mb-4 sm:mb-6"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.5rem, min(6vw, 9vh), 5rem)',
              lineHeight: 1.1,
              textWrap: 'balance',
              textShadow: '0 2px 18px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {heroContent.headingLine1}
            <br />
            <span
              className="italic text-[#E0BC6A]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {heroContent.headingLine2}
            </span>
          </motion.h1>

          {/* Paragraph (Kept at max-w-[480px], weight 400, opacity 95) */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-[1.15rem] leading-[1.6] font-normal mb-8 sm:mb-10 opacity-95 max-w-[480px] font-sans text-white"
            style={{
              textWrap: 'balance',
              textShadow: '0 2px 18px rgba(0, 0, 0, 0.35)',
            }}
            dangerouslySetInnerHTML={{ __html: heroContent.paragraph }}
          />

          {/* Primary CTA Button (WCAG AA Deep Rose #C4486A, Gold Focus Ring) */}
          <motion.div variants={itemVariants}>
            <Link
              to="/explore"
              className={`bg-[#C4486A] hover:bg-[#b03b5a] text-white rounded-full px-8 py-4 inline-flex items-center gap-3 min-h-[44px] transition-all duration-300 font-sans font-medium text-sm sm:text-base tap-target shadow-[0_10px_25px_-5px_rgba(196,72,106,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] focus-visible:ring-offset-2 ${
                prefersReducedMotion ? '' : 'hover:-translate-y-0.5'
              }`}
            >
              <span>{heroContent.primaryButton}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* 5. Scroll Indicator (Relative z-20) */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center w-full relative z-20 pt-4"
      >
        <button
          type="button"
          onClick={scrollToNext}
          aria-label={heroContent.scrollText}
          className="flex flex-col items-center gap-2.5 group tap-target cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0BC6A] rounded-full p-2"
        >
          <motion.div
            animate={prefersReducedMotion ? { y: 0 } : { y: [0, 6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center group-hover:border-white transition-colors duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
          >
            <ArrowDown className="w-4 h-4 text-white" />
          </motion.div>
          <span
            className="hide-on-short-screen text-[10px] tracking-[2px] uppercase opacity-90 font-sans text-white group-hover:opacity-100 transition-opacity"
            style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)' }}
          >
            {heroContent.scrollText}
          </span>
        </button>
      </motion.div>
    </section>
  );
}
