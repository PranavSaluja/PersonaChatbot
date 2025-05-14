// app/page.tsx
import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">My Personal Chatbot</h1>
        <ChatInterface />
      </div>
    </main>
  );
}