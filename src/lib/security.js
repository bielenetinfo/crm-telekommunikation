/**
 * Security Utilities
 * Provides security-related helper functions for authentication and data protection
 */

import CryptoJS from 'crypto-js';

const HMAC_SECRET = 'BIELENET_SESSION_HMAC_2026';
const AUDIT_LOG_KEY = 'bielenet_audit_log';

export const ROLES = Object.freeze({
    ADMIN: 'admin',
    MANAGER: 'manager',
    AGENT: 'agent',
    VIEWER: 'viewer'
});

export const PERMISSIONS = Object.freeze({
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_CUSTOMERS: 'view_customers',
    VIEW_CONTRACTS: 'view_contracts',
    VIEW_VVL: 'view_vvl',
    VIEW_TASKS: 'view_tasks',
    VIEW_CALENDAR: 'view_calendar',
    VIEW_REMINDERS: 'view_reminders',
    MANAGE_PROVIDERS: 'manage_providers',
    MANAGE_HARDWARE: 'manage_hardware',
    MANAGE_BRANCHES: 'manage_branches',
    MANAGE_USERS: 'manage_users',
    ACCESS_BACKUP: 'access_backup',
    MANAGE_SETTINGS: 'manage_settings',
    DELETE_RECORDS: 'delete_records',
    EXPORT_DATA: 'export_data',
    MANAGE_USER_ROLES: 'manage_user_roles',
    UPDATE_CONTRACT_STATUS: 'update_contract_status'
});

const ROUTE_PERMISSION_MAP = Object.freeze({
    '/': PERMISSIONS.VIEW_DASHBOARD,
    '/customers': PERMISSIONS.VIEW_CUSTOMERS,
    '/contracts': PERMISSIONS.VIEW_CONTRACTS,
    '/vvl': PERMISSIONS.VIEW_VVL,
    '/tasks': PERMISSIONS.VIEW_TASKS,
    '/calendar': PERMISSIONS.VIEW_CALENDAR,
    '/reminders': PERMISSIONS.VIEW_REMINDERS,
    '/providers': PERMISSIONS.MANAGE_PROVIDERS,
    '/hardware': PERMISSIONS.MANAGE_HARDWARE,
    '/branches': PERMISSIONS.MANAGE_BRANCHES,
    '/users': PERMISSIONS.MANAGE_USERS,
    '/backup': PERMISSIONS.ACCESS_BACKUP,
    '/settings': PERMISSIONS.MANAGE_SETTINGS
});

export const ACTION_PERMISSIONS = Object.freeze({
    delete: PERMISSIONS.DELETE_RECORDS,
    export: PERMISSIONS.EXPORT_DATA,
    userManagement: PERMISSIONS.MANAGE_USERS,
    roleChange: PERMISSIONS.MANAGE_USER_ROLES,
    contractStatusChange: PERMISSIONS.UPDATE_CONTRACT_STATUS
});

const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CUSTOMERS,
        PERMISSIONS.VIEW_CONTRACTS,
        PERMISSIONS.VIEW_VVL,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_CALENDAR,
        PERMISSIONS.VIEW_REMINDERS,
        PERMISSIONS.MANAGE_PROVIDERS,
        PERMISSIONS.MANAGE_HARDWARE,
        PERMISSIONS.MANAGE_BRANCHES,
        PERMISSIONS.ACCESS_BACKUP,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.DELETE_RECORDS,
        PERMISSIONS.EXPORT_DATA,
        PERMISSIONS.UPDATE_CONTRACT_STATUS
    ],
    [ROLES.AGENT]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CUSTOMERS,
        PERMISSIONS.VIEW_CONTRACTS,
        PERMISSIONS.VIEW_VVL,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_CALENDAR,
        PERMISSIONS.VIEW_REMINDERS,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.UPDATE_CONTRACT_STATUS
    ],
    [ROLES.VIEWER]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CUSTOMERS,
        PERMISSIONS.VIEW_CONTRACTS,
        PERMISSIONS.VIEW_CALENDAR,
        PERMISSIONS.VIEW_REMINDERS,
        PERMISSIONS.MANAGE_SETTINGS
    ]
});

