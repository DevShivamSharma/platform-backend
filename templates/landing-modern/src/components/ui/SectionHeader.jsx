import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

export default function SectionHeader({ index, label, title, subtitle }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });

  return (
    <div ref={ref} className="flex items-end justify-between gap-6 border-b border-line pb-6">
      <div className="flex items-center gap-4 md:gap-6 lm-mono text-fg-3">
        <span className="text-[var(--accent)]">{index}</span>
        <span className="lm-hairline w-12" />
        <span>{label}</span>
      </div>
      <div className="text-right">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.9, ease }}
          className="lm-display text-fg text-[clamp(2rem,5.5vw,4.8rem)] leading-[0.9] tracking-[-0.035em]"
        >
          {title}
        </motion.div>
        {subtitle && <div className="lm-mono text-fg-3 mt-2">{subtitle}</div>}
      </div>
    </div>
  );
}
