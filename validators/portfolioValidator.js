// Validator / sanitizer for portfolio content.
//
// validatePortfolioConfig(rawJson) returns a cleaned content.json object.
// validatePortfolioConfig(rawJson, { includeWarnings: true }) returns
// { config, warnings } for UI previews and paste/manual validation.

import {
  CONTACT_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  SERVICE_ICON_OPTIONS,
} from "../schema/portfolioSchema.js";

const LEGACY_SERVICE_ICONS = ["monitor", "bar-chart", "link", "server"];
const ALLOWED_ICONS = new Set([...SERVICE_ICON_OPTIONS, ...LEGACY_SERVICE_ICONS]);
const FALLBACK_ICON = "layers";
const ALLOWED_CONTACT_TYPES = new Set(CONTACT_TYPE_OPTIONS);
const ALLOWED_PROJECT_TYPES = new Set(PROJECT_TYPE_OPTIONS);

const WORD_CAPS = {
  heroHeadline: 7,
  heroSummary: 29,
  metaDescription: 24,
  projectDescription: 19,
  experienceDescription: 19,
  experienceBullet: 14,
  serviceDescription: 19,
  statLabel: 3,
};

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";

function warn(ctx, message) {
  ctx.warnings.push(message);
  console.log(`[validate]   ${message}`);
}

function trimString(value) {
  return isStr(value) ? value.trim() : undefined;
}

function truncateWords(value, max, label, ctx) {
  if (!isStr(value)) return value;
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return value.trim();
  warn(ctx, `Fixed ${label}: truncated from ${words.length} to ${max} words`);
  return words.slice(0, max).join(" ");
}

function pick(obj, allowed, ctx, scope) {
  const out = {};
  if (!isObject(obj)) return out;
  for (const key of Object.keys(obj)) {
    if (allowed.includes(key)) {
      out[key] = obj[key];
    } else {
      warn(ctx, `Stripped unknown field: ${scope}.${key}`);
    }
  }
  return out;
}

function stringArray(value, ctx, label) {
  if (!Array.isArray(value)) {
    if (value !== undefined) warn(ctx, `Dropped malformed ${label}: expected array`);
    return undefined;
  }
  const arr = value.filter(isStr).map((s) => s.trim()).filter(Boolean);
  if (arr.length !== value.length) {
    warn(ctx, `Fixed ${label}: removed non-string or empty entries`);
  }
  return arr.length ? arr : undefined;
}

function setIf(target, key, value) {
  if (value === undefined || value === null) return;
  if (isStr(value) && value.trim() === "") return;
  if (Array.isArray(value) && value.length === 0) return;
  if (isObject(value) && Object.keys(value).length === 0) return;
  target[key] = value;
}

export function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined && source[key] !== null) {
      result[key] = source[key];
    }
  }
  return result;
}

const TOP_LEVEL = [
  "siteName", "meta", "profile", "education", "stats", "skills",
  "supportingSkills", "projects", "experience", "services",
  "contactLinks", "footerCopyright",
];
const META_FIELDS = ["title", "description"];
const PROFILE_FIELDS = [
  "firstName", "fullName", "role", "currentTitle", "company", "period",
  "location", "email", "phone", "heroHeadline", "heroSummary", "availability",
];
const EDUCATION_FIELDS = ["degree", "school", "period", "cgpa", "summary"];
const PROJECT_FIELDS = [
  "id", "title", "description", "metrics", "tech", "features",
  "note", "type", "featured",
];
const EXPERIENCE_FIELDS = [
  "period", "title", "company", "location", "description",
  "bullets", "skills", "link",
];
const SERVICE_FIELDS = ["icon", "title", "description"];
const CONTACT_FIELDS = ["type", "label", "value", "href"];

