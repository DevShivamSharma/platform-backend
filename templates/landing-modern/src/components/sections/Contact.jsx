import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import SectionHeader from '../ui/SectionHeader.jsx';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);
const { profile = {}, contactLinks, sections = {} } = templateConfig;
const safeContactLinks = asArray(contactLinks);
const { contact = {} } = sections;

export default function Contact() {
  const detailRows = asArray(contact.detailRows);

  return (
    <section id={contact.id} className="lm-section relative lm-grid-bg lm-noise" aria-label={contact.ariaLabel}>
      <div className="lm-container px-5 md:px-10">
        <SectionHeader {...contact.header} />

        <div className="mt-20 md:mt-28">
          <BigCTA />
        </div>

        <div className="mt-20 md:mt-28 grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-5">
            <div className="lm-mono text-fg-3">{contact.channelsLabel}</div>
            {safeContactLinks.length > 0 && (
              <ul className="mt-6 divide-y divide-[var(--line)] border-y border-line">
                {safeContactLinks.map((channel = {}, index) => (
                  <ChannelRow key={channel.type || channel.label || index} channel={channel} index={index} />
                ))}
              </ul>
            )}
          </div>

          <div className="col-span-12 md:col-span-6 md:col-start-7">
            <div className="lm-mono text-fg-3">{contact.nowLabel}</div>
            <p className="mt-6 lm-display text-fg text-3xl md:text-4xl leading-[1.05] tracking-[-0.025em] text-pretty">
              {profile.availability}
            </p>
            {detailRows.length > 0 && (
              <>
                <div className="lm-hairline my-8" />
                <dl className="space-y-4 text-[13px]">
                  {detailRows.map((row = {}, index) => (
                    <Row key={row.label || index} label={row.label} value={row.value} />
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BigCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const words = asArray(contact.bigCtaWords);
  const phone = profile.phone || '';
  const phoneHref = phone ? `tel:${String(phone).replace(/\s/g, '')}` : '';

  return (
    <div ref={ref} className="relative">
      <h2 className="lm-display text-fg text-[clamp(3.6rem,13vw,13rem)] leading-[0.85] tracking-[-0.045em]">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className="lm-reveal block">
            <motion.span
              initial={{ y: '110%' }}
              animate={inView ? { y: '0%' } : {}}
              transition={{ duration: 1, ease, delay: 0.1 + index * 0.08 }}
              className="lm-reveal-inner"
            >
              {index === contact.bigCtaItalicIndex ? <em className="lm-display-italic">{word}</em> : word}
              {index < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease, delay: 0.7 }}
        className="mt-12 flex flex-wrap items-center gap-4"
      >
        <CopyEmailButton email={profile.email} />
        {phone && (
          <a href={phoneHref} className="lm-btn">
            <span>{phone}</span>
          </a>
        )}
      </motion.div>
    </div>
  );
}

function CopyEmailButton({ email }) {
  const [copied, setCopied] = useState(false);
  const safeEmail = email ? String(email) : '';

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safeEmail);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${safeEmail}`;
    }
  };

  if (!safeEmail) return null;

  return (
    <button onClick={copy} className="lm-btn lm-btn-accent">
      <span>{copied ? contact.copySuccessText : safeEmail}</span>
      <span aria-hidden>{copied ? contact.copiedIcon : contact.copyIcon}</span>
    </button>
  );
}

function ChannelRow({ channel = {}, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const href = typeof channel.href === 'string' ? channel.href : '';
  const content = (
    <div className="flex items-center justify-between gap-6 py-5 group">
      <div className="flex items-center gap-5 min-w-0">
        <span className="lm-mono-sm text-fg-3 w-6 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="lm-mono-sm text-fg-3 w-20 shrink-0">{channel.label}</span>
        <span className="text-fg-2 group-hover:text-fg truncate transition-colors">
          {channel.value}
        </span>
      </div>
      <span className="lm-mono-sm text-fg-3 group-hover:text-[var(--accent)] transition-colors shrink-0">
        {href ? contact.externalIndicator : contact.emptyIndicator}
      </span>
    </div>
  );

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease, delay: index * 0.06 }}
    >
      {href ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </motion.li>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-line pb-3">
      <dt className="lm-mono-sm text-fg-3 w-24 shrink-0">{label}</dt>
      <dd className="text-fg-2 flex-1 text-[13px] leading-snug">{value}</dd>
    </div>
  );
}
