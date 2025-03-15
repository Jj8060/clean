import { Admin } from '@/types';
import { admins, rootAdmin } from '@/data/admins';

// 从 localStorage 加载管理员数据
const loadAdmins = () => {
  const savedAdmins = localStorage.getItem('admins');
  if (savedAdmins) {
    return JSON.parse(savedAdmins);
  }
  return [];
};

// 保存管理员数据到 localStorage
const saveAdmins = (admins: Admin[]) => {
  localStorage.setItem('admins', JSON.stringify(admins));
};

// 验证登录
export const verifyLogin = (username: string, password: string): { isValid: boolean; isRoot: boolean } => {
  console.log('Verifying login:', { username, password, rootAdmin }); // 添加调试日志
  
  // 检查是否是终端管理员
  if (username === rootAdmin.username && password === rootAdmin.password) {
    return { isValid: true, isRoot: true };
  }
  
  // 检查是否是普通管理员
  const savedAdmins = loadAdmins();
  const admin = savedAdmins.find((a: Admin) => a.username === username && a.password === password);
  return { isValid: !!admin, isRoot: false };
};

// 添加新管理员
export const addAdmin = (newAdmin: Omit<Admin, 'isRoot' | 'createdAt'>) => {
  const savedAdmins = loadAdmins();
  
  // 检查是否已存在相同用户名
  if (savedAdmins.some((admin: Admin) => admin.username === newAdmin.username)) {
    throw new Error('该用户名已存在');
  }

  const admin: Admin = {
    ...newAdmin,
    isRoot: false,
    createdAt: new Date().toISOString()
  };
  
  savedAdmins.push(admin);
  saveAdmins(savedAdmins);
  return admin;
};

// 删除管理员
export const removeAdmin = (username: string) => {
  const savedAdmins = loadAdmins();
  const filteredAdmins = savedAdmins.filter((admin: Admin) => admin.username !== username);
  saveAdmins(filteredAdmins);
  return true;
};

// 获取所有管理员列表
export const getAllAdmins = () => {
  return loadAdmins();
}; 