export const customers = [
    { id: 1, name: 'Müller GmbH', contact: 'Hans Müller', email: 'info@mueller.de', phone: '+49 521 123456', status: 'Active', address: 'Hauptstr. 1, 33602 Bielefeld' },
    { id: 2, name: 'TechStart UP', contact: 'Lena Weber', email: 'lena@techstart.io', phone: '+49 170 987654', status: 'Active', address: 'Am Jahnplatz 5, 33602 Bielefeld' },
    { id: 3, name: 'Bäckerei Schmidt', contact: 'Karl Schmidt', email: 'bestellung@schmidt-brot.de', phone: '+49 521 555555', status: 'Pending', address: 'Detmolder Str. 100, 33604 Bielefeld' },
    { id: 4, name: 'Kanzlei Dr. Meyer', contact: 'Dr. Thomas Meyer', email: 'kontakt@kanzlei-meyer.de', phone: '+49 521 998877', status: 'Active', address: 'Oberntorwall 12, 33602 Bielefeld' },
    { id: 5, name: 'Gastro West', contact: 'Mehmet Yilmaz', email: 'info@gastro-west.de', phone: '+49 176 112233', status: 'Inactive', address: 'Herforder Str. 200, 33609 Bielefeld' }
];

export const contracts = [
    { id: 101, customerId: 1, type: 'Internet', plan: 'Business Glasfaser 1000', bandwidth: '1 Gbit/s', price: 89.90, status: 'Active', endDate: '2027-01-24' },
    { id: 102, customerId: 1, type: 'Mobile', plan: 'Allnet File Flat', data: 'Unlimited', price: 39.90, status: 'Active', endDate: '2026-06-12' },
    { id: 103, customerId: 2, type: 'Internet', plan: 'VDSL 250', bandwidth: '250 Mbit/s', price: 49.90, status: 'Active', endDate: '2026-03-01' },
    { id: 104, customerId: 4, type: 'Telefonie', plan: 'VoIP Trunk 10', bandwidth: '-', price: 29.90, status: 'Active', endDate: '2026-12-31' },
    { id: 105, customerId: 3, type: 'Internet', plan: 'Business Cable 500', bandwidth: '500 Mbit/s', price: 59.90, status: 'Pending', endDate: '2026-02-01' },
];

export const hardware = [
    { id: 'HW-01', name: 'Fritz!Box 7590 AX', category: 'Router', stock: 12, price: 149.00 },
    { id: 'HW-02', name: 'iPhone 15 Pro', category: 'Smartphone', stock: 5, price: 999.00 },
    { id: 'HW-03', name: 'Sim Card Nano', category: 'SIM', stock: 500, price: 0.00 },
    { id: 'HW-04', name: 'Samsung S24 Ultra', category: 'Smartphone', stock: 2, price: 1199.00 },
];
