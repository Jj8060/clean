import React, { useEffect, useState } from 'react';
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, addDays, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useDutyStatuses } from '@/hooks/useDutyStatuses';
import { Group, Member, AttendanceStatus } from '@/types';
import { groups } from '@/data/groups';

// 添加 Props 接口定义
interface CalendarProps {
  dutySchedule: {
    weekStart: Date;
    group: {
      id: string;
      name: string;
      members: Member[];
    };
  }[];
  attendanceRecords: AttendanceStatus[];
  onSelectDate: (date: Date) => void;
  isAdmin: boolean;
  currentDate: Date;
  onUpdateSchedule?: (weekStart: Date, newGroupId: string) => void;
  extraDutyMembers: Array<{
    memberId: string;
    date: string;
  }>;
  onAddExtraDuty?: (date: Date) => void;
}

const DayCell = ({ date, group, members, isToday }: { 
  date: Date, 
  group: Group, 
  members: Member[],
  isToday: boolean 
}) => {
  const dutyStatuses = useDutyStatuses(date);
  
  return (
    <div className={`p-2 border ${isToday ? 'bg-yellow-100' : ''}`}>
      <div className="font-bold">{format(date, 'MM/dd')}</div>
      <div className="text-sm">{group.name}</div>
      <div className="text-xs space-y-1">
        {members.map(member => {
          const status = dutyStatuses.find(s => s.memberId === member.id);
          return (
            <div key={member.id} className="flex justify-between">
              <span>{member.name}</span>
              <span className="text-gray-500">
                {status ? `${status.status} (惩罚:${member.currentPunishmentDays || 0}天)` : '待评价'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 添加 Props 类型
const Calendar = ({
  dutySchedule,
  attendanceRecords,
  onSelectDate,
  isAdmin,
  currentDate,
  onUpdateSchedule,
  extraDutyMembers,
  onAddExtraDuty
}: CalendarProps) => {
  const today = new Date();

  // 设置日期范围限制
  const dateRange = {
    start: new Date(2025, 0, 1), // 2025年1月1日
    end: new Date(2030, 11, 31)  // 2030年12月31日
  };

  const isDateInRange = (date: Date) => {
    return isWithinInterval(date, dateRange);
  };

  const goToToday = () => {
    if (isDateInRange(today)) {
      onSelectDate(today);
      // 这里需要添加滚动到今天的日期的逻辑
      const todayElement = document.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (isDateInRange(newDate)) {
      onSelectDate(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (isDateInRange(newDate)) {
      onSelectDate(newDate);
    }
  };

  // 添加星期几的表头
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 修改日历格子渲染逻辑
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 获取月初是星期几（0-6，0代表周日）
    let firstDayOfWeek = getDay(monthStart);
    // 调整为周一为一周的第一天（1-7，7代表周日）
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    // 创建前置空白格子
    const emptyDays = Array(firstDayOfWeek - 1).fill(null);

    return (
      <>
        {/* 渲染星期几表头 */}
        {weekDays.map((day, index) => (
          <div key={day} className="p-2 text-center font-bold border bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* 渲染空白格子 */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2 border bg-gray-100" />
        ))}

        {/* 渲染日期格子 */}
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          
          // 查找对应的值日安排
          const weekSchedule = dutySchedule.find(schedule => {
            const scheduleWeekEnd = addDays(schedule.weekStart, 4);
            return day >= schedule.weekStart && day <= scheduleWeekEnd;
          });

          const group = weekSchedule?.group || groups[0];

          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              group={group}
              members={group.members}
              isToday={isToday}
              data-today={isToday}
            />
          );
        })}
      </>
    );
  };

  return (
    <div>
      {/* 添加小组成员显示 */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {groups.map(group => (
          <div key={group.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-[#2a63b7]">{group.name}</h3>
            <div className="space-y-1">
              {group.members.map(member => {
                const memberRecords = attendanceRecords.filter(r => r.memberId === member.id);
                const totalPenaltyDays = memberRecords.reduce((sum, r) => sum + (r.penaltyDays || 0), 0);
                
                return (
                  <div key={member.id} className="flex justify-between items-center text-sm">
                    <span>{member.name}</span>
                    <span className={`${totalPenaltyDays > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      {totalPenaltyDays}天
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button 
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={!isDateInRange(today)}
          >
            今天
          </button>
          <button 
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-200 rounded"
            disabled={!isDateInRange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            上个月
          </button>
          <button 
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-200 rounded"
            disabled={!isDateInRange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            下个月
          </button>
        </div>
        <div className="text-xl font-bold">
          {format(currentDate, 'yyyy年MM月')}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar; 