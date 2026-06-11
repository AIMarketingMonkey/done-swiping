'use client'

import { useEffect, useState } from 'react'
import { Users, Heart, MessageCircle, AlertTriangle, TrendingUp, Shield, RefreshCw } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  totalMatches: number
  pendingReports: number
  totalMessages: number
  profilesPendingApproval: number
}

interface AdminUser {
  id: string
  name: string
  email: string | null
  created_at: string
  is_blocked: boolean
  is_verified: boolean
  subscription_status: string
  user_profiles?: { profile_completion_score: number; approved_for_matching: boolean }[]
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalMatches: 0,
    pendingReports: 0,
    totalMessages: 0,
    profilesPendingApproval: 0,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  async function loadUsers(p = 1) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${p}`)
      if (!res.ok) throw new Error('Forbidden')
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      // Not an admin — redirect
      window.location.href = '/home'
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers(page) }, [page])

  async function handleUserAction(userId: string, action: string) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    })
    loadUsers(page)
  }

  const statCards = [
    { label: 'Total Users', value: total, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Subs', value: stats.activeSubscriptions, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Matches', value: stats.totalMatches, icon: Heart, color: 'text-primary bg-red-50' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Messages', value: stats.totalMessages, icon: MessageCircle, color: 'text-purple-600 bg-purple-50' },
    { label: 'Awaiting Approval', value: stats.profilesPendingApproval, icon: Shield, color: 'text-slate-600 bg-slate-50' },
  ]

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-secondary text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Done Swiping</h1>
          <p className="text-white/60 text-sm">Admin Dashboard</p>
        </div>
        <button
          onClick={() => loadUsers(page)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Users</h2>
            <span className="text-sm text-muted-foreground">{total} total</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['Name', 'Email', 'Joined', 'Profile %', 'Subscription', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {u.name}
                        {u.is_verified && (
                          <span className="ml-1.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${u.user_profiles?.[0]?.profile_completion_score ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {u.user_profiles?.[0]?.profile_completion_score ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.subscription_status === 'premium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.is_blocked
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {u.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.is_blocked ? (
                            <button
                              onClick={() => handleUserAction(u.id, 'unblock')}
                              className="text-xs px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(u.id, 'block')}
                              className="text-xs px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Block
                            </button>
                          )}
                          {!u.is_verified && (
                            <button
                              onClick={() => handleUserAction(u.id, 'verify')}
                              className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-4 py-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="text-sm px-4 py-2 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
