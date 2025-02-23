import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useDutyStatuses } from '@/hooks/useDutyStatuses';
import { Group, Member } from '@/types';

const DayCell = ({ date, group, members }: { date: Date, group: Group, members: Member[] }) => {
  const dutyStatuses = useDutyStatuses(date);
  
  return (
    <div className="p-2 border">
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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button 
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            今天
          </button>
          <button 
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            上个月
          </button>
          <button 
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            下个月
          </button>
        </div>
        <div className="text-xl font-bold">
          {format(currentDate, 'yyyy年MM月')}
        </div>
      </div>
      {/* 日历内容 */}
    </div>
  );
};

export default Calendar; 