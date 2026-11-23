import { Bell } from 'lucide-react'

export function NotificationBell() {
  return (
    <details className="relative">
      <summary
        aria-label="Notificações"
        className="grid size-10 cursor-pointer list-none place-items-center rounded-full border hover:bg-muted [&::-webkit-details-marker]:hidden"
      >
        <Bell aria-hidden size={18} />
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-lg">
        As notificações estarão disponíveis em breve.
      </div>
    </details>
  )
}
