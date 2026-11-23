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
const ChangePasswordPage = lazy(() =>
  import('@/features/auth/ChangePasswordPage').then((module) => ({
    default: module.ChangePasswordPage,
  })),
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
const SubjectPage = lazy(() =>
  import('@/features/student/SubjectPage').then((module) => ({
    default: module.SubjectPage,
  })),
)
const QuestionPage = lazy(() =>
  import('@/features/student/QuestionPage').then((module) => ({
    default: module.QuestionPage,
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
  if (profile.must_change_password) return <Navigate to="/change-password" replace />
  return (
    <Navigate
      to={profile.role === 'student' ? '/student/dashboard' : '/parent/dashboard'}
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
            <Route
              path="/change-password"
              element={
                <RoleGuard allowPasswordChange>
                  <ChangePasswordPage />
                </RoleGuard>
              }
            />
            <Route element={<RoleGuard allowed={['student', 'parent']} />}>
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
                  path="/student/subject/:slug"
                  element={
                    <RoleGuard allowed="student">
                      <SubjectPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/student/question/:id"
                  element={
                    <RoleGuard allowed="student">
                      <QuestionPage />
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
