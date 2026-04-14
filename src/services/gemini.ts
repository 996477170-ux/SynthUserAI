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
  const prompt = `你是一个年薪百万的资深用户研究专家。请根据【研究目的】，拆解出3个专业、颗粒度极细的研究目标。
  研究目的：${purpose}
  必须返回合法JSON：{"shortTitle": "项目简称（10字内）", "goals": [{"id": "g1", "content": "具体目标"}], "suggestedDimensions": [{"id": "motivation", "name": "核心变量", "desc": "解释"}]}`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, _unusedKnowledge: any[]) => {
  const realKnowledge = await fetchDynamicKnowledge(purpose);

  const prompt = `你是一个顶级的高仿真用户生成器。你需要根据【研究目的】生成 ${config.userCount || 4} 个虚拟访谈用户。

  【核心分析步骤】：
  1. 首先判断【研究目的】针对的是 B端（商家/企业主/内部员工）还是 C端（普通个人消费者）。
  2. 如果是B端，生成的职业必须是老板、店长、HR、运营等；如果是C端，职业应为普通网民、白领、学生等。
  3. 如果【内部资料】为空，请依靠你强大的行业经验，合理推演该业务线（如黄页、招聘、房产、金融等）真实存在的用户痛点。
  
  【内部资料（可能有也可能为空）】：
  ${realKnowledge}

  【研究目的】：${purpose}

  【生成要求】：
  1. detail字段必须描述一个极度真实的“场景化痛点”。
  2. 拒绝“注重效率”等套话，要写成“例如：作为饭店老板，平时后厨很忙，最烦APP发那种看不懂的营销短信”。
  必须返回合法JSON数组：
  [{"name": "李雷", "age": 35, "occupation": "餐饮店老板", "coreTraits": { "motivation": { "label": "获客成本敏感", "detail": "具体场景和痛点" } }, "personality_traits": ["精打细算", "急性子"]}]`;
  
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const chatWithUser = async (participant: any, history: any[], input: string, project: any, _unusedKnowledge: any[], image: any) => {
  const realKnowledge = await fetchDynamicKnowledge(project.purpose + " " + input);

  const messages: any[] = [
    { role: 'system', content: `【最高强制指令】
你现在是参与访谈的真实人类。设定：姓名${participant.name}，职业${participant.occupation}，年龄${participant.age}岁。性格：${participant.personality_traits?.join(',')}。

【回答核心法则（违反必罚）】
1. **绝不答非所问！** 仔细阅读对方的问题，对方问“为什么买”，你就回答当初买的原因；对方问“遇到什么困难”，你再吐槽困难！
2. **严禁包含技术术语！** 无论背景资料里有什么，绝对不准说出“API Key、TypeError、系统报错、代码、数据库”等词汇！
3. **极度口语化！** 像在微信里跟朋友聊天，多用“哎、其实、说实话、无语死了”，字数 50-100 字。
4. **禁止列提纲！** 绝对不准使用 1. 2. 3. 进行回答。

【潜意识背景（仅作为参考，必须顺着对方的问题来）】
${realKnowledge}` }
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
