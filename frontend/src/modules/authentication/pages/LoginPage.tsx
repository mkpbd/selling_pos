import { useLocation, useNavigate } from 'react-router'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { AuthCard } from '../components/AuthCard'
import { LoginForm } from '../components/LoginForm'

interface LocationState {
  from?: { pathname: string; search?: string }
}

export function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from
  const target = from && from.pathname !== '/login' ? `${from.pathname}${from.search ?? ''}` : '/dashboard'

  return (
    <AuthCard title="Welcome back" description="Sign in to manage sales, stock and your branches.">
      <LoginForm onSuccess={() => navigate(target, { replace: true })} />
    </AuthCard>
  )
}

export default LoginPage
