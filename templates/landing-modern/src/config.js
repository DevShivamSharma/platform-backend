import resumePdf from './assets/portfolio_resume.pdf';
import faviconSvg from './assets/favicon.svg';
import loadedContent from './content.json';

// ---------------------------------------------------------------------------
// Two-layer config:
//   - FIXED layer (this file): theme, modes, fonts, effects, micro-copy/labels,
//     navigation links, section ids. Template visual identity. Don't edit per-user.
//   - CONTENT layer (content.json): siteName, profile, education, stats, skills,
//     supportingSkills, projects, experience, services, contactLinks,
//     footerCopyright. THIS is what each new portfolio swaps.
//
// Any new portfolio = drop a fresh content.json. Components never change.
// .platform-meta.json (scaffolder/AI) still overrides everything at the end.
// ---------------------------------------------------------------------------

const defaultContent = {
  siteName: 'Portfolio',
  meta: {},
  profile: {
    firstName: '',
    fullName: 'Portfolio',
    role: '',
    currentTitle: '',
    company: '',
    period: '',
    location: '',
    email: '',
    phone: '',
    heroHeadline: '',
    heroSummary: '',
    availability: '',
  },
  hero: {},
  education: {},
  footer: {},
  skills: {},
  supportingSkills: [],
  projects: [],
  experience: [],
  services: [],
  contactLinks: [],
  stats: [],
  footerCopyright: '',
};

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

const firstNonEmptyString = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
};

const toNameWords = (value) => firstNonEmptyString(value).split(/\s+/).filter(Boolean);

const buildHeroNameLines = (fullName) => {
  const words = toNameWords(fullName || defaultContent.profile.fullName);
  if (words.length <= 1) {
    return [{ text: words[0] || defaultContent.profile.fullName, uppercase: true }];
  }

  const surname = words[words.length - 1];
  const givenNames = words.slice(0, -1).join(' ');

  return [
    { text: givenNames, uppercase: true },
    { text: `${surname}—`, uppercase: true },
  ];
};

const toFileStem = (value) =>
  firstNonEmptyString(value, defaultContent.profile.fullName)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'Portfolio';

const getBrandInitial = (firstName, fullName) =>
  firstNonEmptyString(firstName, fullName, defaultContent.siteName).charAt(0).toUpperCase() || 'P';

const loadedConfig = asObject(loadedContent);
const siteName =
  typeof loadedConfig.siteName === 'string' && loadedConfig.siteName
    ? loadedConfig.siteName
    : defaultContent.siteName;

const safeConfig = {
  ...defaultContent,
  ...loadedConfig,
  siteName,
  skills: asObject(loadedConfig.skills) || defaultContent.skills,
  supportingSkills: asArray(loadedConfig.supportingSkills, defaultContent.supportingSkills),
  projects: asArray(loadedConfig.projects, defaultContent.projects),
  experience: asArray(loadedConfig.experience, defaultContent.experience),
  services: asArray(loadedConfig.services, defaultContent.services),
  contactLinks: asArray(loadedConfig.contactLinks, defaultContent.contactLinks),
  stats: asArray(loadedConfig.stats, defaultContent.stats),
  profile: { ...defaultContent.profile, fullName: siteName, ...asObject(loadedConfig.profile) },
  hero: { ...defaultContent.hero, ...asObject(loadedConfig.hero) },
  education: { ...defaultContent.education, ...asObject(loadedConfig.education) },
  footer: { ...defaultContent.footer, ...asObject(loadedConfig.footer) },
  meta: { ...defaultContent.meta, ...asObject(loadedConfig.meta) },
  footerCopyright:
    typeof loadedConfig.footerCopyright === 'string'
      ? loadedConfig.footerCopyright
      : defaultContent.footerCopyright,
};

const content = safeConfig;
const resolvedSiteName = firstNonEmptyString(
  content.siteName,
  content.profile?.fullName,
  defaultContent.siteName
);
const resolvedFullName = firstNonEmptyString(
  content.profile?.fullName,
  resolvedSiteName,
  defaultContent.profile.fullName
);
const resolvedFirstName = firstNonEmptyString(
  content.profile?.firstName,
  toNameWords(resolvedFullName)[0],
  resolvedFullName
);
const resolvedRole = firstNonEmptyString(content.profile?.role, content.profile?.currentTitle);
const resolvedCurrentTitle = firstNonEmptyString(content.profile?.currentTitle, resolvedRole);
const resolvedLocation = firstNonEmptyString(content.profile?.location);
const resolvedEducation = firstNonEmptyString(
  content.education?.summary,
  content.education?.degree,
  content.education?.school
);
const resolvedCompanyPeriod = [content.profile?.company, content.profile?.period]
  .filter((value) => firstNonEmptyString(value))
  .join(' · ');
