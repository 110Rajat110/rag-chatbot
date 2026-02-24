import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Send, User as UserIcon, Bot, Sparkles, RefreshCw, Zap } from 'lucide-react';

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
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-8">
                        <div className="text-center space-y-6 max-w-md">
                            <h3 className="text-xl font-bold text-gray-800">
                                AI Research Assistant
                            </h3>
                            <p className="text-sm text-gray-600">
                                Ask questions about your uploaded documents and get intelligent, source-backed answers instantly
                            </p>
                            <div className="flex items-center justify-center gap-4 pt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Ready to help</span>
                                </div>
                            </div>
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
                            <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm shadow-lg'
                                : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-bl-sm shadow-md border border-gray-200'
                                }`}
                                style={{ 
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                    fontWeight: '400',
                                    lineHeight: '1.6'
                                }}>
                                <div className="space-y-2">
                                    {m.content.split('\n').map((paragraph, pIdx) => (
                                        <div key={pIdx} className={pIdx === 0 ? '' : 'mt-2'}>
                                            {paragraph.split(/(\*\*|##|###|__|``)/).map((segment, sIdx) => (
                                                <span key={sIdx}>
                                                    {sIdx > 0 && ' '}
                                                    {segment.match(/^(\*\*|##|###|__|``)$/) ? (
                                                        <span className="font-bold text-gray-900">{segment}</span>
                                                    ) : (
                                                        <span>{segment}</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {m.role === 'ai' && m.sources && m.sources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    📚 Sources ({m.sources.length})
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const sourcesDiv = e.currentTarget.closest('.mt-4').querySelector('.sources-content');
                                                    if (sourcesDiv) {
                                                        sourcesDiv.classList.toggle('hidden');
                                                    }
                                                }}
                                                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all"
                                            >
                                                <span>🔍 Show</span>
                                                <svg className="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="sources-content hidden space-y-3">
                                            {m.sources.map((src, sIdx) => (
                                                <div key={sIdx} className="group px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                                                📄
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-semibold text-gray-800">
                                                                    {src}
                                                                </span>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Page {src.match(/p\. (\d+)/)?.[1] || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-4zm4 0H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-4z" />
                                                            </svg>
                                                        </div>
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
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                                <Bot size={16} className="text-gray-600" />
                            </div>
                            <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-2 items-center">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                                <div className="text-sm text-gray-600 ml-2">
                                    <span className="font-medium">AI is thinking...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} className="h-4" />
            </div>

            {/* Input area */}
            <div className="p-6 bg-gradient-to-r from-white to-gray-50 border-t border-gray-200 transition-all duration-500">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                    <div className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            placeholder="Ask anything"
                            className="w-full px-6 py-4 pr-14 bg-white text-gray-800 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-base shadow-sm hover:shadow-md"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`absolute right-2 top-2 p-3 rounded-xl transition-all transform hover:scale-105 ${isLoading || !input.trim()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700'
                                }`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 2 2 9 18z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat;
