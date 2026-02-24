export function createPageUrl(pageName: string) {
    const mapping: Record<string, string> = {
        'CustomerDetail': '/customers/detail',
        'ContractDetail': '/contracts/detail',
        'Dashboard': '/',
        'Customers': '/customers',
        'Contracts': '/contracts',
        'VvlDashboard': '/vvl',
        'Providers': '/providers',
        'Tasks': '/tasks',
        'Backup': '/backup',
        'Branches': '/branches',
        'Users': '/users',
        'Settings': '/settings'
    };

    return mapping[pageName] || '/' + pageName.toLowerCase().replace(/ /g, '-');
}