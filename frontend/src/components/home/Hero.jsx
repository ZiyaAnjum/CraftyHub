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
    <section className="relative min-h-[100svh] flex flex-col justify-between text-white px-[5%] overflow-hidden bg-gradient-to-b from-[#F6D5DA] via-[#FBF5EC] to-[#F6D5DA] pt-28 sm:pt-32 md:pt-36 pb-24 select-none">
      {/* 1. Self-hosted Video Background with Ken Burns Slow Scale */}
      <motion.div
        className="absolute inset-0 -z-20 overflow-hidden pointer-events-none"
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

      {/* 2. Overlays & Scrims for Readability (Item 8) */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-black/25 via-black/10 to-black/30"
        aria-hidden="true"
      />
      {/* Soft radial dark scrim behind text */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden="true"
      />

      {/* 3. Circular Rotating Badge (Item 5 & 6, Hidden <=992px) */}
      <motion.div
        aria-hidden="true"
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="hidden min-[993px]:flex absolute right-[3%] xl:right-[5%] top-[18%] w-[140px] h-[140px] rounded-full border border-white/30 items-center justify-center p-3 pointer-events-none z-10"
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
              className="fill-white font-sans text-[10.5px] font-light tracking-[3.5px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
                {heroContent.badgeTop}
              </textPath>
            </text>

            {/* WITH LOVE on bottom arc (now upright!) */}
            <text
              className="fill-white font-sans text-[10.5px] font-light tracking-[3.5px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
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
            className="absolute w-6 h-6 text-white/90"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      </motion.div>

      {/* 4. Central Hero Content Area (Item 2 & 3: Centered, No Negative Margin, Max-width 900px) */}
      <div className="flex-1 flex flex-col justify-center items-center relative w-full max-w-6xl mx-auto my-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[900px] w-full flex flex-col items-center text-center px-4"
        >
          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xs sm:text-sm tracking-[3px] uppercase mb-4 sm:mb-6 opacity-90 font-sans font-normal text-stone-100"
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
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {heroContent.headingLine1}
            <br />
            <span
              className="italic text-[#C9A24B]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {heroContent.headingLine2}
            </span>
          </motion.h1>

          {/* Paragraph (Kept at max-w-[480px]) */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-[1.15rem] leading-[1.6] font-light mb-8 sm:mb-10 opacity-90 max-w-[480px] font-sans text-stone-100"
            style={{ textWrap: 'balance' }}
            dangerouslySetInnerHTML={{ __html: heroContent.paragraph }}
          />

          {/* Primary CTA Button (WCAG AA Deep Rose #C4486A, Gold Focus Ring) */}
          <motion.div variants={itemVariants}>
            <Link
              to="/explore"
              className={`bg-[#C4486A] hover:bg-[#b03b5a] text-white rounded-full px-8 py-4 inline-flex items-center gap-3 min-h-[44px] transition-all duration-300 font-sans font-medium text-sm sm:text-base tap-target shadow-[0_10px_25px_-5px_rgba(196,72,106,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-2 ${
                prefersReducedMotion ? '' : 'hover:-translate-y-0.5'
              }`}
            >
              <span>{heroContent.primaryButton}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* 5. Scroll Indicator (Item 3 & 7: 2rem clearance, gentle bobbing, label hidden on short screens) */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center w-full z-10 pt-4"
      >
        <button
          type="button"
          onClick={scrollToNext}
          aria-label={heroContent.scrollText}
          className="flex flex-col items-center gap-2.5 group tap-target cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] rounded-full p-2"
        >
          <motion.div
            animate={prefersReducedMotion ? { y: 0 } : { y: [0, 6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center group-hover:border-white transition-colors duration-200"
          >
            <ArrowDown className="w-4 h-4 text-white" />
          </motion.div>
          <span className="hide-on-short-screen text-[10px] tracking-[2px] uppercase opacity-80 font-sans text-white/90 group-hover:opacity-100 transition-opacity">
            {heroContent.scrollText}
          </span>
        </button>
      </motion.div>
    </section>
  );
}
