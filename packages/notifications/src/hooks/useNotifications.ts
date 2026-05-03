import { useState, useEffect } from 'react';
import { listPushNotifications, getMonthlyPushCount } from '../push';
import type { PushNotification } from '../push';

interface UseNotificationsOptions {
  centreId?: string;
  limit?: number;
}

export function useNotifications({ centreId, limit = 20 }: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [{ data }, count] = await Promise.all([
        listPushNotifications({ centreId, limit }),
        centreId ? getMonthlyPushCount(centreId) : Promise.resolve(0),
      ]);
      setNotifications(data ?? []);
      setMonthlyCount(count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [centreId, limit]);

  return { notifications, monthlyCount, loading, error, refresh };
}
