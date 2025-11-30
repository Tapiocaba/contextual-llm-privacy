import type {
  FormState,
  QuestionKey,
  StorageOption,
  ReminderOption,
  MultiSelectField,
  MultiSelectValue
} from '../types/privacy'
import {
  stepMeta,
  projectTypeOptions,
  repoVisibilityOptions,
  sensitivityOptions,
  aiUsageOptions,
  collaborationOptions,
  complianceOptions,
  nudgeLevelOptions,
  storageOptions,
  reminderOptions,
  riskAreas
} from '../lib/options'
import { QuestionBlock } from './QuestionBlock'

const formatStorageLabel = (value: StorageOption) => {
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

const formatReminderLabel = (value: ReminderOption) => {
  switch (value) {
    case 'session-audits':
      return 'Log assistant sessions'
    case 'data-minimization':
      return 'Share minimal diffs'
    case 'delete-after-export':
      return 'Delete temp exports'
    case 'manual-redaction':
      return 'Manual redaction sweep'
    default:
      return value
  }
}

export const renderStepBlock = (
  key: QuestionKey,
  form: FormState,
  handleFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void,
  toggleArrayField: <K extends MultiSelectField>(field: K, value: MultiSelectValue<K>) => void
) => {
  switch (key) {
    case 'projectName':
      return (
        <QuestionBlock title={stepMeta.projectName.title} helper={stepMeta.projectName.helper}>
          <input
            className="text-input"
            value={form.projectName}
            placeholder="e.g. Compilers final project"
            onChange={(e) => handleFieldChange('projectName', e.target.value)}
          />
        </QuestionBlock>
      )

    case 'projectType':
      return (
        <QuestionBlock title={stepMeta.projectType.title} helper={stepMeta.projectType.helper}>
          <div className="option-grid">
            {projectTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`option-chip ${form.projectType === opt.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('projectType', opt.value)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'repoVisibility':
      return (
        <QuestionBlock title={stepMeta.repoVisibility.title} helper={stepMeta.repoVisibility.helper}>
          <div className="radio-row">
            {repoVisibilityOptions.map((opt) => (
              <label key={opt.value} className="radio-chip">
                <input
                  type="radio"
                  name="repoVisibility"
                  value={opt.value}
                  checked={form.repoVisibility === opt.value}
                  onChange={() => handleFieldChange('repoVisibility', opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'dataSensitivity':
      return (
        <QuestionBlock title={stepMeta.dataSensitivity.title} helper={stepMeta.dataSensitivity.helper}>
          <div className="option-grid">
            {sensitivityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`option-chip ${form.dataSensitivity === opt.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('dataSensitivity', opt.value)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'highestRiskArea':
      return (
        <QuestionBlock
          title={stepMeta.highestRiskArea.title}
          helper={stepMeta.highestRiskArea.helper}
        >
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
            placeholder="e.g. /data/raw/nda-clients.csv, firebase service accounts"
            value={form.dataExamples}
            onChange={(e) => handleFieldChange('dataExamples', e.target.value)}
          />
        </QuestionBlock>
      )

    case 'compliance':
      return (
        <QuestionBlock title={stepMeta.compliance.title} helper={stepMeta.compliance.helper}>
          <div className="checkbox-grid">
            {complianceOptions.map((opt) => (
              <label key={opt} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={form.compliance.includes(opt)}
                  onChange={() => toggleArrayField('compliance', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'aiUsage':
      return (
        <QuestionBlock title={stepMeta.aiUsage.title} helper={stepMeta.aiUsage.helper}>
          <div className="option-grid">
            {aiUsageOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`option-chip ${form.aiUsage === opt.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('aiUsage', opt.value)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'collaboration':
      return (
        <QuestionBlock
          title={stepMeta.collaboration.title}
          helper={stepMeta.collaboration.helper}
        >
          <div className="radio-row">
            {collaborationOptions.map((opt) => (
              <label key={opt.value} className="radio-chip">
                <input
                  type="radio"
                  name="collaboration"
                  value={opt.value}
                  checked={form.collaboration === opt.value}
                  onChange={() => handleFieldChange('collaboration', opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'storage':
      return (
        <QuestionBlock title={stepMeta.storage.title} helper={stepMeta.storage.helper}>
          <div className="checkbox-grid">
            {storageOptions.map((opt) => (
              <label key={opt} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={form.storage.includes(opt)}
                  onChange={() => toggleArrayField('storage', opt)}
                />
                {formatStorageLabel(opt)}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'reminders':
      return (
        <QuestionBlock title={stepMeta.reminders.title} helper={stepMeta.reminders.helper}>
          <div className="checkbox-grid">
            {reminderOptions.map((opt) => (
              <label key={opt} className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={form.reminders.includes(opt)}
                  onChange={() => toggleArrayField('reminders', opt)}
                />
                {formatReminderLabel(opt)}
              </label>
            ))}
          </div>
        </QuestionBlock>
      )

    case 'nudgeLevel':
      return (
        <QuestionBlock title={stepMeta.nudgeLevel.title} helper={stepMeta.nudgeLevel.helper}>
          <div className="option-grid">
            {nudgeLevelOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`option-chip ${form.nudgeLevel === opt.value ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('nudgeLevel', opt.value)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.helper}</span>
              </button>
            ))}
          </div>
        </QuestionBlock>
      )

    default:
      return null
  }
}

