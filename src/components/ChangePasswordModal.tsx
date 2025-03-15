import { useState } from 'react';
import { Admin } from '@/types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
}

const ChangePasswordModal = ({ isOpen, onClose, currentUsername }: ChangePasswordModalProps) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = () => {
    if (!newUsername || !newPassword) {
      setError('用户名和密码不能为空');
      return;
    }

    const admins = JSON.parse(localStorage.getItem('admins') || '[]') as Admin[];
    const adminIndex = admins.findIndex(a => a.username === currentUsername);
    
    if (adminIndex !== -1) {
      admins[adminIndex].username = newUsername;
      admins[adminIndex].password = newPassword;
      localStorage.setItem('admins', JSON.stringify(admins));
      
      // 更新当前登录信息
      localStorage.setItem('adminUser', JSON.stringify({ 
        username: newUsername,
        isRoot: false 
      }));
      
      setError('');
      onClose();
      window.location.reload(); // 刷新页面以更新状态
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">修改密码</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">新用户名</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleChangePassword}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal; 