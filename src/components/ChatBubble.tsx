'use client';

import type { ChatMessage } from '@/lib/emotion-engine';
import { getEmotionColor } from '@/lib/emotion-engine';

interface ChatBubbleProps {
  message: ChatMessage;
}

/**
 * 聊天气泡组件
 */
export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.role === 'ai';

  return (
    <div
      className={`flex items-end gap-2 message-appear ${isAI ? '' : 'flex-row-reverse'}`}
    >
      {/* 头像 */}
      {isAI && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#2a2555] to-[#1a1640] border border-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c4a060]">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </div>
      )}

      {/* 气泡 */}
      <div
        className={`
          rounded-2xl px-4 py-3 max-w-[80%] leading-relaxed text-[15px]
          ${isAI
            ? 'glass-ai rounded-bl-md text-[#e8e4f0]'
            : 'glass-user rounded-br-md text-[#e8e4f0]'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {/* 情绪标签 */}
        {message.emotion && message.emotion.emotion !== 'unknown' && isAI && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getEmotionColor(message.emotion.emotion) }}
            />
            <span className="text-[11px] text-[#9b95ad]">
              感知到{message.emotion.emotion}情绪
            </span>
          </div>
        )}
      </div>

      {/* 用户头像 */}
      {!isAI && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#3d2f1a] to-[#2a2015] border border-[#c4a060]/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c4a060]">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </div>
  );
}
