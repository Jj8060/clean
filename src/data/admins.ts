import { Admin } from '@/types';

export const rootAdmin: Admin = {
  username: 'ZRWY',
  password: 'GL',
  isRoot: true,
  createdAt: new Date().toISOString()
};

export const admins: Admin[] = [
  {
    username: 'admin1',
    password: 'adminfirst',
    isRoot: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'admin2',
    password: 'adminsecond',
    isRoot: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'admin3',
    password: 'adminthird',
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