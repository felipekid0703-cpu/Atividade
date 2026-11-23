import type { FormEvent } from 'react'
import type { QuestionAnswerKeyRow, QuestionRow, StudentAnswerStatus } from '@/types/database'

interface QuestionCardProps {
  question: QuestionRow
  answer: string
  status: StudentAnswerStatus
  saveState: 'idle' | 'saving' | 'saved'
  saveError: string | null
  submitError: string | null
  isSubmitting: boolean
  answerKey: QuestionAnswerKeyRow | null
  answerKeyError: string | null
  onAnswerChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function QuestionCard({
  question,
  answer,
  status,
  saveState,
  saveError,
  submitError,
  isSubmitting,
  answerKey,
  answerKeyError,
  onAnswerChange,
  onSubmit,
}: QuestionCardProps) {
  const isSubmitted = status === 'submitted' || status === 'reviewed'

  return (
    <article className="space-y-5 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">
          {question.block} · Questão {question.number}
        </p>
        <h1 className="text-lg font-semibold leading-relaxed">{question.statement}</h1>
      </header>

      {question.scaffold && (
        <section className="rounded-lg bg-muted p-4">
          <h2 className="text-sm font-semibold">Roteiro</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm">{question.scaffold}</p>
        </section>
      )}

      {question.hints.length > 0 && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">Dicas</summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {question.hints.map((hint, index) => (
              <li key={`${index}-${hint}`}>{hint}</li>
            ))}
          </ul>
        </details>
      )}

      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block space-y-1.5 text-sm font-medium">
          Sua resposta
          <textarea
            className="min-h-36 w-full resize-y rounded-lg border bg-background p-3 font-normal"
            disabled={isSubmitted}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Escreva sua resposta aqui..."
            required
            value={answer}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {saveError ??
              (saveState === 'saving'
                ? 'Salvando rascunho...'
                : saveState === 'saved'
                  ? 'Rascunho salvo.'
                  : 'Salvamento automático após 2 segundos.')}
          </p>
          {!isSubmitted && (
            <button
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !answer.trim()}
              type="submit"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar resposta'}
            </button>
          )}
        </div>
      </form>

      {submitError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
          {submitError}
        </p>
      )}

      {isSubmitted && (
        <section className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h2 className="font-semibold">Gabarito comentado</h2>
          {answerKey ? (
            <>
              <p className="whitespace-pre-wrap text-sm">{answerKey.answer_key}</p>
              {answerKey.explanation && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {answerKey.explanation}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground" role={answerKeyError ? 'alert' : 'status'}>
              {answerKeyError ?? 'Carregando gabarito...'}
            </p>
          )}
        </section>
      )}
    </article>
  )
}
