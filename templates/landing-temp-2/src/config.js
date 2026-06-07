// =============================================================================
// FIXED TEMPLATE LAYER  —  src/config.js
// -----------------------------------------------------------------------------
// Template identity. Never edited per-site.
//
// CONTENT LAYER (content.json) uses the STANDARD portfolio schema — the same
// schema as landing-modern.  This config translates flat portfolio data into the
// editorial structures that components consume.
//
// Merge order:  defaultContent  <-  content.json  <-  .platform-meta.json
// Single export: `templateConfig`, fully resolved + guarded so a partial or
// empty content.json can never crash a component.
// =============================================================================

import contentData from './content.json';
import { roman } from './hooks/roman.js';

/* ---------------------------------------------------------------- guards --- */
const isPlainObject = (v) =>
  v != null && typeof v === 'object' && !Array.isArray(v);
export const asObject = (v) => (isPlainObject(v) ? v : {});
export const asArray  = (v) => (Array.isArray(v) ? v : []);
export const asString = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function deepMerge(base, over) {
  if (!isPlainObject(over)) return over === undefined ? base : over;
  const out = isPlainObject(base) ? { ...base } : {};
  for (const [k, v] of Object.entries(over)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

const firstNonEmpty = (...vals) => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

/* ----------------------------------------------- platform-meta override --- */
function loadPlatformMeta() {
  try {
    const mods = import.meta.glob('../.platform-meta.json', { eager: true });
    const first = Object.values(mods)[0];
    return asObject(first && (first.default ?? first));
  } catch {
    return {};
  }
}

// Standard schema keys — same as landing-modern.
const KNOWN_META_KEYS = [
  'siteName', 'meta', 'profile', 'education', 'stats',
  'skills', 'supportingSkills', 'projects', 'experience', 'services',
  'contactLinks', 'footerCopyright',
];
function pickKnown(obj) {
  const out = {};
  for (const k of KNOWN_META_KEYS) if (k in obj) out[k] = obj[k];
  return out;
}

/* ------------------------------------------------------- empty scaffold --- */
// Safe defaults matching the standard landing-modern schema so a missing key
// degrades to nothing rather than throwing.
const defaultContent = {
  siteName: 'Portfolio',
  meta: { title: '', description: '' },
  profile: {
    firstName: '', fullName: 'Portfolio', role: '', currentTitle: '',
    company: '', period: '', location: '', email: '', phone: '',
    heroHeadline: '', heroSummary: '', availability: '',
  },
  education: { degree: '', school: '', period: '', cgpa: '', summary: '' },
  stats: [],
  skills: {},
  supportingSkills: [],
  projects: [],
  experience: [],
  services: [],
  contactLinks: [],
  footerCopyright: '',
};

const platformMeta = pickKnown(loadPlatformMeta());
const content = deepMerge(deepMerge(defaultContent, asObject(contentData)), platformMeta);

/* ============================================================ RESOLVE ====== */
const siteName = firstNonEmpty(content.siteName, content.profile?.fullName, defaultContent.siteName);

const profile = { ...defaultContent.profile, ...asObject(content.profile) };
profile.fullName  = firstNonEmpty(profile.fullName, siteName, defaultContent.profile.fullName);
profile.firstName = firstNonEmpty(profile.firstName, profile.fullName.split(/\s+/)[0], profile.fullName);

const education        = { ...asObject(content.education) };
const skills           = asObject(content.skills);
const stats            = asArray(content.stats);
const projects         = asArray(content.projects);
const experience       = asArray(content.experience);
const services         = asArray(content.services);
const contactLinks     = asArray(content.contactLinks);
const supportingSkills = asArray(content.supportingSkills);

/* ====== TRANSLATION LAYER — editorial structures from flat schema ========== */

// --- Education derived fields ------------------------------------------------
function deriveDegreeShort(edu) {
  if (edu.summary) {
    // "B.Tech CSE · CGPA 7.31"  →  "B.Tech CSE"
    return edu.summary.split('·')[0].trim();
  }
  const d = edu.degree || '';
  return d
    .replace(/Bachelor of Technology/i, 'B.Tech')
    .replace(/Bachelor of Engineering/i, 'B.E.')
    .replace(/Master of Technology/i, 'M.Tech')
    .replace(/Master of Science/i, 'M.S.')
    .replace(/Master of Business Administration/i, 'MBA')
    .replace(/Bachelor of Science/i, 'B.Sc.')
    .replace(/Bachelor of Arts/i, 'B.A.')
    .replace(/in Computer Science and Engineering/i, 'CSE')
    .replace(/in Computer Science/i, 'CS')
    .replace(/in Information Technology/i, 'IT')
    .replace(/in Electrical Engineering/i, 'EE')
    .replace(/in Mechanical Engineering/i, 'ME')
    .trim() || 'Degree';
}
education.degreeShort = deriveDegreeShort(education);

// --- Publication (auto-generated) --------------------------------------------
const SEASONS     = ['Winter', 'Spring', 'Summer', 'Fall'];
const currentYear = new Date().getFullYear();
const curSeason   = SEASONS[Math.floor(new Date().getMonth() / 3)];

const locationCity    = (profile.location || '').split(',')[0].trim() || 'Earth';
const locationCountry = ((profile.location || '').split(',')[1] || '').trim();
const locationShort   = locationCountry
  ? `${locationCity}, ${locationCountry.slice(0, 3).toUpperCase()}`
  : locationCity;

const publication = {
  issueNumber:   1,
  season:        `${curSeason} ${currentYear}`,
  seasonShort:   `${curSeason} '${String(currentYear).slice(-2)}`,
  volume:        1,
  number:        1,
  totalPages:    48,
  copyrightYear: currentYear,
  place:         locationCity,
  tagline:       firstNonEmpty(profile.role, profile.currentTitle, 'Portfolio'),
};

// --- Document (mapped from meta) ---------------------------------------------
const doc = {
  title:       firstNonEmpty(content.meta?.title, siteName),
  description: firstNonEmpty(content.meta?.description),
  lang:        'en',
};

// --- Hero (auto-generated from profile + skills) -----------------------------
function buildHero() {
  const fullName  = profile.fullName;
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const surname   = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const givenNames = nameParts.length > 1 ? nameParts.slice(0, -1) : nameParts;

  // Cover name: given names on line 1, surname (italic) on line 2
  const coverName = surname
    ? [givenNames, [{ t: surname, em: 'display-italic' }, '.']]
    : [[fullName]];

  const bylineSurname = (surname || fullName).toUpperCase();
  const bylineInitial = profile.firstName.charAt(0).toUpperCase();

  // Build lede from heroHeadline
  const role = firstNonEmpty(profile.role, profile.currentTitle, 'professional');
  const lede = [];
  if (profile.heroHeadline) {
    lede.push('A ');
    lede.push({ t: role.toLowerCase(), em: 'signature' });
    lede.push(` ${profile.heroHeadline} `);
    if (profile.availability) {
      lede.push({ t: profile.availability, em: 'muted' });
    }
  } else {
    lede.push(`${fullName} — ${role}.`);
    if (profile.availability) {
      lede.push(' ');
      lede.push({ t: profile.availability, em: 'muted' });
    }
  }

  // Marquee items from skill group names + role
  const groupNames = Object.keys(skills);
  const marqueeItems = [
    role.toLowerCase(),
    ...groupNames.slice(0, 3).map((g) => g.toLowerCase()),
    profile.availability ? 'available now' : 'portfolio',
  ].slice(0, 5);

  // Extract a punchy quote from heroHeadline
  const quoteText = profile.heroHeadline
    ? (profile.heroHeadline.split('—')[0]?.trim() || profile.heroHeadline.slice(0, 80))
    : `Building with ${role.toLowerCase()}.`;

  return {
    masthead: {
      byline:    `${bylineSurname} · ${bylineInitial}.`,
      location:  locationShort,
      pageRange: '02–48',
    },
    coverlineKicker: `A monograph — ${role.toLowerCase()}`,
    coverName,
    lede,
    primaryCta:   { label: 'Read the issue', href: '#projects' },
    secondaryCta: { label: 'Letters to editor', href: '#contact' },
    sideQuote: {
      featureIndex: 1,
      quote:        quoteText,
      source:       'Practice',
      sourcePage:   4,
    },
    marqueeItems,
  };
}

// --- About (auto-generated from profile) -------------------------------------
function buildAbout() {
  const role         = firstNonEmpty(profile.role, profile.currentTitle, 'professional');
  const currentTitle = firstNonEmpty(profile.currentTitle, profile.role);

  // Title
  const title = currentTitle && currentTitle !== role
    ? [`${role}. `, { t: `${currentTitle}.`, em: 'display-italic' }]
    : [{ t: `${role}.`, em: 'display-italic' }];

  // Lede
  const lede = profile.heroHeadline
    ? ['A practice in ', { t: role.toLowerCase(), em: 'signature' },
       ` — ${profile.heroHeadline.split('—')[0]?.trim() || role.toLowerCase()}.`]
    : [`A ${role.toLowerCase()} practice.`];

  // Lead paragraph from heroSummary
  const lead = profile.heroSummary
    ? [profile.heroSummary]
    : [`${profile.fullName} is a ${role.toLowerCase()}${profile.company ? ` at ${profile.company}` : ''}.`];

  // Second paragraph
  const second = profile.heroSummary
    ? [`The current chapter — building on years of ${role.toLowerCase()} work — continues with the same instincts: predictability, repair-ability, and a quiet kind of beauty in the code.`]
    : [''];

  // Pull quote
  const pullQuote = profile.heroSummary
    ? (profile.heroSummary.match(/[^.!?]*[.!?]/)?.[0]?.trim() || `A ${role.toLowerCase()} practice.`)
    : `A ${role.toLowerCase()} practice.`;

  // Two-column body
  const columns = [
    profile.company
      ? [`Working at `, { t: profile.company, em: 'signature' },
         ` as ${currentTitle}${profile.location ? `, based in ${profile.location}` : ''}.`]
      : [`${profile.fullName} portfolio.`],
    stats.length > 0
      ? [`The work is concrete: ${stats.slice(0, 3).map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')}.`]
      : [''],
  ];

  // Signoff initials
  const initials = profile.fullName
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join('.');
  const signoffName = initials || 'P.';

  return { title, lede, lead, second, pullQuote, columns, signoffName };
}

// --- Contact (auto-generated from profile) -----------------------------------
function buildContact() {
  const role = firstNonEmpty(profile.role, profile.currentTitle, 'professional');

  const cta = {
    kicker: `A note from the ${role.toLowerCase()}`,
    words: [
      { t: "Let's" },
      { t: 'build' },
      { t: 'something', em: 'display-italic' },
      { t: 'real.' },
    ],
  };

  const channelsTitle = ['How to ', { t: 'reach', em: 'display-italic' }, ' the desk.'];

  const editorsNote = profile.availability
    ? [{ t: 'Open', em: 'signature' }, ` — ${profile.availability}`]
    : [{ t: 'Available', em: 'signature' }, ' for new work.'];

  const details = [
    profile.location && { label: 'Based', value: profile.location },
    { label: 'Tongues', value: 'English' },
    { label: 'Reply',   value: 'Within 24h, weekdays' },
    { label: 'Time',    value: 'Asia/Kolkata · GMT+5:30' },
  ].filter(Boolean);

  return {
    cta,
    channelsTitle,
    editorsNote,
    details,
    plateCaption: 'Inquiries treated with discretion. Long-form prospectus on request.',
  };
}

// --- Section copy (smart defaults) -------------------------------------------
function buildSkillsSection() {
  return {
    title: ['A working ', { t: 'stack', em: 'display-italic' }, '.'],
    lede:  'Disciplines listed below. Hover an entry to read the contents of its chapter.',
    supportingCaption: 'Signals beyond stack — habits and reflexes accumulated on the job.',
  };
}

function buildProjectsSection() {
  const n = projects.length;
  const w = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'][n] || String(n);
  return {
    title: [`${w} `, { t: 'features', em: 'display-italic' }, ',', { br: true }, 'one practice.'],
    lede:  'Selected from professional and personal work. Each entry is a short feature; the full case studies are available on request.',
    endPlate: {
      title: ['More work on ', { t: 'request', em: 'display-italic' }, '.'],
      lede:  'Several engagements remain private. Reach out for an unedited tour.',
      cta:   { label: 'Start correspondence', href: '#contact' },
    },
  };
}

function buildExperienceSection() {
  return {
    title: ['A short ', { t: 'chronicle', em: 'display-italic' }, '.'],
    lede:  'Listed in reverse chronology.',
  };
}

function buildServicesSection() {
  return {
    title: ['For hire,', { br: true }, { t: 'presently.', em: 'display-italic' }],
    lede:  'Standing engagements listed below. Each may be commissioned independently or as part of a longer run.',
    inquiryLinkText: 'correspondence',
  };
}

// --- NavLinks (always 6 section anchors) -------------------------------------
const navLinks = [
  { label: 'About',      href: '#about' },
  { label: 'Skills',     href: '#skills' },
  { label: 'Projects',   href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Services',   href: '#services' },
  { label: 'Contact',    href: '#contact' },
];

/* ============================================================ FIXED THEME == */
// Mirrors index.css. Palette keys map to CSS custom properties.
const theme = {
  fonts: {
    display: '"Fraunces", "Times New Roman", Georgia, serif',
    serif:   '"Newsreader", "Iowan Old Style", "Charter", Georgia, serif',
    sans:    '"Newsreader", "Iowan Old Style", Georgia, serif',
    mono:    '"IBM Plex Mono", "JetBrains Mono", Consolas, monospace',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@300;400;500&display=swap',
  },
  tailwindTokens: {
    paper: '#ece7dc', 'paper-2': '#e0d9c8', 'paper-3': '#d4cab5',
    ink: '#1a1612', 'ink-2': '#3a2f25', mute: '#7a6d5e',
    terra: '#7a3b2a', 'terra-2': '#5e2c1f', sage: '#5a6b4a', gold: '#b08a44',
  },
  modes: {
    light: {
      bg: '#ece7dc', bg2: '#e0d9c8', bg3: '#d4cab5', bg4: '#beb09a',
      fg: '#1a1612', fg2: '#3a2f25', fg3: '#7a6d5e', muted: '#9a8f7e',
      line: '#c9bfae', line2: '#b0a690', accent: '#7a3b2a', accent2: '#5e2c1f',
      sage: '#5a6b4a', gold: '#b08a44',
      selection: 'rgba(122, 59, 42, 0.2)', glass: 'rgba(236, 231, 220, 0.85)',
      colorScheme: 'light',
    },
    dark: {
      bg: '#1a1612', bg2: '#221c17', bg3: '#2a231d', bg4: '#3a2f25',
      fg: '#ece7dc', fg2: '#d4cab5', fg3: '#9a8f7e', muted: '#7a6d5e',
      line: '#3a2f25', line2: '#4a3d30', accent: '#c87456', accent2: '#d8856a',
      sage: '#8aa078', gold: '#d4ad65',
      selection: 'rgba(200, 116, 86, 0.28)', glass: 'rgba(26, 22, 18, 0.85)',
      colorScheme: 'dark',
    },
  },
};

/* ------------------------------------------------------------- effects --- */
const effects = {
  cursor: { dot: '#fff', ring: 'rgba(255,255,255,0.85)', label: '#fff', blend: 'difference' },
  themeColorMeta: theme.modes.light.bg,
};

/* ----------------------------------------------------- global micro-copy -- */
const labels = {
  feature:         'Feature',
  featuredTag:     '★ Featured',
  note:            'Note —',
  continued:       'Continued ↓',
  returnToCover:   'Return to cover ↑',
  openForLetters:  'Open for letters',
  writingFrom:     'writing from',
  printedLine:     `printed on the web in ${locationCity}`,
  commissioned:    '— commissioned by inquiry',
  noted:           'noted',
  copied:          'Copied to clipboard',
  copyGlyph:       '⧉',
  copiedGlyph:     '✓',
  inThisVolume:    'In this volume',
  disciplines:     'Disciplines',
  contactColophon: [
    'Set in ',
    { t: 'Fraunces', em: 'signature-plain' },
    ' for display and ',
    { t: 'Newsreader', em: 'signature-plain' },
    ' for body. Captions in ',
    { t: 'IBM Plex Mono', em: 'signature-plain' },
    '. Hand-built in React, GSAP, and Framer Motion.',
  ],
  footerColophon:
    'Set in Fraunces, Newsreader, and IBM Plex Mono. Hand-set in React, GSAP, and Framer Motion. Printed on a Vite press, served from a static distribution.',
};

/* ---------------------------------------------- per-section chrome (fixed) - */
const sections = {
  hero: {
    id: 'hero', ariaLabel: 'Cover',
    coverPage: 2,
    statsFig: 1,
    volumeCaptionLead: 'Selected metrics from contributing essays. See pp.',
    statsPages: [8, 36],
    marqueeSeparator: '✦',
  },
  about: {
    id: 'about', ariaLabel: 'Practice',
    header: { index: 1, kicker: 'Feature', label: 'Practice', pp: 4 },
    ppEnd: 7,
    sidebarLabel: 'Sidebar · Profile',
    profileRowLabels: ['Role', 'Title', 'Location', 'Edu.', 'School'],
    numbersLabel: 'By the numbers',
    numbersFig: 2,
    numbersCaption: 'Aggregated across professional work.',
  },
  skills: {
    id: 'skills', ariaLabel: 'Stack',
    header: { index: 2, kicker: 'Contents', label: 'Stack', pp: 8 },
    tocLabel: 'Table of contents',
    supportingLabel: 'Adjacent strengths · Appendix A',
    supportingFig: 3,
  },
  projects: {
    id: 'projects', ariaLabel: 'Selected work',
    header: { index: 3, kicker: 'Features', label: 'Selected Work', pp: 16 },
    editorNoteLabel: "Editor's note",
    vitalLabel: 'Vital statistics',
    stackUsedLabel: 'Stack used',
    stackCaptionPrefix: 'Working set for ',
    stackCaptionSuffix: '; some tools shared across features.',
    continuedOnPage: 'Continued on p.',
    endOfSection: 'End of section ·',
    finLabel: 'fin',
    endLabel: 'End of features',
    endPage: 36,
  },
  experience: {
    id: 'experience', ariaLabel: 'Trajectory',
    header: { index: 4, kicker: 'Chronicle', label: 'Trajectory', pp: 36 },
  },
  services: {
    id: 'services', ariaLabel: 'Engagements',
    header: { index: 5, kicker: 'Departments', label: 'Engagements', pp: 40 },
    inquiryLead: 'All inquiries via',
    inquiryHref: '#contact',
    inquiryPage: 44,
  },
  contact: {
    id: 'contact', ariaLabel: 'Correspondence',
    header: { index: 6, kicker: 'Back matter', label: 'Correspondence', pp: 44 },
    channelsLabel: 'Channels',
    availabilityLabel: "Editor's note · Availability",
    availabilityFig: 9,
    colophonLabel: 'Colophon · brief',
  },
};

const footer = {
  mastheadLabel:  'Masthead',
  contentsLabel:  'Contents',
  statusLabel:    'Status',
};

/* --------------------------------------------------- resolved + derived --- */
const issueRoman  = roman(publication.issueNumber || 0);
const volumeRoman = roman(publication.volume || 0);
const seasonShort = asString(publication.seasonShort);

const derived = {
  issueRoman,
  volumeRoman,
  issueLabel:    `Issue ${issueRoman}`,
  editionFull:   `Issue ${issueRoman} · ${seasonShort}`,
  volumeLine:    `Vol. ${volumeRoman} · No. ${publication.number ?? ''}`,
  copyrightLine: firstNonEmpty(content.footerCopyright)
                   || `© ${publication.copyrightYear ?? ''} · ${asString(profile.fullName)}`,
};

const brandMark = profile.firstName.charAt(0).toUpperCase() || 'P';
const navigation = {
  brand: { mark: brandMark, dot: '.', edition: derived.editionFull },
  cta:   { short: 'Letters', long: 'Letters to editor', href: '#contact' },
  links: navLinks,
};

/* ================================================ SINGLE PUBLIC EXPORT ==== */
export const templateConfig = {
  theme,
  effects,
  labels,
  navigation,
  sections,
  footer,
  derived,

  // Resolved content (guarded).
  publication,
  document: doc,
  profile,
  education,

  stats,
  skillGroups: skills,          // Standard schema key "skills" → component key "skillGroups"
  supportingSkills,
  projects,
  experience,
  services,
  contactLinks,

  // Auto-generated editorial structures from flat schema.
  hero:              buildHero(),
  about:             buildAbout(),
  skillsSection:     buildSkillsSection(),
  projectsSection:   buildProjectsSection(),
  experienceSection: buildExperienceSection(),
  servicesSection:   buildServicesSection(),
  contact:           buildContact(),
};

export default templateConfig;
