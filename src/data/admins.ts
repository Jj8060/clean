import { Admin } from '@/types';

export const rootAdmin: Admin = {
  username: 'ZRWY',
  password: 'GL',
  isRoot: true,
  createdAt: new Date().toISOString()
};

export const admins: Admin[] = []; 