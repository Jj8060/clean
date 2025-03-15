import { useState, useEffect } from 'react';
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
  attendanceRecords: AttendanceStatus[];
}

const AttendanceModal = ({
  isOpen,
  onClose,
  member,
  date,
  currentStatus,
  onSave,
  readOnly = false,
  allMembers = [],
  attendanceRecords = []
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

  // 获取当前成员的代指记录
  const [substitutionCount, setSubstitutionCount] = useState<number>(0);
  const [substitutedFor, setSubstitutedFor] = useState<string[]>([]);
  
  useEffect(() => {
    // 查找当前成员代替他人值日的记录
    const records = attendanceRecords.filter(record => 
      record.substitutedBy === member.id && !record.isExchanged
    );
    
    // 获取被代替的成员ID列表
    const substitutedMembers = records.map(record => record.memberId);
    setSubstitutedFor(substitutedMembers);
    setSubstitutionCount(records.length);
  }, [member.id, attendanceRecords]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newStatus: Partial<AttendanceStatus> = {
      status,
      score: isSubstituted ? 0 : score, // 如果是被代指，分数记为0
      penaltyDays,
      isSubstituted,
      substitutedBy,
      isExchanged,
      exchangedWith
    };

    // 如果是代指，更新代指人的记录
    if (isSubstituted && substitutedBy) {
      // 代指人的分数和惩罚天数
      const substitutorStatus: Partial<AttendanceStatus> = {
        memberId: substitutedBy,
        date: date.toISOString(),
        status: 'present',
        score,
        penaltyDays: 2, // 代指自动罚值2天
        substitutionCount: (currentStatus?.substitutionCount || 0) + 1,
        substitutedFor: [...(currentStatus?.substitutedFor || []), member.id]
      };
      onSave(substitutorStatus);
    }

    // 如果是还值，更新代指次数
    if (isExchanged && exchangedWith) {
      const updatedSubstitutionCount = substitutionCount - 1;
      const updatedSubstitutedFor = substitutedFor.filter(id => id !== exchangedWith);
      
      newStatus.substitutionCount = updatedSubstitutionCount;
      newStatus.substitutedFor = updatedSubstitutedFor;
    }

    onSave(newStatus);
    onClose();
  };

  // 获取所有可选的成员（除了当前成员）
  const availableMembers = allMembers.filter(m => m.id !== member.id);

  // 获取可以还值的成员列表（当前成员代替过的人）
  const exchangeableMembers = allMembers.filter(m => 
    substitutedFor.includes(m.id)
  );

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

            {substitutionCount > 0 && (
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
                    还值 (代指次数: {substitutionCount})
                  </label>
                </div>

                {isExchanged && (
                  <div>
                    <select
                      value={exchangedWith}
                      onChange={(e) => setExchangedWith(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">选择还值对象</option>
                      {exchangeableMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

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
              <p>还值对象：{allMembers.find(m => m.id === exchangedWith)?.name}</p>
            )}
            {substitutionCount > 0 && (
              <p>代指次数：{substitutionCount}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal; 