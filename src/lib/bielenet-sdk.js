import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { TOTP } from 'otplib';

// Create TOTP authenticator instance
const authenticator = new TOTP();
import {
    createSession,
    isSessionValid,
    encryptFields,
    decryptFields,
    getEncryptionKey,
    recordFailedLogin,
    clearLoginAttempts,
    isLoginLocked
} from './security.js';
import { validateCustomerData, validateContractData } from './validators.js';

// Simulated Database in LocalStorage
const DB_KEY = 'bielenet_db';
const AUTH_KEY = 'bielenet_auth';
const DB_VERSION_KEY = 'bielenet_db_version';
const DB_VERSION = '1';

// Helper to hash password on first use (migration from plaintext)
const hashPasswordIfNeeded = async (password) => {
    // Check if already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (password && password.match(/^\$2[aby]\$/)) {
        return password;
    }
    // Hash plaintext password
    return await bcrypt.hash(password, 10);
};

const defaultDb = {
    users: [
        { id: 'u1', email: 'admin@bielenet.de', password: 'admin', role: 'admin', name: 'Can Arslan', twoFactorSecret: null }
    ],
    customers: [],
    contracts: [],
    vvlRecords: [],
    reminders: [],
    followups: [],
    activities: [],
    customerHistory: [],
    tasks: [],
    branches: [],
    providers: [],
    hardware: []
};

const getDb = () => {
    try {
        const s = localStorage.getItem(DB_KEY);
        const db = s ? JSON.parse(s) : defaultDb;

        // Decrypt sensitive data if user is logged in
        const sessionStr = localStorage.getItem(AUTH_KEY);
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                if (session.userId && isSessionValid(session)) {
                    const encKey = getEncryptionKey(session.userId);

                    // Decrypt customer data
                    if (db.customers) {
                        db.customers = db.customers.map(customer =>
                            decryptFields(customer, ['email', 'phone', 'birth_date', 'notes'], encKey)
                        );
                    }

                    // Decrypt contract data
                    if (db.contracts) {
                        db.contracts = db.contracts.map(contract =>
                            decryptFields(contract, ['contract_number', 'notes', 'vvl_notes'], encKey)
                        );
                    }
                }
            } catch (e) {
                // Session invalid or decryption failed, return encrypted data
                console.warn('Could not decrypt data:', e);
            }
        }

        return db;
    } catch { return defaultDb; }
};

