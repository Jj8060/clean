import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { dutyStatuses } from '@/data/dutyStatus';
import { DutyStatus } from '@/types';

export const useDutyStatuses = (date: Date) => {
  const [statuses, setStatuses] = useState<DutyStatus[]>([]);

  useEffect(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const filteredStatuses = dutyStatuses.filter(status => status.date === dateStr);
    setStatuses(filteredStatuses);
  }, [date]);

  return statuses;
}; 