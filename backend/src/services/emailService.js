const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  'password-reset': {
    subject: 'Password Reset Request',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p style="margin: 20px 0;">
          <a href="${data.resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from HelpMe Support System.
        </p>
      </div>
    `
  },
  'ticket-created': {
    subject: 'New Support Ticket Created',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Support Ticket</h2>
        <p>Hello ${data.clientName},</p>
        <p>Your support ticket has been created successfully.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>You can track the progress of your ticket by logging into your client portal.</p>
        <p>We'll keep you updated on any changes to your ticket.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from HelpMe Support System.
        </p>
      </div>
    `
  },
  'escalation-notification': {
    subject: 'Ticket Escalation Alert',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">🚨 Ticket Escalation Alert</h2>
        <p>A support ticket has been escalated and requires your attention.</p>
        <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Priority:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.priority}</span></p>
          <p><strong>Escalation Rule:</strong> ${data.escalationRule}</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${data.ticketUrl}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Ticket
          </a>
        </p>
        <p>Please review this ticket immediately and take appropriate action.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated escalation notification from HelpMe Support System.
        </p>
      </div>
    `
  },
  'invoice-sent': {
    subject: 'Invoice ${data.invoiceNumber} - ${data.clientName}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${data.invoiceNumber}</h2>
        <p>Dear ${data.clientName},</p>
        <p>Please find attached your invoice for the services provided.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Invoice Date:</strong> ${data.invoiceDate}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Amount Due:</strong> $${data.totalAmount}</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${data.invoiceUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Invoice
          </a>
        </p>
        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from HelpMe Support System.
        </p>
      </div>
    `
  },
  'invoice-paid': {
    subject: 'Payment Received - Invoice ${data.invoiceNumber}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Payment Received</h2>
        <p>Dear ${data.clientName},</p>
        <p>Thank you for your payment. We have received your payment for the following invoice:</p>
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount Paid:</strong> $${data.amount}</p>
          <p><strong>Payment Date:</strong> ${data.paidDate}</p>
        </div>
        <p>Your payment has been processed successfully. Thank you for your business!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from HelpMe Support System.
        </p>
      </div>
    `
  },
  'invoice-overdue': {
    subject: 'Invoice Overdue - ${data.invoiceNumber}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ Invoice Overdue</h2>
        <p>Dear ${data.clientName},</p>
        <p>This is a reminder that the following invoice is overdue:</p>
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Amount Due:</strong> $${data.balanceDue}</p>
          <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${data.invoiceUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Pay Now
          </a>
        </p>
        <p>Please process this payment as soon as possible to avoid any service interruptions.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from HelpMe Support System.
        </p>
      </div>
    `
  }
};

// Send email
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();
    
    let emailSubject = subject;
    let emailHtml = html;
    let emailText = text;

    // Use template if provided
    if (template && emailTemplates[template]) {
      emailSubject = emailTemplates[template].subject;
      emailHtml = emailTemplates[template].html(data);
    }

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'HelpMe Support'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText || emailHtml.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

// Send escalation notification
const sendEscalationNotification = async (data) => {
  return sendEmail({
    to: data.to,
    template: 'escalation-notification',
    data: data
  });
};

module.exports = {
  sendEmail,
  sendEscalationNotification,
  emailTemplates
}; 