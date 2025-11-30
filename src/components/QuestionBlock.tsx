import { type ReactNode } from 'react'

type QuestionBlockProps = {
  title: string
  helper: string
  children: ReactNode
}

export const QuestionBlock = ({ title, helper, children }: QuestionBlockProps) => (
  <label className="question-block">
    <div className="question-meta">
      <p className="question-title">{title}</p>
      <p className="question-helper">{helper}</p>
    </div>
    <div className="question-input">{children}</div>
  </label>
)

