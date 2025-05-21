import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateMonitoringReport = (websiteData, monitoringLogs, period) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Laporan Monitoring Website", 105, 20, null, null, "center");

  // Period
  doc.setFontSize(12);
  doc.text(`Periode: ${period.start} - ${period.end}`, 105, 30, null, null, "center");

  // Website Info
  doc.setFontSize(14);
  doc.text("Informasi Website", 14, 45);
  doc.setFontSize(12);
  doc.text(`Nama Website: ${websiteData.name}`, 14, 55);
  doc.text(`URL: ${websiteData.url}`, 14, 62);
  doc.text(`Monitoring ID: ${websiteData.site_id}`, 14, 69);

  // Status Summary
  const upCount = monitoringLogs.filter(log => log.status === "up").length;
  const downCount = monitoringLogs.filter(log => log.status === "down").length;

  doc.setFontSize(14);
  doc.text("Ringkasan Status", 14, 85);
  doc.autoTable({
    startY: 90,
    head: [['Status', 'Jumlah']],
    body: [
      ['✅ Up', upCount],
      ['❌ Down', downCount],
    ],
  });

  // Monitoring Details
  doc.setFontSize(14);
  doc.text("Detail Monitoring", 14, doc.lastAutoTable.finalY + 15);
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['No', 'Status Code', 'Status', 'Response Time (s)', 'Waktu Cek']],
    body: monitoringLogs.map((log, index) => ([
      index + 1,
      log.status_code || "-",
      log.status === "up" ? "✅ Up" : "❌ Down",
      log.response_time ? log.response_time.toFixed(2) : "-",
      log.checked_at ? new Date(log.checked_at).toLocaleString() : "-"
    ])),
  });

  // Save
  doc.save(`Laporan-Monitoring-${websiteData.name}.pdf`);
};
