import { useState } from 'react';
import { AttendanceStatus } from '@/types';

export const AdminDutyForm = ({ memberId, date, onSubmit }: {
  memberId: string;
  date: string;
  onSubmit: (status: AttendanceStatus) => void;
}) => {
  const [status, setStatus] = useState<AttendanceStatus['status']>('present');
  const [score, setScore] = useState(10);
  const [penaltyDays, setPenaltyDays] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: `${memberId}-${date}`,
      memberId,
      date,
      status,
      score,
      penaltyDays: penaltyDays > 0 ? penaltyDays : undefined,
      comment: comment.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          状态
        </label>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value as AttendanceStatus['status'])}
          className="w-full border p-2 rounded-md"
        >
          <option value="present">已到</option>
          <option value="absent">缺席</option>
          <option value="fail">不合格</option>
          <option value="pending">待定</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          评分 (0-10)
        </label>
        <input
          type="number"
          min="0"
          max="10"
          value={score}
          onChange={e => setScore(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
          className="w-full border p-2 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          惩罚天数
        </label>
        <input
          type="number"
          min="0"
          value={penaltyDays}
          onChange={e => setPenaltyDays(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full border p-2 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          备注
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="可选：添加备注信息"
          className="w-full border p-2 rounded-md h-24 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
      >
        提交
      </button>
    </form>
  );
}; 