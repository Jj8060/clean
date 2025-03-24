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
  onDateSelect: (date: Date) => void;
  isAdmin: boolean;
  currentDate: Date;
  onUpdateSchedule?: (weekStart: Date, newGroupId: string) => void;
  extraDutyMembers: Array<{
    memberId: string;
    date: string;
  }>;
  handleAddExtraDuty: (date: Date) => void;
  handleDeleteExtraDuty: (memberId: string, date: string) => void;
  isGroup4OnDuty: (date: Date) => boolean;
  onGroupEvaluation: (date: Date, members: Member[]) => void;
}

// 添加惩罚天数调整对话框组件
const AdjustPenaltyModal = ({ 
  isOpen, 
  onClose, 
  member, 
  totalPenaltyDays, 
  onAdjust 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  member: Member; 
  totalPenaltyDays: number;
  onAdjust: (memberId: string, newPenaltyDays: number) => void;
}) => {
  const [penaltyDays, setPenaltyDays] = useState(totalPenaltyDays);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-80">
        <h3 className="text-lg font-semibold mb-4 text-[#2a63b7]">调整惩罚天数</h3>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">成员: {member.name}</label>
          <label className="block text-gray-700 mb-1">当前惩罚天数: {totalPenaltyDays}天</label>
          <label className="block text-gray-700 mb-1">
            新惩罚天数:
            <input 
              type="number" 
              min="0"
              value={penaltyDays} 
              onChange={(e) => setPenaltyDays(parseInt(e.target.value) || 0)}
              className="ml-2 px-2 py-1 border rounded w-16"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            注意: 此修改不会影响考核统计记录，仅调整显示天数
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            onClick={onClose} 
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onAdjust(member.id, penaltyDays);
              onClose();
            }} 
            className="px-3 py-1 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

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

