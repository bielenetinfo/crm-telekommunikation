/**
 * Input Validation & Sanitization Utilities
 * Provides validation and sanitization functions for user inputs
 */

import DOMPurify from 'dompurify';
import { CONTRACT_STATUS, CUSTOMER_LIFECYCLE_PHASES } from '@/lib/statusEnums';

/**
 * Very simple password policy:
 * - min 8 chars
 * - at least 1 digit
 * - at least 1 special char
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 8) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) return false;
    return true;
};

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Sanitizes phone number (removes all non-digit characters except +)
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '';
    return phone.replace(/[^\d+\s()-]/g, '').trim();
};

export const normalizePhone = (phone) => {
    const sanitized = sanitizePhone(phone);
    if (!sanitized) return '';

    const compact = sanitized.replace(/[\s()-]/g, '');
    if (compact.startsWith('+')) return compact;
    if (compact.startsWith('00')) return `+${compact.slice(2)}`;
    if (compact.startsWith('0')) return `+49${compact.slice(1)}`;
    return `+49${compact}`;
};

export const normalizeName = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

export const normalizeCustomerContactData = (data = {}) => ({
    ...data,
    email: data.email ? data.email.trim().toLowerCase() : '',
    phone: normalizePhone(data.phone),
    first_name: data.first_name ? normalizeName(data.first_name) : '',
    last_name: data.last_name ? normalizeName(data.last_name) : '',
    company_name: data.company_name ? data.company_name.trim().replace(/\s+/g, ' ') : '',
    city: data.city ? normalizeName(data.city) : '',
    postal_code: data.postal_code ? data.postal_code.toString().trim() : ''
});

const isPresent = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return !Number.isNaN(value);
    return !!value?.toString().trim();
};

export const REQUIRED_CUSTOMER_FIELDS_BY_PHASE = {
    [CUSTOMER_LIFECYCLE_PHASES.LEAD]: [
        { key: 'first_name', label: 'Vorname' },
        { key: 'last_name', label: 'Nachname' },
        { key: 'phone', label: 'Telefonnummer' }
    ],
    [CUSTOMER_LIFECYCLE_PHASES.QUALIFIED]: [
        { key: 'first_name', label: 'Vorname' },
        { key: 'last_name', label: 'Nachname' },
        { key: 'phone', label: 'Telefonnummer' },
        { key: 'email', label: 'E-Mail' },
        { key: 'address', label: 'Adresse' },
        { key: 'postal_code', label: 'PLZ' },
        { key: 'city', label: 'Ort' }
    ],
    [CUSTOMER_LIFECYCLE_PHASES.OFFER]: [
        { key: 'first_name', label: 'Vorname' },
        { key: 'last_name', label: 'Nachname' },
        { key: 'phone', label: 'Telefonnummer' },
        { key: 'email', label: 'E-Mail' },
        { key: 'address', label: 'Adresse' },
        { key: 'postal_code', label: 'PLZ' },
        { key: 'city', label: 'Ort' },
        { key: 'branch_id', label: 'Filiale' }
    ],
    [CUSTOMER_LIFECYCLE_PHASES.ACTIVE]: [
        { key: 'first_name', label: 'Vorname' },
        { key: 'last_name', label: 'Nachname' },
        { key: 'phone', label: 'Telefonnummer' },
        { key: 'email', label: 'E-Mail' },
        { key: 'address', label: 'Adresse' },
        { key: 'postal_code', label: 'PLZ' },
        { key: 'city', label: 'Ort' },
        { key: 'branch_id', label: 'Filiale' },
        { key: 'dsgvo_document_url', label: 'DSGVO-Dokument' }
    ]
};

export const getCustomerLifecycleChecklist = (data = {}, phase = CUSTOMER_LIFECYCLE_PHASES.LEAD) => {
    const baseRequired = REQUIRED_CUSTOMER_FIELDS_BY_PHASE[phase] || REQUIRED_CUSTOMER_FIELDS_BY_PHASE[CUSTOMER_LIFECYCLE_PHASES.LEAD];
    const isBusinessCustomer = data.customer_type === 'geschäftlich';

    const required = isBusinessCustomer
        ? baseRequired
            .map((field) => (field.key === 'first_name' || field.key === 'last_name'
                ? { key: 'company_name', label: 'Firmenname' }
                : field))
            .filter((field, index, list) => list.findIndex((item) => item.key === field.key) === index)
        : baseRequired;

    return required.map((field) => ({
        ...field,
        complete: isPresent(data[field.key])
    }));
};

const ALLOWED_CONTRACT_TRANSITIONS = {
    [CONTRACT_STATUS.ACTIVE]: [CONTRACT_STATUS.CANCELLED, CONTRACT_STATUS.EXPIRED, CONTRACT_STATUS.RENEWED, CONTRACT_STATUS.REPLACED],
    [CONTRACT_STATUS.CANCELLED]: [CONTRACT_STATUS.RENEWED],
    [CONTRACT_STATUS.EXPIRED]: [CONTRACT_STATUS.RENEWED],
    [CONTRACT_STATUS.RENEWED]: [CONTRACT_STATUS.ACTIVE],
    [CONTRACT_STATUS.REPLACED]: []
};

export const getContractStatusTransitionIssues = (currentStatus, nextStatus, contractData = {}) => {
    if (!nextStatus || currentStatus === nextStatus) return [];

    const allowedTargets = ALLOWED_CONTRACT_TRANSITIONS[currentStatus] || [];
    const issues = [];

    if (!allowedTargets.includes(nextStatus)) {
        issues.push(`Statuswechsel von "${currentStatus}" nach "${nextStatus}" ist nicht erlaubt`);
    }

    if (nextStatus === CONTRACT_STATUS.ACTIVE) {
        if (!isPresent(contractData.dsgvo_document_url)) issues.push('DSGVO-Dokument fehlt');
        if (!isPresent(contractData.tariff_name)) issues.push('Produkt/Tarif fehlt');
        if (!isPresent(contractData.contract_duration_months)) issues.push('Laufzeit fehlt');
    }

    return issues;
};

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} input - String to escape
 * @returns {string} - HTML-escaped string
 */
