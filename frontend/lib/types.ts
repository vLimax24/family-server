export interface FamilyMember {
  id: number;
  name: string;
  role: string;
}

export interface Plant {
  id: number;
  name: string;
  interval: number;
  last_pour: number;
  image?: string;
  owner_id: number;
}

export interface Chore {
  id: number;
  name: string;
  interval: number;
  last_done: number;
  worker_id: number;
  rotation_enabled: number;
  rotation_order: string;
  last_assigned_index: number;
}

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface StatusConfig {
  level: UrgencyLevel;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconBgColor: string;
  iconBorderColor: string;
  iconColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  buttonShadowColor: string;
  dotColor: string;
}