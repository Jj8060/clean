export interface Member {
  id: string;
  name: string;
  groupId: string;
  currentPunishmentDays?: number;
}

export interface DutyMember extends Member {
  isExtra: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
}

export interface Admin {
  username: string;
  password: string;
  createdAt?: string;
  isRoot: boolean;
}

export interface AttendanceStatus {
  id: string;
  memberId: string;
  date: string;
  status: 'present' | 'absent' | 'fail' | 'pending';
  score: number | null;
  penaltyDays?: number;
  isGroupAbsent?: boolean;
  isImportantEvent?: boolean;
  isSubstituted?: boolean;
  isExchanged?: boolean;
  substitutedBy?: string;
  exchangedWith?: string;
  substitutionCount?: number;
  substitutedFor?: string[];
  // 是否是补值减免惩罚的记录
  isCompensation?: boolean;
  comment: string;
}

// 为了保持向后兼容，将 DutyStatus 设置为 AttendanceStatus 的别名
export type DutyStatus = AttendanceStatus;

export const STATUS_COLORS = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  fail: 'bg-yellow-500',
  pending: 'bg-gray-500'
} as const; 