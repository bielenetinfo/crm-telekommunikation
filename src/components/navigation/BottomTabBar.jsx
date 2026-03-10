import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, FileText, MoreHorizontal } from 'lucide-react';
import { TabBarItem } from './TabBarItem';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

/**
 * Bottom Tab Bar Navigation for Mobile
 * Sticky bottom navigation with 5 core tabs
 */
export default function BottomTabBar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Tab configuration
    const tabs = [
        {
            id: 'dashboard',
            label: 'Start',
            icon: LayoutDashboard,
            route: createPageUrl('Dashboard'),
            badge: 0
        },
        {
            id: 'customers',
            label: 'Kunden',
            icon: Users,
            route: createPageUrl('Customers'),
            badge: 0
        },
        {
            id: 'vvl',
            label: 'VVL',
            icon: AlertCircle,
            route: createPageUrl('VVL'),
            badge: 0 // Could be dynamically set based on VVL count
        },
        {
            id: 'contracts',
            label: 'Verträge',
            icon: FileText,
            route: createPageUrl('Contracts'),
            badge: 0
        },
        {
            id: 'more',
            label: 'Mehr',
            icon: MoreHorizontal,
            route: createPageUrl('Settings'),
            badge: 0
        },
    ];

    // Determine active tab based on current route
    const getActiveTab = () => {
        const path = location.pathname;

        if (path.includes('/customers') || path.includes('/customer-detail')) return 'customers';
        if (path.includes('/vvl')) return 'vvl';
        if (path.includes('/contracts') || path.includes('/contract-detail')) return 'contracts';
        if (path.includes('/settings') || path.includes('/tasks') || path.includes('/backup')) return 'more';
        return 'dashboard'; // Default
    };

    const activeTab = getActiveTab();

    const handleTabClick = (tab) => {
        navigate(tab.route);
    };

    return (
        <div
            className={cn(
                'fixed bottom-0 left-0 right-0 z-50',
                'glass-card border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.25)]',
                'pb-safe', // Safe area for iOS devices
                'md:hidden' // Hide on tablet/desktop
            )}
            style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
            }}
        >
            <div className="flex items-center justify-around max-w-screen-sm mx-auto px-2">
                {tabs.map((tab) => (
                    <TabBarItem
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => handleTabClick(tab)}
                    />
                ))}
            </div>
        </div>
    );
}
