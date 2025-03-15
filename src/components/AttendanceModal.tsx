import { useState } from 'react';
import { AttendanceStatus } from '@/types';
import { groups } from '@/data/groups';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: { id: string; name: string };
  date: Date;
  currentStatus?: AttendanceStatus;
  onSave: (status: Partial<AttendanceStatus>) => void;
  readOnly?: boolean;
  allMembers?: Array<{ id: string; name: string }>;
}

const AttendanceModal = ({
  isOpen,
  onClose,
  member,
  date,
  currentStatus,
  onSave,
  readOnly = false,
  allMembers = []
}: AttendanceModalProps) => {
  const [status, setStatus] = useState<'present' | 'absent' | 'fail' | 'pending'>(
    currentStatus?.status || 'pending'
  );
  const [score, setScore] = useState<number>(currentStatus?.score || 0);
  const [penaltyDays, setPenaltyDays] = useState<number>(currentStatus?.penaltyDays || 0);
  const [isSubstituted, setIsSubstituted] = useState<boolean>(currentStatus?.isSubstituted || false);
  const [substitutedBy, setSubstitutedBy] = useState<string>(currentStatus?.substitutedBy || '');
  const [isExchanged, setIsExchanged] = useState<boolean>(currentStatus?.isExchanged || false);
  const [exchangedWith, setExchangedWith] = useState<string>(currentStatus?.exchangedWith || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      status,
      score,
      penaltyDays,
      isSubstituted,
      substitutedBy,
      isExchanged,
      exchangedWith
    });
    onClose();
  };

  // 获取所有可选的成员（除了当前成员）
  const availableMembers = allMembers.filter(m => m.id !== member.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{member.name} 的值日记录</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!readOnly && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出勤状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border rounded-md p-2"
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
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full border rounded-md p-2"
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
                onChange={(e) => setPenaltyDays(Number(e.target.value))}
                className="w-full border rounded-md p-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSubstituted"
                  checked={isSubstituted}
                  onChange={(e) => {
                    setIsSubstituted(e.target.checked);
                    if (!e.target.checked) {
                      setSubstitutedBy('');
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="isSubstituted" className="text-sm font-medium text-gray-700">
                  代指
                </label>
              </div>

              {isSubstituted && (
                <div>
                  <select
                    value={substitutedBy}
                    onChange={(e) => setSubstitutedBy(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">选择代指人</option>
                    {availableMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isExchanged"
                  checked={isExchanged}
                  onChange={(e) => {
                    setIsExchanged(e.target.checked);
                    if (!e.target.checked) {
                      setExchangedWith('');
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="isExchanged" className="text-sm font-medium text-gray-700">
                  换值
                </label>
              </div>

              {isExchanged && (
                <div>
                  <select
                    value={exchangedWith}
                    onChange={(e) => setExchangedWith(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">选择换值人</option>
                    {availableMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {readOnly && (
          <div className="space-y-2">
            <p>出勤状态：{
              status === 'present' ? '已到' :
              status === 'absent' ? '缺席' :
              status === 'fail' ? '不合格' : '待定'
            }</p>
            <p>评分：{score}</p>
            {penaltyDays > 0 && <p>惩罚天数：{penaltyDays}</p>}
            {isSubstituted && substitutedBy && (
              <p>代指人：{allMembers.find(m => m.id === substitutedBy)?.name}</p>
            )}
            {isExchanged && exchangedWith && (
              <p>换值人：{allMembers.find(m => m.id === exchangedWith)?.name}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal; 