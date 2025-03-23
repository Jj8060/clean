import { useState, useEffect } from 'react';
import { Admin } from '@/types';
import { addAdmin, disableAdmin, enableAdmin, getAllAdmins, getAllLogs, revertAdminAction } from '@/services/adminService';
import { admins as defaultAdmins } from '@/data/admins';

export const AdminManagement = () => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [isRoot, setIsRoot] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // 加载所有管理员，包括已禁用的
  useEffect(() => {
    setAdmins(getAllAdmins(true));
    
    // 获取当前登录用户信息
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      setCurrentUsername(userData.username);
      setIsRoot(userData.isRoot);
    }
    
    // 加载日志
    setLogs(getAllLogs());
  }, []);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername || !newPassword) {
      setError('请填写完整信息');
      return;
    }

    try {
      const admin = addAdmin({ username: newUsername, password: newPassword }, currentUsername);
      setAdmins(getAllAdmins(true));
      setNewUsername('');
      setNewPassword('');
      alert('管理员添加成功！');
      
      // 刷新日志
      setLogs(getAllLogs());
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

  // 处理禁用管理员
  const handleDisableAdmin = (username: string) => {
    if (window.confirm(`确定要禁用管理员 ${username} 吗？禁用后该账户将无法登录。`)) {
      const success = disableAdmin(username, currentUsername);
      if (success) {
        alert(`管理员 ${username} 已禁用`);
        // 刷新管理员列表和日志
        setAdmins(getAllAdmins(true));
        setLogs(getAllLogs());
      } else {
        alert('禁用操作失败');
      }
    }
  };

  // 处理启用管理员
  const handleEnableAdmin = (username: string) => {
    if (window.confirm(`确定要启用管理员 ${username} 吗？启用后该账户将可以正常登录。`)) {
      const success = enableAdmin(username, currentUsername);
      if (success) {
        alert(`管理员 ${username} 已启用`);
        // 刷新管理员列表和日志
        setAdmins(getAllAdmins(true));
        setLogs(getAllLogs());
      } else {
        alert('启用操作失败');
      }
    }
  };

  // 处理撤销操作
  const handleRevertAction = (actionId: string) => {
    if (window.confirm('确定要撤销此操作吗？')) {
      const success = revertAdminAction(actionId, currentUsername);
      if (success) {
        alert('操作已撤销');
        // 刷新日志
        setLogs(getAllLogs());
      } else {
        alert('撤销操作失败');
      }
    }
  };

  // 格式化操作详情
  const formatActionDetails = (action: string, details: any) => {
    switch (action) {
      case 'ADD_ADMIN':
        return `添加管理员: ${details.admin}`;
      case 'DISABLE_ADMIN':
        return `禁用管理员: ${details.admin}`;
      case 'ENABLE_ADMIN':
        return `启用管理员: ${details.admin}`;
      default:
        return `${action}: ${JSON.stringify(details)}`;
    }
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">管理员列表</h3>
        <div className="space-y-2">
          {admins.map(admin => (
            <div 
              key={admin.username} 
              className={`flex items-center justify-between p-3 rounded-md ${
                admin.isDisabled ? 'bg-gray-100' : 'bg-gray-50'
              }`}
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  {admin.username}
                  {admin.isRoot && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">终端管理员</span>
                  )}
                  {admin.isDisabled && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">已禁用</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  创建时间：{new Date(admin.createdAt || '').toLocaleString()}
                </div>
                {admin.disabledAt && (
                  <div className="text-sm text-gray-500">
                    禁用时间：{new Date(admin.disabledAt).toLocaleString()}
                    {admin.disabledBy && ` (由 ${admin.disabledBy} 执行)`}
                  </div>
                )}
                {admin.enabledAt && (
                  <div className="text-sm text-gray-500">
                    启用时间：{new Date(admin.enabledAt).toLocaleString()}
                    {admin.enabledBy && ` (由 ${admin.enabledBy} 执行)`}
                  </div>
                )}
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
              {!admin.isRoot && (
                <div className="flex space-x-2">
                  {admin.isDisabled ? (
                    <button
                      onClick={() => handleEnableAdmin(admin.username)}
                      className="text-green-500 hover:text-green-700"
                    >
                      启用
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDisableAdmin(admin.username)}
                      className="text-red-500 hover:text-red-700"
                    >
                      禁用
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {admins.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              暂无管理员
            </div>
          )}
        </div>
      </div>

      {isRoot && (
        <div className="p-6 border-t">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">管理员操作日志</h3>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {showLogs ? '隐藏日志' : '查看日志'}
            </button>
          </div>
          
          {showLogs && (
            <div className="space-y-2 mt-4">
              {logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          时间
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户名
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map(log => (
                        <tr key={log.id} className={log.reverted ? 'bg-gray-100' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatActionDetails(log.action, log.details)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.reverted ? (
                              <span className="text-red-500">
                                已撤销 
                                {log.revertedBy && <span> (由 {log.revertedBy} 撤销)</span>}
                              </span>
                            ) : (
                              <span className="text-green-500">有效</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {!log.reverted && (
                              <button
                                onClick={() => handleRevertAction(log.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                撤销
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  暂无操作日志
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManagement; 