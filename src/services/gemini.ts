// 我们在此处统一管理使用的模型
// 如果发图片时报错，说明 MiniMax 不支持看图，请把下面的名字换成 "OpenGVLab/InternVL2-26B" 即可！
const AI_MODEL = "Pro/MiniMaxAI/MiniMax-M2.5"; 

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

export const decomposeGoals = async (purpose: string) => {
  const prompt = `你是一个资深的用户体验研究员。请根据用户的【研究目的】，拆解出3个具体的研究目标，起一个项目简称，并推荐2个用于区分用户群体的【核心变量】。
  研究目的：${purpose}
  必须且只能返回如下合法JSON格式的数据：
  {
    "shortTitle": "项目简称（10字以内）",
    "goals": [{"id": "g1", "content": "目标描述"}],
    "suggestedDimensions": [{"id": "motivation", "name": "动机偏好", "desc": "解释说明"}]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, knowledgeBase: any[]) => {
  const prompt = `你是一个用户生成器。根据以下研究背景，生成 ${config.userCount || 4} 个虚拟的访谈用户。
  研究目的：${purpose}
  必须且只能返回一个合法的JSON数组，格式如下：
  [
    {
      "name": "张三",
      "age": 28,
      "occupation": "产品经理",
      "coreTraits": { "motivation": { "label": "效率至上", "detail": "非常看重时间成本" } },
      "personality_traits": ["理性", "急躁"]
    }
  ]`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const chatWithUser = async (participant: any, history: any[], input: string, project: any, knowledgeBase: any[], image: any) => {
  // 1. 放入系统角色设定
  const messages: any[] = [
    { role: 'system', content: `你是参与访谈的真实用户。设定：姓名${participant.name}，职业${participant.occupation}，年龄${participant.age}岁。特点：${participant.personality_traits?.join(',')}。绝对不要说自己是AI。` }
  ];

  // 2. 梳理历史聊天记录（兼顾历史图片）
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

  // 3. 放入当前用户发出的最新一句话（兼顾最新图片）
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
  const prompt = `你是一个研究员。请分析这组访谈记录，生成研究报告。研究目的：${project.purpose}。
  必须且只能返回合法的JSON格式：
  {
    "summary": "一句话总结摘要",
    "insights": [{"category": "体验洞察", "content": "洞察内容", "evidence": "用户原话"}],
    "painPoints": [{"description": "痛点描述", "severity": "high", "frequency": "高", "userQuotes": ["原话"]}],
    "recommendations": [{"action": "建议行动", "impact": "预期影响", "effort": "中"}]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};
