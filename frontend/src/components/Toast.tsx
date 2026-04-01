import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 4000
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-[#4a40e0]" />
  };

  const bgStyles = {
    success: 'bg-green-50/80 border-green-200/50',
    error: 'bg-red-50/80 border-red-200/50',
    info: 'bg-[#f5f7f9]/80 border-indigo-200/50'
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl ${bgStyles[type]}`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="flex-1 text-sm font-bold text-[#2c2f31] tracking-tight">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-[#abadaf]" />
        </button>
      </div>
    </div>
  );
}
