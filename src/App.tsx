import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  FileText, 
  Database, 
  PlusCircle, 
  ChevronRight, 
  ArrowLeft,
  Search,
  Settings,
  BrainCircuit,
  Zap,
  Quote,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Image as ImageIcon,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  User as UserIcon,
  Bot,
  History,
  FileSearch,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from './lib/utils';
import { Project, SyntheticUser, Message, Conversation, KnowledgeDoc } from './types';
import { decomposeGoals, generateSyntheticUsers, chatWithUser, generateReport } from './services/gemini';

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
    <button 
      className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} 
      {...props} 
    />
  );
};

const Card = ({ className, children, ...props }: any) => (
  <div className={cn('bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
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
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

// --- Pages ---

const Home = ({ onCreateProject, onGoToKnowledge }: any) => (
  <div className="max-w-6xl mx-auto px-6 py-12">
    <div className="text-center mb-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6"
      >
        <Zap className="w-4 h-4" />
        AI 驱动的用户研究新范式
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight"
      >
        SynthUser AI <br />
        <span className="text-indigo-600">合成用户研究平台</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        基于真实调研知识库生成高仿真合成用户，让产品团队无需招募真实用户即可进行初步用户研究。
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <Button size="lg" className="gap-2" onClick={onCreateProject}>
          <PlusCircle className="w-5 h-5" />
          开始新项目
        </Button>
        <Button size="lg" variant="secondary" className="gap-2" onClick={onGoToKnowledge}>
          <Database className="w-5 h-5" />
          管理知识库
        </Button>
      </motion.div>
    </div>

    <div className="grid md:grid-cols-3 gap-8 mb-20">
      {[
        { title: '智能用户生成', desc: '基于核心变量与客观变量，从知识库检索真实数据，生成高仿真画像。', icon: BrainCircuit },
        { title: '多种对话模式', desc: '支持 1v1 深度访谈与焦点小组讨论，模拟真实用户互动场景。', icon: MessageSquare },
        { title: '智能报告总结', desc: '对话结束后自动生成结构化报告，包含观点溯源与行动建议。', icon: FileSearch },
      ].map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.1 }}
        >
          <Card className="p-8 h-full hover:border-indigo-200 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
              <feature.icon className="w-6 h-6" />
            </div>
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
  // 🌟 新增1：声明一个状态，用来临时存放 AI 推测出的目标群体身份
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]); 
  const [step, setStep] = useState(1);

  const templates = [
    { title: '招聘AI面试间功能测试', content: '我想要全面测试招聘平台 AI 面试间的功能完整性、操作流畅度与技术稳定性，识别功能缺陷和用户体验痛点，为功能迭代优化提供明确依据。' },
    { title: '黄页流失用户调研', content: '针对近期黄页租赁业务用户流失严重的情况，深入了解租赁流失用户的离开原因和需求变化，识别潜在的改进点和机会。' },
    { title: '金融会员卡体验优化', content: '目前金融会员卡用户流失率较高，期望通过流失用户调研，深入了解其离开的真实原因，为产品优化和服务提升提供数据支持。' },
    { title: '租房视频找房功能探索', content: '探索用户对租房平台视频找房功能的认知情况、操作体验、痛点障碍以及改进期望，评估该功能的价值。' },
  ];

  const handleDecompose = async () => {
    if (!purpose.trim()) return;
    setLoading(true);
    try {
      const result = await decomposeGoals(purpose);
      setGoals(result.goals || []);
      setShortTitle(result.shortTitle || '未命名研究');
      setSuggestedDimensions(result.suggestedDimensions || []);
      // 🌟 新增2：从 AI 的返回结果中，把推测的身份存下来
      setSuggestedRoles(result.suggestedRoles || []); 
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 🌟 新增3：极其重要！把 suggestedRoles 一并打包发给服务器保存
      body: JSON.stringify({ purpose, goals, shortTitle, suggestedDimensions, suggestedRoles }),
    });
    const project = await res.json();
    onProjectCreated(project);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Button variant="ghost" className="mb-8 gap-2" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />
        返回
      </Button>

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {step === 1 ? '第一步：输入研究目的' : '第二步：确认研究目标'}
        </h2>
        <p className="text-gray-600">
          {step === 1 ? '清晰的研究目的能帮助 AI 更好地拆解目标并生成匹配的用户。' : 'AI 已根据您的研究目的拆解了以下目标，您可以进行编辑或直接确认。'}
        </p>
      </div>

      {step === 1 ? (
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">模版示例</label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPurpose(t.content)}
                  className="p-3 text-left border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 mb-1">{t.title}</div>
                  <div className="text-xs text-gray-400 line-clamp-1">{t.content}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">研究目的</label>
            <textarea
              className="w-full h-40 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="例如：我想要全面测试招聘平台 AI 面试间的功能完整性..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
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
              <div key={goal.id} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mt-1">
                  {i + 1}
                </div>
                <textarea
                  rows={2}
                  className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-gray-900 resize-none leading-relaxed"
                  value={goal.content}
                  onChange={(e) => {
                    const newGoals = [...goals];
                    newGoals[i].content = e.target.value;
                    setGoals(newGoals);
                  }}
                />
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

const resizeImage = (base64: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

const UserConfig = ({ project, onUsersGenerated, onBack }: any) => {
  const [config, setConfig] = useState({
    subjectiveDimensions: project.suggestedDimensions?.map((d: any) => d.id) || ['motivation', 'decision_style'],
    customDimensions: '',
    selectedObjectiveVariables: [] as string[],
    // 🌟 新增：默认选中 AI 推测出的目标群体角色
    selectedRoles: project.suggestedRoles || [], 
    userCount: 4,
    ageRange: { min: 20, max: 40 },
    genderRatio: 50,
    cityTierRange: ['一线', '新一线'],
    incomeRange: { min: 5000, max: 20000 },
    educationRange: ['本科'],
    usageTimeRange: ['1个月', '半年'],
    usageFrequency: ['每天'],
  });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (config.subjectiveDimensions.length === 0 && !config.customDimensions) {
      alert('请至少选择或输入一个核心变量');
      return;
    }
    setLoading(true);
    try {
      const finalDimensions = [...config.subjectiveDimensions];
      if (config.customDimensions) {
        finalDimensions.push(...config.customDimensions.split(',').map(d => d.trim()));
      }
      
      const generatedUsers = await generateSyntheticUsers(project.id, project.purpose, project.goals, {
        ...config,
        subjectiveDimensions: finalDimensions,
        customObjectiveVariables: customObjective,
        incomeRange: config.selectedObjectiveVariables.includes('income') 
          ? `${config.incomeRange.min} - ${config.incomeRange.max} 元/月` 
          : undefined,
        usageTimeRange: config.selectedObjectiveVariables.includes('usage_time')
          ? config.usageTimeRange.join(', ')
          : undefined
      }, []); 
      
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

  const objectiveVariables = [
    { id: 'age', name: '年龄', type: 'range' },
    { id: 'gender', name: '性别', type: 'ratio' },
    { id: 'city_tier', name: '城市线级', type: 'multi', options: ['一线', '新一线', '二线', '三线', '四线及以下'] },
    { id: 'income', name: '月收入', type: 'range' },
    { id: 'education', name: '学历', type: 'multi', options: ['初中及以下', '高中', '大专', '本科', '硕士及以上'] },
    { id: 'usage_time', name: '使用时间', type: 'multi', options: ['刚使用', '1个月', '半年', '1年', '3年', '5年及以上'] },
    { id: 'usage_frequency', name: '使用频率', type: 'multi', options: ['每天', '每周 3-5 次', '每周 1-2 次', '偶尔', '几乎不用'] },
  ];

  const [customObjective, setCustomObjective] = useState('');

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Button variant="ghost" className="mb-8 gap-2" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />
        返回项目
      </Button>

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">配置合成用户</h2>
        <p className="text-gray-600">核心变量决定用户本质差异，客观变量控制群体分布。</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              核心变量（内在心理维度）
            </h3>
            <p className="text-xs text-gray-500 mb-4">必选，无需全选。勾选维度为用户核心区分依据。</p>
            <div className="space-y-3 mb-4">
              {(project.suggestedDimensions || [
                { id: 'motivation', name: '动机偏好', desc: '追求效率 vs 追求品质 vs 追求性价比' },
                { id: 'decision_style', name: '决策风格', desc: '理性分析型 vs 感性直觉型 vs 从众型' },
                { id: 'values', name: '价值观', desc: '效率至上 vs 品质优先 vs 社交认同' },
              ]).map((dim: any) => (
                <label key={dim.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                    checked={config.subjectiveDimensions.includes(dim.id)}
                    onChange={(e) => {
                      const dims = e.target.checked 
                        ? [...config.subjectiveDimensions, dim.id]
                        : config.subjectiveDimensions.filter(d => d !== dim.id);
                      setConfig({ ...config, subjectiveDimensions: dims });
                    }}
                  />
                  <div>
                    <div className="font-bold text-gray-900">{dim.name}</div>
                    <div className="text-sm text-gray-500">{dim.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">自定义核心变量 (逗号分隔)</label>
              <input
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：价格敏感度, 品牌忠诚度"
                value={config.customDimensions}
                onChange={(e) => setConfig({ ...config, customDimensions: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* 🌟 新增：目标群体身份确认区块 */}
          {project.suggestedRoles && project.suggestedRoles.length > 0 && (
            <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 shadow-sm">
              <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                目标群体身份 (AI 推断)
              </h3>
              <p className="text-xs text-indigo-600/80 mb-4">请勾选本次研究针对的具体身份，AI 将仅在所选身份内生成职业（如租客/房东等）。</p>
              <div className="flex flex-wrap gap-2">
                {project.suggestedRoles.map((role: string) => (
                  <label key={role} className={cn("px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-all flex items-center gap-2", config.selectedRoles.includes(role) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300")}>
                    <input type="checkbox" className="hidden" checked={config.selectedRoles.includes(role)} onChange={(e) => {
                      const roles = e.target.checked ? [...config.selectedRoles, role] : config.selectedRoles.filter(r => r !== role);
                      setConfig({ ...config, selectedRoles: roles });
                    }} />
                    {role}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              客观变量（人口统计特征）
            </h3>
            <p className="text-xs text-gray-500 mb-4">非必填。勾选后，用户在选定特征范围内生成。</p>
            <div className="space-y-4">
              {objectiveVariables.map((v) => (
                <div key={v.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        checked={config.selectedObjectiveVariables.includes(v.id)}
                        onChange={(e) => {
                          const vars = e.target.checked 
                            ? [...config.selectedObjectiveVariables, v.id]
                            : config.selectedObjectiveVariables.filter(id => id !== v.id);
                          setConfig({ ...config, selectedObjectiveVariables: vars });
                        }}
                      />
                      <span className="font-bold text-gray-900">{v.name}</span>
                    </label>
                  </div>
                  
                  {config.selectedObjectiveVariables.includes(v.id) && (
                    <div className="pl-6 space-y-4">
                      {v.type === 'range' && (v.id === 'age' || v.id === 'income') && (
                        <div className="flex gap-4 items-center">
                          <input 
                            type="number" 
                            className="w-20 p-2 border rounded-lg text-sm" 
                            value={v.id === 'age' ? config.ageRange.min : config.incomeRange.min} 
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              if (v.id === 'age') setConfig({...config, ageRange: {...config.ageRange, min: val}});
                              else setConfig({...config, incomeRange: {...config.incomeRange, min: val}});
                            }} 
                          />
                          <span className="text-gray-400">-</span>
                          <input 
                            type="number" 
                            className="w-20 p-2 border rounded-lg text-sm" 
                            value={v.id === 'age' ? config.ageRange.max : config.incomeRange.max} 
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              if (v.id === 'age') setConfig({...config, ageRange: {...config.ageRange, max: val}});
                              else setConfig({...config, incomeRange: {...config.incomeRange, max: val}});
                            }} 
                          />
                          <span className="text-xs text-gray-500">{v.id === 'age' ? '岁' : '元/月'}</span>
                        </div>
                      )}
                      {v.type === 'ratio' && v.id === 'gender' && (
                        <div className="space-y-2">
                          <input type="range" className="w-full" value={config.genderRatio} onChange={e => setConfig({...config, genderRatio: parseInt(e.target.value)})} />
                          <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>男: {config.genderRatio}%</span>
                            <span>女: {100 - config.genderRatio}%</span>
                          </div>
                        </div>
                      )}
                      {v.type === 'multi' && v.options && (
                        <div className="flex flex-wrap gap-2">
                          {v.options.map(opt => (
                            <button
                              key={opt}
                              onClick={() => {
                                const key = v.id === 'city_tier' ? 'cityTierRange' : v.id === 'education' ? 'educationRange' : v.id === 'usage_time' ? 'usageTimeRange' : 'usageFrequency';
                                const current = (config as any)[key];
                                const next = current.includes(opt) ? current.filter((o: any) => o !== opt) : [...current, opt];
                                setConfig({...config, [key]: next});
                              }}
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                                (config as any)[v.id === 'city_tier' ? 'cityTierRange' : v.id === 'education' ? 'educationRange' : v.id === 'usage_time' ? 'usageTimeRange' : 'usageFrequency'].includes(opt)
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <label className="block text-sm font-bold text-gray-900 mb-2">自定义客观变量</label>
                <input
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：是否为付费会员, 所在行业"
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">生成用户数量: {config.userCount}</label>
            <input type="range" min="1" max="6" className="w-full mb-8" value={config.userCount} onChange={e => setConfig({...config, userCount: parseInt(e.target.value)})} />
            
            <Button size="lg" className="w-full gap-2" disabled={loading} onClick={handleGenerate}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? '正在检索知识库并生成用户...' : '开始生成合成用户'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ project, users, onChat, onReport, onBack }: any) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  // 🌟 新增：用于控制弹窗展示哪个用户
  const [detailUser, setDetailUser] = useState<any>(null);

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1 text-gray-500 hover:text-indigo-600" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 truncate" title={project.purpose}>
            {project.shortTitle || project.purpose}
          </h2>
          <p className="text-sm text-gray-500 mb-4">点击卡片主体查看详细画像；点击卡片右上角勾选访谈对象。</p>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="primary" className="normal-case py-1 px-3">项目 ID: {project.id}</Badge>
            <Badge variant="success" className="normal-case py-1 px-3">已生成 {users.length} 个合成用户</Badge>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button 
            variant="primary" 
            disabled={selectedUserIds.length === 0}
            onClick={() => onChat(selectedUserIds)}
            className="gap-2 shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            {selectedUserIds.length > 1 ? `焦点小组 (${selectedUserIds.length})` : '1V1 深度访谈'}
          </Button>
          <Button variant="secondary" onClick={onReport} className="gap-2">
            <FileText className="w-4 h-4" />
            查看报告
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {users.map((user: any) => (
          <Card 
            key={user.id} 
            className={cn(
              'p-6 cursor-pointer transition-all border-2 relative group flex flex-col h-full hover:shadow-xl hover:-translate-y-1',
              selectedUserIds.includes(user.id) ? 'border-indigo-600 ring-4 ring-indigo-50 bg-indigo-50/10' : 'border-transparent hover:border-indigo-200'
            )}
            onClick={() => setDetailUser(user)} // 🌟 修复：点击卡片主体弹出详情
          >
            {/* 🌟 修复：勾选框独立，阻止冒泡 */}
            <div 
              onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }}
              className={cn(
              "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all z-10 hover:scale-110",
              selectedUserIds.includes(user.id) 
                ? "bg-indigo-600 border-indigo-600 text-white" 
                : "bg-white border-gray-200 text-transparent group-hover:border-indigo-300"
            )}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                {user.name[0]}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{user.name}</h3>
                <p className="text-xs text-gray-500 truncate">{user.occupation} · {user.age}岁</p>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 mb-5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">核心变量 (本质差异)</div>
                {Object.entries(user.coreTraits || {}).map(([key, trait]: any) => {
                  const translatedKey: any = {
                    motivation: '动机',
                    decision_style: '决策风格',
                    values: '价值观'
                  };
                  return (
                    <div key={key} className="mb-2 last:mb-0">
                      <div className="text-xs font-bold text-indigo-600">
                        {project.suggestedDimensions?.find((d: any) => d.id === key)?.name || (translatedKey[key] || key)}: {trait.label}
                      </div>
                      <div className="text-[11px] text-gray-600 leading-relaxed mt-0.5 line-clamp-3">{trait.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {user.personality_traits?.slice(0, 3).map((trait: string) => (
                <Badge key={trait} className="bg-white border border-gray-100">{trait}</Badge>
              ))}
              {user.personality_traits?.length > 3 && (
                <Badge className="bg-white border border-gray-100">+{user.personality_traits.length - 3}</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 🌟 新增：用户详情模态窗 */}
      <AnimatePresence>
        {detailUser && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">{detailUser.name[0]}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{detailUser.name}</h2>
                    <p className="text-gray-500">{detailUser.occupation} · {detailUser.age}岁</p>
                  </div>
                </div>
                <button onClick={() => setDetailUser(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-gray-50/50">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> 性格特质</h3>
                  <div className="flex flex-wrap gap-2">{detailUser.personality_traits?.map((t:string) => <span key={t} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">{t}</span>)}</div>
                </section>
                
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> 核心内在维度</h3>
                  <div className="space-y-4">
                    {Object.entries(detailUser.coreTraits || {}).map(([key, trait]: any) => (
                      <div key={key} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-sm font-bold text-indigo-600 mb-2">{trait.label}</div>
                        <div className="text-sm text-gray-700 leading-relaxed">{trait.detail}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Settings className="w-4 h-4" /> 客观分布属性</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(detailUser).map(([k, v]) => {
                      if (['id', 'projectId', 'name', 'age', 'occupation', 'coreTraits', 'personality_traits'].includes(k)) return null;
                      return (
                        <div key={k} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">{k}</span>
                          <span className="text-sm font-medium text-gray-900">{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                <Button variant="secondary" onClick={() => setDetailUser(null)}>关闭画像</Button>
                <Button onClick={() => { toggleUser(detailUser.id); setDetailUser(null); }} className="gap-2">
                  {selectedUserIds.includes(detailUser.id) ? "取消选中" : "选中并加入访谈"} <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Chat = ({ project, users, participantIds, onBack, onGenerateReport }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  
  // 🌟 升级1：把单个图片的状态，换成了图片数组
  const [selectedImages, setSelectedImages] = useState<{ data: string; mimeType: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const participants = users.filter((u: any) => participantIds.includes(u.id));
  const isFocusGroup = participantIds.length > 1;

  useEffect(() => {
    const initChat = async () => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, type: isFocusGroup ? 'focus_group' : 'one_on_one', participantIds }),
      });
      const conv = await res.json();
      setConversationId(conv.id);
    };
    initChat();
  }, []);

  // 🌟 升级2：处理多文件上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const resizedBase64 = await resizeImage(base64);
        const data = resizedBase64.split(',')[1];
        setSelectedImages(prev => [...prev, { data, mimeType: file.type || 'image/jpeg' }]);
      };
      reader.readAsDataURL(file);
    });
    // 清空 input，允许重复选同一张图
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 🌟 升级3：删除指定的预览图
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;
    
    // 🌟 升级4：将多图装包发给服务器 (使用 imageUrls 数组)
    const userMsg = {
      conversationId,
      senderType: 'user',
      content: input,
      imageUrls: selectedImages.length > 0 ? selectedImages.map(img => `data:${img.mimeType};base64,${img.data}`) : undefined,
    };

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg),
    });
    const savedUserMsg = await res.json();
    const updatedMessages = [...messages, savedUserMsg];
    setMessages(updatedMessages);
    
    // 清空输入框和图片
    setInput('');
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);
    setLoading(true);
const Chat = ({ project, users, participantIds, onBack, onGenerateReport }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  
  // 🌟 升级1：把单个图片的状态，换成了图片数组
  const [selectedImages, setSelectedImages] = useState<{ data: string; mimeType: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const participants = users.filter((u: any) => participantIds.includes(u.id));
  const isFocusGroup = participantIds.length > 1;

  useEffect(() => {
    const initChat = async () => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, type: isFocusGroup ? 'focus_group' : 'one_on_one', participantIds }),
      });
      const conv = await res.json();
      setConversationId(conv.id);
    };
    initChat();
  }, []);

  // 🌟 升级2：处理多文件上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const resizedBase64 = await resizeImage(base64);
        const data = resizedBase64.split(',')[1];
        setSelectedImages(prev => [...prev, { data, mimeType: file.type || 'image/jpeg' }]);
      };
      reader.readAsDataURL(file);
    });
    // 清空 input，允许重复选同一张图
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 🌟 升级3：删除指定的预览图
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;
    
    // 🌟 升级4：将多图装包发给服务器 (使用 imageUrls 数组)
    const userMsg = {
      conversationId,
      senderType: 'user',
      content: input,
      imageUrls: selectedImages.length > 0 ? selectedImages.map(img => `data:${img.mimeType};base64,${img.data}`) : undefined,
    };

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg),
    });
    const savedUserMsg = await res.json();
    const updatedMessages = [...messages, savedUserMsg];
    setMessages(updatedMessages);
    
    // 清空输入框和图片
    setInput('');
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);
    setLoading(true);

    try {
      let currentHistory = updatedMessages;
      for (const participant of participants) {
        if (isFocusGroup && currentHistory.length > updatedMessages.length) {
            await new Promise(resolve => setTimeout(resolve, 800)); 
        }

        // 把包含多图的数组扔给大模型
        const aiResponse = await chatWithUser(participant, currentHistory, input, project, [], imagesToSend);
        
        const aiMsg = {
          conversationId,
          senderType: 'synthetic_user',
          syntheticUserId: participant.id,
          content: aiResponse,
        };
        const resAi = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiMsg),
        });
        const savedAiMsg = await resAi.json();
        currentHistory = [...currentHistory, savedAiMsg];
        setMessages(currentHistory);
        
        if (!isFocusGroup) break;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h2 className="font-bold text-gray-900">{isFocusGroup ? '焦点小组讨论' : `与 ${participants[0]?.name || 'AI用户'} 的深度访谈`}</h2>
            <p className="text-xs text-gray-500 truncate max-w-[300px]">{project.shortTitle || project.purpose}</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => onGenerateReport(messages)}>生成研究报告</Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.senderType === 'user';
            const participant = participants.find((p: any) => p.id === msg.syntheticUserId);
            
            return (
              <div key={msg.id} className={cn('flex gap-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
                {!isUser && (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {participant?.name[0] || 'A'}
                  </div>
                )}
                <div className={cn('max-w-[80%] p-4 rounded-2xl shadow-sm', isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none')}>
                  {!isUser && isFocusGroup && <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">{participant?.name}</div>}
                  
                  {/* 🌟 升级5：渲染聊天气泡里的多张图片，也兼容旧版的单图 */}
                  {msg.imageUrls ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.imageUrls.map((url: string, i: number) => (
                        <img key={i} src={url} alt="Uploaded content" className="max-h-60 rounded-lg border border-white/20" referrerPolicy="no-referrer" />
                      ))}
                    </div>
                  ) : msg.imageUrl ? (
                    <img src={msg.imageUrl} alt="Uploaded content" className="max-w-full rounded-lg mb-2 border border-white/20" referrerPolicy="no-referrer" />
                  )}
                  
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><Bot className="w-5 h-5 animate-pulse" /></div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* 🌟 升级6：输入框上方的多图预览区 */}
          {selectedImages.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative inline-block">
                  <img src={`data:${img.mimeType};base64,${img.data}`} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-indigo-500" />
                  <button onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4">
            {/* 🌟 升级7：加了 multiple 属性允许系统选多图 */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}><ImageIcon className="w-5 h-5" /></Button>
            <input className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder={selectedImages.length > 0 ? `已选 ${selectedImages.length} 张图片...` : "输入您的问题..."} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
            <Button size="icon" disabled={loading || (!input.trim() && selectedImages.length === 0)} onClick={handleSend}><Send className="w-5 h-5" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};
    
const Knowledge = ({ onBack }: any) => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        setDocs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <Button variant="ghost" className="mb-4 gap-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">知识库管理</h2>
          <p className="text-gray-600">管理您的调研资料，为合成用户提供真实数据支撑。</p>
        </div>
        <Button className="gap-2">
          <PlusCircle className="w-4 h-4" />
          同步调研文档
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          docs.map(doc => (
            <Card key={doc.id} className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{doc.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge>{doc.metadata.businessLine}</Badge>
                    {doc.metadata.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-gray-400 uppercase font-bold">状态</div>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    已就绪
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const Report = ({ project, users, messages, onBack }: any) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await generateReport(project, users, messages);
        setReport(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">正在通过 AI 深度分析对话内容...</h2>
        <p className="text-gray-500">这可能需要几秒钟时间</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <Button variant="ghost" className="mb-4 gap-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            返回对话
          </Button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">研究报告</h2>
          <p className="text-gray-600">{project.purpose}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2">
            <Download className="w-4 h-4" />
            导出 PDF
          </Button>
          <Button variant="primary" className="gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            整体摘要
          </h3>
          <Card className="p-6 bg-indigo-50 border-indigo-100">
            <p className="text-gray-800 leading-relaxed italic">"{report.summary}"</p>
          </Card>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            关键洞察
          </h3>
          <div className="space-y-4">
            {report.insights?.map((insight: any, i: number) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="primary">{insight.category}</Badge>
                </div>
                <p className="text-gray-900 font-medium mb-4">{insight.content}</p>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                    <Quote className="w-3 h-3" />
                    用户证据
                  </div>
                  <p className="text-sm text-gray-600 italic">"{insight.evidence}"</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            痛点分析
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {report.painPoints?.map((pain: any, i: number) => (
              <Card key={i} className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-900">{pain.description}</h4>
                  <Badge variant={pain.severity === 'high' ? 'danger' : 'warning'}>{pain.severity}</Badge>
                </div>
                <div className="text-xs text-gray-500 mb-4">提及频率: {pain.frequency}</div>
                <div className="space-y-2">
                  {pain.userQuotes?.map((quote: string, j: number) => (
                    <p key={j} className="text-xs text-gray-600 italic">· "{quote}"</p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            行动建议
          </h3>
          <div className="space-y-4">
            {report.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="flex gap-4 p-6 bg-white border border-gray-200 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{rec.action}</h4>
                  <p className="text-sm text-gray-600 mb-3">{rec.impact}</p>
                  <div className="flex gap-2">
                    <Badge>难度: {rec.effort}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('home'); // home, project-new, user-config, dashboard, chat, knowledge, report
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectUsers, setProjectUsers] = useState<SyntheticUser[]>([]);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const fetchProjectUsers = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/users`);
    const data = await res.json();
    setProjectUsers(data);
  };

  const handleProjectCreated = (project: Project) => {
    setCurrentProject(project);
    setView('user-config');
  };

  const handleUsersGenerated = async () => {
    if (currentProject) {
      await fetchProjectUsers(currentProject.id);
      setView('dashboard');
    }
  };

  const startChat = (participantIds: string[]) => {
    setChatParticipants(participantIds);
    setView('chat');
  };

  const goToReport = (messages: Message[]) => {
    setChatMessages(messages);
    setView('report');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'home' && (
            <Home 
              onCreateProject={() => setView('project-new')} 
              onGoToKnowledge={() => setView('knowledge')} 
            />
          )}
          
          {view === 'project-new' && (
            <ProjectNew 
              onProjectCreated={handleProjectCreated} 
              onBack={() => setView('home')} 
            />
          )}

          {view === 'user-config' && currentProject && (
            <UserConfig 
              project={currentProject} 
              onUsersGenerated={handleUsersGenerated} 
              onBack={() => setView('home')} 
            />
          )}

          {view === 'dashboard' && currentProject && (
            <Dashboard 
              project={currentProject} 
              users={projectUsers} 
              onChat={startChat}
              onReport={() => setView('report')}
              onBack={() => setView('home')}
            />
          )}

          {view === 'chat' && currentProject && (
            <Chat 
              project={currentProject} 
              users={projectUsers} 
              participantIds={chatParticipants} 
              onBack={() => setView('dashboard')}
              onGenerateReport={goToReport}
            />
          )}

          {view === 'knowledge' && (
            <Knowledge onBack={() => setView('home')} />
          )}

          {view === 'report' && currentProject && (
            <Report 
              project={currentProject} 
              users={projectUsers} 
              messages={chatMessages} 
              onBack={() => setView('chat')} 
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
