/**
 * 安定区 - 情绪识别引擎
 * 基于关键词匹配的情绪分类系统，支持强/弱信号分级识别
 */

// ============ 类型定义 ============

export type EmotionType = '焦虑' | '疲惫' | '迷茫' | '孤独' | '自我否定' | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EmotionResult {
  emotion: EmotionType;
  confidence: ConfidenceLevel;
  strongHits: string[];
  weakHits: string[];
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
  emotion?: EmotionResult;
  isCrisis?: boolean;
}

export interface EmotionRecord {
  emotion: EmotionType;
  intensity: number; // 1-10
  timestamp: number;
}

export interface ConversationSession {
  id: string;
  messages: ChatMessage[];
  emotionRecords: EmotionRecord[];
  startTime: number;
  endTime?: number;
  roundCount: number;
}

// ============ 情绪关键词库 ============

interface EmotionKeywords {
  strong: string[];
  weak: string[];
}

const EMOTION_KEYWORDS: Record<Exclude<EmotionType, 'unknown'>, EmotionKeywords> = {
  '焦虑': {
    strong: ['好慌', '睡不着', '担心', '害怕', '好害怕', '很慌', '心慌', '恐慌'],
    weak: ['压力', '紧张', '着急', '不安', '烦躁', '焦虑', '忐忑'],
  },
  '疲惫': {
    strong: ['好累', '撑不住', '没力气', '耗尽了', '累死了', '精疲力竭', '崩溃了'],
    weak: ['困', '不想动', '没精神', '疲倦', '乏力', '好困', '好乏', '身心俱疲'],
  },
  '迷茫': {
    strong: ['不知道', '该不该', '选哪个', '没方向', '找不到方向', '不知道怎么办'],
    weak: ['纠结', '不确定', '可能', '犹豫', '矛盾', '困惑', '无所适从'],
  },
  '孤独': {
    strong: ['一个人', '没人懂', '找不到人', '空', '好孤独', '很孤独', '孤单'],
    weak: ['独自', '没人', '没有朋友', '寂寞', '冷清', '形单影只', '孤零零'],
  },
  '自我否定': {
    strong: ['我不行', '太差了', '没用', '废物', '垃圾', '一无是处', '不配'],
    weak: ['不够好', '失败', '做不好', '比不上', '差劲', '无能', '自卑'],
  },
};

// ============ 危机关键词 ============

const CRISIS_KEYWORDS = [
  '不想活了', '活着没意义', '想结束', '不想见明天', '一切都完了',
  '不想活', '想死', '去死', '自杀', '没有意义', '活着没意思',
  '不如死了', '世界没有我会更好', '想消失', '不想醒来',
];

// ============ 治愈策略 ============

interface HealingStrategy {
  opening: string;
  followUps: string[];
  summary: string;
}

