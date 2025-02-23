import { DutyStatus } from '@/types';
import { dutyStatuses } from '@/data/dutyStatus';

export const addDutyStatus = (status: DutyStatus) => {
  const existingIndex = dutyStatuses.findIndex(
    s => s.memberId === status.memberId && s.date === status.date
  );
  
  if (existingIndex >= 0) {
    dutyStatuses[existingIndex] = status;
  } else {
    dutyStatuses.push(status);
  }
};

export const updatePunishmentDays = (memberId: string, days: number) => {
  // 更新成员的惩罚天数
  // 这里需要您的成员数据存储实现
}; 