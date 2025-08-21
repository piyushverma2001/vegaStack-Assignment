'use client'

import { useState, useEffect } from 'react'
import { FileText, MessageSquare, Trash2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { api, endpoints } from '@/lib/api'
import toast from 'react-hot-toast'

interface Post {
  id: string
  content: string
  image_url?: string
  author: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  created_at: string
  like_count: number
  comment_count: number
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  post?: {
    id: string
    content: string
  } | null
  created_at: string
}

export function ContentManagement() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  const [authorFilter, setAuthorFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  
  const [commentAuthorFilter, setCommentAuthorFilter] = useState('')
  const [postFilter, setPostFilter] = useState('')

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchContent()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'posts') {
      filterPosts()
    } else {
      filterComments()
    }
  }, [searchTerm, authorFilter, dateFromFilter, dateToFilter, commentAuthorFilter, postFilter, posts, comments, activeTab])

    const fetchContent = async () => {
    try {
      setIsLoading(true)
      
      const [postsRes, commentsRes] = await Promise.all([
        api.get(endpoints.admin.posts),
        api.get(endpoints.admin.posts + 'comments/')
      ])

      let postsData = []
      let commentsData = []
      
      if (postsRes.data && Array.isArray(postsRes.data)) {
        postsData = postsRes.data
      } else if (postsRes.data && postsRes.data.posts && Array.isArray(postsRes.data.posts)) {
        postsData = postsRes.data.posts
      } else if (postsRes.data && postsRes.data.results && Array.isArray(postsRes.data.results)) {
        postsData = postsRes.data.results
      }
      
      if (commentsRes.data && Array.isArray(commentsRes.data)) {
        commentsData = commentsRes.data
      } else if (commentsRes.data && commentsRes.data.comments && Array.isArray(commentsRes.data.comments)) {
        commentsData = commentsRes.data.comments
      } else if (commentsRes.data && commentsRes.data.results && Array.isArray(commentsRes.data.results)) {
        commentsData = commentsRes.data.results
      }
      
      setPosts(postsData)
      setFilteredPosts(postsData)
      setComments(commentsData)
      setFilteredComments(commentsData)
    } catch (error: any) {
      console.error('ContentManagement: Error fetching content:', error)
      toast.error('Failed to fetch content')
    } finally {
      setIsLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts || []

    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (authorFilter) {
      filtered = filtered.filter(post => 
        post.author.username.toLowerCase().includes(authorFilter.toLowerCase()) ||
        post.author.first_name.toLowerCase().includes(authorFilter.toLowerCase()) ||
        post.author.last_name.toLowerCase().includes(authorFilter.toLowerCase())
      )
    }

    if (dateFromFilter) {
      filtered = filtered.filter(post => 
        new Date(post.created_at) >= new Date(dateFromFilter)
      )
    }

    if (dateToFilter) {
      filtered = filtered.filter(post => 
        new Date(post.created_at) <= new Date(dateToFilter)
      )
    }

    setFilteredPosts(filtered)
  }

  const filterComments = () => {
    let filtered = comments || []

    if (searchTerm) {
      filtered = filtered.filter(comment => 
        comment.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (commentAuthorFilter) {
      filtered = filtered.filter(comment => 
        comment.author.username.toLowerCase().includes(commentAuthorFilter.toLowerCase()) ||
        comment.author.first_name.toLowerCase().includes(commentAuthorFilter.toLowerCase()) ||
        comment.author.last_name.toLowerCase().includes(commentAuthorFilter.toLowerCase())
      )
    }

    if (postFilter) {
      filtered = filtered.filter(comment => 
        comment.post?.content?.toLowerCase().includes(postFilter.toLowerCase()) || false
      )
    }

    setFilteredComments(filtered)
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`${endpoints.admin.posts}${postId}/delete/`)
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Post deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete post')
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`${endpoints.admin.posts}comments/${commentId}/delete/`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete comment')
    }
  }

  const bulkDeletePosts = async () => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} posts? This action cannot be undone.`)) {
      return
    }

    try {
      await api.post(`${endpoints.admin.posts}bulk-delete/`, { post_ids: selectedItems })
      setPosts(prev => prev.filter(p => !selectedItems.includes(p.id)))
      setSelectedItems([])
      toast.success(`${selectedItems.length} posts deleted successfully`)
    } catch (error: any) {
      toast.error('Failed to bulk delete posts')
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setAuthorFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setCommentAuthorFilter('')
    setPostFilter('')
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access content management.</p>
      </div>
    )
  }

     if (isLoading) {
     return (
       <div className="text-center py-12">
         <div className="text-lg">Loading content...</div>
       </div>
     )
   }
           return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
           <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
           <p className="text-gray-600 mt-2">Manage posts, comments, and user-generated content</p>
         </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                                 Posts ({Array.isArray(filteredPosts) ? filteredPosts.length : 0})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                                 Comments ({Array.isArray(filteredComments) ? filteredComments.length : 0})
              </button>
            </nav>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {activeTab === 'posts' ? (
                <>
                  <Input
                    placeholder="Filter by author..."
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="From date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <Input
                    placeholder="Filter by comment author..."
                    value={commentAuthorFilter}
                    onChange={(e) => setCommentAuthorFilter(e.target.value)}
                  />
                  <Input
                    placeholder="Filter by post content..."
                    value={postFilter}
                    onChange={(e) => setPostFilter(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button onClick={clearFilters} variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>

              {activeTab === 'posts' && selectedItems.length > 0 && (
                <Button onClick={bulkDeletePosts} variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedItems.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {activeTab === 'posts' ? (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Posts ({Array.isArray(filteredPosts) ? filteredPosts.length : 0})
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments ({Array.isArray(filteredComments) ? filteredComments.length : 0})
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'posts' ? (
              <div className="overflow-x-auto">
                                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         <input
                           type="checkbox"
                           checked={selectedItems.length === (filteredPosts?.length || 0)}
                           onChange={(e) => {
                             if (e.target.checked) {
                               setSelectedItems((filteredPosts || []).map(p => p.id))
                             } else {
                               setSelectedItems([])
                             }
                           }}
                           className="rounded border-gray-300"
                         />
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {Array.isArray(filteredPosts) ? filteredPosts.map((post) => (
                       <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(post.id)}
                            onChange={() => toggleItemSelection(post.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-900 truncate">
                              {post.content}
                            </div>
                            {post.image_url && (
                              <Badge variant="secondary" className="mt-1">
                                Has Image
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {post.author.first_name} {post.author.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{post.author.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2 text-sm text-gray-500">
                            <span>❤️ {post.like_count}</span>
                            <span>💬 {post.comment_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => deletePost(post.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                     )) : <tr><td colSpan={6} className="text-center py-4 text-gray-500">No posts found</td></tr>}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {Array.isArray(filteredComments) ? filteredComments.map((comment) => (
                       <tr key={comment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {comment.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {comment.author.first_name} {comment.author.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{comment.author.username}</div>
                        </td>
                                                 <td className="px-6 py-4">
                           <div className="max-w-xs">
                             <div className="text-sm text-gray-500 truncate">
                               {comment.post?.content || 'Post not available'}
                             </div>
                           </div>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => deleteComment(comment.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                     )) : <tr><td colSpan={5} className="text-center py-4 text-gray-500">No comments found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
