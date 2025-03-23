import { Admin } from '@/types';
import { rootAdmin, admins as defaultAdmins } from '@/data/admins';

// 加载管理员数据（结合硬编码的默认管理员和 localStorage 中的管理员）
export const loadAdmins = (includeDisabled = false) => {
  // 首先准备硬编码的默认管理员
  let allAdmins = [rootAdmin, ...defaultAdmins];
  
  // 然后尝试从 localStorage 加载其他管理员
  try {
    if (typeof window !== 'undefined') {
      const savedAdmins = localStorage.getItem('admins');
      if (savedAdmins) {
        try {
          const parsedAdmins = JSON.parse(savedAdmins);
          // 根据参数决定是否包含已禁用的管理员
          const filteredAdmins = includeDisabled 
            ? parsedAdmins 
            : parsedAdmins.filter((admin: Admin) => admin.isDisabled !== true);
          allAdmins = [...allAdmins, ...filteredAdmins];
        } catch (e) {
          console.error('解析管理员数据时出错:', e);
        }
      }
    }
  } catch (error) {
    console.error('加载管理员数据时出错:', error);
  }
  
  return allAdmins;
};

// 保存管理员数据（只保存非默认管理员到 localStorage）
export const saveAdmins = (admins: Admin[]) => {
  try {
    if (typeof window !== 'undefined') {
      // 过滤掉默认管理员
      const defaultUsernames = [rootAdmin.username, ...defaultAdmins.map(a => a.username)];
      const customAdmins = admins.filter(admin => !defaultUsernames.includes(admin.username));
      localStorage.setItem('admins', JSON.stringify(customAdmins));
    }
  } catch (error) {
    console.error('保存管理员数据时出错:', error);
  }
};

// 记录管理员操作
export const logAdminAction = (
  username: string, 
  action: string, 
  details: any, 
  targetType: string, 
  targetId: string
) => {
  try {
    if (typeof window !== 'undefined') {
      const timestamp = new Date().toISOString();
      const actionId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      
      const logEntry = {
        id: actionId,
        username,
        action,
        details,
        targetType,
        targetId,
        timestamp,
        reverted: false
      };
      
      const logsStr = localStorage.getItem('adminLogs') || '{"logs":[]}';
      const logsData = JSON.parse(logsStr);
      logsData.logs.push(logEntry);
      localStorage.setItem('adminLogs', JSON.stringify(logsData));
      
      return actionId;
    }
    return null;
  } catch (error) {
    console.error('记录管理员操作时出错:', error);
    return null;
  }
};

// 获取所有日志
export const getAllLogs = () => {
  try {
    if (typeof window !== 'undefined') {
      const logsStr = localStorage.getItem('adminLogs') || '{"logs":[]}';
      const logsData = JSON.parse(logsStr);
      return logsData.logs || [];
    }
    return [];
  } catch (error) {
    console.error('获取所有日志时出错:', error);
    return [];
  }
};

// 撤销管理员操作
export const revertAdminAction = (actionId: string, revertedBy: string) => {
  try {
    if (typeof window !== 'undefined') {
      const logsStr = localStorage.getItem('adminLogs') || '{"logs":[]}';
      const logsData = JSON.parse(logsStr);
      
      const actionIndex = logsData.logs.findIndex((log: any) => log.id === actionId);
      if (actionIndex === -1) return false;
      
      logsData.logs[actionIndex].reverted = true;
      logsData.logs[actionIndex].revertedBy = revertedBy;
      logsData.logs[actionIndex].revertedAt = new Date().toISOString();
      
      localStorage.setItem('adminLogs', JSON.stringify(logsData));
      return true;
    }
    return false;
  } catch (error) {
    console.error('撤销管理员操作时出错:', error);
    return false;
  }
};

