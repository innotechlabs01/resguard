'use client'

import React from "react"

import { useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RotateCcw,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const suggestedQuestions = [
  'Cuales son las normas de parqueo de visitantes?',
  'Cuales son los horarios de silencio?',
  'Puedo tener mascotas en el edificio?',
  'Como reservo el salon comunal?',
  'Cual es la sancion por pago tardio?',
  'Que hago si pierdo mi tarjeta de acceso?',
]

export function AIConcierge() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, reload, setMessages } =
    useChat({
      api: '/api/chat',
    })
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSuggestedQuestion = (question: string) => {
    handleInputChange({ target: { value: question } } as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col border-border bg-card">
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              Asistente Virtual
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta el reglamento de propiedad horizontal, normas y politicas del edificio
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([])}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nueva consulta
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Como puedo ayudarte hoy?
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Puedo responder preguntas sobre el reglamento de copropiedad, normas de parqueo,
                areas comunes, pagos y mucho mas.
              </p>
              
              {/* Suggested Questions */}
              <div className="w-full max-w-md space-y-2">
                <p className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  Preguntas frecuentes:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal py-2 text-left text-xs bg-transparent"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        message.role === 'assistant'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2',
                      message.role === 'assistant'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="shrink-0 border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu consulta sobre el reglamento..."
              className="flex-1 bg-secondary"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Las respuestas se basan en el reglamento del edificio. Para asuntos urgentes,
            contacte directamente a la administracion.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
