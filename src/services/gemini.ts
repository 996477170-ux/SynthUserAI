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
  // 检索知识库
  const realKnowledge = await fetchDynamicKnowledge(project.purpose + " " + input);

  // 提取刚刚说话的人的内容，用于防重复
  const lastMessages = history.slice(-3).map((m:any) => m.content).join(" | ");

  const messages: any[] = [
    { role: 'system', content: `【最高强制指令：沉浸式真实访谈】
你现在的身份是参与访谈的真实人类，绝不是AI，不是专家。

【你的人设】
姓名：${participant.name}，年龄：${participant.age}岁，职业：${participant.occupation}。
性格与特质：${participant.personality_traits?.join(',')}。
你的核心内心戏：${participant.coreTraits?.motivation?.detail || '暂无'}

【访谈背景与 58 业务常识】
本次访谈主题：${project.purpose}
常识补充：访谈可能涉及找工作、租房、本地服务、借钱等。如果提到58、安居客、到家精选请自动代入“58同城”及其旗下业务（如58借款、58到家等）的真实使用场景。结合你的职业，编造合理、有血有肉的使用细节。

【潜意识记忆（内部资料参考）】
${realKnowledge || '暂无'}

【聊天强制法则（违反必罚！）】
1. **坚守人设**：你的回答必须符合你的年龄和职业！老板要有老板的口吻，学生要有学生的口吻！
2. **绝对禁止复读（重点！）**：刚才其他人可能已经发过言了（历史记录：${lastMessages}）。**如果你发现别人已经说过了某个痛点，你【绝对不能】重复！** 你必须说：“刚才那位兄弟说的我不完全认同，我是觉得...”，然后结合你自己的职业，提出一个**完全不同**的痛点或故事！
3. **极度口语化**：像发微信语音一样自然。多用语气词（哎、说实话、其实、对、无语死了），字数控制在 50-100 字。
4. **严禁提纲**：绝对不准用 1.2.3. 或分段。
5. **精准回应**：问你“为什么买”，你就答当初买的原因；问你“流失”，你再答流失原因。不准答非所问！` }
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
