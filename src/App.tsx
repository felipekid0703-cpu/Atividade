import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RoleGuard } from '@/features/auth/RoleGuard'
import { useAuth } from '@/features/auth/useAuth'

const AppLayout = lazy(() =>
  import('@/components/AppLayout').then((module) => ({ default: module.AppLayout })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const SignupPage = lazy(() =>
  import('@/features/auth/SignupPage').then((module) => ({ default: module.SignupPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/auth/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const ParentDashboardPage = lazy(() =>
  import('@/features/parent/ParentDashboardPage').then((module) => ({
    default: module.ParentDashboardPage,
  })),
)
const StudentDashboardPage = lazy(() =>
  import('@/features/student/StudentDashboardPage').then((module) => ({
    default: module.StudentDashboardPage,
  })),
)

function HomeRedirect() {
  const { authenticated, profile, loading } = useAuth()
  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center p-6" aria-live="polite">
        <p className="text-muted-foreground">Carregando sua conta...</p>
      </main>
    )
  }
  if (!authenticated || !profile) return <Navigate to="/login" replace />
  return (
    <Navigate
      to={
        profile.role === 'student'
          ? '/student/dashboard'
          : profile.role === 'tutor'
            ? '/tutor/dashboard'
            : '/parent/dashboard'
      }
      replace
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <main className="grid min-h-dvh place-items-center p-6" aria-live="polite">
              <p className="text-muted-foreground">Carregando...</p>
            </main>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route element={<RoleGuard allowed={['student', 'parent', 'tutor']} />}>
              <Route element={<AppLayout />}>
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/student/dashboard"
                  element={
                    <RoleGuard allowed="student">
                      <StudentDashboardPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/parent/dashboard"
                  element={
                    <RoleGuard allowed="parent">
                      <ParentDashboardPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/tutor/dashboard"
                  element={
                    <RoleGuard allowed="tutor">
                      <ParentDashboardPage />
                    </RoleGuard>
                  }
                />
              </Route>
            </Route>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
