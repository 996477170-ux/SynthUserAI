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
  // 🌟 智库搜索通道 (加入了你截图里的 filters 参数)
  // =====================================================================
  app.post("/api/search-kb", async (req, res) => {
    try {
      const { query } = req.body;
      const uxApiKey = process.env.UX_KNOWLEDGE_KEY;

      if (!uxApiKey) {
        return res.json({ result: "未配置内部智库密钥，没有背景资料。" });
      }

      const response = await fetch("http://152.136.139.107/api/search/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": uxApiKey
        },
        body: JSON.stringify({
          query: query,
          top_k: 3,
          filters: {
            source_types: ["微信文章", "用研报告"] // 👈 这里加上了你截图里的必要参数
          },
          use_vector: true,
          readable: true
        })
      });

      const data = await response.json();
      res.json({ result: JSON.stringify(data) });

    } catch (error) {
      console.error("智库搜索失败:", error);
      res.json({ result: "智库搜索超时或失败，暂无背景资料。" }); 
    }
  });

  // =====================================================================
  // 🌟 硅基流动大模型通道
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
