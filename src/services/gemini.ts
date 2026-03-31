import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function decomposeGoals(purpose: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你是一个专业的用户研究专家。请根据以下研究目的，完成以下任务：
    1. 拆解出3-5个具体、精炼的研究目标。
    2. 将冗长的研究目的总结提炼成一个5-10个字左右的短标题。
    3. 基于研究目的，推荐3个最核心的用户研究维度（核心变量），并为每个维度提供具体的取值范围描述（例如：动机偏好：追求效率 vs 追求品质 vs 追求性价比）。
    
    研究目的：${purpose}
    
    要求：
    1. 目标描述要简洁明了，避免冗长。
    2. 每个目标必须是可衡量的。
    3. 核心变量要与研究目的高度相关，能体现出用户的本质差异。
    4. 以JSON格式返回，包含 goals (数组), shortTitle (字符串) 和 suggestedDimensions (数组，每个对象包含 id, name, desc) 字段。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["id", "content"]
            }
          },
          shortTitle: { type: Type.STRING },
          suggestedDimensions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                desc: { type: Type.STRING }
              },
              required: ["id", "name", "desc"]
            }
          }
        },
        required: ["goals", "shortTitle", "suggestedDimensions"]
      }
    }
  });
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse goals:", response.text);
    return { goals: [], shortTitle: "未命名项目", suggestedDimensions: [] };
  }
}

export async function generateSyntheticUsers(projectId: string, purpose: string, goals: any[], config: any, knowledgeBase: any[]) {
  const prompt = `你是一个用户研究专家。基于以下研究背景和提供的知识库，生成 ${config.userCount || 4} 个具有代表性的合成用户。
  研究目的：${purpose}
  研究目标：${JSON.stringify(goals)}
  用户配置要求：${JSON.stringify(config)}
  参考知识库：${JSON.stringify(knowledgeBase)}
  
  关键要求：
  1. 核心变量差异：每个合成用户在核心变量（${config.subjectiveDimensions.join(', ')}）上必须有本质的差异，体现不同的动机、态度和行为模式。
  2. 知识库驱动：从知识库中提取相关的场景、痛点和用户原话，并将其深度绑定到每个合成用户的画像中。
  3. 客观变量约束：严格遵守配置中的客观变量范围。
  
  返回格式要求：
  必须返回一个JSON数组，每个对象包含：
  - name: 姓名
  - age: 年龄
  - gender: 性别
  - occupation: 职业
  - city_tier: 城市线级
  - coreTraits: 一个对象，key是核心变量名，value包含 label (标签) 和 detail (详细描述)
  - personality_traits: 数组，性格标签
  - background: 背景故事
  - bound_knowledge: 对象，包含 scenarios (场景数组), painPoints (痛点数组), quotes (原话数组)
  
  请确保返回的是合法的JSON。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    const text = response.text.trim();
    // Handle potential markdown code blocks
    const jsonStr = text.startsWith('```') ? text.replace(/```json|```/g, '') : text;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse users:", response.text);
    throw new Error("生成合成用户失败，请重试。");
  }
}

export async function chatWithUser(
  user: any, 
  history: any[], 
  message: string, 
  projectContext: { purpose: string; goals: any[] },
  knowledgeBase: any[],
  image?: { data: string; mimeType: string }
) {
  const systemInstruction = `你是 ${user.name}，一个真实的用户。
  你的画像：${JSON.stringify(user)}
  研究背景：${projectContext.purpose}
  全局知识库参考：${JSON.stringify(knowledgeBase)}
  
  请以你的身份回复研究者的提问。
  
  回复原则：
  1. **身份一致性**：你的回答必须严丝合缝地符合你的画像、背景故事和核心变量。不要表现出任何AI助手的痕迹，你就是一个真实的人。
  2. **真实对话感**：使用口语化的表达，带点情绪或个人色彩，不要像AI助手那样礼貌而空洞。
  3. **有理有据**：
     - 优先深度结合你绑定的专属知识（${JSON.stringify(user.bound_knowledge)}）以及全局知识库。
     - 如果知识库中没有直接相关内容，请利用你的常识和联网搜索能力，寻找现实世界中该类用户最普遍、最高频的行为和痛点进行推理。
     - 你的回答要让研究者相信你是一个真实存在的人，有着真实的经历。
  4. **细节丰富**：在描述场景和痛点时，引用具体的细节或类似原话的表达，增加可信度。
  5. **精炼表达**：说话要精炼，不要长篇大论。每次发言尽量控制在 2-3 句话以内，除非研究者要求详细说明。
  6. **视觉与交互识别（当有图片时）**：如果研究者上传了原型图、APP截图或设计稿，请作为该用户，从你的视角出发，识别其中的视觉设计、交互逻辑等。
     - 给出你作为该画像用户的真实感受（如：这个按钮太小了，我看不清；这个颜色太刺眼了，我不喜欢）。
     - 提供基于你人设的视觉和交互建议。
  7. **自然结构**：可以有简单的逻辑结构，但要保持自然的对话感。`;

  const historyWithoutImages = history.map(m => {
    const { imageUrl, ...rest } = m;
    return rest;
  });

  const contents: any[] = [
    { role: 'user', parts: [{ text: `历史对话：${JSON.stringify(historyWithoutImages)}` }] }
  ];

  const userParts: any[] = [{ text: message }];
  if (image) {
    userParts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  contents.push({ role: 'user', parts: userParts });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }]
    },
  });

  return response.text;
}

export async function generateReport(project: any, users: any[], messages: any[]) {
  const prompt = `你是一个资深用户研究专家。请基于以下研究项目和对话记录，生成一份具有深度洞察力的专业研究报告。
  
  项目目的：${project.purpose}
  合成用户画像：${JSON.stringify(users.map(u => ({ name: u.name, traits: u.coreTraits, background: u.background })))}
  对话记录：${JSON.stringify(messages.map(m => ({ sender: m.senderType, content: m.content })))}
  
  要求：
  1. 洞察必须基于对话证据，不能凭空捏造。
  2. 痛点分析要区分严重程度。
  3. 建议要具体且具有可操作性。
  
  请严格按照以下JSON格式返回。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "整体摘要" },
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "洞察类别" },
                content: { type: Type.STRING, description: "洞察内容" },
                evidence: { type: Type.STRING, description: "用户证据引用" }
              },
              required: ["category", "content", "evidence"]
            }
          },
          painPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "痛点描述" },
                severity: { type: Type.STRING, enum: ["high", "medium", "low"], description: "严重程度" },
                frequency: { type: Type.STRING, description: "提及频率" },
                userQuotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "相关用户原话" }
              },
              required: ["description", "severity", "frequency", "userQuotes"]
            }
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: "建议行动" },
                impact: { type: Type.STRING, description: "预期影响" },
                effort: { type: Type.STRING, description: "实施难度" }
              },
              required: ["action", "impact", "effort"]
            }
          }
        },
        required: ["summary", "insights", "painPoints", "recommendations"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse report:", response.text);
    throw new Error("生成报告失败，请重试。");
  }
}
