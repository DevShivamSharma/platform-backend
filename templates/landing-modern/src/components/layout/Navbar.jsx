import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { useTheme } from '../ui/ThemeProvider.jsx';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);

const {
  navigation = {},
  profile = {},
  footer = {},
  sections: { hero = {} } = {},
} = templateConfig;

const navLinks = asArray(navigation.links);
const TOTAL = navLinks.length;

export default function Navbar() {
  const [active, setActive] = useState(navigation.activeSectionDefault);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        (entries || []).forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { threshold: 0.35, rootMargin: '-20% 0px -55% 0px' }
    );

    [{ href: `#${hero.id}` }, ...navLinks].forEach((link = {}) => {
      const { href } = link;
      if (!href) return;
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    if (!href) return;
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const rawIndex = navLinks.findIndex((link) => link?.href === active);
  const displayIndex = rawIndex < 0 ? 0 : rawIndex + 1;
  const indexLabel = String(displayIndex).padStart(2, '0');
  const totalLabel = String(TOTAL).padStart(2, '0');
  const ctaHref = navLinks.at(-1)?.href;

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease, delay: 0.4 }}
        className="fixed top-0 inset-x-0 z-50 transition-[background,border-color,backdrop-filter] duration-500"
        style={{
          background: scrolled ? 'var(--glass)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
          borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        }}
      >
        <div className="lm-container flex items-center justify-between h-16 md:h-20 px-5 md:px-10">
          <a
            href={`#${hero.id}`}
            onClick={(event) => {
              event.preventDefault();
              handleNav(`#${hero.id}`);
            }}
            className="flex items-center gap-3 group"
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 border border-line text-fg"
              aria-hidden
            >
              <span className="lm-display text-[15px] leading-none">{navigation.brandInitial}</span>
            </span>
            <span className="hidden sm:block lm-mono text-fg-2 group-hover:text-fg transition-colors">
              {profile.fullName}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link = {}, index) => {
              const { label, href } = link;
              const isActive = active === href;
              return (
                <button
                  key={href || index}
                  onClick={() => handleNav(href)}
                  className="relative px-3 py-2 group"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="lm-mono-sm text-fg-3 group-hover:text-fg transition-colors"
                      style={{ color: isActive ? 'var(--accent)' : undefined }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="text-[13px] transition-colors"
                      style={{ color: isActive ? 'var(--fg)' : 'var(--fg-2)' }}
                    >
                      {label}
                    </span>
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-dot"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute -bottom-0 left-3 right-3 h-px"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="lm-mono-sm text-fg-3 hidden lg:flex items-center gap-2">
              <span>{navigation.indexPrefix}</span>
              <span className="text-fg">{indexLabel}</span>
              <span>/</span>
              <span>{totalLabel}</span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            {ctaHref && (
              <a
                href={ctaHref}
                onClick={(event) => {
                  event.preventDefault();
                  handleNav(ctaHref);
                }}
                className="lm-btn lm-btn-accent text-[10px] py-2.5 px-4"
              >
                <span>{navigation.ctaText}</span>
                <Arrow />
              </a>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={navigation.menuLabel}
              className="w-10 h-10 inline-flex items-center justify-center border border-line"
            >
              <span className="relative w-4 h-4">
                <span
                  className="absolute left-0 right-0 h-px bg-current transition-all"
                  style={{
                    top: mobileOpen ? '50%' : '25%',
                    transform: mobileOpen ? 'rotate(45deg)' : 'none',
                  }}
                />
                <span
                  className="absolute left-0 right-0 h-px bg-current transition-all"
                  style={{
                    bottom: mobileOpen ? '50%' : '25%',
                    transform: mobileOpen ? 'rotate(-45deg)' : 'none',
                  }}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'var(--bg)' }}
          >
            <div className="pt-24 px-6 flex flex-col h-full">
              <nav className="flex flex-col">
                {navLinks.map((link = {}, index) => {
                  const { label, href } = link;
                  return (
                    <motion.button
                      key={href || index}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.05 + index * 0.05, duration: 0.5, ease }}
                      onClick={() => handleNav(href)}
                      className="flex items-baseline gap-4 py-5 border-b border-line text-left"
                    >
                      <span className="lm-mono text-fg-3">{String(index + 1).padStart(2, '0')}</span>
                      <span className="lm-display text-3xl">{label}</span>
                    </motion.button>
                  );
                })}
              </nav>
              {ctaHref && (
                <a
                  href={ctaHref}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNav(ctaHref);
                  }}
                  className="lm-btn lm-btn-accent mt-10 self-start"
                >
                  <span>{navigation.ctaText}</span>
                  <Arrow />
                </a>
              )}
              <div className="mt-auto pb-10 lm-mono text-fg-3">
                <div>{hero.copyrightPrefix} {templateConfig.meta.year} {profile.fullName}</div>
                <div>{profile.location}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ThemeToggle({ theme, onToggle, compact = false }) {
  const isDark = theme === 'dark';
  const size = compact ? 'w-10 h-10' : 'w-10 h-10';

  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? templateConfig.theme.labels.themeToggle.light : templateConfig.theme.labels.themeToggle.dark}
      className={`${size} relative inline-flex items-center justify-center border border-line text-fg-2 hover:text-fg hover:border-line-2 transition-colors overflow-hidden`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 18, rotate: -45, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -18, rotate: 45, opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? <Sun /> : <Moon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Sun() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Moon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M13 9.5A6 6 0 016.5 3a6 6 0 100 12 6 6 0 006.5-5.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
