import React, { useEffect, useState } from 'react';
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useDutyStatuses } from '@/hooks/useDutyStatuses';
import { Group, Member } from '@/types';
import { groups } from '@/data/groups';

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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
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
      setCurrentDate(today);
      // 这里需要添加滚动到今天的日期的逻辑
      const todayElement = document.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return isDateInRange(newDate) ? newDate : prevDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return isDateInRange(newDate) ? newDate : prevDate;
    });
  };

  // 添加日历格子渲染逻辑
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      const isToday = isSameDay(day, today);
      // 根据日期获取值日小组
      const groupIndex = day.getDay(); // 这里需要根据您的实际值日安排逻辑修改
      const group = groups[groupIndex % groups.length];

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
    });
  };

  return (
    <div>
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