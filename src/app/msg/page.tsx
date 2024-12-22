'use client'

import React, { useState, useEffect } from 'react'
import pusherClient from '../../lib/pusher'

export default function Home() {
  const [messages, setMessages] = useState<string[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {

    
    const channel = pusherClient.subscribe('chat-channel')
    
    channel.bind('new-message', (data: { message: string }) => {
      setMessages((prev) => [...prev, data.message])
    })

    return () => {
      pusherClient.unsubscribe('chat-channel')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, you'd send this to your backend
    // which would then trigger the Pusher event
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage }),
    })

    setNewMessage('')
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">Real-Time Message Board</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Type a message"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Send
        </button>
      </form>
      <ul>
        {messages.map((message, index) => (
          <li key={index} className="mb-2">{message}</li>
        ))}
      </ul>
    </main>
  )
}