const saveDb = (db) => {
    // Encrypt sensitive data before saving
    const sessionStr = localStorage.getItem(AUTH_KEY);
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            if (session.userId && isSessionValid(session)) {
                const encKey = getEncryptionKey(session.userId);
                const dbToSave = JSON.parse(JSON.stringify(db)); // Deep clone

                // Encrypt customer data
                if (dbToSave.customers) {
                    dbToSave.customers = dbToSave.customers.map(customer =>
                        encryptFields(customer, ['email', 'phone', 'birth_date', 'notes'], encKey)
                    );
                }

                // Encrypt contract data
                if (dbToSave.contracts) {
                    dbToSave.contracts = dbToSave.contracts.map(contract =>
                        encryptFields(contract, ['contract_number', 'notes', 'vvl_notes'], encKey)
                    );
                }

                localStorage.setItem(DB_KEY, JSON.stringify(dbToSave));
                return;
            }
        } catch (e) {
            console.warn('Could not encrypt data:', e);
        }
    }

    // Fallback: save without encryption
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// --- AUTH MODULE ---
const auth = {
    me: async () => {
        const sessionStr = localStorage.getItem(AUTH_KEY);
        if (!sessionStr) throw { status: 401 };
        const session = JSON.parse(sessionStr);

        // Check session validity
        if (!session.userId || !isSessionValid(session)) {
            localStorage.removeItem(AUTH_KEY);
            throw { status: 401 };
        }

        const db = getDb();
        const user = db.users.find(u => u.id === session.userId);
        if (!user) throw { status: 401 };

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            is2FAEnabled: !!user.twoFactorSecret
        };
    },

    login: async (email, password) => {
        // Check if login is locked due to too many attempts
        const lockStatus = isLoginLocked(email);
        if (lockStatus.locked) {
            throw new Error(`Zu viele Fehlversuche. Bitte warten Sie ${lockStatus.remainingTime} Minuten.`);
        }

        const db = getDb();
        const user = db.users.find(u => u.email === email);

        if (!user) {
            recordFailedLogin(email);
            throw new Error('Invalid credentials');
        }

        // Hash password if it's still plaintext (migration)
        if (!user.password.match(/^\$2[aby]\$/)) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const userIdx = db.users.findIndex(u => u.email === email);
            db.users[userIdx].password = hashedPassword;
            saveDb(db);
            user.password = hashedPassword;
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            recordFailedLogin(email);
            throw new Error('Invalid credentials');
        }

        // Clear failed login attempts on successful password verification
        clearLoginAttempts(email);

        // Check if 2FA is enabled
        if (user.twoFactorSecret) {
            return { require2FA: true, userId: user.id };
        }

        // Create session with expiration
        const session = createSession(user.id);
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return { success: true, user };
    },

    verify2FA: async (userId, token) => {
        const db = getDb();
        const user = db.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        // Real TOTP verification
        if (!user.twoFactorSecret) {
            throw new Error('2FA not enabled for this user');
        }

        const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });

        if (!isValid) {
            throw new Error('Invalid OTP');
        }

        // Create session with expiration
        const session = createSession(user.id);
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return { success: true, user };
    },

    setup2FA: async () => {
        const session = JSON.parse(localStorage.getItem(AUTH_KEY));
        if (!session || !isSessionValid(session)) {
            throw new Error('Not logged in');
        }

        // Generate real TOTP secret
        const secret = authenticator.generateSecret();
        const db = getDb();
        const user = db.users.find(u => u.id === session.userId);

        if (!user) throw new Error('User not found');

        // Use otplib's generateURI function for keyuri
        const { generateURI } = await import('otplib');
        const otpauth = generateURI({
            label: user.email,
            issuer: 'Bielenet CRM',
            secret: secret
        });
        const qr = await QRCode.toDataURL(otpauth);

        return { secret, qr };
    },

    confirm2FA: async (secret, token) => {
        const session = JSON.parse(localStorage.getItem(AUTH_KEY));
        if (!session || !isSessionValid(session)) {
            throw new Error('Not logged in');
        }

        // Verify the token with the secret
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            throw new Error('Invalid OTP. Please try again.');
        }

        const db = getDb();
        const userIdx = db.users.findIndex(u => u.id === session.userId);
        if (userIdx === -1) throw new Error('User not found');

        // Save the secret to enable 2FA
        db.users[userIdx].twoFactorSecret = secret;
        saveDb(db);
        return true;
    },

    logout: (redirectUrl) => {
        localStorage.removeItem(AUTH_KEY);
        // Trigger logout in other tabs
        localStorage.setItem('logout_event', Date.now().toString());
        if (redirectUrl) window.location.href = redirectUrl;
        else window.location.reload();
    },

    redirectToLogin: () => {
        window.location.href = '/login';
    }
};

// --- HELPER FUNCTIONS ---
const calculateCancellationDeadline = (contract) => {
    if (!contract.end_date) return null;

    const endDate = new Date(contract.end_date);
    const cancellationMonths = contract.cancellation_period_months || 3;
    const noticeDays = contract.notice_period_days || 30;

    // Subtract cancellation period months
    endDate.setMonth(endDate.getMonth() - cancellationMonths);
    // Subtract notice period days
    endDate.setDate(endDate.getDate() - noticeDays);

    return endDate.toISOString();
};

