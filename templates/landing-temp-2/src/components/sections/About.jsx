import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { about, profile, education, stats, publication } = templateConfig;
const meta = templateConfig.sections.about;
const { header } = meta;
const signoffYear = String(profile.period || '').split('–')[0].trim();
const profileRows = meta.profileRowLabels.map((label, i) => ({
  label,
  value: [
    profile.role,
    profile.currentTitle,
    profile.location,
    `${education.degreeShort || ''} · CGPA ${education.cgpa || ''}`,
    String(education.school || '').split(',')[0],
  ][i],
}));

export default function About() {
  return (
    <section id={meta.id} className="section relative" aria-label={meta.ariaLabel}>
      <div className="container-x px-4 md:px-6">
        <SectionHeader index={header.index} label={header.label} pp={header.pp} kicker={header.kicker} />

        <div className="mt-10 md:mt-14 grid grid-cols-12 gap-x-8 gap-y-12">
          <header className="col-span-12">
            <div className="caption mb-3">
              {header.kicker} · {roman(header.index)} · pp. {roman(header.pp)}–{roman(meta.ppEnd)}
            </div>
            <h2 className="display text-fg text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.92] tracking-[-0.03em] text-balance">
              <Rich nodes={about.title} />
            </h2>
            <p className="lede mt-6 max-w-3xl text-pretty">
              <Rich nodes={about.lede} />
            </p>
            <div className="rule mt-8" />
          </header>

          <article className="col-span-12 md:col-span-8">
            <p className="body-serif drop-cap text-pretty">
              <Rich nodes={about.lead} />
            </p>

            <p className="body-serif mt-5 text-pretty">
              <Rich nodes={about.second} />
            </p>

            <div className="my-10 pull-quote">{about.pullQuote || ''}</div>

            <div className="column-2">
              <p className="body-serif text-pretty">
                <Rich nodes={about.columns?.[0]} />
              </p>
              <p className="body-serif mt-4 text-pretty">
                <Rich nodes={about.columns?.[1]} />
              </p>
            </div>

            <div className="caption mt-10 text-fg-3">
              — <em className="signature not-italic">{about.signoffName}</em> · {publication.place || ''}, {signoffYear}
            </div>
          </article>

          <aside className="col-span-12 md:col-span-4 md:border-l md:border-line md:pl-8">
            <div className="caption mb-4">{meta.sidebarLabel}</div>

            <dl className="space-y-3 text-[14px] mb-10">
              {profileRows.map((row) => (
                <Row key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>

            <div className="caption mb-3">{meta.numbersLabel} · Fig. {roman(meta.numbersFig)}</div>
            <div className="plate" data-fig={`FIG. ${roman(meta.numbersFig)}`}>
              <div className="pt-6">
                {stats.map((s, i) => (
                  <StatRow key={i} idx={i} stat={s} />
                ))}
              </div>
              <div className="plate-caption">{meta.numbersCaption}</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="leader">
      <dt className="caption text-fg-3 shrink-0 min-w-[60px]">{label}</dt>
      <span className="leader-dots" />
      <dd className="text-fg-2 text-right text-[13px] leading-snug max-w-[60%]">{value}</dd>
    </div>
  );
}

function StatRow({ stat, idx }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease, delay: 0.05 * idx }}
      className="flex items-baseline justify-between py-2.5 border-b border-line last:border-b-0"
    >
      <span className="caption text-fg-3 max-w-[60%]">{stat.label}</span>
      <CountUp end={stat.value} active={inView} />
    </motion.div>
  );
}

function CountUp({ end, active }) {
  const [val, setVal] = useState(0);
  const num = parseInt(String(end).replace(/\D/g, ''), 10) || 0;
  const suffix = String(end).replace(String(num), '');

  useEffect(() => {
    if (!active) return;
    let raf;
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(num * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, num]);

  return (
    <span className="display text-fg text-2xl tracking-[-0.02em]">
      {val}
      <span className="text-accent">{suffix}</span>
    </span>
  );
}

export function SectionHeader({ index, label, pp, kicker = 'Section' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  return (
    <div ref={ref} className="running-head">
      <span>
        {kicker} · <span className="text-fg">{roman(index)}</span>
      </span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, ease }}
        className="display-italic text-fg display text-base md:text-lg"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {label}
      </motion.span>
      <span>pp. {roman(pp)}</span>
    </div>
  );
}
