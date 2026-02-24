/**
 * Security Utilities
 * Provides security-related helper functions for authentication and data protection
 */

import CryptoJS from 'crypto-js';

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
    return {
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        csrfToken: generateCSRFToken()
    };
};

/**
 * Validates if a session is still active
 * @param {object} session - Session object
 * @returns {boolean} - True if session is still valid
 */
export const isSessionValid = (session) => {
    if (!session || !session.expiresAt) return false;
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
