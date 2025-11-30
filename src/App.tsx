import { type ReactNode, useMemo, useState } from 'react'
import './App.css'

type ProjectType = 'coursework' | 'research' | 'proprietary' | 'personal'
type RepoVisibility = 'private' | 'public' | 'air-gapped'
type Sensitivity = 'low' | 'medium' | 'high'
type AiUsage = 'sparingly' | 'paired' | 'autonomous'
type Collaboration = 'solo' | 'small-team' | 'cross-org'
type RiskLevel = 'low' | 'guarded' | 'elevated' | 'critical'
type GenerationStatus = 'idle' | 'loading' | 'success' | 'error'

type FormState = {
  projectName: string
  projectType: ProjectType
  repoVisibility: RepoVisibility
  dataSensitivity: Sensitivity
  dataExamples: string
  compliance: string[]
  aiUsage: AiUsage
  collaboration: Collaboration
  storage: string[]
  reminders: string[]
  highestRiskArea: string
}

const defaultForm: FormState = {
  projectName: '',
  projectType: 'coursework',
  repoVisibility: 'private',
  dataSensitivity: 'medium',
  dataExamples: '',
  compliance: [],
  aiUsage: 'paired',
  collaboration: 'small-team',
  storage: ['local-encrypted'],
  reminders: ['session-audits'],
  highestRiskArea: 'source code'
}

const projectTypeOptions: { label: string; value: ProjectType; helper: string }[] = [
  { label: 'Coursework', value: 'coursework', helper: 'Assignments, capstones, or teaching repos.' },
  { label: 'Research', value: 'research', helper: 'Pre-publication or IRB-sensitive projects.' },
  { label: 'Proprietary', value: 'proprietary', helper: 'Corporate or client-owned source with NDAs.' },
  { label: 'Personal', value: 'personal', helper: 'Portfolios, side projects, or experiments.' }
]

const repoVisibilityOptions: { label: string; value: RepoVisibility }[] = [
  { label: 'Private / invite-only', value: 'private' },
  { label: 'Public / shared openly', value: 'public' },
  { label: 'Air-gapped / offline', value: 'air-gapped' }
]

const sensitivityOptions: { label: string; value: Sensitivity; helper: string }[] = [
  { label: 'Low', value: 'low', helper: 'Mostly boilerplate or published code.' },
  { label: 'Medium', value: 'medium', helper: 'Mixed assets with occasional secrets.' },
  { label: 'High', value: 'high', helper: 'Strict controls, regulated or embargoed.' }
]

const aiUsageOptions: { label: string; value: AiUsage; helper: string }[] = [
  { label: 'Sparingly (spot prompts)', value: 'sparingly', helper: 'Copy edits, doc rewrites, quick fixes.' },
  { label: 'Paired (co-editing)', value: 'paired', helper: 'Frequent completions with human review.' },
  { label: 'Autonomous (hands-off)', value: 'autonomous', helper: 'Assistant drives refactors or file creation.' }
]

const collaborationOptions: { label: string; value: Collaboration }[] = [
  { label: 'Solo builder', value: 'solo' },
  { label: 'Small distributed team', value: 'small-team' },
  { label: 'Cross-organization collab', value: 'cross-org' }
]

const complianceOptions = ['FERPA', 'HIPAA', 'Corporate NDA', 'Internal policy', 'None']
const storageOptions = ['local-encrypted', 'local-plain', 'cloud-synced', 'shared-drive']
const reminderOptions = ['session-audits', 'data-minimization', 'delete-after-export', 'manual-redaction']
const riskAreas = ['source code', 'datasets', 'credentials', 'documentation']

