import { useState } from 'react';
import { AttendanceStatus } from '@/types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: { id: string; name: string };
  date: Date;
  currentStatus?: AttendanceStatus;
  onSave: (status: Partial<AttendanceStatus>) => void;
}

const AttendanceModal = ({
  isOpen,
  onClose,
  member,
  date,
  currentStatus,
  onSave,
}: AttendanceModalProps) => {
  const [status, setStatus] = useState<AttendanceStatus['status']>(
    currentStatus?.status || 'pending'
  );
  const [score, setScore] = useState(currentStatus?.score || 7);
  const [comment, setComment] = useState(currentStatus?.comment || '');
  const [absentCount, setAbsentCount] = useState(currentStatus?.absentCount || 0);
  const [failCount, setFailCount] = useState(currentStatus?.failCount || 0);

  if (!isOpen) return null;

  // 计算惩罚天数
  const calculatePenaltyDays = (newStatus: AttendanceStatus['status'], newScore: number) => {
    let penaltyDays = 0;
    
    if (newStatus === 'absent') {
      // 第一次缺勤2天，之后每次+3天
      const newAbsentCount = absentCount + 1;
      penaltyDays = 2 + (newAbsentCount - 1) * 3;
      setAbsentCount(newAbsentCount);
    } else if (newStatus === 'fail' || newScore < 6) {
      // 不合格或分数低于6分，第一次1天，之后每次+2天
      const newFailCount = failCount + 1;
      penaltyDays = 1 + (newFailCount - 1) * 2;
      // 如果分数低于3分，额外加1天惩罚
      if (newScore < 3) {
        penaltyDays += 1;
      }
      setFailCount(newFailCount);
    }
    
    return penaltyDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const penaltyDays = calculatePenaltyDays(status, score);
    onSave({
      memberId: member.id,
      date: date.toISOString(),
      status,
      score,
      comment,
      penaltyDays,
      absentCount,
      failCount
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">考勤评分</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">值日人员</label>
            <div className="p-2 bg-gray-100 rounded">{member.name}</div>
          </div>
          <div>
            <label className="block mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus['status'])}
              className="w-full border p-2 rounded"
            >
              <option value="present">已到</option>
              <option value="absent">缺勤</option>
              <option value="fail">不合格</option>
              <option value="pending">待评价</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">分数 (1-10分)</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full border p-2 rounded"
              min={1}
              max={10}
            />
            {score < 6 && (
              <p className="text-xs text-red-500 mt-1">
                注意：分数低于6分将被视为不合格，会增加惩罚天数
              </p>
            )}
            {score < 3 && (
              <p className="text-xs text-red-500 mt-1">
                注意：分数低于3分将额外增加1天惩罚天数
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1">备注</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal; 