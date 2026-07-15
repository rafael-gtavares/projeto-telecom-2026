const path = require('path');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const { SIGNATURE_FONT_FILES } = require('../constants/signatureFonts');

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');

const CEFET_BLUE = '#1565C0';
const INK = '#1f2933';
const MUTED = '#5b6b7b';

// Logo da CEFET/RJ (mesmos paths do componente do front), com a cor parametrizada.
const logoSvg = (color = CEFET_BLUE) => `<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg">
<path d="M12.0556 0.15471L9.90443 0.232089L6.5152 9.90454C3.40454 18.8032 3.12598 19.6544 3.12598 20.6139C3.12598 22.0067 3.57478 23.1519 4.51881 24.1888C5.21522 24.9626 6.63901 25.8447 7.16519 25.8447C7.33542 25.8447 8.07827 23.8948 9.99728 18.2925C11.4365 14.1449 12.9532 9.76525 13.371 8.54265L14.1448 6.34508H18.8495H23.5387L23.7089 5.72604C24.003 4.6582 23.9256 3.04871 23.5542 2.21301C23.1518 1.29993 22.8887 1.00588 22.0221 0.433276L21.3256 -4.96209e-05L17.7662 0.0309022C15.8007 0.0463781 13.2317 0.108282 12.0556 0.15471Z" fill="${color}"/>
<path d="M7.14987 0.526298C4.20945 1.54771 1.88806 3.37387 0.355946 5.91192L0 6.5H3.24994H6.48441L7.50582 3.43577C8.07843 1.76437 8.54271 0.340587 8.54271 0.263207C8.54271 0.092972 8.23319 0.1394 7.14987 0.526298Z" fill="${color}"/>
<path d="M14.1451 10.3999C12.7368 14.176 12.1023 15.9248 12.1023 16.0795C12.1023 16.2033 13.0618 16.2498 15.4606 16.2498C18.726 16.2498 18.8188 16.2343 19.4379 15.8783C20.1962 15.445 20.2426 15.3676 21.1557 12.9224C21.9295 10.8332 21.9759 10.5546 21.5581 10.0439C21.264 9.67249 21.2176 9.67249 17.8593 9.62606L14.4546 9.57964L14.1451 10.3999Z" fill="${color}"/>
<path d="M10.5391 20.227C10.4462 20.4746 9.99743 21.7437 9.54863 23.0591C9.09983 24.3746 8.6665 25.5972 8.6046 25.7519C8.49627 26.0305 8.5427 26.046 9.40935 25.9376C11.5141 25.69 14.4081 24.3127 16.2342 22.6877C17.1628 21.8675 18.602 20.1961 18.602 19.9485C18.602 19.8711 17.039 19.8092 14.6557 19.8092H10.7093L10.5391 20.227Z" fill="${color}"/>
</svg>`;

// Minutos totais → "20h", "20h30", ou "—" quando não há como calcular.
const formatWorkload = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

const formatDateBR = (d) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Constrói o PDFDocument do certificado (paisagem A4). O chamador faz o pipe
// para a resposta HTTP. `data` = { studentName, courseTitle, modalityLabel,
// workloadLabel, startDate, endDate, issuedAt, certId }.
function createCertificateDoc(data) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const W = doc.page.width;   // ~841.89
  const H = doc.page.height;  // ~595.28
  const cx = W / 2;

  // Fundo branco + molduras (dupla borda azul)
  doc.rect(0, 0, W, H).fill('#ffffff');
  doc.lineWidth(3).strokeColor(CEFET_BLUE).rect(24, 24, W - 48, H - 48).stroke();
  doc.lineWidth(1).strokeColor(CEFET_BLUE).rect(32, 32, W - 64, H - 64).stroke();

  // Logo centralizada no topo
  const logoW = 52;
  const logoH = logoW * (26 / 24);
  SVGtoPDF(doc, logoSvg(CEFET_BLUE), cx - logoW / 2, 58, { width: logoW, height: logoH });

  doc.fillColor(CEFET_BLUE).font('Helvetica-Bold').fontSize(16)
    .text('CEFET/RJ', 0, 58 + logoH + 8, { width: W, align: 'center' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text('Centro Federal de Educação Tecnológica Celso Suckow da Fonseca', 0, 58 + logoH + 28, { width: W, align: 'center' });

  // Título
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(30)
    .text('CERTIFICADO DE CONCLUSÃO', 0, 175, { width: W, align: 'center', characterSpacing: 1 });

  // Linha decorativa curta
  doc.moveTo(cx - 60, 218).lineTo(cx + 60, 218).lineWidth(2).strokeColor(CEFET_BLUE).stroke();

  // Corpo
  const bodyW = W - 200;
  const bodyX = 100;
  doc.fillColor(MUTED).font('Helvetica').fontSize(13)
    .text('Certificamos que', bodyX, 245, { width: bodyW, align: 'center' });

  doc.fillColor(INK).font('Helvetica-Bold').fontSize(24)
    .text(data.studentName, bodyX, 268, { width: bodyW, align: 'center' });

  doc.fillColor(MUTED).font('Helvetica').fontSize(13)
    .text('concluiu com êxito o curso', bodyX, 305, { width: bodyW, align: 'center' });

  doc.fillColor(CEFET_BLUE).font('Helvetica-Bold').fontSize(18)
    .text(data.courseTitle, bodyX, 326, { width: bodyW, align: 'center' });

  const periodo = `Modalidade ${data.modalityLabel} · Carga horária de ${data.workloadLabel} · Realizado de ${formatDateBR(data.startDate)} a ${formatDateBR(data.endDate)}.`;
  doc.fillColor(INK).font('Helvetica').fontSize(12)
    .text(periodo, bodyX, 362, { width: bodyW, align: 'center', lineGap: 3 });

  // Rodapé: assinatura + emissão/código
  const footY = H - 120;

  // Assinatura manuscrita de quem emitiu, logo acima da linha (quando configurada).
  const sigFile = data.signatureFont && SIGNATURE_FONT_FILES[data.signatureFont];
  if (data.signatureText && sigFile) {
    doc.registerFont('signature', path.join(FONTS_DIR, sigFile));
    doc.fillColor(INK).font('signature').fontSize(34)
      .text(data.signatureText, cx - 160, footY - 46, { width: 320, align: 'center', lineBreak: false });
  }

  doc.moveTo(cx - 110, footY).lineTo(cx + 110, footY).lineWidth(1).strokeColor(INK).stroke();
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
    .text(data.signerName || 'Coordenação de Cursos e Eventos', cx - 150, footY + 6, { width: 300, align: 'center' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text('CEFET/RJ', cx - 150, footY + 20, { width: 300, align: 'center' });

  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(`Emitido em ${formatDateBR(data.issuedAt)}`, 48, H - 58, { width: W - 96, align: 'left' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(`Código de validação: ${data.certId}`, 48, H - 58, { width: W - 96, align: 'right' });

  return doc;
}

module.exports = { createCertificateDoc, formatWorkload };