const riskLabels: Record<RiskLevel, { title: string; blurb: string }> = {
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

type QuestionKey = keyof FormState

const questionOrder: QuestionKey[] = [
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
  'reminders'
]

const stepMeta: Record<QuestionKey, { title: string; helper: string; summary: string }> = {
  projectName: {
    title: 'What should we call this project?',
    helper: 'Used inside the generated cursor.md to ground the assistant.',
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
    title: 'Where do code and data currently live?',
    helper: 'Helps decide when to insist on local workspaces vs. synced folders.',
    summary: 'Storage modes'
  },
  reminders: {
    title: 'What nudges actually keep you privacy-aware?',
    helper: 'Choose reminders that should appear in every session checklist.',
    summary: 'Session reminders'
  }
}

function App() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [currentStep, setCurrentStep] = useState(0)
  const [copiedField, setCopiedField] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [generatedCursorMd, setGeneratedCursorMd] = useState('')
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle')
  const [generationError, setGenerationError] = useState('')

  const totalQuestions = questionOrder.length
  const isFinalStage = currentStep >= totalQuestions
  const projectName = form.projectName.trim() || 'Untitled Project'

  const riskScore = useMemo(() => calculateRiskScore(form), [form])
  const riskLevel = useMemo(() => deriveRiskLevel(riskScore), [riskScore])
  const recommendations = useMemo(() => generateRecommendations(form, riskLevel), [form, riskLevel])

  const cursorMdPreview = useMemo(
    () => buildCursorMdPreview(projectName, form, riskLevel, recommendations),
    [form, projectName, recommendations, riskLevel]
  )

  const cursorPrompt = useMemo(
    () => buildCursorPrompt(projectName, form, riskLevel, cursorMdPreview),
    [cursorMdPreview, form, projectName, riskLevel]
  )

  const handleFieldChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: 'compliance' | 'storage' | 'reminders', value: string) => {
    setForm((prev) => {
      const current = prev[field]
      const exists = current.includes(value)
      const next = exists ? current.filter((item) => item !== value) : [...current, value]
      return { ...prev, [field]: next }
    })
  }

  const handleCopy = (value: string, fieldId: string) => {
    try {
      if (navigator?.clipboard) {
        void navigator.clipboard.writeText(value)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedField(fieldId)
      window.setTimeout(() => setCopiedField(''), 2000)
    } catch {
      setCopiedField('error')
    }
  }

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalQuestions))
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const resetSurveyState = (preserveStart = true) => {
    setForm(defaultForm)
    setCurrentStep(0)
    setGeneratedCursorMd('')
    setGenerationStatus('idle')
    setGenerationError('')
    setShowResult(false)
    if (!preserveStart) {
      setHasStarted(false)
    }
  }

  const handleStart = () => {
    resetSurveyState()
    setHasStarted(true)
  }

  const handleRestartWithinFlow = () => {
    resetSurveyState()
    setHasStarted(true)
  }

  const handleReturnToLanding = () => {
    resetSurveyState(false)
  }

  const handleEditFromResult = () => {
    setShowResult(false)
    setGeneratedCursorMd('')
    setGenerationStatus('idle')
    setGenerationError('')
    setCurrentStep(totalQuestions)
  }

