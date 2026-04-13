import axios from 'axios';
import { TechPoint, TechDimension } from '../types';
import { DIMENSIONS } from '../lib/utils';

const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function analyzeContent(
  content: string,
  apiKey: string,
  model: string = 'qwen-plus'
): Promise<Partial<TechPoint>[]> {
  if (!apiKey) throw new Error('请先配置阿里千问 API Key');

  const prompt = `
你是一个汽车行业资深技术分析师。请分析以下内容，提取其中的“大颗粒技术”点。
“大颗粒技术”定义准则：
1. 发布会核心章节：重点宣传、篇幅长的技术。
2. 行业领先/首发：具有标杆意义或行业首次应用。
3. 关键参数突破：性能指标有显著提升。

请从以下维度中选择最匹配的一个：${DIMENSIONS.join(', ')}。

输出格式必须为 JSON 数组，每个对象包含：
- dimension: 维度名称
- month: 发生月份 (1-12)
- oem: 车企名称
- title: 技术标题 (简练)
- desc: 核心描述 (包含关键参数)
- status: "confirmed" 或 "predicted"
- isIndustryFirst: boolean

内容如下：
${content}
`;

  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: model,
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
