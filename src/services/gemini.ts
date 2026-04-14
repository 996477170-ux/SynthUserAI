// 统一使用硅基流动 720亿参数的顶级免费模型
const AI_MODEL = "Qwen/Qwen2.5-72B-Instruct"; 

// 呼叫大模型
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
      console.error("JSON 解析失败:", text);
      throw new Error("AI 返回格式错误，请重试");
    }
  }
  return text;
};

// 🌟 核心引擎：呼叫后端，去你们的 152 智库调取真实业务资料！
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
    return "获取背景资料失败。";
  }
};

export const decomposeGoals = async (purpose: string) => {
  const prompt = `你是一个资深互联网用户体验专家。请根据【研究目的】，拆解出3个极具专业度、颗粒度极细的研究目标。拒绝假大空套话。
  研究目的：${purpose}
  必须返回合法JSON格式：
  {"shortTitle": "项目简称（10字以内）", "goals": [{"id": "g1", "content": "具体目标"}], "suggestedDimensions": [{"id": "motivation", "name": "核心变量", "desc": "解释"}]}`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, _unusedKnowledge: any[]) => {
  // 🚀 每次生成用户前，自动去 152 智库拉取最新资料！
  const realKnowledge = await fetchDynamicKnowledge(purpose);

  const prompt = `你是一个高仿真用户生成器。请高度参考以下的【内部调研知识库资料】，根据研究目的生成 ${config.userCount || 4} 个虚拟访谈用户。
  
  【内部调研资料摘要】：
  ${realKnowledge}

  【研究目的】：${purpose}

  【生成要求】：
  1. 用户的核心变量（detail）必须直接关联上述资料中提到的“真实业务痛点”。
  2. 描述要接地气，带入真实生活场景。
  3. 性格标签要真实立体。
  必须返回合法JSON数组：
  [{"name": "王强", "age": 28, "occupation": "产品经理", "coreTraits": { "motivation": { "label": "效率至上", "detail": "关联资料痛点的具体描述" } }, "personality_traits": ["急性子"]}]`;
  
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const chatWithUser = async (participant: any, history: any[], input: string, project: any, _unusedKnowledge: any[], image: any) => {
  // 🚀 每次聊天互动时，根据用户的提问，再次去 152 智库精准检索最新痛点！
  const realKnowledge = await fetchDynamicKnowledge(project.purpose + " " + input);

  const messages: any[] = [
    { role: 'system', content: `【最高指令】你是参与产品体验访谈的真实普通用户。
设定：姓名${participant.name}，职业${participant.occupation}，年龄${participant.age}岁。性格特点：${participant.personality_traits?.join(',')}。

【潜意识记忆（关键！）】
你曾真实经历过以下内部资料中描述的痛点。请把这些痛点当做你的“亲身经历”，在聊天中自然地抱怨出来：
${realKnowledge}

【强制扮演规则】
1. 绝对不要说自己是AI。
2. 绝对禁止分点列提纲（如 1. 2. 3.）。
3. 使用极度口语化的第一人称，像在微信群里跟朋友吐槽，字数控制在 50-150 字以内。
4. 回答必须带有你性格设定的情绪。每次回答只讲一两件小事，不要长篇大论。` }
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
