import nodemailer from 'nodemailer';
import { EmailOptions } from '../types';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Campus Pass <noreply@campuspass.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  static async sendOutpassApprovalEmail(
    studentEmail: string,
    studentName: string,
    outpassDetails: any,
    pdfBuffer?: Buffer
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success-badge { background: #48bb78; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Outpass Approved!</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>Your outpass request has been <span class="success-badge">APPROVED</span></p>
            
            <div class="details">
              <h3>Outpass Details:</h3>
              <div class="detail-row">
                <span class="label">Destination:</span>
                <span>${outpassDetails.destination}</span>
              </div>
              <div class="detail-row">
                <span class="label">From Date:</span>
                <span>${new Date(outpassDetails.fromDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">To Date:</span>
                <span>${new Date(outpassDetails.toDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reason:</span>
                <span>${outpassDetails.reason}</span>
              </div>
              ${outpassDetails.wardenRemarks ? `
              <div class="detail-row">
                <span class="label">Warden Remarks:</span>
                <span>${outpassDetails.wardenRemarks}</span>
              </div>
              ` : ''}
            </div>

            <p><strong>Important Instructions:</strong></p>
            <ul>
              <li>Please show the attached QR code to security while leaving campus</li>
              <li>Ensure you return before the specified date and time</li>
              <li>Report to security upon your return</li>
              <li>Keep your emergency contact informed</li>
            </ul>

            <p>The outpass PDF with QR code is attached to this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Campus Pass Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = pdfBuffer
      ? [
          {
            filename: `outpass-${outpassDetails._id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    await this.sendEmail({
      to: studentEmail,
      subject: '✅ Your Outpass Has Been Approved',
      html,
      attachments,
    });
  }

  static async sendOutpassRejectionEmail(
    studentEmail: string,
    studentName: string,
    outpassDetails: any,
    rejectionReason: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f56565 0%, #c53030 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .rejection-box { background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Outpass Request Rejected</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>We regret to inform you that your outpass request has been rejected.</p>
            
            <div class="rejection-box">
              <strong>Reason for Rejection:</strong>
              <p>${rejectionReason}</p>
            </div>

            <div class="details">
              <h3>Request Details:</h3>
              <p><strong>Destination:</strong> ${outpassDetails.destination}</p>
              <p><strong>From:</strong> ${new Date(outpassDetails.fromDate).toLocaleString()}</p>
              <p><strong>To:</strong> ${new Date(outpassDetails.toDate).toLocaleString()}</p>
            </div>

            <p>If you have any questions or concerns, please contact your warden.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Campus Pass Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '❌ Your Outpass Request Has Been Rejected',
      html,
    });
  }

  static async sendOverdueNotification(
    studentEmail: string,
    studentName: string,
    outpassDetails: any
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Outpass Overdue Alert</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            
            <div class="warning-box">
              <strong>URGENT:</strong> Your outpass has expired and you have not checked in yet.
            </div>

            <p><strong>Expected Return:</strong> ${new Date(outpassDetails.toDate).toLocaleString()}</p>
            <p><strong>Destination:</strong> ${outpassDetails.destination}</p>

            <p>Please return to campus immediately and report to security for check-in.</p>
            <p>If you are facing any issues, please contact your warden or the hostel office.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2024 Campus Pass Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '⚠️ URGENT: Your Outpass is Overdue',
      html,
    });
  }

  static async sendReturnReminder(
    studentEmail: string,
    studentName: string,
    outpassDetails: any,
    timeRemaining: string
  ): Promise<void> {
    const urgencyLevel = timeRemaining === '5 minutes' ? 'CRITICAL' : timeRemaining === '30 minutes' ? 'HIGH' : 'MEDIUM';
    const bgColor = timeRemaining === '5 minutes' ? '#f56565' : timeRemaining === '30 minutes' ? '#ed8936' : '#ecc94b';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .urgency-box { background: #fff5f5; border-left: 4px solid ${bgColor}; padding: 15px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .time-badge { background: ${bgColor}; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Return Reminder</h1>
            <div class="time-badge">${timeRemaining.toUpperCase()} REMAINING</div>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            
            <div class="urgency-box">
              <strong>${urgencyLevel} PRIORITY:</strong>
              <p>Your outpass expires in <strong>${timeRemaining}</strong>. ${timeRemaining === '5 minutes' ? 'You MUST return NOW!' : 'Please start heading back to campus.'}</p>
            </div>

            <div class="details">
              <h3>Outpass Details:</h3>
              <p><strong>Destination:</strong> ${outpassDetails.destination}</p>
              <p><strong>Return Time:</strong> ${new Date(outpassDetails.toDate).toLocaleString()}</p>
              <p><strong>Purpose:</strong> ${outpassDetails.purpose}</p>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
              <li>Report to security immediately upon arrival</li>
              <li>Late return will be marked as overdue</li>
              <li>3 overdue outpasses will result in account suspension</li>
              ${timeRemaining === '5 minutes' ? '<li style="color: #f56565; font-weight: bold;">URGENT: You have only 5 minutes left!</li>' : ''}
            </ul>

            ${timeRemaining === '5 minutes' ? '<p style="color: #f56565; font-weight: bold; font-size: 16px;">⚠️ If you cannot return on time, contact your warden immediately!</p>' : ''}
          </div>
          <div class="footer">
            <p>This is an automated reminder. Please do not reply.</p>
            <p>&copy; 2024 Campus Pass Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: `⏰ ${urgencyLevel} PRIORITY: Return in ${timeRemaining}!`,
      html,
    });
  }

  static async sendOutpassCreationConfirmation(
    studentEmail: string,
    studentName: string,
    outpassDetails: any
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .status-badge { background: #ecc94b; color: #744210; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Outpass Request Submitted</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>Your outpass request has been <span class="status-badge">SUBMITTED SUCCESSFULLY</span></p>
            <p>Your request is now pending approval from your warden. You will be notified once a decision is made.</p>
            
            <div class="details">
              <h3>Request Details:</h3>
              <div class="detail-row">
                <span class="label">Destination:</span>
                <span>${outpassDetails.destination}</span>
              </div>
              <div class="detail-row">
                <span class="label">Purpose:</span>
                <span>${outpassDetails.purpose}</span>
              </div>
              <div class="detail-row">
                <span class="label">From Date:</span>
                <span>${new Date(outpassDetails.fromDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">To Date:</span>
                <span>${new Date(outpassDetails.toDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reason:</span>
                <span>${outpassDetails.reason}</span>
              </div>
              <div class="detail-row">
                <span class="label">Emergency Contact:</span>
                <span>${outpassDetails.emergencyContact}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span style="color: #ecc94b; font-weight: bold;">PENDING APPROVAL</span>
              </div>
            </div>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your warden will review your request</li>
              <li>You will receive an email notification once approved or rejected</li>
              <li>If approved, you will receive a PDF with QR code</li>
              <li>Show the QR code to security when leaving campus</li>
            </ul>

            <p><strong>Note:</strong> You can cancel this request anytime before it's approved by visiting your dashboard.</p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation. Please do not reply.</p>
            <p>&copy; 2024 Campus Pass Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '✅ Outpass Request Submitted Successfully',
      html,
    });
  }
}

// 