const generateCursorMd = async () => {
  if (generationStatus === 'loading') return

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.VITE_OPENAI_KEY ?? ''
  if (!apiKey) {
    setGenerationStatus('error')
    setGenerationError('Missing OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file and reload.')
    return
  }

  setGenerationStatus('loading')
  setGenerationError('')
  setShowResult(false)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a privacy configuration writer for AI coding assistants.' },
          { role: 'user', content: cursorPrompt }
        ]
      })
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload?.error?.message ?? 'OpenAI request failed.')
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data?.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('OpenAI returned no content for cursor.md.')
    }

    setGeneratedCursorMd(content)
    setGenerationStatus('success')
    setShowResult(true)
  } catch (error) {
    setGenerationStatus('error')
    setGenerationError(error instanceof Error ? error.message : 'Failed to generate cursor.md.')
  }
}

  const progressPercent = Math.round((Math.min(currentStep, totalQuestions) / totalQuestions) * 100)
  const showGeneratedFile = Boolean(generatedCursorMd)
  const isGenerateDisabled = generationStatus === 'loading'
  const hasResultScreen = hasStarted && showResult && showGeneratedFile

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero__eyebrow">COMPASS: Context Oriented Modes for Privacy-Aware Software Systems</p>
        <h1>Tailored markdown for every coding context</h1>
        <p className="hero__lead">
          Answer an 11-step survey about your coding environment. We hand back a privacy mode markdown file.
        </p>
        <p className="hero__lead">Supports Cursor (Claude coming soon!)</p>
      </header>

      {!hasStarted ? (
        <section className="landing-card">
          <p>
            Provide just enough context—coursework, research, proprietary, or personal—so we can shape assistant guardrails
            without collecting your code.
          </p>
          <button className="primary-button" onClick={handleStart}>
            Start survey
          </button>
          <p className="landing-hint">11 questions · ~3 minutes</p>
        </section>
      ) : hasResultScreen ? (
        <section className="result-screen">
          <article className="result-card">
            <p className="panel__eyebrow">cursor.md ready</p>
            <h2>{projectName}</h2>
            <p>
              Generated with a {riskLabels[riskLevel].title.toLowerCase()} posture based on your answers. Paste it into your repo
              or share it with collaborators.
            </p>
            <div className="result-actions">
              <button className="ghost-button" onClick={() => handleCopy(generatedCursorMd, 'cursor-final')}>
                {copiedField === 'cursor-final' ? 'Copied file' : 'Copy file'}
              </button>
              <button className="ghost-button" onClick={handleEditFromResult}>
                Edit answers
              </button>
              <button className="primary-button" onClick={handleReturnToLanding}>
                Start new survey
              </button>
            </div>
          </article>
          <pre className="file-preview result-preview">{generatedCursorMd}</pre>
        </section>
      ) : (
        <section className="wizard-shell">
          <div className="stage-panel">
            <div className="progress-header">
              <p className="progress-counter">
                {isFinalStage ? 'Review & generate' : `Question ${currentStep + 1} / ${totalQuestions}`}
              </p>
            </div>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
            </div>

            {!isFinalStage ? (
              <div className="question-stage">
                {renderStepBlock(questionOrder[currentStep], form, handleFieldChange, toggleArrayField)}

                <div className="nav-row">
                  {currentStep > 0 ? (
                    <button className="ghost-button" type="button" onClick={handlePrevious}>
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <button className="primary-button" type="button" onClick={handleNext}>
                    {currentStep === totalQuestions - 1 ? 'Review answers' : 'Next question'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="generation-stage">
                <div className="generation-grid">
                  <div className={`risk-card risk-${riskLevel}`}>
                    <p className="risk-card__eyebrow">Posture summary</p>
                    <h2>{riskLabels[riskLevel].title}</h2>
                    <p>{riskLabels[riskLevel].blurb}</p>
                    <div className="risk-score">
                      <span>Risk score</span>
                      <strong>{riskScore}/8</strong>
                    </div>
                    <div className="focus-pill-row">
                      {recommendations.focusAreas.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="panel guidance-card">
                    <div>
                      <p className="panel__eyebrow">Guardrails to include</p>
                      <h3>What Cursor should remember</h3>
                    </div>
                    <ul className="guardrail-list">
                      {recommendations.guardrails.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="watchwords">
                      {recommendations.watchwords.map((word) => (
                        <span key={word}>{word}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="generation-actions">
                  <div className="generation-actions__header">
                    <div>
                      <p className="panel__eyebrow">Final step</p>
                      <h3>Generate the real cursor.md</h3>
                    </div>
                    <span className={`status-pill status-${generationStatus}`}>
                      {generationStatus === 'loading' && 'Calling OpenAI…'}
                      {generationStatus === 'success' && 'Ready'}
                      {generationStatus === 'error' && 'Needs attention'}
                      {generationStatus === 'idle' && 'Awaiting run'}
                    </span>
                  </div>
                  <p className="helper-text">
                    Your answers are sent to OpenAI and the finished file opens on the next screen.
                  </p>
                  <button className="primary-button" type="button" disabled={isGenerateDisabled} onClick={generateCursorMd}>
                    {generationStatus === 'loading'
                      ? 'Generating cursor.md...'
                      : showGeneratedFile
                        ? 'Regenerate cursor.md'
                        : 'Generate cursor.md'}
                  </button>
                  {generationError && <p className="error-text">{generationError}</p>}
                </div>

                <div className="nav-row nav-row--generation">
                  <button className="ghost-button" type="button" onClick={handlePrevious}>
                    Edit answers
                  </button>
                  <button className="ghost-button" type="button" onClick={handleRestartWithinFlow}>
                    Restart survey
                  </button>
                  <button className="ghost-button" type="button" onClick={handleReturnToLanding}>
                    Back to landing
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

type Recommendations = {
  focusAreas: string[]
  guardrails: string[]
  watchwords: string[]
  reminderBullets: string[]
}

const calculateRiskScore = (form: FormState): number => {
  let score = 1

  const sensitivityWeight: Record<Sensitivity, number> = {
    low: 0,
    medium: 1,
    high: 2
  }

  const projectWeight: Record<ProjectType, number> = {
    coursework: 0,
    personal: 0,
    research: 1,
    proprietary: 2
  }

  const aiWeight: Record<AiUsage, number> = {
    sparingly: 0,
    paired: 1,
    autonomous: 2
  }

  const visibilityWeight: Record<RepoVisibility, number> = {
    public: 1,
    private: 0,
    'air-gapped': -1
  }

  const collaborationWeight: Record<Collaboration, number> = {
    solo: 0,
    'small-team': 1,
    'cross-org': 2
  }

  score += sensitivityWeight[form.dataSensitivity]
  score += projectWeight[form.projectType]
  score += aiWeight[form.aiUsage]
  score += visibilityWeight[form.repoVisibility]
  score += collaborationWeight[form.collaboration]

  if (form.compliance.some((item) => item !== 'None')) {
    score += 1
  }

  if (form.storage.includes('shared-drive') || form.storage.includes('cloud-synced')) {
    score += 1
  }

  return Math.min(Math.max(score, 1), 8)
}

const deriveRiskLevel = (score: number): RiskLevel => {
  if (score <= 2) return 'low'
  if (score <= 4) return 'guarded'
  if (score <= 6) return 'elevated'
  return 'critical'
}

const generateRecommendations = (form: FormState, level: RiskLevel): Recommendations => {
  const focusAreas = new Set<string>()
  const guardrails = new Set<string>()
  const watchwords = new Set<string>()

  focusAreas.add(level === 'critical' ? 'Air-gapped reviews' : 'Scoped sharing')

  if (form.projectType === 'coursework') {
    focusAreas.add('Academic integrity proof')
    guardrails.add('Document what portion of assistant-authored code remains to uphold coursework policies.')
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
    guardrails.add('Treat synced folders as shared; move sensitive edits to local encrypted space.')
  }

  if (form.repoVisibility === 'public') {
    guardrails.add('Share snippets rather than raw unreleased files when prompting in public repos.')
  }

  if (form.reminders.includes('manual-redaction')) {
    guardrails.add('Run a manual redaction sweep for tokens, IDs, and secrets before sharing output.')
  }

  if (form.reminders.includes('session-audits')) {
    guardrails.add('Capture which folders were exposed per session for audit parity.')
  }

  if (form.compliance.includes('FERPA')) {
    watchwords.add('Student privacy')
  }
  if (form.compliance.includes('HIPAA')) {
    watchwords.add('PHI handling')
  }
  if (form.compliance.includes('Corporate NDA')) {
    watchwords.add('Client code names')
  }

  if (form.dataExamples.trim()) {
    guardrails.add(`Flagged assets: ${form.dataExamples.trim()}`)
  }

  const reminderBullets = form.reminders.length
    ? form.reminders.map((reminder) => formatReminderLabel(reminder))
    : ['Run a quick privacy posture check before each assistant session.']

  return {
    focusAreas: Array.from(focusAreas),
    guardrails: Array.from(guardrails),
    watchwords: Array.from(watchwords),
    reminderBullets
  }
}

const buildCursorMdPreview = (
  projectName: string,
  form: FormState,
  level: RiskLevel,
  recs: Recommendations
): string => {
  return [
    `# Privacy mode · ${projectName}`,
    '',
    '## Context snapshot',
    `- Project type: ${form.projectType}`,
    `- Repo visibility: ${form.repoVisibility}`,
    `- Sensitivity: ${form.dataSensitivity}`,
    `- Highest-risk area: ${form.highestRiskArea}`,
    form.compliance.length ? `- Compliance anchors: ${form.compliance.join(', ')}` : '- Compliance anchors: none noted',
    form.dataExamples.trim() ? `- Flagged assets: ${form.dataExamples.trim()}` : '- Flagged assets: (add specifics as needed)',
    '',
    '## Assistant guardrails',
    ...recs.guardrails.map((item) => `- ${item}`),
    '',
    '## Session reminders',
    ...recs.reminderBullets.map((item) => `- ${item}`),
    '',
    `> Risk posture: ${riskLabels[level].title}`
  ].join('\n')
}

const buildCursorPrompt = (projectName: string, form: FormState, level: RiskLevel, preview: string): string => {
  return [
    `Write a comprehensive cursor.md file for a project called "${projectName}".`,
    `The project type is ${form.projectType}, repo visibility is ${form.repoVisibility}, data sensitivity is ${form.dataSensitivity}, and the highest-risk area is ${form.highestRiskArea}.`,
    form.dataExamples.trim() ? `Flagged assets to treat carefully: ${form.dataExamples.trim()}.` : '',
    form.compliance.length && !form.compliance.includes('None') ? `Compliance anchors: ${form.compliance.join(', ')}.` : '',
    `Adopt a ${riskLabels[level].title.toLowerCase()} tone with direct, actionable guardrails.`,
    'Ensure the file contains sections for Context Snapshot, Assistant Guardrails, and Session Reminders.',
    'Use the following draft as guidance and expand where needed:',
    preview
  ]
    .filter(Boolean)
    .join('\n')
}

const formatStorageLabel = (value: string): string => {
  switch (value) {
    case 'local-encrypted':
      return 'Local encrypted volume'
    case 'local-plain':
      return 'Local unencrypted disk'
    case 'cloud-synced':
      return 'Cloud-synced workspace'
    case 'shared-drive':
      return 'Shared drive or LMS upload'
    default:
      return value
  }
}

const formatReminderLabel = (value: string): string => {
  switch (value) {
    case 'session-audits':
      return 'Log each assistant session + files exposed'
    case 'data-minimization':
      return 'Only send minimal diffs or snippets'
    case 'delete-after-export':
      return 'Purge temp exports after review'
    case 'manual-redaction':
      return 'Run a manual redaction sweep'
    default:
      return value
  }
}

type QuestionBlockProps = {
  title: string
  helper: string
  children: ReactNode
}

const QuestionBlock = ({ title, helper, children }: QuestionBlockProps) => {
  return (
    <label className="question-block">
      <div className="question-meta">
        <p className="question-title">{title}</p>
        <p className="question-helper">{helper}</p>
      </div>
      <div className="question-input">{children}</div>
    </label>
  )
}

const renderStepBlock = (
  key: QuestionKey,
  form: FormState,
  handleFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void,
  toggleArrayField: (field: 'compliance' | 'storage' | 'reminders', value: string) => void
) => {
  switch (key) {
    case 'projectName':
      return (
        <QuestionBlock title={stepMeta.projectName.title} helper={stepMeta.projectName.helper}>
          <input
            className="text-input"
            placeholder="e.g. Compilers final project"
            value={form.projectName}
            onChange={(event) => handleFieldChange('projectName', event.target.value)}
          />
        </QuestionBlock>
      )
    case 'projectType':
      return (
        <QuestionBlock title={stepMeta.projectType.title} helper={stepMeta.projectType.helper}>
          <div className="option-grid">
            {projectTypeOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`option-chip ${form.projectType === option.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('projectType', option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'repoVisibility':
      return (
        <QuestionBlock title={stepMeta.repoVisibility.title} helper={stepMeta.repoVisibility.helper}>
          <div className="radio-row">
            {repoVisibilityOptions.map((option) => (
              <label key={option.value} className="radio-chip">
                <input
                  type="radio"
                  name="repoVisibility"
                  value={option.value}
                  checked={form.repoVisibility === option.value}
                  onChange={() => handleFieldChange('repoVisibility', option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'dataSensitivity':
      return (
        <QuestionBlock title={stepMeta.dataSensitivity.title} helper={stepMeta.dataSensitivity.helper}>
          <div className="option-grid">
            {sensitivityOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`option-chip ${form.dataSensitivity === option.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('dataSensitivity', option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'highestRiskArea':
      return (
        <QuestionBlock title={stepMeta.highestRiskArea.title} helper={stepMeta.highestRiskArea.helper}>
          <div className="radio-row">
            {riskAreas.map((area) => (
              <label key={area} className="radio-chip">
                <input
                  type="radio"
                  name="highestRiskArea"
                  value={area}
                  checked={form.highestRiskArea === area}
                  onChange={() => handleFieldChange('highestRiskArea', area)}
                />
                {area}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'dataExamples':
      return (
        <QuestionBlock title={stepMeta.dataExamples.title} helper={stepMeta.dataExamples.helper}>
          <textarea
            className="text-area"
            rows={4}
            placeholder="e.g. /data/raw/nda-clients.csv, internal strategy decks, firebase service accounts"
            value={form.dataExamples}
            onChange={(event) => handleFieldChange('dataExamples', event.target.value)}
          />
        </QuestionBlock>
      )
    case 'compliance':
      return (
        <QuestionBlock title={stepMeta.compliance.title} helper={stepMeta.compliance.helper}>
          <div className="checkbox-grid">
            {complianceOptions.map((option) => (
              <label key={option} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={form.compliance.includes(option)}
                  onChange={() => toggleArrayField('compliance', option)}
                />
                {option}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'aiUsage':
      return (
        <QuestionBlock title={stepMeta.aiUsage.title} helper={stepMeta.aiUsage.helper}>
          <div className="option-grid">
            {aiUsageOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`option-chip ${form.aiUsage === option.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('aiUsage', option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'collaboration':
      return (
        <QuestionBlock title={stepMeta.collaboration.title} helper={stepMeta.collaboration.helper}>
          <div className="radio-row">
            {collaborationOptions.map((option) => (
              <label key={option.value} className="radio-chip">
                <input
                  type="radio"
                  name="collaboration"
                  value={option.value}
                  checked={form.collaboration === option.value}
                  onChange={() => handleFieldChange('collaboration', option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'storage':
      return (
        <QuestionBlock title={stepMeta.storage.title} helper={stepMeta.storage.helper}>
          <div className="checkbox-grid">
            {storageOptions.map((option) => (
              <label key={option} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={form.storage.includes(option)}
                  onChange={() => toggleArrayField('storage', option)}
                />
                {formatStorageLabel(option)}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )
    case 'reminders':
      return (
        <QuestionBlock title={stepMeta.reminders.title} helper={stepMeta.reminders.helper}>
          <div className="checkbox-grid">
            {reminderOptions.map((option) => (
              <label key={option} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={form.reminders.includes(option)}
                  onChange={() => toggleArrayField('reminders', option)}
                />
                {formatReminderLabel(option)}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )
    default:
      return null
  }
}

export default App

