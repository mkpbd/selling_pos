import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Crown, KeyRound, LoaderCircle, LogOut } from 'lucide-react'
import { ChangePasswordDialog, useAuth, useLogout } from '@/modules/authentication'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { initials } from '@/shared/utils/format'

export function UserMenu() {
  const { user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  if (!user) return null

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('You have been signed out.')
        navigate('/login', { replace: true })
      },
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label={`Account menu for ${user.name}`}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm font-medium lg:inline">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-1">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.is_super_admin && (
                <Badge className="gap-1 bg-warning text-warning-foreground">
                  <Crown className="size-3" aria-hidden="true" /> Super admin
                </Badge>
              )}
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
              {user.current_branch && (
                <Badge variant="outline" className="font-mono">
                  {user.current_branch.code}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
              <KeyRound aria-hidden="true" />
              Change password
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={logout.isPending}
            onSelect={(e) => {
              e.preventDefault()
              handleLogout()
            }}
          >
            {logout.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  )
}
