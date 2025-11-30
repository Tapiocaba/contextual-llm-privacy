import type {
  FormState,
  ProjectType,
  RepoVisibility,
  Sensitivity,
  AiUsage,
  Collaboration,
  RiskLevel,
  NudgeLevel,
  StorageOption,
  ReminderOption,
  QuestionKey
} from '../types/privacy'

export const defaultForm: FormState = {
  projectName: '',
  projectType: 'coursework',
  repoVisibility: 'private',
  dataSensitivity: 'medium',
  dataExamples: '',
  compliance: [],
  aiUsage: 'paired',
  collaboration: 'small-team',
  nudgeLevel: 'balanced',
  highestRiskArea: 'source code',
  storage: [],
  reminders: []
}

export const projectTypeOptions = [
  { label: 'Coursework', value: 'coursework' as ProjectType, helper: 'Assignments, capstones, or teaching repos.' },
  { label: 'Research', value: 'research' as ProjectType, helper: 'Pre-publication or IRB-sensitive projects.' },
  { label: 'Proprietary', value: 'proprietary' as ProjectType, helper: 'Corporate or client-owned source with NDAs.' },
  { label: 'Personal', value: 'personal' as ProjectType, helper: 'Portfolios, side projects, or experiments.' }
] as const

export const repoVisibilityOptions = [
  { label: 'Private / invite-only', value: 'private' as RepoVisibility },
  { label: 'Public / shared openly', value: 'public' as RepoVisibility },
  { label: 'Air-gapped / offline', value: 'air-gapped' as RepoVisibility }
] as const

export const sensitivityOptions = [
  { label: 'Low', value: 'low' as Sensitivity, helper: 'Mostly boilerplate or published code.' },
  { label: 'Medium', value: 'medium' as Sensitivity, helper: 'Mixed assets with occasional secrets.' },
  { label: 'High', value: 'high' as Sensitivity, helper: 'Strict controls, regulated or embargoed.' }
] as const

export const aiUsageOptions = [
  { label: 'Sparingly (spot prompts)', value: 'sparingly' as AiUsage, helper: 'Copy edits, doc rewrites, quick fixes.' },
  { label: 'Paired (co-editing)', value: 'paired' as AiUsage, helper: 'Frequent completions with human review.' },
  { label: 'Autonomous (hands-off)', value: 'autonomous' as AiUsage, helper: 'Assistant drives refactors or file creation.' }
] as const

export const collaborationOptions = [
  { label: 'Solo builder', value: 'solo' as Collaboration },
  { label: 'Small distributed team', value: 'small-team' as Collaboration },
  { label: 'Cross-organization collab', value: 'cross-org' as Collaboration }
] as const

export const complianceOptions = ['FERPA', 'HIPAA', 'Corporate NDA', 'Internal policy', 'None'] as const

export const nudgeLevelOptions = [
  { label: 'Light touch', value: 'light' as NudgeLevel, helper: 'Only surface nudges when something looks risky.' },
  { label: 'Balanced', value: 'balanced' as NudgeLevel, helper: 'Steady reminders at session boundaries.' },
  { label: 'High-touch', value: 'intense' as NudgeLevel, helper: 'Frequent prompts to double-check privacy posture.' }
] as const

export const storageOptions: readonly StorageOption[] = [
  'local-encrypted',
  'local-plain',
  'cloud-synced',
  'shared-drive'
] as const

export const reminderOptions: readonly ReminderOption[] = [
  'session-audits',
  'data-minimization',
  'delete-after-export',
  'manual-redaction'
] as const

export const riskAreas = ['source code', 'datasets', 'credentials', 'documentation'] as const

export const riskLabels: Record<RiskLevel, { title: string; blurb: string }> = {
  low: {
    title: 'Low exposure',
    blurb: 'Context is contained; keep lightweight checklists in place.'
  },
  guarded: {
    title: 'Guarded posture',
    blurb: 'Blend of sensitive and public files. Audit sharing each session.'
  },
  elevated: {
    title: 'Elevated risk',
    blurb: 'Multiple collaborators or regulated data. Default to opt-in access.'
  },
  critical: {
    title: 'Critical controls required',
    blurb: 'Strict NDAs or embargoed datasets. Treat AI as read-only until vetted.'
  }
}

export const questionOrder: QuestionKey[] = [
  'projectName',
  'projectType',
  'repoVisibility',
  'dataSensitivity',
  'highestRiskArea',
  'dataExamples',
  'compliance',
  'aiUsage',
  'collaboration',
  'storage',
  'reminders',
  'nudgeLevel'
]

export const stepMeta: Record<QuestionKey, { title: string; helper: string; summary: string }> = {
  projectName: {
    title: 'What should we call this project?',
    helper: 'Used inside the generated AGENTS.md to ground the assistant.',
    summary: 'Project label'
  },
  projectType: {
    title: 'Which bucket best describes it?',
    helper: 'Privacy expectations differ across coursework, research, proprietary, and personal work.',
    summary: 'Project type'
  },
  repoVisibility: {
    title: 'How discoverable is the repo today?',
    helper: 'We tune prompts depending on whether code is public, private, or air-gapped.',
    summary: 'Repo exposure'
  },
  dataSensitivity: {
    title: 'How sensitive is the data/code inside?',
    helper: 'Dictates how opinionated the guardrails should be.',
    summary: 'Data sensitivity'
  },
  highestRiskArea: {
    title: 'What deserves the most protection?',
    helper: 'We spotlight this in the generated reminders.',
    summary: 'Highest-risk asset'
  },
  dataExamples: {
    title: 'List any specific files or datasets that feel risky.',
    helper: 'Optional but helps the assistant ignore or summarize safely.',
    summary: 'Flagged artifacts'
  },
  compliance: {
    title: 'Any policies, regulations, or agreements in play?',
    helper: 'Select all that apply so we can echo them back.',
    summary: 'Compliance anchors'
  },
  aiUsage: {
    title: 'How hands-on will the assistant be?',
    helper: 'The more autonomy it has, the stricter the review reminders.',
    summary: 'Assistant role'
  },
  collaboration: {
    title: 'Who else touches this repo?',
    helper: 'Signals how widely context may spread.',
    summary: 'Collaboration'
  },
  storage: {
    title: 'Where does your code live?',
    helper: 'Storage location impacts leakage risk and guardrail strictness.',
    summary: 'Storage'
  },
  reminders: {
    title: 'What should the assistant remind you about?',
    helper: 'These shape the Session Nudges section of AGENTS.md.',
    summary: 'Privacy nudges'
  },
  nudgeLevel: {
    title: 'How intense should the privacy nudges be?',
    helper: 'Pick how frequently you want reminders during assistant sessions.',
    summary: 'Nudge intensity'
  }
}

