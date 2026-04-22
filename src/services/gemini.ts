// 🌟 升级：我们准备了两个大脑。默认用文本大脑，一旦探测到图片，瞬间切换为视觉大脑！
const TEXT_MODEL = "Qwen/Qwen2.5-72B-Instruct"; 
const VISION_MODEL = "Qwen/Qwen2-VL-72B-Instruct"; // 硅基流动的顶级免费多模态大模型

// 🌟 升级：增加 useVision 参数，控制动态切换模型
const callAI = async (messages: any[], requireJson = false, useVision = false) => {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: useVision ? VISION_MODEL : TEXT_MODEL }) 
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  
  let text = data.result;
  if (requireJson) {
    try {
      const match = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
      const jsonStr = match ? match[1] : text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      throw new Error("AI 返回格式错误，请重试");
    }
  }
  return text;
};

const fetchDynamicKnowledge = async (query: string) => {
  try {
    const res = await fetch('/api/search-kb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    return data.result;
  } catch (e) {
    return "";
  }
};

export const decomposeGoals = async (purpose: string) => {
  const prompt = `你是一个资深用户研究专家。请根据【研究目的】，拆解出3个专业的研究目标，并推测本次研究最可能涉及的3-4个具体目标群体身份（如租客、房东、企业HR、求职者、外卖员等）。
  研究目的：${purpose}
  必须返回合法JSON：
  {
    "shortTitle": "项目简称（10字内）", 
    "goals": [{"id": "g1", "content": "具体目标"}], 
    "suggestedDimensions": [{"id": "motivation", "name": "核心变量", "desc": "解释"}],
    "suggestedRoles": ["推测身份1", "推测身份2"]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, _unusedKnowledge: any[]) => {
  const realKnowledge = await fetchDynamicKnowledge(purpose);

  const roleConstraint = (config.selectedRoles && config.selectedRoles.length > 0) 
    ? `【强制身份限制】：必须严格从以下用户勾选的身份中分配职业：${config.selectedRoles.join(', ')}。` 
    : `【身份定位】：仔细分析【研究目的】，如果是企业端/商家则生成B端人设；如果是消费者/租客则生成C端人设。`;

  const coreVars = config.subjectiveDimensions?.join(', ') || '动机偏好';
  
  let objectiveVarsStr = "";
  if (config.ageRange) objectiveVarsStr += `- 年龄范围限制在：${config.ageRange.min}到${config.ageRange.max}岁之间；\n`;
  if (config.genderRatio !== undefined) objectiveVarsStr += `- 性别比例尽量遵循：男性约${config.genderRatio}%，女性约${100-config.genderRatio}%；\n`;
  if (config.cityTierRange && config.cityTierRange.length > 0) objectiveVarsStr += `- 城市线级限定在：${config.cityTierRange.join(', ')}；\n`;
  if (config.incomeRange) objectiveVarsStr += `- 月收入限定在：${config.incomeRange.min}到${config.incomeRange.max}元之间；\n`;
  if (config.customObjectiveVariables) objectiveVarsStr += `- 其他用户自定义强制要求：${config.customObjectiveVariables}；\n`;

  const prompt = `你是一个高仿真用户生成器。你需要根据【研究目的】生成 ${config.userCount || 4} 个虚拟访谈用户。

  【核心生成规则】：
  1. ${roleConstraint}
  2. 🌟 核心差异化（极度重要）：这几个用户的本质差异，必须严格体现在用户选定的核心变量【${coreVars}】上！请确保他们在这个维度上有截然不同的行为倾向（例如同为租客，有人价格敏感，有人体验优先）。
  3. 🌟 客观条件限制：生成的人物，其年龄、性别、收入等客观属性，必须严格符合以下群体分布条件：
  ${objectiveVarsStr || '无特殊限制，请合理随机分配。'}
  4. 结合内部痛点：参考以下内部资料，将他们的核心痛点变得极具真实场景感。
  
  【内部资料参考】：
  ${realKnowledge || "暂无内部资料，请依靠行业常识推演"}

  【研究目的】：${purpose}

  必须返回合法JSON数组（注意 coreTraits 里的 key 必须是前面要求区分的那个核心变量）：
  [{"name": "李雷", "age": 35, "occupation": "餐饮店老板", "coreTraits": { "你区分的那个核心变量名称（如决策风格）": { "label": "感性直觉型", "detail": "结合了资料的真实场景痛点描述" } }, "personality_traits": ["精打细算", "急性子"]}]`;
  
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const chatWithUser = async (participant: any, history: any[], input: string, project: any, _unusedKnowledge: any[], images: any) => {
  const realKnowledge = await fetchDynamicKnowledge(project.purpose + " " + input);

  const otherAI_Messages = history.filter((m: any) => m.senderType === 'synthetic_user' && m.syntheticUserId !== participant.id);
  const isFocusGroup = otherAI_Messages.length > 0;

  let chatModeRules = "";
  if (isFocusGroup) {
    chatModeRules = `【群聊场景规则】
    目前是多人焦点小组。如果前面的受访者已经说过了某个痛点，你【绝对不能】重复！你必须从你自己的职业角度，提出一个完全不同的痛点。你可以自然地说“前面那个人说的我没遇到，我反而是觉得...”。`;
  } else {
    chatModeRules = `【1V1私聊场景规则（极度重要！）】
    目前是一对一私密访谈，没有其他人！**绝对不准在对话中提到“刚才那位兄弟”、“其他人”！**
    你必须保持前后逻辑高度一致。如果访谈者（我）追问你、质疑你、或者指出你前后的逻辑矛盾，你必须【直面问题】，结合你的人设自然地辩解或补充细节，**绝对不准转移话题，更不准甩锅给别人！**`;
  }

  const messages: any[] = [
    { role: 'system', content: `【最高强制指令】
你现在的身份是参与访谈的真实人类，绝不是AI。

【你的人设】
姓名：${participant.name}，年龄：${participant.age}岁，职业：${participant.occupation}。
性格与特质：${participant.personality_traits?.join(',')}。
你的核心诉求：${Object.values(participant.coreTraits || {}).map((t:any) => t.detail).join('; ') || '暂无'}

【访谈背景】
本次访谈主题：${project.purpose}。请自动代入“58同城”及其旗下业务的真实使用场景。

【潜意识记忆（内部资料）】
${realKnowledge || '暂无'}

【聊天基础法则（违反必罚！）】
1. **绝不答非所问！** 仔细阅读对方的问题，对方问什么你就答什么！如果有图片，必须结合图片给出极其主观的评价！
2. **极度口语化**：像发微信语音一样自然。多用语气词（哎、说实话、其实、对、无语死了），字数控制在 50-100 字。
3. **严禁提纲**：绝对不准用 1.2.3. 或分段。
4. **严禁专业术语**：绝对不准说出“API Key、系统报错、代码、数据库”等词汇。

${chatModeRules}` }
  ];

  // 🌟 动态雷达：检查历史记录或当前对话中是否包含图片
  let hasImageInContext = false; 

  // 🌟 升级：装载历史对话，支持单图和多图
  history.forEach((m: any) => {
    let contentArray: any[] = [];
    if (m.content) contentArray.push({ type: "text", text: m.content });
    
    // 兼容历史记录中的单张图
    if (m.imageUrl) {
      contentArray.push({ type: "image_url", image_url: { url: m.imageUrl } });
      hasImageInContext = true;
    }
    // 兼容新版的多图 (imageUrls)
    if (m.imageUrls && m.imageUrls.length > 0) {
      m.imageUrls.forEach((url: string) => contentArray.push({ type: "image_url", image_url: { url } }));
      hasImageInContext = true;
    }

    if (contentArray.length === 1 && contentArray[0].type === "text") {
      messages.push({ role: m.senderType === 'user' ? 'user' : 'assistant', content: m.content });
    } else {
      messages.push({ role: m.senderType === 'user' ? 'user' : 'assistant', content: contentArray });
    }
  });

  // 🌟 升级：装载当前发言，支持多图传输给 AI
  let currentContentArray: any[] = [];
  if (input) currentContentArray.push({ type: "text", text: input });
  else if (images && images.length > 0) currentContentArray.push({ type: "text", text: "请看这些设计图" });

  if (images && images.length > 0) {
    hasImageInContext = true;
    images.forEach((img: any) => {
      currentContentArray.push({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } });
    });
  }

  if (currentContentArray.length === 1 && currentContentArray[0].type === "text") {
    messages.push({ role: 'user', content: input || "继续" });
  } else {
    messages.push({ role: 'user', content: currentContentArray });
  }

  // 🌟 动态模型切换：如果有图，就传入 true 激活 VISION_MODEL (Qwen2-VL)
  return await callAI(messages, false, hasImageInContext);
};

export const generateReport = async (project: any, users: any[], messages: any[]) => {
  const chatLog = messages.map(m => {
    const sender = m.senderType === 'user' ? '研究员(我)' : (users.find(u => u.id === m.syntheticUserId)?.name || '受访用户');
    return `${sender}: ${m.content}`;
  }).join('\n\n');

  const prompt = `你是一个严谨客观的资深产品研究员。请**严格且仅根据**下方的【真实访谈聊天记录】，生成一份专业的研究报告。

  【绝对红线（违反必受罚）】：
  1. 绝不能凭空捏造痛点，不能自行发挥！如果你在记录里没看到的内容，绝对不允许写进报告！
  2. 所有的 evidence（证据）和 userQuotes（原话）必须 100% 复制下方聊天记录里用户说的原话，一字不差！

  研究目的：${project.purpose}。

  【真实访谈聊天记录】：
  ${chatLog || "暂无记录"}

  必须返回合法JSON格式：
  {"summary": "一句话总结痛点", "insights": [{"category": "体验洞察", "content": "必须依据记录提取的洞察", "evidence": "照抄记录里的原话"}], "painPoints": [{"description": "痛点描述", "severity": "high", "frequency": "高", "userQuotes": ["照抄原话"]}], "recommendations": [{"action": "优化建议", "impact": "预期", "effort": "中"}]}`;
  
  return await callAI([{ role: 'user', content: prompt }], true);
};
