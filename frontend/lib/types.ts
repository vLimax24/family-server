export interface FamilyMember {
  id: number;
  name: string;
  role: string;
  is_available: number;
  unavailable_since: number | null;
  unavailable_until: number | null;
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

export interface OneTimeTask {
  id: number;
  name: string;
  description: string | null;
  assigned_to: number;
  created_by: number;
  created_at: number;
  completed_at: number | null;
  due_date: number | null;
  priority: 'low' | 'medium' | 'high';
  assigned_to_name?: string;
  created_by_name?: string;
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

export interface SetAvailability {
  person_id: number;
  is_available: number;
  unavailable_since: number | null;
  unavailable_until: number | null;
}
