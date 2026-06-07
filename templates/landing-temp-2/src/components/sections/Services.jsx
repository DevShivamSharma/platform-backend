import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { SectionHeader } from './About.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { services, servicesSection, labels } = templateConfig;
const meta = templateConfig.sections.services;
const { header } = meta;

export default function Services() {
  return (
    <section id={meta.id} className="section relative" aria-label={meta.ariaLabel}>
      <div className="container-x px-4 md:px-6">
        <SectionHeader index={header.index} label={header.label} pp={header.pp} kicker={header.kicker} />

        <div className="mt-10 md:mt-14 grid grid-cols-12 gap-x-8 gap-y-10">
          <header className="col-span-12 md:col-span-5 md:sticky md:top-28 self-start">
            <div className="caption mb-3">{header.kicker} · {roman(header.index)}</div>
            <h2 className="display text-fg text-[clamp(2.4rem,5.5vw,4.8rem)] leading-[0.92] tracking-[-0.03em]">
              <Rich nodes={servicesSection.title} />
            </h2>
            <p className="lede mt-5 text-fg-2 max-w-md text-pretty">
              {servicesSection.lede}
            </p>
            <div className="rule mt-8" />
            <p className="caption mt-5 text-fg-3">
              {meta.inquiryLead}{' '}
              <a href={meta.inquiryHref} className="text-link text-fg">
                {servicesSection.inquiryLinkText}, p. {roman(meta.inquiryPage)}
              </a>
            </p>
          </header>

          <div className="col-span-12 md:col-span-7">
            <ol className="border-t border-fg">
              {(services || []).map((svc, i) => (
                <Department key={svc.title} svc={svc} index={i} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Department({ svc, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease, delay: index * 0.05 }}
      className="group py-8 border-b border-line"
    >
      <div className="flex items-baseline gap-5">
        <span className="caption text-accent shrink-0 w-10">{roman(index + 1)}</span>
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="display text-fg text-[clamp(1.6rem,3.2vw,2.4rem)] tracking-[-0.025em] group-hover:text-accent transition-colors">
              {svc.title}
            </h3>
            <span className="caption text-fg-3 hidden md:inline">
              p. {roman(header.pp + index)}
            </span>
          </div>
          <p className="body-serif mt-3 text-fg-2 max-w-prose text-pretty">
            {svc.description}
          </p>
          <span className="signature text-base mt-3 inline-block">
            {labels.commissioned}
          </span>
        </div>
      </div>
    </motion.li>
  );
}
