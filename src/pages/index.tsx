import { useState, useEffect } from 'react';
import { groups } from '@/data/groups';
import { format, eachWeekOfInterval, isWeekend, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import AttendanceModal from '@/components/AttendanceModal';
import CalendarView from '@/components/CalendarView';
import { AttendanceStatus, STATUS_COLORS, Member, DutyMember } from '@/types';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';
import AddExtraDutyModal from '@/components/AddExtraDutyModal';
import DutyCalendar from '@/components/DutyCalendar';
import LowScoreWarning from '@/components/LowScoreWarning';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { calculatePenaltyDays } from '@/utils/penaltyCalculation';

// 添加低分预警组件
const LowScoreMarquee = ({ statistics }: { statistics: any[] }) => {
  // 只考虑有评分且分数小于6且大于0的成员
  const lowScoreMembers = statistics.filter(stat => 
    Number(stat.averageScore) > 0 && 
    Number(stat.averageScore) < 6 && 
    stat.averageScore !== '-' && 
    stat.records.some((r: any) => r.score !== null && r.score > 0)
  );
  
  if (lowScoreMembers.length === 0) return null;

  // 为每个成员找出最近的低分记录
  const membersWithRecentLowScores = lowScoreMembers.map(member => {
    // 筛选出有效的低分记录（分数小于6且大于0的记录）
    const lowScoreRecords = member.records.filter((r: any) => 
      r.score !== null && r.score > 0 && r.score < 6
    );
    
    // 按日期排序，找出最近的记录
    const sortedRecords = lowScoreRecords.sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const recentLowScore = sortedRecords[0];
    
    return {
      ...member,
      recentLowScoreDate: recentLowScore ? new Date(recentLowScore.date) : null
    };
  }).filter(member => member.recentLowScoreDate !== null);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        {membersWithRecentLowScores.map(member => (
          <span
            key={member.id}
            className={`inline-block mr-8 ${
              Number(member.averageScore) < 3 
                ? 'text-red-500 font-bold'
                : 'text-yellow-500 font-semibold'
            }`}
          >
            {member.name}: {member.averageScore}分
            {member.recentLowScoreDate && (
              <span className="ml-1">
                ({member.recentLowScoreDate.getMonth() + 1}月
                {member.recentLowScoreDate.getDate()}日不合格)
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
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
      // 初始化空数组
      setAttendanceRecords([]);
      localStorage.setItem('attendanceRecords', JSON.stringify([]));
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
    // 修复：使用完整的日期创建新日期对象，确保不会丢失日期信息
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(year));
    // 先更新状态
    setCurrentDate(newDate);
    // 然后显式调用日期选择函数，确保视图更新
    handleDateSelect(newDate);
  };

  // 处理月份选择
  const handleMonthChange = (month: string) => {
    // 修复：使用完整的日期创建新日期对象，确保不会丢失日期信息
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(month));
    // 先更新状态
    setCurrentDate(newDate);
    // 然后显式调用日期选择函数，确保视图更新
    handleDateSelect(newDate);
  };

  // 修改 handleAttendanceSave 函数
  const handleAttendanceSave = (status: Partial<AttendanceStatus>) => {
    console.log('Saving attendance status:', status);
    
    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(
        r => r.memberId === status.memberId && r.date === status.date
      );
      
      let newRecords;
      if (existingIndex >= 0) {
        // 如果记录已存在，更新它但保留其ID
        newRecords = [...prev];
        // 确保ID被保留
        const recordId = newRecords[existingIndex].id;
        
        // 添加调试信息
        console.log('Updating existing record:', {
          old: newRecords[existingIndex],
          new: { ...status }
        });
        
        // 确保isGroupAbsent状态被正确处理
        newRecords[existingIndex] = { 
          ...newRecords[existingIndex], 
          ...status,
          id: recordId,
          // 只有当明确设置为false时才更新isGroupAbsent，否则保持原值
          isGroupAbsent: status.isGroupAbsent !== undefined ? status.isGroupAbsent : newRecords[existingIndex].isGroupAbsent
        } as AttendanceStatus;
      } else {
        // 如果记录不存在，创建新记录
        const newRecord = { 
          id: Date.now().toString(), 
          ...status,
          // 确保comment字段存在
          comment: status.comment || ''
        } as AttendanceStatus;
        
        console.log('Creating new record:', newRecord);
        
        newRecords = [...prev, newRecord];
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
  const handleSaveExtraDuty = () => {
    if (!selectedDate || !selectedMemberId) {
      alert('请选择日期和人员');
      return;
    }

    // 格式化当前选择的日期为ISO字符串
    const formattedDate = selectedDate.toISOString();

    // 防止重复添加
    if (extraDutyMembers.some(duty => 
      new Date(duty.date).toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0] && 
      duty.memberId === selectedMemberId
    )) {
      alert('该人员已经在所选日期安排了额外值日');
      return;
    }

    // 创建新的额外值日记录
    const newDuty: AttendanceStatus = {
      id: `extra-duty-${Date.now()}`,
      date: formattedDate,
      memberId: selectedMemberId,
      status: 'pending',
      score: 0, // 默认分数
      comment: '' // 添加必需的comment字段
    };

    // 更新状态
    const updatedExtraDutyMembers = [...extraDutyMembers, newDuty];
    setExtraDutyMembers(updatedExtraDutyMembers);
    localStorage.setItem('extraDutyMembers', JSON.stringify(updatedExtraDutyMembers));

    // 获取成员的总惩罚天数
    const memberRecords = attendanceRecords.filter(record => record.memberId === selectedMemberId);
    const totalPenaltyDays = memberRecords.reduce((total, record) => total + (record.penaltyDays || 0), 0);

    // 如果成员有惩罚天数，则自动减少一天
    if (totalPenaltyDays > 0) {
      // 创建一个减免惩罚记录
      const compensationRecord: Partial<AttendanceStatus> = {
        id: `compensation-${Date.now()}`,
        date: new Date().toISOString(), // 当前日期
        memberId: selectedMemberId,
        status: 'present', // 标记为出勤
        score: 8, // 默认良好表现
        penaltyDays: -1, // 减少一天惩罚
        comment: `补值自动减免一天惩罚 (补值日期: ${selectedDate.toLocaleDateString()})`,
        isCompensation: true // 标记为补值减免记录
      };

      // 更新考勤记录
      const updatedAttendanceRecords = [...attendanceRecords, compensationRecord as AttendanceStatus];
      setAttendanceRecords(updatedAttendanceRecords);
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedAttendanceRecords));

      // 提示用户添加成功并减少惩罚
      alert(`已添加额外值日人员，并自动减少一天惩罚天数`);
    } else {
      // 如果没有惩罚天数，仅提示添加成功
      alert('已添加额外值日人员');
    }

    // 关闭模态框
    setShowAddExtraDutyModal(false);
    // 重置选择
    setSelectedMemberId('');
    setSelectedDate(new Date());
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

    // 检查是否有20分钟内的更改
    const hasRecentChanges = attendanceRecords.some(record => {
      const recordDate = new Date(record.date);
      return recordDate > twentyMinutesAgo && 
             record.score !== null && 
             record.score >= 1 && 
             record.score <= 10;
    }) || extraDutyMembers.some(member => {
      const memberDate = new Date(member.date);
      return memberDate > twentyMinutesAgo;
    });

    if (!hasRecentChanges) {
      alert('只能重置最近20分钟内的更改');
      return;
    }

    // 重置考勤记录（保留0分记录和20分钟前的记录）
    setAttendanceRecords(prev => {
      const preservedRecords = prev.filter(record => {
        const recordDate = new Date(record.date);
        // 保留以下记录：
        // 1. 20分钟前的记录
        // 2. 0分记录（管理员手动输入的占位符）
        // 3. 超出1-10分范围的记录（这些记录不会影响惩罚系统）
        return recordDate <= twentyMinutesAgo || 
               record.score === 0 || 
               record.score === null ||
               record.score < 1 || 
               record.score > 10;
      });
      localStorage.setItem('attendanceRecords', JSON.stringify(preservedRecords));
      return preservedRecords;
    });

    // 重置额外值日人员记录（仅20分钟内的）
    setExtraDutyMembers(prev => {
      const preservedMembers = prev.filter(member => {
        const memberDate = new Date(member.date);
        return memberDate <= twentyMinutesAgo;
      });
      localStorage.setItem('extraDutyMembers', JSON.stringify(preservedMembers));
      return preservedMembers;
    });

    // 重置值日组更改记录（仅20分钟内的）
    const newScheduleOverrides = { ...scheduleOverrides };
    let hasChanges = false;
    Object.keys(newScheduleOverrides).forEach(dateKey => {
      const overrideDate = new Date(dateKey);
      if (overrideDate > twentyMinutesAgo) {
        delete newScheduleOverrides[dateKey];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setScheduleOverrides(newScheduleOverrides);
      localStorage.setItem('scheduleOverrides', JSON.stringify(newScheduleOverrides));
    }

    // 注意：不重置管理员账户信息（adminUser）
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

  // 修改处理全体缺勤的函数
  const handleGroupAbsent = (date: Date, members: DutyMember[]) => {
    const dateStr = date.toISOString();
    
    // 检查当天是否已经是全体缺勤状态
    const isAlreadyAbsent = members.every(member => {
      const record = attendanceRecords.find(
        r => r.memberId === member.id && r.date === dateStr
      );
      return record?.isGroupAbsent;
    });

    if (isAlreadyAbsent) {
      // 如果已经是全体缺勤，则重置为待定状态
      members.forEach(member => {
        const newStatus: Partial<AttendanceStatus> = {
          memberId: member.id,
          date: dateStr,
          status: 'pending',
          score: 0,
          penaltyDays: 0, // 确保重置惩罚天数为0
          isGroupAbsent: false
        };
        handleAttendanceSave(newStatus);
      });
    } else {
      // 设置为全体缺勤状态
      members.forEach(member => {
        // 获取成员的缺勤次数，用于计算惩罚天数
        const memberRecords = attendanceRecords.filter(r => r.memberId === member.id);
        const absentCount = memberRecords.filter(r => r.status === 'absent').length;
        
        // 计算惩罚天数
        const penaltyDays = calculatePenaltyDays('absent', date, absentCount, null, attendanceRecords);
        
        const newStatus: Partial<AttendanceStatus> = {
          memberId: member.id,
          date: dateStr,
          status: 'absent',
          score: 0,
          penaltyDays,
          isGroupAbsent: true
        };
        handleAttendanceSave(newStatus);
      });
    }
  };

  // 修改处理重大活动的函数
  const handleImportantEvent = (date: Date, members: DutyMember[]) => {
    const dateStr = date.toISOString();
    
    // 检查当天是否已经是重大活动状态
    const isAlreadyImportantEvent = members.every(member => {
      const record = attendanceRecords.find(
        r => r.memberId === member.id && r.date === dateStr
      );
      return record?.isImportantEvent;
    });

    if (isAlreadyImportantEvent) {
      // 如果已经是重大活动，则重置为待定状态
      members.forEach(member => {
        const newStatus: Partial<AttendanceStatus> = {
          memberId: member.id,
          date: dateStr,
          status: 'pending',
          score: 0,
          isImportantEvent: false
        };
        handleAttendanceSave(newStatus);
      });
    } else {
      // 设置为重大活动状态
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
    }
  };

  // 修改重置当天状态的函数，完全删除记录
  const handleResetDay = (date: Date, members: DutyMember[]) => {
    const dateStr = date.toISOString();
    
    // 从考勤记录中删除该日期的所有记录
    setAttendanceRecords(prev => {
      const newRecords = prev.filter(record => 
        record.date !== dateStr || 
        !members.some(member => member.id === record.memberId)
      );
      
      // 保存到 localStorage
      localStorage.setItem('attendanceRecords', JSON.stringify(newRecords));
      return newRecords;
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

  // 计算统计数据 - 修改函数
  const statistics = (() => {
    const stats = groups.flatMap(group => 
      group.members.map(member => {
        const memberRecords = attendanceRecords.filter(r => r.memberId === member.id);
        
        // 计算有效记录（score不为null且大于0的记录）
        const validRecords = memberRecords.filter(r => r.score !== null && r.score > 0);
        const averageScore = validRecords.length 
          ? (validRecords.reduce((sum, r) => sum + (r.score !== null ? r.score : 0), 0) / validRecords.length).toFixed(1)
          : '-';
        
        return {
          id: member.id,
          name: member.name,
          groupName: group.name,
          totalPenaltyDays: memberRecords.reduce((sum, r) => sum + (r.penaltyDays || 0), 0),
          averageScore,
          attendanceCount: {
            present: memberRecords.filter(r => r.status === 'present').length,
            absent: memberRecords.filter(r => r.status === 'absent').length,
            fail: memberRecords.filter(r => r.status === 'fail').length,
          },
          records: memberRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      })
    );

    return stats;
  })();

  // 添加额外值日模态框
  const renderAddExtraDutyModal = () => {
    if (!showAddExtraDutyModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
          <h2 className="text-xl font-bold mb-4">添加额外值日人员</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">选择日期</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">选择人员</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">请选择人员</option>
              {groups.flatMap(group => 
                group.members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({group.name})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            选择日期: {selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : '未选择'}
          </p>
          
          <p className="text-sm text-yellow-600 mb-4">
            如果是因惩罚而补值，将自动减少一天惩罚。但若补值表现不合格，仍可能被追加惩罚天数。
          </p>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setShowAddExtraDutyModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button 
              onClick={handleSaveExtraDuty}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
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
            </>
          )}
          {!isAdmin ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
            >
              管理员登录
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#ff2300] text-white rounded"
            >
              退出管理
            </button>
          )}
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

          {/* 低分预警显示 - 移动到这里 */}
          <LowScoreMarquee statistics={statistics} />

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
                        if (!member) return null;
                        return {
                          ...member,
                          isExtra: true
                        } as DutyMember;
                      })
                      .filter((m): m is DutyMember => m !== null);

                    const regularMembers = group.members.map(member => ({
                      ...member,
                      isExtra: false
                    } as DutyMember));
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
                          <div className="flex gap-1">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleGroupAbsent(date, allMembers.filter((m): m is DutyMember => m !== undefined))}
                                  className={`px-2 py-1 text-xs ${
                                    allMembers.every(m => 
                                      attendanceRecords.find(r => 
                                        r.memberId === m.id && 
                                        r.date === date.toISOString() && 
                                        r.isGroupAbsent
                                      )
                                    )
                                      ? 'bg-gray-500'
                                      : 'bg-red-500'
                                  } text-white rounded hover:bg-opacity-80`}
                                  title={allMembers.every(m => 
                                    attendanceRecords.find(r => 
                                      r.memberId === m.id && 
                                      r.date === date.toISOString() && 
                                      r.isGroupAbsent
                                    )
                                  ) ? '取消全体缺勤' : '全体缺勤'}
                                >
                                  缺
                                </button>
                                <button
                                  onClick={() => handleImportantEvent(date, allMembers.filter((m): m is DutyMember => m !== undefined))}
                                  className={`px-2 py-1 text-xs ${
                                    allMembers.every(m => 
                                      attendanceRecords.find(r => 
                                        r.memberId === m.id && 
                                        r.date === date.toISOString() && 
                                        r.isImportantEvent
                                      )
                                    )
                                      ? 'bg-gray-500'
                                      : 'bg-purple-500'
                                  } text-white rounded hover:bg-opacity-80`}
                                  title={allMembers.every(m => 
                                    attendanceRecords.find(r => 
                                      r.memberId === m.id && 
                                      r.date === date.toISOString() && 
                                      r.isImportantEvent
                                    )
                                  ) ? '取消重大活动' : '重大活动'}
                                >
                                  活
                                </button>
                                <button
                                  onClick={() => handleResetDay(date, allMembers.filter((m): m is DutyMember => m !== undefined))}
                                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="重置当天"
                                >
                                  重
                                </button>
                                <button
                                  onClick={() => handleAddExtraDuty(date)}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                  title="添加值日人员"
                                >
                                  添加
                                </button>
                              </>
                            )}
                          </div>
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
      {renderAddExtraDutyModal()}

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