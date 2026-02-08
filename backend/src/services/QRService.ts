import QRCode from 'qrcode';
import crypto from 'crypto';

export class QRService {
  static async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
      });
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  static generateQRData(outpassId: string, studentId: string): string {
    const timestamp = Date.now();
    const hash = crypto
      .createHash('sha256')
      .update(`${outpassId}-${studentId}-${timestamp}`)
      .digest('hex');
    
    return JSON.stringify({
      outpassId,
      studentId,
      timestamp,
      hash,
    });
  }

  static verifyQRData(qrData: string, outpassId: string, studentId: string): boolean {
    try {
      const data = JSON.parse(qrData);
      
      if (data.outpassId !== outpassId || data.studentId !== studentId) {
        return false;
      }

      const expectedHash = crypto
        .createHash('sha256')
        .update(`${data.outpassId}-${data.studentId}-${data.timestamp}`)
        .digest('hex');

      return data.hash === expectedHash;
    } catch (error) {
      return false;
    }
  }
}

// 
