import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, MessageSquare, FileText, Database, PlusCircle, 
  ChevronRight, ArrowLeft, Search, Settings, BrainCircuit, Zap, Quote, 
  AlertCircle, CheckCircle2, Loader2, Send, Image as ImageIcon, MoreVertical, 
  Download, Share2, Trash2, User as UserIcon, Bot, History, FileSearch, 
  Lightbulb, Target 
} from 'lucide-react';
import { cn } from './lib/utils';
import { Project, SyntheticUser, Message, Conversation, KnowledgeDoc } from './types';

// =====================================================================
// 🌟🌟🌟 新增：替换原 Google Gemini 逻辑，全面接入硅基流动 🌟🌟🌟
// =====================================================================
const callAI = async (messages: any[], requireJson = false) => {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
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
  const prompt = `你是一个资深的用户体验研究员。请根据用户的【研究目的】，拆解出3个具体的研究目标，起一个项目简称，并推荐2个用于区分用户群体的【核心变量】（如动机、决策风格等）。
  研究目的：${purpose}
  必须且只能返回如下合法JSON格式的数据（不要输出任何其他解释文字）：
  {
    "shortTitle": "项目简称（10字以内）",
    "goals": [{"id": "g1", "content": "目标描述"}],
    "suggestedDimensions": [{"id": "motivation", "name": "动机偏好", "desc": "解释说明"}]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};

export const generateSyntheticUsers = async (projectId: string, purpose: string, goals: any[], config: any, knowledgeBase: any[]) => {
  const prompt = `你是一个用户生成器。根据以下研究背景，生成 ${config.userCount} 个虚拟的访谈用户。
  研究目的：${purpose}
  必须且只能返回一个合法的JSON数组，格式如下（不要输出任何其他文字）：
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
  const messages = [
    { role: 'system', content: `你是参与访谈的真实用户。你的设定：姓名${participant.name}，职业${participant.occupation}，年龄${participant.age}岁。特点：${participant.personality_traits?.join(',')}。请完全沉浸在这个角色中回答我的问题，绝对不要说自己是AI。` },
    ...history.map((m: any) => ({ role: m.senderType === 'user' ? 'user' : 'assistant', content: m.content })),
    { role: 'user', content: input }
  ];
  return await callAI(messages, false);
};

export const generateReport = async (project: any, users: any[], messages: any[]) => {
  const prompt = `你是一个研究员。请分析这组访谈记录，生成研究报告。研究目的：${project.purpose}。
  必须且只能返回合法的JSON格式（不要输出任何其他文字）：
  {
    "summary": "一句话总结摘要",
    "insights": [{"category": "体验洞察", "content": "洞察内容", "evidence": "用户原话"}],
    "painPoints": [{"description": "痛点描述", "severity": "high", "frequency": "高", "userQuotes": ["原话"]}],
    "recommendations": [{"action": "建议行动", "impact": "预期影响", "effort": "中"}]
  }`;
  return await callAI([{ role: 'user', content: prompt }], true);
};
// =====================================================================


// --- Components ---
const Button = ({ className, variant = 'primary', size = 'md', ...props }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    outline: 'bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  const sizes: any = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };
  return (
    <button className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...props} />
  );
};

const Card = ({ className, children, ...props }: any) => (
  <div className={cn('bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden', className)} {...props}>{children}</div>
);

const Badge = ({ children, variant = 'default', className, ...props }: any) => {
  const variants: any = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', variants[variant], className)} {...props}>{children}</span>
  );
};

