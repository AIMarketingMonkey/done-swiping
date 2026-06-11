'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Bell, Shield, CreditCard, HelpCircle,
  LogOut, Trash2, ChevronRight, Lock, Eye, AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Section {
  title: string
  items: {
    icon: React.ReactNode
    label: string
    description?: string
    onClick: () => void
    destructive?: boolean
  }[]
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      await fetch('/api/profile', {
        method: 'DELETE',
      })
      await supabase.auth.signOut()
      router.push('/')
      toast.success('Your account has been deleted.')
    } catch {
      toast.error('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
    }
  }

  const sections: Section[] = [
    {
      title: 'Account',
      items: [
        {
          icon: <User className="w-4.5 h-4.5" />,
          label: 'Edit profile',
          description: 'Update your name, photos and bio',
          onClick: () => router.push('/profile'),
        },
        {
          icon: <Lock className="w-4.5 h-4.5" />,
          label: 'Change password',
          description: 'Update your account password',
          onClick: () => toast.info('Check your email for a password reset link'),
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: <Eye className="w-4.5 h-4.5" />,
          label: 'Profile visibility',
          description: 'Control who can see your profile',
          onClick: () => toast.info('Coming soon'),
        },
        {
          icon: <Shield className="w-4.5 h-4.5" />,
          label: 'Data & privacy',
          description: 'Download or manage your data',
          onClick: () => toast.info('Contact support@doneswiping.com to request your data'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: <Bell className="w-4.5 h-4.5" />,
          label: 'Push notifications',
          description: 'Manage what you hear about',
          onClick: () => toast.info('Coming soon'),
        },
      ],
    },
    {
      title: 'Subscription',
      items: [
        {
          icon: <CreditCard className="w-4.5 h-4.5" />,
          label: 'Manage subscription',
          description: 'Upgrade, downgrade or cancel',
          onClick: () => toast.info('Coming soon — Premium launches soon'),
        },
      ],
    },
    {
      title: 'Safety',
      items: [
        {
          icon: <AlertTriangle className="w-4.5 h-4.5" />,
          label: 'Report a problem',
          description: 'Report abuse or safety issues',
          onClick: () => toast.info('Email safety@doneswiping.com'),
        },
        {
          icon: <Shield className="w-4.5 h-4.5" />,
          label: 'Dating safety tips',
          description: 'Stay safe when meeting someone new',
          onClick: () => toast.info('Always meet in public places. Tell someone where you\'re going.'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle className="w-4.5 h-4.5" />,
          label: 'Help & FAQ',
          description: 'Get answers to common questions',
          onClick: () => toast.info('Visit help.doneswiping.com'),
        },
      ],
    },
  ]

  return (
    <div className="app-shell pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="px-4 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left ${
                    i < section.items.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.destructive ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${item.destructive ? 'text-red-600' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl shadow-sm border border-border text-foreground font-medium text-sm hover:bg-muted/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

        {/* Delete account */}
        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-red-800 font-medium mb-1">Are you sure?</p>
            <p className="text-xs text-red-600 mb-4">
              This permanently deletes your profile, photos and all data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-white rounded-xl border border-red-200 text-sm text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm text-white font-medium disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-600 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete my account
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground pb-2">
          Done Swiping v1.0 · For people who are done swiping, but not done with love.
        </p>
      </div>
    </div>
  )
}
