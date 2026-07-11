'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatBubble } from '@/components/ChatBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { CrisisCard } from '@/components/CrisisCard';
import { EmotionSummaryCard } from '@/components/EmotionSummaryCard';
import {
  getAIResponse,
  generateMessageId,
  createNewSession,
  saveSession,
  loadSession,
  saveSessionToHistory,
  generateEmotionSummary,
  type ChatMessage,
  type ConversationSession,
  type EmotionType,
} from '@/lib/emotion-engine';

// 欢迎语
const WELCOME_MESSAGE = '你好，我在这里。今天过得怎么样？';

export default function Home() {
  const [session, setSession] = useState<ConversationSession>(() => {
    return loadSession() || createNewSession();
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    primaryEmotion: EmotionType;
    intensity: number;
    summary: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 初始化欢迎消息
  useEffect(() => {
    if (session.messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'ai',
        content: WELCOME_MESSAGE,
        timestamp: Date.now(),
      };
      const newSession = { ...session, messages: [welcomeMsg] };
      setSession(newSession);
      saveSession(newSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages, isTyping]);

  // 保存session
  useEffect(() => {
    saveSession(session);
  }, [session]);

  // 发送消息
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    // 用户消息
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newRound = session.roundCount + 1;
    const updatedMessages = [...session.messages, userMsg];

    setSession(prev => ({
      ...prev,
      messages: updatedMessages,
      roundCount: newRound,
    }));
    setInputValue('');

    // 显示打字指示器
    setIsTyping(true);

    // 模拟3秒延迟后生成AI回复
    setTimeout(() => {
      // 获取最后一个AI消息的情绪作为previousEmotion
      const lastAIEmotion = [...updatedMessages]
        .reverse()
        .find(m => m.role === 'ai' && m.emotion)?.emotion?.emotion;

      const aiResult = getAIResponse(text, newRound, lastAIEmotion);

      let aiMsg: ChatMessage;

      if (aiResult.isCrisis) {
        // 危机模式
        aiMsg = {
          id: generateMessageId(),
          role: 'ai',
          content: 'crisis',
          timestamp: Date.now(),
          isCrisis: true,
        };
      } else {
        aiMsg = {
          id: generateMessageId(),
          role: 'ai',
          content: aiResult.response,
          timestamp: Date.now(),
          emotion: aiResult.emotion,
        };

        // 记录情绪
        if (aiResult.emotion.emotion !== 'unknown') {
          const intensity = aiResult.emotion.confidence === 'high' ? 8
            : aiResult.emotion.confidence === 'medium' ? 6
            : 4;

          setSession(prev => ({
            ...prev,
            emotionRecords: [...prev.emotionRecords, {
              emotion: aiResult.emotion.emotion,
              intensity,
              timestamp: Date.now(),
            }],
          }));
        }
      }

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
      }));
      setIsTyping(false);
    }, 2000 + Math.random() * 1000);
  }, [inputValue, isTyping, session]);

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 结束对话
  const handleEndConversation = () => {
    const summary = generateEmotionSummary(session.emotionRecords);
    setSummaryData(summary);
    setShowSummary(true);

    // 保存到历史记录
    const endedSession = {
      ...session,
      endTime: Date.now(),
    };
    saveSessionToHistory(endedSession);
  };

  // 开始新对话
  const handleNewConversation = () => {
    const newSession = createNewSession();
    const welcomeMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'ai',
      content: WELCOME_MESSAGE,
      timestamp: Date.now(),
    };
    newSession.messages = [welcomeMsg];
    setSession(newSession);
    saveSession(newSession);
    setShowSummary(false);
    setSummaryData(null);
  };

  // textarea 自适应高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="relative flex flex-col h-screen max-h-screen overflow-hidden">
      {/* 星空背景 */}
      <div className="starry-bg" />

      {/* 主容器 */}
      <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full">
        {/* 顶部导航 */}
        <header className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2a2555] to-[#1a1640] border border-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c4a060]">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-medium text-[#e8e4f0] tracking-wide">
                安定区
              </h1>
              <p className="text-[11px] text-[#9b95ad]">你的情绪安全空间</p>
            </div>
          </div>

          {/* 结束对话按钮 */}
          {session.roundCount > 0 && (
            <button
              onClick={handleEndConversation}
              className="px-3 py-1.5 rounded-lg text-xs text-[#9b95ad] hover:text-[#e8e4f0] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] btn-hover transition-all"
            >
              结束对话
            </button>
          )}
        </header>

        {/* 对话区域 */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-4"
        >
          {session.messages.map((message) => (
            message.isCrisis ? (
              <div key={message.id} className="flex justify-start">
                <CrisisCard />
              </div>
            ) : (
              <ChatBubble key={message.id} message={message} />
            )
          ))}

          {/* 打字指示器 */}
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}

          {/* 轮次提示 */}
          {session.roundCount > 0 && session.roundCount % 20 === 0 && !isTyping && (
            <div className="text-center">
              <span className="text-xs text-[#9b95ad]/60">
                已对话 {session.roundCount} 轮
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入区域 */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="glass-input rounded-2xl flex items-end gap-2 px-4 py-3 transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="说说你的感受..."
              rows={1}
              className="flex-1 bg-transparent text-[15px] text-[#e8e4f0] placeholder-[#9b95ad]/50 resize-none outline-none leading-relaxed max-h-[120px]"
              disabled={isTyping}
            />
            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`
                shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
                ${inputValue.trim() && !isTyping
                  ? 'bg-[#c4a060]/20 text-[#c4a060] hover:bg-[#c4a060]/30 btn-hover cursor-pointer'
                  : 'bg-white/[0.03] text-[#9b95ad]/30 cursor-not-allowed'
                }
              `}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-[#9b95ad]/30 mt-2">
            安定区 · AI情绪陪伴 · 你的感受值得被倾听
          </p>
        </div>
      </div>

      {/* 情绪摘要卡片 */}
      {showSummary && summaryData && (
        <EmotionSummaryCard
          primaryEmotion={summaryData.primaryEmotion}
          intensity={summaryData.intensity}
          summary={summaryData.summary}
          onClose={handleNewConversation}
        />
      )}
    </div>
  );
}
