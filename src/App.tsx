import { useMemo, useState } from 'react'
import './App.css'
import type { FormState, GenerationStatus, MultiSelectField, MultiSelectValue } from './types/privacy'
import { defaultForm, questionOrder, riskLabels } from './lib/options'
import {
  buildAgentsMdPreview,
  buildAgentsMdPrompt,
  calculateRiskScore,
  deriveRiskLevel,
  generateRecommendations
} from './lib/privacyUtils'
import { renderStepBlock } from './components/QuestionSteps'
import { ConversationalIntake } from './components/ConversationalIntake'
import { DescriptionIntake } from './components/DescriptionIntake'

type IntakeMode = 'survey' | 'chat' | 'description'

function App() {
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('survey')
  const [form, setForm] = useState<FormState>(defaultForm)
  const [currentStep, setCurrentStep] = useState(0)
  const [copiedField, setCopiedField] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [generatedAgentsMd, setGeneratedAgentsMd] = useState('')
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle')

  const totalQuestions = questionOrder.length
  const isFinalStage = currentStep >= totalQuestions
  const projectName = form.projectName.trim() || 'Untitled Project'

  const riskScore = useMemo(() => calculateRiskScore(form), [form])
  const riskLevel = useMemo(() => deriveRiskLevel(riskScore), [riskScore])
  const recommendations = useMemo(
    () => generateRecommendations(form, riskLevel),
    [form, riskLevel]
  )

  const agentsMdPreview = useMemo(
    () => buildAgentsMdPreview(projectName, form, riskLevel, recommendations),
    [projectName, form, riskLevel, recommendations]
  )

  const agentsPrompt = useMemo(
    () => buildAgentsMdPrompt(projectName, form, riskLevel, agentsMdPreview),
    [projectName, form, riskLevel, agentsMdPreview]
  )

  const handleFieldChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = <K extends MultiSelectField>(
    field: K,
    value: MultiSelectValue<K>
  ) => {
    setForm((prev) => {
      const current = prev[field] as MultiSelectValue<K>[]
      const exists = current.includes(value)
      const next = (
        exists ? current.filter((item) => item !== value) : [...current, value]
      ) as FormState[K]
      return { ...prev, [field]: next }
    })
  }

  const handleCopy = (value: string, fieldId: string) => {
    try {
      navigator?.clipboard?.writeText(value)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(''), 2000)
    } catch {
      setCopiedField('error')
    }
  }

  const handleNext = () => setCurrentStep((x) => Math.min(x + 1, totalQuestions))
  const handlePrevious = () => setCurrentStep((x) => Math.max(x - 1, 0))

  const resetSurveyState = (preserveStart = true) => {
    setForm(defaultForm)
    setCurrentStep(0)
    setGeneratedAgentsMd('')
    setGenerationStatus('idle')
    setShowResult(false)
    if (!preserveStart) setHasStarted(false)
  }

  const handleStart = () => {
    resetSurveyState()
    setHasStarted(true)
  }

  const handleReturnToLanding = () => resetSurveyState(false)

  const handleModeChange = (mode: IntakeMode) => {
    setIntakeMode(mode)
    // Reset survey state when switching away from survey mode
    if (mode !== 'survey') {
      resetSurveyState(false)
    }
  }

  const generateAgentsMd = async () => {
    if (generationStatus === 'loading') return

    const apiKey =
      import.meta.env.VITE_OPENAI_API_KEY ??
      import.meta.env.VITE_OPENAI_KEY ??
      ''

    if (!apiKey) {
      setGenerationStatus('error')
      alert('Missing OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file.')
      return
    }

    setGenerationStatus('loading')
    setShowResult(false)

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior privacy & safety configuration writer for AI coding assistants. You output ONLY a valid markdown AGENTS.md file, with no commentary or code fences.'
            },
            { role: 'user', content: agentsPrompt }
          ]
        })
      })

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        throw new Error(errorJson?.error?.message ?? 'OpenAI request failed.')
      }

      const json = await res.json()
      const content = json?.choices?.[0]?.message?.content?.trim()

      if (!content) throw new Error('OpenAI returned no content.')

      setGeneratedAgentsMd(content)
      setGenerationStatus('success')
      setShowResult(true)
    } catch (err) {
      setGenerationStatus('error')
      console.error('Failed to generate AGENTS.md', err)
      alert(err instanceof Error ? err.message : 'Failed to generate AGENTS.md.')
    }
  }

  const progressPercent = Math.round(
    (Math.min(currentStep, totalQuestions) / totalQuestions) * 100
  )
  const showGeneratedFile = Boolean(generatedAgentsMd)
  const isGenerateDisabled = generationStatus === 'loading'
  const hasResultScreen = hasStarted && showResult && showGeneratedFile

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero__eyebrow">COMPASS: Context Oriented Modes for Privacy-Aware Software Systems</p>
        <h1>Generate AGENTS.md from your real project context</h1>
        <p className="hero__lead">
          Answer a short survey about your coding environment. We call the OpenAI
          API and return a ready-to-use AGENTS.md for your coding assistant.
        </p>
      </header>

      {intakeMode === 'chat' ? (
        <ConversationalIntake
          setForm={setForm}
          onGenerateAgents={() => {
            // Switch to survey mode to use the existing generation pipeline
            handleModeChange('survey')
            setHasStarted(true)
            // Jump to the review stage
            setCurrentStep(questionOrder.length)
            // Use requestAnimationFrame to ensure state updates are processed
            requestAnimationFrame(() => {
              setTimeout(() => {
                generateAgentsMd()
              }, 50)
            })
          }}
        />
      ) : intakeMode === 'description' ? (
        <DescriptionIntake
          setForm={setForm}
          onComplete={() => {
            handleModeChange('survey')
            setHasStarted(true)
            // Jump to the review stage
            setCurrentStep(questionOrder.length)
          }}
        />
      ) : !hasStarted ? (
        <div className="landing-cards-grid">
          <section className="landing-card">
            <p>
              Provide just enough context—coursework, research, proprietary, or
              personal—so we can shape assistant guardrails without collecting your code.
            </p>
            <button className="primary-button" onClick={handleStart}>
              Start survey
            </button>
            <p className="landing-hint">~12 questions · ~3 minutes</p>
          </section>
          <section className="landing-card">
            <p>
              Have a conversation with our assistant to describe your project context
              and privacy needs through an interactive dialogue.
            </p>
            <button className="primary-button" onClick={() => handleModeChange('chat')}>
              Start conversation
            </button>
            <p className="landing-hint">Interactive chat · Flexible pace</p>
          </section>
          <section className="landing-card">
            <p>
              Describe your project in your own words. We'll analyze your description
              and generate a tailored AGENTS.md configuration.
            </p>
            <button className="primary-button" onClick={() => handleModeChange('description')}>
              Describe project
            </button>
            <p className="landing-hint">Free-form text · Quick setup</p>
          </section>
        </div>
      ) : hasResultScreen ? (
        <section className="result-screen">
          <div className="result-file-shell">
            <div className="result-file-tab">AGENTS.md</div>
            <div className="result-file-viewer">
              <pre>{generatedAgentsMd}</pre>
            </div>
            <div className="result-file-actions">
              <button
                className="ghost-button"
                onClick={() => handleCopy(generatedAgentsMd, 'agents-final')}
              >
                {copiedField === 'agents-final' ? 'Copied file' : 'Copy file'}
              </button>
              <button className="primary-button" onClick={handleReturnToLanding}>
                Start new survey
              </button>
            </div>
      </div>
        </section>
      ) : (
        <section className="wizard-shell">
          <div className="stage-panel">
            <div className="progress-header">
              <p className="progress-counter">
                {isFinalStage
                  ? 'Review & generate'
                  : `Question ${currentStep + 1} / ${totalQuestions}`}
              </p>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {!isFinalStage ? (
              <div className="question-stage">
                {renderStepBlock(
                  questionOrder[currentStep],
                  form,
                  handleFieldChange,
                  toggleArrayField
                )}

                <div className="nav-row">
                  {currentStep > 0 ? (
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={handlePrevious}
                    >
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleNext}
                  >
                    {currentStep === totalQuestions - 1
                      ? 'Review answers'
                      : 'Next question'}
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
                      {recommendations.focusAreas.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </div>
                  </div>

                  <div className="panel guidance-card">
                    <p className="panel__eyebrow">Guardrails to include</p>
                    <h3>What the agent must remember</h3>

                    <ul className="guardrail-list">
                      {recommendations.guardrails.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>

                    <div className="watchwords">
                      {recommendations.watchwords.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="final-button-row">
                  <button className="ghost-button" onClick={handlePrevious}>
                    Go back
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isGenerateDisabled}
                    onClick={generateAgentsMd}
                  >
                    {generationStatus === 'loading'
                      ? 'Generating AGENTS.md...'
                      : 'Generate AGENTS.md'}
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

export default App
