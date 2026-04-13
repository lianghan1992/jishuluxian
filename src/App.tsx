import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Settings, 
  Plus, 
  Upload, 
  Save, 
  Trash2, 
  ChevronRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, DIMENSIONS, MONTHS } from './lib/utils';
import { TechPoint, AppConfig, AppData, TechDimension, TechStatus } from './types';
import { fsManager } from './lib/fileSystem';
import { analyzeContent } from './services/qwenService';
import { v4 as uuidv4 } from 'uuid';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
      active 
        ? "bg-hw-blue text-white shadow-lg shadow-hw-blue/20" 
        : "text-hw-text-secondary hover:bg-black/5"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className, title }: any) => (
  <div className={cn("hw-card p-6", className)}>
    {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'ai' | 'settings'>('map');
  const [config, setConfig] = useState<AppConfig>({ qwenApiKey: '', qwenModel: 'qwen-plus' });
  const [data, setData] = useState<AppData>({ lastUpdated: '', techPoints: [] });
  const [isFsReady, setIsFsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawContent, setRawContent] = useState('');
  const [aiResults, setAiResults] = useState<Partial<TechPoint>[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load initial data
  useEffect(() => {
    const savedConfig = localStorage.getItem('app_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    const savedData = localStorage.getItem('app_data');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConnectFS = async () => {
    const success = await fsManager.requestPermission();
    if (success) {
      setIsFsReady(true);
      const loadedConfig = await fsManager.loadConfig();
      const loadedData = await fsManager.loadData();
      if (loadedConfig) setConfig(loadedConfig);
      if (loadedData) setData(loadedData);
      notify('success', '本地文件夹已连接');
    } else {
      notify('error', '连接本地文件夹失败');
    }
  };

  const handleSaveData = async (newData: AppData) => {
    setData(newData);
    localStorage.setItem('app_data', JSON.stringify(newData));
    if (isFsReady) {
      await fsManager.saveData(newData);
    }
  };

  const handleRunAI = async () => {
    if (!rawContent.trim()) return;
    setIsAnalyzing(true);
    try {
      const results = await analyzeContent(rawContent, config.qwenApiKey, config.qwenModel);
      setAiResults(results);
      notify('success', 'AI 分析完成');
    } catch (error: any) {
      notify('error', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmPoint = (point: Partial<TechPoint>, index: number) => {
    const newPoint: TechPoint = {
      id: uuidv4(),
      dimension: point.dimension as TechDimension || 'AI',
      month: point.month || new Date().getMonth() + 1,
      oem: point.oem || '未知车企',
      title: point.title || '无标题',
      desc: point.desc || '',
      status: point.status as TechStatus || 'confirmed',
      source: point.source || 'AI 提取',
      isIndustryFirst: point.isIndustryFirst || false,
      createdAt: new Date().toISOString()
    };

    const newData = {
      ...data,
      lastUpdated: new Date().toISOString(),
      techPoints: [...data.techPoints, newPoint]
    };
    handleSaveData(newData);
    setAiResults(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeletePoint = (id: string) => {
    const newData = {
      ...data,
      techPoints: data.techPoints.filter(p => p.id !== id)
    };
    handleSaveData(newData);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-hw-card border-r border-black/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-hw-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-hw-blue/30">
            <BrainCircuit size={24} />
          </div>
          <h1 className="font-bold text-lg leading-tight">大颗粒技术<br/><span className="text-hw-blue">管理系统</span></h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="全景图谱" 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')} 
          />
          <SidebarItem 
            icon={BrainCircuit} 
            label="AI 提取" 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="系统设置" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="pt-6 border-t border-black/5">
          <button 
            onClick={handleConnectFS}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
              isFsReady ? "bg-green-50 text-green-600" : "bg-hw-blue/10 text-hw-blue hover:bg-hw-blue/20"
            )}
          >
            {isFsReady ? <CheckCircle2 size={16} /> : <Upload size={16} />}
            {isFsReady ? "已连接本地" : "连接本地文件夹"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold">全景技术图谱</h2>
                  <p className="text-hw-text-secondary mt-1">年度大颗粒技术演进趋势矩阵</p>
                </div>
                <div className="flex gap-4">
                  <button className="hw-button-secondary flex items-center gap-2">
                    <Download size={18} /> 导出报告
                  </button>
                </div>
              </div>

              <Card className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 text-left text-xs font-bold text-hw-text-secondary uppercase tracking-wider border-b border-black/5 w-32">技术维度</th>
                      {MONTHS.map(m => (
                        <th key={m} className="p-4 text-center text-xs font-bold text-hw-text-secondary uppercase tracking-wider border-b border-black/5 min-w-[120px]">
                          {m}月
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSIONS.map(dim => (
                      <tr key={dim} className="group hover:bg-black/[0.02] transition-colors">
                        <td className="p-4 font-bold text-sm border-b border-black/5 bg-hw-card sticky left-0 z-10">{dim}</td>
                        {MONTHS.map(month => {
                          const points = data.techPoints.filter(p => p.dimension === dim && p.month === month);
                          return (
                            <td key={month} className="p-2 border-b border-black/5 border-l border-black/[0.02] align-top">
                              <div className="flex flex-col gap-2">
                                {points.map(p => (
                                  <div 
                                    key={p.id} 
                                    className={cn(
                                      "p-2 rounded-lg text-xs shadow-sm border transition-all hover:scale-105 cursor-pointer group/item relative",
                                      p.status === 'confirmed' 
                                        ? "bg-hw-blue/5 border-hw-blue/20 text-hw-blue" 
                                        : "bg-orange-50 border-orange-200 text-orange-600 border-dashed"
                                    )}
                                  >
                                    <div className="font-bold mb-1 flex justify-between items-start">
                                      <span>{p.oem}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeletePoint(p.id); }}
                                        className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-red-500 transition-opacity"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                    <div className="line-clamp-2 opacity-90">{p.title}</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold">AI 智能提取</h2>
                <p className="text-hw-text-secondary mt-1">上传资讯报告，AI 自动识别大颗粒技术点</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="输入源内容" className="flex flex-col">
                  <textarea 
                    className="flex-1 hw-input min-h-[400px] resize-none text-sm leading-relaxed"
                    placeholder="粘贴文章内容、资讯报告或 Markdown 文本..."
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                  />
                  <div className="mt-4 flex gap-3">
                    <button 
                      onClick={handleRunAI}
                      disabled={isAnalyzing || !rawContent.trim()}
                      className="hw-button-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <BrainCircuit size={20} />}
                      {isAnalyzing ? "分析中..." : "开始 AI 提取"}
                    </button>
                    <button 
                      onClick={() => setRawContent('')}
                      className="hw-button-secondary"
                    >
                      清空
                    </button>
                  </div>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    提取结果 {aiResults.length > 0 && <span className="bg-hw-blue text-white text-xs px-2 py-0.5 rounded-full">{aiResults.length}</span>}
                  </h3>
                  {aiResults.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-hw-text-secondary border-2 border-dashed border-black/5 rounded-2xl">
                      <FileText size={48} className="opacity-20 mb-4" />
                      <p>暂无提取结果</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {aiResults.map((result, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={idx}
                          className="hw-card p-4 border-l-4 border-l-hw-blue"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-hw-blue/10 text-hw-blue text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {result.dimension}
                            </span>
                            <span className="text-xs text-hw-text-secondary font-medium">{result.month}月</span>
                          </div>
                          <h4 className="font-bold text-base mb-1">{result.oem}: {result.title}</h4>
                          <p className="text-sm text-hw-text-secondary line-clamp-3 mb-4">{result.desc}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleConfirmPoint(result, idx)}
                              className="flex-1 bg-hw-blue text-white py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
                            >
                              确认入库
                            </button>
                            <button 
                              onClick={() => setAiResults(prev => prev.filter((_, i) => i !== idx))}
                              className="p-2 bg-black/5 text-hw-text-secondary rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold">系统设置</h2>
                <p className="text-hw-text-secondary mt-1">配置 AI 渠道与本地存储</p>
              </div>

              <Card title="阿里千问 API 配置">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">API Key</label>
                    <input 
                      type="password" 
                      className="w-full hw-input" 
                      placeholder="sk-..." 
                      value={config.qwenApiKey}
                      onChange={(e) => setConfig({ ...config, qwenApiKey: e.target.value })}
                    />
                    <p className="text-[10px] text-hw-text-secondary mt-2">API Key 仅保存在本地，不会上传到任何服务器。</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">模型选择</label>
                    <select 
                      className="w-full hw-input appearance-none"
                      value={config.qwenModel}
                      onChange={(e) => setConfig({ ...config, qwenModel: e.target.value })}
                    >
                      <option value="qwen-plus">Qwen Plus (推荐)</option>
                      <option value="qwen-max">Qwen Max (最强)</option>
                      <option value="qwen-turbo">Qwen Turbo (极速)</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.setItem('app_config', JSON.stringify(config));
                      if (isFsReady) fsManager.saveConfig(config);
                      notify('success', '配置已保存');
                    }}
                    className="hw-button-primary w-full flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> 保存配置
                  </button>
                </div>
              </Card>

              <Card title="数据管理">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/5 rounded-xl">
                    <div>
                      <div className="font-bold">本地文件夹状态</div>
                      <div className="text-xs text-hw-text-secondary">{isFsReady ? "已授权访问" : "未连接"}</div>
                    </div>
                    <button 
                      onClick={handleConnectFS}
                      className="text-hw-blue font-bold text-sm"
                    >
                      {isFsReady ? "重新连接" : "立即连接"}
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('确定要清空所有本地缓存数据吗？此操作不可撤销。')) {
                        localStorage.removeItem('app_data');
                        setData({ lastUpdated: '', techPoints: [] });
                        notify('success', '数据已清空');
                      }
                    }}
                    className="w-full py-3 text-red-500 font-bold text-sm border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                  >
                    清空所有数据
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "fixed bottom-8 right-8 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50",
                notification.type === 'success' ? "bg-hw-blue text-white" : "bg-red-500 text-white"
              )}
            >
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-bold">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
