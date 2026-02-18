import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { MessageSquare, Plus, Clock, ChevronRight, Activity } from 'lucide-react';

const HistorySidebar = ({ onSelectSession, currentSessionId }) => {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        fetchSessions();
    }, [currentSessionId]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/sessions');
            setSessions(res.data);
        } catch (err) {
            console.error("Failed to fetch sessions");
        }
    };

    return (
        <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-500 z-50">
            {/* New Session Button */}
            <div className="p-6">
                <button
                    onClick={() => onSelectSession(null)}
                    className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-medium py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 transition-all"
                >
                    <Plus size={18} /> New Chat
                </button>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                <div className="flex items-center justify-between px-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-blue-500" />
                        <p className="text-xs font-semibold text-gray-500">Recent Chats</p>
                    </div>
                </div>

                {sessions.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm border border-gray-200 rounded-lg">
                        No previous chats found.
                    </div>
                )}

                {sessions.map((s, idx) => (
                    <div
                        key={s.session_id}
                        onClick={() => onSelectSession(s.session_id)}
                        className={`group p-3 rounded-lg cursor-pointer transition-all border flex gap-3 items-center relative ${currentSessionId === s.session_id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-transparent border-transparent hover:bg-gray-50'
                            }`}
                        style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                        <div className={`flex-shrink-0 p-2 rounded-lg transition-all ${currentSessionId === s.session_id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-400 group-hover:text-blue-500'
                            }`}>
                            <MessageSquare size={14} />
                        </div>
                        <div className="overflow-hidden flex-1">
                            <div className={`text-sm font-medium truncate ${currentSessionId === s.session_id
                                ? 'text-gray-900'
                                : 'text-gray-600 group-hover:text-gray-900'
                                }`}>
                                {s.preview || 'New Chat'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Clock size={10} /> {new Date(s.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom info */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-500">System Ready</span>
                </div>
            </div>
        </div>
    );
};

export default HistorySidebar;
