'use client';

/**
 * 打字指示器组件 - "正在倾听..."
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 message-appear">
      {/* AI 头像 */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#2a2555] to-[#1a1640] border border-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c4a060]">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </div>
      <div className="glass-ai rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-[#9b95ad]" />
          <span className="typing-dot w-2 h-2 rounded-full bg-[#9b95ad]" />
          <span className="typing-dot w-2 h-2 rounded-full bg-[#9b95ad]" />
        </div>
      </div>
    </div>
  );
}
