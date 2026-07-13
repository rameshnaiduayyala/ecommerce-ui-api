import React from 'react';
import { render } from '@react-email/render';
import { OtpEmail } from './templates/OtpEmail';
import { OrderEmail } from './templates/OrderEmail';
import { PasswordResetEmail } from './templates/PasswordResetEmail';

/**
 * Sends an email using the secure Vercel Serverless Function Backend
 * 
 * @param {Object} options Email options
 * @param {string} options.to Recipient email
 * @param {string} options.subject Email subject
 * @param {string} options.html HTML content
 * @returns {Promise<Object>} Response from API
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || errorData.error?.name || 'Failed to send email');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send email via API:', error);
    throw error;
  }
};

/**
 * Common Ecommerce Email Templates (Functions)
 */
export const EmailTemplates = {
  sendOTP: async (to, otp) => {
    const html = await render(<OtpEmail otp={otp} />);
    return sendEmail({
      to,
      subject: 'Your Login OTP - Aha Konaseema',
      html
    });
  },

  sendOrderConfirmation: async (to, details) => {
    const html = await render(<OrderEmail details={details} isAdmin={false} />);
    return sendEmail({
      to,
      subject: `Order Confirmation #${details.orderId.split('-')[0].toUpperCase()} - Aha Konaseema`,
      html
    });
  },

  sendAdminNewOrderAlert: async (adminEmail, details) => {
    const html = await render(<OrderEmail details={details} isAdmin={true} />);
    return sendEmail({
      to: adminEmail,
      subject: `🚨 New Order #${details.orderId.split('-')[0].toUpperCase()} - ₹${details.grandTotal} - Aha Konaseema`,
      html
    });
  },

  sendOrderStatusUpdate: async (to, details, status, adminNote = '') => {
    const html = await render(
      <OrderEmail 
        details={details} 
        isAdmin={false} 
        statusBanner={{ status, adminNote }} 
      />
    );
    
    return sendEmail({
      to,
      subject: `Order Update: #${details.orderId.split('-')[0].toUpperCase()} is now ${status.toUpperCase()} - Aha Konaseema`,
      html
    });
  },

  sendWelcomeEmail: async (to, name) => {
    const html = `<h2>Welcome, ${name}!</h2><p>We're thrilled to have you here. Explore our futuristic sweets collection now.</p>`;
    return sendEmail({
      to,
      subject: 'Welcome to Aha Konaseema!',
      html
    });
  },
  
  sendPasswordReset: async (to, resetLink) => {
    const html = await render(<PasswordResetEmail resetLink={resetLink} />);
    return sendEmail({
      to,
      subject: 'Password Reset Request - Aha Konaseema',
      html
    });
  }
};
