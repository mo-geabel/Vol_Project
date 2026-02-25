import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  ChevronLeft, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  XCircle,
  Clock,
  Printer,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState('');
  const [filterType, setFilterType] = useState('monthly'); // 'monthly' or 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Report data and manual additions
  const [reportData, setReportData] = useState(null);
  const [classActivities, setClassActivities] = useState('');
  const [achievements, setAchievements] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0].id);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedClass) return toast.error('Please select a class');
    
    setGenerating(true);
    try {
      const params = {
        year: selectedYear,
        month: filterType === 'monthly' ? selectedMonth : 'all'
      };
      
      const res = await api.get(`/reports/progress/${selectedClass}`, { params });
      setReportData(res.data);
      toast.success('Report aggregated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const primaryColor = [79, 70, 229]; // Brand Indigo
    const secondaryColor = [243, 244, 246]; // Light Gray Background
    
    // Header Section with Brand Accent
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ACADEMIC PROGRESS REPORT', pageWidth / 2, 16, { align: 'center' });

    // Metadata Strip (Under header)
    doc.setFillColor(...secondaryColor);
    doc.roundedRect(14, 30, pageWidth - 28, 15, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray 500
    doc.setFont('helvetica', 'bold');
    doc.text('CLASS NAME', 20, 36);
    doc.text('REPORTING PERIOD', 80, 36);
    doc.text('STUDENT COUNT', 140, 36);
    doc.text('GENERATED ON', pageWidth - 20, 36, { align: 'right' });

    doc.setTextColor(17, 24, 39); // Gray 900
    doc.setFontSize(11);
    const periodText = filterType === 'monthly' 
      ? `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][selectedMonth]} ${selectedYear}` 
      : `${selectedYear}`;
    
    doc.text(reportData.className.toUpperCase(), 20, 41);
    doc.text(periodText.toUpperCase(), 80, 41);
    doc.text(`${reportData.report.length} PARTICIPANTS`, 140, 41);
    doc.text(format(new Date(), 'MMM dd, yyyy').toUpperCase(), pageWidth - 20, 41, { align: 'right' });

    // Activities Section (Premium Box)
    let currentY = 52;
    if (classActivities) {
      doc.setFillColor(249, 250, 251); // Gray 50
      doc.setDrawColor(229, 231, 235); // Gray 200
      const splitActivities = doc.splitTextToSize(classActivities, pageWidth - 40);
      const boxHeight = (splitActivities.length * 5) + 12;
      
      doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 2, 2, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('PERIOD SUMMARY & CORE ACTIVITIES', 20, currentY + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99); // Gray 600
      doc.text(splitActivities, 20, currentY + 12);
      
      currentY += boxHeight + 8;
    }

    // Table Styling
    const tableData = reportData.report.map(row => [
      row.name,
      `${row.age || '—'}`,
      row.hifz.start ? `${row.hifz.start.surah_name} v.${row.hifz.start.verse}` : '—',
      row.hifz.end ? `${row.hifz.end.surah_name} v.${row.hifz.end.verse}` : '—',
      row.muraja.start ? `${row.muraja.start.surah_name} v.${row.muraja.start.verse}` : '—',
      row.muraja.end ? `${row.muraja.end.surah_name} v.${row.muraja.end.verse}` : '—',
      row.attendance.activeDays,
      row.attendance.absentDays
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['STUDENT NAME', 'AGE', 'HIFZ START', 'HIFZ END', 'MURAJA START', 'MURAJA END', 'PRES.', 'ABS.']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 9, 
        halign: 'center',
        cellPadding: 4
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        textColor: [55, 65, 81], 
        lineColor: [229, 231, 235],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', textColor: [17, 24, 39] },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 35 },
        3: { cellWidth: 35, fontStyle: 'bold' },
        4: { cellWidth: 35 },
        5: { cellWidth: 35, fontStyle: 'bold' },
        6: { cellWidth: 15, halign: 'center', textColor: [22, 163, 74] }, // Green for presence
        7: { cellWidth: 15, halign: 'center', textColor: [220, 38, 38] }  // Red for absence
      },
      alternateRowStyles: { fillColor: [252, 253, 255] },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 12;

    // Qualitative Summary Sections (Side by Side or Stacked)
    const summaryWidth = (pageWidth - 36) / 2;
    
    if (achievements || generalNotes) {
      if (currentY + 40 > pageHeight) { doc.addPage('l'); currentY = 20; }

      // Achievements Box
      if (achievements) {
        doc.setFillColor(240, 253, 244); // Green 50
        doc.setDrawColor(187, 247, 208); // Green 200
        const splitAch = doc.splitTextToSize(achievements, summaryWidth - 10);
        const achHeight = (splitAch.length * 5) + 12;
        
        doc.roundedRect(14, currentY, summaryWidth, achHeight, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(21, 128, 61); // Green 700
        doc.text('NOTABLE ACHIEVEMENTS', 19, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(splitAch, 19, currentY + 12);
      }

      // General Notes Box
      if (generalNotes) {
        const notesX = achievements ? 14 + summaryWidth + 8 : 14;
        const notesWidth = achievements ? summaryWidth : pageWidth - 28;
        
        doc.setFillColor(239, 246, 255); // Blue 50
        doc.setDrawColor(191, 219, 254); // Blue 200
        const splitNotes = doc.splitTextToSize(generalNotes, notesWidth - 10);
        const notesHeight = (splitNotes.length * 5) + 12;
        
        doc.roundedRect(notesX, currentY, notesWidth, notesHeight, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(29, 78, 216); // Blue 700
        doc.text('GENERAL OBSERVATIONS', notesX + 5, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(splitNotes, notesX + 5, currentY + 12);
      }
    }

    // Signature Area
    const footerY = pageHeight - 35;
    doc.setDrawColor(209, 213, 219);
    doc.line(14, footerY, 74, footerY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text("ADMINISTRATOR'S SIGNATURE", 14, footerY + 5);
    doc.text("OFFICIAL INSTITUTION STAMP", pageWidth - 14, footerY + 5, { align: 'right' });

    // Page Numbers & System Branding
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `MOSQUE EDUCATIONAL MANAGEMENT SYSTEM (MEMS) | PAGE ${i} OF ${totalPages} | SYSTEM GENERATED DOCUMENT`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save(`${reportData.className}_Academic_Report_${periodText.replace(' ', '_')}.pdf`);
  };

  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">Loading classes...</div>;

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 text-primary-600 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">System Reports</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Generate Academic & Attendance Overviews</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              disabled={!reportData}
              className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm border border-gray-100 hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-tight"
            >
              <Printer size={18} /> Print
            </button>
            <button 
              onClick={downloadPDF}
              disabled={!reportData}
              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl font-bold text-sm border border-primary-100 hover:bg-primary-100 transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-tight shadow-sm shadow-primary-200"
            >
              <Download size={18} /> Download PDF (A4)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 py-2.5"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name} ({cls.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Period Type</label>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              <button 
                onClick={() => setFilterType('monthly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'monthly' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setFilterType('yearly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'yearly' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 py-2.5"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {filterType === 'monthly' && (
              <div className="flex-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Month</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 py-2.5 text-gray-700"
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-end">
            <button 
              onClick={generateReport}
              disabled={generating}
              className="w-full btn-primary py-2.5 font-bold shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
            >
              {generating ? <Clock size={16} className="animate-spin" /> : <FileText size={16} />} 
              {generating ? 'Aggregating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="space-y-6">
          {/* External Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-secondary-500"/> Period Activities
              </label>
              <textarea 
                value={classActivities}
                onChange={(e) => setClassActivities(e.target.value)}
                placeholder="Core topics, tajweed rules, or special events covered..."
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-secondary-200 h-24 resize-none"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500"/> Notable Achievements
              </label>
              <textarea 
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Outstanding students or collective class successes..."
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-green-100 h-24 resize-none"
              />
            </div>
          </div>

          {/* Report Document */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-10 border-b border-gray-100 flex flex-col items-center text-center bg-gray-50/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-primary-600">
                  <GraduationCap size={32} />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Academic Progress Report</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Educational Quality Management</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl border-t border-gray-200 mt-8 pt-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Class</span>
                  <span className="text-sm font-black text-primary-700">{reportData.className}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Period</span>
                  <span className="text-sm font-black text-secondary-700 lowercase first-letter:uppercase">{filterType === 'monthly' ? `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][selectedMonth]} ${selectedYear}` : selectedYear}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</span>
                  <span className="text-sm font-black text-gray-900">{reportData.report.length} Participants</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-green-600 uppercase">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Official
                  </div>
                </div>
              </div>

              {classActivities && (
                <div className="mt-8 text-left w-full border-l-4 border-secondary-500 pl-6 py-2">
                  <h4 className="text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BookOpen size={14}/> Period Summary & Activities
                  </h4>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed italic">"{classActivities}"</p>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Student Name</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Age</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-amber-50/30" colSpan="2">Hifz Progress</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-blue-50/30" colSpan="2">Muraja Progress</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Pres.</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Abs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.report.map((row) => (
                    <tr key={row.student_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{row.name}</td>
                      <td className="p-4 text-center text-xs font-black text-gray-400">{row.age || '—'}</td>
                      
                      <td className="p-4 text-center text-xs bg-amber-50/10 italic text-gray-500 border-r border-amber-100/30">
                        {row.hifz.start ? `${row.hifz.start.surah_name} ${row.hifz.start.verse}` : '—'}
                      </td>
                      <td className="p-4 text-center text-xs bg-amber-50/10 font-bold text-amber-700">
                        {row.hifz.end ? `${row.hifz.end.surah_name} ${row.hifz.end.verse}` : '—'}
                      </td>
                      
                      <td className="p-4 text-center text-xs bg-blue-50/10 italic text-gray-500 border-r border-blue-100/30">
                        {row.muraja.start ? `${row.muraja.start.surah_name} ${row.muraja.start.verse}` : '—'}
                      </td>
                      <td className="p-4 text-center text-xs bg-blue-50/10 font-bold text-blue-700">
                        {row.muraja.end ? `${row.muraja.end.surah_name} ${row.muraja.end.verse}` : '—'}
                      </td>
                      
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-green-600">{row.attendance.activeDays}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-red-500">{row.attendance.absentDays}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Global Sections (Bottom) */}
            {(achievements || generalNotes) && (
              <div className="p-10 border-t border-gray-100 space-y-8 bg-gray-50/30">
                {achievements && (
                  <div>
                    <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <GraduationCap size={16}/> Notable Achievements & Milestones
                    </h3>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
                      <p className="text-sm font-bold text-gray-700 whitespace-pre-wrap">{achievements}</p>
                    </div>
                  </div>
                )}
                {generalNotes && (
                  <div>
                    <h3 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <FileText size={16}/> General Observations & Notes
                    </h3>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-primary-500">
                      <p className="text-sm font-bold text-gray-700 whitespace-pre-wrap">{generalNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teacher Note Input Area */}
            <div className="p-10 bg-white border-t border-gray-100 print:hidden">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText size={14} className="text-primary-500"/> General Report Notes
              </label>
              <textarea 
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Overall recommendations, concerns, or administrative comments..."
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary-100 h-24 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-100 flex justify-between items-end">
              <div className="flex flex-col gap-4">
                <div className="w-40 h-px bg-gray-200" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator's Signature</span>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorized MEMS Certificate</p>
                <p className="text-[8px] text-gray-300">Generated on {format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for print layout */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 5mm; }
          body { background: white !important; }
          .p-6, .p-10, .p-8 { padding: 4mm !important; }
          .shadow-sm { box-shadow: none !important; }
          .rounded-3xl, .rounded-2xl { border-radius: 0 !important; }
          .bg-gray-50\\/30 { background-color: transparent !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
