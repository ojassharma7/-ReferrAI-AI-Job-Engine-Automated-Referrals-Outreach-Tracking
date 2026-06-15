// Structured resume model — the contract between the AI and the LaTeX engine.
//
// The whole point of the Phase 2 "Overleaf" engine: the AI only ever produces
// this JSON. A fixed LaTeX template renders it. That means the AI can reorder,
// rephrase and re-emphasize content to match a job description, but it can NEVER
// touch the formatting — so every generated PDF looks pixel-identical.

import { z } from 'zod';

export const ContactSchema = z.object({
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  github: z.string().optional().default(''),
  website: z.string().optional().default(''),
});

export const SkillGroupSchema = z.object({
  category: z.string().default(''),
  items: z.array(z.string()).default([]),
});

export const ExperienceSchema = z.object({
  company: z.string().default(''),
  title: z.string().default(''),
  location: z.string().optional().default(''),
  start: z.string().optional().default(''),
  end: z.string().optional().default(''),
  bullets: z.array(z.string()).default([]),
});

export const ProjectSchema = z.object({
  name: z.string().default(''),
  description: z.string().optional().default(''),
  tech: z.string().optional().default(''),
  bullets: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  school: z.string().default(''),
  degree: z.string().optional().default(''),
  location: z.string().optional().default(''),
  start: z.string().optional().default(''),
  end: z.string().optional().default(''),
  details: z.string().optional().default(''),
});

export const ResumeDataSchema = z.object({
  name: z.string().default(''),
  headline: z.string().optional().default(''),
  contact: ContactSchema.default({
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  }),
  summary: z.string().optional().default(''),
  skills: z.array(SkillGroupSchema).default([]),
  experience: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(z.string()).default([]),
});

// How well the tailored resume lines up with the job description. Surfaced in
// the UI so the user knows which JD keywords landed and which are still missing.
export const MatchReportSchema = z.object({
  score: z.number().min(0).max(100).default(0),
  matched: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  notes: z.string().optional().default(''),
});

// What the AI returns: a tailored resume + the match report.
export const TailorResultSchema = z.object({
  resume: ResumeDataSchema,
  match: MatchReportSchema,
});

export type Contact = z.infer<typeof ContactSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type MatchReport = z.infer<typeof MatchReportSchema>;
export type TailorResult = z.infer<typeof TailorResultSchema>;
