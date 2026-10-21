import jsPDF from 'jspdf';

export const generatePDF = (reservation) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette - Light Professional Theme
  const primaryNavy = [20, 35, 60];
  const charcoalDark = [35, 45, 60];
  const slateMuted = [90, 105, 120];
  const borderLight = [210, 220, 230];
  const cardBg = [248, 250, 252];
  const greenBadge = [22, 163, 74];

  // Page background: Clean White
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Outer Decorative Border
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.6);
  doc.rect(10, 10, 190, 277);

  // Header Banner
  doc.setFillColor(...primaryNavy);
  doc.rect(10, 10, 190, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PARKSMART', 105, 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text('Distributed Smart Parking & Reservation System', 105, 32, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Official Digital Parking Ticket', 105, 39, { align: 'center' });

  // Top Info Bar (Reservation ID & Confirmed Badge)
  const topBarY = 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...charcoalDark);
  doc.text('Reservation ID:', 16, topBarY);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryNavy);
  const resId = reservation.reservationId || reservation._id || 'PK-CONFIRMED';
  doc.text(String(resId), 50, topBarY);

  // Confirmed Badge
  doc.setFillColor(...greenBadge);
  doc.roundedRect(148, topBarY - 6, 46, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONFIRMED', 171, topBarY, { align: 'center' });

  // Thin separator
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.5);
  doc.line(16, 64, 194, 64);

  // Helper function to draw neat card sections
  let currentY = 70;

  const drawSectionHeader = (title, y) => {
    doc.setFillColor(...cardBg);
    doc.roundedRect(16, y, 178, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryNavy);
    doc.text(title.toUpperCase(), 20, y + 5);
    return y + 12;
  };

  const drawRow = (label, value, y) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...slateMuted);
    doc.text(label, 20, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...charcoalDark);
    doc.text(String(value || 'N/A'), 75, y);
    return y + 6.5;
  };

  // Section 1: Parking Details
  currentY = drawSectionHeader('Parking Facility Details', currentY);
  currentY = drawRow('Location Name:', reservation.location?.name || 'Ahmedabad Parking', currentY);
  currentY = drawRow('Address:', reservation.location?.address || 'Ahmedabad, Gujarat', currentY);
  currentY = drawRow('Assigned Slot:', reservation.slot?.slotNumber || reservation.slotNumber || 'A-01', currentY);
  currentY = drawRow('Parking Floor:', `Level ${reservation.slot?.floor || 1}`, currentY);

  currentY += 2;

  // Section 2: Schedule & Timing
  currentY = drawSectionHeader('Booking Schedule', currentY);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  currentY = drawRow('Start Time:', formatDate(reservation.startTime), currentY);
  currentY = drawRow('End Time:', formatDate(reservation.endTime), currentY);
  currentY = drawRow('Booked Duration:', `${reservation.duration || 1} hour(s)`, currentY);

  currentY += 2;

  // Section 3: User & Vehicle Details
  currentY = drawSectionHeader('Customer & Vehicle Information', currentY);
  const userName = reservation.user?.name || reservation.useName || 'Tester User';
  const userPhone = reservation.user?.phone || reservation.usePhone || '9876543210';
  const vehiclePlate = reservation.user?.licensePlate || reservation.licensePlate || reservation.vehicleNumber || 'GJ-01-AB-1234';

  currentY = drawRow('Customer Name:', userName, currentY);
  currentY = drawRow('Contact Number:', userPhone, currentY);
  currentY = drawRow('License Plate:', vehiclePlate, currentY);

  currentY += 2;

  // Section 4: Payment Summary
  currentY = drawSectionHeader('Payment Summary', currentY);
  const ratePerHour = reservation.slot?.pricePerHour || 50;
  const totalAmount = reservation.totalPrice || 50;

  currentY = drawRow('Rate per Hour:', `Rs. ${ratePerHour} / hr`, currentY);
  currentY = drawRow('Payment Status:', 'Paid (Online / Smart Wallet)', currentY);

  // Total Amount Highlight Box
  currentY += 2;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(16, currentY, 178, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('Total Amount Paid:', 22, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(2, 132, 199);
  doc.text(`Rs. ${totalAmount}`, 155, currentY + 9, { align: 'right' });

  currentY += 20;

  // QR Code Verification Box (Centered and neatly sized)
  const qrBoxY = currentY;
  doc.setDrawColor(...borderLight);
  doc.setFillColor(...cardBg);
  doc.roundedRect(75, qrBoxY, 60, 32, 2, 2, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryNavy);
  doc.text(`[ ${resId} ]`, 105, qrBoxY + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  doc.text('Automated Barrier Check', 105, qrBoxY + 18, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...charcoalDark);
  doc.text(`PLATE: ${vehiclePlate}`, 105, qrBoxY + 25, { align: 'center' });

  // Clean Non-Overlapping Footer at Fixed Bottom Positions
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(16, 260, 194, 260);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text('Notice: Present this digital ticket at the parking entrance for camera plate verification.', 105, 266, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  doc.text('For assistance, email support@parksmart.in or contact the facility helpdesk.', 105, 272, { align: 'center' });

  const generatedDate = new Date().toLocaleString('en-IN');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on: ${generatedDate} | ParkSmart Cloud v2.0`, 105, 278, { align: 'center' });

  // Save the PDF with clear naming
  doc.save(`parksmart-ticket-${resId}.pdf`);
};