export function validatePortfolioConfig(rawJson, options = {}) {
  const ctx = { warnings: [] };

  if (!isObject(rawJson)) {
    warn(ctx, "Input was not an object; used default portfolio content");
    return finish(defaultContent, ctx, options);
  }

  const cleaned = pick(rawJson, TOP_LEVEL, ctx, "root");
  const out = {};

  setIf(out, "siteName", trimString(cleaned.siteName));

  if (isObject(cleaned.meta)) {
    const meta = pick(cleaned.meta, META_FIELDS, ctx, "meta");
    const m = {};
    setIf(m, "title", trimString(meta.title));
    setIf(m, "description", truncateWords(meta.description, WORD_CAPS.metaDescription, "meta.description", ctx));
    setIf(out, "meta", m);
  } else if (cleaned.meta !== undefined) {
    warn(ctx, "Dropped malformed meta: expected object");
  }

  if (isObject(cleaned.profile)) {
    const p = pick(cleaned.profile, PROFILE_FIELDS, ctx, "profile");
    const profile = {};
    for (const key of PROFILE_FIELDS) {
      if (!isStr(p[key])) continue;
      let val = p[key].trim();
      if (key === "heroHeadline") val = truncateWords(val, WORD_CAPS.heroHeadline, "profile.heroHeadline", ctx);
      if (key === "heroSummary") val = truncateWords(val, WORD_CAPS.heroSummary, "profile.heroSummary", ctx);
      setIf(profile, key, val);
    }
    setIf(out, "profile", profile);
  } else if (cleaned.profile !== undefined) {
    warn(ctx, "Dropped malformed profile: expected object");
  }

  if (isObject(cleaned.education)) {
    const e = pick(cleaned.education, EDUCATION_FIELDS, ctx, "education");
    const education = {};
    for (const key of EDUCATION_FIELDS) setIf(education, key, trimString(e[key]));
    setIf(out, "education", education);
  } else if (cleaned.education !== undefined) {
    warn(ctx, "Dropped malformed education: expected object");
  }

  if (Array.isArray(cleaned.stats)) {
    const stats = cleaned.stats
      .filter((s) => {
        const keep = isObject(s);
        if (!keep) warn(ctx, "Dropped malformed stats[] item: expected object");
        return keep;
      })
      .map((s) => {
        const stat = {};
        setIf(stat, "value", trimString(s.value));
        setIf(stat, "label", truncateWords(s.label, WORD_CAPS.statLabel, "stats[].label", ctx));
        return stat;
      })
      .filter((s) => s.value && s.label);
    setIf(out, "stats", stats);
  } else if (cleaned.stats !== undefined) {
    warn(ctx, "Dropped malformed stats: expected array");
  }

  if (isObject(cleaned.skills)) {
    const skills = {};
    for (const group of Object.keys(cleaned.skills)) {
      const list = stringArray(cleaned.skills[group], ctx, `skills.${group}`);
      if (list) skills[group] = list;
    }
    setIf(out, "skills", skills);
  } else if (cleaned.skills !== undefined) {
    warn(ctx, "Dropped malformed skills: expected object");
  }

  setIf(out, "supportingSkills", stringArray(cleaned.supportingSkills, ctx, "supportingSkills"));

  if (Array.isArray(cleaned.projects)) {
    const projects = cleaned.projects
      .filter((raw) => {
        const keep = isObject(raw);
        if (!keep) warn(ctx, "Dropped malformed projects[] item: expected object");
        return keep;
      })
      .map((raw) => {
        const p = pick(raw, PROJECT_FIELDS, ctx, "projects[]");
        const project = {};
        if (p.id !== undefined && p.id !== null) setIf(project, "id", String(p.id).trim());
        setIf(project, "title", trimString(p.title));
        setIf(project, "description", truncateWords(p.description, WORD_CAPS.projectDescription, "projects[].description", ctx));
        setIf(project, "metrics", stringArray(p.metrics, ctx, "projects[].metrics"));
        setIf(project, "tech", stringArray(p.tech, ctx, "projects[].tech"));
        setIf(project, "features", stringArray(p.features, ctx, "projects[].features"));
        setIf(project, "note", trimString(p.note));

        const type = isStr(p.type) ? p.type.toLowerCase().trim() : "";
        if (type && !ALLOWED_PROJECT_TYPES.has(type)) {
          warn(ctx, `Fixed projects[].type: "${p.type}" -> "other"`);
        }
        if (type) project.type = ALLOWED_PROJECT_TYPES.has(type) ? type : "other";

        project.featured = p.featured === true;
        return project;
      })
      .filter((project) => {
        const keep = !!project.title;
        if (!keep) warn(ctx, "Dropped project without title");
        return keep;
      });

    let changedFeatured = false;
    projects.forEach((project, index) => {
      const desired = index < 2;
      if (project.featured !== desired) changedFeatured = true;
      project.featured = desired;
    });
    if (changedFeatured) warn(ctx, "Fixed projects[].featured: first two projects are featured");
    setIf(out, "projects", projects);
  } else if (cleaned.projects !== undefined) {
    warn(ctx, "Dropped malformed projects: expected array");
  }

  if (Array.isArray(cleaned.experience)) {
    const experience = cleaned.experience
      .filter((raw) => {
        const keep = isObject(raw);
        if (!keep) warn(ctx, "Dropped malformed experience[] item: expected object");
        return keep;
      })
      .map((raw) => {
        const x = pick(raw, EXPERIENCE_FIELDS, ctx, "experience[]");
        const exp = {};
        setIf(exp, "period", trimString(x.period));
        setIf(exp, "title", trimString(x.title));
        setIf(exp, "company", trimString(x.company));
        setIf(exp, "location", trimString(x.location));
        setIf(exp, "description", truncateWords(x.description, WORD_CAPS.experienceDescription, "experience[].description", ctx));

        const bullets = stringArray(x.bullets, ctx, "experience[].bullets");
        if (bullets) {
          setIf(exp, "bullets", bullets.map((b) => truncateWords(b, WORD_CAPS.experienceBullet, "experience[].bullets[]", ctx)));
        }
        setIf(exp, "skills", stringArray(x.skills, ctx, "experience[].skills"));

        if (isObject(x.link) && isStr(x.link.label) && isStr(x.link.href)) {
          exp.link = { label: x.link.label.trim(), href: x.link.href.trim() };
        } else if (x.link !== undefined) {
          warn(ctx, "Dropped malformed experience[].link: expected { label, href }");
        }
        return exp;
      })
      .filter((exp) => {
        const keep = !!exp.title;
        if (!keep) warn(ctx, "Dropped experience item without title");
        return keep;
      });
    setIf(out, "experience", experience);
  } else if (cleaned.experience !== undefined) {
    warn(ctx, "Dropped malformed experience: expected array");
  }

  if (Array.isArray(cleaned.services)) {
    const services = cleaned.services
      .filter((raw) => {
        const keep = isObject(raw);
        if (!keep) warn(ctx, "Dropped malformed services[] item: expected object");
        return keep;
      })
      .map((raw) => {
        const s = pick(raw, SERVICE_FIELDS, ctx, "services[]");
        const service = {};
        const icon = isStr(s.icon) ? s.icon.toLowerCase().trim() : "";
        if (icon && !ALLOWED_ICONS.has(icon)) {
          warn(ctx, `Fixed services[].icon: "${s.icon}" -> "${FALLBACK_ICON}"`);
        }
        service.icon = ALLOWED_ICONS.has(icon) ? icon : FALLBACK_ICON;
        setIf(service, "title", trimString(s.title));
        setIf(service, "description", truncateWords(s.description, WORD_CAPS.serviceDescription, "services[].description", ctx));
        return service;
      })
      .filter((service) => {
        const keep = !!service.title;
        if (!keep) warn(ctx, "Dropped service without title");
        return keep;
      });
    setIf(out, "services", services);
  } else if (cleaned.services !== undefined) {
    warn(ctx, "Dropped malformed services: expected array");
  }

  if (Array.isArray(cleaned.contactLinks)) {
    const links = cleaned.contactLinks
      .filter((raw) => {
        const keep = isObject(raw);
        if (!keep) warn(ctx, "Dropped malformed contactLinks[] item: expected object");
        return keep;
      })
      .map((raw) => {
        const c = pick(raw, CONTACT_FIELDS, ctx, "contactLinks[]");
        const link = {};
        const type = isStr(c.type) ? c.type.toLowerCase().trim() : "";
        if (type && !ALLOWED_CONTACT_TYPES.has(type)) {
          warn(ctx, `Fixed contactLinks[].type: "${c.type}" -> "other"`);
        }
        link.type = ALLOWED_CONTACT_TYPES.has(type) ? type : "other";
        setIf(link, "label", trimString(c.label));
        setIf(link, "value", trimString(c.value));
        setIf(link, "href", trimString(c.href));

        if (!link.href && link.value && link.type === "email") {
          link.href = `mailto:${link.value}`;
          warn(ctx, "Added default contactLinks[].href for email");
        }
        if (!link.href && link.value && link.type === "phone") {
          link.href = `tel:${link.value.replace(/[^\d+]/g, "")}`;
          warn(ctx, "Added default contactLinks[].href for phone");
        }
        return link;
      })
      .filter((link) => {
        const keep = !!(link.value || link.href);
        if (!keep) warn(ctx, "Dropped contact link without value or href");
        return keep;
      });
    setIf(out, "contactLinks", links);
  } else if (cleaned.contactLinks !== undefined) {
    warn(ctx, "Dropped malformed contactLinks: expected array");
  }

  setIf(out, "footerCopyright", trimString(cleaned.footerCopyright));

  return finish(out, ctx, options);
}

