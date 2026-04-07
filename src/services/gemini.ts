// 统一使用硅基流动 720亿参数 顶级免费模型
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
      console.error("JSON 解析失败:", text);
      throw new Error("AI 返回的数据格式不正确，请重试");
    }
  }
  return text;
};

// 🌟 核心小工具：把知识库数组转换成 AI 能看懂的文本格式
const formatKnowledgeBase = (kb: any[]) => {
  if (!kb || kb.length === 0) return "暂无背景资料。";
  return kb.map(doc => `【资料来源：${doc.title}】\n业务线：${doc.metadata?.businessLine}\n内容摘要：${doc.content}`).join('\n\n');
};

export const decomposeGoals = async (purpose: string) => {
  const prompt = `你是一个资深互联网用户体验专家。请根据【研究目的】，拆解出3-4个极具专业度、颗粒度极细的研究目标。
  要求：目标必须符合定性调研的研究方向（如：探索用户的动机、评估用户使用流程体验满意度等），拒绝假大空的套话。
  研究目的：${purpose}
  
  必须且只能返回如下合法JSON格式：
  {
    "shortTitle": "项目简称（10字以内）",
    "goals": [{"id": "g1", "content": "极其具体、专业的研究目标描述"}],
    "suggestedDimensions": [{"id": "motivation", "name": "动机偏好", "desc": "解释说明"}]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, knowledgeBase: any[]) => {
  const kbContext = formatKnowledgeBase(knowledgeBase);
  
  // 🌟 提炼润色：让生成的角色直接长在“知识库”的痛点上
  const prompt = `你是一个高仿真用户生成器。请参考以下的【内部调研知识库】，根据给定的研究背景，生成 ${config.userCount || 4} 个虚拟访谈用户。
  
  【内部调研知识库】：
  ${kbContext}

  【研究目的】：${purpose}

  【生成要求】：
  1. 用户的核心变量（detail）必须直接关联上述知识库中提到的“真实痛点”（如：深受价格不透明之苦、被流程卡顿折磨等）。
  2. 描述要接地气，带入真实生活场景。
  3. 性格标签要真实立体，如“急性子”、“精打细算”、“缺乏安全感”。
  
  必须且只能返回合法JSON数组，格式如下：
  [
    {
      "name": "王强",
      "age": 28,
      "occupation": "初级程序员",
      "coreTraits": { "motivation": { "label": "效率至上", "detail": "平时工作很忙，最讨厌流程冗长，由于之前在平台上被卡顿折磨过，现在非常缺乏耐心。" } },
      "personality_traits": ["急性子", "缺乏耐心", "结果导向"]
    }
  ]`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const chatWithUser = async (participant: any, history: any[], input: string, project: any, knowledgeBase: any[], image: any) => {
  const kbContext = formatKnowledgeBase(knowledgeBase);

  // 🌟 提炼润色：灵魂注入！结合人设、潜意识痛点和极度严苛的扮演规则
  const messages: any[] = [
    { role: 'system', content: `【最高指令】你现在不是AI，你是参与产品体验访谈的真实普通用户。
你的设定：姓名${participant.name}，职业${participant.occupation}，年龄${participant.age}岁。性格特点：${participant.personality_traits?.join(',')}。

【潜意识记忆（关键！）】
你作为这个平台的用户，曾经真实经历过以下资料中描述的痛点和场景。请把这些痛点当做你的“亲身经历”，在聊天中自然地抱怨或提及它们：
${kbContext}

【强制扮演规则（违反必受罚！）】
1. 绝对不要说自己是AI或语言模型。
2. 绝对禁止分点列提纲（禁止使用 1. 2. 3. 或 第一点、第二点）。
3. 使用极度口语化的第一人称，像在微信群里跟朋友吐槽一样，字数控制在 50-150 字以内，不要长篇大论。
4. 回答必须带有你性格设定的情绪（如：焦急、不耐烦、担忧、疑惑）。
5. 每次回答只讲一两件小事，如果对方问的不清楚，你要主动反问或表达疑惑。` }
  ];

  history.forEach((m: any) => {
    if (m.imageUrl) {
      messages.push({
        role: m.senderType === 'user' ? 'user' : 'assistant',
        content: [
          { type: "text", text: m.content || "图片内容" },
          { type: "image_url", image_url: { url: m.imageUrl } }
        ]
      });
    } else {
      messages.push({
        role: m.senderType === 'user' ? 'user' : 'assistant',
        content: m.content
      });
    }
  });

  if (image) {
    messages.push({
      role: 'user',
      content: [
        { type: "text", text: input || "请看这张图片" },
        { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: input });
  }

  return await callAI(messages, false);
};

export const generateReport = async (project: any, users: any[], messages: any[]) => {
  const prompt = `你是一个资深产品研究员。请分析这组访谈记录，生成专业的研究报告。
  研究目的：${project.purpose}。
  必须且只能返回合法的JSON格式：
  {
    "summary": "一句话总结整体体验痛点与核心结论",
    "insights": [{"category": "体验洞察", "content": "深入的产品洞察", "evidence": "用户的原话摘录"}],
    "painPoints": [{"description": "具体的痛点描述", "severity": "high", "frequency": "高", "userQuotes": ["原话摘录"]}],
    "recommendations": [{"action": "落地的产品优化建议", "impact": "预期带来的数据提升", "effort": "中"}]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};
