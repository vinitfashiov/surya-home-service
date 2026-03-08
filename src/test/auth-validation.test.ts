import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the validation schemas from the auth pages
const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

describe('Login Validation', () => {
  it('should accept valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' });
    expect(result.success).toBe(false);
  });

  it('should reject password > 128 chars', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'a'.repeat(129) });
    expect(result.success).toBe(false);
  });

  it('should trim email whitespace', () => {
    const result = loginSchema.safeParse({ email: '  test@example.com  ', password: '123456' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('test@example.com');
  });
});

describe('Signup Validation', () => {
  const validData = {
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('should accept valid data', () => {
    expect(signupSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject short name', () => {
    expect(signupSchema.safeParse({ ...validData, fullName: 'J' }).success).toBe(false);
  });

  it('should reject mismatched passwords', () => {
    expect(signupSchema.safeParse({ ...validData, confirmPassword: 'different' }).success).toBe(false);
  });

  it('should reject name > 100 chars', () => {
    expect(signupSchema.safeParse({ ...validData, fullName: 'a'.repeat(101) }).success).toBe(false);
  });

  it('should reject invalid email format', () => {
    expect(signupSchema.safeParse({ ...validData, email: 'bad-email' }).success).toBe(false);
  });
});
