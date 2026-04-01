import { X, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmText?: string;
  isLoading?: boolean;
}

export default function InputModal({
  isOpen,
  title,
  message,
  placeholder = "Enter value...",
  defaultValue = "",
  onConfirm,
  onCancel,
  confirmText = "Save",
  isLoading = false
}: InputModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onConfirm(inputValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md glass-tier-3 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#4a40e0]/10 flex items-center justify-center text-[#4a40e0]">
              <Type className="w-6 h-6" />
            </div>
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#abadaf]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-[#2c2f31] mb-2 font-['Manrope'] tracking-tight">
            {title}
          </h3>
          <p className="text-[#595c5e] text-sm font-medium leading-relaxed mb-6">
            {message}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-5 py-4 bg-white/50 border border-[#abadaf]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0] transition-all duration-300 font-bold text-[#2c2f31] placeholder-[#abadaf]/60"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-white text-[#595c5e] font-bold rounded-2xl border border-[rgba(171,173,175,0.2)] hover:bg-[#f4f7f9] transition-all duration-300 transform active:scale-95"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex-[1.5] px-6 py-4 bg-[#4a40e0] text-white font-bold rounded-2xl shadow-xl shadow-[#4a40e0]/20 hover:bg-[#3d30d4] hover:shadow-[#4a40e0]/40 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : confirmText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
