import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { templateConfig } from '../../config.js';
import SectionHeader from '../ui/SectionHeader.jsx';

const ease = [0.22, 1, 0.36, 1];
const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const { skills, supportingSkills, sections = {} } = templateConfig;
const { skills: skillsSection = {} } = sections;
const skillGroups = Object.entries(asObject(skills)).filter(([, items]) => asArray(items).length > 0);
const supportingSkillItems = asArray(supportingSkills);

export default function Skills() {
  const [active, setActive] = useState(0);
  const activeGroup = skillGroups[active] || skillGroups[0] || ['', []];
  const activeGroupItems = asArray(activeGroup[1]);

  if (skillGroups.length === 0 && supportingSkillItems.length === 0) return null;

  return (
    <section id={skillsSection.id} className="lm-section relative" aria-label={skillsSection.ariaLabel}>
      <div className="lm-container px-5 md:px-10">
        <SectionHeader {...skillsSection.header} />

        {skillGroups.length > 0 && (
          <div className="mt-16 md:mt-24 grid grid-cols-12 gap-x-6 gap-y-12">
            <div className="col-span-12 md:col-span-5 lg:col-span-5">
              <ul className="border-t border-line">
                {skillGroups.map(([name, items], index) => (
                  <li
                    key={name}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    className="group border-b border-line"
                  >
                    <button className="w-full text-left py-6 md:py-8 flex items-baseline gap-5 md:gap-8">
                      <span
                        className="lm-mono-sm transition-colors"
                        style={{ color: active === index ? 'var(--accent)' : 'var(--fg-3)' }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="lm-display text-[clamp(1.5rem,3.5vw,2.6rem)] leading-[0.95] tracking-[-0.025em] transition-colors"
                        style={{ color: active === index ? 'var(--fg)' : 'var(--fg-3)' }}
                      >
                        {name}
                      </span>
                      <span className="ml-auto lm-mono-sm text-fg-3 hidden sm:inline">
                        {String(asArray(items).length).padStart(2, '0')} {skillsSection.itemSuffix}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 md:col-span-6 md:col-start-7 lg:col-span-7 lg:col-start-6">
              <div className="md:sticky md:top-32">
                <div className="lm-mono text-fg-3 mb-4">
                  {skillsSection.activeGroupLabel} · {String(active + 1).padStart(2, '0')}
                </div>
                <h3 className="lm-display text-fg text-3xl md:text-4xl tracking-[-0.025em]">
                  {activeGroup[0]}
                </h3>
                <div className="lm-hairline my-7" />
                <motion.div
                  key={active}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.03 } },
                  }}
                  className="flex flex-wrap gap-2"
                >
                  {activeGroupItems.map((skill) => (
                    <motion.span
                      key={skill}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
                      }}
                      className="lm-tag"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {supportingSkillItems.length > 0 && <SupportingRow items={supportingSkillItems} />}
      </div>
    </section>
  );
}

function SupportingRow({ items }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const safeItems = asArray(items);

  return (
    <div ref={ref} className="mt-24 md:mt-28 border-t border-line pt-10">
      <div className="flex items-baseline justify-between mb-8">
        <div className="lm-mono text-fg-3">{skillsSection.supportingLabel}</div>
        <div className="lm-mono-sm text-fg-3">
          {String(safeItems.length).padStart(2, '0')} {skillsSection.supportingSuffix}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
        {safeItems.map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease, delay: index * 0.04 }}
            className="flex items-start gap-3 text-[13px] text-fg-2 py-2 border-b border-line"
          >
            <span className="lm-mono-sm text-fg-3 pt-1">{String(index + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
