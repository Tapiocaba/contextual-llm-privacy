import type {
  FormState,
  RiskLevel,
  NudgeLevel,
  ReminderOption,
  Recommendations
} from '../types/privacy'
import { riskLabels } from './options'

// -------------------- SCORING -------------------- //

export const calculateRiskScore = (form: FormState): number => {
  let score = 1

  const sensitivityWeight = { low: 0, medium: 1, high: 2 }
  const projectWeight = { coursework: 0, personal: 0, research: 1, proprietary: 2 }
  const aiWeight = { sparingly: 0, paired: 1, autonomous: 2 }
  const visibilityWeight = { public: 1, private: 0, 'air-gapped': -1 }
  const collaborationWeight = { solo: 0, 'small-team': 1, 'cross-org': 2 }

  score += sensitivityWeight[form.dataSensitivity]
  score += projectWeight[form.projectType]
  score += aiWeight[form.aiUsage]
  score += visibilityWeight[form.repoVisibility]
  score += collaborationWeight[form.collaboration]

  if (form.compliance.some((c) => c !== 'None')) score += 1

  if (
    form.storage.includes('shared-drive') ||
    form.storage.includes('cloud-synced')
  ) {
    score += 1
  }

  return Math.min(Math.max(score, 1), 8)
}

export const deriveRiskLevel = (score: number): RiskLevel => {
  if (score <= 2) return 'low'
  if (score <= 4) return 'guarded'
  if (score <= 6) return 'elevated'
  return 'critical'
}

// -------------------- RECOMMENDATIONS -------------------- //

export const generateRecommendations = (form: FormState, level: RiskLevel): Recommendations => {
  const focusAreas = new Set<string>()
  const guardrails = new Set<string>()
  const watchwords = new Set<string>()

  focusAreas.add(level === 'critical' ? 'Air-gapped reviews' : 'Scoped sharing')

  if (form.projectType === 'coursework') {
    focusAreas.add('Academic integrity proof')
    guardrails.add('Document which code was AI-assisted to comply with coursework policies.')
  }

  if (form.projectType === 'proprietary') {
    guardrails.add('Keep NDA modules out of default assistant context; rely on sanitized stubs.')
    watchwords.add('NDA scope')
  }

  if (form.dataSensitivity === 'high') {
    guardrails.add('Route assistant edits through redacted buffers before committing.')
    focusAreas.add('Least privilege prompts')
    watchwords.add('Redaction-first')
  }

  if (form.aiUsage === 'autonomous') {
    guardrails.add('Require human diff approvals before merging assistant-authored commits.')
    watchwords.add('Human-in-loop')
  } else if (form.aiUsage === 'paired') {
    guardrails.add('Log notable assistant suggestions and compare against privacy expectations weekly.')
  }

  if (form.storage.includes('cloud-synced')) {
    guardrails.add('Treat cloud-synced folders as shared; move sensitive edits to encrypted local storage.')
  }

  if (form.repoVisibility === 'public') {
    guardrails.add('Use minimized snippets instead of raw unreleased files when prompting.')
  }

  if (form.compliance.includes('FERPA')) watchwords.add('Student privacy')
  if (form.compliance.includes('HIPAA')) watchwords.add('PHI handling')
  if (form.compliance.includes('Corporate NDA')) watchwords.add('Client code names')

  if (form.dataExamples.trim()) {
    guardrails.add(`Flagged assets: ${form.dataExamples.trim()}`)
  }

  const reminderBullets = buildReminderBullets(form.nudgeLevel, form.reminders)

  return {
    focusAreas: Array.from(focusAreas),
    guardrails: Array.from(guardrails),
    watchwords: Array.from(watchwords),
    reminderBullets
  }
}

export const buildReminderBullets = (level: NudgeLevel, userReminders: ReminderOption[]): string[] => {
  const base: Record<NudgeLevel, string[]> = {
    light: [
      'Ping me only when sensitive folders enter the assistant context.',
      'Provide a single exit reminder to clear temp buffers.'
    ],
    balanced: [
      'At session start, list the directories you intend to expose.',
      'Close the loop by summarizing how assistant output was reviewed.'
    ],
    intense: [
      'Before each prompt, confirm the file truly needs to be shared.',
      'Log every directory you expose and share the log weekly.',
      'Run a manual redaction sweep before committing generated code.'
    ]
  }

  const mappedUser = userReminders.map((r) => {
    switch (r) {
      case 'session-audits':
        return 'Log each assistant session + files exposed.'
      case 'data-minimization':
        return 'Only send minimal diffs or snippets.'
      case 'delete-after-export':
        return 'Purge temporary exports after review.'
      case 'manual-redaction':
        return 'Run a manual redaction sweep before sharing data.'
      default:
        return ''
    }
  })

  return [...base[level], ...mappedUser].filter(Boolean)
}

