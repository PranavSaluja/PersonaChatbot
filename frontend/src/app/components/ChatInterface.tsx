// app/components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const ChatInterface = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hi there! I'm Pranav's personal chatbot. Ask me anything about him!", isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    // Add user message to chat
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to backend API
      const response = await fetch('https://personachatbot.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add bot response to chat
      setMessages((prev) => [...prev, { text: data.response, isUser: false }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Sorry, I had trouble responding. Please try again.', isUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto rounded-lg overflow-hidden border border-gray-300 shadow-lg">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <h1 className="text-xl font-bold">Personal Chat</h1>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message.text} isUser={message.isUser} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300 bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 py-2 px-4 rounded-full border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 "
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
