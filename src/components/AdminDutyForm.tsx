import { useState } from 'react';
import { DutyStatus } from '@/types';

export const AdminDutyForm = ({ memberId, date, onSubmit }: {
  memberId: string;
  date: string;
  onSubmit: (status: DutyStatus) => void;
}) => {
  const [status, setStatus] = useState<DutyStatus['status']>('已完成');
  const [punishmentDays, setPunishmentDays] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      memberId,
      date,
      status,
      punishmentDays,
      comment
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">值日状态</label>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value as DutyStatus['status'])}
          className="w-full border p-2"
        >
          <option value="已完成">已完成</option>
          <option value="未完成">未完成</option>
          <option value="缺勤">缺勤</option>
        </select>
      </div>

      <div>
        <label className="block">惩罚天数</label>
        <input
          type="number"
          value={punishmentDays}
          onChange={e => setPunishmentDays(Number(e.target.value))}
          className="w-full border p-2"
          min={0}
        />
      </div>

      <div>
        <label className="block">备注</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full border p-2"
        />
      </div>

      <button 
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        提交
      </button>
    </form>
  );
}; 