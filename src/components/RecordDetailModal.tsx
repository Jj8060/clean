import { AttendanceStatus, STATUS_COLORS } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useState, useEffect } from 'react';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceStatus[];
  memberName: string;
  onDeleteRecord?: (recordId: string) => void;
}

const RecordDetailModal = ({
  isOpen,
  onClose,
  records,
  memberName,
  onDeleteRecord,
}: RecordDetailModalProps) => {
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const { isRoot } = JSON.parse(adminUser);
      setIsRootAdmin(isRoot);
    }
  }, []);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#2a63b7]">{memberName} 的考勤记录</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无考勤记录
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-600">
                <th className="pb-2 px-4">日期</th>
                <th className="pb-2 px-4">状态</th>
                <th className="pb-2 px-4">评分</th>
                <th className="pb-2 px-4">惩罚天数</th>
                <th className="pb-2 px-4">备注</th>
                {isRootAdmin && onDeleteRecord && (
                  <th className="pb-2 px-4">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {format(new Date(record.date), 'yyyy年MM月dd日', { locale: zhCN })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[record.status] }}
                      />
                      <span>
                        {record.status === 'present' ? '已到' : 
                         record.status === 'absent' ? '缺席' :
                         record.status === 'fail' ? '不合格' : '待评价'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`${
                      record.score >= 8 ? 'text-green-500' :
                      record.score >= 6 ? 'text-yellow-500' :
                      record.score > 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {record.score || '未评分'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {record.penaltyDays ? `${record.penaltyDays}天` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {record.comment || '-'}
                  </td>
                  {isRootAdmin && onDeleteRecord && (
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          if (window.confirm(`确定要删除此记录吗？（${format(new Date(record.date), 'yyyy年MM月dd日', { locale: zhCN })}）`)) {
                            onDeleteRecord(record.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="删除记录"
                      >
                        删除
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecordDetailModal; 