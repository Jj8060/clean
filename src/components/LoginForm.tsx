import { useState } from 'react';
import { rootAdmin, admins } from '@/data/admins';

export const LoginForm = ({ onLogin }: { onLogin: (isRoot: boolean) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否是终端管理员
    if (username === rootAdmin.username && password === rootAdmin.password) {
      onLogin(true);
      return;
    }

    // 检查是否是普通管理员
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
      onLogin(false);
      return;
    }

    setError('用户名或密码错误');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">用户名</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      <div>
        <label className="block">密码</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border p-2"
        />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <button 
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded"
      >
        管理员登录
      </button>
    </form>
  );
}; 