const HEALING_STRATEGIES: Record<Exclude<EmotionType, 'unknown'>, HealingStrategy> = {
  '焦虑': {
    opening: '我感觉到你现在很不安。你愿不愿意和我做一个简单的小练习，帮你回到当下？',
    followUps: [
      '试试看，慢慢地深呼吸——吸气数四下，屏住数四下，再慢慢呼出。我们一起来，不着急。',
      '现在，试着看看你周围——告诉我三样你能看到的东西。不用多想，就是最先进入视线的那些。',
      '很好。接下来，感受一下你的脚踩在地面上的感觉。地面是稳的，你是安全的。',
      '你做得很好。焦虑就像一阵浪，它会来，也一定会走。而你现在，已经站稳了。',
    ],
    summary: '你今天经历了一些焦虑的时刻，但你愿意停下来面对它，这本身就是一种勇气。',
  },
  '孤独': {
    opening: '那种孤单的感觉一定不好受。如果你愿意的话，可以试着回忆一下，最近有没有某个被温暖对待的瞬间？',
    followUps: [
      '哪怕是很小的事也好——比如有人帮你扶了一下门，或者对你笑了一下。',
      '那个瞬间虽然短暂，但它说明：这个世界上，有人在不经意间关心着你。',
      '孤独不代表你不值得被陪伴。有时候，它只是说明你还没有遇到对的人。',
      '此刻，我在这里陪着你。虽然我是AI，但我对你的倾听是认真的。',
    ],
    summary: '孤独是一种很深的感受，但你能说出来，说明你内心依然渴望连接——这是很珍贵的。',
  },
  '疲惫': {
    opening: '你听起来真的很累。不一定要做什么——但如果有一件小小的、让你舒服的事，它会是什么？',
    followUps: [
      '可能是一杯热饮，可能是一段音乐，也可能只是闭上眼睛休息几分钟。',
      '你不需要为"什么都没做"感到抱歉。休息本身，就是在照顾自己。',
      '有时候，疲惫不是因为做了太多，而是因为承受了太多。允许自己放下一些，没关系的。',
      '今天就到这里也可以。你已经在努力了，我看得见。',
    ],
    summary: '你承载了很多，疲惫是身体和心灵在提醒你：该对自己温柔一些了。',
  },
  '自我否定': {
    opening: '听到你这样说自己，我有点心疼。如果换成你最好的朋友说同样的话，你会怎么回应ta？',
    followUps: [
      '你可能会安慰ta、鼓励ta，告诉ta其实没那么糟——对吗？',
      '那为什么对自己就不能这样温柔一些呢？你值得被同样善意地对待。',
      '我们常常是自己最严厉的评判者。但你的价值，不取决于某一次的成败。',
      '试试对自己说一句："我已经尽力了，这就够了。" 你愿意试试吗？',
    ],
    summary: '你对自己很严苛，但今天的你愿意表达、愿意面对，这本身就是一种力量。',
  },
  '迷茫': {
    opening: '不急着找答案。我们可以先做一个安静的小练习，帮你理一理对你来说什么最重要——',
    followUps: [
      '想象一下，如果没有任何限制——金钱、时间、别人的看法都不存在——你最想做什么？',
      '那个画面里，有什么让你心动的东西？哪怕只是一个模糊的感觉。',
      '迷茫有时候不是坏事，它说明你在认真思考自己的人生，而不是随波逐流。',
      '答案不一定要今天找到。有时候，带着问题继续往前走，走着走着就清楚了。',
    ],
    summary: '迷茫说明你在寻找，在思考。这条路虽然不确定，但每一步都算数。',
  },
};

// ============ 兜底话术 ============

const FALLBACK_RESPONSES = [
  '我听到了，我在这里陪着你。',
  '你想多说一些吗？我会认真听。',
  '没关系，不想说也可以，我就在这儿。',
  '嗯，我在。你想聊什么都可以。',
  '谢谢你愿意和我说这些。',
];

const REJECT_STRATEGY_RESPONSE = '好的，那我们就随便聊聊，我陪着你。';

// ============ 核心函数 ============

/**
 * 检测危机信号
 */
export function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s/g, '');
  return CRISIS_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()));
}

/**
 * 识别用户情绪
 */
export function recognizeEmotion(text: string): EmotionResult {
  const normalized = text.toLowerCase();

  let bestEmotion: EmotionType = 'unknown';
  let bestStrongHits: string[] = [];
  let bestWeakHits: string[] = [];
  let bestScore = 0;

  // 遍历每种情绪，找到匹配度最高的
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    const strongHits = keywords.strong.filter(kw => normalized.includes(kw));
    const weakHits = keywords.weak.filter(kw => normalized.includes(kw));

    // 计算得分：强信号权重2，弱信号权重1
    const score = strongHits.length * 2 + weakHits.length;

    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion as EmotionType;
      bestStrongHits = strongHits;
      bestWeakHits = weakHits;
    }
  }

  // 判断是否归类
  if (bestStrongHits.length === 0 && bestWeakHits.length < 2) {
    return { emotion: 'unknown', confidence: 'low', strongHits: [], weakHits: [] };
  }

  // 判断置信度
  let confidence: ConfidenceLevel;
  if (bestStrongHits.length >= 2) {
    confidence = 'high';
  } else if (bestStrongHits.length >= 1 && bestWeakHits.length >= 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    emotion: bestEmotion,
    confidence,
    strongHits: bestStrongHits,
    weakHits: bestWeakHits,
  };
}

/**
 * 获取AI回复
 */
