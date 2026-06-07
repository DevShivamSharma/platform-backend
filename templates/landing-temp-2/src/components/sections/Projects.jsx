import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { SectionHeader } from './About.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { projects, projectsSection, labels } = templateConfig;
const meta = templateConfig.sections.projects;
const { header } = meta;

export default function Projects() {
  return (
    <section id={meta.id} className="relative bg-base" aria-label={meta.ariaLabel}>
      <div className="section pb-0">
        <div className="container-x px-4 md:px-6">
          <SectionHeader index={header.index} label={header.label} pp={header.pp} kicker={header.kicker} />

          <div className="mt-10 md:mt-14 max-w-4xl">
            <div className="caption mb-3">{meta.editorNoteLabel}</div>
            <h2 className="display text-fg text-[clamp(2.4rem,6vw,5rem)] leading-[0.92] tracking-[-0.03em]">
              <Rich nodes={projectsSection.title} />
            </h2>
            <p className="lede mt-5 text-fg-2 max-w-2xl text-pretty">
              {projectsSection.lede}
            </p>
            <div className="rule mt-8" />
          </div>
        </div>
      </div>

      <div className="container-x px-4 md:px-6 mt-14 md:mt-20 space-y-20 md:space-y-28">
        {projects.map((p, i) => (
          <Spread key={p.id} project={p} index={i} total={projects.length} />
        ))}

        <EndPlate />
      </div>
    </section>
  );
}

function Spread({ project, index, total }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const pageStart = header.pp + index * 4;
  const isOdd = index % 2 === 1;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease }}
      className="container-narrow"
    >
      <div className="running-head mb-8">
        <span>
          {labels.feature} · <span className="text-fg">{roman(index + 1)}</span>
          <span className="mx-2">·</span>
          {project.type}
        </span>
        <span className="hidden sm:inline signature">{project.title}</span>
        <span>
          pp. {roman(pageStart)}–{roman(pageStart + 3)}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-x-8 gap-y-6">
        <div className="col-span-12 md:col-span-8">
          <div className="caption mb-3 text-fg-3">
            No. {String(index + 1).padStart(2, '0')} · {project.type}
            {project.featured && <span className="ml-3 text-accent">{labels.featuredTag}</span>}
          </div>
          <h3 className="display text-fg text-[clamp(2.4rem,6.5vw,5.2rem)] leading-[0.9] tracking-[-0.035em]">
            {project.title}
          </h3>
          <p className="lede mt-5 text-fg-2 max-w-xl text-pretty">
            {project.description}
          </p>
        </div>

        <aside className="col-span-12 md:col-span-4">
          <div className="caption mb-3">{meta.vitalLabel}</div>
          <ul className="divide-y divide-[var(--line)] border-y border-line">
            {(project.metrics || []).map((m, i) => (
              <li key={i} className="py-3 leader">
                <span className="caption text-fg-3 shrink-0">M.{roman(i + 1)}</span>
                <span className="leader-dots" />
                <span className="body-serif text-fg text-[14px] text-right">{m}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="rule-double my-10" />

      <div className="grid grid-cols-12 gap-x-8 gap-y-8">
        <div className={`col-span-12 md:col-span-8 ${isOdd ? 'md:order-2' : ''}`}>
          <ol className="space-y-4">
            {(project.features || []).map((f, i) => (
              <li key={i} className="flex gap-4 body-serif text-fg-2 text-pretty">
                <span className="caption text-accent shrink-0 pt-1.5">{roman(i + 1)}</span>
                <span className="flex-1">{f}</span>
              </li>
            ))}
          </ol>

          <p className="mt-6 body-serif italic text-fg-3 text-[15px] max-w-prose text-pretty">
            <em className="signature not-italic">{labels.note}</em> {project.note}
          </p>
        </div>

        <aside className={`col-span-12 md:col-span-4 ${isOdd ? 'md:order-1' : ''}`}>
          <div className="plate" data-fig={`FIG. ${roman(index + 4)}`}>
            <div className="pt-7">
              <div className="caption mb-3">{meta.stackUsedLabel}</div>
              <ul className="space-y-1.5">
                {(project.tech || []).map((t, i) => (
                  <li key={t} className="leader text-[13px]">
                    <span className="caption text-fg-3 shrink-0 w-6">{roman(i + 1)}</span>
                    <span className="body-serif text-fg-2">{t}</span>
                    <span className="leader-dots" />
                  </li>
                ))}
              </ul>
            </div>
            <div className="plate-caption">
              {meta.stackCaptionPrefix}{project.title}{meta.stackCaptionSuffix}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div className="folio">
          <strong>{project.title}</strong>
          <span className="mx-2">·</span>
          <span>{project.type}</span>
        </div>
        <div className="folio">
          {index < total - 1 ? (
            <span>
              {meta.continuedOnPage} {roman(pageStart + 4)} <span className="signature">→</span>
            </span>
          ) : (
            <span>{meta.endOfSection} <span className="signature">{meta.finLabel}</span></span>
          )}
        </div>
        <div className="folio">
          p. <strong>{roman(pageStart + 3)}</strong>
        </div>
      </div>
    </motion.article>
  );
}

function EndPlate() {
  const end = projectsSection.endPlate || {};
  const cta = end.cta || {};
  return (
    <div className="container-narrow text-center py-16 md:py-24 border-t border-fg">
      <div className="caption mb-4">{meta.endLabel} · {roman(meta.endPage)}</div>
      <h4 className="display text-fg text-[clamp(2.4rem,6vw,5rem)] leading-[0.95]">
        <Rich nodes={end.title} />
      </h4>
      <p className="lede mt-5 text-fg-2 max-w-lg mx-auto text-pretty">
        {end.lede}
      </p>
      <a
        href={cta.href}
        onClick={(e) => {
          e.preventDefault();
          document.querySelector(cta.href)?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="btn btn-accent mt-8"
      >
        <span>{cta.label}</span>
        <Arrow />
      </a>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
