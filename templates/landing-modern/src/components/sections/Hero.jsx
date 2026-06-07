import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { marqueeItems, templateConfig } from '../../config.js';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);

const { profile = {}, sections = {}, theme = {}, meta = {} } = templateConfig;
const { hero = {} } = sections;

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    document.body.style.setProperty('--hero-loaded', '1');
  }, []);

  return (
    <section
      id={hero.id}
      ref={ref}
      className="relative min-h-[100svh] flex flex-col lm-grid-bg overflow-hidden lm-noise"
      aria-label={hero.ariaLabel}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[60vw] h-[60vw] opacity-[0.35]"
          style={{ background: theme.effects.heroGlowPrimary }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[55vw] h-[55vw] opacity-30"
          style={{ background: theme.effects.heroGlowSecondary }}
        />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative lm-container w-full px-5 md:px-10 flex-1 flex flex-col justify-center pt-28 md:pt-32 pb-20"
      >
        <HeroMeta />

        <div className="mt-12 md:mt-16">
          <BleedHeadline />
        </div>

        <div className="mt-14 md:mt-20 grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-5 lg:col-span-4">
            <div className="lm-mono text-fg-3 mb-4">{hero.currentLabel}</div>
            <p className="text-fg-2 text-pretty leading-relaxed text-[15px] md:text-base">
              {profile.currentTitle}{' '}
              <span className="text-fg">
                {hero.companyPrefix} {capitalize(profile.company)}
              </span>
              <span className="text-fg-3"> — {profile.period}.</span>
            </p>
          </div>

          <div className="col-span-12 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
            <div className="lm-mono text-fg-3 mb-4">{hero.practiceLabel}</div>
            <p className="text-fg-2 text-pretty leading-relaxed text-[15px] md:text-base">
              {profile.heroHeadline}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={`#${sections.projects.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.querySelector(`#${sections.projects.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="lm-btn lm-btn-accent"
              >
                <span>{hero.buttonWork}</span>
                <Arrow />
              </a>
              <a href={profile.resumeHref} download={hero.resumeDownloadName} className="lm-btn">
                <span>{hero.buttonResume}</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      <HeroFooter />
    </section>
  );
}

function HeroMeta() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.5 }}
      className="flex items-center justify-between lm-mono text-fg-3"
    >
      <div className="flex items-center gap-3">
        <span className="inline-block w-1.5 h-1.5 bg-[var(--accent)] animate-pulse" />
        <span>{hero.copyrightPrefix} {meta.year} — {profile.fullName}</span>
      </div>
      <div className="hidden sm:flex items-center gap-6">
        <span>{profile.location}</span>
        <span className="text-fg">{hero.sequenceLabel}</span>
      </div>
    </motion.div>
  );
}

function BleedHeadline() {
  const displayName = profile.fullName || meta.siteName || 'Portfolio';
  const headlineLines = [
    ...asArray(hero.headlineNameLines),
    ...asArray(hero.headlineSuffixLines),
  ];
  const safeHeadlineLines =
    headlineLines.length > 0 ? headlineLines : [{ text: displayName, uppercase: true }];

  return (
    <h1 className="lm-display text-fg leading-[0.85] text-[clamp(3.6rem,12vw,12rem)] tracking-[-0.045em]">
      {safeHeadlineLines.map((line, index) => (
        <span key={`${line.text}-${index}`} className="lm-reveal block">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.05, ease, delay: 0.4 + index * 0.08 }}
            className={`lm-reveal-inner ${line.uppercase ? 'uppercase' : ''}`}
          >
            {line.italic ? <em className="lm-display-italic">{line.text}</em> : line.text}
            {line.sup && (
              <sup className="lm-mono text-[0.18em] align-super ml-3 text-fg-3">
                {line.sup}
              </sup>
            )}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function HeroFooter() {
  return (
    <div className="relative w-full">
      <div className="lm-container px-5 md:px-10 pb-6 flex items-end justify-between">
        <ScrollHint />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="hidden md:block max-w-[280px] text-right"
        >
          <div className="lm-mono text-fg-3 mb-2">{hero.availabilityLabel}</div>
          <div className="text-fg-2 text-[13px] leading-relaxed">{profile.availability}</div>
        </motion.div>
      </div>
      <Marquee />
    </div>
  );
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.8 }}
      className="lm-scroll-hint"
    >
      <span className="bar" />
      <span>{hero.scrollHint}</span>
    </motion.div>
  );
}

function Marquee() {
  const items = asArray(marqueeItems);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-line">
      <div className="lm-marquee py-5">
        <div className="lm-marquee-track">
          {[...items, ...items].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-12 lm-mono text-fg-2">
              <span>{item}</span>
              <span className="text-fg-3">{hero.marqueeSeparator}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function capitalize(value) {
  if (!value) return value;
  return String(value)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
