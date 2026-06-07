import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import SectionHeader from '../ui/SectionHeader.jsx';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);
const { services, sections = {}, theme = {} } = templateConfig;
const serviceItems = asArray(services);
const { services: servicesSection = {} } = sections;

const bentoSpans = [
  'md:col-span-7 md:row-span-2',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-6',
  'md:col-span-6',
  'md:col-span-12',
];

export default function Services() {
  if (serviceItems.length === 0) return null;

  return (
    <section id={servicesSection.id} className="lm-section relative" aria-label={servicesSection.ariaLabel}>
      <div className="lm-container px-5 md:px-10">
        <SectionHeader {...servicesSection.header} />

        <div className="mt-16 md:mt-24">
          <div className="grid grid-cols-1 md:grid-cols-12 md:auto-rows-[minmax(220px,auto)] gap-px bg-[var(--line)] border border-line">
            {serviceItems.map((service = {}, index) => (
              <BentoCard
                key={service.title || index}
                service={service}
                index={index}
                spanClass={bentoSpans[index % (bentoSpans.length || 1)] || ''}
                large={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoCard({ service = {}, index, spanClass, large }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const Icon = iconMap[service.icon] || iconMap.default;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease, delay: index * 0.06 }}
      className={`group relative bg-[var(--bg)] p-7 md:p-10 flex flex-col justify-between overflow-hidden transition-colors duration-500 hover:bg-[var(--bg-2)] ${spanClass}`}
    >
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: theme.effects?.serviceHoverGlow }}
        aria-hidden
      />

      <header className="flex items-start justify-between gap-6">
        <span className="lm-mono text-fg-3">
          {servicesSection.cardPrefix}<span className="text-fg">{String(index + 1).padStart(2, '0')}</span>
        </span>
        <span className="w-10 h-10 inline-flex items-center justify-center border border-line text-fg-2 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
          <Icon />
        </span>
      </header>

      <div className="mt-10 md:mt-16">
        <h3
          className={`lm-display text-fg leading-[0.95] tracking-[-0.025em] ${
            large ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'
          }`}
        >
          {service.title}
        </h3>
        <p className="mt-4 text-fg-2 text-pretty leading-relaxed text-[14px] max-w-md">
          {service.description}
        </p>
      </div>

      <span className="mt-8 inline-flex items-center gap-2 lm-mono-sm text-fg-3 group-hover:text-fg transition-colors">
        <Arrow />
        <span>{servicesSection.cardCta}</span>
      </span>
    </motion.article>
  );
}

const iconMap = {
  monitor: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="3" width="16" height="11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 11h16M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  layers: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M2 10l8 4 8-4M2 14l8 4 8-4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  'bar-chart': () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 17V8M9 17V3M15 17v-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  link: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M8 12a3 3 0 003 3h2a3 3 0 100-6h-1M12 8a3 3 0 00-3-3H7a3 3 0 100 6h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  server: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="3" width="14" height="6" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="11" width="14" height="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="0.7" fill="currentColor" />
      <circle cx="6" cy="14" r="0.7" fill="currentColor" />
    </svg>
  ),
  zap: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  default: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
};

Object.assign(iconMap, {
  code: iconMap.monitor,
  globe: iconMap.server,
  shield: iconMap.layers,
  rocket: iconMap.zap,
  lock: iconMap.layers,
  users: iconMap.link,
  star: iconMap.zap,
  'trending-up': iconMap['bar-chart'],
  'check-circle': iconMap.layers,
  sparkles: iconMap.zap,
  bolt: iconMap.zap,
  award: iconMap.layers,
  heart: iconMap.layers,
});

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