const aboutStatement = firstNonEmptyString(content.profile?.heroSummary, content.profile?.heroHeadline);

export const templateConfig = {
  meta: {
    siteName: resolvedSiteName,
    title: content.meta?.title || resolvedSiteName,
    description: content.meta?.description || '',
    themeColor: '#0a0a0a',
    faviconHref: faviconSvg,
    year: String(new Date().getFullYear()),
  },
  theme: {
    storageKey: 'landing-modern-theme',
    defaultTheme: 'dark',
    fonts: {
      display: '"Fraunces", Georgia, serif',
      sans: '"Inter", -apple-system, "Segoe UI", Helvetica, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    tailwindTokens: {
      colors: {
        ink: '#0a0a0a',
        ink2: '#111111',
        ink3: '#1a1a1a',
        ink4: '#2a2a2a',
        paper: '#fafaf7',
        paper2: '#f1efe9',
        mute: '#6b6b6b',
        mute2: '#9a9a9a',
        accent: '#ff5b1f',
        accent2: '#e34a14',
      },
    },
    modes: {
      dark: {
        bg: '#0a0a0a',
        bg2: '#111111',
        bg3: '#1a1a1a',
        bg4: '#2a2a2a',
        fg: '#f5f1ea',
        fg2: '#c9c4ba',
        fg3: '#8a8479',
        muted: '#6b665d',
        line: '#1f1f1f',
        line2: '#2a2a28',
        accent: '#ff5b1f',
        accent2: '#ffe7c2',
        selection: 'rgba(255, 91, 31, 0.35)',
        gridLine: 'rgba(245, 241, 234, 0.04)',
        glass: 'rgba(10, 10, 10, 0.72)',
      },
      light: {
        bg: '#fafaf7',
        bg2: '#f1efe9',
        bg3: '#e8e5dc',
        bg4: '#d8d3c5',
        fg: '#0a0a0a',
        fg2: '#2a2a2a',
        fg3: '#6b6b6b',
        muted: '#9a9a9a',
        line: '#e0ddd2',
        line2: '#cfcabc',
        accent: '#d84315',
        accent2: '#2a2a2a',
        selection: 'rgba(216, 67, 21, 0.22)',
        gridLine: 'rgba(10, 10, 10, 0.05)',
        glass: 'rgba(250, 250, 247, 0.78)',
      },
    },
    effects: {
      heroGlowPrimary:
        'radial-gradient(closest-side, rgba(255, 91, 31, 0.22), transparent 70%)',
      heroGlowSecondary:
        'radial-gradient(closest-side, rgba(245, 241, 234, 0.06), transparent 70%)',
      serviceHoverGlow:
        'radial-gradient(closest-side, rgba(255, 91, 31, 0.15), transparent 70%)',
      cursorDot: '#fff',
      cursorRing: 'rgba(255,255,255,0.7)',
      cursorLabel: '#fff',
    },
    labels: {
      cursorProject: 'View',
      cursorDrag: 'Drag',
      themeToggle: {
        light: 'Switch to light mode',
        dark: 'Switch to dark mode',
      },
    },
  },
  navigation: {
    brandInitial: getBrandInitial(resolvedFirstName, resolvedFullName),
    activeSectionDefault: '#hero',
    indexPrefix: 'IDX',
    ctaText: 'Get in touch',
    menuLabel: 'Toggle menu',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Skills', href: '#skills' },
      { label: 'Projects', href: '#projects' },
      { label: 'Experience', href: '#experience' },
      { label: 'Services', href: '#services' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  profile: {
    // resumeHref is bundled as a Vite asset import — stays in fixed layer.
    // Everything else comes from content.json.
    ...content.profile,
    firstName: resolvedFirstName,
    fullName: resolvedFullName,
    resumeHref: resumePdf,
  },
  education: content.education,
  stats: content.stats,
  skills: content.skills,
  supportingSkills: content.supportingSkills,
  projects: content.projects,
  experience: content.experience,
  services: content.services,
  contactLinks: content.contactLinks,
  sections: {
    hero: {
      id: 'hero',
      ariaLabel: 'Intro',
      currentLabel: '/ Currently',
      practiceLabel: '/ Practice',
      companyPrefix: '@',
      sequenceLabel: 'IDX 01 / 07',
      copyrightPrefix: '©',
      buttonWork: 'View work',
      buttonResume: 'Download resume',
      resumeDownloadName: `${toFileStem(resolvedFullName)}_Resume.pdf`,
      availabilityLabel: '/ Availability',
      scrollHint: 'Scroll to explore',
      ...asObject(content.hero),
      headlineNameLines: buildHeroNameLines(resolvedFullName),
      headlineSuffixLines: asArray(content.hero?.headlineSuffixLines, [
        { text: 'ENGINEER OF', sup: '[01]' },
        { text: 'interfaces &', italic: true },
        { text: 'systems.' },
      ]),
      marqueeSeparator: '✱',
    },
    about: {
      id: 'about',
      ariaLabel: 'About',
      header: { index: '02', label: 'About', title: 'Practice' },
      noteLabel: '/ Note 02.01',
      sideTitle: [
        { text: `${resolvedFullName}. ` },
        { text: resolvedRole || 'Portfolio', italic: true, muted: true },
      ],
      details: [
        { label: 'Role', value: resolvedRole },
        { label: 'Title', value: resolvedCurrentTitle },
        { label: 'Location', value: resolvedLocation },
        { label: 'Education', value: resolvedEducation },
      ].filter((row) => row.value),
      statement: [{ text: aboutStatement || `${resolvedFullName} portfolio.` }],
    },
    skills: {
      id: 'skills',
      ariaLabel: 'Skills',
      header: { index: '03', label: 'Capabilities', title: 'Stack' },
      activeGroupLabel: '/ Active group',
      itemSuffix: 'items',
      supportingLabel: '/ Adjacent strengths',
      supportingSuffix: 'signals',
    },
    projects: {
      id: 'projects',
      ariaLabel: 'Selected work',
      header: { index: '04', label: 'Selected Work', title: 'Projects' },
      intro: {
        index: '04',
        label: 'Case studies',
        title: [
          { text: 'Shipped at ' },
          { text: 'scale', italic: true },
          { text: '.\nBuilt for ' },
          { text: 'depth', italic: true },
          { text: '.' },
        ],
        description:
          'Four selected projects spanning healthcare, community, lending, and personal backend practice. Scroll horizontally to step through each.',
      },
      featuredLabel: 'Featured',
      metricPrefix: 'M.',
      countSeparator: 'of',
      endPanel: {
        label: '/ End of case studies',
        title: [
          { text: 'More on ' },
          { text: 'request', italic: true },
          { text: '.' },
        ],
        ctaText: 'Start a project',
      },
      progressLabel: 'Scroll →',
    },
    experience: {
      id: 'experience',
      ariaLabel: 'Experience',
      header: { index: '05', label: 'Trajectory', title: 'Experience' },
    },
    services: {
      id: 'services',
      ariaLabel: 'Services',
      header: { index: '06', label: 'Engagements', title: 'Services' },
      cardPrefix: 'SVC.',
      cardCta: 'Engage',
    },
    contact: {
      id: 'contact',
      ariaLabel: 'Contact',
      header: { index: '07', label: 'Get in touch', title: 'Contact' },
      bigCtaWords: ["Let's", 'build', 'something', 'real.'],
      bigCtaItalicIndex: 2,
      channelsLabel: '/ Channels',
      nowLabel: '/ Now',
      detailRows: [
        { label: 'Based in', value: resolvedLocation },
        { label: 'Current', value: firstNonEmptyString(resolvedCompanyPeriod, resolvedCurrentTitle) },
        { label: 'Response', value: 'Within 24h, weekdays' },
      ].filter((row) => row.value),
      copySuccessText: 'Copied to clipboard',
      copyIcon: '⧉',
      copiedIcon: '✓',
      externalIndicator: '↗',
      emptyIndicator: '—',
    },
  },
  footer: {
    signoffLabel: '/ Sign-off',
    indexLabel: '/ Index',
    statusLabel: '/ Status',
    openStatus: 'Open to work',
    timeZone: 'Asia/Kolkata',
    timePrefix: 'IST',
    copyrightText:
      content.footer?.copyrightText ||
      content.footerCopyright ||
      `© ${new Date().getFullYear()} — ${resolvedFullName}.`,
    backToTop: 'Back to top ↑',
  },
};

// ---------------------------------------------------------------------------
// Optional scaffolder override — `.platform-meta.json` at project root.
// `server/index.js` writes it during /api/generate. import.meta.glob is sync
// + eager, so a missing file resolves to {} and content.json values stay.
// Only well-known top-level keys are applied so a stray field can't blow up
// the merged config shape.
// ---------------------------------------------------------------------------
const _metaModules = import.meta.glob('../.platform-meta.json', { eager: true });
const _userOverrides =
  _metaModules['../.platform-meta.json']?.default?.config ?? {};

if (typeof _userOverrides.siteName === 'string' && _userOverrides.siteName) {
  templateConfig.meta.siteName = _userOverrides.siteName;
  templateConfig.meta.title = _userOverrides.siteName;
}
if (typeof _userOverrides.description === 'string' && _userOverrides.description) {
  templateConfig.meta.description = _userOverrides.description;
}
if (_userOverrides.profile && typeof _userOverrides.profile === 'object') {
  templateConfig.profile = { ...templateConfig.profile, ..._userOverrides.profile };
}
if (Array.isArray(_userOverrides.projects)) templateConfig.projects = _userOverrides.projects;
if (Array.isArray(_userOverrides.experience)) templateConfig.experience = _userOverrides.experience;
if (Array.isArray(_userOverrides.services)) templateConfig.services = _userOverrides.services;
if (Array.isArray(_userOverrides.contactLinks)) templateConfig.contactLinks = _userOverrides.contactLinks;
if (_userOverrides.skills && typeof _userOverrides.skills === 'object') templateConfig.skills = _userOverrides.skills;
if (Array.isArray(_userOverrides.supportingSkills)) templateConfig.supportingSkills = _userOverrides.supportingSkills;
if (Array.isArray(_userOverrides.stats)) templateConfig.stats = _userOverrides.stats;
if (_userOverrides.education && typeof _userOverrides.education === 'object') templateConfig.education = _userOverrides.education;
if (typeof _userOverrides.footerCopyright === 'string' && _userOverrides.footerCopyright) {
  templateConfig.footer.copyrightText = _userOverrides.footerCopyright;
}

templateConfig.profile = { ...defaultContent.profile, ...asObject(templateConfig.profile) };
templateConfig.education = asObject(templateConfig.education);
templateConfig.skills = asObject(templateConfig.skills);
templateConfig.supportingSkills = asArray(templateConfig.supportingSkills);
templateConfig.projects = asArray(templateConfig.projects);
templateConfig.experience = asArray(templateConfig.experience);
templateConfig.services = asArray(templateConfig.services);
templateConfig.contactLinks = asArray(templateConfig.contactLinks);
templateConfig.stats = asArray(templateConfig.stats);
templateConfig.footer = { ...asObject(templateConfig.footer) };

const applyDerivedPersonFields = () => {
  const profile = asObject(templateConfig.profile);
  const fullName = firstNonEmptyString(
    profile.fullName,
    templateConfig.meta?.siteName,
    defaultContent.profile.fullName
  );
  const firstName = firstNonEmptyString(profile.firstName, toNameWords(fullName)[0], fullName);
  const role = firstNonEmptyString(profile.role, profile.currentTitle);
  const currentTitle = firstNonEmptyString(profile.currentTitle, role);
  const location = firstNonEmptyString(profile.location);
  const education = firstNonEmptyString(
    templateConfig.education?.summary,
    templateConfig.education?.degree,
    templateConfig.education?.school
  );
  const companyPeriod = [profile.company, profile.period]
    .filter((value) => firstNonEmptyString(value))
    .join(' · ');
  const summary = firstNonEmptyString(profile.heroSummary, profile.heroHeadline);

  templateConfig.profile = { ...defaultContent.profile, ...profile, firstName, fullName };
  templateConfig.navigation = {
    ...asObject(templateConfig.navigation),
    brandInitial: getBrandInitial(firstName, fullName),
  };
  templateConfig.sections.hero = {
    ...asObject(templateConfig.sections.hero),
    headlineNameLines: buildHeroNameLines(fullName),
    resumeDownloadName: `${toFileStem(fullName)}_Resume.pdf`,
  };
  templateConfig.sections.about = {
    ...asObject(templateConfig.sections.about),
    sideTitle: [
      { text: `${fullName}. ` },
      { text: role || 'Portfolio', italic: true, muted: true },
    ],
    details: [
      { label: 'Role', value: role },
      { label: 'Title', value: currentTitle },
      { label: 'Location', value: location },
      { label: 'Education', value: education },
    ].filter((row) => row.value),
    statement: [{ text: summary || `${fullName} portfolio.` }],
  };
  templateConfig.sections.contact = {
    ...asObject(templateConfig.sections.contact),
    detailRows: [
      { label: 'Based in', value: location },
      { label: 'Current', value: firstNonEmptyString(companyPeriod, currentTitle) },
      { label: 'Response', value: 'Within 24h, weekdays' },
    ].filter((row) => row.value),
  };
};

applyDerivedPersonFields();

const skillList = (groupName) => asArray(templateConfig.skills?.[groupName]);

export const marqueeItems = [
  ...skillList('Frontend').slice(0, 6),
  ...skillList('UI / Performance').slice(0, 4),
  ...skillList('Testing / Tools').slice(0, 3),
  'REST API Integration',
];
