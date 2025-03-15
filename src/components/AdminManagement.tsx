import { useState } from 'react';
import { Admin } from '@/types';
import { addAdmin, removeAdmin, getAllAdmins } from '@/services/adminService';

export const AdminManagement = () => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [admins, setAdmins] = useState<Admin[]>(getAllAdmins());
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState('');

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername || !newPassword) {
      setError('请填写完整信息');
      return;
    }

    try {
      const admin = addAdmin({ username: newUsername, password: newPassword });
      setAdmins([...admins, admin]);
      setNewUsername('');
      setNewPassword('');
      alert('管理员添加成功！');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleAdminPassword = (username: string) => {
    setShowAdminPassword(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-[#2a63b7]">添加新管理员</h2>
        <form onSubmit={handleAddAdmin} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">账户名称</label>
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2a63b7] focus:ring-[#2a63b7]"
              placeholder="请输入账户名称"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#2a63b7] focus:ring-[#2a63b7]"
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button 
            type="submit"
            className="w-full bg-[#2a63b7] text-white py-2 px-4 rounded-md hover:bg-[#245091] transition-colors"
          >
            添加管理员
          </button>
        </form>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">现有管理员列表</h3>
        <div className="space-y-2">
          {admins.map(admin => (
            <div 
              key={admin.username} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <div className="font-medium">{admin.username}</div>
                <div className="text-sm text-gray-500">
                  创建时间：{new Date(admin.createdAt || '').toLocaleString()}
                </div>
                <div className="text-sm mt-1 flex items-center gap-2">
                  <span className="text-gray-500">密码：</span>
                  <span className="font-mono">
                    {showAdminPassword[admin.username] ? admin.password : '••••••'}
                  </span>
                  <button
                    onClick={() => toggleAdminPassword(admin.username)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    {showAdminPassword[admin.username] ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`确定要删除管理员 ${admin.username} 吗？`)) {
                    removeAdmin(admin.username);
                    setAdmins(admins.filter(a => a.username !== admin.username));
                  }
                }}
                className="text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
          ))}
          {admins.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              暂无管理员
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement; 