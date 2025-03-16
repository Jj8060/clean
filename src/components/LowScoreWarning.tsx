import { AttendanceStatus, Group } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface LowScoreWarningProps {
  attendanceRecords: AttendanceStatus[];
  groups: Group[];
}

const LowScoreWarning = ({ attendanceRecords, groups }: LowScoreWarningProps) => {
  // 获取所有低分记录（1-5分的记录）
  const lowScoreRecords = groups.flatMap(group =>
    group.members.map(member => {
      const memberRecords = attendanceRecords.filter(r => 
        r.memberId === member.id && 
        r.score >= 1 && // 只显示1分及以上的记录
        r.score <= 5 // 只显示5分及以下的记录
      ).map(record => ({
        id: record.id,
        name: member.name,
        score: record.score,
        date: record.date
      }));

      return memberRecords;
    })
  ).flat();

  if (lowScoreRecords.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 overflow-hidden">
      <h3 className="text-lg font-semibold mb-2 text-[#2a63b7]">低分预警</h3>
      <div className="animate-marquee whitespace-nowrap">
        {lowScoreRecords.map(record => (
          <span
            key={record.id}
            className={`inline-block mr-8 ${
              record.score < 4
                ? 'text-red-500 font-bold'
                : 'text-yellow-500 font-semibold'
            }`}
          >
            {record.name}: {format(new Date(record.date), 'yyyy年MM月dd日', { locale: zhCN })}
            获得{record.score}分
          </span>
        ))}
      </div>
    </div>
  );
};

export default LowScoreWarning; 