import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Database, Users, MessageSquare, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

const AdminUpload = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const [stats, setStats] = useState({ documents_count: 0 });
    const [uploadedFiles, setUploadedFiles] = useState([]);

    useEffect(() => {
        fetchStats();
        fetchFiles();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats");
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await api.get('/admin/files');
            setUploadedFiles(res.data);
        } catch (err) {
            console.error("Failed to fetch files");
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/admin/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus({ type: 'success', message: `Kernel expansion successful: ${file.name} integrated.` });
            setFile(null);
            fetchStats();
            fetchFiles();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'System integration failed. Check backend logs.';
            setStatus({ type: 'error', message: errorMsg });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteFile = async (id) => {
        if (!window.confirm("CRITICAL: Purge this intelligence unit?")) return;
        try {
            await api.delete(`/admin/documents/${id}`);
            setStatus({ type: 'success', message: 'Intelligence unit purged.' });
            fetchStats();
            fetchFiles();
        } catch (err) {
            setStatus({ type: 'error', message: 'Purge sequence failed.' });
        }
    };

    const handleClearDB = async () => {
        if (!window.confirm("CRITICAL: Wipe intelligence entire knowledge base? This cannot be undone.")) return;
        try {
            await api.post('/admin/clear');
            setStatus({ type: 'success', message: 'Intelligence core wiped.' });
            fetchStats();
            fetchFiles();
        } catch (err) {
            const detail = err.response?.data?.detail || 'Wipe sequence interrupted. Check system logs.';
            setStatus({ type: 'error', message: detail });
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-100 min-h-full overflow-y-auto transition-colors duration-500"
             style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Database size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-semibold text-gray-900 leading-none">{stats.documents_count}</div>
                        <div className="text-xs font-medium text-gray-500 mt-1">Active Chunks</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-semibold text-gray-900 leading-none">Security</div>
                        <div className="text-xs font-medium text-gray-500 mt-1">JWT Protocol</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <RefreshCw size={20} className="animate-spin" />
                    </div>
                    <div>
                        <div className="text-2xl font-semibold text-gray-900 leading-none">Local</div>
                        <div className="text-xs font-medium text-gray-500 mt-1">Ollama Engine</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Upload size={20} className="text-blue-500" /> Upload Documents
                        </h2>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="relative group">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 transition-all hover:border-blue-400 hover:bg-gray-50">
                                <FileText size={40} className="text-gray-400 group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <p className="text-gray-700 font-medium">Drop files here or click to browse</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF and TXT files supported</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.txt"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    id="fileInput"
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('fileInput').click()}
                                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all text-gray-700"
                                >
                                    Choose Files
                                </button>
                                {file && (
                                    <div className="px-4 py-2 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-medium text-blue-700">{file.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {status && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span className="text-sm font-medium">{status.message}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!file || isUploading}
                                className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${!file || isUploading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                            >
                                {isUploading ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
                                {isUploading ? 'Uploading...' : 'Upload Document'}
                            </button>

                            <button
                                type="button"
                                onClick={handleClearDB}
                                className="px-4 py-3 rounded-lg bg-white text-red-600 border border-gray-300 font-medium hover:bg-red-50 transition-all"
                                title="Clear All Documents"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <FileText size={20} className="text-gray-500" /> Uploaded Documents
                    </h2>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {uploadedFiles.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FileText size={40} className="mx-auto mb-3" />
                                <p className="text-sm font-medium">No documents uploaded yet</p>
                            </div>
                        ) : (
                            uploadedFiles.map((f, idx) => (
                                <div key={f.id} className="group p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between transition-all hover:bg-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-400">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{f.filename}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {f.chunks} chunks • {new Date(f.upload_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFile(f.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                        title="Delete Document"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUpload;
