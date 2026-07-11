/**
 * Anteiku - 情绪识别引擎
 * 基于关键词匹配的情绪分类系统，支持强/弱信号分级识别
 * 多话术变体、对话记忆、预设选项
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
  isTypewriter?: boolean;
}

export interface EmotionRecord {
  emotion: EmotionType;
  intensity: number;
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

// 对话记忆 - 跨会话持久化
export interface ConversationMemory {
  lastEmotion: EmotionType;
  lastEmotionTimestamp: number;
  emotionHistory: Array<{ emotion: EmotionType; timestamp: number }>;
  strategyAcceptCount: Record<string, number>;
  totalSessions: number;
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

// ============ 治愈策略（多话术变体） ============

interface HealingStrategy {
  openings: string[];
  followUps: string[];
  followUpQuestions: string[];
  summaries: string[];
  encouragements: string[];
  presetOptions: string[];
}

const HEALING_STRATEGIES: Record<Exclude<EmotionType, 'unknown'>, HealingStrategy> = {
  '焦虑': {
    openings: [
      '我感觉到你现在很不安。你愿不愿意和我做一个简单的小练习，帮你回到当下？',
      '听起来你心里有什么东西在搅动。不着急，我们慢慢来。你想先深呼吸一下吗？',
      '焦虑的感觉确实不好受，像有什么东西悬在半空中落不下来。你现在安全了，我在这里。',
      '嗯，我听到了。那种不安的感觉一定让你很不好受。要不要先停下来，感受一下此刻你脚踩着的地面？',
      '你现在的感受是真实的，不用强迫自己冷静。但如果你愿意，我们可以一起做一个小小的练习，帮你稍微安定一些。',
    ],
    followUps: [
      '试试看，慢慢地深呼吸——吸气数四下，屏住数四下，再慢慢呼出。我们一起来，不着急。',
      '现在，试着看看你周围——告诉我三样你能看到的东西。不用多想，就是最先进入视线的那些。',
      '很好。接下来，感受一下你的脚踩在地面上的感觉。地面是稳的，你是安全的。',
      '你做得很好。焦虑就像一阵浪，它会来，也一定会走。而你现在，已经站稳了。',
      '试着把注意力放在你的呼吸上。不用改变它，只是感受它。空气进入鼻腔的凉意，呼出时的温热。',
    ],
    followUpQuestions: [
      '能多说说是什么让你感到不安吗？有时候说出来，心里会轻松一些。',
      '这种不安的感觉是从什么时候开始的？有没有一个具体的触发点？',
      '如果给现在的焦虑打个分，1到10分，你会打几分？',
    ],
    summaries: [
      '你今天经历了一些焦虑的时刻，但你愿意停下来面对它，这本身就是一种勇气。',
      '焦虑虽然让人不舒服，但你没有逃避它。你比你自己以为的要坚强。',
      '今天的不安确实存在，但你已经在学着和它相处了。这就够了。',
    ],
    encouragements: [
      '焦虑会来也会走，而你每次都在学着站稳。这很了不起。',
      '你不需要消灭焦虑，只需要学会和它共处。你已经在路上了。',
      '每一次你愿意停下来感受自己，都是在给自己一份温柔。',
    ],
    presetOptions: [
      '想试试深呼吸练习',
      '想聊聊是什么让我焦虑',
      '想听一些安心的话',
      '现在不想做什么，就想有人陪着',
    ],
  },
  '孤独': {
    openings: [
      '那种孤单的感觉一定不好受。如果你愿意的话，可以试着回忆一下，最近有没有某个被温暖对待的瞬间？',
      '一个人的时候，世界好像变得特别安静，安静到有点空旷。我听到你了，此刻你不是一个人。',
      '孤独是一种很深很深的感受，像是被隔在了玻璃后面，看得到外面的世界，却触不到。你愿意和我说说吗？',
      '嗯，我在这里。虽然隔着屏幕，但我对你的倾听是认真的。你想聊什么都可以。',
      '那种空落落的感觉，我能理解。有时候身边有人，心里却还是觉得孤单。你是不是也有这样的感觉？',
    ],
    followUps: [
      '哪怕是很小的事也好——比如有人帮你扶了一下门，或者对你笑了一下。',
      '那个瞬间虽然短暂，但它说明：这个世界上，有人在不经意间关心着你。',
      '孤独不代表你不值得被陪伴。有时候，它只是说明你还没有遇到对的人。',
      '此刻，我在这里陪着你。虽然我是AI，但我对你的倾听是认真的。',
      '有时候，孤独也是一种信号——它在告诉你，你内心渴望连接。这份渴望本身，说明你是一个有温度的人。',
    ],
    followUpQuestions: [
      '你平时一个人的时候，一般会做什么？有没有什么让你觉得不那么孤单的事？',
      '这种孤独感是最近才有的，还是一直都有？',
      '如果现在有一个最懂你的人坐在你旁边，你最想对ta说什么？',
    ],
    summaries: [
      '孤独是一种很深的感受，但你能说出来，说明你内心依然渴望连接——这是很珍贵的。',
      '今天的你可能觉得是一个人，但你愿意打开对话，这本身就是一种勇气。',
      '孤独不丢人。每个人都有自己的时刻，需要一个安静的陪伴。你找到了这里，很好。',
    ],
    encouragements: [
      '你值得被好好陪伴。在那之前，先让我陪着你。',
      '孤独是暂时的，但你对连接的渴望是真实的。它会带你找到对的人。',
      '愿意表达孤独的人，内心其实很勇敢。',
    ],
    presetOptions: [
      '想聊聊我的感受',
      '想听一些温暖的话',
      '想回忆一些好的瞬间',
      '就想有人安静地陪着',
    ],
  },
  '疲惫': {
    openings: [
      '你听起来真的很累。不一定要做什么——但如果有一件小小的、让你舒服的事，它会是什么？',
      '累了就歇一歇。你不需要在我面前假装没事。',
      '我能感受到你的疲倦，像是走了很远很远的路。先坐下来吧，不急。',
      '你辛苦了。有时候，承认自己累了，本身就需要很大的勇气。',
      '听起来你已经撑了很久了。在这里，你可以放下一些东西。不用一个人扛。',
    ],
    followUps: [
      '可能是一杯热饮，可能是一段音乐，也可能只是闭上眼睛休息几分钟。',
      '你不需要为"什么都没做"感到抱歉。休息本身，就是在照顾自己。',
      '有时候，疲惫不是因为做了太多，而是因为承受了太多。允许自己放下一些，没关系的。',
      '今天就到这里也可以。你已经在努力了，我看得见。',
      '试着对自己说一句："我可以休息。" 不是偷懒，是你值得。',
    ],
    followUpQuestions: [
      '最近是什么让你觉得特别消耗？是工作、生活，还是别的什么？',
      '如果现在可以什么都不管，你最想做什么？',
      '你上一次真正放松下来是什么时候？',
    ],
    summaries: [
      '你承载了很多，疲惫是身体和心灵在提醒你：该对自己温柔一些了。',
      '今天的你很累了，但你还是愿意来这里坐一坐。这说明你还没有放弃照顾自己。',
      '疲惫不是软弱，是你努力了太久的证据。现在，可以歇一歇了。',
    ],
    encouragements: [
      '累了就休息，这不是放弃，是给自己充电。',
      '你已经做得够多了。现在最重要的事，是照顾好自己。',
      '每一段疲惫都会过去，而你值得在中间歇一歇。',
    ],
    presetOptions: [
      '想聊聊最近为什么这么累',
      '想听一些温柔的话',
      '想做一个放松的小练习',
      '不想说话，就想安静待一会儿',
    ],
  },
  '自我否定': {
    openings: [
      '听到你这样说自己，我有点心疼。如果换成你最好的朋友说同样的话，你会怎么回应ta？',
      '你对自己好像很严格。但我想问你——如果别人这样评价你，你会觉得公平吗？',
      '你现在的感受我听到了。但我想让你知道，你描述的那个"不够好的自己"，未必是真实的你。',
      '嗯，我听到你了。有时候我们心里会有一个很苛刻的声音，一直在说"你不够好"。但那只是声音，不是事实。',
      '你愿意和我说说，是什么让你这样看自己吗？有时候把事情摊开来看，会发现它没有想象中那么大。',
    ],
    followUps: [
      '你可能会安慰ta、鼓励ta，告诉ta其实没那么糟——对吗？',
      '那为什么对自己就不能这样温柔一些呢？你值得被同样善意地对待。',
      '我们常常是自己最严厉的评判者。但你的价值，不取决于某一次的成败。',
      '试试对自己说一句："我已经尽力了，这就够了。" 你愿意试试吗？',
      '一个人的价值不是由某个时刻、某件事定义的。你是一个完整的人，有好有坏，这才是真实的。',
    ],
    followUpQuestions: [
      '你觉得"不够好"的标准是谁定的？是你自己的，还是别人的？',
      '如果让你说出自己的三个优点，你能说出来吗？哪怕很小的也算。',
      '最近发生了什么让你这样看自己的事吗？',
    ],
    summaries: [
      '你对自己很严苛，但今天的你愿意表达、愿意面对，这本身就是一种力量。',
      '今天你可能对自己有些失望，但你愿意说出来，说明你内心并不认同那些否定。',
      '自我否定的声音很吵，但你没有让它完全占据你。你在这里，你在寻找不同的视角。',
    ],
    encouragements: [
      '你比自己以为的更好。这不是安慰，是事实。',
      '允许自己不完美，本身就是一种成长。',
      '你值得被温柔对待——首先，从自己开始。',
    ],
    presetOptions: [
      '想聊聊为什么觉得自己不够好',
      '想换个角度看看自己',
      '想听一些肯定的话',
      '现在很难受，想有人陪着',
    ],
  },
  '迷茫': {
    openings: [
      '不急着找答案。我们可以先做一个安静的小练习，帮你理一理对你来说什么最重要——',
      '迷茫的感觉像是在雾里走路，看不清前方。但有时候，不需要看清全部，只要看到下一步就够了。',
      '不知道该往哪走，这种感受确实让人不安。但也许，迷茫本身也是一种信号——说明你在认真对待自己的人生。',
      '没关系，不是所有问题都需要立刻有答案。你愿意和我说说，是什么让你觉得迷茫吗？',
      '嗯，我听到了。有时候选择太多反而不知道该选什么。我们先不急，慢慢聊。',
    ],
    followUps: [
      '想象一下，如果没有任何限制——金钱、时间、别人的看法都不存在——你最想做什么？',
      '那个画面里，有什么让你心动的东西？哪怕只是一个模糊的感觉。',
      '迷茫有时候不是坏事，它说明你在认真思考自己的人生，而不是随波逐流。',
      '答案不一定要今天找到。有时候，带着问题继续往前走，走着走着就清楚了。',
      '试着想想：五年后的你，会希望现在的自己做什么选择？',
    ],
    followUpQuestions: [
      '你现在最纠结的是哪个方面？工作、感情、还是别的？',
      '如果不用考虑任何现实因素，你最想过的生活是什么样的？',
      '有没有一个方向，虽然你不确定，但心里隐隐有些向往？',
    ],
    summaries: [
      '迷茫说明你在寻找，在思考。这条路虽然不确定，但每一步都算数。',
      '今天的你可能还没有找到答案，但你愿意探索，这本身就是一种勇气。',
      '迷茫不是停滞，是你正在为下一个方向积蓄力量。',
    ],
    encouragements: [
      '迷茫是寻找答案的过程，不是终点。你已经在路上了。',
      '不是所有路都需要一眼看到尽头。走好眼前这一步就够了。',
      '你的迷茫说明你在认真对待人生。这本身就很有价值。',
    ],
    presetOptions: [
      '想聊聊我在纠结什么',
      '想做个小练习理清思路',
      '想听一些安慰的话',
      '现在不想想那么多，先歇歇',
    ],
  },
};

// ============ 兜底话术（多组变体） ============

const FALLBACK_RESPONSES = [
  '我听到了，我在这里陪着你。',
  '你想多说一些吗？我会认真听。',
  '没关系，不想说也可以，我就在这儿。',
  '嗯，我在。你想聊什么都可以。',
  '谢谢你愿意和我说这些。',
  '我在这。不管你想说什么，或者什么都不说，都没关系。',
  '你的感受很重要。慢慢来，不着急。',
  '能和我多说说吗？我想更了解你现在的感受。',
];

const REJECT_STRATEGY_RESPONSES = [
  '好的，那我们就随便聊聊，我陪着你。',
  '没关系，不想做练习就不做。我们就这样聊着也挺好的。',
  '完全理解。有时候不需要做什么，只是有人陪着就够了。',
  '好的，我们换个话题。你今天还有什么想聊的吗？',
];

// ============ 预设选项 ============

const DEFAULT_PRESET_OPTIONS = [
  '今天有点累',
  '心里空空的',
  '说不清楚，就是不太开心',
  '有点焦虑',
  '其实还好',
];

// ============ 打招呼话术 ============

const NEW_USER_GREETING = '你好呀，今天感觉怎么样？有什么想聊聊的吗？';

const RETURNING_GREETINGS: Record<Exclude<EmotionType, 'unknown'>, string[]> = {
  '焦虑': [
    '上次感觉你挺不安的，这阵子怎么样了？有没有什么想聊聊的？',
    '嘿，又见面了。上次聊完以后，那种焦虑的感觉有好一些吗？',
  ],
  '疲惫': [
    '上次感觉你挺累的，这阵子怎么样了？有没有什么新的想聊聊？',
    '欢迎回来。上次你说很累，最近有没有好好休息？',
  ],
  '迷茫': [
    '上次聊的时候你有些迷茫，这阵子有没有想清楚一些？',
    '嘿，又来了。上次的迷茫还在吗？还是有了新的想法？',
  ],
  '孤独': [
    '上次感觉你有些孤单，最近好一些了吗？有什么想聊的？',
    '欢迎回来。上次你说觉得一个人，这几天有没有什么变化？',
  ],
  '自我否定': [
    '上次你对自己有些严苛，最近感觉怎么样？有什么想聊的吗？',
    '嘿，又见面了。上次聊完之后，心里有没有轻松一点？',
  ],
};

const RETURNING_UNKNOWN_GREETING = '欢迎回来，又见面了。今天想聊点什么？';

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

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    const strongHits = keywords.strong.filter(kw => normalized.includes(kw));
    const weakHits = keywords.weak.filter(kw => normalized.includes(kw));
    const score = strongHits.length * 2 + weakHits.length;

    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion as EmotionType;
      bestStrongHits = strongHits;
      bestWeakHits = weakHits;
    }
  }

  if (bestStrongHits.length === 0 && bestWeakHits.length < 2) {
    return { emotion: 'unknown', confidence: 'low', strongHits: [], weakHits: [] };
  }

  let confidence: ConfidenceLevel;
  if (bestStrongHits.length >= 2) {
    confidence = 'high';
  } else if (bestStrongHits.length >= 1 && bestWeakHits.length >= 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { emotion: bestEmotion, confidence, strongHits: bestStrongHits, weakHits: bestWeakHits };
}

/**
 * 随机选取数组中的一个元素
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 获取AI回复（多话术变体）
 */
