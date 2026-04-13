export type TechDimension = 
  | '智能安全' 
  | 'AI' 
  | '智慧内饰' 
  | '智慧光' 
  | '智能底盘' 
  | '极致能耗' 
  | '轻量化' 
  | '智能仿真' 
  | '先进动力' 
  | '健康车';

export type TechStatus = 'predicted' | 'confirmed';

export interface TechPoint {
  id: string;
  dimension: TechDimension;
  month: number; // 1-12
  oem: string;
  title: string;
  desc: string;
  status: TechStatus;
  source: string;
  isIndustryFirst?: boolean;
  createdAt: string;
}

export interface AppConfig {
  qwenApiKey: string;
  qwenModel: string;
  workspacePath?: string;
}

export interface AppData {
  lastUpdated: string;
  techPoints: TechPoint[];
}