// 修改 Calendar 组件
const Calendar = ({
  dutySchedule,
  attendanceRecords,
  onDateSelect,
  isAdmin,
  currentDate,
  onUpdateSchedule,
  extraDutyMembers,
  handleAddExtraDuty,
  handleDeleteExtraDuty,
  isGroup4OnDuty,
  onGroupEvaluation
}: CalendarProps) => {
  const today = new Date();
  // 新增状态管理选中的成员和对话框显示
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [memberPenaltyOverrides, setMemberPenaltyOverrides] = useState<{[key: string]: number}>({});
  
  // 添加状态来管理每天的选组显示状态
  const [showGroupSelectDays, setShowGroupSelectDays] = useState<{[key: string]: boolean}>({});
  
  const toggleGroupSelect = (day: Date) => {
    const dayKey = day.toISOString();
    setShowGroupSelectDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  // 加载已保存的惩罚天数覆盖记录
  useEffect(() => {
    const savedOverrides = localStorage.getItem('penaltyDaysOverrides');
    if (savedOverrides) {
      setMemberPenaltyOverrides(JSON.parse(savedOverrides));
    }
  }, []);
  
  // 调整惩罚天数的处理函数
  const handleAdjustPenalty = (memberId: string, newPenaltyDays: number) => {
    const newOverrides = { ...memberPenaltyOverrides, [memberId]: newPenaltyDays };
    setMemberPenaltyOverrides(newOverrides);
    localStorage.setItem('penaltyDaysOverrides', JSON.stringify(newOverrides));
  };

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
      onDateSelect(today);
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
      onDateSelect(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (isDateInRange(newDate)) {
      onDateSelect(newDate);
    }
  };

  // 添加星期几的表头
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 修改日历格子渲染逻辑
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    let firstDayOfWeek = getDay(monthStart);
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    const emptyDays = Array(firstDayOfWeek - 1).fill(null);

    return (
      <>
        {weekDays.map((day, index) => (
          <div key={day} className="p-2 text-center font-bold border bg-gray-50">
            {day}
          </div>
        ))}
        
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2 border bg-gray-100" />
        ))}

        {days.map((day) => {
          const isToday = isSameDay(day, today);
          
          const weekSchedule = dutySchedule.find(schedule => {
            // 修改查找逻辑，使周末也能找到对应的周一到周五的值日组
            const weekDay = getDay(day);
            const isWeekend = weekDay === 0 || weekDay === 6; // 0是周日，6是周六
            
            if (isWeekend) {
              // 对于周末，查找该周的周一到周五对应的值日组
              // 计算回到本周一的日期
              const weekStart = new Date(day);
              const daysToSubtract = weekDay === 0 ? 6 : weekDay - 1;
              weekStart.setDate(weekStart.getDate() - daysToSubtract);
              weekStart.setHours(0, 0, 0, 0);
              
              // 查找对应的值日安排
              return isSameDay(schedule.weekStart, weekStart);
            } else {
              // 对于工作日，保持原有逻辑
              const scheduleWeekEnd = addDays(schedule.weekStart, 4);
              return day >= schedule.weekStart && day <= scheduleWeekEnd;
            }
          });

          const group = weekSchedule?.group || groups[0];
          const extraMembers = extraDutyMembers.filter(
            member => isSameDay(new Date(member.date), day)
          );

          // 合并常规值日人员和额外值日人员
          const allMembers = [
            ...group.members,
            ...extraMembers.map(em => {
              const member = groups.flatMap(g => g.members).find(m => m.id === em.memberId);
              return member;
            }).filter((m): m is Member => m !== undefined)
          ];

          // 判断是否为周末
          const weekDay = getDay(day);
          const isWeekend = weekDay === 0 || weekDay === 6;
          
          // 使用组件级别的状态，而不是在渲染函数内创建
          const dayKey = day.toISOString();
          const showGroupSelect = showGroupSelectDays[dayKey];

          return (
            <div
              key={day.toISOString()}
              className={`p-2 border ${isToday ? 'bg-yellow-100' : ''} relative`}
              data-today={isToday}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">{format(day, 'MM/dd')}</div>
                {isAdmin && (
                  <div className="flex gap-1">
                    {isWeekend && (
                      <button
                        onClick={() => toggleGroupSelect(day)}
                        className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded hover:bg-blue-600"
                      >
                        {showGroupSelect ? '取消' : '选组'}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGroupEvaluation(day, allMembers);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      评价
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddExtraDuty(day);
                      }}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      +值日
                    </button>
                  </div>
                )}
              </div>
              
              {/* 对于周末，添加值日组选择器 */}
              {isWeekend && isAdmin && showGroupSelect && onUpdateSchedule && (
                <div className="mb-2">
                  <select
                    className="w-full text-xs p-1 border rounded"
                    value={group.id}
                    onChange={(e) => {
                      // 查找对应的周一
                      const weekStart = new Date(day);
                      const daysToSubtract = weekDay === 0 ? 6 : weekDay - 1;
                      weekStart.setDate(weekStart.getDate() - daysToSubtract);
                      weekStart.setHours(0, 0, 0, 0);
                      
                      onUpdateSchedule(weekStart, e.target.value);
                      toggleGroupSelect(day);
                    }}
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="text-sm">{group.name}</div>
              <div className="text-xs space-y-1">
                {allMembers.map(member => {
                  const status = attendanceRecords.find(
                    r => r.memberId === member.id && isSameDay(new Date(r.date), day)
                  );
                  return (
                    <div key={member.id} className="flex justify-between">
                      <span>{member.name}</span>
                      <span className="text-gray-500">
                        {status ? `${status.status} (惩罚:${status.penaltyDays || 0}天)` : '待评价'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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
                // 修改计算逻辑，只考虑有效记录的惩罚天数（与统计页面保持一致）
                const calculatedPenaltyDays = memberRecords.reduce((sum, r) => {
                  // 只有评分>0时计算惩罚天数
                  if (r.penaltyDays && r.penaltyDays > 0) {
                    return sum + (r.penaltyDays || 0);
                  }
                  return sum;
                }, 0);
                
                // 使用 override 或计算值
                const totalPenaltyDays = memberPenaltyOverrides[member.id] !== undefined ? 
                  memberPenaltyOverrides[member.id] : calculatedPenaltyDays;
                
                return (
                  <div key={member.id} className="flex justify-between items-center text-sm">
                    <span>{member.name}</span>
                    <div className="flex items-center gap-1">
                      <span className={`${totalPenaltyDays > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {totalPenaltyDays}天
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowAdjustModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs ml-1"
                          title="调整惩罚天数"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 惩罚天数调整对话框 */}
      {selectedMember && (
        <AdjustPenaltyModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          member={selectedMember}
          totalPenaltyDays={
            memberPenaltyOverrides[selectedMember.id] !== undefined ?
            memberPenaltyOverrides[selectedMember.id] :
            attendanceRecords
              .filter(r => r.memberId === selectedMember.id)
              .reduce((sum, r) => sum + (r.penaltyDays || 0), 0)
          }
          onAdjust={handleAdjustPenalty}
        />
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button 
            onClick={goToToday}
            className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
            disabled={!isDateInRange(today)}
          >
            今天
          </button>
          <button 
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={!isDateInRange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            上个月
          </button>
          <button 
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={!isDateInRange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            下个月
          </button>
        </div>
        <div className="text-xl font-bold">
          {format(currentDate, 'yyyy年MM月', { locale: zhCN })}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar; 