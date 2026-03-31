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

  // In-memory data store for the demo (since no database tool was called yet)
  let projects: any[] = [];
  let users: any[] = [];
  let conversations: any[] = [];
  let messages: any[] = [];
  let knowledgeDocs: any[] = [
    {
      id: '1',
      title: '58 平台授信未通过用户人群分析',
      content: '核心痛点：用户由于多平台比价、短期资金需求、难以提供资信证明或金融知识薄弱等原因被误判。业务结论：需平衡材料难易度，引入多元辅助证明。',
      status: 'ready',
      metadata: { businessLine: '金融', tags: ['授信拒绝', '用户画像'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: '58社区2.0体验升级调研报告',
      content: '核心痛点：操作体验不佳、激励反馈滞后。业务结论：优化基础工具，建立透明激励机制，强化内容本地化。',
      status: 'ready',
      metadata: { businessLine: '社区', tags: ['体验升级', '圈主'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: '招聘用户次日流失原因研究报告',
      content: '核心痛点：职位匹配度低及回复时效性低。业务结论：提升推荐精确度，优化企业端回复时效。',
      status: 'ready',
      metadata: { businessLine: '招聘', tags: ['流失分析', '职位匹配'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      title: '大师兄商家营销调研访谈小结',
      content: '核心痛点：营销转化差、文案创作压力大。业务结论：丰富模板行业分类，提升内容故事性，优化一键发布。',
      status: 'ready',
      metadata: { businessLine: '黄页', tags: ['商家营销', 'AI工具'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      title: '到家用户流失原因研究报告',
      content: '核心痛点：价格过高/不透明、服务质量不佳。业务结论：提升价格透明度，优化服务标准化。',
      status: 'ready',
      metadata: { businessLine: '到家', tags: ['用户流失', '价格透明'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '6',
      title: '本地服务用户小结',
      content: '核心痛点：信息展示不全、筛选维度缺失。业务结论：优化搜索匹配，建立标准化评价体系。',
      status: 'ready',
      metadata: { businessLine: '黄页', tags: ['本地服务', '信息展示'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '7',
      title: '黄页租赁用户流失原因研究报告',
      content: '核心痛点：租赁流程低效、信息不透明。业务结论：推进价格透明化，强化商家资质审核。',
      status: 'ready',
      metadata: { businessLine: '黄页', tags: ['租赁流失', '流程优化'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '8',
      title: '教育培训 CATI 小结',
      content: '核心痛点：线下成单率低，商家响应慢。业务结论：优化履约响应机制，强化专业度背书。',
      status: 'ready',
      metadata: { businessLine: '教育', tags: ['CATI调研', '转化率'] },
      createdAt: new Date().toISOString()
    },
    {
      id: '9',
      title: '金融会员卡流失用户调研报告',
      content: '核心痛点：价格与价值不匹配、权益不信任。业务结论：提供灵活付费模式，优化权益视觉呈现。',
      status: 'ready',
      metadata: { businessLine: '金融', tags: ['会员卡', '权益设计'] },
      createdAt: new Date().toISOString()
    }
  ];

  // API Routes
  app.get("/api/projects", (req, res) => res.json(projects));
  app.post("/api/projects", (req, res) => {
    const project = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    projects.push(project);
    res.json(project);
  });

  app.get("/api/projects/:id", (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    res.json(project || {});
  });

  app.get("/api/projects/:id/users", (req, res) => {
    res.json(users.filter(u => u.projectId === req.params.id));
  });

  app.post("/api/users", (req, res) => {
    const user = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
    users.push(user);
    res.json(user);
  });

  app.get("/api/knowledge", (req, res) => res.json(knowledgeDocs));

  app.get("/api/conversations/:id", (req, res) => {
    const conv = conversations.find(c => c.id === req.params.id);
    res.json(conv || {});
  });

  app.get("/api/conversations/:id/messages", (req, res) => {
    res.json(messages.filter(m => m.conversationId === req.params.id));
  });

  app.post("/api/messages", (req, res) => {
    const msg = { ...req.body, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() };
    messages.push(msg);
    res.json(msg);
  });

  app.post("/api/conversations", (req, res) => {
    const conv = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    conversations.push(conv);
    res.json(conv);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
