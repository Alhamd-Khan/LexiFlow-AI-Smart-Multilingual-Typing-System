import { useEffect, useState } from 'react';
import api from '../api';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

interface Doc {
  _id: string;
  title: string;
  text: string;
  translatedText?: string;
  languageDetected?: string;
  pdfUrl?: string;
  cloudinaryId?: string;
  createdAt: string;
}

// Detect the old placeholder URL saved before real Cloudinary was wired up
function isValidPdfUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('mock') || url.includes('mock-upload-url')) return false;
  return true;
}

function getBackendOrigin() {
  const base = api.defaults.baseURL || `http://${window.location.hostname}:5000/api`;
  return base.replace(/\/api\/?$/, '');
}

function getViewPdfUrl(docId: string) {
  return `${getBackendOrigin()}/api/documents/view/${docId}`;
}

function getDownloadPdfUrl(docId: string) {
  return `${getBackendOrigin()}/api/documents/download/${docId}`;
}


export default function MyDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Custom UI feedback state
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<Doc | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sharing state
  const [sharingDoc, setSharingDoc] = useState<Doc | null>(null);
  const [shareUsername, setShareUsername] = useState('');
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  const fetchDocs = () => {
    setLoading(true);
    api.get('/documents')
      .then(res => setDocs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDelete = async (doc: Doc) => {
    setDeletingId(doc._id);
    try {
      await api.delete(`/documents/${doc._id}`);
      setDocs(prev => prev.filter(d => d._id !== doc._id));
      setToast({ message: `"${doc.title}" deleted successfully.`, type: 'success' });
    } catch (err) {
      console.error('Delete failed', err);
      setToast({ message: 'Failed to delete document. Please try again.', type: 'error' });
    } finally {
      setDeletingId(null);
      setDeleteConfirmDoc(null);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingDoc || !shareUsername.trim()) return;

    setIsSharingLoading(true);
    try {
      await api.post('/share', {
        documentId: sharingDoc._id,
        username: shareUsername.trim()
      });
      setToast({ message: `Document shared with @${shareUsername} successfully!`, type: 'success' });
      setSharingDoc(null);
      setShareUsername('');
    } catch (err: any) {
      console.error('Share failed', err);
      setToast({ message: err.response?.data?.error || 'Failed to share document.', type: 'error' });
    } finally {
      setIsSharingLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8 fade-in w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* Page header */}
      <div className="surface-elevated rounded-2xl flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border border-[var(--outline-variant)]">
        <div>
          <span className="inline-block px-3 py-1 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-xs font-bold uppercase tracking-widest mb-2">Cloud library</span>
          <h1 className="text-3xl font-extrabold text-[#2c2f31] mb-2 font-['Manrope'] tracking-tight">My Documents</h1>
          <p className="text-base text-[#595c5e]">
            {docs.length} document{docs.length !== 1 ? 's' : ''} stored in Cloudinary
          </p>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-[#4a40e0] text-sm font-medium animate-pulse">
          Loading your documents…
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-[#abadaf]">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border border-[rgba(171,173,175,0.15)]">
            <svg className="w-10 h-10 text-[#abadaf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mb-1 text-xl font-extrabold text-[#2c2f31] font-['Manrope']">No documents yet</p>
          <p className="text-[15px] text-[#595c5e] text-center max-w-sm">Go to the Editor, write something, and save it as a document.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && docs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map(doc => (
            <div key={doc._id} className="surface-elevated rounded-2xl group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(74,64,224,0.08)] border border-[var(--outline-variant)]">
              {/* Card top */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.4)] text-[#4a40e0] group-hover:bg-[#4a40e0] group-hover:text-white transition-colors duration-300 shadow-sm border border-[var(--outline-variant)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="font-extrabold text-[#2c2f31] text-[15px] truncate">{doc.title || 'Untitled'}</h3>
                    <p className="text-xs text-[#9a9d9f] mt-1 font-medium">{formatDate(doc.createdAt)}</p>
                  </div>
                </div>

                {/* Preview */}
                <p className="text-[13px] text-[#595c5e] leading-relaxed line-clamp-3 mb-4 flex-1">
                  {doc.text ? doc.text.replace(/<[^>]*>?/gm, '') : ''}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {doc.languageDetected && (
                    <span className="text-[10px] bg-[#f5f7f9] text-[#4a40e0] font-bold px-2.5 py-1 rounded-full border border-[rgba(74,64,224,0.1)]">
                      {doc.languageDetected}
                    </span>
                  )}
                  {doc.translatedText && (
                    <span className="text-[10px] bg-[#fdf8f6] text-[#e07a5f] font-bold px-2.5 py-1 rounded-full border border-[#e07a5f]/20">
                      Translated
                    </span>
                  )}
                  {doc.pdfUrl && (
                    <span className="text-[10px] bg-[#f0fdf4] text-[#16a34a] font-bold px-2.5 py-1 rounded-full border border-[#16a34a]/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#16a34a] rounded-full"></span>
                      PDF Included
                    </span>
                  )}
                </div>
              </div>

              {/* Card actions */}
              <div className="flex items-center gap-2 border-t border-[var(--outline-variant)] bg-[#f5f7f9]/50 px-6 py-4">
                {isValidPdfUrl(doc.pdfUrl) ? (
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="app-button-secondary bg-white shadow-sm flex-1 gap-1.5 rounded-xl py-2 text-xs hover:border-[#4a40e0] hover:text-[#4a40e0]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Document
                  </button>
                ) : (
                  <span className="flex-1 text-center text-[10px] text-[#e07a5f] bg-[#fdf8f6] border border-[#e07a5f]/30 font-bold py-2 px-2 rounded-xl uppercase tracking-wider">
                    ⚠️ Legacy Doc
                  </span>
                )}
                
                <button
                  onClick={() => setSharingDoc(doc)}
                  className="rounded-xl border border-[var(--outline-variant)] bg-white p-2.5 text-[#595c5e] shadow-sm transition-all hover:border-[#4a40e0] hover:text-[#4a40e0]"
                  title="Share document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>

                <button
                  onClick={() => setDeleteConfirmDoc(doc)}
                  disabled={deletingId === doc._id}
                  className="rounded-xl p-2.5 bg-white border border-[var(--outline-variant)] text-[#abadaf] shadow-sm transition-all hover:bg-[#fff0eb] hover:border-[#e07a5f] hover:text-[#e07a5f] disabled:opacity-50"
                  title="Delete document"
                >
                  {deletingId === doc._id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Share Document Modal ── */}
      {sharingDoc && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2f31]/40 backdrop-blur-md p-4"
          onClick={e => { if (e.target === e.currentTarget) setSharingDoc(null); }}
        >
          <div className="surface-elevated w-full max-w-md overflow-hidden rounded-3xl animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--outline-variant)] px-6 py-5 bg-[rgba(255,255,255,0.4)] backdrop-blur-md">
              <h3 className="font-extrabold text-[#2c2f31] font-['Manrope']">Share Document</h3>
              <button onClick={() => setSharingDoc(null)} className="text-[#abadaf] hover:text-[#2c2f31] transition-colors bg-white/50 p-1.5 rounded-full border border-[var(--outline-variant)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleShare} className="p-6">
              <p className="text-[15px] text-[#595c5e] mb-6">
                Share <span className="font-bold text-[#2c2f31]">"{sharingDoc.title}"</span> with another LexiFlow user.
              </p>
              <div className="mb-6">
                <label className="block text-[11px] font-extrabold text-[#9a9d9f] uppercase tracking-wider mb-2">Recipient Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#abadaf] font-bold">@</span>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={shareUsername}
                    onChange={e => setShareUsername(e.target.value)}
                    placeholder="username"
                    className="w-full rounded-xl border border-[var(--outline-variant)] bg-[rgba(255,255,255,0.4)] backdrop-blur-sm px-6 py-3.5 pl-9 text-[15px] text-[#2c2f31] placeholder-[#595c5e] transition-all focus:border-[#4a40e0] focus:bg-[rgba(255,255,255,0.85)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSharingDoc(null)}
                  className="app-button-secondary flex-1 rounded-xl py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharingLoading || !shareUsername.trim()}
                  className="app-button-primary flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold disabled:opacity-50"
                >
                  {isSharingLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )}
                  Share Doc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PDF Viewer Modal ── */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2f31]/60 backdrop-blur-md p-4 md:p-8"
          onClick={e => { if (e.target === e.currentTarget) setViewingDoc(null); }}
        >
          <div className="surface-elevated flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--outline-variant)] px-6 py-5 bg-[rgba(255,255,255,0.4)] backdrop-blur-md">
              <div>
                <h2 className="font-extrabold text-[#2c2f31] text-lg font-['Manrope']">{viewingDoc.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#9a9d9f] font-medium">Hosted on Cloudinary</span>
                  <span className="w-1 h-1 bg-[#abadaf] rounded-full"></span>
                  <span className="text-xs text-[#9a9d9f] font-medium">{formatDate(viewingDoc.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getDownloadPdfUrl(viewingDoc._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[var(--outline-variant)] text-[#2c2f31] text-sm font-bold rounded-xl hover:border-[#4a40e0] hover:text-[#4a40e0] transition-colors shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2.5 bg-white border border-[var(--outline-variant)] rounded-xl text-[#abadaf] hover:text-[#2c2f31] hover:border-[#2c2f31] transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* PDF iframe */}
            <iframe
              src={getViewPdfUrl(viewingDoc._id)}
              title={viewingDoc.title}
              className="flex-1 w-full bg-[#f5f7f9]"
            />
          </div>
        </div>
      )}

      {/* Custom Modal & Toast */}
      <ConfirmModal
        isOpen={!!deleteConfirmDoc}
        title="Delete Document?"
        message={`Are you sure you want to delete "${deleteConfirmDoc?.title}"? This action cannot be undone and will permanently remove the file from LexiFlow cloud.`}
        onConfirm={() => deleteConfirmDoc && handleDelete(deleteConfirmDoc)}
        onCancel={() => setDeleteConfirmDoc(null)}
        confirmText="Confirm Delete"
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
