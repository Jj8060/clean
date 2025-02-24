export interface Member {
  id: string;
  name: string;
  groupId: string;
  currentPunishmentDays?: number; // 当前剩余惩罚天数
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
}

export interface AttendanceStatus {
  id: string;
  date: string;
  memberId: string;
  status: 'present' | 'absent' | 'late' | 'pending';
  score: number;
  comment?: string;
  penaltyDays?: number;
}

export interface DutySchedule {
  date: string;
  groupId: string;
}

export interface Admin {
  username: string;
  password: string;
  isRoot: boolean;  // 标识是否为终端管理员
  createdAt?: string;  // 创建时间
}

export interface DutyStatus {
  memberId: string;
  date: string;
  status: '已完成' | '未完成' | '缺勤';
  punishmentDays: number;
  comment?: string;
}

// 考勤状态的颜色映射
export const STATUS_COLORS = {
  present: '#00bd39',   // 绿色
  absent: '#ff2300',    // 红色
  late: '#ffa500',      // 黄色
  pending: '#808080'    // 灰色
} as const; 