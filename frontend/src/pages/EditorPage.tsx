import { useState, useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api';
import Toast from '../components/Toast';
import InputModal from '../components/InputModal';

export default function EditorPage() {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [saveCooldown, setSaveCooldown] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCloudSaveModal, setShowCloudSaveModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  const detectedLanguage = useMemo(() => {
    if (!text.trim()) return 'Waiting for input';
    if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
    if (/[\u0600-\u06FF]/.test(text)) return 'Arabic / Urdu';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
    if (/[\u3040-\u30FF]/.test(text)) return 'Japanese';
    if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
    if (/\b(el|la|que|de|hola|gracias)\b/i.test(text)) return 'Spanish';
    if (/\b(le|la|bonjour|merci|avec)\b/i.test(text)) return 'French';
    if (/\b(der|die|und|ist|nicht)\b/i.test(text)) return 'German';
    return 'English';
  }, [text]);


  useEffect(() => {
    if (saveCooldown > 0) {
      const timer = setTimeout(() => setSaveCooldown(saveCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [saveCooldown]);

  const applySuggestion = (suggestion: string) => {
    if (textareaRef.current) {
      const editor = (textareaRef.current as any).getEditor();
      const selection = editor.getSelection();
      const index = selection ? selection.index : editor.getLength() - 1;
      editor.insertText(index, " " + suggestion);
      editor.setSelection(index + suggestion.length + 1, 0);
    } else {
      setText(text + " " + suggestion);
    }
    setShowSuggestions(false);
  };

  const handleTranslate = async (overrideText?: string) => {
    const textToTranslate = overrideText || selectedText || text;
    if (!textToTranslate || isTranslating) return;
    try {
      setIsTranslating(true);
      const res = await api.post('/ai/translate', { text: textToTranslate, to: targetLang });
      setTranslatedText(res.data.translatedText);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Translation failed. Please try again.', type: 'error' });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isTxt = fileName.endsWith('.txt');
    const isDoc = fileName.endsWith('.doc') || fileName.endsWith('.docx');
    const isPdf = fileName.endsWith('.pdf');

    if (!isTxt && !isDoc && !isPdf) {
      setToast({ message: 'Please upload a valid .txt, .pdf, or .docx file.', type: 'error' });
      return;
    }

    if (isTxt) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          setText(content);
          await handleTranslate(content);
        }
      };
      reader.readAsText(file);
    } else {
      // PDF or Word - use backend extraction
      setIsExtracting(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/documents/extract', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const extracted = res.data.text;
        if (extracted) {
          setText(extracted);
          await handleTranslate(extracted);
        }
      } catch (err) {
        console.error('Extraction failed', err);
        setToast({ message: 'Failed to extract text from document.', type: 'error' });
      } finally {
        setIsExtracting(false);
      }
    }
    e.target.value = '';
  };

  const handleDownload = async () => {
    try {
      const res = await api.post(
        "/documents/pdf",
        {
          title: "LexiFlow_Doc",
          text: text,
          translatedText: translatedText,
          targetLang: translatedText ? targetLang : undefined,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "LexiFlow_Doc.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("File download failed", err);
    }
  };

  const handleSummarize = async () => {
    if (!text.trim() || isSummarizing) return;
    try {
      setIsSummarizing(true);
      const res = await api.post('/ai/summarize', { text: selectedText || text });
      setTranslatedText(res.data.summary || 'No summary available.');
    } catch (err) {
      console.error('Summarization failed', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleImprove = async () => {
    if (!text.trim() || isImproving) return;
    try {
      setIsImproving(true);
      const res = await api.post('/ai/improve', { text: selectedText || text });
      setTranslatedText(res.data.improvement || 'No improvements available.');
    } catch (err) {
      console.error('Improvement failed', err);
    } finally {
      setIsImproving(false);
    }
  };

  useEffect(() => {
    // Check for restoration state from history page
    const restoreData = localStorage.getItem('lexiflow_restore_editor');
    if (restoreData) {
      try {
        const { text: rText, translatedText: rTrans, languageDetected: rLang } = JSON.parse(restoreData);
        if (rText) setText(rText);
        if (rTrans) setTranslatedText(rTrans);
        if (rLang) setTargetLang(rLang);

        // Clean up
        localStorage.removeItem('lexiflow_restore_editor');
        console.log('✅ Editor state restored from history');
      } catch (e) {
        console.error('Failed to parse restore data', e);
      }
    }
  }, []);

  const handleSaveProgress = async () => {
    if (!text.trim() || saveCooldown > 0) return;
    try {
      setSaveCooldown(5);
      await api.post('/typing', {
        text,
        translatedText: translatedText || undefined,
        languageDetected: targetLang
      });
      setToast({ message: 'Progress saved to Typing History.', type: 'success' });
    } catch (err) {
      setSaveCooldown(0);
      setToast({ message: 'Failed to save progress.', type: 'error' });
    }
  };

  const handleSaveCloud = () => {
    if (!text.trim()) {
      setToast({ message: 'Please write something before saving.', type: 'error' });
      return;
    }
    setShowCloudSaveModal(true);
  };

  const confirmSaveCloud = async (title: string) => {
    try {
      setIsSavingCloud(true);
      await api.post('/documents/upload', {
        title,
        text,
        translatedText: translatedText || undefined,
        languageDetected: targetLang,
      });
      setToast({ message: 'Document saved and PDF uploaded successfully!\nView it in My Documents.', type: 'success' });
      setShowCloudSaveModal(false);
    } catch (err) {
      console.error('Cloud save failed', err);
      setToast({ message: 'Failed to save document. Please try again.', type: 'error' });
    } finally {
      setIsSavingCloud(false);
    }
  };

  return (
    <div className="space-y-8 fade-in w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="surface-elevated rounded-2xl px-6 py-6 md:px-8 border border-[var(--outline-variant)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-block px-3 py-1 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-xs font-bold uppercase tracking-widest mb-2">AI Editor</span>
            <h2 className="text-3xl font-extrabold text-[#2c2f31] mb-2 font-['Manrope'] tracking-tight">Multilingual Editor</h2>
            <p className="text-base text-[#595c5e] max-w-2xl">
              Draft in any language, trigger AI suggestions while you type, translate selected passages, and export polished documents.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isExtracting}
              className="app-button-secondary disabled:translate-y-0 disabled:opacity-50"
            >
              {isExtracting ? 'Extracting...' : 'Upload File'}
            </button>
            <button onClick={handleSaveProgress} disabled={saveCooldown > 0} className="app-button-secondary disabled:translate-y-0 disabled:opacity-50">
              {saveCooldown > 0 ? `Saved (${saveCooldown}s)` : 'Save Progress'}
            </button>
            <button onClick={handleDownload} className="app-button-secondary">Download PDF</button>
            <button onClick={handleSaveCloud} className="app-button-primary">Save to Cloud</button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.8fr]">
        <div className="surface-elevated rounded-2xl p-6 md:p-8 border border-[var(--outline-variant)] flex flex-col">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#4a40e0]">Writing canvas</p>
              <p className="mt-1 text-sm text-[#595c5e]">Type naturally and pause after a word to surface suggestions.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1 rounded-full surface-structural border border-[var(--outline-variant)] text-xs font-semibold text-[#4a40e0]">
                {wordCount} words
              </div>
              <div className="px-3 py-1 rounded-full surface-structural border border-[var(--outline-variant)] text-xs font-semibold text-[#4a40e0]">
                {text.length} chars
              </div>
              <div className="px-3 py-1 rounded-full surface-structural border border-[var(--outline-variant)] text-xs font-semibold text-[#4a40e0]">
                {detectedLanguage}
              </div>
            </div>
          </div>

          <div className="editor-toolbar mb-6 flex flex-wrap gap-2">
            <button type="button" className="editor-tool" onClick={handleSummarize} disabled={!text || isSummarizing}>{isSummarizing ? 'Summarizing...' : 'Summarize'}</button>
            <button type="button" className="editor-tool" onClick={handleImprove} disabled={!text || isImproving}>{isImproving ? 'Improving...' : 'AI Suggest'}</button>
          </div>

          <div className="editor-canvas relative flex-1 min-h-[300px] sm:min-h-[500px]">

            <ReactQuill
              theme="snow"
              ref={textareaRef as any}
              value={text}
              onChange={(value, _, source, editor) => {
                setText(value);
                const plainText = editor.getText();

                if (plainText.length > 5 && plainText.endsWith(' \n') && source === 'user') {
                  // Removed 30s cooldown to improve responsiveness
                  try {
                    api.post('/ai/suggest', { text: plainText }).then(res => {
                      if (res.data.suggestions && res.data.suggestions.length > 0) {
                        setSuggestions(res.data.suggestions);
                        setShowSuggestions(true);
                      }
                    });
                  } catch (err) {
                    console.error(err);
                  }
                } else {
                  setShowSuggestions(false);
                }
              }}
              onChangeSelection={(selection, _, editor) => {
                if (selection && selection.length > 0) {
                  setSelectedText(editor.getText(selection.index, selection.length).trim());
                } else {
                  setSelectedText('');
                }
              }}
              className="h-full w-full text-[16px] leading-8 text-[#2c2f31] p-2"
              placeholder="Start typing your text... AI will suggest, translate, and summarize as you work."
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  ['clean']
                ]
              }}
            />

            {showSuggestions && (
              <div className="absolute left-0 top-full z-10 mt-2 w-72 overflow-hidden glass-tier-3">
                <ul className="py-2">
                  {suggestions.map((s, idx) => (
                    <li key={idx} onClick={() => applySuggestion(s)} className="cursor-pointer px-4 py-2.5 text-sm font-medium text-[#2c2f31] transition hover:bg-[rgba(255,255,255,0.4)] hover:text-[#4a40e0]">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="surface-elevated rounded-2xl p-6 md:p-8 border border-[var(--outline-variant)]">
            <div className="mb-6">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#4a40e0]">Translation</p>
              <p className="mt-1 text-sm text-[#595c5e]">Translate your full document or only the currently selected text.</p>
            </div>

            <div className="surface-structural rounded-xl p-5 mb-6">
              <label className="mb-2 block text-sm font-semibold text-[#2c2f31]">Target Language</label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="app-select w-full bg-white rounded-lg shadow-sm border border-[rgba(171,173,175,0.2)]"
              >
                <option value="Albanian">Albanian</option>
                <option value="Amharic">Amharic</option>
                <option value="Arabic">Arabic</option>
                <option value="Azerbaijani">Azerbaijani</option>
                <option value="Bengali">Bengali</option>
                <option value="Bosnian">Bosnian</option>
                <option value="Burmese">Burmese</option>
                <option value="Croatian">Croatian</option>
                <option value="Czech">Czech</option>
                <option value="Danish">Danish</option>
                <option value="Dutch">Dutch</option>
                <option value="English">English</option>
                <option value="Estonian">Estonian</option>
                <option value="Finnish">Finnish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Greek">Greek</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Hausa">Hausa</option>
                <option value="Hebrew">Hebrew</option>
                <option value="Hindi">Hindi</option>
                <option value="Hungarian">Hungarian</option>
                <option value="Icelandic">Icelandic</option>
                <option value="Igbo">Igbo</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Italian">Italian</option>
                <option value="Japanese">Japanese</option>
                <option value="Javanese">Javanese</option>
                <option value="Kannada">Kannada</option>
                <option value="Kazakh">Kazakh</option>
                <option value="Khmer">Khmer</option>
                <option value="Kinyarwanda">Kinyarwanda</option>
                <option value="Korean">Korean</option>
                <option value="Lao">Lao</option>
                <option value="Latvian">Latvian</option>
                <option value="Lithuanian">Lithuanian</option>
                <option value="Macedonian">Macedonian</option>
                <option value="Malagasy">Malagasy</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Maltese">Maltese</option>
                <option value="Mandarin Chinese">Mandarin Chinese</option>
                <option value="Marathi">Marathi</option>
                <option value="Mongolian">Mongolian</option>
                <option value="Nepali">Nepali</option>
                <option value="Norwegian">Norwegian</option>
                <option value="Odia">Odia</option>
                <option value="Pashto">Pashto</option>
                <option value="Persian (Farsi)">Persian (Farsi)</option>
                <option value="Polish">Polish</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Romanian">Romanian</option>
                <option value="Russian">Russian</option>
                <option value="Serbian">Serbian</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Slovak">Slovak</option>
                <option value="Somali">Somali</option>
                <option value="Spanish">Spanish</option>
                <option value="Sundanese">Sundanese</option>
                <option value="Swahili">Swahili</option>
                <option value="Swedish">Swedish</option>
                <option value="Tagalog (Filipino)">Tagalog (Filipino)</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Thai">Thai</option>
                <option value="Tigrinya">Tigrinya</option>
                <option value="Turkish">Turkish</option>
                <option value="Ukrainian">Ukrainian</option>
                <option value="Urdu">Urdu</option>
                <option value="Uzbek">Uzbek</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Xhosa">Xhosa</option>
                <option value="Yoruba">Yoruba</option>
                <option value="Zulu">Zulu</option>
              </select>
            </div>

            <button
              onClick={() => handleTranslate()}
              disabled={(!text && !selectedText) || isTranslating}
              className="app-button-primary w-full disabled:translate-y-0 disabled:opacity-50"
            >
              {isTranslating ? 'Translating...' : `Translate ${selectedText ? 'Selected' : 'Document'}`}
            </button>
          </div>

          <div className="surface-elevated rounded-2xl flex-1 min-h-[300px] p-6 md:p-8 border border-[var(--outline-variant)]">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-[#abadaf]">Output</p>
            {isTranslating ? (
              <div className="flex flex-col items-center justify-center h-[200px] gap-4">
                <div className="w-8 h-8 border-4 border-[#4a40e0] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-[#4a40e0] animate-pulse">Translating...</p>
              </div>
            ) : translatedText ? (
              <div
                className="whitespace-pre-wrap text-base leading-7 text-[#2c2f31] [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: translatedText }}
              />
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm leading-6 text-[#595c5e] text-center max-w-xs">
                  Write some text and click Translate, Summarize or AI Suggest to see the result here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Modals & Toasts */}
      <InputModal
        isOpen={showCloudSaveModal}
        title="Name your document"
        message="Enter a descriptive title for this document to save it to your cloud storage."
        placeholder="e.g. My Project Draft"
        defaultValue="LexiFlow Document"
        confirmText="Save to Cloud"
        onConfirm={confirmSaveCloud}
        onCancel={() => setShowCloudSaveModal(false)}
        isLoading={isSavingCloud}
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
