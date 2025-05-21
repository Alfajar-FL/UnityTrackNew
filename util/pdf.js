import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export const generatePDFBuffer = ({ name = '-', username = '-', password = '-' }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    const chunks = [];

    doc.pipe(stream);

    doc.font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#000')
      .text("Informasi Akun", {
        align: 'center',
        underline: true,
      });

    doc.moveDown(2);

    const rowHeight = 20;
    const labelX = 50;
    const colonX = 130;
    const valueX = 150;
    let y = doc.y;

    const drawRow = (label, value) => {
      doc.font('Helvetica-Bold').fontSize(12).text(label, labelX, y);
      doc.font('Helvetica').text(':', colonX, y);
      doc.font('Helvetica').text(value, valueX, y);
      y += rowHeight;
    };

    drawRow('Nama', name);
    drawRow('Username', username);
    drawRow('Password', password);

    doc.moveDown(2);
    doc.font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#666')
      .text(`Generated at: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};
