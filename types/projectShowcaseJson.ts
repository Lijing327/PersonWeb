/**
 * Minimal maintainable Case Study / Showcase JSON stored in Project.Content.
 *
 * PRIMARY path (target):
 *   MySQL projects.Content  →  showcase JSON  →  buildProjectShowcase()
 *
 * Until Admin can edit this JSON end-to-end, legacy presets may still fill gaps
 * (see ENABLE_LEGACY_SHOWCASE_PRESETS in useProjectShowcase).
 *
 * Rules:
 * - Only real, maintainable fields
 * - No invented KPI / rating / review
 * - screenshots / metrics / timeline / roadmap optional
 */

import type {
  ProjectShowcaseArchitectureLayer,
  ProjectShowcaseChallenge,
  ProjectShowcaseCta,
  ProjectShowcaseFeature,
  ProjectShowcaseHeroFloat,
  ProjectShowcaseMilestone,
  ProjectShowcasePitch,
  ProjectShowcaseRoadmapItem,
  ProjectShowcaseScreenshot,
  ProjectShowcaseStat,
  ProjectShowcaseBackground,
} from '~/types/projectShowcase'

/** Stored shape inside Project.Content (raw JSON or ```showcase fence). */
export interface ProjectShowcaseJson {
  heroEyebrow?: string
  heroFloats?: ProjectShowcaseHeroFloat[]
  pitch?: Partial<ProjectShowcasePitch>
  overview?: ProjectShowcaseStat[]
  background?: Partial<ProjectShowcaseBackground>
  role?: string
  duration?: string
  stack?: string[]
  features?: ProjectShowcaseFeature[]
  screenshots?: ProjectShowcaseScreenshot[]
  architecture?: ProjectShowcaseArchitectureLayer[]
  challenges?: ProjectShowcaseChallenge[]
  timeline?: ProjectShowcaseMilestone[]
  roadmap?: ProjectShowcaseRoadmapItem[]
  links?: {
    demo?: string
    github?: string
    docs?: string
  }
  cta?: ProjectShowcaseCta
  /** Optional capability metrics — never invent; omit when unknown */
  metrics?: ProjectShowcaseStat[]
}

/**
 * Migration plan (no forced schema change this phase):
 * 1. Keep using projects.Content as the JSON carrier (zero new tables).
 * 2. Admin editor later: form → serialize ProjectShowcaseJson → Content.
 * 3. Optional later: dedicated ShowcaseJson column if Content must stay Markdown-only.
 * 4. After Admin write-path is live, set ENABLE_LEGACY_SHOWCASE_PRESETS=false.
 */
export const SHOWCASE_JSON_MIGRATION = {
  carrier: 'projects.Content',
  schemaChangeRequired: false,
  adminWritable: false,
  legacyPresets: 'constants/projects/showcasePresets.ts',
} as const
