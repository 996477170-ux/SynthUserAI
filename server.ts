import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  let projects: any[] = [];
  let users: any[] = [];
  let conversations: any[] = [];
  let messages: any[] = [];

  app.get("/api/knowledge", (req, res) => res.json([]));

  app.get("/api/projects", (req, res) => res.json(projects));
  app.post("/api/projects", (req, res) => { const project = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }; projects.push(project); res.json(project); });
  app.get("/api/projects/:id", (req, res) => res.json(projects.find(p => p.id === req.params.id) || {}));
  app.get("/api/projects/:id/users", (req, res) => res.json(users.filter(u => u.projectId === req.params.id)));
  app.post("/api/users", (req, res) => { const user = { ...req.body, id: Math.random().toString(36).substr(2, 9) }; users.push(user); res.json(user); });
  app.get("/api/conversations/:id", (req, res) => res.json(conversations.find(c => c.id === req.params.id) || {}));
  app.get("/api/conversations/:id/messages", (req, res) => res.json(messages.filter(m => m.conversationId === req.params.id)));
  app.post("/api/messages", (req, res) => { const msg = { ...req.body, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() }; messages.push(msg); res.json(msg); });
  app.post("/api/conversations", (req, res) => { const conv = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }; conversations.push(conv); res.json(conv); });

  // =====================================================================
  // 🌟 终极智库通道：接入 Coze (扣子) V3 官方 API
  // =====================================================================
  app.post("/api/search-kb", async (req, res) => {
    try {
      const { query } = req.body;
      const cozeApiKey = process.env.COZE_API_KEY;
      const botId = "7632221259367333922"; // 你的 Coze Bot ID

      if (!cozeApiKey) {
        console.warn("未配置 COZE_API_KEY，跳过智库检索");
        return res.json({ result: "" });
      }

      // 1. 向 Coze 发起对话请求
      const chatRes = await fetch('https://api.coze.cn/v3/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cozeApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: botId,
          user_id: "synthuser_system",
          stream: false,
          auto_save_history: false,
          additional_messages: [{
            role: "user",
            content: `请检索你的知识库，提取与此相关的核心痛点和真实用户抱怨：${query}`,
            content_type: "text"
          }]
        })
      });

      const chatData = await chatRes.json();
      if (chatData.code !== 0) throw new Error(chatData.msg || "Coze Chat API 失败");

      const chatId = chatData.data.id;
      const conversationId = chatData.data.conversation_id;

      // 2. 轮询等待 Coze 思考完成（Coze V3 API 必须的步骤）
      let isCompleted = false;
      let attempts = 0;
      while (!isCompleted && attempts < 20) { // 最多等 20 秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusRes = await fetch(`https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`, {
          headers: { 'Authorization': `Bearer ${cozeApiKey}` }
        });
        const statusData = await statusRes.json();
        
        if (statusData.data.status === 'completed') {
          isCompleted = true;
        } else if (statusData.data.status === 'failed' || statusData.data.status === 'canceled') {
          throw new Error("Coze 检索失败");
        }
        attempts++;
      }

      // 3. 去 Coze 拿最终生成的知识库回复
      const msgRes = await fetch(`https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`, {
        headers: { 'Authorization': `Bearer ${cozeApiKey}` }
      });
      const msgData = await msgRes.json();
      
      // 提取助手的回答
      const assistantMessage = msgData.data.find((m: any) => m.role === 'assistant' && m.type === 'answer');
      const resultText = assistantMessage ? assistantMessage.content : "";

      res.json({ result: resultText });

    } catch (error) {
      console.error("Coze 智库搜索失败:", error);
      res.json({ result: "" }); // 如果 Coze 挂了，静默失败，保证前端不崩溃
    }
  });

  // =====================================================================
  // 🌟 硅基流动大模型通道 (保持不变)
  // =====================================================================
  app.post("/api/ai", async (req, res) => {
    try {
      const apiKey = process.env.SILICONFLOW_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "服务器未配置 API Key" });

      const { messages, model } = req.body; 
      const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "Qwen/Qwen2.5-72B-Instruct",
          messages: messages,
          stream: false
        })
      });

      const data = await response.json();
      if (data.error) return res.status(500).json({ error: data.error.message || "AI 报错" });
      if (data.choices && data.choices.length > 0) res.json({ result: data.choices[0].message.content });
      else res.status(500).json({ error: "AI 无有效返回" });
    } catch (error) {
      console.error("AI 接口出错:", error);
      res.status(500).json({ error: "连接 AI 失败" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