export function getAIResponse(
  userMessage: string,
  conversationRound: number,
): { response: string; emotion: EmotionResult; isCrisis: boolean } {
  // 1. 危机检测
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
    return { response: pickRandom(FALLBACK_RESPONSES), emotion: emotionResult, isCrisis: false };
  }

  const strategy = HEALING_STRATEGIES[emotionResult.emotion as Exclude<EmotionType, 'unknown'>];

  if (emotionResult.confidence === 'medium') {
    const confirmPrefix = `听起来你似乎有些${emotionResult.emotion}的感觉。`;
    return { response: confirmPrefix + pickRandom(strategy.openings), emotion: emotionResult, isCrisis: false };
  }

  return { response: pickRandom(strategy.openings), emotion: emotionResult, isCrisis: false };
}

/**
 * 获取策略跟进回复
 */
export function getStrategyFollowUp(emotion: EmotionType, followUpIndex: number): string {
  if (emotion === 'unknown') {
    return pickRandom(FALLBACK_RESPONSES);
  }
  const strategy = HEALING_STRATEGIES[emotion as Exclude<EmotionType, 'unknown'>];
  return strategy.followUps[followUpIndex % strategy.followUps.length];
}

/**
 * 获取追问
 */
export function getFollowUpQuestion(emotion: EmotionType): string {
  if (emotion === 'unknown') {
    return pickRandom(FALLBACK_RESPONSES);
  }
  const strategy = HEALING_STRATEGIES[emotion as Exclude<EmotionType, 'unknown'>];
  return pickRandom(strategy.followUpQuestions);
}