// --- Pages ---
const Home = ({ onCreateProject, onGoToKnowledge }: any) => (
  <div className="max-w-6xl mx-auto px-6 py-12">
    <div className="text-center mb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
        <Zap className="w-4 h-4" /> AI 驱动的用户研究新范式
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
        SynthUser AI <br /> <span className="text-indigo-600">合成用户研究平台</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
        基于真实调研知识库生成高仿真合成用户，让产品团队无需招募真实用户即可进行初步用户研究。
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-4">
        <Button size="lg" className="gap-2" onClick={onCreateProject}><PlusCircle className="w-5 h-5" />开始新项目</Button>
        <Button size="lg" variant="secondary" className="gap-2" onClick={onGoToKnowledge}><Database className="w-5 h-5" />管理知识库</Button>
      </motion.div>
    </div>

    <div className="grid md:grid-cols-3 gap-8 mb-20">
      {[
        { title: '智能用户生成', desc: '基于核心变量与客观变量，从知识库检索真实数据，生成高仿真画像。', icon: BrainCircuit },
        { title: '多种对话模式', desc: '支持 1v1 深度访谈与焦点小组讨论，模拟真实用户互动场景。', icon: MessageSquare },
        { title: '智能报告总结', desc: '对话结束后自动生成结构化报告，包含观点溯源与行动建议。', icon: FileSearch },
      ].map((feature, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
          <Card className="p-8 h-full hover:border-indigo-200 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6"><feature.icon className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

const ProjectNew = ({ onProjectCreated, onBack }: any) => {
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [shortTitle, setShortTitle] = useState('');
  const [suggestedDimensions, setSuggestedDimensions] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const templates = [
    { title: '招聘AI面试间功能测试', content: '我想要全面测试招聘平台 AI 面试间的功能完整性、操作流畅度与技术稳定性，识别功能缺陷和用户体验痛点，为功能迭代优化提供明确依据。' },
    { title: '黄页流失用户调研', content: '针对近期黄页租赁业务用户流失严重的情况，深入了解租赁流失用户的离开原因和需求变化，识别潜在的改进点和机会。' },
  ];

  const handleDecompose = async () => {
    if (!purpose.trim()) return;
    setLoading(true);
    try {
      const result = await decomposeGoals(purpose);
      setGoals(result.goals || []);
      setShortTitle(result.shortTitle || "新项目");
      setSuggestedDimensions(result.suggestedDimensions || []);
      setStep(2);
    } catch (error:any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, goals, shortTitle, suggestedDimensions }),
    });
    const project = await res.json();
    onProjectCreated(project);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Button variant="ghost" className="mb-8 gap-2" onClick={onBack}><ArrowLeft className="w-4 h-4" />返回</Button>
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{step === 1 ? '第一步：输入研究目的' : '第二步：确认研究目标'}</h2>
        <p className="text-gray-600">{step === 1 ? '清晰的研究目的能帮助 AI 更好地拆解目标并生成匹配的用户。' : 'AI 已根据您的研究目的拆解了以下目标，您可以进行编辑或直接确认。'}</p>
      </div>

      {step === 1 ? (
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">模版示例</label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t, i) => (
                <button key={i} onClick={() => setPurpose(t.content)} className="p-3 text-left border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 mb-1">{t.title}</div>
                  <div className="text-xs text-gray-400 line-clamp-1">{t.content}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">研究目的</label>
            <textarea className="w-full h-40 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" placeholder="例如：我想要全面测试招聘平台 AI 面试间的功能完整性..." value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button size="lg" disabled={loading || !purpose.trim()} onClick={handleDecompose}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '智能拆解目标'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {goals.map((goal, i) => (
              <div key={goal.id || i} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mt-1">{i + 1}</div>
                <textarea rows={2} className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-gray-900 resize-none leading-relaxed" value={goal.content} onChange={(e) => { const newGoals = [...goals]; newGoals[i].content = e.target.value; setGoals(newGoals); }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>重新输入</Button>
            <Button size="lg" onClick={handleCreate}>确认并创建项目</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const UserConfig = ({ project, onUsersGenerated, onBack }: any) => {
  const [config, setConfig] = useState({
    userCount: 2,
    subjectiveDimensions: project.suggestedDimensions?.map((d: any) => d.id) || ['motivation'],
  });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generatedUsers = await generateSyntheticUsers(project.id, project.purpose, project.goals, config, []);
      for (const user of generatedUsers) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, projectId: project.id }),
        });
      }
      onUsersGenerated();
    } catch (error: any) {
      alert(error.message || '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Button variant="ghost" className="mb-8 gap-2" onClick={onBack}><ArrowLeft className="w-4 h-4" />返回项目</Button>
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">配置合成用户</h2>
        <p className="text-gray-600">由于选择轻量级模型，已自动精简配置选项，为您快速生成用户。</p>
      </div>
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-4">生成用户数量: {config.userCount} (建议测试阶段选 1-2个)</label>
        <input type="range" min="1" max="4" className="w-full mb-8" value={config.userCount} onChange={e => setConfig({...config, userCount: parseInt(e.target.value)})} />
        <Button size="lg" className="w-full gap-2" disabled={loading} onClick={handleGenerate}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {loading ? 'AI 正在发挥想象力生成用户...' : '开始生成合成用户'}
        </Button>
      </div>
    </div>
  );
};

const Dashboard = ({ project, users, onChat, onReport, onBack }: any) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const toggleUser = (id: string) => setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1" onClick={onBack}><ArrowLeft className="w-4 h-4" />返回首页</Button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 truncate">{project.shortTitle || project.purpose}</h2>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="primary" disabled={selectedUserIds.length === 0} onClick={() => onChat(selectedUserIds)} className="gap-2 shadow-md">
            <MessageSquare className="w-4 h-4" />开始访谈
          </Button>
          <Button variant="secondary" onClick={onReport} className="gap-2"><FileText className="w-4 h-4" />查看报告</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user: any) => (
          <Card key={user.id} className={cn('p-6 cursor-pointer border-2 transition-all', selectedUserIds.includes(user.id) ? 'border-indigo-600 bg-indigo-50/10' : 'border-transparent')} onClick={() => toggleUser(user.id)}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">{user.name?.[0] || 'U'}</div>
              <div><h3 className="font-bold text-gray-900">{user.name}</h3><p className="text-xs text-gray-500">{user.occupation} · {user.age}岁</p></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Chat = ({ project, users, participantIds, onBack, onGenerateReport }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const participants = users.filter((u: any) => participantIds.includes(u.id));

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { senderType: 'user', content: input, id: Date.now().toString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      for (const participant of participants) {
        const aiResponse = await chatWithUser(participant, updatedMessages, input, project, [], null);
        const aiMsg = { senderType: 'synthetic_user', syntheticUserId: participant.id, content: aiResponse, id: Date.now().toString() };
        updatedMessages.push(aiMsg);
        setMessages([...updatedMessages]);
        break; // 简化：单人聊天测试
      }
    } catch (error:any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center"><Button variant="ghost" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button><Button variant="primary" onClick={() => onGenerateReport(messages)}>生成报告</Button></header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-4', msg.senderType === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn('max-w-[80%] p-4 rounded-2xl', msg.senderType === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none')}>{msg.content}</div>
            </div>
          ))}
          {loading && <div><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>}
        </div>
      </div>
      <div className="bg-white border-t p-6"><div className="flex gap-4 max-w-4xl mx-auto"><input className="flex-1 border rounded-xl px-4 py-2" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} /><Button onClick={handleSend}><Send className="w-5 h-5" /></Button></div></div>
    </div>
  );
};

