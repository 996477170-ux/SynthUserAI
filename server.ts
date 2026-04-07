import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ⚠️ 这里非常重要：因为图片转成代码后非常大，必须把接收限制调到 50mb，否则会报错
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ---- 这里是你的初始数据 (保持不变) ----
  let projects: any[] = [];
  let users: any[] = [];
  let conversations: any[] = [];
  let messages: any[] = [];
  let knowledgeDocs: any[] = [
    { id: '1', title: '58 平台授信未通过用户人群分析', content: '核心痛点：...', status: 'ready', metadata: { businessLine: '金融', tags: ['授信拒绝'] }, createdAt: new Date().toISOString() }
  ];

  // API Routes
  app.get("/api/projects", (req, res) => res.json(projects));
  app.post("/api/projects", (req, res) => { const project = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }; projects.push(project); res.json(project); });
  app.get("/api/projects/:id", (req, res) => res.json(projects.find(p => p.id === req.params.id) || {}));
  app.get("/api/projects/:id/users", (req, res) => res.json(users.filter(u => u.projectId === req.params.id)));
  app.post("/api/users", (req, res) => { const user = { ...req.body, id: Math.random().toString(36).substr(2, 9) }; users.push(user); res.json(user); });
  app.get("/api/knowledge", (req, res) => res.json(knowledgeDocs));
  app.get("/api/conversations/:id", (req, res) => res.json(conversations.find(c => c.id === req.params.id) || {}));
  app.get("/api/conversations/:id/messages", (req, res) => res.json(messages.filter(m => m.conversationId === req.params.id)));
  app.post("/api/messages", (req, res) => { const msg = { ...req.body, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() }; messages.push(msg); res.json(msg); });
  app.post("/api/conversations", (req, res) => { const conv = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }; conversations.push(conv); res.json(conv); });

  // =====================================================================
  // 🌟 AI 万能通信接口 (支持多模态看图)
  // =====================================================================
  app.post("/api/ai", async (req, res) => {
    try {
      const apiKey = process.env.SILICONFLOW_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "服务器未配置 API Key" });
      }

      // 接收前端传来的消息结构和指定的模型
      const { messages, model } = req.body; 

      const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "Pro/MiniMaxAI/MiniMax-M2.5", // 默认使用你指定的 MiniMax
          messages: messages,
          stream: false
        })
      });

      const data = await response.json();
      if (data.error) {
        return res.status(500).json({ error: data.error.message || "AI 接口报错" });
      }
      if (data.choices && data.choices.length > 0) {
        res.json({ result: data.choices[0].message.content });
      } else {
        res.status(500).json({ error: "AI 没有返回有效内容", details: data });
      }
    } catch (error) {
      console.error("AI 接口出错:", error);
      res.status(500).json({ error: "连接 AI 服务器失败" });
    }
  });

  // Vite middleware for development
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
