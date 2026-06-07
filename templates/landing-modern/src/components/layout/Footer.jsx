import { useEffect, useState } from 'react';
import { templateConfig } from '../../config.js';

const asArray = (value) => (Array.isArray(value) ? value : []);
const { profile = {}, navigation = {}, footer = {}, sections = {} } = templateConfig;
const navLinks = asArray(navigation.links);

export default function Footer() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: footer.timeZone,
        });
        setTime(formatter.format(new Date()));
      } catch {
        setTime(new Date().toLocaleTimeString());
      }
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="relative border-t border-line bg-base mt-px">
      <div className="lm-container px-5 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-6">
            <div className="lm-mono text-fg-3 mb-5">{footer.signoffLabel}</div>
            <h4 className="lm-display text-fg text-4xl md:text-5xl leading-[0.95] tracking-[-0.03em]">
              {profile.fullName}.
            </h4>
            <p className="text-fg-2 mt-4 max-w-md text-[14px] leading-relaxed">
              {profile.role} · {profile.currentTitle}
            </p>
          </div>

          <div className="col-span-6 md:col-span-3">
            <div className="lm-mono text-fg-3 mb-5">{footer.indexLabel}</div>
            <ul className="space-y-2">
              {navLinks.map((link = {}, index) => {
                const { label, href } = link;

                return (
                  <li key={href || index} className="flex items-baseline gap-2 text-[13px]">
                    <span className="lm-mono-sm text-fg-3 w-6">{String(index + 1).padStart(2, '0')}</span>
                    <a
                      href={href}
                      onClick={(event) => {
                        event.preventDefault();
                        if (!href) return;
                        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="lm-link-underline text-fg-2 hover:text-fg"
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-3">
            <div className="lm-mono text-fg-3 mb-5">{footer.statusLabel}</div>
            <ul className="space-y-2 text-[13px] text-fg-2">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] animate-pulse inline-block" />
                <span>{footer.openStatus}</span>
              </li>
              <li>{profile.location}</li>
              <li className="lm-mono-sm text-fg-3">{footer.timePrefix} {time}</li>
            </ul>
          </div>
        </div>

        <div className="lm-hairline mt-14" />

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lm-mono-sm text-fg-3">
          <div>{footer.copyrightText}</div>
          <div className="flex items-center gap-6">
            <a href={`#${sections.hero?.id || 'hero'}`} className="lm-link-underline hover:text-fg">
              {footer.backToTop}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
