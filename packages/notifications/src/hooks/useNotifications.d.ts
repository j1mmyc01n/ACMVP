import type { PushNotification } from '../push';
interface UseNotificationsOptions {
    centreId?: string;
    limit?: number;
}
export declare function useNotifications({ centreId, limit }?: UseNotificationsOptions): {
    notifications: PushNotification[];
    monthlyCount: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};
export {};
//# sourceMappingURL=useNotifications.d.ts.map