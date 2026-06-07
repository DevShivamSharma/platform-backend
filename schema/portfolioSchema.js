export const SERVICE_ICON_OPTIONS = [
  "code",
  "globe",
  "shield",
  "zap",
  "rocket",
  "layers",
  "lock",
  "users",
  "star",
  "trending-up",
  "check-circle",
  "sparkles",
  "bolt",
  "award",
  "heart",
];

export const CONTACT_TYPE_OPTIONS = [
  "email",
  "phone",
  "github",
  "linkedin",
  "twitter",
  "website",
  "other",
];

export const PROJECT_TYPE_OPTIONS = [
  "web",
  "mobile",
  "api",
  "cli",
  "library",
  "other",
];

export const rawPortfolioSchema = {
  siteName: "string (required) - your name or brand",
  meta: {
    title: "string - browser tab title",
    description: "string - meta description, under 25 words",
  },
  profile: {
    firstName: "string (required)",
    fullName: "string (required)",
    role: "string - like 'Frontend Developer'",
    currentTitle: "string",
    company: "string",
    period: "string - like '2024 - Present'",
    location: "string",
    email: "string",
    phone: "string (optional)",
    heroHeadline: "string - under 8 words, your value prop",
    heroSummary: "string - under 30 words",
    availability: "string - like 'Open to frontend opportunities'",
  },
  education: {
    degree: "string (only if you have one)",
    school: "string",
    period: "string",
    cgpa: "string (optional)",
    summary: "string",
  },
  stats: [{ value: "string like '4+'", label: "string like 'Years Experience'" }],
  skills: { GroupName: ["skill1", "skill2"] },
  supportingSkills: ["string"],
  projects: [
    {
      id: "string - unique like 'project-1'",
      title: "string",
      description: "string - under 20 words",
      metrics: ["string"],
      tech: ["string"],
      features: ["string"],
      note: "string (optional)",
      type: PROJECT_TYPE_OPTIONS.join(" | "),
      featured: "boolean",
    },
  ],
  experience: [
    {
      period: "string - like '2024 - Present'",
      title: "string",
      company: "string",
      location: "string",
      description: "string - under 20 words",
      bullets: ["string - each under 15 words"],
      skills: ["string"],
      link: { label: "string", href: "string" },
    },
  ],
  services: [
    {
      icon: SERVICE_ICON_OPTIONS.join(" | "),
      title: "string - 2-4 words",
      description: "string - under 20 words",
    },
  ],
  contactLinks: [
    {
      type: CONTACT_TYPE_OPTIONS.join(" | "),
      label: "string",
      value: "string",
      href: "string - full URL or mailto:",
    },
  ],
  footerCopyright: "string - like '© 2026 YourName. All rights reserved.'",
};

