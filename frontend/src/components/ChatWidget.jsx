import React, { useState, useRef, useEffect } from 'react'
import { sendChat } from '../api'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import ChatIcon from '@mui/icons-material/Chat'
import AutorenewIcon from '@mui/icons-material/Autorenew'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI Timetable Assistant. Ask me about free rooms, schedule details, or today\'s classes!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setLoading(true)

    try {
      const res = await sendChat(userText)
      setMessages(prev => [...prev, { sender: 'bot', text: res.answer }])
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I ran into an error fetching information. Please ensure backend is running.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 sm:w-96 bg-white dark:bg-darkSurface rounded-2xl border border-border dark:border-darkBorder shadow-2xl flex flex-col h-[480px] overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="bg-primary px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SmartToyIcon />
              <div>
                <h3 className="font-semibold text-xs leading-tight">AI Assistant</h3>
                <span className="text-[10px] text-primaryLight">Powered by Gemini</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-bgApp dark:bg-darkBgApp">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-darkSurfaceAlt text-gray-800 dark:text-gray-100 border border-border dark:border-darkBorder rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-darkSurfaceAlt text-textMuted dark:text-darkTextMuted border border-border dark:border-darkBorder px-3.5 py-2 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 shadow-sm">
                  <AutorenewIcon className="animate-spin text-primary" fontSize="small" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-darkSurface border-t border-border dark:border-darkBorder flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-border dark:border-darkBorder bg-transparent focus:outline-none focus:border-primary text-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primaryHover text-white p-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <SendIcon fontSize="small" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primaryHover text-white p-3.5 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          title="Open AI Chat Assistant"
        >
          <ChatIcon />
        </button>
      )}
    </div>
  )
}