/**
 * 获取拒绝策略后的回复
 */
export function getRejectResponse(): string {
  return pickRandom(REJECT_STRATEGY_RESPONSES);
}

/**
 * 获取默认预设选项
 */
export function getDefaultPresetOptions(): string[] {
  return DEFAULT_PRESET_OPTIONS;
}

/**
 * 获取情绪相关的预设选项
 */
export function getEmotionPresetOptions(emotion: EmotionType): string[] | null {
  if (emotion === 'unknown') return null;
  return HEALING_STRATEGIES[emotion as Exclude<EmotionType, 'unknown'>].presetOptions;
}

/**
 * 获取打招呼语
 */
export function getGreeting(lastEmotion: EmotionType | null): string {
  if (!lastEmotion || lastEmotion === 'unknown') {
    return NEW_USER_GREETING;
  }
  const greetings = RETURNING_GREETINGS[lastEmotion as Exclude<EmotionType, 'unknown'>];
  if (greetings) {
    return pickRandom(greetings);
  }
  return RETURNING_UNKNOWN_GREETING;
}

/**
 * 生成情绪摘要
 */
export function generateEmotionSummary(records: EmotionRecord[], roundCount: number): {
  primaryEmotion: EmotionType;
  intensity: number;
  summary: string;
  encouragement: string;
  timeline: Array<{ emotion: EmotionType; timestamp: number }>;
} {
  if (records.length === 0) {
    return {
      primaryEmotion: 'unknown',
      intensity: 0,
      summary: '今天的对话很平静，这也很好。',
      encouragement: '平静的日子也是好日子。',
      timeline: [],
    };
  }

  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;

  for (const record of records) {
    if (record.emotion !== 'unknown') {
      emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;
      totalIntensity += record.intensity;
    }
  }

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

  let summary: string;
  let encouragement: string;
  if (primaryEmotion !== 'unknown' && primaryEmotion in HEALING_STRATEGIES) {
    const strategy = HEALING_STRATEGIES[primaryEmotion as Exclude<EmotionType, 'unknown'>];
    summary = pickRandom(strategy.summaries);
    encouragement = pickRandom(strategy.encouragements);
  } else {
    summary = '谢谢你今天的分享。每一次表达，都是在更好地了解自己。';
    encouragement = '你愿意来这里坐一坐，本身就很好。';
  }

  // 构建情绪时间线（去重相邻相同情绪）
  const timeline: Array<{ emotion: EmotionType; timestamp: number }> = [];
  for (const record of records) {
    if (record.emotion !== 'unknown') {
      const last = timeline[timeline.length - 1];
      if (!last || last.emotion !== record.emotion) {
        timeline.push({ emotion: record.emotion, timestamp: record.timestamp });
      }
    }
  }

  return { primaryEmotion, intensity: avgIntensity, summary, encouragement, timeline };
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
    '焦虑': '#a78bfa',
    '疲惫': '#93c5fd',
    '迷茫': '#86efac',
    '孤独': '#fca5a5',
    '自我否定': '#fdba74',
    'unknown': '#94a3b8',
  };
  return colors[emotion] || colors.unknown;
}