export const schemaFields = [
  {
    group: "Root",
    fields: [
      {
        name: "siteName",
        type: "string",
        required: true,
        description: "Your display name or personal brand.",
        example: "Priya Sharma",
      },
      {
        name: "footerCopyright",
        type: "string",
        required: false,
        description: "Footer copyright line.",
        example: "© 2026 Priya Sharma. All rights reserved.",
      },
    ],
  },
  {
    group: "Meta",
    fields: [
      {
        name: "meta.title",
        type: "string",
        required: false,
        description: "Browser tab and SEO title.",
        example: "Priya Sharma - Frontend Developer",
      },
      {
        name: "meta.description",
        type: "string",
        required: false,
        description: "Short SEO description, under 25 words.",
        example: "Frontend developer building polished React interfaces.",
      },
    ],
  },
  {
    group: "Profile",
    fields: [
      {
        name: "profile.firstName",
        type: "string",
        required: true,
        description: "First name used in hero, footer, and copy.",
        example: "Priya",
      },
      {
        name: "profile.fullName",
        type: "string",
        required: true,
        description: "Full name exactly as the portfolio should present it.",
        example: "Priya Sharma",
      },
      {
        name: "profile.role",
        type: "string",
        required: false,
        description: "Primary professional role.",
        example: "Frontend Developer",
      },
      {
        name: "profile.currentTitle",
        type: "string",
        required: false,
        description: "Current title or headline role.",
        example: "Senior Frontend Engineer",
      },
      {
        name: "profile.company",
        type: "string",
        required: false,
        description: "Current company or client context.",
        example: "Acme Labs",
      },
      {
        name: "profile.period",
        type: "string",
        required: false,
        description: "Current role period.",
        example: "2024 - Present",
      },
      {
        name: "profile.location",
        type: "string",
        required: false,
        description: "City, region, or work location.",
        example: "Mumbai, India",
      },
      {
        name: "profile.email",
        type: "string",
        required: false,
        description: "Public contact email.",
        example: "hello@example.com",
      },
      {
        name: "profile.phone",
        type: "string",
        required: false,
        description: "Optional public phone number.",
        example: "+1 555 0100",
      },
      {
        name: "profile.heroHeadline",
        type: "string",
        required: false,
        description: "Short value proposition under 8 words.",
        example: "Building reliable React products",
      },
      {
        name: "profile.heroSummary",
        type: "string",
        required: false,
        description: "Hero summary under 30 words.",
        example: "Frontend developer crafting accessible interfaces for product teams.",
      },
      {
        name: "profile.availability",
        type: "string",
        required: false,
        description: "Availability or hiring status.",
        example: "Open to frontend opportunities",
      },
    ],
  },
  {
    group: "Education",
    fields: [
      {
        name: "education.degree",
        type: "string",
        required: false,
        description: "Degree name, only if explicitly provided.",
        example: "B.Tech in Computer Science",
      },
      {
        name: "education.school",
        type: "string",
        required: false,
        description: "School, college, or university.",
        example: "IIT Bombay",
      },
      {
        name: "education.period",
        type: "string",
        required: false,
        description: "Education period.",
        example: "2018 - 2022",
      },
      {
        name: "education.cgpa",
        type: "string",
        required: false,
        description: "Optional grade or CGPA.",
        example: "8.6",
      },
      {
        name: "education.summary",
        type: "string",
        required: false,
        description: "Short education summary.",
        example: "Computer science foundation with product engineering projects.",
      },
    ],
  },
  {
    group: "Collections",
    fields: [
      {
        name: "stats[]",
        type: "{ value: string, label: string }[]",
        required: false,
        description: "Short measurable portfolio stats.",
        example: "{ value: '4+', label: 'Years Experience' }",
      },
      {
        name: "skills",
        type: "{ [groupName]: string[] }",
        required: false,
        description: "Grouped skills by category.",
        example: "{ Frontend: ['React', 'Tailwind CSS'] }",
      },
      {
        name: "supportingSkills",
        type: "string[]",
        required: false,
        description: "Secondary skills or practices.",
        example: "['Accessibility', 'REST API Integration']",
      },
    ],
  },
  {
    group: "Projects",
    fields: [
      {
        name: "projects[].id",
        type: "string",
        required: false,
        description: "Stable unique project id.",
        example: "project-1",
      },
      {
        name: "projects[].title",
        type: "string",
        required: true,
        description: "Project title.",
        example: "Analytics Dashboard",
      },
      {
        name: "projects[].description",
        type: "string",
        required: false,
        description: "Project summary under 20 words.",
        example: "A React dashboard for visualizing revenue and retention metrics.",
      },
      {
        name: "projects[].metrics",
        type: "string[]",
        required: false,
        description: "Measurable results.",
        example: "['35% faster load time']",
      },
      {
        name: "projects[].tech",
        type: "string[]",
        required: false,
        description: "Technologies used.",
        example: "['React', 'TypeScript']",
      },
      {
        name: "projects[].features",
        type: "string[]",
        required: false,
        description: "Key features.",
        example: "['Role-based dashboards']",
      },
      {
        name: "projects[].note",
        type: "string",
        required: false,
        description: "Optional context note.",
        example: "Internal product shipped in 2025.",
      },
      {
        name: "projects[].type",
        type: PROJECT_TYPE_OPTIONS.join(" | "),
        required: false,
        description: "Project category.",
        example: "web",
      },
      {
        name: "projects[].featured",
        type: "boolean",
        required: false,
        description: "Whether the project is featured.",
        example: "true",
      },
    ],
  },
  {
    group: "Experience",
    fields: [
      {
        name: "experience[].period",
        type: "string",
        required: false,
        description: "Role date range.",
        example: "2024 - Present",
      },
      {
        name: "experience[].title",
        type: "string",
        required: true,
        description: "Role or certification title.",
        example: "Frontend Developer",
      },
      {
        name: "experience[].company",
        type: "string",
        required: false,
        description: "Company or organization.",
        example: "Acme Labs",
      },
      {
        name: "experience[].location",
        type: "string",
        required: false,
        description: "Work location.",
        example: "Remote",
      },
      {
        name: "experience[].description",
        type: "string",
        required: false,
        description: "Role summary under 20 words.",
        example: "Building accessible React interfaces for product teams.",
      },
      {
        name: "experience[].bullets",
        type: "string[]",
        required: false,
        description: "Short accomplishment bullets, each under 15 words.",
        example: "['Reduced dashboard load time by 35%']",
      },
      {
        name: "experience[].skills",
        type: "string[]",
        required: false,
        description: "Skills used in the role.",
        example: "['React', 'Redux']",
      },
      {
        name: "experience[].link",
        type: "{ label: string, href: string }",
        required: false,
        description: "Optional external proof or certificate link.",
        example: "{ label: 'Certificate', href: 'https://example.com' }",
      },
    ],
  },
  {
    group: "Services",
    fields: [
      {
        name: "services[].icon",
        type: SERVICE_ICON_OPTIONS.join(" | "),
        required: false,
        description: "Icon token for the service card.",
        example: "code",
      },
      {
        name: "services[].title",
        type: "string",
        required: true,
        description: "Two to four word service title.",
        example: "Frontend Development",
      },
      {
        name: "services[].description",
        type: "string",
        required: false,
        description: "Service description under 20 words.",
        example: "Production React interfaces with clean, maintainable code.",
      },
    ],
  },
  {
    group: "Contact",
    fields: [
      {
        name: "contactLinks[].type",
        type: CONTACT_TYPE_OPTIONS.join(" | "),
        required: false,
        description: "Contact channel type.",
        example: "email",
      },
      {
        name: "contactLinks[].label",
        type: "string",
        required: false,
        description: "Visible label.",
        example: "Email",
      },
      {
        name: "contactLinks[].value",
        type: "string",
        required: false,
        description: "Visible value.",
        example: "hello@example.com",
      },
      {
        name: "contactLinks[].href",
        type: "string",
        required: false,
        description: "Full URL, mailto:, or tel: link.",
        example: "mailto:hello@example.com",
      },
    ],
  },
];

export const schemaPrompt = `Generate a portfolio JSON in EXACTLY this format. Only use the fields shown.
If I don't mention something, omit that field. Do not invent fake data.

Schema:
${JSON.stringify(rawPortfolioSchema, null, 2)}

My details: [PASTE YOUR INFO HERE]`;

export const portfolioSchema = {
  id: "portfolio-content-json",
  templateId: "landing-modern",
  title: "Portfolio content.json schema",
  version: 1,
  requiredFields: ["siteName", "profile.firstName", "profile.fullName"],
  fields: schemaFields,
  rawSchema: rawPortfolioSchema,
  prompt: schemaPrompt,
  enums: {
    serviceIcons: SERVICE_ICON_OPTIONS,
    contactTypes: CONTACT_TYPE_OPTIONS,
    projectTypes: PROJECT_TYPE_OPTIONS,
  },
};

export default portfolioSchema;
