import { Request, Response, NextFunction } from 'express';
import { IdentifyRequest } from '../types';

export const validateIdentifyRequest = (req: Request, res: Response, next: NextFunction) => {
    const { email, phoneNumber }: IdentifyRequest = req.body;

    // At least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
        return res.status(400).json({
            error: 'At least one of email or phoneNumber must be provided'
        });
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
        return res.status(400).json({
            error: 'Invalid email format'
        });
    }

    // Validate phone number format if provided
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({
            error: 'Invalid phone number format'
        });
    }

    next();
};

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhoneNumber = (phoneNumber: string): boolean => {
    // Basic phone number validation (digits, spaces, hyphens, parentheses, plus)
    const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phoneNumber) && phoneNumber.replace(/\D/g, '').length >= 7;
};