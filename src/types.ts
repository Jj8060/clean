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
}

export interface AttendanceStatus {
  id: string;
  memberId: string;
  date: string;
  status: 'present' | 'absent' | 'fail' | 'pending';
  score: number;
  penaltyDays?: number;
  isGroupAbsent?: boolean;
  isImportantEvent?: boolean;
  isSubstituted?: boolean;
  isExchanged?: boolean;
  substitutedBy?: string;
  exchangedWith?: string;
  substitutionCount?: number;
  substitutedFor?: string[];
}

export const STATUS_COLORS = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  fail: 'bg-yellow-500',
  pending: 'bg-gray-500'
} as const; 