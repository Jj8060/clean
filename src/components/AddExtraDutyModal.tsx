import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { groups } from '@/data/groups';

interface AddExtraDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string) => void;
  date: Date;
}

const AddExtraDutyModal = ({
  isOpen,
  onClose,
  onSave,
  date,
}: AddExtraDutyModalProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberId) {
      onSave(selectedMemberId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">添加额外值日人员</h2>
        <p className="text-sm text-gray-600 mb-4">
          选择日期: {format(date, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
        </p>
        <p className="text-sm text-blue-600 mb-4">
          <strong>注意:</strong> 如果是因惩罚而补值，将自动减少一天惩罚。但若补值表现不合格，仍可能被追加惩罚天数。
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">选择人员</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">请选择</option>
              {groups.map((group) =>
                group.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {group.name} - {member.name}
                  </option>
                ))
              )}
            </select>
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
              disabled={!selectedMemberId}
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExtraDutyModal; 