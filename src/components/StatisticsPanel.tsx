import { useState, useEffect } from 'react';
import { Member, AttendanceStatus } from '@/types';
import { dutyStatuses } from '@/data/dutyStatus';

interface MemberStats {
  completedDuties: number;
  failedDuties: number;
  absentDuties: number;
  averageScore: number;
}

export const StatisticsPanel = ({ members }: { members: Member[] }) => {
  const [stats, setStats] = useState<{ [key: string]: MemberStats }>({});

  useEffect(() => {
    const newStats: { [key: string]: MemberStats } = {};
    members.forEach(member => {
      const memberStatuses = dutyStatuses.filter(s => s.memberId === member.id);
      const memberStats: MemberStats = {
        completedDuties: memberStatuses.filter(s => s.status === 'present').length,
        failedDuties: memberStatuses.filter(s => s.status === 'fail').length,
        absentDuties: memberStatuses.filter(s => s.status === 'absent').length,
        averageScore: memberStatuses.length > 0
          ? memberStatuses.reduce((sum, s) => sum + s.score, 0) / memberStatuses.length
          : 0
      };
      newStats[member.id] = memberStats;
    });
    setStats(newStats);
  }, [members, dutyStatuses]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">值日统计</h2>
      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="border-b pb-4">
            <h3 className="font-medium mb-2">{member.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">已完成值日：</span>
                <span className="text-green-600">{stats[member.id]?.completedDuties || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">不合格次数：</span>
                <span className="text-yellow-600">{stats[member.id]?.failedDuties || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">缺席次数：</span>
                <span className="text-red-600">{stats[member.id]?.absentDuties || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">平均分数：</span>
                <span className={`font-medium ${
                  (stats[member.id]?.averageScore || 0) >= 8 ? 'text-green-600' :
                  (stats[member.id]?.averageScore || 0) >= 6 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {(stats[member.id]?.averageScore || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 