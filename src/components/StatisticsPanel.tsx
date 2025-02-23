import { useMemo } from 'react';
import { dutyStatuses } from '@/data/dutyStatus';
import { groups } from '@/data/groups';

export const StatisticsPanel = () => {
  const statistics = useMemo(() => {
    const stats = new Map();
    
    groups.forEach(group => {
      group.members.forEach(member => {
        const memberStats = {
          totalDuties: 0,
          completedDuties: 0,
          punishmentDays: member.currentPunishmentDays || 0,
          score: 0
        };
        
        const memberStatuses = dutyStatuses.filter(s => s.memberId === member.id);
        memberStats.totalDuties = memberStatuses.length;
        memberStats.completedDuties = memberStatuses.filter(s => s.status === '已完成').length;
        
        stats.set(member.id, memberStats);
      });
    });
    
    return stats;
  }, [dutyStatuses]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">考核统计</h2>
      {Array.from(statistics.entries()).map(([memberId, stats]) => {
        const member = groups.find(g => g.members.find(m => m.id === memberId))?.members.find(m => m.id === memberId);
        return (
          <div key={memberId} className="mb-2">
            <div className="flex justify-between">
              <span>{member?.name}</span>
              <span>完成率: {((stats.completedDuties / stats.totalDuties) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-sm text-gray-500">
              惩罚天数: {stats.punishmentDays}天
            </div>
          </div>
        );
      })}
    </div>
  );
}; 