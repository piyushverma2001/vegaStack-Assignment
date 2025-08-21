'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Trash2, Shield, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
      profile?: {
      bio: string
      privacy: 'public' | 'private' | 'followers_only'
    }
}

export function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/admin/users/')
      const usersData = response.data.users || response.data || []
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const activateUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/activate/`)
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: true } : u
      ))
      toast.success('User activated successfully')
    } catch (error: any) {
      toast.error('Failed to activate user')
    }
  }

  const deactivateUser = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/deactivate/`)
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: false } : u
      ))
      toast.success('User deactivated successfully')
    } catch (error: any) {
      toast.error('Failed to deactivate user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await api.delete(`/admin/users/${userId}/delete/`)
      
      setUsers(prev => prev.filter(u => u.id !== userId))
      setFilteredUsers(prev => prev.filter(u => u.id !== userId))
      
      toast.success('User deleted successfully')
      
      setTimeout(() => {
        fetchUsers()
      }, 1000)
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.response?.data?.error || error.message || 'Unknown error'}`)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.post(`/admin/users/${userId}/role/`, { role: newRole })
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
      toast.success(`User role updated to ${newRole}`)
    } catch (error: any) {
      toast.error('Failed to update user role')
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const bulkActivate = async () => {
    if (selectedUsers.length === 0) return
    
    try {
      for (const userId of selectedUsers) {
        await api.post(`/admin/users/${userId}/activate/`)
      }
      setUsers(prev => prev.map(u => 
        selectedUsers.includes(u.id) ? { ...u, is_active: true } : u
      ))
      setSelectedUsers([])
      toast.success(`${selectedUsers.length} users activated successfully`)
    } catch (error: any) {
      toast.error('Failed to bulk activate users')
    }
  }

  const bulkDeactivate = async () => {
    if (selectedUsers.length === 0) return
    
    try {
      for (const userId of selectedUsers) {
        await api.post(`/admin/users/${userId}/deactivate/`)
      }
      setUsers(prev => prev.map(u => 
        selectedUsers.includes(u.id) ? { ...u, is_active: false } : u
      ))
      setSelectedUsers([])
      toast.success(`${selectedUsers.length} users deactivated successfully`)
    } catch (error: any) {
      toast.error('Failed to bulk deactivate users')
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don&apos;t have permission to access user management.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts, roles, and status</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={bulkActivate} variant="outline" size="sm">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate ({selectedUsers.length})
                  </Button>
                  <Button onClick={bulkDeactivate} variant="outline" size="sm">
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate ({selectedUsers.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredUsers.map(u => u.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {user.is_active ? (
                            <Button
                              onClick={() => deactivateUser(user.id)}
                              variant="outline"
                              size="sm"
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              onClick={() => activateUser(user.id)}
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-900"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          
                          {user.role === 'user' ? (
                            <Button
                              onClick={() => updateUserRole(user.id, 'admin')}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Make Admin
                            </Button>
                          ) : (
                            <Button
                              onClick={() => updateUserRole(user.id, 'user')}
                              variant="outline"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Remove Admin
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => deleteUser(user.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
