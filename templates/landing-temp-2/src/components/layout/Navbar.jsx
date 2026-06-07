import { Fragment, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { useTheme } from '../../hooks/useTheme.jsx';
import { roman } from '../../hooks/roman.js';

const { navigation, profile, derived, footer } = templateConfig;
const navLinks = navigation.links || [];
const TOTAL = navLinks.length;
const initials = String(profile.fullName || '')
  .trim()
  .split(/\s+/)
  .map((w) => w[0])
  .filter(Boolean)
  .map((c) => c.toUpperCase());

export default function Navbar() {
  const [active, setActive] = useState('#hero');
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
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { threshold: 0.35, rootMargin: '-20% 0px -55% 0px' }
    );
    [{ href: '#hero' }, ...navLinks].forEach(({ href }) => {
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const rawIndex = navLinks.findIndex((l) => l.href === active);
  const displayIndex = rawIndex < 0 ? 0 : rawIndex + 1;

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="fixed top-0 inset-x-0 z-50 transition-[background,border-color,backdrop-filter] duration-300"
        style={{
          background: scrolled ? 'var(--glass)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px) saturate(120%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(120%)' : 'none',
          borderBottom: scrolled ? '1px solid var(--fg)' : '1px solid transparent',
        }}
      >
        <div className="container-x flex items-center justify-between h-16 md:h-20 px-4 md:px-6">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              handleNav('#hero');
            }}
            className="flex items-baseline gap-3 group"
          >
            <span className="display text-fg text-xl md:text-2xl group-hover:text-accent transition-colors">
              {initials.map((c, i) => (
                <Fragment key={i}>
                  {c}
                  <em className="display-italic">.</em>
                </Fragment>
              ))}
            </span>
            <span className="hidden sm:block caption text-fg-3 group-hover:text-fg transition-colors">
              {derived.editionFull}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href }, idx) => {
              const isActive = active === href;
              return (
                <button
                  key={href}
                  onClick={() => handleNav(href)}
                  className="relative px-3 py-2 group"
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      className="caption text-fg-3 group-hover:text-fg transition-colors"
                      style={{ color: isActive ? 'var(--accent)' : undefined }}
                    >
                      {roman(idx + 1)}
                    </span>
                    <span
                      className="text-[14px] transition-colors"
                      style={{
                        color: isActive ? 'var(--fg)' : 'var(--fg-2)',
                        fontStyle: isActive ? 'italic' : 'normal',
                        fontFamily: 'var(--font-display)',
                      }}
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
            <div className="caption hidden lg:flex items-center gap-1.5">
              <span>p.</span>
              <span className="text-fg">{roman(displayIndex || 1)}</span>
              <span>/</span>
              <span>{roman(TOTAL)}</span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <a
              href={navigation.cta.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(navigation.cta.href);
              }}
              className="btn btn-accent py-2.5 px-4 text-[10px]"
            >
              <span>{navigation.cta.short}</span>
              <Arrow />
            </a>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="w-10 h-10 inline-flex items-center justify-center border border-fg bg-base"
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
              <div className="caption mb-6 text-fg-3">
                {footer?.contentsLabel || ''} · {derived?.issueLabel || ''}
              </div>
              <nav className="flex flex-col border-t border-fg">
                {navLinks.map(({ label, href }, idx) => (
                  <motion.button
                    key={href}
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 + idx * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => handleNav(href)}
                    className="flex items-baseline gap-4 py-5 border-b border-line text-left"
                  >
                    <span className="caption text-accent w-10">{roman(idx + 1)}</span>
                    <span className="display text-3xl">{label}</span>
                  </motion.button>
                ))}
              </nav>
              <a
                href={navigation.cta.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(navigation.cta.href);
                }}
                className="btn btn-accent mt-10 self-start"
              >
                <span>{navigation.cta.long}</span>
                <Arrow />
              </a>
              <div className="mt-auto pb-10 caption text-fg-3">
                <div>{derived.copyrightLine}</div>
                <div>{profile.location}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'day' : 'night'} edition`}
      className="w-10 h-10 relative inline-flex items-center justify-center border border-fg bg-base text-fg hover:bg-fg hover:text-base transition-colors overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 16, rotate: -45, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -16, rotate: 45, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? <Sun /> : <Moon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function Sun() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Moon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M13 9.5A6 6 0 016.5 3a6 6 0 100 12 6 6 0 006.5-5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