export function validatePortfolioConfigWithWarnings(rawJson) {
  return validatePortfolioConfig(rawJson, { includeWarnings: true });
}

function finish(out, ctx, options) {
  const normalized = normalizeRequiredFields(out, ctx);
  const config = deepMerge(defaultContent, normalized);
  if (options.includeWarnings) return { config, warnings: ctx.warnings };
  return config;
}

function normalizeRequiredFields(out, ctx) {
  const normalized = { ...out };
  const profile = isObject(normalized.profile) ? { ...normalized.profile } : {};

  if (!normalized.siteName) {
    normalized.siteName = profile.fullName || profile.firstName || defaultContent.siteName;
    warn(ctx, "Added default siteName");
  }

  if (!profile.fullName) {
    profile.fullName = normalized.siteName || defaultContent.profile.fullName;
    warn(ctx, "Added default profile.fullName");
  }

  if (!profile.firstName) {
    profile.firstName = profile.fullName.split(/\s+/).filter(Boolean)[0] || defaultContent.profile.firstName;
    warn(ctx, "Added default profile.firstName");
  }

  if (!profile.currentTitle && profile.role) profile.currentTitle = profile.role;
  normalized.profile = profile;

  const meta = isObject(normalized.meta) ? { ...normalized.meta } : {};
  if (!meta.title) {
    meta.title = profile.role ? `${profile.fullName} - ${profile.role}` : profile.fullName;
    warn(ctx, "Added default meta.title");
  }
  if (!meta.description) {
    meta.description = profile.heroSummary || `${profile.fullName} portfolio.`;
    warn(ctx, "Added default meta.description");
  }
  normalized.meta = meta;

  if (!normalized.footerCopyright) {
    normalized.footerCopyright = `© ${new Date().getFullYear()} ${profile.fullName}. All rights reserved.`;
    warn(ctx, "Added default footerCopyright");
  }

  return normalized;
}

export const defaultContent = {
  siteName: "Portfolio",
  meta: {
    title: "Portfolio",
    description: "A personal portfolio.",
  },
  profile: {
    firstName: "Your",
    fullName: "Your Name",
    role: "",
    currentTitle: "",
    heroHeadline: "Welcome to my portfolio",
    heroSummary: "A short introduction about who you are and what you build.",
    availability: "Open to opportunities.",
  },
  stats: [],
  skills: {},
  supportingSkills: [],
  projects: [],
  experience: [],
  services: [],
  contactLinks: [],
  footerCopyright: "© 2026 Your Name. All rights reserved.",
};

export default validatePortfolioConfig;
