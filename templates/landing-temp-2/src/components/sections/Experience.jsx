import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { SectionHeader } from './About.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { experience, experienceSection } = templateConfig;
const meta = templateConfig.sections.experience;
const { header } = meta;

export default function Experience() {
  return (
    <section id={meta.id} className="section relative bg-elev" aria-label={meta.ariaLabel}>
      <div className="container-x px-4 md:px-6">
        <SectionHeader index={header.index} label={header.label} pp={header.pp} kicker={header.kicker} />

        <div className="mt-10 md:mt-14 grid grid-cols-12 gap-x-8 gap-y-10">
          <header className="col-span-12 md:col-span-5">
            <div className="caption mb-3">{header.kicker} · {roman(header.index)}</div>
            <h2 className="display text-fg text-[clamp(2.4rem,5.5vw,4.8rem)] leading-[0.92] tracking-[-0.03em]">
              <Rich nodes={experienceSection.title} />
            </h2>
            <p className="lede mt-5 text-fg-2 max-w-md text-pretty">
              {experienceSection.lede}
            </p>
          </header>

          <div className="col-span-12 md:col-span-7 md:border-l md:border-fg md:pl-10">
            {experience.map((item, i) => (
              <Entry key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Entry({ item, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, ease }}
      className="py-10 first:pt-0 last:pb-0 border-b border-line last:border-b-0"
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="caption text-accent">Ch. {roman(index + 1)}</span>
        <span className="caption text-fg-3">{item.location}</span>
      </div>

      <div className="display text-fg-3 text-base mb-3 tracking-[0.06em] uppercase">
        {item.period}
      </div>

      <h3 className="display text-fg text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[0.95] tracking-[-0.025em]">
        {item.title}
      </h3>
      <div className="signature text-xl mt-1">{item.company}</div>

      <p className="body-serif mt-5 text-fg-2 text-pretty max-w-prose">
        {item.description}
      </p>

      <ul className="mt-6 space-y-3">
        {(item.bullets || []).map((b, i) => (
          <li key={i} className="flex gap-4 body-serif text-fg-2 text-[15px] text-pretty">
            <span className="caption text-fg-3 shrink-0 pt-1.5">{roman(i + 1)}</span>
            <span className="flex-1">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(item.skills || []).map((s) => (
          <span key={s} className="tag">{s}</span>
        ))}
      </div>
    </motion.article>
  );
}
