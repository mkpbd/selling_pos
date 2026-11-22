import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/services/http'
import { makeAuth, makeMe, renderWithProviders } from '@/test/utils'
import { authApi } from '../api/auth.api'
import { LoginForm } from './LoginForm'

vi.mock('../api/auth.api', () => ({
  authKeys: { all: ['auth'], me: () => ['auth', 'me'] },
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
}))

const login = vi.mocked(authApi.login)
// Lazily rejected: an eagerly created rejected promise would be flagged as unhandled while the user types.
const rejectWith = (error: ApiError) => login.mockImplementation(() => Promise.reject(error))

describe('<LoginForm>', () => {


  it('shows a validation error for an invalid email and does not call the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />, { auth: makeAuth({ user: null }) })

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(login).not.toHaveBeenCalled()
  })

  it('requires a password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />, { auth: makeAuth({ user: null }) })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Password is required.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('submits credentials, stores the user and reports success', async () => {
    const me = makeMe()
    login.mockResolvedValue(me)
    const onSuccess = vi.fn()
    const auth = makeAuth({ user: null })
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={onSuccess} />, { auth })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'Secret@123')
    await user.click(screen.getByRole('checkbox', { name: /keep me signed in/i }))
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(me))
    expect(login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'Secret@123', remember: true })
    expect(auth.setUser).toHaveBeenCalledWith(me)
  })

  it('shows the server message for INVALID_CREDENTIALS', async () => {
    rejectWith(
      new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'These credentials do not match our records.', details: {}, requestId: 'r' }),
    )
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />, { auth: makeAuth({ user: null }) })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('These credentials do not match our records.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('maps 422 field details onto the matching inputs', async () => {
    rejectWith(
      new ApiError({
        status: 422,
        code: 'VALIDATION_FAILED',
        message: 'The given data was invalid.',
        details: { email: ['The selected email is invalid.'] },
        requestId: null,
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />, { auth: makeAuth({ user: null }) })

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'whatever')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('The selected email is invalid.')).toBeInTheDocument()
  })
})