export const escapeHtml = (input) => {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Validates string length
 * @param {string} input - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} - True if length is within range
 */
export const validateLength = (input, min, max) => {
    if (!input || typeof input !== 'string') return false;
    const length = input.trim().length;
    return length >= min && length <= max;
};

/**
 * Sanitizes string to only allow safe characters
 * @param {string} input - String to sanitize
 * @param {string} allowedChars - Additional allowed characters (default: alphanumeric + space + common punctuation)
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input, allowedChars = '') => {
    if (!input || typeof input !== 'string') return '';
    // Base pattern: alphanumeric, space, umlauts, common punctuation
    const basePattern = 'a-zA-Z0-9äöüÄÖÜß\\s.,!?@#&()\\-_';
    const pattern = new RegExp(`[^${basePattern}${allowedChars}]`, 'g');
    return input.replace(pattern, '').trim();
};

/**
 * Validates and sanitizes customer data
 * @param {object} data - Customer data object
 * @returns {object} - Validated and sanitized data
 * @throws {Error} - If validation fails
 */
export const validateCustomerData = (data) => {
    const errors = [];

    // Email validation
    if (data.email && !validateEmail(data.email)) {
        errors.push('Ungültige Email-Adresse');
    }

    // Name validation (if present)
    if (data.first_name && !validateLength(data.first_name, 1, 100)) {
        errors.push('Vorname muss zwischen 1 und 100 Zeichen lang sein');
    }
    if (data.last_name && !validateLength(data.last_name, 1, 100)) {
        errors.push('Nachname muss zwischen 1 und 100 Zeichen lang sein');
    }

    // Company name validation (for business customers)
    if (data.company_name && !validateLength(data.company_name, 1, 200)) {
        errors.push('Firmenname muss zwischen 1 und 200 Zeichen lang sein');
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    // Sanitize all string fields
    const sanitized = { ...data };
    if (sanitized.email) sanitized.email = sanitized.email.trim().toLowerCase();
    if (sanitized.phone) sanitized.phone = sanitizePhone(sanitized.phone);
    if (sanitized.first_name) sanitized.first_name = escapeHtml(sanitized.first_name);
    if (sanitized.last_name) sanitized.last_name = escapeHtml(sanitized.last_name);
    if (sanitized.company_name) sanitized.company_name = escapeHtml(sanitized.company_name);
    if (sanitized.notes) sanitized.notes = escapeHtml(sanitized.notes);
    if (sanitized.street) sanitized.street = escapeHtml(sanitized.street);
    if (sanitized.city) sanitized.city = escapeHtml(sanitized.city);

    return sanitized;
};

/**
 * Validates and sanitizes contract data
 * @param {object} data - Contract data object
 * @returns {object} - Validated and sanitized data
 * @throws {Error} - If validation fails
 */
export const validateContractData = (data) => {
    const errors = [];

    // Contract number validation
    if (data.contract_number && !validateLength(data.contract_number, 1, 50)) {
        errors.push('Vertragsnummer muss zwischen 1 und 50 Zeichen lang sein');
    }

    // Tariff name validation
    if (data.tariff_name && !validateLength(data.tariff_name, 1, 200)) {
        errors.push('Tarifname muss zwischen 1 und 200 Zeichen lang sein');
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    // Sanitize all string fields
    const sanitized = { ...data };
    if (sanitized.contract_number) sanitized.contract_number = escapeHtml(sanitized.contract_number);
    if (sanitized.tariff_name) sanitized.tariff_name = escapeHtml(sanitized.tariff_name);
    if (sanitized.tariff_details) sanitized.tariff_details = escapeHtml(sanitized.tariff_details);
    if (sanitized.notes) sanitized.notes = escapeHtml(sanitized.notes);
    if (sanitized.vvl_notes) sanitized.vvl_notes = escapeHtml(sanitized.vvl_notes);

    return sanitized;
};
