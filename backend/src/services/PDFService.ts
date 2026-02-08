import PDFDocument from 'pdfkit';
import { IOutpass, IUser } from '../types';

export class PDFService {
  static async generateOutpassPDF(
    outpass: IOutpass,
    student: IUser,
    qrCodeDataURL: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .fillColor('#667eea')
          .text('CAMPUS PASS', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(16)
          .fillColor('#764ba2')
          .text('Outpass Authorization', { align: 'center' })
          .moveDown(1);

        // Horizontal line
        doc
          .strokeColor('#667eea')
          .lineWidth(2)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown(1);

        // Student Information
        doc.fontSize(14).fillColor('#333').text('Student Information', { underline: true });
        doc.moveDown(0.5);

        const studentInfo = [
          ['Name:', student.name],
          ['Roll Number:', student.rollNumber || 'N/A'],
          ['Department:', student.department || 'N/A'],
          ['Hostel:', student.hostel || 'N/A'],
          ['Room Number:', student.roomNumber || 'N/A'],
          ['Phone:', student.phone],
        ];

        studentInfo.forEach(([label, value]) => {
          doc
            .fontSize(11)
            .fillColor('#667eea')
            .text(label, 50, doc.y, { continued: true, width: 150 })
            .fillColor('#333')
            .text(value, { width: 350 });
          doc.moveDown(0.3);
        });

        doc.moveDown(1);

        // Outpass Details
        doc.fontSize(14).fillColor('#333').text('Outpass Details', { underline: true });
        doc.moveDown(0.5);

        const outpassInfo = [
          ['Destination:', outpass.destination],
          ['Purpose:', outpass.purpose],
          ['Reason:', outpass.reason],
          ['From Date:', new Date(outpass.fromDate).toLocaleString()],
          ['To Date:', new Date(outpass.toDate).toLocaleString()],
          ['Emergency Contact:', outpass.emergencyContact],
          ['Status:', outpass.status.toUpperCase()],
        ];

        if (outpass.wardenRemarks) {
          outpassInfo.push(['Warden Remarks:', outpass.wardenRemarks]);
        }

        outpassInfo.forEach(([label, value]) => {
          doc
            .fontSize(11)
            .fillColor('#667eea')
            .text(label, 50, doc.y, { continued: true, width: 150 })
            .fillColor('#333')
            .text(value, { width: 350 });
          doc.moveDown(0.3);
        });

        doc.moveDown(1);

        // QR Code
        doc.fontSize(14).fillColor('#333').text('Verification QR Code', { underline: true });
        doc.moveDown(0.5);

        // Convert base64 QR code to buffer and add to PDF
        const qrCodeBuffer = Buffer.from(
          qrCodeDataURL.replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        );
        doc.image(qrCodeBuffer, 200, doc.y, { width: 200, height: 200 });
        doc.moveDown(12);

        // Instructions
        doc
          .fontSize(10)
          .fillColor('#666')
          .text('Instructions:', { underline: true })
          .moveDown(0.3);

        const instructions = [
          '1. This outpass is valid only for the dates mentioned above',
          '2. Show this QR code to security while leaving campus',
          '3. Report to security immediately upon return',
          '4. Keep your emergency contact informed',
          '5. Any misuse will result in disciplinary action',
        ];

        instructions.forEach((instruction) => {
          doc.fontSize(9).fillColor('#666').text(instruction);
          doc.moveDown(0.2);
        });

        doc.moveDown(1);

        // Footer
        doc
          .fontSize(8)
          .fillColor('#999')
          .text(
            `Generated on: ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 100,
            { align: 'center' }
          );

        doc
          .fontSize(8)
          .fillColor('#999')
          .text('Campus Pass Management System', { align: 'center' })
          .text('This is a computer-generated document', { align: 'center' });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

// 
