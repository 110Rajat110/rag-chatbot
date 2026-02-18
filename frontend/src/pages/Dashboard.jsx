import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HistorySidebar from '../components/HistorySidebar';
import Chat from '../components/Chat';
import AdminUpload from '../components/AdminUpload';
import { LogOut, MessageSquare, Shield, Menu, X } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('chat');
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 transition-colors duration-500">
            {/* Sidebar */}
            <div className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:block ${isSidebarOpen ? 'block' : 'hidden'}`}>
                <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm lg:hidden" onClick={toggleSidebar}></div>
                <HistorySidebar
                    onSelectSession={(id) => {
                        setCurrentSessionId(id);
                        setActiveTab('chat');
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    currentSessionId={currentSessionId}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-30 transition-all duration-500">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                {activeTab === 'chat' ? <MessageSquare size={16} /> : <Shield size={16} />}
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {activeTab === 'chat' ? 'Chat Assistant' : 'Admin Panel'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user.role === 'admin' && (
                            <nav className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'upload'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Upload
                                </button>
                            </nav>
                        )}

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <LogOut size={16} />
                            <span className="hidden md:inline text-sm">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Workspace area */}
                <main className="flex-1 overflow-hidden bg-gray-100 relative">
                    {activeTab === 'chat' ? (
                        <Chat
                            sessionId={currentSessionId}
                            onNewChat={(id) => setCurrentSessionId(id)}
                        />
                    ) : (
                        <AdminUpload />
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
