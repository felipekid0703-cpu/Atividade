import { BookOpen } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="bg-primary text-primary-foreground rounded-lg p-4">
        <BookOpen className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold">Caderno Inteligente 7º Ano</h1>
      <p className="text-muted-foreground">Fase 0 concluída: o projeto está de pé.</p>
      <p
        className={
          isSupabaseConfigured
            ? 'bg-success/15 text-success rounded-md px-3 py-1 text-sm'
            : 'bg-warning/20 text-warning-foreground rounded-md px-3 py-1 text-sm'
        }
      >
        {isSupabaseConfigured ? 'Supabase configurado' : 'Supabase não configurado (.env.local)'}
      </p>
    </main>
  )
}
