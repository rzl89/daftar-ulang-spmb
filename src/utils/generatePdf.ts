import { jsPDF } from 'jspdf';
import { useSettingsStore } from '@/store/useSettingsStore';

interface PdfData {
  registrationId: string;
  namaLengkap: string;
  nisn: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  pilihanJurusan1: string;
  createdAt: string;
}

export async function generateBuktiPdf(data: PdfData): Promise<void> {
  const settings = useSettingsStore.getState();
  const schoolName = settings.getSetting('school_name');
  const schoolFullName = settings.getSetting('school_full_name');
  const schoolYear = settings.getSetting('school_year');
  const schoolAddress = settings.getSetting('school_address');
  const schoolPhone = settings.getSetting('school_phone');
  const schoolEmail = settings.getSetting('school_email');
  const schoolCity = settings.getSetting('school_city') || 'Kota';
  const schoolLogoUrl = settings.getSetting('school_logo');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  // ─── HEADER ───
  doc.setFillColor(26, 35, 126); // primary #1A237E
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Load logo if available
  if (schoolLogoUrl) {
    try {
      const res = await fetch(schoolLogoUrl);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // Add logo on the left of the header
      // 30mm x 30mm logo at x=margin, y=7.5 (centered vertically in the 45mm header)
      doc.addImage(base64, 'PNG', margin, 7.5, 30, 30);
    } catch (e) {
      console.warn("Failed to load school logo for PDF", e);
    }
  }

  doc.setTextColor(249, 168, 37); // accent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BUKTI DAFTAR ULANG', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`SPMB ${schoolName}`, pageWidth / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Ajaran ${schoolYear}`, pageWidth / 2, y, { align: 'center' });

  // ─── BODY ───
  y = 58;

  // Registration ID box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NOMOR REGISTRASI', margin + 6, y + 6);
  doc.setTextColor(26, 35, 126);
  doc.setFontSize(14);
  doc.text(data.registrationId, margin + 6, y + 14);

  y += 28;

  // Data rows
  // Format tempat, tanggal lahir
  const ttl = data.tempatLahir && data.tanggalLahir
    ? `${data.tempatLahir}, ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(data.tanggalLahir))}`
    : data.tempatLahir || data.tanggalLahir || '-';

  const rows: [string, string][] = [
    ['Nama Lengkap', data.namaLengkap],
    ['NISN', data.nisn],
    ['Tempat, Tanggal Lahir', ttl],
    ['Jurusan Diterima', data.pilihanJurusan1],
    ['Tanggal Daftar Ulang', new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(data.createdAt))],
  ];

  rows.forEach(([label, value], index) => {
    const rowY = y + index * 16;

    // Zebra stripe
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY - 4, contentWidth, 16, 'F');
    }

    // Label
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, margin + 6, rowY + 4);

    // Value
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(value, margin + 6, rowY + 10);
  });

  y += rows.length * 16 + 10;

  // ─── SEPARATOR ───
  doc.setDrawColor(226, 232, 240);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);

  y += 10;

  // ─── FOOTER NOTE ───
  doc.setFillColor(254, 252, 232); // amber-50
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setTextColor(146, 64, 14); // amber-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PENTING:', margin + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Cetak dan bawa dokumen ini saat hari pertama Pengenalan Lingkungan Sekolah (PLS).', margin + 6, y + 14);

  y += 30;

  // ─── SIGNATURE AREA ───
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  doc.text(`${schoolCity}, ${dateStr}`, pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text('Panitia SPMB', pageWidth - margin, y, { align: 'right' });

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(schoolFullName, pageWidth - margin, y, { align: 'right' });

  // ─── BOTTOM BAR ───
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(26, 35, 126);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${schoolAddress}  |  ${schoolPhone}  |  ${schoolEmail}`, pageWidth / 2, pageHeight - 4, { align: 'center' });

  // ─── SAVE ───
  doc.save(`Bukti_Daftar_Ulang_${data.registrationId}.pdf`);
}