const Knowledge = ({ onBack }: any) => (
  <div className="p-12 text-center"><h2 className="text-2xl font-bold mb-4">知识库功能维护中</h2><Button onClick={onBack}>返回</Button></div>
);

const Report = ({ project, users, messages, onBack }: any) => {
  const [report, setReport] = useState<any>(null);
  useEffect(() => {
    generateReport(project, users, messages).then(setReport).catch(e => alert(e.message));
  }, []);

  if (!report) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-12">
      <Button variant="ghost" className="mb-8" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />返回</Button>
      <h2 className="text-3xl font-bold mb-8">研究报告</h2>
      <Card className="p-6 bg-indigo-50 mb-8"><p className="italic">{report.summary}</p></Card>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectUsers, setProjectUsers] = useState<SyntheticUser[]>([]);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const handleProjectCreated = (project: Project) => { setCurrentProject(project); setView('user-config'); };
  const handleUsersGenerated = async () => {
    if (currentProject) {
      const res = await fetch(`/api/projects/${currentProject.id}/users`);
      setProjectUsers(await res.json());
      setView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {view === 'home' && <Home onCreateProject={() => setView('project-new')} onGoToKnowledge={() => setView('knowledge')} />}
          {view === 'project-new' && <ProjectNew onProjectCreated={handleProjectCreated} onBack={() => setView('home')} />}
          {view === 'user-config' && currentProject && <UserConfig project={currentProject} onUsersGenerated={handleUsersGenerated} onBack={() => setView('home')} />}
          {view === 'dashboard' && currentProject && <Dashboard project={currentProject} users={projectUsers} onChat={(ids:string[]) => {setChatParticipants(ids); setView('chat')}} onReport={() => setView('report')} onBack={() => setView('home')} />}
          {view === 'chat' && currentProject && <Chat project={currentProject} users={projectUsers} participantIds={chatParticipants} onBack={() => setView('dashboard')} onGenerateReport={(msgs:Message[]) => {setChatMessages(msgs); setView('report')}} />}
          {view === 'knowledge' && <Knowledge onBack={() => setView('home')} />}
          {view === 'report' && currentProject && <Report project={currentProject} users={projectUsers} messages={chatMessages} onBack={() => setView('chat')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
