import { useState, useEffect } from 'react';
import api from '../api';
import { FileText, User, Share2, Inbox, Eye, X, Download } from 'lucide-react';

interface SharedDoc {
  _id: string;
  senderId: {
    _id: string;
    username: string;
  };
  documentId: {
    _id: string;
    title: string;
    text: string;
    translatedText?: string;
    languageDetected?: string;
    pdfUrl?: string;
  };
  createdAt: string;
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

export default function SharedInboxPage() {
  const [inbox, setInbox] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  useEffect(() => {
    api.get('/share/inbox')
      .then(res => {
        setInbox(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8 fade-in w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* Page header */}
      <div className="surface-elevated rounded-2xl flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border border-[var(--outline-variant)]">
        <div>
          <span className="inline-block px-3 py-1 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-xs font-bold uppercase tracking-widest mb-2">SHARED WORKSPACE</span>
          <h1 className="text-3xl font-extrabold text-[#2c2f31] mb-2 font-['Manrope'] tracking-tight">Shared With Me</h1>
          <p className="text-base text-[#595c5e]">
            {inbox.length} document{inbox.length !== 1 ? 's' : ''} shared by your team
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-[#4a40e0] text-sm font-medium animate-pulse">
          Syncing shared documents…
        </div>
      )}

      {!loading && inbox.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-[#abadaf]">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border border-[rgba(171,173,175,0.15)]">
            <Inbox className="w-10 h-10 text-[#abadaf]" />
          </div>
          <p className="mb-1 text-xl font-extrabold text-[#2c2f31] font-['Manrope']">No shared files yet</p>
          <p className="text-[15px] text-[#595c5e] text-center max-w-sm">When collaborators share their work with you, it will appear here instantly.</p>
        </div>
      )}

      {!loading && inbox.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {inbox.map(item => (
            <div key={item._id} className="surface-elevated rounded-2xl group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(74,64,224,0.08)] border border-[var(--outline-variant)]">
              {/* Card top */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.4)] text-[#4a40e0] group-hover:bg-[#4a40e0] group-hover:text-white transition-colors duration-300 shadow-sm border border-[var(--outline-variant)]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="font-extrabold text-[#2c2f31] text-[15px] truncate">
                      {item.documentId?.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-[#9a9d9f] mt-1 font-medium">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                {/* Preview */}
                <p className="text-[13px] text-[#595c5e] leading-relaxed line-clamp-3 mb-4 flex-1">
                  {item.documentId?.text ? item.documentId.text.replace(/<[^>]*>?/gm, '') : 'No preview available'}
                </p>

                {/* Tags & Sender */}
                <div className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {item.documentId?.languageDetected && (
                      <span className="text-[10px] bg-[#f5f7f9] text-[#4a40e0] font-bold px-2.5 py-1 rounded-full border border-[rgba(74,64,224,0.1)]">
                        {item.documentId.languageDetected}
                      </span>
                    )}
                    {item.documentId?.translatedText && (
                      <span className="text-[10px] bg-[#fdf8f6] text-[#e07a5f] font-bold px-2.5 py-1 rounded-full border border-[#e07a5f]/20">
                        Translated
                      </span>
                    )}
                    {item.documentId?.pdfUrl && (
                      <span className="text-[10px] bg-[#f0fdf4] text-[#16a34a] font-bold px-2.5 py-1 rounded-full border border-[#16a34a]/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#16a34a] rounded-full"></span>
                        PDF Included
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--outline-variant)]">
                    <div className="w-6 h-6 rounded-full bg-white border border-[var(--outline-variant)] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#abadaf]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#595c5e]">
                      Shared by <span className="text-[#4a40e0]">@{item.senderId?.username || 'user'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card actions */}
              <div className="flex items-center gap-2 border-t border-[var(--outline-variant)] bg-[#f5f7f9]/50 px-6 py-4">
                <button
                  onClick={() => setViewingDoc(item.documentId)}
                  className="app-button-secondary bg-white shadow-sm flex-1 gap-1.5 rounded-xl py-2 text-xs hover:border-[#4a40e0] hover:text-[#4a40e0]"
                >
                  <Eye className="w-4 h-4" />
                  View Document
                </button>
                
                <button
                  className="rounded-xl border border-[var(--outline-variant)] bg-white p-2.5 text-[#abadaf] shadow-sm cursor-not-allowed"
                  title="ReadOnly Access"
                  disabled
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PDF Viewer Modal (Mirrored from Documents) ── */}
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
                  <span className="text-xs text-[#9a9d9f] font-medium italic">Shared Resource</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getDownloadPdfUrl(viewingDoc._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[var(--outline-variant)] text-[#2c2f31] text-sm font-bold rounded-xl hover:border-[#4a40e0] hover:text-[#4a40e0] transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2.5 bg-white border border-[var(--outline-variant)] rounded-xl text-[#abadaf] hover:text-[#2c2f31] hover:border-[#2c2f31] transition-colors shadow-sm"
                >
                  <X className="w-5 h-5" />
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
    </div>
  );
}


