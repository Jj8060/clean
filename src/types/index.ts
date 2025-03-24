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
  status: 'present' | 'absent' | 'fail' | 'pending';
  score: number;
  comment?: string;
  penaltyDays?: number;
  absentCount?: number;  // 缺勤次数
  failCount?: number;    // 不合格次数
  isSubstituted?: boolean; // 是否是代指
  substitutedBy?: string; // 代指人的ID
  isExchanged?: boolean; // 是否是换值
  exchangedWith?: string; // 换值人的ID
  substitutionCount?: number; // 代指次数
  substitutedFor?: string[]; // 代替谁值日的记录
  isImportantEvent?: boolean; // 是否是重大活动日
  isGroupAbsent?: boolean; // 是否是全体缺勤日
  isCompensation?: boolean; // 是否是补值减免惩罚的记录
}

export interface DutySchedule {
  date: string;
  groupId: string;
}

export interface Admin {
  username: string;
  password: string;
  isRoot: boolean;  // 标识是否为终端管理员
  isDisabled?: boolean; // 标识账户是否被禁用
  createdAt?: string;  // 创建时间
  disabledAt?: string; // 禁用时间
  disabledBy?: string; // 禁用操作人
  enabledAt?: string;  // 启用时间
  enabledBy?: string;  // 启用操作人
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
  fail: '#ffa500',      // 黄色 (不合格)
  pending: '#808080'    // 灰色
} as const; 