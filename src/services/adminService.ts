import { Admin } from '@/types';
import { admins, rootAdmin } from '@/data/admins';

// 验证登录
export const verifyLogin = (username: string, password: string): { isValid: boolean; isRoot: boolean } => {
  console.log('Verifying login:', { username, password, rootAdmin }); // 添加调试日志
  
  // 检查是否是终端管理员
  if (username === rootAdmin.username && password === rootAdmin.password) {
    return { isValid: true, isRoot: true };
  }
  
  // 检查是否是普通管理员
  const admin = admins.find(a => a.username === username && a.password === password);
  return { isValid: !!admin, isRoot: false };
};

// 添加新管理员（仅终端管理员可用）
export const addAdmin = (newAdmin: Omit<Admin, 'isRoot' | 'createdAt'>) => {
  const admin: Admin = {
    ...newAdmin,
    isRoot: false,
    createdAt: new Date().toISOString()
  };
  
  admins.push(admin);
  // 保存到 localStorage
  localStorage.setItem('admins', JSON.stringify(admins));
  return admin;
};

// 删除管理员（仅终端管理员可用）
export const removeAdmin = (username: string) => {
  const index = admins.findIndex(a => a.username === username);
  if (index !== -1) {
    admins.splice(index, 1);
    // 保存到 localStorage
    localStorage.setItem('admins', JSON.stringify(admins));
    return true;
  }
  return false;
};

// 获取所有管理员列表（仅终端管理员可见）
export const getAllAdmins = () => {
  return admins;
}; 