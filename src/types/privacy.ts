export type ProjectType = 'coursework' | 'research' | 'proprietary' | 'personal'
export type RepoVisibility = 'private' | 'public' | 'air-gapped'
export type Sensitivity = 'low' | 'medium' | 'high'
export type AiUsage = 'sparingly' | 'paired' | 'autonomous'
export type Collaboration = 'solo' | 'small-team' | 'cross-org'
export type RiskLevel = 'low' | 'guarded' | 'elevated' | 'critical'
export type NudgeLevel = 'light' | 'balanced' | 'intense'
export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error'

export type StorageOption = 'local-encrypted' | 'local-plain' | 'cloud-synced' | 'shared-drive'
export type ReminderOption = 'session-audits' | 'data-minimization' | 'delete-after-export' | 'manual-redaction'
export type MultiSelectField = 'compliance' | 'storage' | 'reminders'

export type FormState = {
  projectName: string
  projectType: ProjectType
  repoVisibility: RepoVisibility
  dataSensitivity: Sensitivity
  dataExamples: string
  compliance: string[]
  aiUsage: AiUsage
  collaboration: Collaboration
  nudgeLevel: NudgeLevel
  highestRiskArea: string
  storage: StorageOption[]
  reminders: ReminderOption[]
}

export type MultiSelectValue<K extends MultiSelectField> = FormState[K] extends Array<infer U> ? U : never

export type QuestionKey = keyof FormState

export type Recommendations = {
  focusAreas: string[]
  guardrails: string[]
  watchwords: string[]
  reminderBullets: string[]
}

