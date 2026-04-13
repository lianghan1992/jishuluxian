import axios from 'axios';
import { TechPoint, TechDimension } from '../types';
import { DIMENSIONS } from '../lib/utils';

const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function analyzeContent(
  content: string,
  apiKey: string,
  model: string = 'qwen3.5-flash'
): Promise<Partial<TechPoint>[]> {
  if (!apiKey) throw new Error('请先配置阿里千问 API Key');

  // 映射用户自定义名称到官方 API ID
  const modelMap: Record<string, string> = {
    'qwen3.6-plus': 'qwen-plus',
    'qwen3.5-flash': 'qwen-flash'
  };
  const apiModel = modelMap[model] || model;

  const prompt = `
# 角色
你是一个汽车行业资深技术分析师，专门负责竞争情报的结构化提取。

# 任务
从提供的非结构化文本（发布会总结、资讯、报告）中提取“大颗粒技术”点。

# “大颗粒技术”定义准则 (必须严格遵守)
只有满足以下条件之一的才属于“大颗粒技术”，请过滤掉琐碎的配置更新：
1. **战略核心**：车企在发布会中作为独立章节重点讲解的技术。
2. **行业首发/领先**：具有行业标杆意义，或者是行业内首次应用。
3. **关键参数突破**：在核心指标（如续航、算力、风阻、减重）上有显著提升。
4. **平台级演进**：涉及整车架构、电子电气架构（EEA）或底盘平台的重大升级。

# 技术维度定义
请将提取的技术点归类到以下 10 个维度之一：
1. **智能安全**：主动/被动安全、网络安全、功能安全。
2. **AI**：端到端模型、大模型上车、AI驱动的控制算法。
3. **智慧内饰**：座舱空间、新材料、交互体验、舒适性。
4. **智慧光**：智能大灯(ADB/DLP)、投影、交互灯语。
5. **智能底盘**：架构演进、模块化、EEA集成。
6. **极致能耗**：风阻优化、高效电驱、热管理。
7. **轻量化**：一体化压铸、新材料、结构减重。
8. **智能仿真**：虚拟标定、数字孪生、研发效率。
9. **先进动力**：增程技术、高性能电机、电池集成(CTB/CTC)。
10. **健康车**：空气质量、低辐射、环保材料、健康监测。

# 输出要求
1. 必须输出纯 JSON 格式。
2. 结构为：{"techPoints": [{"dimension": "...", "month": 1-12, "oem": "...", "title": "...", "desc": "...", "status": "confirmed/predicted", "isIndustryFirst": true/false}]}
3. month 字段：根据文中提到的发布时间或当前时间推断（1-12的整数）。
4. title：控制在 15 字以内。
5. desc：详细描述技术方案和关键参数，50-100 字。

# 待分析内容
${content}
`;

  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: apiModel,
        messages: [
          { role: 'system', content: '你是一个专业的汽车技术分析助手。请只输出 JSON 格式的结果。' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content;
    let parsed;
    try {
      // Sometimes AI might wrap JSON in markdown blocks
      const jsonMatch = result.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
    } catch (e) {
      console.error('Failed to parse AI response:', result);
      throw new Error('AI 返回格式错误，请重试');
    }
    
    // 兼容不同的 JSON 返回结构
    let techPoints = [];
    if (Array.isArray(parsed)) {
      techPoints = parsed;
    } else if (parsed.techPoints && Array.isArray(parsed.techPoints)) {
      techPoints = parsed.techPoints;
    } else if (parsed.points && Array.isArray(parsed.points)) {
      techPoints = parsed.points;
    } else {
      // 如果是一个对象，尝试将其放入数组
      techPoints = [parsed];
    }
    
    return techPoints;
  } catch (error) {
    console.error('Qwen API Error:', error);
    throw new Error('AI 分析失败，请检查网络或 API Key');
  }
}
