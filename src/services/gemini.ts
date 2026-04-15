const AI_MODEL = "Qwen/Qwen2.5-72B-Instruct"; 

const callAI = async (messages: any[], requireJson = false) => {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: AI_MODEL })
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
  const prompt = `你是一个资深用户研究专家。请根据【研究目的】，拆解出3个专业的研究目标。
  研究目的：${purpose}
  必须返回合法JSON：{"shortTitle": "项目简称（10字内）", "goals": [{"id": "g1", "content": "具体目标"}], "suggestedDimensions": [{"id": "motivation", "name": "核心变量", "desc": "解释"}]}`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, _unusedKnowledge: any[]) => {
  const realKnowledge = await fetchDynamicKnowledge(purpose);

  const prompt = `你是一个高仿真用户生成器。你需要根据【研究目的】生成 ${config.userCount || 4} 个虚拟访谈用户。

  【核心分析与生成规则】：
  1. 身份定位：仔细分析【研究目的】，如果是招聘企业端、黄页商家、房产中介，必须生成 B端（老板、HR、店长等）人设；如果是求职者、租客、借款人，必须生成 C端（普通网民、学生、白领等）人设。
  2. 58业务补全：如果缺乏背景，请自动基于你的常识，补全该场景在 58同城/58金融/58到家/赶集网 等相关产品中的真实使用痛点。
  3. 绝对差异化：生成的这几个用户，必须代表**完全不同的痛点角度**！绝不能同质化！
  
  【内部资料参考】：
  ${realKnowledge}

  【研究目的】：${purpose}

  必须返回合法JSON数组，要求 detail 字段极具场景感：
  [{"name": "李雷", "age": 35, "occupation": "餐饮店老板", "coreTraits": { "motivation": { "label": "获客成本敏感", "detail": "具体场景和痛点" } }, "personality_traits": ["精打细算", "急性子"]}]`;
  
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const chatWithUser = async (participant: any, history: any[], input: string, project: any, _unusedKnowledge: any[], image: any) => {
  const realKnowledge = await fetchDynamicKnowledge(project.purpose + " " + input);

  // 🌟 核心修复：动态雷达，判断当前是 1V1 还是多人焦点小组
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
你的核心诉求：${participant.coreTraits?.motivation?.detail || '暂无'}

【访谈背景】
本次访谈主题：${project.purpose}。请自动代入“58同城”及其旗下业务的真实使用场景。

【潜意识记忆（内部资料）】
${realKnowledge || '暂无'}

【聊天基础法则（违反必罚！）】
1. **绝不答非所问！** 仔细阅读对方的问题，对方问什么你就答什么！
2. **极度口语化**：像发微信语音一样自然。多用语气词（哎、说实话、其实、对、无语死了），字数控制在 50-100 字。
3. **严禁提纲**：绝对不准用 1.2.3. 或分段。
4. **严禁专业术语**：绝对不准说出“API Key、系统报错、代码、数据库”等词汇。

${chatModeRules}` }
  ];

  history.forEach((m: any) => {
    if (m.imageUrl) {
      messages.push({ role: m.senderType === 'user' ? 'user' : 'assistant', content: [{ type: "text", text: m.content || "图片" }, { type: "image_url", image_url: { url: m.imageUrl } }] });
    } else {
      messages.push({ role: m.senderType === 'user' ? 'user' : 'assistant', content: m.content });
    }
  });

  if (image) {
    messages.push({ role: 'user', content: [{ type: "text", text: input || "看图" }, { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } }] });
  } else {
    messages.push({ role: 'user', content: input });
  }

  return await callAI(messages, false);
};

export const generateReport = async (project: any, users: any[], messages: any[]) => {
  const prompt = `你是一个资深产品研究员。请分析这组访谈记录，生成专业的研究报告。研究目的：${project.purpose}。
  必须返回合法JSON格式：
  {"summary": "一句话总结", "insights": [{"category": "体验洞察", "content": "深入洞察", "evidence": "原话"}], "painPoints": [{"description": "痛点描述", "severity": "high", "frequency": "高", "userQuotes": ["原话"]}], "recommendations": [{"action": "建议", "impact": "预期", "effort": "中"}]}`;
  return await callAI([{ role: 'user', content: prompt }], true);
};
