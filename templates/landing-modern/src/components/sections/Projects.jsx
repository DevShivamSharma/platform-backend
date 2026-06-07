import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { templateConfig } from '../../config.js';
import SectionHeader from '../ui/SectionHeader.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const asArray = (value) => (Array.isArray(value) ? value : []);
const { projects: projectItems, sections = {} } = templateConfig;
const projects = asArray(projectItems);
const { projects: projectsSection = {} } = sections;

export default function Projects() {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useGSAP(
    () => {
      if (!isDesktop || projects.length === 0) return;
      const wrap = wrapRef.current;
      const track = trackRef.current;
      if (!wrap || !track) return;

      const getDistance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          pin: true,
          start: 'top top',
          end: () => `+=${getDistance()}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${self.progress})`;
            }
            const idx = Math.max(
              0,
              Math.min(
                projects.length - 1,
                Math.floor(self.progress * projects.length + 0.0001)
              )
            );
            setActiveIdx(idx);
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [isDesktop], scope: wrapRef }
  );

  if (projects.length === 0) return null;

  return (
    <section id={projectsSection.id} className="relative bg-base" aria-label={projectsSection.ariaLabel}>
      <div className="lm-section pb-0">
        <div className="lm-container px-5 md:px-10">
          <SectionHeader {...projectsSection.header} />
        </div>
      </div>

      <div ref={wrapRef} className="relative">
        {isDesktop ? (
          <div className="h-screen overflow-hidden flex items-stretch">
            <IntroPanel activeIdx={activeIdx} total={projects.length} />
            <div ref={trackRef} className="flex items-stretch will-change-transform">
              {projects.map((project = {}, index) => (
                <ProjectPanel
                  key={project.id || project.title || index}
                  project={project}
                  index={index}
                  active={index === activeIdx}
                />
              ))}
              <EndPanel />
            </div>
            <ProgressBar progressRef={progressRef} activeIdx={activeIdx} total={projects.length} />
          </div>
        ) : (
          <div className="lm-container px-5 md:px-10 pt-10 pb-24 space-y-6">
            {projects.map((project = {}, index) => (
              <MobileCard key={project.id || project.title || index} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function IntroPanel({ activeIdx, total }) {
  return (
    <div
      className="h-screen shrink-0 flex flex-col justify-between p-10 lg:p-16 border-r border-line"
      style={{ width: 'min(46vw, 640px)' }}
    >
      <div className="lm-mono text-fg-3 flex items-center gap-4">
        <span className="text-[var(--accent)]">{projectsSection.intro.index}</span>
        <span className="lm-hairline w-10" />
        <span>{projectsSection.intro.label}</span>
      </div>
      <div>
        <h3 className="lm-display text-fg text-[clamp(2.4rem,4.5vw,4.2rem)] leading-[0.9] tracking-[-0.035em]">
          <RichTitle parts={projectsSection.intro.title} />
        </h3>
        <p className="text-fg-2 text-pretty mt-7 max-w-md leading-relaxed text-[14px]">
          {projectsSection.intro.description}
        </p>
      </div>
      <div className="lm-mono-sm text-fg-3 flex items-center gap-3">
        <span className="inline-block w-1.5 h-1.5 bg-[var(--accent)] animate-pulse" />
        <span className="text-fg">{String(activeIdx + 1).padStart(2, '0')}</span>
        <span>{projectsSection.countSeparator} {String(total).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

function ProjectPanel({ project = {}, index, active }) {
  const metrics = asArray(project.metrics);
  const features = asArray(project.features);
  const tech = asArray(project.tech);

  return (
    <article
      className="h-screen shrink-0 relative border-r border-line p-10 lg:p-16 flex flex-col justify-between transition-opacity duration-700"
      style={{ width: 'min(96vw, 1180px)', opacity: active ? 1 : 0.45 }}
    >
      <div className="flex items-start justify-between gap-10">
        <div className="flex items-center gap-4 lm-mono text-fg-3">
          <span className="text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
          <span className="lm-hairline w-12" />
          <span>{project.type}</span>
        </div>
        {project.featured && (
          <span className="lm-mono-sm border border-line-2 px-2 py-1 text-fg-3">
            {projectsSection.featuredLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-end">
        <div className="col-span-12 lg:col-span-7">
          <h3 className="lm-display text-fg text-[clamp(3rem,7vw,6.4rem)] leading-[0.86] tracking-[-0.045em]">
            {project.title}
          </h3>
          <p className="mt-7 text-fg-2 text-pretty max-w-xl leading-relaxed text-[15px]">
            {project.description}
          </p>
          <p className="mt-4 lm-mono-sm text-fg-3 max-w-xl">{project.note}</p>
        </div>

        <div className="col-span-12 lg:col-span-5">
          {metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-px bg-[var(--line)] border border-line">
              {metrics.map((metric, metricIndex) => (
                <div key={metric || metricIndex} className="bg-[var(--bg)] p-4 lg:p-5">
                  <div className="lm-mono-sm text-fg-3 mb-2">
                    {projectsSection.metricPrefix}{String(metricIndex + 1).padStart(2, '0')}
                  </div>
                  <div className="lm-display text-fg text-lg lg:text-xl leading-tight">{metric}</div>
                </div>
              ))}
            </div>
          )}

          {features.length > 0 && (
            <ul className="mt-8 space-y-3">
              {features.slice(0, 4).map((feature, featureIndex) => (
                <li key={feature || featureIndex} className="flex items-start gap-3 text-[13px] text-fg-2">
                  <span className="lm-mono-sm text-fg-3 pt-1 shrink-0">
                    {String(featureIndex + 1).padStart(2, '0')}
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          {tech.map((item) => (
            <span key={item} className="lm-tag">{item}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function EndPanel() {
  return (
    <div
      className="h-screen shrink-0 flex flex-col justify-center items-start p-10 lg:p-16 border-r border-line"
      style={{ width: 'min(40vw, 520px)' }}
    >
      <div className="lm-mono text-fg-3">{projectsSection.endPanel.label}</div>
      <h4 className="lm-display text-fg text-4xl lg:text-5xl mt-4 leading-[0.95]">
        <RichTitle parts={projectsSection.endPanel.title} />
      </h4>
      <a
        href={`#${sections.contact.id}`}
        onClick={(event) => {
          event.preventDefault();
          document.querySelector(`#${sections.contact.id}`)?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="lm-btn lm-btn-accent mt-8"
      >
        <span>{projectsSection.endPanel.ctaText}</span>
        <Arrow />
      </a>
    </div>
  );
}

function ProgressBar({ progressRef, activeIdx, total }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
      <div className="lm-container px-5 md:px-10 pb-5">
        <div className="flex items-center justify-between lm-mono-sm text-fg-3 mb-2">
          <span>
            <span className="text-fg">{String(activeIdx + 1).padStart(2, '0')}</span> /{' '}
            {String(total).padStart(2, '0')}
          </span>
          <span>{projectsSection.progressLabel}</span>
        </div>
        <div className="h-px bg-[var(--line-2)] relative overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-[var(--accent)] origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
  );
}

function MobileCard({ project = {}, index }) {
  const metrics = asArray(project.metrics);
  const tech = asArray(project.tech);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="border border-line bg-elev p-6"
    >
      <div className="flex items-center justify-between lm-mono-sm text-fg-3 mb-4">
        <span>
          <span className="text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span> · {project.type}
        </span>
        {project.featured && <span>{projectsSection.featuredLabel}</span>}
      </div>
      <h3 className="lm-display text-fg text-4xl leading-[0.92]">{project.title}</h3>
      <p className="mt-4 text-fg-2 text-[14px] leading-relaxed">{project.description}</p>
      {metrics.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-px bg-[var(--line)]">
          {metrics.map((metric, metricIndex) => (
            <div key={metric || metricIndex} className="bg-[var(--bg)] p-3">
              <div className="lm-mono-sm text-fg-3 text-[10px] mb-1">
                {projectsSection.metricPrefix}{String(metricIndex + 1).padStart(2, '0')}
              </div>
              <div className="text-fg text-[13px] leading-tight">{metric}</div>
            </div>
          ))}
        </div>
      )}
      {tech.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tech.map((item) => (
            <span key={item} className="lm-tag">{item}</span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

function RichTitle({ parts }) {
  return asArray(parts).map((part = {}, index) => {
    const text = String(part.text || '');
    const chunks = text.split('\n');
    const content = chunks.map((chunk, chunkIndex) => (
      <span key={`${chunk}-${chunkIndex}`}>
        {chunk}
        {chunkIndex < chunks.length - 1 && <br />}
      </span>
    ));

    if (part.italic) {
      return (
        <em key={`${text}-${index}`} className="lm-display-italic text-fg-2">
          {content}
        </em>
      );
    }

    return <span key={`${text}-${index}`}>{content}</span>;
  });
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
