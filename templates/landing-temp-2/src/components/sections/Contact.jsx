import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import { Rich } from '../ui/Rich.jsx';
import { SectionHeader } from './About.jsx';
import { roman } from '../../hooks/roman.js';

const ease = [0.22, 1, 0.36, 1];

const { profile, contactLinks, contact, labels } = templateConfig;
const meta = templateConfig.sections.contact;
const { header } = meta;

export default function Contact() {
  return (
    <section id={meta.id} className="section relative" aria-label={meta.ariaLabel}>
      <div className="container-x px-4 md:px-6">
        <SectionHeader index={header.index} label={header.label} pp={header.pp} kicker={header.kicker} />

        <BigCTA />

        <div className="mt-16 md:mt-24 grid grid-cols-12 gap-x-8 gap-y-12">
          <div className="col-span-12 md:col-span-7">
            <div className="caption mb-3">{meta.channelsLabel} · {roman(header.index)}</div>
            <h3 className="display text-fg text-3xl md:text-4xl mb-6">
              <Rich nodes={contact.channelsTitle} />
            </h3>
            <ul className="border-t border-fg">
              {(contactLinks || []).map((c, i) => (
                <ChannelRow key={c.type} channel={c} index={i} />
              ))}
            </ul>
          </div>

          <aside className="col-span-12 md:col-span-5 md:border-l md:border-line md:pl-8">
            <div className="caption mb-3">{meta.availabilityLabel}</div>
            <div className="plate" data-fig={`FIG. ${roman(meta.availabilityFig)}`}>
              <div className="pt-7">
                <p className="body-serif text-fg text-[16px] leading-relaxed text-pretty">
                  <Rich nodes={contact.editorsNote} />
                </p>
                <dl className="mt-6 space-y-2.5 text-[14px]">
                  {(contact.details || []).map((d) => (
                    <Row key={d.label} label={d.label} value={d.value} />
                  ))}
                </dl>
              </div>
              <div className="plate-caption">
                {contact.plateCaption}
              </div>
            </div>

            <div className="caption mt-10 mb-3">{meta.colophonLabel}</div>
            <p className="body-serif text-fg-3 text-[14px] leading-relaxed text-pretty">
              <Rich nodes={labels.contactColophon} />
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function BigCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const words = contact.cta?.words || [];

  return (
    <div ref={ref} className="mt-10 md:mt-14">
      <div className="caption mb-3">{contact.cta?.kicker}</div>
      <h2 className="display text-fg text-[clamp(3rem,12vw,12rem)] leading-[0.85] tracking-[-0.04em]">
        {words.map((word, i) => (
          <span key={i} className="reveal block">
            <motion.span
              initial={{ y: '110%' }}
              animate={inView ? { y: '0%' } : {}}
              transition={{ duration: 1, ease, delay: 0.1 + i * 0.08 }}
              className="reveal-inner"
            >
              <Rich nodes={[word]} />
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease, delay: 0.7 }}
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <CopyEmailButton email={profile.email} />
        <a href={`tel:${String(profile.phone || '').replace(/\s/g, '')}`} className="btn">
          <span>{profile.phone}</span>
        </a>
      </motion.div>
    </div>
  );
}

function CopyEmailButton({ email }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button onClick={copy} className="btn btn-accent">
      <span>{copied ? labels.copied : email}</span>
      <span aria-hidden>{copied ? labels.copiedGlyph : labels.copyGlyph}</span>
    </button>
  );
}

function ChannelRow({ channel, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const content = (
    <div className="leader py-4 group">
      <span className="caption text-accent shrink-0 w-8">{roman(index + 1)}</span>
      <span className="caption text-fg-3 shrink-0 min-w-[80px]">{channel.label}</span>
      <span className="leader-dots" />
      <span className="body-serif text-fg-2 group-hover:text-fg transition-colors text-right text-[14px] truncate">
        {channel.value}
      </span>
      <span className="caption text-fg-3 group-hover:text-accent transition-colors shrink-0 w-5 text-right">
        {channel.href ? '↗' : '·'}
      </span>
    </div>
  );

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease, delay: index * 0.06 }}
      className="border-b border-line"
    >
      {channel.href ? (
        <a href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
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
    <div className="leader items-baseline">
      <dt className="caption text-fg-3 shrink-0 min-w-[60px]">{label}</dt>
      <span className="leader-dots" />
      <dd className="body-serif text-fg-2 text-[13px] text-right max-w-[60%]">{value}</dd>
    </div>
  );
}
