import { Group } from '@/types';

// 定义人员数据
const MEMBERS_DATA = [
  { name: '赵芸', group: 1 },
  { name: '周抒墨', group: 1 },
  { name: '谈子盈', group: 1 },
  { name: '邸为之', group: 2 },
  { name: 'Alex', group: 2 },
  { name: '甘贝铭', group: 2 },
  { name: '王行健', group: 3 },
  { name: '谢贝俊', group: 3 },
  { name: '夏梦迪', group: 3 },
  { name: '徐南方', group: 4 },
  { name: '陈寰融', group: 4 },
  { name: '赵清越', group: 4 },
  { name: '陈上', group: 5 },
  { name: '朱语歆', group: 5 },
  { name: '杨梅', group: 5 },
  { name: '蔡乐涛', group: 6 },
  { name: '崔郅程', group: 6 },
  { name: '唐知珩', group: 6 },
  { name: '傅稚然', group: 7 },
  { name: '俞陈佳和', group: 7 },
  { name: '高锐', group: 7 },
  { name: '刘宪蓉', group: 8 },
  { name: '徐若轻', group: 8 },
  { name: '樊洛言', group: 8 }
];

// 生成组别数据
export const groups: Group[] = Array.from({ length: 8 }, (_, i) => {
  const groupNumber = i + 1;
  const groupMembers = MEMBERS_DATA.filter(m => m.group === groupNumber);
  
  return {
    id: `group-${groupNumber}`,
    name: `小组${groupNumber}`,
    members: groupMembers.map((member, j) => ({
      id: `member-${groupNumber}-${j}`,
      name: member.name,
      groupId: `group-${groupNumber}`
    }))
  };
}); 