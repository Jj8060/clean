import { useState, useEffect } from 'react';
import { groups } from '@/data/groups';
import { format, eachWeekOfInterval, isWeekend, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import AttendanceModal from '@/components/AttendanceModal';
import CalendarView from '@/components/CalendarView';
import { AttendanceStatus, STATUS_COLORS, Member } from '@/types';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';
import AddExtraDutyModal from '@/components/AddExtraDutyModal';
import DutyCalendar from '@/components/DutyCalendar';
import LowScoreWarning from '@/components/LowScoreWarning';
import ChangePasswordModal from '@/components/ChangePasswordModal';

const Home = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-01-01'));
  const [listViewDate, setListViewDate] = useState(new Date('2025-01-01'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    member: any;
    date: Date;
  } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceStatus[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [scheduleOverrides, setScheduleOverrides] = useState<{[key: string]: string}>({});
  const [extraDutyMembers, setExtraDutyMembers] = useState<Array<{
    memberId: string;
    date: string;
  }>>([]);
  const [showAddExtraDutyModal, setShowAddExtraDutyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [groupEvaluationMembers, setGroupEvaluationMembers] = useState<{
    members: Member[];
    date: Date;
  } | null>(null);
  
  // 从 localStorage 加载值日组更改记录
  useEffect(() => {
    const savedOverrides = localStorage.getItem('scheduleOverrides');
    if (savedOverrides) {
      setScheduleOverrides(JSON.parse(savedOverrides));
    }
  }, []);

  // 从 localStorage 加载额外值日人员记录
  useEffect(() => {
    const savedExtraMembers = localStorage.getItem('extraDutyMembers');
    if (savedExtraMembers) {
      setExtraDutyMembers(JSON.parse(savedExtraMembers));
    }
  }, []);

  // 生成2025-2027年的所有周一
  const weekStarts = eachWeekOfInterval(
    {
      start: new Date('2025-01-01'),
      end: new Date('2027-12-31')
    },
    { weekStartsOn: 1 }
  );

  // 生成值日安排，考虑覆盖的情况
  const dutySchedule = weekStarts.map((weekStart, index) => {
    const weekKey = weekStart.toISOString();
    const overrideGroupId = scheduleOverrides[weekKey];
    
    console.log('Processing week:', { 
      weekKey, 
      overrideGroupId,
      defaultGroupId: groups[index % 8]?.id,
      defaultGroupName: groups[index % 8]?.name,
      hasOverride: !!overrideGroupId
    });
    
    let group;
    if (overrideGroupId) {
      group = groups.find(g => g.id === overrideGroupId);
      if (!group) {
        console.error('Override group not found:', overrideGroupId);
        group = groups[index % 8];
      }
    } else {
      group = groups[index % 8];
    }
    
    return {
      weekStart,
      group: {
        ...group,
        id: group.id // 确保 ID 被正确传递
      }
    };
  });

  // 从 localStorage 加载考勤记录
  useEffect(() => {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
      setAttendanceRecords(JSON.parse(savedRecords));
    } else {
      resetAllData();
    }
  }, []);

  // 检查登录状态
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      setIsAdmin(true);
      setIsRootAdmin(userData.isRoot);
      if (userData.username) {
        setCurrentUsername(userData.username);
      }
    }
  }, []);

  // 修改月份切换处理函数，避免触发评价页面
  const handleDateSelect = (date: Date) => {
    // 更新当前日期
    setCurrentDate(date);
  };

  // 处理年份选择
  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(year));
    setCurrentDate(newDate);
  };

  // 处理月份选择
  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(month));
    setCurrentDate(newDate);
  };

  // 修改 handleAttendanceSave 函数
  const handleAttendanceSave = (status: Partial<AttendanceStatus>) => {
    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(
        r => r.memberId === status.memberId && r.date === status.date
      );
      
      let newRecords;
      if (existingIndex >= 0) {
        newRecords = [...prev];
        newRecords[existingIndex] = { ...newRecords[existingIndex], ...status } as AttendanceStatus;
      } else {
        newRecords = [...prev, { id: Date.now().toString(), ...status } as AttendanceStatus];
      }
      
      // 保存到 localStorage
      localStorage.setItem('attendanceRecords', JSON.stringify(newRecords));
      return newRecords;
    });
  };

  const getAttendanceStatus = (memberId: string, date: Date) => {
    return attendanceRecords.find(
      r => r.memberId === memberId && r.date === date.toISOString()
    );
  };

  // 处理登出
  const handleLogout = () => {
    setIsAdmin(false);
    setIsRootAdmin(false);
    localStorage.removeItem('adminUser');
  };

  // 添加检查是否是第4组的函数
  const isGroup4OnDuty = (date: Date) => {
    const weekSchedule = dutySchedule.find(schedule => {
      const scheduleWeekEnd = addDays(schedule.weekStart, 4);
      return date >= schedule.weekStart && date <= scheduleWeekEnd;
    });
    return weekSchedule?.group.id === '4';
  };

  // 处理值日组更改
  const handleUpdateSchedule = (weekStart: Date, newGroupId: string) => {
    console.log('Updating schedule:', { weekStart, newGroupId });
    const weekKey = weekStart.toISOString();
    const newOverrides = { ...scheduleOverrides, [weekKey]: newGroupId };
    console.log('New overrides:', newOverrides);
    
    // 确保新组存在
    const newGroup = groups.find(g => g.id === newGroupId);
    if (!newGroup) {
      console.error('New group not found:', newGroupId);
      return;
    }

    setScheduleOverrides(newOverrides);
    localStorage.setItem('scheduleOverrides', JSON.stringify(newOverrides));

    // 强制重新渲染
    setCurrentDate(new Date(currentDate));
  };

  // 处理添加额外值日人员
  const handleAddExtraDuty = (date: Date) => {
    setSelectedDate(date);
    setShowAddExtraDutyModal(true);
  };

  // 保存额外值日人员
  const handleSaveExtraDuty = (memberId: string) => {
    if (selectedDate) {
      console.log('Saving extra duty member:', {
        memberId,
        date: selectedDate.toISOString()
      });

      const newExtraMembers = [
        ...extraDutyMembers,
        {
          memberId,
          date: selectedDate.toISOString()
        }
      ];

      console.log('Updated extra duty members:', newExtraMembers);
      
      // 更新状态
      setExtraDutyMembers(newExtraMembers);
      
      // 保存到 localStorage
      localStorage.setItem('extraDutyMembers', JSON.stringify(newExtraMembers));
      
      // 关闭弹窗
      setShowAddExtraDutyModal(false);
      setSelectedDate(null);

      // 强制重新渲染日历
      setCurrentDate(new Date(currentDate));
    }
  };

  // 修改登录处理函数
  const handleLogin = (isRoot: boolean, username?: string) => {
    setIsAdmin(true);
    setIsRootAdmin(isRoot);
    if (username) {
      setCurrentUsername(username);
    }
    localStorage.setItem('adminUser', JSON.stringify({ 
      isRoot,
      username: username || 'ZRWY'
    }));
    setShowLoginModal(false);
  };

  // 修改周选择器组件
  const WeekSelector = ({ 
    currentDate, 
    onChange 
  }: { 
    currentDate: Date; 
    onChange: (date: Date) => void;
  }) => {
    const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    
    // 获取指定年份的所有工作周
    const getWorkWeeks = (year: number) => {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      ).filter(date => date.getFullYear() === year); // 只保留指定年份的周
      
      return weeks.map((weekStart, index) => {
        const weekEnd = addDays(weekStart, 4); // 只到周五
        return {
          weekNumber: index + 1,
          start: weekStart,
          end: weekEnd,
          text: `第${index + 1}周（${format(weekStart, 'M月d日', { locale: zhCN })}至${format(weekEnd, 'M月d日', { locale: zhCN })}）`
        };
      });
    };

    const weeks = getWorkWeeks(selectedYear);
    const currentWeek = weeks.find(week => 
      currentDate >= week.start && currentDate <= week.end
    );

    return (
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow mb-4">
        <select
          value={selectedYear}
          onChange={(e) => {
            const year = parseInt(e.target.value);
            setSelectedYear(year);
            // 选择新年份的第一周
            const firstWeek = getWorkWeeks(year)[0];
            onChange(firstWeek.start);
          }}
          className="border rounded px-3 py-1.5"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}年</option>
          ))}
        </select>
        <select
          value={currentWeek ? weeks.indexOf(currentWeek) : 0}
          onChange={(e) => {
            const week = weeks[parseInt(e.target.value)];
            onChange(week.start);
          }}
          className="border rounded px-3 py-1.5 flex-1"
        >
          {weeks.map((week, index) => (
            <option key={index} value={index}>{week.text}</option>
          ))}
        </select>
      </div>
    );
  };

  // 修改重置数据的函数
  const resetAllData = () => {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    
    setAttendanceRecords(prev => {
      const filteredRecords = prev.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate < twentyMinutesAgo;
      });
      localStorage.setItem('attendanceRecords', JSON.stringify(filteredRecords));
      return filteredRecords;
    });

    // 同样处理额外值日人员记录
    setExtraDutyMembers(prev => {
      const filteredMembers = prev.filter(member => {
        const memberDate = new Date(member.date);
        return memberDate < twentyMinutesAgo;
      });
      localStorage.setItem('extraDutyMembers', JSON.stringify(filteredMembers));
      return filteredMembers;
    });

    // 同样处理值日组更改记录
    const filteredOverrides = Object.entries(scheduleOverrides).reduce((acc, [key, value]) => {
      const overrideDate = new Date(key);
      if (overrideDate < twentyMinutesAgo) {
        acc[key] = value;
      }
      return acc;
    }, {} as {[key: string]: string});
    
    setScheduleOverrides(filteredOverrides);
    localStorage.setItem('scheduleOverrides', JSON.stringify(filteredOverrides));
  };

  // 修改 SubstitutionInfo 组件
  const SubstitutionInfo = ({ date, records }: { date: Date; records: AttendanceStatus[] }) => {
    // 按代指人分组显示代指信息
    const substitutionsBySubstitutor = records.reduce((acc, record) => {
      if (record.substitutedBy) {
        if (!acc[record.substitutedBy]) {
          acc[record.substitutedBy] = [];
        }
        acc[record.substitutedBy].push(record);
      }
      return acc;
    }, {} as { [key: string]: AttendanceStatus[] });

    if (Object.keys(substitutionsBySubstitutor).length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">值日调整信息</h3>
        <div className="space-y-2">
          {Object.entries(substitutionsBySubstitutor).map(([substitutorId, substitutions]) => {
            const substitutor = groups.flatMap(g => g.members).find(m => m.id === substitutorId);
            const substitutedMembers = substitutions.map(s => {
              const member = groups.flatMap(g => g.members).find(m => m.id === s.memberId);
              return member?.name;
            }).filter(Boolean);

            if (!substitutor || substitutedMembers.length === 0) return null;

            return (
              <div key={substitutorId} className="text-sm">
                <p>{substitutor.name} 代替 {substitutedMembers.join(', ')} 值日</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleMemberClick = (member: any, date: Date) => {
    setSelectedMember({ member, date });
  };

  // 添加处理全体缺勤的函数
  const handleGroupAbsent = (date: Date, members: Array<{ id: string; name: string }>) => {
    const dateStr = date.toISOString();
    
    // 为每个成员创建缺勤记录
    members.forEach(member => {
      const newStatus: Partial<AttendanceStatus> = {
        memberId: member.id,
        date: dateStr,
        status: 'absent',
        score: 0,
        penaltyDays: 3,
        isGroupAbsent: true
      };
      handleAttendanceSave(newStatus);
    });
  };

  // 添加处理重大活动的函数
  const handleImportantEvent = (date: Date, members: Array<{ id: string; name: string }>) => {
    const dateStr = date.toISOString();
    
    // 为每个成员创建重大活动记录
    members.forEach(member => {
      const newStatus: Partial<AttendanceStatus> = {
        memberId: member.id,
        date: dateStr,
        status: 'pending',
        score: 0,
        isImportantEvent: true
      };
      handleAttendanceSave(newStatus);
    });
  };

  // 添加删除额外值日人员的函数
  const handleDeleteExtraDuty = (memberId: string, date: string) => {
    const newExtraMembers = extraDutyMembers.filter(
      member => !(member.memberId === memberId && member.date === date)
    );
    setExtraDutyMembers(newExtraMembers);
    localStorage.setItem('extraDutyMembers', JSON.stringify(newExtraMembers));
  };

  // 添加群组评价处理函数
  const handleGroupEvaluation = (date: Date, members: Member[]) => {
    setGroupEvaluationMembers({ members, date });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-[#2a63b7]">
        值日排班表
      </h1>
      
      {/* 导航按钮 */}
      <div className="max-w-6xl mx-auto mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${
              viewMode === 'list'
                ? 'bg-[#2a63b7] text-white'
                : 'bg-white text-[#2a63b7] border border-[#2a63b7]'
            }`}
          >
            列表视图
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded ${
              viewMode === 'calendar'
                ? 'bg-[#2a63b7] text-white'
                : 'bg-white text-[#2a63b7] border border-[#2a63b7]'
            }`}
          >
            日历视图
          </button>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Link
                href="/statistics"
                className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
              >
                考核统计
              </Link>
              {!isRootAdmin && (
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  修改密码
                </button>
              )}
            </>
          )}
          {isRootAdmin && (
            <>
              <Link
                href="/admin-management"
                className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
              >
                管理员管理
              </Link>
              <button
                onClick={resetAllData}
                className="px-4 py-2 bg-[#ff2300] text-white rounded hover:bg-[#cc1c00]"
              >
                重置数据
              </button>
            </>
          )}
          <button
            onClick={() => isAdmin ? handleLogout() : setShowLoginModal(true)}
            className={`px-4 py-2 rounded ${
              isAdmin ? 'bg-[#ff2300] text-white' : 'bg-[#2a63b7] text-white'
            }`}
          >
            {isAdmin ? '退出管理' : '管理员登录'}
          </button>
        </div>
      </div>

      {/* 组别说明 - 仅在日历视图显示 */}
      {viewMode === 'calendar' && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-[#2a63b7]">值日组成员</h2>
            <div className="grid grid-cols-4 gap-4">
              {groups.map(group => (
                <div key={group.id} className="border rounded-lg p-3">
                  <div className="font-medium mb-2">{group.name}</div>
                  <div className="space-y-1">
                    {group.members.map(member => (
                      <div key={member.id} className="text-sm text-gray-600">
                        {member.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 视图切换 */}
      {viewMode === 'calendar' ? (
        <div className="max-w-6xl mx-auto">
          <DutyCalendar
            currentDate={currentDate}
            dutySchedule={dutySchedule}
            attendanceRecords={attendanceRecords}
            extraDutyMembers={extraDutyMembers}
            onDateSelect={handleDateSelect}
            isAdmin={isAdmin}
            onUpdateSchedule={handleUpdateSchedule}
            handleAddExtraDuty={handleAddExtraDuty}
            handleDeleteExtraDuty={handleDeleteExtraDuty}
            isGroup4OnDuty={isGroup4OnDuty}
            onGroupEvaluation={handleGroupEvaluation}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          {/* 周选择器 */}
          <div className="mb-4">
            <WeekSelector
              currentDate={listViewDate}
              onChange={setListViewDate}
            />
          </div>

          {/* 低分预警显示 */}
          <LowScoreWarning 
            attendanceRecords={attendanceRecords}
            groups={groups}
          />

          {/* 当前周的值日安排 */}
          {dutySchedule.map(({ weekStart, group }) => {
            // 只显示当前选中的周
            const weekStartDate = new Date(weekStart);
            const listViewWeekStart = new Date(listViewDate);
            
            if (
              weekStartDate.getFullYear() !== listViewWeekStart.getFullYear() ||
              weekStartDate.getMonth() !== listViewWeekStart.getMonth() ||
              weekStartDate.getDate() !== listViewWeekStart.getDate()
            ) {
              return null;
            }

            const weekDays = Array.from({ length: 5 }, (_, i) => 
              addDays(weekStart, i)
            ).filter(date => !isWeekend(date));

            return (
              <div 
                key={weekStart.toISOString()} 
                className="border rounded-lg p-4 bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {format(weekStart, 'yyyy年MM月dd日', { locale: zhCN })} - 
                    {format(addDays(weekStart, 4), 'MM月dd日', { locale: zhCN })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#2a63b7]">本周值日组:</span>
                    {isAdmin ? (
                      <select
                        value={group.id}
                        onChange={(e) => handleUpdateSchedule(weekStart, e.target.value)}
                        className="px-4 py-1.5 border border-[#2a63b7] text-[#2a63b7] rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-[#2a63b7]"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-4 py-1.5 bg-[#2a63b7] text-white rounded-full font-medium">
                        {group.name}
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleAddExtraDuty(weekStart)}
                        className="ml-2 px-3 py-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        添加值日人员
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {weekDays.map((date) => {
                    // 获取当天的所有值日人员（包括额外值日人员）
                    const extraMembers = extraDutyMembers
                      .filter(em => em.date === date.toISOString())
                      .map(em => {
                        const memberGroup = groups.find(g => 
                          g.members.some(m => m.id === em.memberId)
                        );
                        const member = memberGroup?.members.find(m => m.id === em.memberId);
                        return member ? { ...member, isExtra: true } : null;
                      })
                      .filter(Boolean);

                    const regularMembers = group.members.map(member => ({ ...member, isExtra: false }));
                    const allMembers = [...regularMembers, ...extraMembers];

                    // 添加代指和换值信息的显示
                    return (
                      <div 
                        key={date.toISOString()}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <SubstitutionInfo date={date} records={attendanceRecords} />
                        
                        <div className="text-center mb-3 flex items-center justify-center gap-2">
                          <div>
                            <div className="text-sm text-gray-600">
                              {format(date, 'MM月dd日', { locale: zhCN })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {format(date, 'EEEE', { locale: zhCN })}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleGroupAbsent(date, allMembers.filter((m): m is Member => m !== undefined))}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                title="全体缺勤"
                              >
                                缺
                              </button>
                              <button
                                onClick={() => handleImportantEvent(date, allMembers.filter((m): m is Member => m !== undefined))}
                                className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                                title="重大活动"
                              >
                                活
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {allMembers.map((member) => {
                            if (!member) return null;
                            
                            const record = attendanceRecords.find(
                              r => r.memberId === member.id && r.date === date.toISOString()
                            );

                            // 如果是重大活动日，显示特殊状态
                            if (record?.isImportantEvent) {
                              return (
                                <div 
                                  key={member.id}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span>{member.name}</span>
                                    <span className="text-sm text-purple-600">(重大活动)</span>
                                  </div>
                                  <div className="text-sm text-gray-500">失效</div>
                                </div>
                              );
                            }

                            const isSubstituted = record?.isSubstituted;
                            const isExchanged = record?.isExchanged;
                            const substituteMember = groups.flatMap(g => g.members).find(m => 
                              m.id === (isSubstituted ? record?.substitutedBy : record?.exchangedWith)
                            );

                            return (
                              <div 
                                key={member.id + (member.isExtra ? '-extra' : '')}
                                className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm"
                              >
                                <div className="flex items-center space-x-2">
                                  <span>{member.name}</span>
                                  {(isSubstituted || isExchanged) && substituteMember && (
                                    <span className="text-sm text-blue-600">
                                      {isSubstituted ? 
                                        `(由${substituteMember.name}代指)` : 
                                        `(为${substituteMember.name}还值)`
                                      }
                                    </span>
                                  )}
                                  {record?.isGroupAbsent && (
                                    <span className="text-sm text-red-600">(全体缺勤)</span>
                                  )}
                                  {member.isExtra && regularMembers.some(rm => rm.id === member.id) && (
                                    <span className="text-sm text-orange-600">(额外添加)</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {record && !record.isImportantEvent && (
                                    <div 
                                      className={`w-2 h-2 rounded-full ${
                                        record.status === 'present' ? 'bg-green-500' :
                                        record.status === 'absent' ? 'bg-red-500' :
                                        record.status === 'fail' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                                      }`}
                                    />
                                  )}
                                  <div className="flex gap-2">
                                    {isAdmin && member.isExtra && (
                                      <button
                                        onClick={() => handleDeleteExtraDuty(member.id, date.toISOString())}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        删除
                                      </button>
                                    )}
                                    {isAdmin ? (
                                      <button
                                        onClick={() => handleMemberClick(member, date)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {record && !record.isImportantEvent ? '修改' : '评价'}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleMemberClick(member, date)}
                                        className="text-gray-600"
                                      >
                                        查看
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 考勤评分弹窗 */}
      {selectedMember && (
        <AttendanceModal
          isOpen={true}
          onClose={() => setSelectedMember(null)}
          member={selectedMember.member}
          date={selectedMember.date}
          currentStatus={getAttendanceStatus(
            selectedMember.member.id,
            selectedMember.date
          )}
          onSave={handleAttendanceSave}
          readOnly={!isAdmin}
          attendanceRecords={attendanceRecords}
          allMembers={groups.flatMap(g => g.members)}
        />
      )}

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {/* 添加额外值日人员弹窗 */}
      {selectedDate && (
        <AddExtraDutyModal
          isOpen={showAddExtraDutyModal}
          onClose={() => setShowAddExtraDutyModal(false)}
          onSave={handleSaveExtraDuty}
          date={selectedDate}
        />
      )}

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUsername={currentUsername}
      />

      {/* 添加群组评价弹窗 */}
      {groupEvaluationMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {format(groupEvaluationMembers.date, 'yyyy年MM月dd日')} 值日评价
              </h2>
              <button
                onClick={() => setGroupEvaluationMembers(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                关闭
              </button>
            </div>
            <div className="space-y-4">
              {groupEvaluationMembers.members.map(member => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="font-medium mb-2">{member.name}</div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleMemberClick(member, groupEvaluationMembers.date);
                        setGroupEvaluationMembers(null);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {getAttendanceStatus(member.id, groupEvaluationMembers.date) ? '修改评价' : '添加评价'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 