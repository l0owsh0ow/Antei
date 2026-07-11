'use client';

/**
 * 危机预警卡片组件
 */
export function CrisisCard() {
  return (
    <div className="crisis-card rounded-2xl p-5 message-appear max-w-[90%] md:max-w-[75%]">
      <div className="flex items-start gap-3">
        {/* 关怀图标 */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#e87170]/10 border border-[#e87170]/20 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#e87170]">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[15px] text-[#e8e4f0] leading-relaxed mb-4">
            我听到你说了一些让我很担心的话。我想先告诉你：你的感受很重要，也值得被认真对待。
          </p>
          <p className="text-[15px] text-[#e8e4f0] leading-relaxed mb-4">
            但我是AI，我不具备专业能力来帮助你度过这个时刻。如果你愿意，请你联系专业的心理援助热线：
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-[#e87170]">
              <span className="text-base">📞</span>
              <span className="text-sm font-medium">北京心理危机干预中心：010-82951332</span>
            </div>
            <div className="flex items-center gap-2 text-[#e87170]">
              <span className="text-base">📞</span>
              <span className="text-sm font-medium">全国心理援助热线：400-161-9995</span>
            </div>
          </div>
          <p className="text-[14px] text-[#9b95ad] leading-relaxed">
            我会一直在这里，但请优先联系专业人士。
          </p>
        </div>
      </div>
    </div>
  );
}
