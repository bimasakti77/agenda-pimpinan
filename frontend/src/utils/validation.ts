/**
 * Validation utilities for form inputs
 * Following modern web development standards
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a single field value against rules
 */
export function validateField(value: any, rules: ValidationRule, fieldName: string): string | null {
  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} harus diisi`;
  }

  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }

  const stringValue = value.toString().trim();

  // Min length validation
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} minimal ${rules.minLength} karakter`;
  }

  // Max length validation
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} maksimal ${rules.maxLength} karakter`;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return `${fieldName} format tidak valid`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

/**
 * Validates multiple fields at once
 */
export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[fieldName], fieldRules, fieldName);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Format email tidak valid';
      }
      return null;
    }
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value: string) => {
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username hanya boleh mengandung huruf, angka, dan underscore';
      }
      return null;
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value.length < 8) {
        return 'Password minimal 8 karakter';
      }
      if (!/(?=.*[a-z])/.test(value)) {
        return 'Password harus mengandung huruf kecil';
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return 'Password harus mengandung huruf besar';
      }
      if (!/(?=.*\d)/.test(value)) {
        return 'Password harus mengandung angka';
      }
      return null;
    }
  },
  nip: {
    required: true,
    pattern: /^\d{18}$/,
    custom: (value: string) => {
      if (!/^\d{18}$/.test(value)) {
        return 'NIP harus 18 digit angka';
      }
      return null;
    }
  },
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    custom: (value: string) => {
      if (value.length < 2) {
        return 'Nama lengkap minimal 2 karakter';
      }
      if (!/^[a-zA-Z\s.,'-]+$/.test(value)) {
        return 'Nama lengkap hanya boleh mengandung huruf, spasi, titik, koma, dan tanda hubung';
      }
      return null;
    }
  }
};

/**
 * User form validation rules
 */
export const UserFormValidation = {
  username: ValidationRules.username,
  email: ValidationRules.email,
  password: ValidationRules.password,
  full_name: ValidationRules.fullName,
  nip: ValidationRules.nip,
  position: { maxLength: 100 },
  department: { maxLength: 100 }
};
