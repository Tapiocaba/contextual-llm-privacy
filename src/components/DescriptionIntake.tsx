import { useState } from 'react'
import type { FormState } from '../types/privacy'
import { defaultForm, stepMeta } from '../lib/options'

type DescriptionIntakeProps = {
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onComplete: () => void
}

export const DescriptionIntake = ({ setForm, onComplete }: DescriptionIntakeProps) => {
  const [description, setDescription] = useState('')
  const [isInferring, setIsInferring] = useState(false)
  const [inferredConfig, setInferredConfig] = useState<Partial<FormState> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInfer = async () => {
    if (!description.trim()) {
      setError('Please enter a project description.')
      return
    }

    setIsInferring(true)
    setError(null)
    setInferredConfig(null)

    try {
      const apiKey =
        import.meta.env.VITE_OPENAI_API_KEY ??
        import.meta.env.VITE_OPENAI_KEY ??
        ''

      if (!apiKey) {
        throw new Error('Missing OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file.')
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `You are a configuration extractor for a privacy tool that generates AGENTS.md files for AI coding assistants. Based on a short natural-language description of a coding project, infer the best FormState configuration. Output ONLY JSON and nothing else, matching this type:

type ProjectType = 'coursework' | 'research' | 'proprietary' | 'personal';
type RepoVisibility = 'private' | 'public' | 'air-gapped';
type Sensitivity = 'low' | 'medium' | 'high';
type AiUsage = 'sparingly' | 'paired' | 'autonomous';
type Collaboration = 'solo' | 'small-team' | 'cross-org';
type NudgeLevel = 'light' | 'balanced' | 'intense';
type StorageOption = 'local-encrypted' | 'local-plain' | 'cloud-synced' | 'shared-drive';
type ReminderOption = 'session-audits' | 'data-minimization' | 'delete-after-export' | 'manual-redaction';

type FormState = {
  projectName: string;
  projectType: ProjectType;
  repoVisibility: RepoVisibility;
  dataSensitivity: Sensitivity;
  dataExamples: string;
  compliance: string[];
  aiUsage: AiUsage;
  collaboration: Collaboration;
  nudgeLevel: NudgeLevel;
  highestRiskArea: string;
  storage: StorageOption[];
  reminders: ReminderOption[];
};

When you are unsure, make your best guess and choose reasonable defaults. Output JSON only, no markdown, no comments.`
            },
            {
              role: 'user',
              content: `Here is the user's project description:\n\n${description.trim()}`
            }
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

      // Extract JSON from response (handle cases where it might be wrapped in markdown)
      let jsonContent = content
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }

      const extractedConfig = JSON.parse(jsonContent) as Partial<FormState>
      setInferredConfig(extractedConfig)
    } catch (err) {
      console.error('Error inferring configuration:', err)
      setError(err instanceof Error ? err.message : 'Failed to infer configuration.')
    } finally {
      setIsInferring(false)
    }
  }

  const handleApply = () => {
    if (!inferredConfig) return

    // Merge with default form state
    setForm({
      ...defaultForm,
      ...inferredConfig
    })

    // Navigate to survey review/generation
    onComplete()
  }

  const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None'
    }
    if (typeof value === 'string') {
      return value || 'Not specified'
    }
    return String(value)
  }

  const getFieldLabel = (key: keyof FormState): string => {
    return stepMeta[key]?.summary || key
  }

  return (
    <section className="description-intake">
      <div className="description-intake-container">
        <h2>Describe your project in your own words</h2>
        <p className="description-helper">
          Example: I'm building a Next.js app with Supabase for auth. The repo is public, but I
          store API keys in .env. I work with one collaborator and use Cursor daily.
        </p>

        <div className="description-input-section">
          <textarea
            className="description-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project in 2-6 sentences..."
            rows={6}
            disabled={isInferring}
          />
          {error && <div className="description-error">{error}</div>}
          <button
            className="primary-button"
            onClick={handleInfer}
            disabled={!description.trim() || isInferring}
          >
            {isInferring ? 'Inferring configuration...' : 'Infer configuration'}
          </button>
        </div>

        {inferredConfig && (
          <div className="inferred-config-panel">
            <h3>Inferred Configuration</h3>
            <div className="inferred-fields">
              {Object.entries(inferredConfig).map(([key, value]) => {
                if (value === undefined || value === null) return null
                const fieldKey = key as keyof FormState
                return (
                  <div key={key} className="inferred-field">
                    <span className="inferred-field-label">{getFieldLabel(fieldKey)}:</span>
                    <span className="inferred-field-value">{formatValue(value)}</span>
                  </div>
                )
              })}
            </div>
            <button className="primary-button" onClick={handleApply}>
              Apply and go to review
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
