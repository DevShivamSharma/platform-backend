import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import SectionHeader from '../ui/SectionHeader.jsx';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);
const { stats, sections = {} } = templateConfig;
const { about = {} } = sections;

export default function About() {
  const detailRows = asArray(about.details);
  const statsRows = asArray(stats);

  return (
    <section id={about.id} className="lm-section relative" aria-label={about.ariaLabel}>
      <div className="lm-container px-5 md:px-10">
        <SectionHeader {...about.header} />

        <div className="mt-16 md:mt-24 grid grid-cols-12 gap-x-6 gap-y-16">
          <div className="col-span-12 md:col-span-5 lg:col-span-4 md:sticky md:top-32 self-start">
            <div className="lm-mono text-fg-3">{about.noteLabel}</div>
            <h3 className="lm-display text-fg text-3xl md:text-4xl mt-5 leading-[0.95]">
              <RichText parts={about.sideTitle} />
            </h3>
            <div className="lm-hairline my-7" />
            <dl className="space-y-4 text-[13px]">
              {detailRows.map((row = {}, index) => (
                <Row key={row.label || index} label={row.label} value={row.value} />
              ))}
            </dl>
          </div>

          <div className="col-span-12 md:col-span-7 lg:col-span-7 lg:col-start-6">
            <p className="lm-display text-fg text-[clamp(1.6rem,3.2vw,2.8rem)] leading-[1.1] tracking-[-0.02em] text-pretty">
              <RichText parts={about.statement} />
            </p>

            {statsRows.length > 0 && (
              <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-px bg-[var(--line)]">
                {statsRows.map((stat, index) => (
                  <StatCell key={stat.label || index} idx={index} stat={stat} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RichText({ parts }) {
  return asArray(parts).map((part = {}, index) => {
    const className = part.muted ? 'text-fg-3' : undefined;
    const text = part.text || '';
    if (part.italic) {
      return (
        <em key={`${text}-${index}`} className={`lm-display-italic ${className || ''}`}>
          {text}
        </em>
      );
    }
    return (
      <span key={`${text}-${index}`} className={className}>
        {text}
      </span>
    );
  });
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-line pb-3">
      <dt className="lm-mono-sm text-fg-3 w-20 shrink-0">{label}</dt>
      <dd className="text-fg-2 flex-1 text-[13px] leading-snug">{value}</dd>
    </div>
  );
}

function StatCell({ stat = {}, idx }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease, delay: 0.05 * idx }}
      className="bg-[var(--bg)] p-5 md:p-7 group hover:bg-[var(--bg-2)] transition-colors"
    >
      <div className="flex items-start justify-between">
        <CountUp end={stat.value} active={inView} />
        <span className="lm-mono-sm text-fg-3">{String(idx + 1).padStart(2, '0')}</span>
      </div>
      <div className="mt-3 text-fg-3 text-[12px] leading-snug">{stat.label}</div>
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
    const duration = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(num * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, num]);

  return (
    <div className="lm-display text-fg text-4xl md:text-5xl leading-none tracking-[-0.03em]">
      {val}
      <span className="text-[var(--accent)]">{suffix}</span>
    </div>
  );
}
