import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../api';


interface Contact {
  _id: string;
  username: string;
  email: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  _id?: string;
  text: string;
  fromId: string;
  toId: string;
  createdAt?: string;
  read?: boolean;
  // Translation state per message (local only)
  translatedText?: string;
  translating?: boolean;
}

const LANGUAGES = [
  { code: 'Albanian', label: 'Shqip — Albanian' },
  { code: 'Amharic', label: 'አማርኛ — Amharic' },
  { code: 'Arabic', label: 'العربية — Arabic' },
  { code: 'Azerbaijani', label: 'Azərbaycan — Azerbaijani' },
  { code: 'Bengali', label: 'বাংলা — Bengali' },
  { code: 'Bosnian', label: 'Bosanski — Bosnian' },
  { code: 'Burmese', label: 'မြန်မာ — Burmese' },
  { code: 'Croatian', label: 'Hrvatski — Croatian' },
  { code: 'Czech', label: 'Čeština — Czech' },
  { code: 'Danish', label: 'Dansk — Danish' },
  { code: 'Dutch', label: 'Nederlands — Dutch' },
  { code: 'English', label: 'English' },
  { code: 'Estonian', label: 'Eesti — Estonian' },
  { code: 'Finnish', label: 'Suomi — Finnish' },
  { code: 'French', label: 'Français — French' },
  { code: 'German', label: 'Deutsch — German' },
  { code: 'Greek', label: 'Ελληνικά — Greek' },
  { code: 'Gujarati', label: 'ગુજરાતી — Gujarati' },
  { code: 'Hausa', label: 'Hausa' },
  { code: 'Hebrew', label: 'עברית — Hebrew' },
  { code: 'Hindi', label: 'हिंदी — Hindi' },
  { code: 'Hungarian', label: 'Magyar — Hungarian' },
  { code: 'Icelandic', label: 'Íslenska — Icelandic' },
  { code: 'Igbo', label: 'Igbo' },
  { code: 'Indonesian', label: 'Bahasa Indonesia — Indonesian' },
  { code: 'Italian', label: 'Italiano — Italian' },
  { code: 'Japanese', label: '日本語 — Japanese' },
  { code: 'Javanese', label: 'Basa Jawa — Javanese' },
  { code: 'Kannada', label: 'ಕನ್ನಡ — Kannada' },
  { code: 'Kazakh', label: 'Қазақ — Kazakh' },
  { code: 'Khmer', label: 'ខ្មែរ — Khmer' },
  { code: 'Kinyarwanda', label: 'Ikinyarwanda — Kinyarwanda' },
  { code: 'Korean', label: '한국어 — Korean' },
  { code: 'Lao', label: 'ລາວ — Lao' },
  { code: 'Latvian', label: 'Latviešu — Latvian' },
  { code: 'Lithuanian', label: 'Lietuvių — Lithuanian' },
  { code: 'Macedonian', label: 'Македонски — Macedonian' },
  { code: 'Malagasy', label: 'Malagasy' },
  { code: 'Malayalam', label: 'മലയാളം — Malayalam' },
  { code: 'Maltese', label: 'Malti — Maltese' },
  { code: 'Mandarin Chinese', label: '中文 — Mandarin Chinese' },
  { code: 'Marathi', label: 'मराठी — Marathi' },
  { code: 'Mongolian', label: 'Монгол — Mongolian' },
  { code: 'Nepali', label: 'नेपाली — Nepali' },
  { code: 'Norwegian', label: 'Norsk — Norwegian' },
  { code: 'Odia', label: 'ଓଡ଼ିଆ — Odia' },
  { code: 'Pashto', label: 'پښتو — Pashto' },
  { code: 'Persian (Farsi)', label: 'فارسی — Persian (Farsi)' },
  { code: 'Polish', label: 'Polski — Polish' },
  { code: 'Portuguese', label: 'Português — Portuguese' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ — Punjabi' },
  { code: 'Romanian', label: 'Română — Romanian' },
  { code: 'Russian', label: 'Русский — Russian' },
  { code: 'Serbian', label: 'Српски — Serbian' },
  { code: 'Sinhala', label: 'සිංහල — Sinhala' },
  { code: 'Slovak', label: 'Slovenčina — Slovak' },
  { code: 'Somali', label: 'Soomaali — Somali' },
  { code: 'Spanish', label: 'Español — Spanish' },
  { code: 'Sundanese', label: 'Basa Sunda — Sundanese' },
  { code: 'Swahili', label: 'Kiswahili — Swahili' },
  { code: 'Swedish', label: 'Svenska — Swedish' },
  { code: 'Tagalog (Filipino)', label: 'Tagalog — Filipino' },
  { code: 'Tamil', label: 'தமிழ் — Tamil' },
  { code: 'Telugu', label: 'తెలుగు — Telugu' },
  { code: 'Thai', label: 'ไทย — Thai' },
  { code: 'Tigrinya', label: 'ትግርኛ — Tigrinya' },
  { code: 'Turkish', label: 'Türkçe — Turkish' },
  { code: 'Ukrainian', label: 'Українська — Ukrainian' },
  { code: 'Urdu', label: 'اردو — Urdu' },
  { code: 'Uzbek', label: 'Oʻzbek — Uzbek' },
  { code: 'Vietnamese', label: 'Tiếng Việt — Vietnamese' },
  { code: 'Xhosa', label: 'isiXhosa — Xhosa' },
  { code: 'Yoruba', label: 'Yorùbá — Yoruba' },
  { code: 'Zulu', label: 'isiZulu — Zulu' },
];

export default function ChatPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [targetLang, setTargetLang] = useState('English');
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Mobile: 'list' shows contacts, 'chat' shows active conversation
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const { user } = useAuthStore();
  const { setTotalUnread } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<Contact | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  const fetchContacts = useCallback(async () => {
    try {
      const resp = await api.get('/chat/users');
      setContacts(resp.data);
      const total = (resp.data as Contact[]).reduce((sum: number, c: Contact) => sum + c.unreadCount, 0);
      setTotalUnread(total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [setTotalUnread]);

  useEffect(() => { if (user) fetchContacts(); }, [user, fetchContacts]);

  const filteredContacts = filterQuery.trim()
    ? contacts.filter(c =>
        c.username.toLowerCase().includes(filterQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : contacts;

  const handleSelectUser = async (contact: Contact) => {
    setSelectedUser(contact);
    setMobileView('chat'); // switch panel on mobile
    setLoadingHistory(true);
    try {
      const [historyRes] = await Promise.all([
        api.get(`/chat/history/${contact._id}`),
        contact.unreadCount > 0 ? api.post(`/chat/read/${contact._id}`) : Promise.resolve()
      ]);
      setMessages(historyRes.data);
      setContacts(prev => {
        const updated = prev.map(c => c._id === contact._id ? { ...c, unreadCount: 0 } : c);
        const total = updated.reduce((sum, c) => sum + c.unreadCount, 0);
        setTotalUnread(total);
        return updated;
      });
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Translate a single message by index
  const handleTranslate = async (idx: number) => {
    const msg = messages[idx];
    if (!msg || msg.translating) return;

    // If already translated, toggle it off
    if (msg.translatedText) {
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, translatedText: undefined } : m));
      return;
    }

    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, translating: true } : m));
    try {
      const resp = await api.post('/ai/translate', { text: msg.text, to: targetLang });
      setMessages(prev => prev.map((m, i) =>
        i === idx ? { ...m, translating: false, translatedText: resp.data.translatedText } : m
      ));
    } catch (err) {
      console.error('Translation failed:', err);
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, translating: false } : m));
    }
  };

  // Socket
  useEffect(() => {
    if (!user) return;

    const handleLocalMessage = async (data: Message) => {
      const active = selectedUserRef.current;
      
      if (active && (data.fromId === active._id || data.toId === active._id)) {
        if (data.fromId !== user.id) {
          setMessages(prev => [...prev, data]);
          try {
            await api.post(`/chat/read/${data.fromId}`);
            fetchContacts();
          } catch (err) {
            console.error('Failed to mark chat as read:', err);
          }
        } else {
          fetchContacts();
        }
      } else {
        fetchContacts();
      }
    };

    socket.on('chat:message', handleLocalMessage);

    const handleLocalTyping = (data: { fromId: string; toId: string; isTyping: boolean }) => {
      const active = selectedUserRef.current;
      if (!active || data.fromId !== active._id) return;
      setIsOtherTyping(data.isTyping);
    };

    socket.on('chat:typing', handleLocalTyping);

    return () => {
      socket.off('chat:message', handleLocalMessage);
      socket.off('chat:typing', handleLocalTyping);
    };
  }, [user, fetchContacts]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!selectedUser) {
      setIsOtherTyping(false);
    }
  }, [selectedUser]);

  const handleTypingChange = (newValue: string) => {
    setMessage(newValue);

    if (!user || !selectedUser) return;

    socket.emit('chat:typing', {
      fromId: user.id,
      toId: selectedUser._id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('chat:typing', {
        fromId: user.id,
        toId: selectedUser._id,
        isTyping: false,
      });
    }, 900);
  };

  const handleSend = () => {
    if (!message.trim() || !user || !selectedUser) return;
    const msgData: Message = {
      text: message,
      fromId: user.id,
      toId: selectedUser._id,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, msgData]);
    setContacts(prev => {
      const updated = prev.map(c =>
        c._id === selectedUser._id
          ? { ...c, lastMessage: message, lastMessageAt: new Date().toISOString() }
          : c
      );
      return [
        ...updated.filter(c => c._id === selectedUser._id),
        ...updated.filter(c => c._id !== selectedUser._id)
      ];
    });
    socket.emit('chat:message', msgData);
    setMessage('');
    socket.emit('chat:typing', {
      fromId: user.id,
      toId: selectedUser._id,
      isTyping: false,
    });
  };

  const visibleMessages = messages.filter(msg =>
    selectedUser ? (msg.fromId === selectedUser._id || msg.toId === selectedUser._id) : false
  );

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  // ── Contacts Panel (shared between mobile list & desktop sidebar) ──────────
  const contactsPanel = (
    <div className="surface-structural flex flex-col h-full border-r border-[var(--outline-variant)]">
      <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-[var(--outline-variant)]">
        <span className="font-extrabold text-[#2c2f31] text-[15px] uppercase tracking-wider">Messages</span>
        {totalUnread > 0 && (
          <span className="bg-[#4a40e0] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{totalUnread}</span>
        )}
      </div>

      <div className="shrink-0 px-4 py-4 border-b border-[var(--outline-variant)]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#abadaf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full bg-[rgba(255,255,255,0.4)] backdrop-blur-sm rounded-xl border border-[var(--outline-variant)] py-2.5 pl-9 pr-3 text-sm text-[#2c2f31] outline-none transition-all focus:bg-[rgba(255,255,255,0.8)] focus:border-[#4a40e0] focus:shadow-[0_0_0_3px_rgba(74,64,224,0.1)]"
            placeholder="Search people..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-center mt-10 px-4">
            <p className="text-[#abadaf] text-sm">{filterQuery ? 'No users match your search' : 'No other users yet'}</p>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const isActive = selectedUser?._id === contact._id;
            const hasUnread = contact.unreadCount > 0;
            return (
              <div
                key={contact._id}
                onClick={() => handleSelectUser(contact)}
                className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-all border-b border-[var(--outline-variant)] last:border-0 ${
                  isActive ? 'bg-[rgba(255,255,255,0.7)] border-l-[3px] border-l-[#4a40e0]' : 'hover:bg-[rgba(255,255,255,0.6)] active:bg-[rgba(255,255,255,0.8)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                  isActive ? 'bg-[#4a40e0] text-white' : 'bg-[#eef1f3] text-[#4a40e0]'
                }`}>
                  {contact.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`truncate text-sm ${hasUnread ? 'font-black text-[#2c2f31]' : 'font-semibold text-[#595c5e]'}`}>
                      {contact.username}
                    </span>
                    <span className="text-[10px] text-[#abadaf] shrink-0">{formatTime(contact.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-[#2c2f31]' : 'text-[#9a9d9f]'}`}>
                      {contact.lastMessage ?? <span className="italic">Start a conversation</span>}
                    </p>
                    {hasUnread && (
                      <span className="shrink-0 bg-[#4a40e0] text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Chat Area (shared between mobile chat & desktop right panel) ──────────
  const chatArea = (
    <div className="flex min-w-0 flex-1 flex-col bg-transparent h-full">
      {selectedUser ? (
        <div className="flex h-full flex-col p-4 md:p-8">

          {/* Chat Header */}
          <div className="mb-4 md:mb-6 flex flex-shrink-0 items-center justify-between border-b border-[var(--outline-variant)] pb-4 md:pb-5">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(255,255,255,0.6)] border border-[var(--outline-variant)] text-[#595c5e] active:scale-95 transition-all"
                aria-label="Back to contacts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-[#4a40e0] text-base font-bold text-white shadow-md shadow-[#4a40e0]/20">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-lg font-bold text-[#2c2f31]">{selectedUser.username}</div>
                <div className="text-xs text-[#9a9d9f] font-medium truncate">{selectedUser.email}</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="mb-4 md:mb-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-1 md:px-2">
            {loadingHistory && (
              <div className="m-auto text-[#4a40e0] text-sm font-medium animate-pulse">Loading messages...</div>
            )}
            {!loadingHistory && visibleMessages.length === 0 && (
              <div className="m-auto text-[#abadaf] text-sm">No messages yet. Say hi! 👋</div>
            )}
            <div className="mt-auto space-y-4 pt-2">
              {visibleMessages.map((msg, idx) => {
                const isMe = msg.fromId === user?.id;
                const msgIdx = messages.findIndex((m, i) =>
                  m.fromId === msg.fromId && m.text === msg.text && m.createdAt === msg.createdAt && i >= 0
                );
                return (
                  <div key={idx} className={`message flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="group relative max-w-[82%] md:max-w-[75%]">
                      <div className={`text-[14px] md:text-[15px] leading-relaxed px-4 md:px-5 py-3 ${
                        isMe
                          ? 'bg-[rgba(74,64,224,0.85)] backdrop-blur-md text-white rounded-2xl rounded-tr-sm shadow-md shadow-[#4a40e0]/15'
                          : 'glass-tier-3 text-[#2c2f31] rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.text}
                        {msg.createdAt && (
                          <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-[#abadaf]'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      {/* Translate button — desktop hover, mobile tap-friendly below bubble */}
                      <button
                        onClick={() => handleTranslate(msgIdx >= 0 ? msgIdx : idx)}
                        disabled={msg.translating}
                        title={msg.translatedText ? `Hide translation` : `Translate to ${targetLang}`}
                        className={`hidden md:flex absolute ${isMe ? '-left-9' : '-right-9'} top-2 opacity-0 group-hover:opacity-100 transition-all w-6 h-6 rounded-full items-center justify-center text-xs shadow-sm bg-white border border-[var(--outline-variant)] text-[#abadaf] hover:text-[#4a40e0] hover:border-[#4a40e0] hover:shadow-md ${msg.translating ? 'animate-spin' : ''}`}
                      >
                        {msg.translating ? (
                          <svg className="w-3 h-3 text-[#4a40e0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                        )}
                      </button>

                      {/* Mobile translate: small button below the bubble */}
                      <button
                        onClick={() => handleTranslate(msgIdx >= 0 ? msgIdx : idx)}
                        disabled={msg.translating}
                        className={`md:hidden mt-1 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-all ${
                          msg.translatedText
                            ? 'bg-[#4a40e0]/10 border-[#4a40e0]/30 text-[#4a40e0]'
                            : 'bg-white border-[var(--outline-variant)] text-[#abadaf]'
                        } ${isMe ? 'self-end' : 'self-start'}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        {msg.translating ? '...' : msg.translatedText ? 'Hide' : 'Translate'}
                      </button>
                    </div>

                    {/* Translation bubble */}
                    {msg.translatedText && (
                      <div className={`max-w-[80%] mt-2 px-4 py-2.5 rounded-xl text-[13px] leading-relaxed border-l-2 ${
                        isMe
                          ? 'bg-[#eef1f3] border-l-[#4a40e0] text-[#595c5e] self-end'
                          : 'bg-[#eef1f3] border-l-[#abadaf] text-[#595c5e] self-start'
                      }`}>
                        <span className="font-bold mr-1.5 opacity-80">{targetLang}:</span>
                        {msg.translatedText}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input + Language Selector */}
          <div className="shrink-0 space-y-2 md:space-y-3 pt-2">
            <div className="relative">
              <input
                type="text"
                className="w-full rounded-2xl border border-[var(--outline-variant)] bg-[rgba(255,255,255,0.4)] backdrop-blur-md px-4 md:px-6 py-3.5 md:py-4 pr-14 text-[14px] md:text-[15px] text-[#2c2f31] placeholder-[#595c5e] transition-all focus:border-[#4a40e0] focus:bg-[rgba(255,255,255,0.85)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]"
                placeholder={`Message ${selectedUser.username}...`}
                value={message}
                onChange={e => handleTypingChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="absolute bottom-2 right-2 top-2 aspect-square rounded-xl bg-gradient-to-br from-[#4a40e0] to-[#3d30d4] flex items-center justify-center text-white transition-all active:scale-95 hover:shadow-md disabled:bg-none disabled:bg-[#d0d5d8] disabled:text-white/50"
              >
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Language Selector row */}
            <div className="flex items-center gap-2 pl-1 flex-wrap">
              <svg className="w-4 h-4 text-[#9a9d9f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-[11px] font-bold text-[#abadaf] uppercase tracking-wider">To:</span>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="rounded-full border border-[rgba(171,173,175,0.2)] bg-transparent px-3 py-1 text-xs font-semibold text-[#595c5e] focus:border-[#4a40e0] focus:outline-none"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              
              {isOtherTyping && (
                <div className="ml-auto flex items-center gap-2 text-xs text-[#4a40e0] font-semibold bg-[#4a40e0]/5 px-3 py-1 rounded-full">
                  <span className="hidden sm:inline">{selectedUser.username} is typing</span>
                  <span className="sm:hidden">typing</span>
                  <span className="typing inline-flex items-center mb-1">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center p-8 text-center bg-transparent m-4 md:m-6 rounded-2xl border border-[var(--outline-variant)] overflow-hidden">
          <img 
            src="/empty-chat-bg.gif" 
            alt="Select conversation background" 
            className="absolute pointer-events-none z-0 object-contain w-[120%] h-[120%] opacity-50 mix-blend-multiply transition-opacity duration-700 ease-in-out" 
          />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full glass-tier-3 shadow-sm border border-[var(--outline-variant)] backdrop-blur-xl">
              <svg className="w-10 h-10 text-[#abadaf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-[#2c2f31] font-['Manrope']">Select a conversation</h2>
            <p className="text-[15px] text-[#595c5e] max-w-sm">Click on any user from the left panel to start chatting and sending translated messages instantly.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP layout (md and up) — UNCHANGED side-by-side ── */}
      <div className="hidden md:flex surface-elevated rounded-2xl h-[82vh] overflow-hidden border border-[var(--outline-variant)] w-full max-w-7xl mx-auto mt-8 fade-in">
        {/* Sidebar */}
        <div className="surface-structural flex w-[320px] shrink-0 flex-col border-r border-[var(--outline-variant)]">
          {contactsPanel}
        </div>
        {/* Chat area */}
        {chatArea}
      </div>

      {/* ── MOBILE layout (< md) — single panel, switches between list/chat ── */}
      <div className="md:hidden flex flex-col w-full fade-in" style={{ height: 'calc(100dvh - 120px)' }}>
        {mobileView === 'list' ? (
          <div className="surface-elevated rounded-2xl overflow-hidden border border-[var(--outline-variant)] mx-2 mt-2 flex-1 flex flex-col">
            {contactsPanel}
          </div>
        ) : (
          <div className="surface-elevated rounded-2xl overflow-hidden border border-[var(--outline-variant)] mx-2 mt-2 flex-1 flex flex-col">
            {chatArea}
          </div>
        )}
      </div>
    </>
  );
}
