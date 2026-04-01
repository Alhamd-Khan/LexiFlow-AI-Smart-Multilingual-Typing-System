import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Custom UI feedback state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
     api.get('/typing/history').then(res => setHistory(res.data)).catch(console.error);
  }, []);

  const handleRestore = (record: any) => {
    const dataToRestore = {
      text: record.text,
      translatedText: record.translatedText,
      languageDetected: record.languageDetected
    };
    localStorage.setItem('lexiflow_restore_editor', JSON.stringify(dataToRestore));
    navigate('/editor');
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/typing/${id}`);
      setHistory(prev => prev.filter(item => item._id !== id));
      if (expandedId === id) setExpandedId(null);
      setToast({ message: 'History record deleted permanently.', type: 'success' });
    } catch (err) {
      console.error('Delete history failed', err);
      setToast({ message: 'Failed to delete record. Please try again.', type: 'error' });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 fade-in w-full max-w-5xl mx-auto p-4 md:p-8">
      {/* Header section */}
      <div className="surface-elevated rounded-3xl p-8 md:p-10 border border-[var(--outline-variant)] shadow-2xl shadow-[#4a40e0]/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4a40e0] animate-pulse"></span>
              Session Vault
            </span>
            <h2 className="text-4xl font-black text-[#2c2f31] font-['Manrope'] tracking-tight">Activity History</h2>
            <p className="text-base text-[#595c5e] max-w-xl font-medium leading-relaxed">
              Your previous typing sessions are automatically archived here. Click any record to expand details, restore content, or manage your archive.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/60 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#abadaf] uppercase tracking-widest leading-none mb-1">Total Records</p>
              <p className="text-2xl font-black text-[#4a40e0] leading-none">{history.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Unified Expandable List */}
      <div className="space-y-1">
        {history.length === 0 ? (
          <div className="surface-elevated rounded-2xl p-20 text-center border border-dashed border-[#abadaf]/30">
            <div className="w-20 h-20 bg-[#f4f7f9] rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-10 h-10 text-[#abadaf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <p className="text-[#abadaf] text-lg font-bold">No history available yet</p>
            <p className="text-[#abadaf] text-sm mt-1">Start writing in the editor to see your work saved here.</p>
          </div>
        ) : (
          history.map((record) => {
            const isExpanded = expandedId === record._id;
            // Clean HTML for the preview title
            const plainText = record.text.replace(/<[^>]*>/g, '').trim();
            const title = plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');

            return (
              <div 
                key={record._id} 
                className={`group glass-tier-3 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isExpanded 
                    ? 'mb-8 ring-1 ring-[#4a40e0]/30 shadow-2xl shadow-[#4a40e0]/10 scale-[1.01]' 
                    : 'mb-4 border-transparent hover:border-white/80'
                }`}
              >
                {/* Header / Clickable Region */}
                <div 
                  onClick={() => toggleExpand(record._id)}
                  className={`flex items-center justify-between px-6 py-5 cursor-pointer transition-colors ${
                    isExpanded ? 'bg-white/40' : 'hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isExpanded 
                        ? 'bg-gradient-to-br from-[#4a40e0] to-[#3d30d4] text-white shadow-xl shadow-[#4a40e0]/30 rotate-12' 
                        : 'bg-[#eef1f3] text-[#4a40e0] group-hover:scale-110'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className={`text-[15px] font-bold truncate transition-colors duration-300 ${
                        isExpanded ? 'text-[#4a40e0]' : 'text-[#2c2f31]'
                      }`}>
                        {title || "Empty Session Archive"}
                      </h3>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#abadaf]">
                          {new Date(record.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-[#abadaf]/50"></span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#abadaf]">
                          {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-4">
                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      isExpanded ? 'bg-[#4a40e0] text-white' : 'bg-[#eef1f3] text-[#595c5e]'
                    }`}>
                      {isExpanded ? 'Active' : 'Archived'}
                    </div>
                    <svg 
                      className={`w-6 h-6 text-[#abadaf] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        isExpanded ? 'rotate-180 text-[#4a40e0]' : 'group-hover:translate-y-1'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Content Area */}
                <div className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 invisible'
                }`}>
                  <div className="px-6 pb-8 pt-2 border-t border-white/40">
                    <div className="grid lg:grid-cols-2 gap-8 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4a40e0]">Original Content</p>
                          <span className="text-[10px] font-bold text-[#abadaf]">{record.text.replace(/<[^>]*>/g, '').length} characters</span>
                        </div>
                        <div 
                          className="surface-structural rounded-2xl p-5 text-sm leading-relaxed text-[#2c2f31] max-h-[350px] overflow-y-auto custom-scrollbar border-none shadow-inner"
                          dangerouslySetInnerHTML={{ __html: record.text }}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#abadaf]">AI Translation</p>
                          <span className="text-[10px] font-bold text-[#abadaf]">{record.languageDetected || 'Global'}</span>
                        </div>
                        <div 
                          className="surface-structural rounded-2xl p-5 text-sm leading-relaxed text-[#595c5e] max-h-[350px] overflow-y-auto custom-scrollbar border-none shadow-inner bg-white/20"
                          dangerouslySetInnerHTML={{ __html: record.translatedText || '<em class="opacity-50 italic">No translation recorded for this session</em>' }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-8 pt-8 border-t border-white/40">
                      <p className="mr-auto text-[11px] font-medium text-[#abadaf] italic hidden sm:block">
                        Session ID: {record._id}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRestore(record); }}
                        className="w-full sm:w-auto app-button-primary py-3 px-8 text-sm shadow-xl hover:shadow-[#4a40e0]/40"
                      >
                        Restore in Editor
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(record._id); }}
                        className="w-full sm:w-auto bg-white border border-[#e07a5f]/30 text-[#e07a5f] hover:bg-[#e07a5f] hover:text-white px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group/del"
                      >
                        <svg className="w-4 h-4 transition-transform group-hover/del:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Custom Modal & Toast */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete History?"
        message="This action cannot be undone. This record will be permanently removed from your history."
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        confirmText="Delete Permanently"
        isDanger={true}
      />
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
