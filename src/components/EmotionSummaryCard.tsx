'use client';

import { useState } from 'react';
import type { EmotionType } from '@/lib/emotion-engine';
import { getEmotionColor } from '@/lib/emotion-engine';

interface EmotionSummaryCardProps {
  primaryEmotion: EmotionType;
  intensity: number;
  summary: string;
  encouragement: string;
  roundCount: number;
  timeline: Array<{ emotion: EmotionType; timestamp: number }>;
  onClose: () => void;
}

const EMOTION_LABELS: Record<EmotionType, string> = {
  '焦虑': '焦虑',
  '疲惫': '疲惫',
  '迷茫': '迷茫',
  '孤独': '孤独',
  '自我否定': '自我否定',
  'unknown': '平静',
};

/**
 * 情绪摘要卡片组件（升级版）
 */
export function EmotionSummaryCard({
  primaryEmotion,
  intensity,
  summary,
  encouragement,
  roundCount,
  timeline,
  onClose,
}: EmotionSummaryCardProps) {
  const [saved, setSaved] = useState(false);
  const emotionColor = getEmotionColor(primaryEmotion);
  const barWidth = Math.min(Math.max(intensity * 10, 10), 100);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 格式化时间
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm card-appear max-h-[85vh] overflow-y-auto chat-scroll">
        <div className="glass-card rounded-3xl p-6 shadow-2xl">
          {/* 标题 */}
          <div className="text-center mb-5">
            <h3 className="text-lg font-light text-[#e8e4f0] tracking-wide">
              今日情绪摘要
            </h3>
            <p className="text-xs text-[#9b95ad] mt-1">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* 情绪标签 */}
          <div className="flex justify-center mb-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: `${emotionColor}15`,
                border: `1px solid ${emotionColor}30`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: emotionColor }}
              />
              <span className="text-sm" style={{ color: emotionColor }}>
                {EMOTION_LABELS[primaryEmotion]}
              </span>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="flex justify-center gap-6 mb-5">
            <div className="text-center">
              <p className="text-lg font-light text-[#e8e4f0]">{roundCount}</p>
              <p className="text-[10px] text-[#9b95ad]">对话轮数</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-light text-[#e8e4f0]">{intensity}<span className="text-xs text-[#9b95ad]">/10</span></p>
              <p className="text-[10px] text-[#9b95ad]">情绪强度</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-light text-[#e8e4f0]">{timeline.length}</p>
              <p className="text-[10px] text-[#9b95ad]">情绪变化</p>
            </div>
          </div>

          {/* 情绪强度条 */}
          <div className="mb-5">
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="emotion-bar h-full rounded-full"
                style={{
                  width: `${barWidth}%`,
                  '--bar-color': emotionColor,
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* 情绪变化时间线 */}
          {timeline.length > 1 && (
            <div className="mb-5">
              <p className="text-xs text-[#9b95ad] mb-3">情绪变化</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getEmotionColor(item.emotion) }}
                      />
                      <span className="text-[9px] text-[#9b95ad] whitespace-nowrap">
                        {EMOTION_LABELS[item.emotion]}
                      </span>
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-4 h-px bg-white/10 mt-[-12px]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 总结语 */}
          <div className="mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-[#e8e4f0]/80 leading-relaxed text-center">
              {summary}
            </p>
          </div>

          {/* 个性化鼓励 */}
          <div className="mb-5 p-3 rounded-xl bg-[#c4a060]/[0.06] border border-[#c4a060]/[0.12]">
            <p className="text-sm text-[#c4a060]/90 leading-relaxed text-center">
              {encouragement}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-hover transition-all"
              style={{
                backgroundColor: saved ? 'rgba(134, 239, 172, 0.15)' : 'rgba(196, 160, 96, 0.12)',
                color: saved ? '#86efac' : '#c4a060',
                border: `1px solid ${saved ? 'rgba(134, 239, 172, 0.2)' : 'rgba(196, 160, 96, 0.2)'}`,
              }}
            >
              {saved ? '已保存' : '保存'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-hover bg-white/[0.05] text-[#9b95ad] border border-white/[0.08] transition-all"
            >
              开始新对话
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