export const normalizeRole = (role) => {
    if (!role) return ROLES.VIEWER;
    if (role === 'user') return ROLES.AGENT;
    return ROLE_PERMISSIONS[role] ? role : ROLES.VIEWER;
};

export const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[normalizeRole(role)] || [];
};

export const hasPermission = (userOrRole, permission) => {
    if (!permission) return true;
    const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
    return getRolePermissions(role).includes(permission);
};

export const canAccessAction = (userOrRole, actionOrPermission) => {
    if (!actionOrPermission) return true;
    const permission = ACTION_PERMISSIONS[actionOrPermission] || actionOrPermission;
    return hasPermission(userOrRole, permission);
};

export const getRoutePermission = (pathname = '/') => {
    const matchedPath = Object.keys(ROUTE_PERMISSION_MAP)
        .filter(route => pathname === route || (route !== '/' && pathname.startsWith(route)))
        .sort((a, b) => b.length - a.length)[0];
    return matchedPath ? ROUTE_PERMISSION_MAP[matchedPath] : PERMISSIONS.VIEW_DASHBOARD;
};

export const canAccessRoute = (userOrRole, pathname = '/') => {
    return hasPermission(userOrRole, getRoutePermission(pathname));
};

export const filterNavigationItems = (items = [], userOrRole) => {
    return items.filter((item) => canAccessRoute(userOrRole, item.path));
};

export const assertPermission = (userOrRole, actionOrPermission, message = 'Nicht autorisiert') => {
    if (!canAccessAction(userOrRole, actionOrPermission)) {
        const error = new Error(message);
        error.status = 403;
        throw error;
    }
};

