import { useState, useMemo, useEffect } from 'react';
import { groups } from '@/data/groups';
import { AttendanceStatus, STATUS_COLORS } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RecordDetailModal from '@/components/RecordDetailModal';

const StatisticsPage = () => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceStatus[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedMemberRecords, setSelectedMemberRecords] = useState<{
    records: AttendanceStatus[];
    memberName: string;
  } | null>(null);

  // 计算统计数据
  const statistics = useMemo(() => {
    const stats = groups.flatMap(group => 
      group.members.map(member => {
        const memberRecords = attendanceRecords.filter(r => r.memberId === member.id);
        
        // 计算有效记录和惩罚天数（只考虑有效记录）
        const validRecords = memberRecords.filter(r => r.score !== null && r.score > 0);
        const totalPenaltyDays = memberRecords.reduce((sum, r) => {
          // 修改：计算所有设置了惩罚天数的记录，包括正值和负值
          if (r.penaltyDays) {
            return sum + r.penaltyDays;
          }
          return sum;
        }, 0);
        
        const averageScore = validRecords.length 
          ? (validRecords.reduce((sum, r) => sum + (r.score || 0), 0) / validRecords.length).toFixed(1)
          : '-';
        
        return {
          id: member.id,
          name: member.name,
          groupName: group.name,
          totalPenaltyDays: totalPenaltyDays,
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

    if (selectedGroup === 'all') return stats;
    return stats.filter(s => s.groupName === selectedGroup);
  }, [attendanceRecords, selectedGroup]);

  // 检查登录状态和加载考勤记录
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      router.replace('/');
      return;
    }
    const userData = JSON.parse(adminUser);
    setIsAdmin(true);
    setIsRootAdmin(!!userData.isRoot);
    
    // 加载考勤记录
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
      setAttendanceRecords(JSON.parse(savedRecords));
    }
  }, [router]);

  // 处理删除记录的函数
  const handleDeleteRecord = (recordId: string) => {
    // 如果不是终端管理员则不允许删除
    if (!isRootAdmin) return;
    
    // 从记录中删除选中的记录
    const newRecords = attendanceRecords.filter(record => record.id !== recordId);
    setAttendanceRecords(newRecords);
    
    // 保存到localStorage
    localStorage.setItem('attendanceRecords', JSON.stringify(newRecords));
    
    // 更新选中的成员记录
    if (selectedMemberRecords) {
      setSelectedMemberRecords({
        ...selectedMemberRecords,
        records: selectedMemberRecords.records.filter(record => record.id !== recordId)
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#2a63b7]">值日考核统计</h1>
          <div className="flex gap-3">
            {isRootAdmin && (
              <button
                onClick={() => {
                  if (window.confirm('确定清空所有考核记录吗？此操作不可恢复！')) {
                    setAttendanceRecords([]);
                    localStorage.setItem('attendanceRecords', JSON.stringify([]));
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                清空所有记录
              </button>
            )}
            <Link 
              href="/"
              className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
            >
              返回排班表
            </Link>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">选择组别：</span>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border rounded px-3 py-1.5"
            >
              <option value="all">全部</option>
              {groups.map(group => (
                <option key={group.id} value={group.name}>{group.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 统计表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">组别</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">成员</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">平均分</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">考勤情况</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">惩罚天数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {statistics.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{stat.groupName}</td>
                  <td className="px-4 py-3">{stat.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${
                      Number(stat.averageScore) >= 8 ? 'text-[#00bd39]' :
                      Number(stat.averageScore) >= 6 ? 'text-[#ffa500]' :
                      'text-[#ff2300]'
                    }`}>
                      {stat.averageScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" title="已到">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.present }}></span>
                        <span className="text-sm">{stat.attendanceCount.present}</span>
                      </div>
                      <div className="flex items-center gap-1" title="不合格">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.fail }}></span>
                        <span className="text-sm">{stat.attendanceCount.fail}</span>
                      </div>
                      <div className="flex items-center gap-1" title="缺席">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.absent }}></span>
                        <span className="text-sm">{stat.attendanceCount.absent}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {stat.totalPenaltyDays > 0 && (
                      <span className="text-[#ff2300] font-medium">
                        +{stat.totalPenaltyDays}天
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => setSelectedMemberRecords({
                        records: stat.records,
                        memberName: stat.name
                      })}
                      className="text-[#2a63b7] hover:underline text-sm"
                    >
                      查看记录
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 详细记录弹窗 */}
      {selectedMemberRecords && (
        <RecordDetailModal
          isOpen={true}
          onClose={() => setSelectedMemberRecords(null)}
          records={selectedMemberRecords.records}
          memberName={selectedMemberRecords.memberName}
          onDeleteRecord={isRootAdmin ? handleDeleteRecord : undefined}
        />
      )}
    </div>
  );
};

export default StatisticsPage; 