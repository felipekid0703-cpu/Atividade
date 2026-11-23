import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const expectedCounts = new Map([
  ['ingles', 20],
  ['portugues', 20],
  ['matematica-dia-1', 15],
  ['matematica-dia-2', 30],
  ['filosofia', 20],
])
const seedPath = fileURLToPath(new URL('../src/data/seed.ts', import.meta.url))
const sqlPath = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url))
const source = await readFile(seedPath, 'utf8')
if (source.includes('answer_key')) {
  throw new Error('O seed carregável pelo cliente não pode conter gabaritos.')
}

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText
const seedModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
)
const questions = seedModule.seedQuestions
if (!Array.isArray(questions)) {
  throw new Error('src/data/seed.ts não exporta seedQuestions.')
}

const counts = new Map([...expectedCounts.keys()].map((slug) => [slug, 0]))
const seen = new Set()
for (const question of questions) {
  if (!counts.has(question.subject_slug)) {
    throw new Error(`Matéria inesperada: ${question.subject_slug}`)
  }
  if (!Number.isInteger(question.number) || question.number < 1) {
    throw new Error(`Número de questão inválido: ${question.subject_slug}`)
  }
  if (!question.statement?.trim() || !Array.isArray(question.hints)) {
    throw new Error(`Conteúdo inválido: ${question.subject_slug} Q${question.number}`)
  }
  if (question.statement.includes('TODO_CONTEUDO')) {
    throw new Error(`Conteúdo pendente: ${question.subject_slug} Q${question.number}`)
  }
  const key = `${question.subject_slug}:${question.number}`
  if (seen.has(key)) throw new Error(`Questão duplicada: ${key}`)
  seen.add(key)
  counts.set(question.subject_slug, counts.get(question.subject_slug) + 1)
}

for (const [slug, expected] of expectedCounts) {
  const actual = counts.get(slug)
  if (actual !== expected) {
    throw new Error(`${slug}: esperado ${expected}, encontrado ${actual}`)
  }
}
if (questions.length !== 105) {
  throw new Error(`Esperadas 105 questões; encontradas ${questions.length}`)
}

const sql = await readFile(sqlPath, 'utf8')
const questionValues = sql.split('insert into public.questions')[1]?.split('on conflict')[0]
const answerValues = sql.split('from (values')[1]?.split(') as v')[0]
const questionRows = questionValues?.match(/^\s+\('[0-9a-f-]{36}'::uuid,/gm) ?? []
const answerRows =
  answerValues?.match(
    /^\s+\('(ingles|portugues|matematica-dia-1|matematica-dia-2|filosofia)',/gm,
  ) ?? []
if (questionRows.length !== 105 || answerRows.length !== 105) {
  throw new Error(
    `Seed SQL incompleto: ${questionRows.length} questões e ${answerRows.length} gabaritos.`,
  )
}

console.log('Seed validado: Inglês 20, Português 20, Matemática 15 + 30, Filosofia 20; total 105.')
