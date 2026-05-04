import type { IconType } from 'react-icons';
export interface NavItem {
    id: string;
    label: string;
    icon: IconType;
    badge?: string | null;
    children?: NavItem[];
}
export interface NavGroup {
    group: string;
    items: NavItem[];
}
export { MENU, ALL_PAGES, findPage } from './lib/menu';
//# sourceMappingURL=navigation.d.ts.map