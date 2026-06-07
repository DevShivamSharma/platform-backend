import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import SectionHeader from '../ui/SectionHeader.jsx';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);
const { experience, sections = {} } = templateConfig;
const experienceItems = asArray(experience);
const { experience: experienceSection = {} } = sections;

export default function Experience() {
  if (experienceItems.length === 0) return null;

  return (
    <section id={experienceSection.id} className="lm-section relative" aria-label={experienceSection.ariaLabel}>
      <div className="lm-container px-5 md:px-10">
        <SectionHeader {...experienceSection.header} />

        <div className="mt-16 md:mt-24 relative">
          <div className="absolute left-[14px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-[var(--line)]" aria-hidden />
          <div className="space-y-20 md:space-y-28">
            {experienceItems.map((item = {}, index) => (
              <Row key={`${item.title || 'experience'}-${item.period || index}`} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ item = {}, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const isLeft = index % 2 === 0;
  const bullets = asArray(item.bullets);
  const skills = asArray(item.skills);

  return (
    <div ref={ref} className="relative grid md:grid-cols-2 gap-y-6 md:gap-x-16 items-start pl-10 md:pl-0">
      <span
        className="absolute left-[10px] md:left-1/2 md:-translate-x-1/2 top-2 w-2.5 h-2.5 bg-[var(--accent)]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease }}
        className={isLeft ? 'md:order-1 md:text-right md:pr-10' : 'md:order-2 md:pl-10'}
      >
        <div className="lm-mono text-[var(--accent)]">{item.period}</div>
        <div className="mt-2 lm-mono-sm text-fg-3">{item.location}</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease, delay: 0.1 }}
        className={isLeft ? 'md:order-2 md:pl-10' : 'md:order-1 md:text-right md:pr-10'}
      >
        <h3 className="lm-display text-fg text-3xl md:text-4xl leading-[0.95] tracking-[-0.025em]">
          {item.title}
        </h3>
        <div className="mt-2 text-fg-2 text-[14px]">{item.company}</div>
        <p className="mt-5 text-fg-2 text-[14px] leading-relaxed text-pretty">{item.description}</p>

        {bullets.length > 0 && (
          <ul className={`mt-6 space-y-2.5 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
            {bullets.map((bullet, bulletIndex) => (
              <li
                key={bullet || bulletIndex}
                className={`flex items-start gap-3 text-[13px] text-fg-2 ${
                  isLeft ? 'md:flex-row-reverse md:text-right' : ''
                }`}
              >
                <span className="lm-mono-sm text-fg-3 pt-1 shrink-0">
                  {String(bulletIndex + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {skills.length > 0 && (
          <div className={`mt-6 flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
            {skills.map((skill) => (
              <span key={skill} className="lm-tag">{skill}</span>
            ))}
          </div>
        )}

        {item.link?.href && (
          <div className={`mt-6 ${isLeft ? 'md:text-right' : ''}`}>
            <a href={item.link.href} target="_blank" rel="noreferrer" className="lm-btn">
              <span>{item.link.label}</span>
              <Arrow />
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
