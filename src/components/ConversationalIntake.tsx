import { useState, useRef, useEffect } from 'react'
import type { FormState } from '../types/privacy'
import { defaultForm, stepMeta } from '../lib/options'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ConversationalIntakeProps = {
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onGenerateAgents: () => void
}

export const ConversationalIntake = ({ setForm, onGenerateAgents }: ConversationalIntakeProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Tell me about your project in a few sentences. What does it do, who uses it, and what feels risky?'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [extractionComplete, setExtractionComplete] = useState(false)
  const [inferredConfig, setInferredConfig] = useState<Partial<FormState> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const assistantQuestionCount = useRef(0)
  const maxAssistantQuestions = 3

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim()
    }

    setChatMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Generate assistant follow-up question if we haven't asked too many
      if (assistantQuestionCount.current < maxAssistantQuestions) {
        const apiKey =
          import.meta.env.VITE_OPENAI_API_KEY ??
          import.meta.env.VITE_OPENAI_KEY ??
          ''

        if (!apiKey) {
          throw new Error('Missing OpenAI API key.')
        }

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful assistant conducting a brief interview to understand a software project\'s privacy context. Ask one concise follow-up question to gather more details about the project type, data sensitivity, collaboration model, or compliance requirements. Keep questions short and conversational.'
              },
              ...chatMessages.map((msg) => ({
                role: msg.role,
                content: msg.content
              })),
              {
                role: 'user',
                content: userMessage.content
              }
            ]
          })
        })

        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}))
          throw new Error(errorJson?.error?.message ?? 'Failed to get assistant response.')
        }

        const json = await res.json()
        const assistantContent = json?.choices?.[0]?.message?.content?.trim()

        if (assistantContent) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: assistantContent
          }
          setChatMessages((prev) => [...prev, assistantMessage])
          assistantQuestionCount.current += 1
        }
      }
    } catch (err) {
      console.error('Error getting assistant response:', err)
      // Continue without assistant response - user can still proceed
    } finally {
      setIsLoading(false)
    }
  }

  const handleExtractConfiguration = async () => {
    if (isExtracting) return

    const apiKey =
      import.meta.env.VITE_OPENAI_API_KEY ??
      import.meta.env.VITE_OPENAI_KEY ??
      ''

    if (!apiKey) {
      setExtractionError('Missing OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file.')
      return
    }

    setIsExtracting(true)
    setExtractionError(null)

    try {
      const conversationText = chatMessages
        .map((msg) => `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`)
        .join('\n\n')

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
              content: `You are a configuration extractor for a privacy tool that generates AGENTS.md for coding assistants. Output ONLY valid JSON matching this TypeScript type as closely as possible:

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
              content: `Here is a transcript of a conversation where the user describes their project context. Infer the best FormState config from it:\n\n${conversationText}`
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
      
      // Store the inferred config to show in summary
      setInferredConfig(extractedConfig)
      setExtractionComplete(true)
    } catch (err) {
      console.error('Error extracting configuration:', err)
      setExtractionError(
        err instanceof Error ? err.message : 'Failed to extract configuration.'
      )
    } finally {
      setIsExtracting(false)
    }
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

  const handleApplyAndGenerate = () => {
    if (!inferredConfig) return

    // Merge with default form state and apply to form
    setForm({
      ...defaultForm,
      ...inferredConfig
    })

    // Trigger AGENTS.md generation
    onGenerateAgents()
  }

  if (extractionComplete && inferredConfig) {
    return (
      <section className="conversational-intake">
        <div className="extraction-success">
          <h2>Configuration extracted successfully!</h2>
          <p>
            Here's what I inferred from our conversation:
          </p>
          
          <div className="inferred-config-panel">
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
            <button className="primary-button" onClick={handleApplyAndGenerate}>
              Apply and generate AGENTS.md
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="conversational-intake">
      <div className="chat-container">
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`chat-message chat-message--${msg.role}`}>
              <div className="chat-message__content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message__content">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type your message..."
              rows={2}
              disabled={isLoading || isExtracting}
            />
            <button
              className="chat-send-button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || isExtracting}
            >
              Send
            </button>
          </div>
          {extractionError && (
            <div className="extraction-error">{extractionError}</div>
          )}
          <div className="chat-actions">
            <button
              className="primary-button"
              onClick={handleExtractConfiguration}
              disabled={chatMessages.length < 2 || isExtracting || isLoading}
            >
              {isExtracting ? 'Extracting configuration...' : 'Summarize into configuration'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
