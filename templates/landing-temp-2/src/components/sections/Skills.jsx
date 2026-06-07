import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { SectionHeader } from './About.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { skillGroups, supportingSkills, skillsSection, labels } = templateConfig;
const meta = templateConfig.sections.skills;
const { header } = meta;
const groups = Object.entries(skillGroups || {});

export default function Skills() {
  const [active, setActive] = useState(0);
  return (
    <section id={meta.id} className="section relative bg-elev" aria-label={meta.ariaLabel}>
      <div className="container-x px-4 md:px-6">
        <SectionHeader index={header.index} label={header.label} pp={header.pp} kicker={header.kicker} />

        <div className="mt-10 md:mt-14 grid grid-cols-12 gap-x-8 gap-y-10">
          <header className="col-span-12 md:col-span-4 md:sticky md:top-28 self-start">
            <div className="caption mb-3">{meta.tocLabel}</div>
            <h2 className="display text-fg text-[clamp(2.2rem,5vw,4.5rem)] leading-[0.92] tracking-[-0.03em]">
              <Rich nodes={skillsSection.title} />
            </h2>
            <p className="lede mt-5 text-fg-2 max-w-md text-pretty">
              {skillsSection.lede}
            </p>
            <div className="rule mt-7" />
            <div className="mt-6 caption text-fg-3">
              {groups.length} groups · {groups.reduce((n, [, v]) => n + v.length, 0)} entries
            </div>
          </header>

          <div className="col-span-12 md:col-span-8">
            <ol className="border-t border-fg">
              {groups.map(([name, items], i) => (
                <TocEntry
                  key={name}
                  index={i}
                  name={name}
                  items={items}
                  active={active === i}
                  setActive={setActive}
                />
              ))}
            </ol>

            <Supporting />
          </div>
        </div>
      </div>
    </section>
  );
}

function TocEntry({ index, name, items, active, setActive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease, delay: 0.05 * index }}
      className="border-b border-line py-5"
      onMouseEnter={() => setActive(index)}
      onFocus={() => setActive(index)}
    >
      <div className="leader items-baseline">
        <span className="caption text-accent w-8 shrink-0">{roman(index + 1)}</span>
        <span
          className={`display text-[clamp(1.4rem,2.6vw,2rem)] tracking-[-0.02em] transition-colors ${
            active ? 'text-fg' : 'text-fg-2'
          }`}
        >
          {active ? <em className="display-italic">{name}</em> : name}
        </span>
        <span className="leader-dots" />
        <span className="caption text-fg-3 shrink-0">
          {String(items.length).padStart(2, '0')} entries · p. {roman(header.pp + index * 2)}
        </span>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: active ? 'auto' : 0,
          opacity: active ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease }}
        className="overflow-hidden"
      >
        <div className="pt-5 pl-8">
          <div className="flex flex-wrap gap-1.5">
            {items.map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}

function Supporting() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  return (
    <div ref={ref} className="mt-14 plate" data-fig={`FIG. ${roman(meta.supportingFig)}`}>
      <div className="pt-8">
        <div className="caption mb-3">{meta.supportingLabel}</div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {(supportingSkills || []).map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease, delay: i * 0.04 }}
              className="leader py-1.5 border-b border-line"
            >
              <span className="caption text-fg-3 w-8 shrink-0">{roman(i + 1)}</span>
              <span className="body-serif text-fg-2 text-[15px]">{s}</span>
              <span className="leader-dots" />
              <span className="caption text-fg-3 shrink-0">{labels.noted}</span>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="plate-caption">
        {skillsSection.supportingCaption}
      </div>
    </div>
  );
}