// -------------------- PREVIEW -------------------- //

export const buildAgentsMdPreview = (
  projectName: string,
  form: FormState,
  level: RiskLevel,
  recs: Recommendations
): string => {
  return [
    `# AGENTS brief · ${projectName}`,
    '',
    '## Context snapshot',
    `- Project type: ${form.projectType}`,
    `- Repo visibility: ${form.repoVisibility}`,
    `- Sensitivity: ${form.dataSensitivity}`,
    `- Highest-risk area: ${form.highestRiskArea}`,
    form.compliance.length
      ? `- Compliance anchors: ${form.compliance.join(', ')}`
      : '- Compliance anchors: none noted',
    form.dataExamples.trim()
      ? `- Flagged assets: ${form.dataExamples.trim()}`
      : '- Flagged assets: (add specifics as needed)',
    '',
    '## Agent guardrails',
    ...recs.guardrails.map((x) => `- ${x}`),
    '',
    '## Session nudges',
    ...recs.reminderBullets.map((x) => `- ${x}`),
    '',
    `> Risk posture: ${riskLabels[level].title}`
  ].join('\n')
}

// -------------------- FULL AGENTS.md PROMPT -------------------- //

export const buildAgentsMdPrompt = (
  projectName: string,
  form: FormState,
  level: RiskLevel,
  preview: string
): string => {
  const posture = riskLabels[level].title
  const postureBlurb = riskLabels[level].blurb

  return [
    `Write a complete **AGENTS.md** file for a project called "${projectName}".`,
    '',
    'The output must be ONLY a markdown document, no commentary, no code fences.',
    '',
    '### Project context to incorporate',
    `- Project type: ${form.projectType}`,
    `- Repository visibility: ${form.repoVisibility}`,
    `- Data sensitivity: ${form.dataSensitivity}`,
    `- Highest-risk area: ${form.highestRiskArea}`,
    form.dataExamples.trim()
      ? `- Flagged assets: ${form.dataExamples.trim()}`
      : `- Flagged assets: none explicitly listed`,
    form.compliance.length && !form.compliance.includes('None')
      ? `- Compliance anchors: ${form.compliance.join(', ')}`
      : '- Compliance anchors: none noted',
    `- Storage locations: ${form.storage.join(', ') || 'none'}`,
    `- Assistant usage: ${form.aiUsage}`,
    `- Collaboration model: ${form.collaboration}`,
    `- Risk posture: ${posture} (${postureBlurb})`,
    '',
    '### Requirements',
    '- Structure the file with clear sections:',
    '  - `# AGENTS: Project brief & safety rules`',
    '  - `## Context snapshot`',
    '  - `## Safety & privacy constraints`',
    '  - `## Allowed assistant roles`',
    '  - `## Restricted areas & files`',
    '  - `## Prompting patterns`',
    '  - `## Session checklist`',
    '',
    '- The file must:',
    '  - Be strict about secrets, credentials, and high-risk areas.',
    '  - Use placeholders like `<API_KEY>` instead of real values.',
    '  - Inherit watchwords and guardrails from the context.',
    '  - Include a session checklist based on the reminders.',
    '- Include a dedicated section titled **"Refusal Rules"** that lists actions the assistant must politely refuse. This section must include:',
    '  - Refusing to view, rewrite, or analyze credentials files.',
    '  - Refusing to infer, guess, or reconstruct API keys, tokens, or secret values.',
    '  - Refusing to request entire files when snippets suffice.',
    '  - Refusing to generate code that embeds real secrets.',
    '- Include a dedicated section titled **"Scope of Operation"** that clearly separates:',
    '  - Allowed areas (frontend logic, utils/helpers, styling, non-sensitive backend code)',
    '  - Restricted areas (authentication, authorization, database migrations, deployment files, secrets-handling modules)',
    '### Draft guidance to expand',
    preview,
    '',
    'Now write the full, polished AGENTS.md.'
  ].join('\n')
}