export function getAIResponse(
  userMessage: string,
  conversationRound: number,
  previousEmotion?: EmotionType
): { response: string; emotion: EmotionResult; isCrisis: boolean } {
  // 1. 危机检测（最高优先级）
  if (detectCrisis(userMessage)) {
    return {
      response: 'crisis',
      emotion: { emotion: 'unknown', confidence: 'low', strongHits: [], weakHits: [] },
      isCrisis: true,
    };
  }

  // 2. 超过20轮主动提示休息
  if (conversationRound > 0 && conversationRound % 20 === 0) {
    return {
      response: '我们已经聊了不少了。我们要不要休息一下？你可以随时回来，我一直都在。',
      emotion: recognizeEmotion(userMessage),
      isCrisis: false,
    };
  }

  // 3. 情绪识别
  const emotionResult = recognizeEmotion(userMessage);

  // 4. 根据情绪生成回复
  if (emotionResult.emotion === 'unknown') {
    // 兜底共情
    const response = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    return { response, emotion: emotionResult, isCrisis: false };
  }

  const strategy = HEALING_STRATEGIES[emotionResult.emotion as Exclude<EmotionType, 'unknown'>];

  // 根据置信度选择回复策略
  if (emotionResult.confidence === 'high') {
    // 高置信度：直接使用策略开场
    return { response: strategy.opening, emotion: emotionResult, isCrisis: false };
  }

  if (emotionResult.confidence === 'medium') {
    // 中置信度：加确认环节
    const confirmResponses = [
      `听起来你似乎有些${emotionResult.emotion}的感觉，是吗？${strategy.opening}`,
    ];
    return { response: confirmResponses[0], emotion: emotionResult, isCrisis: false };
  }

  // 低置信度：温和引导
  return { response: strategy.opening, emotion: emotionResult, isCrisis: false };
}

/**
 * 获取策略跟进回复（用户接受策略后）
 */
export function getStrategyFollowUp(
  emotion: EmotionType,
  followUpIndex: number
): string {
  if (emotion === 'unknown') {
    return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  }

  const strategy = HEALING_STRATEGIES[emotion as Exclude<EmotionType, 'unknown'>];
  const idx = followUpIndex % strategy.followUps.length;
  return strategy.followUps[idx];
}

/**
 * 获取拒绝策略后的回复
 */
export function getRejectResponse(): string {
  return REJECT_STRATEGY_RESPONSE;
}

/**
 * 生成情绪摘要
 */
export function generateEmotionSummary(records: EmotionRecord[]): {
  primaryEmotion: EmotionType;
  intensity: number;
  summary: string;
} {
  if (records.length === 0) {
    return {
      primaryEmotion: 'unknown',
      intensity: 0,
      summary: '今天的对话很平静，这也很好。',
    };
  }

  // 统计各情绪出现次数
  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;

  for (const record of records) {
    if (record.emotion !== 'unknown') {
      emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;
      totalIntensity += record.intensity;
    }
  }

  // 找到主要情绪
  let primaryEmotion: EmotionType = 'unknown';
  let maxCount = 0;
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      primaryEmotion = emotion as EmotionType;
    }
  }

  const avgIntensity = records.length > 0
    ? Math.round(totalIntensity / records.length)
    : 0;

  // 生成总结语
  let summary: string;
  if (primaryEmotion !== 'unknown' && primaryEmotion in HEALING_STRATEGIES) {
    summary = HEALING_STRATEGIES[primaryEmotion as Exclude<EmotionType, 'unknown'>].summary;
  } else {
    summary = '谢谢你今天的分享。每一次表达，都是在更好地了解自己。';
  }

  return { primaryEmotion, intensity: avgIntensity, summary };
}

/**
 * 生成消息ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 根据情绪获取标签颜色
 */
export function getEmotionColor(emotion: EmotionType): string {
  const colors: Record<EmotionType, string> = {
    '焦虑': '#a78bfa',     // 淡紫
    '疲惫': '#93c5fd',     // 淡蓝
    '迷茫': '#86efac',     // 淡绿
    '孤独': '#fca5a5',     // 淡红
    '自我否定': '#fdba74', // 淡橙
    'unknown': '#94a3b8',  // 灰色
  };
  return colors[emotion] || colors.unknown;
}

// ============ localStorage 存储 ============

const STORAGE_KEY = 'andingqu_conversations';
const CURRENT_SESSION_KEY = 'andingqu_current_session';

export function saveSession(session: ConversationSession): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function loadSession(): ConversationSession | null {
  try {
    const data = localStorage.getItem(CURRENT_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSessionToHistory(session: ConversationSession): void {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ConversationSession[];
    history.unshift(session);
    // 只保留最近20条
    if (history.length > 20) history.length = 20;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function createNewSession(): ConversationSession {
  return {
    id: `session_${Date.now()}`,
    messages: [],
    emotionRecords: [],
    startTime: Date.now(),
    roundCount: 0,
  };
}