export const appendAuditLog = (event) => {
    try {
        const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
        logs.push({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...event
        });
        localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
};

export const getAuditLogs = () => {
    try {
        return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
    } catch {
        return [];
    }
};

export const signSession = (sessionObj) => {
    try {
        const data = JSON.stringify(sessionObj);
        return CryptoJS.HmacSHA256(data, HMAC_SECRET).toString();
    } catch (e) {
        console.warn('HMAC sign failed', e);
        return null;
    }
};

export const verifySessionSignature = (sessionObj, signature) => {
    if (!signature) return false;
    try {
        const expected = signSession(sessionObj);
        return signature === expected;
    } catch (e) {
        console.warn('HMAC verify failed', e);
        return false;
    }
};

// Session configuration
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const LOGIN_ATTEMPT_KEY = 'bielenet_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Generates a secure random token for CSRF protection
 * @returns {string} - Random token
 */
export const generateCSRFToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validates CSRF token
 * @param {string} token - Token to validate
 * @param {string} storedToken - Stored token to compare against
 * @returns {boolean} - True if tokens match
 */
export const validateCSRFToken = (token, storedToken) => {
    return token === storedToken;
};

/**
 * Creates a session object with expiration
 * @param {string} userId - User ID
 * @returns {object} - Session object with userId and expiration
 */
export const createSession = (userId) => {
    const session = {
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        csrfToken: generateCSRFToken()
    };
    session.signature = signSession(session);
    return session;
};

/**
 * Validates if a session is still active
 * @param {object} session - Session object
 * @returns {boolean} - True if session is still valid
 */
export const isSessionValid = (session) => {
    if (!session || !session.expiresAt) return false;
    if (!verifySessionSignature({ ...session, signature: undefined }, session.signature)) return false;
    return Date.now() < session.expiresAt;
};

/**
 * Encrypts data using AES encryption
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted data
 */
export const encryptData = (data, key) => {
    if (!data || typeof data !== 'string') return data;
    try {
        return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return data;
    }
};

/**
 * Decrypts AES encrypted data
 * @param {string} encryptedData - Encrypted data
 * @param {string} key - Decryption key
 * @returns {string} - Decrypted data
 */
export const decryptData = (encryptedData, key) => {
    if (!encryptedData || typeof encryptedData !== 'string') return encryptedData;

    // Check if data looks encrypted (starts with U2FsdGVk which is the base64 of "Salted__")
    if (!encryptedData.startsWith('U2FsdGVk')) {
        // Data is not encrypted, return as-is (for backward compatibility)
        return encryptedData;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedData;
    }
};

/**
 * Encrypts sensitive fields in an object
 * @param {object} obj - Object with fields to encrypt
 * @param {array} fields - Array of field names to encrypt
 * @param {string} key - Encryption key
 * @returns {object} - Object with encrypted fields
 */
export const encryptFields = (obj, fields, key) => {
    if (!obj || !fields || !key) return obj;

    const encrypted = { ...obj };
    fields.forEach(field => {
        if (encrypted[field]) {
            encrypted[field] = encryptData(String(encrypted[field]), key);
        }
    });

    return encrypted;
};

/**
 * Decrypts sensitive fields in an object
 * @param {object} obj - Object with encrypted fields
 * @param {array} fields - Array of field names to decrypt
 * @param {string} key - Decryption key
 * @returns {object} - Object with decrypted fields
 */
export const decryptFields = (obj, fields, key) => {
    if (!obj || !fields || !key) return obj;

    const decrypted = { ...obj };
    fields.forEach(field => {
        if (decrypted[field]) {
            decrypted[field] = decryptData(decrypted[field], key);
        }
    });

    return decrypted;
};

/**
 * Records a failed login attempt
 * @param {string} email - Email address of failed login
 */
export const recordFailedLogin = (email) => {
    try {
        const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPT_KEY) || '{}');

        if (!attempts[email]) {
            attempts[email] = {
                count: 0,
                lastAttempt: null,
                lockedUntil: null
            };
        }

        attempts[email].count += 1;
        attempts[email].lastAttempt = Date.now();

        // Lock account if too many attempts
        if (attempts[email].count >= MAX_LOGIN_ATTEMPTS) {
            attempts[email].lockedUntil = Date.now() + LOCKOUT_DURATION;
        }

        localStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify(attempts));
    } catch (error) {
        console.error('Error recording failed login:', error);
    }
};

/**
 * Clears login attempts for an email (after successful login)
 * @param {string} email - Email address
 */
export const clearLoginAttempts = (email) => {
    try {
        const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPT_KEY) || '{}');
        delete attempts[email];
        localStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify(attempts));
    } catch (error) {
        console.error('Error clearing login attempts:', error);
    }
};

/**
 * Checks if an email is currently locked out
 * @param {string} email - Email address to check
 * @returns {object} - { locked: boolean, remainingTime: number }
 */
export const isLoginLocked = (email) => {
    try {
        const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPT_KEY) || '{}');

        if (!attempts[email]) {
            return { locked: false, remainingTime: 0 };
        }

        const { lockedUntil } = attempts[email];

        if (!lockedUntil) {
            return { locked: false, remainingTime: 0 };
        }

        const now = Date.now();
        if (now < lockedUntil) {
            return {
                locked: true,
                remainingTime: Math.ceil((lockedUntil - now) / 1000 / 60) // minutes
            };
        }

        // Lockout expired, clear attempts
        clearLoginAttempts(email);
        return { locked: false, remainingTime: 0 };

    } catch (error) {
        console.error('Error checking login lock:', error);
        return { locked: false, remainingTime: 0 };
    }
};

/**
 * Generates encryption key from session (deterministic but session-specific)
 * This should be improved in production with a proper key management system
 * @param {string} userId - User ID
 * @returns {string} - Encryption key
 */
export const getEncryptionKey = (userId) => {
    // In production, this should be derived more securely
    // For now, we use a combination of userId and a secret
    const secret = 'BIELENET_CRM_2026_SECRET_KEY';
    return CryptoJS.SHA256(userId + secret).toString();
};
