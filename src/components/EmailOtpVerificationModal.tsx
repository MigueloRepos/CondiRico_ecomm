import React from "react";
import { EmailConfirmationModal } from "@/components/EmailConfirmationModal";
import { UserProfile } from "@/lib/auth";

interface EmailOtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onChangeEmail?: () => void;
}

/**
 * Delegating wrapper component: replaces 6-digit code OTP verification with confirmation link verification.
 */
export const EmailOtpVerificationModal: React.FC<EmailOtpVerificationModalProps> = (props) => {
  return <EmailConfirmationModal {...props} />;
};
