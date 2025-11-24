import { createClient } from '@supabase/supabase-js';

class OTPService {
  private static instance: OTPService;
  private otpAttempts: { [key: string]: number } = {};
  private otpTimers: { [key: string]: NodeJS.Timeout } = {};

  static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  generateOTP(length: number = 6): string {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  async sendOTP(phone: string, email: string, userId: string): Promise<{success: boolean, otp?: string, error?: string}> {
    try {
      // Validate phone format
      if (!this.isValidPhone(phone)) {
        return { success: false, error: 'Invalid phone number format' };
      }

      const otp = this.generateOTP(6);

      // In production, use real SMS gateway (Twilio, AWS SNS, etc.)
      // For now, store in localStorage for demo purposes
      const otpData = {
        phone,
        otp,
        timestamp: Date.now(),
        attempts: 0,
        userId
      };

      // Store OTP in localStorage
      localStorage.setItem(`otp_${phone}`, JSON.stringify(otpData));

      // Set 15-minute expiry
      this.setOTPExpiry(phone, 15 * 60 * 1000);

      // Log OTP for demo (remove in production)
      console.log(`OTP for ${phone}: ${otp}`);

      // Return OTP for demo purposes (remove in production)
      return { success: true, otp };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { success: false, error: 'Failed to send OTP' };
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<{success: boolean, error?: string}> {
    try {
      const otpData = localStorage.getItem(`otp_${phone}`);
      if (!otpData) {
        return { success: false, error: 'OTP expired or not found' };
      }

      const { otp: storedOtp, timestamp, attempts } = JSON.parse(otpData);

      // Check if OTP expired (15 minutes)
      if (Date.now() - timestamp > 15 * 60 * 1000) {
        localStorage.removeItem(`otp_${phone}`);
        return { success: false, error: 'OTP expired' };
      }

      // Check attempts
      if (attempts >= 3) {
        localStorage.removeItem(`otp_${phone}`);
        return { success: false, error: 'Too many attempts. OTP has been invalidated' };
      }

      // Verify OTP
      if (otp !== storedOtp) {
        const updated = JSON.parse(otpData);
        updated.attempts = attempts + 1;
        localStorage.setItem(`otp_${phone}`, JSON.stringify(updated));
        return { success: false, error: `Invalid OTP. ${3 - (attempts + 1)} attempts remaining` };
      }

      // OTP verified
      localStorage.removeItem(`otp_${phone}`);
      localStorage.setItem(`otp_verified_${phone}`, JSON.stringify({ verified: true, timestamp: Date.now() }));

      // Clear expiry timer
      if (this.otpTimers[phone]) {
        clearTimeout(this.otpTimers[phone]);
      }

      return { success: true };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return { success: false, error: 'OTP verification failed' };
    }
  }

  isOTPVerified(phone: string): boolean {
    const verified = localStorage.getItem(`otp_verified_${phone}`);
    if (!verified) return false;

    try {
      const { timestamp } = JSON.parse(verified);
      // Verified status valid for 10 minutes
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        localStorage.removeItem(`otp_verified_${phone}`);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  clearOTPVerification(phone: string): void {
    localStorage.removeItem(`otp_verified_${phone}`);
    localStorage.removeItem(`otp_${phone}`);
  }

  private setOTPExpiry(phone: string, duration: number): void {
    if (this.otpTimers[phone]) {
      clearTimeout(this.otpTimers[phone]);
    }

    this.otpTimers[phone] = setTimeout(() => {
      localStorage.removeItem(`otp_${phone}`);
      delete this.otpTimers[phone];
    }, duration);
  }

  private isValidPhone(phone: string): boolean {
    // Basic validation: should contain only digits and basic formatting
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    return phoneRegex.test(phone.trim());
  }

  getAttempts(phone: string): number {
    const otpData = localStorage.getItem(`otp_${phone}`);
    if (!otpData) return 0;

    try {
      const { attempts } = JSON.parse(otpData);
      return attempts;
    } catch {
      return 0;
    }
  }

  getRemainingTime(phone: string): number {
    const otpData = localStorage.getItem(`otp_${phone}`);
    if (!otpData) return 0;

    try {
      const { timestamp } = JSON.parse(otpData);
      const elapsed = Date.now() - timestamp;
      const remaining = Math.max(0, 15 * 60 * 1000 - elapsed);
      return Math.ceil(remaining / 1000); // Return in seconds
    } catch {
      return 0;
    }
  }
}

export default OTPService;
