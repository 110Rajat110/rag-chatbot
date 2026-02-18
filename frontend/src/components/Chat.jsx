import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { parseResponse, renderContent } from '../utils/responseFormatter.jsx';

const Chat = ({ sessionId, onNewChat }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (sessionId) {
            loadHistory();
        } else {
            setMessages([]);
        }
    }, [sessionId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async () => {
        try {
            const res = await api.get(`/history?session_id=${sessionId}`);
            const history = res.data.flatMap(h => [
                { role: 'user', content: h.message, id: h.id + '_u' },
                { role: 'ai', content: h.response, id: h.id + '_a', sources: h.sources }
            ]);
            setMessages(history);
        } catch (err) {
            console.error("Failed to load history", err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentSessionId = sessionId || Math.random().toString(36).substring(7);
        const userMsg = { role: 'user', content: input, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Placeholder for AI message
        const aiMsgId = Date.now() + 1;
        const aiMsg = { role: 'ai', content: '', id: aiMsgId, sources: [] };
        setMessages(prev => [...prev, aiMsg]);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${api.defaults.baseURL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: input, session_id: currentSessionId })
            });

            if (!response.ok) throw new Error('Stream failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let sources = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Check if chunk contains sources
                if (chunk.includes('__SOURCES__:')) {
                    const parts = chunk.split('__SOURCES__:');
                    // Add text before sources
                    if (parts[0]) {
                        fullText += parts[0];
                        updateAiMessage(aiMsgId, fullText);
                    }
                    // Parse sources
                    try {
                        sources = JSON.parse(parts[1]);
                    } catch (e) {
                        console.error("Failed to parse sources from stream");
                    }
                    continue;
                }

                fullText += chunk;
                updateAiMessage(aiMsgId, fullText);
            }

            // Final update with sources
            setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: fullText, sources: sources } : m
            ));

            if (!sessionId) {
                onNewChat(currentSessionId);
            }
        } catch (err) {
            updateAiMessage(aiMsgId, 'System connection interrupted. Please check your network.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateAiMessage = (id, content) => {
        setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, content } : m
        ));
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 transition-colors duration-500 overflow-hidden">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6">
                        <div className="relative">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <Bot size={28} className="text-gray-600" />
                            </div>
                        </div>
                        <div className="text-center space-y-2 max-w-sm">
                            <h3 className="text-lg font-semibold text-gray-800">Chat Assistant</h3>
                            <p className="text-sm">
                                Ask questions about your uploaded documents.
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((m, idx) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className={`flex gap-2 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user'
                                ? 'bg-blue-500 text-white ml-2'
                                : 'bg-gray-300 text-gray-600 mr-2'
                                }`}>
                                {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                            </div>
                            
                            {/* Message bubble */}
                            <div className={`px-4 py-2 rounded-2xl text-sm font-normal leading-relaxed ${m.role === 'user'
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                                }`}
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                                {m.role === 'ai' ? (
                                    <div className="space-y-2">
                                        {renderContent(parseResponse(m.content))}
                                    </div>
                                ) : (
                                    m.content
                                )}

                                {m.role === 'ai' && m.sources && m.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-gray-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-medium text-gray-600">
                                                Sources ({m.sources.length})
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const sourcesDiv = e.currentTarget.closest('.mt-3').querySelector('.sources-content');
                                                    sourcesDiv.classList.toggle('hidden');
                                                }}
                                                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                            >
                                                <span>Show</span>
                                                <svg className="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="sources-content hidden space-y-2">
                                            {m.sources.map((src, sIdx) => (
                                                <div key={sIdx} className="px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-gray-700">
                                                            {src}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Page {src.match(/p\. (\d+)/)?.[1] || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="flex gap-2 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                                <Bot size={16} className="text-gray-600" />
                            </div>
                            <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-duration:1s]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} className="h-4" />
            </div>

            {/* Input area */}
            <div className="p-4 bg-white border-t border-gray-200 transition-all duration-500">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-full focus:outline-none focus:border-blue-400 transition-all"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-2 top-2 p-2 rounded-full transition-all ${isLoading || !input.trim()
                            ? 'bg-gray-300 text-gray-500'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
