import { Admin } from '@/types';

export const rootAdmin: Admin = {
  username: 'ZRWY',
  password: 'good luck',
  isRoot: true,
  createdAt: new Date().toISOString()
};

export const admins: Admin[] = [
  {
    username: 'admin1',
    password: 'admin123',
    isRoot: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'admin2',
    password: 'admin456',
    isRoot: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'admin3',
    password: 'admin789',
    isRoot: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'admin4',
    password: 'admin fourth',
    isRoot: false,
    createdAt: new Date().toISOString()
  }
]; 