const calculateVvlPriority = (cancellationDeadline) => {
    if (!cancellationDeadline) return 'FUTURE';

    const now = new Date();
    const deadline = new Date(cancellationDeadline);
    const daysUntil = Math.floor((Number(deadline) - Number(now)) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'EXPIRED';
    if (daysUntil < 7) return 'CRITICAL';
    if (daysUntil < 30) return 'URGENT';
    if (daysUntil < 90) return 'PLAN';
    return 'FUTURE';
};

// --- ENTITIES MODULE ---
const createEntityHandler = (collection) => ({
    list: async (options = {}) => {
        const items = getDb()[collection] || [];
        if (!options.search) return items;

        const term = options.search.toLowerCase();
        return items.filter(item => {
            // Generic search across common fields
            return (
                (item.first_name && item.first_name.toLowerCase().includes(term)) ||
                (item.last_name && item.last_name.toLowerCase().includes(term)) ||
                (item.company_name && item.company_name.toLowerCase().includes(term)) ||
                (item.email && item.email.toLowerCase().includes(term)) ||
                (item.contract_number && item.contract_number.toLowerCase().includes(term)) ||
                (item.tariff_name && item.tariff_name.toLowerCase().includes(term)) ||
                (item.phone && item.phone.includes(term))
            );
        });
    },
    get: async (id) => getDb()[collection]?.find(i => i.id === id),
    create: async (data) => {
        const db = getDb();
        if (!db[collection]) db[collection] = [];
        const newItem = { id: crypto.randomUUID(), ...data, created_at: new Date().toISOString() };
        db[collection].push(newItem);
        saveDb(db);
        return newItem;
    },
    update: async (id, data) => {
        const db = getDb();
        const idx = db[collection]?.findIndex(i => i.id === id);
        if (idx === -1) throw new Error('Not found');

        db[collection][idx] = { ...db[collection][idx], ...data };
        saveDb(db);
        return db[collection][idx];
    },
    delete: async (id) => {
        const db = getDb();
        db[collection] = db[collection].filter(i => i.id !== id);
        saveDb(db);
    }
});

const ensureCoreCollections = (db) => {
    let changed = false;

    // Branches
    if (!db.branches || db.branches.length === 0) {
        console.log('[bielenet-sdk] Seeding branches...');
        db.branches = [
            { id: 'b1', name: 'Zentrale Bielefeld', created_at: new Date().toISOString() },
            { id: 'b2', name: 'Filiale Detmold', created_at: new Date().toISOString() }
        ];
        changed = true;
    }

    // Providers
    if (!db.providers || db.providers.length === 0) {
        console.log('[bielenet-sdk] Seeding providers...');
        db.providers = [
            {
                id: 'p1',
                name: 'Telekom Deutschland',
                logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Deutsche_Telekom_logo.svg/320px-Deutsche_Telekom_logo.svg.png',
                categories: ['mobilfunk', 'glasfaser', 'dsl', 'tv', 'business'],
                primary_category: 'mobilfunk',
                contact_person: 'Geschäftskundenbetreuung',
                phone: '+49 800 330 1000',
                email: 'geschaeftskunden@telekom.de',
                website: 'https://www.telekom.de',
                is_active: true,
                ai_enriched: false,
                ai_enrichment_date: null,
                ai_enrichment_source: null,
                notes: 'Hauptpartner für Mobilfunk und Glasfaser. Sehr gute Geschäftskundenkonditionen.',
                commission_rate: 5.5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'p2',
                name: 'Vodafone',
                logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/240px-Vodafone_icon.svg.png',
                categories: ['mobilfunk', 'kabel', 'glasfaser', 'tv', 'business'],
                primary_category: 'kabel',
                contact_person: 'Partner Sales Team',
                phone: '+49 800 172 1212',
                email: 'partner@vodafone.de',
                website: 'https://www.vodafone.de',
                is_active: true,
                ai_enriched: false,
                ai_enrichment_date: null,
                ai_enrichment_source: null,
                notes: 'Starker Kabel-Internet Partner. Gute TV-Pakete.',
                commission_rate: 6.0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'p3',
                name: 'o2 (Telefónica)',
                logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/O2_logo.svg/240px-O2_logo.svg.png',
                categories: ['mobilfunk', 'dsl'],
                primary_category: 'mobilfunk',
                contact_person: 'Partnervertrieb',
                phone: '+49 89 2442 0',
                email: 'partner@o2online.de',
                website: 'https://www.o2online.de',
                is_active: true,
                ai_enriched: false,
                ai_enrichment_date: null,
                ai_enrichment_source: null,
                notes: 'Preisgünstige Mobilfunktarife. Gut für Einsteiger.',
                commission_rate: 4.5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'p4',
                name: '1&1',
                logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/1%261_logo.svg/240px-1%261_logo.svg.png',
                categories: ['dsl', 'glasfaser', 'mobilfunk'],
                primary_category: 'dsl',
                contact_person: 'Vertriebspartner Service',
                phone: '+49 721 960 0',
                email: 'partner@1und1.de',
                website: 'https://www.1und1.de',
                is_active: true,
                ai_enriched: false,
                ai_enrichment_date: null,
                ai_enrichment_source: null,
                notes: 'DSL und Glasfaser Spezialist. Gute Bundle-Angebote.',
                commission_rate: 5.0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'p5',
                name: 'Unitymedia (Vodafone)',
                logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/240px-Vodafone_icon.svg.png',
                categories: ['kabel', 'tv'],
                primary_category: 'kabel',
                contact_person: 'Kabel Service',
                phone: '+49 221 466 191 00',
                email: 'info@unitymedia.de',
                website: 'https://www.unitymedia.de',
                is_active: false,
                ai_enriched: false,
                ai_enrichment_date: null,
                ai_enrichment_source: null,
                notes: 'INAKTIV: Wurde in Vodafone integriert. Nur für Bestandskunden.',
                commission_rate: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'p6',
                name: 'Starlink',
                logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Starlink_Logo.svg/320px-Starlink_Logo.svg.png',
                categories: ['sonstiges'],
                primary_category: 'sonstiges',
                contact_person: 'Support Team',
                phone: null,
                email: 'support@starlink.com',
                website: 'https://www.starlink.com',
                is_active: true,
                ai_enriched: true,
                ai_enrichment_date: new Date().toISOString(),
                ai_enrichment_source: 'GPT-4',
                notes: 'Satelliten-Internet für ländliche Gebiete. Keine Telefonnummer verfügbar.',
                commission_rate: 3.0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        changed = true;
    }

    // Hardware
    if (!db.hardware || db.hardware.length === 0) {
        console.log('[bielenet-sdk] Seeding hardware...');
        db.hardware = [
            { id: 'hw1', name: 'Fritz!Box 7590 AX', category: 'Router', stock: 12, price: 149.00, created_at: new Date().toISOString() },
            { id: 'hw2', name: 'iPhone 15 Pro', category: 'Smartphone', stock: 5, price: 999.00, created_at: new Date().toISOString() },
            { id: 'hw3', name: 'SIM-Karte Nano', category: 'SIM', stock: 500, price: 0.00, created_at: new Date().toISOString() },
            { id: 'hw4', name: 'Samsung Galaxy S24 Ultra', category: 'Smartphone', stock: 2, price: 1199.00, created_at: new Date().toISOString() },
            { id: 'hw5', name: 'Google Pixel 8 Pro', category: 'Smartphone', stock: 8, price: 899.00, created_at: new Date().toISOString() },
            { id: 'hw6', name: 'FRITZ!Repeater 3000', category: 'Router', stock: 15, price: 89.00, created_at: new Date().toISOString() },
        ];
        changed = true;
    }

    return changed;
};

const seed = () => {
    const db = getDb();
    let madeChanges = false;

    // Always ensure core collections are present, even in partially seeded DBs
    madeChanges = ensureCoreCollections(db) || madeChanges;

    // 3. Seed Customers only if really empty (to avoid overwriting user data)
    if (!db.customers || db.customers.length === 0) {




        // Customers with complete schema
        db.customers = [
            {
                id: 'c1',
                customer_type: 'privat',
                status: 'complete',
                // Personal Info (Privat)
                first_name: 'Max',
                last_name: 'Mustermann',
                birth_date: '1985-03-15',
                // Contact
                phone: '0521 12345678',
                email: 'max.mustermann@example.com',
                whatsapp_enabled: true,
                // Address
                street: 'Detmolder Straße',
                house_number: '12',
                postal_code: '33602',
                city: 'Bielefeld',
                address: 'Detmolder Straße 12',
                address_normalized: 'detmolder straße 12, 33602 bielefeld',
                // Branch
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Documents
                identity_documents: JSON.stringify([
                    { type: 'Personalausweis', url: '/mock/id-doc-1.pdf', uploaded_at: new Date().toISOString() }
                ]),
                dsgvo_document_url: '/mock/dsgvo-max-mustermann.pdf',
                // Notes
                notes: 'Stammkunde seit 2020. Bevorzugt Kontakt via WhatsApp.',
                created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'c2',
                customer_type: 'privat',
                status: 'complete',
                // Personal Info (Privat)
                first_name: 'Anna',
                last_name: 'Mustermann',
                birth_date: '1987-07-22',
                // Contact
                phone: '0521 87654321',
                email: 'anna.mustermann@example.com',
                whatsapp_enabled: true,
                // Address (same household as Max)
                street: 'Detmolder Straße',
                house_number: '12',
                postal_code: '33602',
                city: 'Bielefeld',
                address: 'Detmolder Straße 12',
                address_normalized: 'detmolder straße 12, 33602 bielefeld',
                // Branch
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Documents
                identity_documents: JSON.stringify([
                    { type: 'Personalausweis', url: '/mock/id-doc-2.pdf', uploaded_at: new Date().toISOString() }
                ]),
                dsgvo_document_url: '/mock/dsgvo-anna-mustermann.pdf',
                // Notes
                notes: 'Haushalt mit Max Mustermann. Interesse an Glasfaser.',
                created_at: new Date(Date.now() - 86400000 * 300).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'c3',
                customer_type: 'geschäftlich',
                status: 'complete',
                // Business Info
                company_name: 'TechStart GmbH',
                contact_person: 'Dr. Thomas Schmidt',
                // Contact
                phone: '05231 987654',
                email: 'info@techstart-gmbh.de',
                whatsapp_enabled: false,
                // Address
                street: 'Industriestraße',
                house_number: '45',
                postal_code: '32756',
                city: 'Detmold',
                address: 'Industriestraße 45',
                address_normalized: 'industriestraße 45, 32756 detmold',
                // Branch
                branch_id: 'b2',
                branch_name: 'Filiale Detmold',
                // Documents
                identity_documents: JSON.stringify([
                    { type: 'Handelsregisterauszug', url: '/mock/hr-techstart.pdf', uploaded_at: new Date().toISOString() },
                    { type: 'Gewerbeanmeldung', url: '/mock/gewerbe-techstart.pdf', uploaded_at: new Date().toISOString() }
                ]),
                dsgvo_document_url: '/mock/dsgvo-techstart-gmbh.pdf',
                // Notes
                notes: 'Großkunde mit 15 Mobilfunkverträgen. Jährliche Vertragsüberprüfung im Q1.',
                created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'c4',
                customer_type: 'privat',
                status: 'draft',
                // Personal Info (Privat)
                first_name: 'Julia',
                last_name: 'Weber',
                birth_date: '1992-11-08',
                // Contact
                phone: '0176 55443322',
                email: 'julia.weber@gmail.com',
                whatsapp_enabled: true,
                // Address
                street: 'Hauptstraße',
                house_number: '78',
                postal_code: '33602',
                city: 'Bielefeld',
                address: 'Hauptstraße 78',
                address_normalized: 'hauptstraße 78, 33602 bielefeld',
                // Branch
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Documents (incomplete - draft status)
                identity_documents: JSON.stringify([]),
                dsgvo_document_url: null,
                // Notes
                notes: 'Beratungstermin vereinbart für nächste Woche. DSGVO-Dokumente noch ausstehend.',
                created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                updated_at: new Date().toISOString()
            }
        ];


        // Contracts with comprehensive schema
        const now = Date.now();
        const dayMs = 86400000;

        db.contracts = [
            // 1. Mobilfunk - Hauptkarte (URGENT - 25 days)
            {
                id: 'con1',
                customer_id: 'c1',
                customer_name: 'Max Mustermann',
                provider_id: 'p1',
                provider_name: 'Telekom',
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Category & Type
                category: 'mobilfunk',
                contract_type: 'Mobilfunk Postpaid',
                tariff_name: 'MagentaMobil M',
                tariff_details: '20 GB Highspeed-Datenvolumen, Allnet Flat, EU-Roaming inklusive',
                contract_number: 'TK-2024-001234',
                // Mobilfunk-specific
                mobilfunk_type: 'Hauptkarte',
                data_volume_gb: 20,
                has_allnet_flat: true,
                has_sms_flat: true,
                has_roaming: true,
                phone_number: '+49 176 12345678',
                // Duration & Deadlines
                start_date: new Date(now - dayMs * 540).toISOString(), // 18 months ago
                end_date: new Date(now + dayMs * 180).toISOString(), // 6 months from now
                contract_duration_months: 24,
                cancellation_period_months: 3,
                notice_period_days: 30,
                auto_renew: true,
                // Financial
                monthly_fee: 39.95,
                setup_fee: 0,
                commission: 45.00,
                commission_date: new Date(now - dayMs * 510).toISOString(),
                commission_status: 'paid',
                // VVL Status
                vvl_status: 'in_bearbeitung',
                vvl_started_at: new Date(now - dayMs * 10).toISOString(),
                vvl_notes: 'Kunde kontaktiert. Wartet auf Angebot für MagentaMobil L.',
                // Status
                status: 'aktiv',
                // Metadata
                notes: 'Stammkunde, sehr zufrieden mit Service',
                created_at: new Date(now - dayMs * 540).toISOString(),
                updated_at: new Date(now - dayMs * 10).toISOString()
            },

            // 2. Mobilfunk - Partnerkarte
            {
                id: 'con2',
                customer_id: 'c2',
                customer_name: 'Anna Mustermann',
                provider_id: 'p2',
                provider_name: 'Vodafone',
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Category & Type
                category: 'mobilfunk',
                contract_type: 'Mobilfunk Partnerkarte',
                tariff_name: 'Red+ Partner',
                tariff_details: '10 GB geteilt mit Hauptvertrag, Allnet Flat',
                contract_number: 'VF-2024-556677',
                // Mobilfunk-specific
                mobilfunk_type: 'Partnerkarte',
                data_volume_gb: 10,
                has_allnet_flat: true,
                has_sms_flat: true,
                has_roaming: true,
                phone_number: '+49 176 87654321',
                // Duration & Deadlines
                start_date: new Date(now - dayMs * 365).toISOString(),
                end_date: new Date(now + dayMs * 365).toISOString(),
                contract_duration_months: 24,
                cancellation_period_months: 3,
                notice_period_days: 30,
                auto_renew: true,
                // Financial
                monthly_fee: 19.99,
                setup_fee: 0,
                commission: 25.00,
                commission_date: new Date(now - dayMs * 335).toISOString(),
                commission_status: 'paid',
                // VVL Status
                vvl_status: 'nicht_relevant',
                vvl_notes: 'Automatische Verlängerung gewünscht',
                // Status
                status: 'aktiv',
                // Metadata
                notes: 'Partnerkarte zu Hauptvertrag von Max Mustermann',
                created_at: new Date(now - dayMs * 365).toISOString(),
                updated_at: new Date(now - dayMs * 30).toISOString()
            },

            // 3. Festnetz/Internet - Glasfaser (CRITICAL - 5 days)
            {
                id: 'con3',
                customer_id: 'c2',
                customer_name: 'Anna Mustermann',
                provider_id: 'p2',
                provider_name: 'Vodafone',
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Category & Type
                category: 'festnetz_internet',
                contract_type: 'Glasfaser Internet & Telefon',
                tariff_name: 'Red Internet & Phone 1000 Cable',
                tariff_details: '1000 Mbit/s Download, 50 Mbit/s Upload, Telefon-Flat',
                contract_number: 'VF-2023-998877',
                // Festnetz-specific
                connection_type: 'Glasfaser',
                speed_download_mbit: 1000,
                speed_upload_mbit: 50,
                router_included: true,
                router_model: 'FritzBox 5590 Fiber',
                tv_option: false,
                landline_number: '+49 521 12345678',
                // Duration & Deadlines
                start_date: new Date(now - dayMs * 700).toISOString(),
                end_date: new Date(now + dayMs * 25).toISOString(), // 25 days from now
                contract_duration_months: 24,
                cancellation_period_months: 3,
                notice_period_days: 30,
                auto_renew: false,
                // Financial
                monthly_fee: 49.99,
                setup_fee: 69.99,
                commission: 85.00,
                commission_date: new Date(now - dayMs * 670).toISOString(),
                commission_status: 'paid',
                // VVL Status
                vvl_status: 'kunde_kontaktiert',
                vvl_started_at: new Date(now - dayMs * 15).toISOString(),
                vvl_notes: 'Kunde interessiert an Upgrade auf 2000 Mbit/s. Angebot wird erstellt.',
                last_vvl_date: new Date(now - dayMs * 2).toISOString(),
                // Status
                status: 'aktiv',
                // Documents
                contract_documents: JSON.stringify([
                    { type: 'Vertrag', url: '/mock/contract-vf-998877.pdf', uploaded_at: new Date(now - dayMs * 700).toISOString(), name: 'Vodafone_Vertrag.pdf' }
                ]),
                // Metadata
                notes: 'WICHTIG: Deadline in 5 Tagen! Angebot muss schnell raus.',
                created_at: new Date(now - dayMs * 700).toISOString(),
                updated_at: new Date(now - dayMs * 2).toISOString()
            },

            // 4. Kombi - Mobilfunk + Internet (PLAN - 60 days)
            {
                id: 'con4',
                customer_id: 'c3',
                customer_name: 'TechStart GmbH',
                provider_id: 'p1',
                provider_name: 'Telekom',
                branch_id: 'b2',
                branch_name: 'Filiale Detmold',
                // Category & Type
                category: 'kombi',
                contract_type: 'Business Kombi-Paket',
                tariff_name: 'Business Complete L',
                tariff_details: '15 Mobilfunkverträge + 500 Mbit Business Internet',
                contract_number: 'TK-2024-BUS-556',
                // Mobilfunk-specific (for mobile part)
                mobilfunk_type: 'Hauptkarte',
                data_volume_gb: 50,
                has_allnet_flat: true,
                has_sms_flat: true,
                has_roaming: true,
                // Festnetz-specific (for internet part)
                connection_type: 'Glasfaser',
                speed_download_mbit: 500,
                speed_upload_mbit: 100,
                router_included: true,
                router_model: 'Telekom Speedport Pro Plus',
                tv_option: false,
                landline_number: '+49 5231 987654',
                // Duration & Deadlines
                start_date: new Date(now - dayMs * 270).toISOString(),
                end_date: new Date(now + dayMs * 450).toISOString(),
                contract_duration_months: 24,
                cancellation_period_months: 3,
                notice_period_days: 30,
                auto_renew: true,
                // Financial
                monthly_fee: 899.00,
                setup_fee: 0,
                commission: 450.00,
                commission_date: new Date(now - dayMs * 240).toISOString(),
                commission_status: 'paid',
                // VVL Status
                vvl_status: 'offen',
                vvl_notes: 'Großkunde - jährliche Überprüfung im Q1 geplant',
                // Status
                status: 'aktiv',
                // Metadata
                notes: 'Wichtiger Geschäftskunde mit 15 Mobilfunkverträgen',
                created_at: new Date(now - dayMs * 270).toISOString(),
                updated_at: new Date(now - dayMs * 60).toISOString()
            },

            // 5. TV
            {
                id: 'con5',
                customer_id: 'c1',
                customer_name: 'Max Mustermann',
                provider_id: 'p2',
                provider_name: 'Vodafone',
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Category & Type
                category: 'tv',
                contract_type: 'TV Streaming',
                tariff_name: 'GigaTV Cable',
                tariff_details: '100+ HD-Sender, Aufnahmefunktion, Netflix-Integration',
                contract_number: 'VF-2024-TV-445',
                // TV-specific (using festnetz fields)
                tv_option: true,
                connection_type: 'Kabel',
                // Duration & Deadlines
                start_date: new Date(now - dayMs * 200).toISOString(),
                end_date: new Date(now + dayMs * 530).toISOString(),
                contract_duration_months: 24,
                cancellation_period_months: 3,
                notice_period_days: 30,
                auto_renew: true,
                // Financial
                monthly_fee: 14.99,
                setup_fee: 0,
                commission: 30.00,
                commission_date: new Date(now - dayMs * 170).toISOString(),
                commission_status: 'paid',
                // VVL Status
                vvl_status: 'nicht_relevant',
                vvl_notes: 'Automatische Verlängerung, Kunde sehr zufrieden',
                // Status
                status: 'aktiv',
                // Metadata
                notes: 'Zusatzprodukt zu Internetvertrag',
                created_at: new Date(now - dayMs * 200).toISOString(),
                updated_at: new Date(now - dayMs * 100).toISOString()
            },

            // 6. Gekündigter/Ersetzter Vertrag
            {
                id: 'con6',
                customer_id: 'c1',
                customer_name: 'Max Mustermann',
                provider_id: 'p3',
                provider_name: 'o2',
                branch_id: 'b1',
                branch_name: 'Zentrale Bielefeld',
                // Category & Type
                category: 'mobilfunk',
                contract_type: 'Mobilfunk Postpaid',
                tariff_name: 'o2 Free M',
                tariff_details: '10 GB, Allnet Flat',
                contract_number: 'O2-2022-334455',
                // Mobilfunk-specific
                mobilfunk_type: 'Hauptkarte',
                data_volume_gb: 10,
                has_allnet_flat: true,
                has_sms_flat: true,
                has_roaming: false,
                phone_number: '+49 176 99887766',
                // Duration & Deadlines
                start_date: new Date(now - dayMs * 900).toISOString(),
                end_date: new Date(now - dayMs * 180).toISOString(),
                contract_duration_months: 24,
                cancellation_period_months: 3,
                notice_period_days: 30,
                auto_renew: false,
                // Financial
                monthly_fee: 29.99,
                setup_fee: 0,
                commission: 35.00,
                commission_date: new Date(now - dayMs * 870).toISOString(),
                commission_status: 'paid',
                // VVL Status
                vvl_status: 'verlängert',
                vvl_notes: 'Kunde gewechselt zu Telekom für besseres Angebot',
                // Status & Replacement
                status: 'ersetzt',
                cancellation_date: new Date(now - dayMs * 210).toISOString(),
                cancellation_reason: 'Anbieterwechsel zu Telekom',
                replaced_by_contract_id: 'con1',
                // Metadata
                notes: 'Alter Vertrag, ersetzt durch Telekom MagentaMobil M',
                created_at: new Date(now - dayMs * 900).toISOString(),
                updated_at: new Date(now - dayMs * 180).toISOString()
            }
        ];


        // Update con1 to reference the replaced contract
        db.contracts[0].replaces_contract_id = 'con6';

        // Recalculate deadlines and priorities for all contracts
        db.contracts = db.contracts.map(contract => {
            const cancellationDeadline = calculateCancellationDeadline(contract);
            const vvlPriority = calculateVvlPriority(cancellationDeadline);
            return {
                ...contract,
                cancellation_deadline: cancellationDeadline,
                vvl_priority: vvlPriority
            };
        });

        // 5. Customer History (Timeline)
        db.customerHistory = [
            {
                id: 'h1',
                customer_id: 'c1',
                type: 'sales',
                title: 'Erstberatung Mobilfunk',
                notes: 'Kunde hat Interesse an MagentaMobil M. Fokus auf EU-Roaming.',
                channel: 'store',
                status: 'done',
                occurred_at: new Date(now - dayMs * 540).toISOString(),
                priority: 'medium',
                is_system_event: false
            },
            {
                id: 'h2',
                customer_id: 'c1',
                type: 'system',
                title: 'Vertrag erstellt: MagentaMobil M',
                notes: 'ID: con1',
                channel: 'other',
                status: 'done',
                occurred_at: new Date(now - dayMs * 540).toISOString(),
                priority: 'low',
                is_system_event: true
            },
            {
                id: 'h3',
                customer_id: 'c2',
                type: 'service',
                title: 'Adressänderung durchgeführt',
                notes: 'Zusammenzug mit Max Mustermann.',
                channel: 'phone',
                status: 'done',
                occurred_at: new Date(now - dayMs * 300).toISOString(),
                priority: 'low',
                is_system_event: false
            }
        ];

        // 6. VVL Records (History)
        db.vvlRecords = [
            {
                id: 'vvl1',
                contract_id: 'con6',
                customer_id: 'c1',
                type: 'anbieterwechsel',
                result: 'verlängert', // conceptually replaced/renewed
                old_provider_id: 'p3',
                new_provider_id: 'p1',
                old_monthly_fee: 29.99,
                new_monthly_fee: 39.95,
                old_tariff_name: 'o2 Free M',
                new_tariff_name: 'MagentaMobil M',
                valid_from: new Date(now - dayMs * 540).toISOString(),
                occurred_at: new Date(now - dayMs * 540).toISOString()
            }
        ];

        // 7. System Activities (Audit Log)
        db.activities = [
            {
                id: 'act1',
                type: 'customer_created',
                customer_id: 'c1',
                user_name: 'Can Arslan',
                short_text: 'Kunde Max Mustermann angelegt',
                timestamp: new Date(now - dayMs * 540).toISOString()
            },
            {
                id: 'act2',
                type: 'contract_created',
                customer_id: 'c1',
                contract_id: 'con1',
                user_name: 'Can Arslan',
                short_text: 'Vertrag MagentaMobil M für Max Mustermann erstellt',
                timestamp: new Date(now - dayMs * 540).toISOString()
            }
        ];

        saveDb(db);
        console.log('✅ Database seeded with complete CRM core data');

        // Tasks/Followups
        db.followups = [
            {
                id: 'f1',
                customer_id: 'c1',
                customer_name: 'Max Mustermann',
                type: 'call',
                status: 'open',
                due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
                note: 'VVL-Beratung für MagentaMobil Vertrag',
                created_at: new Date(Date.now() - 86400000 * 10).toISOString()
            },
            {
                id: 'f2',
                customer_id: 'c4',
                customer_name: 'Julia Weber',
                type: 'meeting',
                status: 'open',
                due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
                note: 'DSGVO-Dokumente abholen und Vertrag finalisieren',
                created_at: new Date(Date.now() - 86400000 * 1).toISOString()
            }
        ];

        saveDb(db);
        console.log('✅ Database seeded with sample data');
    }

    if (madeChanges) {
        saveDb(db);
        console.log('✅ Database updated with missing initial data');
    }

    // Stamp DB version for simple migrations
    const currentVersion = localStorage.getItem(DB_VERSION_KEY);
    if (currentVersion !== DB_VERSION) {
        localStorage.setItem(DB_VERSION_KEY, DB_VERSION);
    }
};


seed();

// Specialized Contract Handler with auto-calculation
const createContractHandler = () => ({
    list: async (sort) => {
        const contracts = getDb().contracts || [];
        if (sort === '-created_date') {
            return contracts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return contracts;
    },
    get: async (id) => getDb().contracts?.find(i => i.id === id),
    create: async (data) => {
        const db = getDb();
        if (!db.contracts) db.contracts = [];

        // Auto-calculate deadline and priority
        const cancellationDeadline = calculateCancellationDeadline(data);
        const vvlPriority = calculateVvlPriority(cancellationDeadline);

        const newContract = {
            id: crypto.randomUUID(),
            ...data,
            cancellation_deadline: cancellationDeadline,
            vvl_priority: vvlPriority,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.contracts.push(newContract);
        saveDb(db);
        return newContract;
    },
    update: async (id, data) => {
        const db = getDb();
        const idx = db.contracts?.findIndex(i => i.id === id);
        if (idx === -1) throw new Error('Not found');

        const updatedData = { ...db.contracts[idx], ...data, updated_at: new Date().toISOString() };

        // Recalculate deadline and priority if relevant fields changed
        if (data.end_date || data.cancellation_period_months || data.notice_period_days) {
            updatedData.cancellation_deadline = calculateCancellationDeadline(updatedData);
            updatedData.vvl_priority = calculateVvlPriority(updatedData.cancellation_deadline);
        }

        db.contracts[idx] = updatedData;
        saveDb(db);
        return db.contracts[idx];
    },
    delete: async (id) => {
        const db = getDb();
        db.contracts = db.contracts.filter(i => i.id !== id);
        saveDb(db);
    }
});

export const bielenet = {
    auth,
    entities: {
        Customer: createEntityHandler('customers'),
        Contract: createContractHandler(),
        VvlRecord: createEntityHandler('vvlRecords'),
        User: createEntityHandler('users'),
        Branch: createEntityHandler('branches'),
        Provider: createEntityHandler('providers'),
        Task: createEntityHandler('tasks'),
        Reminder: createEntityHandler('reminders'),
        Followup: createEntityHandler('followups'),
        Activity: createEntityHandler('activities'),
        CustomerHistory: createEntityHandler('customerHistory'),
        Hardware: createEntityHandler('hardware'),
    },
    analytics: { track: () => { } },
    integrations: {
        Core: {
            UploadFile: async ({ file }) => {
                console.log('Mock uploading', file.name);
                return { file_url: URL.createObjectURL(file) };
            }
        }
    }
};

export const createClient = () => bielenet;
