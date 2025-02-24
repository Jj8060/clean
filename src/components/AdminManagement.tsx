import { useState } from 'react';
import { Admin } from '@/types';
import { addAdmin, removeAdmin, getAllAdmins } from '@/services/adminService';

export const AdminManagement = () => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [admins, setAdmins] = useState<Admin[]>(getAllAdmins());

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername && newPassword) {
      const admin = addAdmin({ username: newUsername, password: newPassword });
      setAdmins([...admins, admin]);
      setNewUsername('');
      setNewPassword('');
    }
  };

  const handleRemoveAdmin = (username: string) => {
    if (window.confirm(`确定要删除管理员 ${username} 吗？`)) {
      if (removeAdmin(username)) {
        setAdmins(admins.filter(a => a.username !== username));
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">管理员管理</h2>
      
      {/* 添加管理员表单 */}
      <form onSubmit={handleAddAdmin} className="mb-6 space-y-4">
        <div>
          <label className="block mb-1">用户名</label>
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          添加管理员
        </button>
      </form>

      {/* 管理员列表 */}
      <div className="space-y-2">
        {admins.map(admin => (
          <div key={admin.username} className="flex justify-between items-center p-2 border rounded">
            <span>{admin.username}</span>
            <button
              onClick={() => handleRemoveAdmin(admin.username)}
              className="text-red-500 hover:text-red-700"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 