import { AttendanceStatus } from '@/types';

/**
 * 计算特殊日期（如周五）的惩罚天数
 * 
 * @param date 考勤日期
 * @param baseDay 周几（0-6，0为周日）
 * @param basePenalty 基础惩罚天数
 * @param attendanceRecords 所有考勤记录
 * @returns 计算后的惩罚天数
 */
export function calculateSpecialDayPenalty(
  date: Date, 
  baseDay: number, 
  basePenalty: number,
  attendanceRecords: AttendanceStatus[]
): number {
  // 获取当前日期是周几（0-6，0为周日）
  const dayOfWeek = date.getDay();
  
  // 基础惩罚天数
  let penaltyDays = basePenalty;
  
  // 检查是否是周五（5）或者是被转移的周五惩罚规则
  let targetDay = 5; // 周五
  let isSpecialDay = false;
  
  // 检查是否需要向前转移（如果当天或后面的天是重大活动）
  for (let day = 5; day >= 3; day--) {
    // 计算对应日期
    const targetDate = new Date(date);
    const currentDay = date.getDay();
    const daysToAdd = day - currentDay;
    targetDate.setDate(date.getDate() + daysToAdd);
    
    // 检查该日期是否是重大活动日
    const isImportantEvent = checkIsImportantEvent(targetDate, attendanceRecords);
    
    if (!isImportantEvent) {
      // 找到第一个不是重大活动的日期作为目标日
      targetDay = day;
      break;
    }
  }
  
  // 如果当前日期是目标日（周五或向前转移的天），应用特殊惩罚
  isSpecialDay = dayOfWeek === targetDay;
  
  // 如果是特殊日，惩罚天数额外+1
  if (isSpecialDay) {
    penaltyDays += 1;
  }
  
  return penaltyDays;
}

/**
 * 检查指定日期是否是重大活动日
 */
function checkIsImportantEvent(date: Date, attendanceRecords: AttendanceStatus[]): boolean {
  const dateStr = date.toISOString();
  // 检查当天的任何记录是否标记为重大活动
  return attendanceRecords.some(record => 
    record.date === dateStr && record.isImportantEvent === true
  );
}

/**
 * 根据不同情况计算惩罚天数
 * 
 * @param status 考勤状态类型 ('absent' | 'fail')
 * @param date 考勤日期
 * @param absentCount 缺勤次数
 * @param score 得分（不合格时使用）
 * @param attendanceRecords 所有考勤记录
 * @returns 计算后的惩罚天数
 */
export function calculatePenaltyDays(
  status: 'absent' | 'fail',
  date: Date,
  absentCount: number = 0,
  score: number | null = null,
  attendanceRecords: AttendanceStatus[] = []
): number {
  // 基础惩罚天数
  let basePenalty = 0;
  
  // 根据考勤状态确定基础惩罚天数
  if (status === 'absent') {
    // 缺勤惩罚
    if (absentCount === 0) {
      // 第一次缺勤
      basePenalty = 2;
    } else {
      // 后续缺勤
      basePenalty = 3;
    }
  } else if (status === 'fail') {
    // 不合格惩罚，默认2天
    basePenalty = 2;
    
    // 如果评分在1-3分之间，再额外加1天
    if (score !== null && score > 0 && score < 4) {
      basePenalty += 1;
    }
  }
  
  // 如果是缺勤且有基础惩罚，检查是否需要应用特殊日期规则
  if (status === 'absent' && basePenalty > 0) {
    return calculateSpecialDayPenalty(date, date.getDay(), basePenalty, attendanceRecords);
  }
  
  return basePenalty;
} 