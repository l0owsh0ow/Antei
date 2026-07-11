'use client';

import { useState } from 'react';
import type { EmotionType } from '@/lib/emotion-engine';
import { getEmotionColor } from '@/lib/emotion-engine';

interface EmotionSummaryCardProps {
  primaryEmotion: EmotionType;
  intensity: number;
  summary: string;
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
 * 情绪摘要卡片组件
 */
export function EmotionSummaryCard({
  primaryEmotion,
  intensity,
  summary,
  onClose,
}: EmotionSummaryCardProps) {
  const [saved, setSaved] = useState(false);
  const emotionColor = getEmotionColor(primaryEmotion);
  const barWidth = Math.min(Math.max(intensity * 10, 10), 100);

  const handleSave = () => {
    setSaved(true);
    // 实际项目中可以生成图片或保存到本地
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 卡片 */}
      <div className="relative w-full max-w-sm card-appear">
        <div className="glass-card rounded-3xl p-6 shadow-2xl">
          {/* 标题 */}
          <div className="text-center mb-6">
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
          <div className="flex justify-center mb-5">
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

          {/* 情绪强度 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#9b95ad]">情绪强度</span>
              <span className="text-xs text-[#9b95ad]">{intensity}/10</span>
            </div>
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

          {/* 总结语 */}
          <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-[#e8e4f0]/80 leading-relaxed text-center">
              {summary}
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