// 验证登录
export const verifyLogin = (username: string, password: string): { isValid: boolean; isRoot: boolean } => {
  // 检查是否是终端管理员
  if (username === rootAdmin.username && password === rootAdmin.password) {
    return { isValid: true, isRoot: true };
  }
  
  // 检查是否是默认管理员
  for (const admin of defaultAdmins) {
    if (admin.username === username && admin.password === password && admin.isDisabled !== true) {
      return { isValid: true, isRoot: false };
    }
  }
  
  // 检查是否是自定义管理员
  if (typeof window !== 'undefined') {
    try {
      const savedAdmins = localStorage.getItem('admins');
      if (savedAdmins) {
        const admins = JSON.parse(savedAdmins);
        const admin = admins.find((a: Admin) => 
          a.username === username && 
          a.password === password && 
          a.isDisabled !== true
        );
        return { isValid: !!admin, isRoot: false };
      }
    } catch (e) {
      console.error('验证登录时出错:', e);
    }
  }
  
  return { isValid: false, isRoot: false };
};

// 添加新管理员
export const addAdmin = (newAdmin: Omit<Admin, 'isRoot' | 'createdAt' | 'isDisabled'>, addedBy: string) => {
  // 加载现有管理员
  const allAdmins = loadAdmins(true);
  
  // 检查是否已存在相同用户名
  if (allAdmins.some((admin: Admin) => admin.username === newAdmin.username)) {
    throw new Error('该用户名已存在');
  }

  const admin: Admin = {
    ...newAdmin,
    isRoot: false,
    createdAt: new Date().toISOString()
  };
  
  try {
    if (typeof window !== 'undefined') {
      const savedAdmins = localStorage.getItem('admins');
      const admins = savedAdmins ? JSON.parse(savedAdmins) : [];
      admins.push(admin);
      localStorage.setItem('admins', JSON.stringify(admins));
      
      // 记录操作
      logAdminAction(
        addedBy,
        'ADD_ADMIN',
        { admin: admin.username },
        'admin',
        admin.username
      );
      
      return admin;
    }
    return null;
  } catch (error) {
    console.error('添加管理员时出错:', error);
    throw new Error('添加管理员失败');
  }
};

// 禁用管理员（而不是删除）
export const disableAdmin = (username: string, disabledBy: string) => {
  try {
    if (typeof window !== 'undefined') {
      const savedAdmins = localStorage.getItem('admins');
      if (!savedAdmins) return false;
      
      const admins = JSON.parse(savedAdmins);
      const adminIndex = admins.findIndex((a: Admin) => a.username === username);
      if (adminIndex === -1) return false;
      
      admins[adminIndex].isDisabled = true;
      admins[adminIndex].disabledAt = new Date().toISOString();
      admins[adminIndex].disabledBy = disabledBy;
      
      localStorage.setItem('admins', JSON.stringify(admins));
      
      // 记录操作
      logAdminAction(
        disabledBy,
        'DISABLE_ADMIN',
        { admin: username },
        'admin',
        username
      );
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('禁用管理员时出错:', error);
    return false;
  }
};

// 启用已禁用的管理员
export const enableAdmin = (username: string, enabledBy: string) => {
  try {
    if (typeof window !== 'undefined') {
      const savedAdmins = localStorage.getItem('admins');
      if (!savedAdmins) return false;
      
      const admins = JSON.parse(savedAdmins);
      const adminIndex = admins.findIndex((a: Admin) => a.username === username);
      if (adminIndex === -1) return false;
      
      admins[adminIndex].isDisabled = false;
      admins[adminIndex].enabledAt = new Date().toISOString();
      admins[adminIndex].enabledBy = enabledBy;
      
      localStorage.setItem('admins', JSON.stringify(admins));
      
      // 记录操作
      logAdminAction(
        enabledBy,
        'ENABLE_ADMIN',
        { admin: username },
        'admin',
        username
      );
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('启用管理员时出错:', error);
    return false;
  }
};

// 获取所有管理员列表（包括已禁用的）
export const getAllAdmins = (includeDisabled = false) => {
  return loadAdmins(includeDisabled);
}; 