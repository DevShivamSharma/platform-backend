import { useEffect, useState } from 'react';
import { templateConfig } from '../../config.js';
import { roman } from '../../hooks/roman.js';

const { profile, publication, navigation, derived, labels, footer } = templateConfig;
const navLinks = navigation.links || [];
const lastName = String(profile.fullName || '').split(' ').slice(1).join(' ');

export default function Footer() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
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
    <footer className="relative border-t border-fg bg-elev mt-px">
      <div className="container-x px-4 md:px-6 pt-14 md:pt-20 pb-10">
        <div className="rule-fat mb-10" />

        <div className="grid grid-cols-12 gap-x-8 gap-y-12">
          <div className="col-span-12 md:col-span-6">
            <div className="caption mb-4">{footer.mastheadLabel} · {derived.issueLabel}</div>
            <h4 className="display text-fg text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.035em]">
              {profile.firstName}{' '}
              <em className="display-italic">{lastName}.</em>
            </h4>
            <p className="lede mt-4 text-fg-2 max-w-md text-pretty">
              {profile?.role || ''} · {profile?.currentTitle || ''}, {labels?.writingFrom || ''}{' '}
              <em className="signature not-italic">{publication?.place || ''}</em>.
            </p>
          </div>

          <div className="col-span-6 md:col-span-3">
            <div className="caption mb-4">{footer.contentsLabel}</div>
            <ul className="space-y-1">
              {navLinks.map(({ label, href }, i) => (
                <li key={href} className="leader text-[14px]">
                  <span className="caption text-fg-3 shrink-0 w-8">{roman(i + 1)}</span>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="body-serif text-fg-2 hover:text-accent transition-colors"
                  >
                    {label}
                  </a>
                  <span className="leader-dots" />
                  <span className="caption text-fg-3 shrink-0">p. {roman(4 + i * 6)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-3">
            <div className="caption mb-4">{footer.statusLabel}</div>
            <ul className="space-y-2 text-[14px] body-serif">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-accent inline-block animate-pulse" />
                <span className="text-fg-2">{labels.openForLetters}</span>
              </li>
              <li className="text-fg-3 caption">{profile.location}</li>
              <li className="text-fg-3 caption">IST · {time}</li>
            </ul>
          </div>
        </div>

        <div className="rule mt-14" />

        <div className="mt-6 flex flex-col md:flex-row md:items-baseline md:justify-between gap-3">
          <div className="caption text-fg-3">
            {derived.copyrightLine} ·{' '}
            <em className="signature not-italic">{labels.printedLine}</em>
          </div>
          <div className="caption text-fg-3 flex items-center gap-5">
            <span>{derived.volumeLine}</span>
            <a href="#hero" className="link-underline hover:text-fg">{labels.returnToCover}</a>
          </div>
        </div>

        <div className="caption text-fg-3 mt-4 max-w-3xl">
          {labels.footerColophon}
        </div>
      </div>
    </footer>
  );
}