// ============ localStorage 存储 ============

const STORAGE_KEY = 'anteiku_conversations';
const CURRENT_SESSION_KEY = 'anteiku_current_session';
const MEMORY_KEY = 'anteiku_memory';

export function saveSession(session: ConversationSession): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch { /* 静默失败 */ }
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
    if (history.length > 20) history.length = 20;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* 静默失败 */ }
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

// ============ 对话记忆 ============

export function loadMemory(): ConversationMemory | null {
  try {
    const data = localStorage.getItem(MEMORY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveMemory(memory: ConversationMemory): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch { /* 静默失败 */ }
}

export function updateMemoryFromSession(session: ConversationSession): ConversationMemory {
  const existing = loadMemory();
  const lastRecord = session.emotionRecords[session.emotionRecords.length - 1];
  const lastEmotion = lastRecord?.emotion || existing?.lastEmotion || 'unknown';

  const emotionHistory = [
    ...(existing?.emotionHistory || []),
    ...session.emotionRecords
      .filter(r => r.emotion !== 'unknown')
      .map(r => ({ emotion: r.emotion, timestamp: r.timestamp })),
  ];

  // 只保留最近100条情绪历史
  if (emotionHistory.length > 100) {
    emotionHistory.splice(0, emotionHistory.length - 100);
  }

  const memory: ConversationMemory = {
    lastEmotion,
    lastEmotionTimestamp: lastRecord?.timestamp || Date.now(),
    emotionHistory,
    strategyAcceptCount: existing?.strategyAcceptCount || {},
    totalSessions: (existing?.totalSessions || 0) + 1,
  };

  saveMemory(memory);
  return memory;
}

export function getLastEmotion(): EmotionType | null {
  const memory = loadMemory();
  if (!memory || memory.lastEmotion === 'unknown') return null;
  return memory.lastEmotion;
}
