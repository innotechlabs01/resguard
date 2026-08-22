'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Shield,
  Building2,
  Bot,
  Loader2,
  Circle,
} from 'lucide-react'

interface ChatThread {
  id: string
  building_id: string
  unit_number: string
  thread_type: 'vigilante' | 'admin' | 'ai'
  subject: string | null
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
  unread_count?: number
}

interface ChatMessage {
  id: string
  thread_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  content: string
  is_read: boolean
  created_at: string
}

const threadTypeConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  vigilante: { label: 'Vigilante', icon: Shield, color: 'text-blue-600' },
  admin: { label: 'Admin', icon: Building2, color: 'text-purple-600' },
  ai: { label: 'AI Concierge', icon: Bot, color: 'text-amber-600' },
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function ChatPanel({ buildingId }: { buildingId: string }) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      const res = await fetch(`/api/chat-threads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      }
    } catch (err) {
      console.error('Error fetching threads:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  // Poll threads every 10s
  useEffect(() => {
    const interval = setInterval(fetchThreads, 10000)
    return () => clearInterval(interval)
  }, [fetchThreads])

  // Fetch messages when thread selected
  const fetchMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/chat-threads/${threadId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id)
      // Mark as read
      fetch(`/api/chat-threads/${selectedThread.id}/messages`, { method: 'PATCH' }).catch(() => {})
    }
  }, [selectedThread, fetchMessages])

  // Poll messages every 5s when in chat
  useEffect(() => {
    if (!selectedThread) return
    const interval = setInterval(() => fetchMessages(selectedThread.id), 5000)
    return () => clearInterval(interval)
  }, [selectedThread, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => { scrollToBottom() }, [messages])

  // Send message
  const handleSend = async () => {
    if (!selectedThread || !newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/chat-threads/${selectedThread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        fetchThreads()
      }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  // Thread detail view
  if (selectedThread) {
    const typeConfig = threadTypeConfig[selectedThread.thread_type]
    const TypeIcon = typeConfig?.icon || MessageSquare

    return (
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedThread(null); setMessages([]) }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${typeConfig?.color || ''}`} />
            <div>
              <h3 className="font-semibold text-foreground">Apto {selectedThread.unit_number}</h3>
              <p className="text-xs text-muted-foreground">{typeConfig?.label}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay mensajes en esta conversacion
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === user?.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  // Thread list view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Mensajes</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay conversaciones activas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => {
            const typeConfig = threadTypeConfig[thread.thread_type]
            const TypeIcon = typeConfig?.icon || MessageSquare

            return (
              <Card
                key={thread.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedThread(thread)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted">
                        <TypeIcon className={`h-5 w-5 ${typeConfig?.color || ''}`} />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Apto {thread.unit_number}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {typeConfig?.label}
                      </Badge>
                    </div>
                    {thread.last_message_preview && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {thread.last_message_preview}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(thread.last_message_at)}
                    </span>
                    {(thread.unread_count ?? 0) > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px]">
                        {thread.unread_count}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
