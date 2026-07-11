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
  getDefaultPresetOptions,
  getEmotionPresetOptions,
  getGreeting,
  getLastEmotion,
  updateMemoryFromSession,
  type ChatMessage,
  type ConversationSession,
  type EmotionType,
} from '@/lib/emotion-engine';

export default function Home() {
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [presetOptions, setPresetOptions] = useState<string[]>(getDefaultPresetOptions());
  const [lastDetectedEmotion, setLastDetectedEmotion] = useState<EmotionType>('unknown');
  const [summaryData, setSummaryData] = useState<{
    primaryEmotion: EmotionType;
    intensity: number;
    summary: string;
    encouragement: string;
    roundCount: number;
    timeline: Array<{ emotion: EmotionType; timestamp: number }>;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 品牌展示动画
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // 初始化：加载或创建会话，设置打招呼语（仅在客户端执行）
  useEffect(() => {
    if (showSplash || isInitialized) return;

    const existingSession = loadSession();
    if (existingSession && existingSession.messages.length > 0) {
      setSession(existingSession);
      // 恢复上次检测到的情绪（用于显示预设选项）
      const lastAIWithEmotion = [...existingSession.messages]
        .reverse()
        .find(m => m.role === 'ai' && m.emotion && m.emotion.emotion !== 'unknown');
      if (lastAIWithEmotion?.emotion) {
        setLastDetectedEmotion(lastAIWithEmotion.emotion.emotion);
        const opts = getEmotionPresetOptions(lastAIWithEmotion.emotion.emotion);
        if (opts) setPresetOptions(opts);
      }
    } else {
      // 新会话：根据记忆生成打招呼语
      const lastEmotion = getLastEmotion();
      const greeting = getGreeting(lastEmotion);
      const newSession = createNewSession();
      const welcomeMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'ai',
        content: greeting,
        timestamp: Date.now(),
        isTypewriter: true,
      };
      newSession.messages = [welcomeMsg];
      setSession(newSession);
      saveSession(newSession);
    }
    setIsInitialized(true);
  }, [showSplash, isInitialized]);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages, isTyping]);

  // 保存session
  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  // 发送消息
  const handleSend = useCallback((text?: string) => {
    const messageText = (text || inputValue).trim();
    if (!messageText || isTyping || !session) return;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    const newRound = session.roundCount + 1;
    const updatedMessages = [...session.messages, userMsg];

    setSession(prev => prev ? {
      ...prev,
      messages: updatedMessages,
      roundCount: newRound,
    } : null);
    setInputValue('');
    // 重置textarea高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    setIsTyping(true);

    setTimeout(() => {
      const aiResult = getAIResponse(messageText, newRound);

      let aiMsg: ChatMessage;

      if (aiResult.isCrisis) {
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

        // 更新情绪状态和预设选项
        if (aiResult.emotion.emotion !== 'unknown') {
          setLastDetectedEmotion(aiResult.emotion.emotion);
          const opts = getEmotionPresetOptions(aiResult.emotion.emotion);
          if (opts) setPresetOptions(opts);

          const intensity = aiResult.emotion.confidence === 'high' ? 8
            : aiResult.emotion.confidence === 'medium' ? 6
            : 4;

          setSession(prev => prev ? {
            ...prev,
            emotionRecords: [...prev.emotionRecords, {
              emotion: aiResult.emotion.emotion,
              intensity,
              timestamp: Date.now(),
            }],
          } : null);
        } else {
          // 未识别到情绪，显示默认选项
          setPresetOptions(getDefaultPresetOptions());
          setLastDetectedEmotion('unknown');
        }
      }

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, aiMsg],
      } : null);
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

  // 点击预设选项
  const handlePresetClick = (option: string) => {
    handleSend(option);
  };

  // 结束对话
  const handleEndConversation = () => {
    if (!session) return;
    const endedSession = { ...session, endTime: Date.now() };
    const summary = generateEmotionSummary(session.emotionRecords, session.roundCount);

    // 更新记忆
    updateMemoryFromSession(endedSession);

    setSummaryData({
      ...summary,
      roundCount: session.roundCount,
    });
    setShowSummary(true);
    saveSessionToHistory(endedSession);
  };

  // 开始新对话
  const handleNewConversation = () => {
    const lastEmotion = getLastEmotion();
    const greeting = getGreeting(lastEmotion);
    const newSession = createNewSession();
    const welcomeMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'ai',
      content: greeting,
      timestamp: Date.now(),
      isTypewriter: true,
    };
    newSession.messages = [welcomeMsg];
    setSession(newSession);
    saveSession(newSession);
    setShowSummary(false);
    setSummaryData(null);
    setPresetOptions(getDefaultPresetOptions());
    setLastDetectedEmotion('unknown');
  };

  // textarea 自适应高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  // 是否显示预设选项（对话刚开始或AI提问后）
  const showPresets = session && session.messages.length > 0 && !isTyping && (
    session.roundCount <= 1 || lastDetectedEmotion !== 'unknown'
  );

  // 品牌展示动画
  if (showSplash) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-[#0f0e2a] to-[#1a1640]">
        <div className="brand-splash flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#2a2555] to-[#1a1640] border border-white/10 brand-logo-pulse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[#c4a060]">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-[#e8e4f0] tracking-[0.2em]">Anteiku</h1>
          <p className="text-xs text-[#9b95ad] tracking-wider">你的情绪安全空间</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative flex flex-col h-screen max-h-screen overflow-hidden">
      {/* 星空背景 */}
      <div className="starry-bg" />

      {/* 主容器 */}
      <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full">
        {/* 顶部导航 */}
        <header className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2a2555] to-[#1a1640] border border-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#c4a060]">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-medium text-[#e8e4f0] tracking-wide">
                Anteiku
              </h1>
              <p className="text-[11px] text-[#9b95ad]">AI情绪陪伴</p>
            </div>
          </div>

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

          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 预设选项 */}
        {showPresets && (
          <div className="shrink-0 px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handlePresetClick(option)}
                  className="preset-btn px-4 py-2 rounded-full text-sm text-[#e8e4f0]/80 glass-card btn-hover transition-all"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

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
            <button
              onClick={() => handleSend()}
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
            Anteiku · AI情绪陪伴 · 你的感受值得被倾听
          </p>
        </div>
      </div>

      {/* 情绪摘要卡片 */}
      {showSummary && summaryData && (
        <EmotionSummaryCard
          primaryEmotion={summaryData.primaryEmotion}
          intensity={summaryData.intensity}
          summary={summaryData.summary}
          encouragement={summaryData.encouragement}
          roundCount={summaryData.roundCount}
          timeline={summaryData.timeline}
          onClose={handleNewConversation}
        />
      )}
    </div>
  );
}
