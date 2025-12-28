import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Bot } from 'lucide-react';

const ChatWindow = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI EAMCET Tutor. Ask me anything about Maths, Physics, or Chemistry!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Prepare history for context
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, message: input })
            });
            const data = await response.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50 animate-fadeIn h-[500px]">
            {/* Header */}
            <div className="bg-pastel-primary p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-white/20 rounded-full">
                        <Bot size={20} />
                    </div>
                    <span className="font-semibold">AI Tutor</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full text-white transition">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-pastel-primary text-white rounded-tr-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a doubt..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pastel-primary focus:ring-1 focus:ring-pastel-primary text-sm"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="p-2 bg-pastel-primary text-white rounded-xl hover:bg-violet-600 disabled:opacity-50 transition"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
