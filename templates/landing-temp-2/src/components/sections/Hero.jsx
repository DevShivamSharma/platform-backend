import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { hero, profile, skillGroups, stats, publication, labels, derived } = templateConfig;
const meta = templateConfig.sections.hero;

const sep = meta.marqueeSeparator;
const marqueeItems = (hero.marqueeItems || []).flatMap((item) => [item, sep]);

export default function Hero() {
  useEffect(() => {
    document.body.style.setProperty('--hero-loaded', '1');
  }, []);

  return (
    <section id={meta.id} className="relative pt-24 md:pt-28 pb-12 md:pb-16" aria-label={meta.ariaLabel}>
      <div className="container-x px-4 md:px-6">
        <Masthead />

        <div className="mt-8 md:mt-10 grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-8">
            <Coverline />
          </div>
          <aside className="col-span-12 md:col-span-4 flex flex-col justify-between">
            <SideQuote />
            <StatsPlate />
          </aside>
        </div>

        <div className="mt-12 md:mt-16">
          <div className="rule-double mb-6" />
          <MarqueeStrip />
          <div className="rule-double mt-6" />
        </div>

        <Folio />
      </div>
    </section>
  );
}

function Masthead() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease }}
      className="running-head"
    >
      <span>{derived.issueLabel} · {publication.season}</span>
      <span className="hidden sm:inline-flex items-center gap-3">
        <span className="text-fg">{hero.masthead?.byline}</span>
        <span>·</span>
        <span>{hero.masthead?.location}</span>
      </span>
      <span>pp. {hero.masthead?.pageRange}</span>
    </motion.div>
  );
}

function Coverline() {
  return (
    <div>
      <div className="caption mb-5">{hero.coverlineKicker}</div>

      <h1 className="display text-fg text-[clamp(3.4rem,13vw,13rem)] leading-[0.86] tracking-[-0.04em]">
        {(hero.coverName || []).map((line, i) => (
          <span key={i} className="reveal block">
            <motion.span
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1.05, ease, delay: 0.25 + i * 0.08 }}
              className="reveal-inner"
            >
              <Rich nodes={line} />
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.9 }}
        className="mt-10 max-w-2xl"
      >
        <p className="lede text-pretty">
          <Rich nodes={hero.lede} />
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={hero.primaryCta?.href} onClick={smoothNav(hero.primaryCta?.href)} className="btn btn-accent">
            <span>{hero.primaryCta?.label}</span>
            <Arrow />
          </a>
          <a href={hero.secondaryCta?.href} onClick={smoothNav(hero.secondaryCta?.href)} className="btn">
            <span>{hero.secondaryCta?.label}</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function SideQuote() {
  const q = hero.sideQuote || {};
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.65 }}
      className="border-l-2 border-fg pl-5"
    >
      <div className="caption mb-3">{labels.feature} · {roman(q.featureIndex)}</div>
      <p className="pull-quote !border-0 !p-0 text-[clamp(1.3rem,2vw,1.7rem)]">
        {q.quote}
      </p>
      <div className="caption mt-3 text-fg-3">
        from <em className="signature">{q.source}</em>, p. {roman(q.sourcePage)}
      </div>
    </motion.div>
  );
}

function StatsPlate() {
  const top = (stats || []).slice(0, 3);
  const stackItems = [
    ...(skillGroups['Frontend Development'] || []).slice(0, 3),
    ...(skillGroups['Backend Development'] || []).slice(0, 2),
  ];
  const [fromPage, toPage] = meta.statsPages || [8, 36];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.85 }}
      className="mt-10 plate"
      data-fig={`FIG. ${roman(meta.statsFig)}`}
    >
      <div className="pt-8">
        <div className="caption mb-3">{labels.inThisVolume}</div>
        <ul className="divide-y divide-[var(--line)] mb-5">
          {top.map((s, i) => (
            <li key={i} className="flex items-baseline justify-between py-2">
              <span className="text-fg-2 text-[14px]">{s.label}</span>
              <span className="display text-fg text-2xl">{s.value}</span>
            </li>
          ))}
        </ul>
        <div className="caption mb-2">{labels.disciplines}</div>
        <div className="flex flex-wrap gap-1.5">
          {stackItems.map((s) => (
            <span key={s} className="tag">{s}</span>
          ))}
        </div>
      </div>
      <div className="plate-caption mt-4">
        {meta.volumeCaptionLead} {roman(fromPage)}–{roman(toPage)}.
      </div>
    </motion.div>
  );
}

function MarqueeStrip() {
  return (
    <div className="marquee py-2">
      <div className="marquee-track">
        {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
          <span key={i} className="display text-fg text-3xl md:text-4xl italic font-light">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Folio() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="mt-10 flex items-end justify-between"
    >
      <div className="folio">
        <span>p. </span>
        <strong>{roman(meta.coverPage)}</strong>
        <span className="mx-2">/</span>
        <span>{roman(publication.totalPages)}</span>
      </div>
      <div className="folio hidden sm:flex items-center gap-4">
        <span className="signature">{labels.continued}</span>
        <span>{profile.location}</span>
      </div>
      <div className="folio">
        <strong>{profile.fullName}</strong>
      </div>
    </motion.div>
  );
}

function smoothNav(href) {
  return (e) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
