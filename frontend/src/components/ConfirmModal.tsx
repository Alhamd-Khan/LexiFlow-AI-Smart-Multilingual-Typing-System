import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2c2f31]/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-500'} border border-white/40 shadow-sm`}>
              {isDanger ? <AlertTriangle className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full bg-indigo-500" />}
            </div>
            <button 
              onClick={onCancel}
              className="rounded-full p-2 text-[#abadaf] hover:bg-white/50 hover:text-[#2c2f31] transition-all border border-transparent hover:border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-[#2c2f31] font-['Manrope'] mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-base text-[#595c5e] leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-white/50 px-6 py-4 text-sm font-bold text-[#595c5e] border border-white/40 hover:bg-white/80 transition-all hover:shadow-lg active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-2xl ${isDanger ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#4a40e0] text-white shadow-indigo-500/20'} px-6 py-4 text-sm font-bold shadow-xl hover:-translate-y-0.5 transition-all active:scale-95`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
