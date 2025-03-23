import { useState, useEffect } from 'react';
import { Admin } from '@/types';
import { verifyLogin } from '@/services/adminService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (isRoot: boolean, username?: string) => void;
}

const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 清除输入信息
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleLogin = () => {
    // 使用 adminService 中的 verifyLogin 函数进行验证
    const { isValid, isRoot } = verifyLogin(username, password);
    
    if (isValid) {
      onLogin(isRoot, username);
    } else {
      setError('用户名或密码错误');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">管理员登录</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 