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
  const [score, setScore] = useState(currentStatus?.score || 100);
  const [comment, setComment] = useState(currentStatus?.comment || '');
  const [penaltyDays, setPenaltyDays] = useState(currentStatus?.penaltyDays || 0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      memberId: member.id,
      date: date.toISOString(),
      status,
      score,
      comment,
      penaltyDays,
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
              <option value="late">迟到</option>
              <option value="pending">待评价</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">分数</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full border p-2 rounded"
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="block mb-1">惩罚天数</label>
            <input
              type="number"
              value={penaltyDays}
              onChange={(e) => setPenaltyDays(Number(e.target.value))}
              className="w-full border p-2 rounded"
              min={0}
            />
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