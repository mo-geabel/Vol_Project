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
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fixArabicText } from '../../utils/arabicUtils';
import '../../Fonts/Amiri-Regular-normal';
import '../../Fonts/Amiri-Bold-normal';

const Reports = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language.startsWith('ar');
  const monthNames = [
    t('common.months.jan'), t('common.months.feb'), t('common.months.mar'),
    t('common.months.apr'), t('common.months.may'), t('common.months.jun'),
    t('common.months.jul'), t('common.months.aug'), t('common.months.sep'),
    t('common.months.oct'), t('common.months.nov'), t('common.months.dec')
  ];
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [settings, setSettings] = useState({});
  
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
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (error) {
      console.warn('Could not load settings for PDF header');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0].id);
    } catch (error) {
      toast.error(t('reports.load_classes_error'));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedClass) return toast.error(t('reports.select_class_error'));
    
    setGenerating(true);
    try {
      const params = {
        year: selectedYear,
        month: filterType === 'monthly' ? selectedMonth : 'all'
      };
      
      const res = await api.get(`/reports/progress/${selectedClass}`, { params });
      
      // Translate surah names according to current language
      const translatedReport = res.data.report.map(student => ({
        ...student,
        hifz: {
          start: student.hifz.start ? { ...student.hifz.start, surah_name: t('reports.surahs.' + student.hifz.start.surah_id) } : null,
          end: student.hifz.end ? { ...student.hifz.end, surah_name: t('reports.surahs.' + student.hifz.end.surah_id) } : null,
        },
        muraja: {
          start: student.muraja.start ? { ...student.muraja.start, surah_name: t('reports.surahs.' + student.muraja.start.surah_id) } : null,
          end: student.muraja.end ? { ...student.muraja.end, surah_name: t('reports.surahs.' + student.muraja.end.surah_id) } : null,
        }
      }));

      setReportData({
        ...res.data,
        report: translatedReport
      });
      toast.success(t('reports.generate_success'));
    } catch (error) {
      console.error(error);
      toast.error(t('reports.generate_error'));
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQuranicPDF = () => {
    if (!reportData) return;
   const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFont('Amiri-Regular', 'normal');
    doc.setR2L(false); // Disable this; we are handling BiDi in our utility function
    doc.setLanguage('ar');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const align = isRTL ? 'right' : 'left';
    const alignOpp = isRTL ? 'left' : 'right';
    const xStart = isRTL ? pageWidth - margin : margin;
    const xEnd = isRTL ? margin : pageWidth - margin;
    
    // === Color Palette (institutional green/gold) ===
    const darkGreen = [0, 100, 60];
    const gold = [180, 150, 50];
    const darkText = [30, 30, 30];
    const grayText = [100, 100, 100];
    const lightGray = [245, 245, 245];
    const white = [255, 255, 255];
    
    const periodText = filterType === 'monthly' 
      ? `${monthNames[selectedMonth]} ${selectedYear}` 
      : `${selectedYear}`;
    const mosqueName = settings.mosqueName || t('reports.mosque_default_name');
    const mosqueAddress = settings.mosqueAddress || '';
    const mosquePhone = settings.mosquePhone || '';
    
    // =============================================
    // PAGE 1 HEADER — Official Letterhead
    // =============================================
    
    // Top gold accent line
    doc.setFillColor(...gold);
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    // Green header band
    doc.setFillColor(...darkGreen);
    doc.rect(0, 3, pageWidth, 32, 'F');
    
    // Mosque name (large, centered)
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(...white);
    doc.text(fixArabicText(mosqueName), pageWidth / 2, 17, { align: 'center' });
    
    // Mosque address & phone (smaller, centered below)
    if (mosqueAddress || mosquePhone) {
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 230, 220);
      const contactLine = [mosqueAddress, mosquePhone].filter(Boolean).join('  |  ');
      doc.text(fixArabicText(contactLine), pageWidth / 2, 25, { align: 'center' });
    }
    
    // Report title under header
    doc.setFont('Amiri-Regular', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 215, 200);
    doc.text(fixArabicText(t('reports.quality_management')), pageWidth / 2, 31, { align: 'center' });
    
    // Bottom gold accent line under header
    doc.setFillColor(...gold);
    doc.rect(0, 35, pageWidth, 1.5, 'F');
    
    // =============================================
    // Bismillah
    // =============================================
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...darkGreen);
    doc.text(fixArabicText(t('reports.bismillah')), pageWidth / 2, 46, { align: 'center' });
    
    // =============================================
    // Report Title
    // =============================================
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...darkText);
    doc.text(fixArabicText(t('reports.report_title')), pageWidth / 2, 55, { align: 'center' });
    
    // Thin decorative line under title
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, 58, pageWidth / 2 + 40, 58);
    
    // =============================================
    // Metadata Block
    // =============================================
    const metaY = 64;
    doc.setFillColor(...lightGray);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, metaY, contentWidth, 18, 2, 2, 'FD');
    
    const colWidth = contentWidth / 5;
    const metaItems = [
      { label: t('reports.class'), value: reportData.className + (reportData.theory_summary?.books ? ` - ${reportData.theory_summary.books}` : '') },
      { label: t('reports.period'), value: periodText },
      { label: t('reports.active_days'), value: String(reportData.classActiveDays || 0) },
      { label: t('common.total_students'), value: t('reports.students_count', { count: reportData.report.length }) },
      { label: t('reports.date_label'), value: format(new Date(), 'yyyy-MM-dd') }
    ];
    
    metaItems.forEach((item, i) => {
      const colX = isRTL 
        ? pageWidth - margin - (colWidth * (i + 1)) + colWidth / 2 
        : margin + (colWidth * i) + colWidth / 2;
      
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      doc.text(fixArabicText(item.label), colX, metaY + 7, { align: 'center' });
      
      doc.setFont('Amiri-Bold', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      doc.text(fixArabicText(item.value), colX, metaY + 14, { align: 'center' });
    });
    
    // =============================================
    // Activities Section
    // =============================================
    let currentY = metaY + 24;
    if (classActivities) {
      doc.setFillColor(248, 250, 248);
      doc.setDrawColor(...darkGreen);
      doc.setLineWidth(0.3);
      
      const fixedActivities = fixArabicText(classActivities);
      const splitActivities = doc.splitTextToSize(fixedActivities, contentWidth - 16);
      const boxHeight = (splitActivities.length * 5) + 14;
      
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');
      
      // Green left/right accent bar
      doc.setFillColor(...darkGreen);
      if (isRTL) {
        doc.rect(pageWidth - margin - 3, currentY, 3, boxHeight, 'F');
      } else {
        doc.rect(margin, currentY, 3, boxHeight, 'F');
      }
      
      doc.setFont('Amiri-Bold', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGreen);
      const actTitleX = isRTL ? pageWidth - margin - 8 : margin + 8;
      doc.text(fixArabicText(t('reports.summary_activities')), actTitleX, currentY + 7, { align });
      
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.text(splitActivities, isRTL ? pageWidth - margin - 8 : margin + 8, currentY + 13, { align });
      
      currentY += boxHeight + 6;
    }
    
    // =============================================
    // Student Data Table
    // =============================================
    const tableHeaders = [
      t('reports.student_number'),
      t('reports.Student_Name'), 
      t('reports.Age'), 
      t('reports.Hifz_Start'), 
      t('reports.Hifz_End'), 
      t('reports.Muraja_Start'), 
      t('reports.Muraja_End'), 
      t('reports.pres.'), 
      t('reports.abs.')
    ].map(h => fixArabicText(h));
    
    const tableData = reportData.report.map((row, idx) => {
      const formatProgress = (p) => {
        if (!p || !p.surah_name) return '—';
        const verseStr = p.start === p.end ? p.start : `${p.start}-${p.end}`;
        return `${p.surah_name} (${t('reports.verse')} ${verseStr})`;
      };

      return [
        `${idx + 1}`,
        fixArabicText(row.name),
        row.age ? fixArabicText(`${row.age}`) : '—',
        fixArabicText(formatProgress(row.hifz.start)),
        fixArabicText(formatProgress(row.hifz.end)),
        fixArabicText(formatProgress(row.muraja.start)),
        fixArabicText(formatProgress(row.muraja.end)),
        row.attendance.activeDays,
        row.attendance.absentDays
      ];
    });

    const finalHeaders = isRTL ? [...tableHeaders].reverse() : tableHeaders;
    const finalData = isRTL ? tableData.map(row => [...row].reverse()) : tableData;

    // Define column styles mapping based on visual index
    const getColumnStyles = () => {
      const baseStyles = {
        0: { cellWidth: 12, halign: 'center', textColor: grayText, font: 'Amiri-Bold' },
        1: { cellWidth: 75, halign: align, textColor: darkText, font: 'Amiri-Bold' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 34 },
        4: { cellWidth: 34, font: 'Amiri-Bold', textColor: darkGreen },
        5: { cellWidth: 34 },
        6: { cellWidth: 34, font: 'Amiri-Bold', textColor: [29, 78, 216] },
        7: { cellWidth: 16, halign: 'center', textColor: [22, 120, 50], font: 'Amiri-Bold' },
        8: { cellWidth: 16, halign: 'center', textColor: [200, 30, 30], font: 'Amiri-Bold' }
      };

      if (!isRTL) return baseStyles;

      const reversedStyles = {};
      const totalCols = tableHeaders.length;
      Object.keys(baseStyles).forEach(idx => {
        const newIdx = totalCols - 1 - parseInt(idx);
        reversedStyles[newIdx] = baseStyles[idx];
      });
      return reversedStyles;
    };

    const tableTotalWidth = 270; // 12+75+15+(34*4)+16+16 = 270

    autoTable(doc, {
      startY: currentY,
      head: [finalHeaders],
      body: finalData,
      theme: 'grid',
      headStyles: { 
        fillColor: darkGreen, 
        textColor: white, 
        fontStyle: 'normal', 
        fontSize: 8, 
        halign: 'center',
        cellPadding: 3,
        font: 'Amiri-Bold'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5, 
        textColor: darkText, 
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        font: 'Amiri-Regular',
        halign: 'center'
      },
      columnStyles: getColumnStyles(),
      alternateRowStyles: { fillColor: [250, 253, 250] },
      margin: { left: (pageWidth - tableTotalWidth) / 2, right: (pageWidth - tableTotalWidth) / 2 },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.2
    });
    
    currentY = doc.lastAutoTable.finalY + 10;
    
    // =============================================
    // Achievements & Notes Sections
    // =============================================
    if (achievements || generalNotes) {
      if (currentY + 40 > pageHeight - 50) { doc.addPage('l'); currentY = 20; }
      
      const halfWidth = (contentWidth - 8) / 2;
      
      if (achievements) {
        const achX = isRTL ? margin + halfWidth + 8 : margin;
        const achW = generalNotes ? halfWidth : contentWidth;
        
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(22, 120, 50);
        doc.setLineWidth(0.3);
        
        const fixedAch = fixArabicText(achievements);
        const splitAch = doc.splitTextToSize(fixedAch, achW - 14);
        const achHeight = Math.max((splitAch.length * 5) + 14, 25);
        
        doc.roundedRect(achX, currentY, achW, achHeight, 2, 2, 'FD');
        
        doc.setFont('Amiri-Bold', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(22, 120, 50);
        const achTextX = isRTL ? achX + achW - 6 : achX + 6;
        doc.text(fixArabicText(t('reports.notable_achievements_title')), achTextX, currentY + 7, { align });
        
        doc.setFont('Amiri-Regular', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...darkText);
        doc.text(splitAch, achTextX, currentY + 13, { align });
      }
      
      if (generalNotes) {
        const notesX = isRTL ? margin : (achievements ? margin + halfWidth + 8 : margin);
        const notesW = achievements ? halfWidth : contentWidth;
        
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(29, 78, 216);
        doc.setLineWidth(0.3);
        
        const fixedNotes = fixArabicText(generalNotes);
        const splitNotes = doc.splitTextToSize(fixedNotes, notesW - 14);
        const notesHeight = Math.max((splitNotes.length * 5) + 14, 25);
        
        doc.roundedRect(notesX, currentY, notesW, notesHeight, 2, 2, 'FD');
        
        doc.setFont('Amiri-Bold', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(29, 78, 216);
        const notesTextX = isRTL ? notesX + notesW - 6 : notesX + 6;
        doc.text(fixArabicText(t('reports.general_observations_title')), notesTextX, currentY + 7, { align });
        
        doc.setFont('Amiri-Regular', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...darkText);
        doc.text(splitNotes, notesTextX, currentY + 13, { align });
      }
    }
    
    // =============================================
    // Signature Block (on last page)
    // =============================================
    const sigY = pageHeight - 45;
    const sigWidth = 70;
    
    // Thin separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, sigY - 5, pageWidth - margin, sigY - 5);
    
    // Administrator signature (left / right for RTL)
    const adminSigX = isRTL ? pageWidth - margin - sigWidth : margin;
    doc.setDrawColor(...darkGreen);
    doc.setLineWidth(0.4);
    doc.line(adminSigX, sigY + 10, adminSigX + sigWidth, sigY + 10);
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text(fixArabicText(t('reports.signature_label')), adminSigX + sigWidth / 2, sigY + 16, { align: 'center' });
    
    // Teacher signature (right / left for RTL)
    const teacherSigX = isRTL ? margin : pageWidth - margin - sigWidth;
    doc.line(teacherSigX, sigY + 10, teacherSigX + sigWidth, sigY + 10);
    doc.text(fixArabicText(t('reports.teacher_signature')), teacherSigX + sigWidth / 2, sigY + 16, { align: 'center' });
    
    // Stamp area (center)
    const stampX = pageWidth / 2 - 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(stampX, sigY - 2, 40, 20, 10, 10, 'D');
    doc.setFont('Amiri-Regular', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.text(fixArabicText(t('reports.stamp_area')), pageWidth / 2, sigY + 9, { align: 'center' });
    
    // Date under signatures
    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.text(
      fixArabicText(t('reports.generated_on', { date: format(new Date(), 'yyyy-MM-dd') })),
      pageWidth / 2, sigY + 22, { align: 'center' }
    );
    
    // =============================================
    // Footer on every page — branding + page numbers
    // =============================================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Bottom gold line
      doc.setFillColor(...gold);
      doc.rect(0, pageHeight - 8, pageWidth, 1, 'F');
      
      // Footer text
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        fixArabicText(t('reports.footer_branding', { page: i, total: totalPages })),
        pageWidth / 2,
        pageHeight - 4,
        { align: 'center' }
      );
    }

    doc.save(t('reports.pdf_filename', { className: reportData.className, period: periodText.replace(' ', '_') }));
  };


const downloadTheoryPDF = () => {
    if (!reportData) return;
   const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFont('Amiri-Regular', 'normal');
    doc.setR2L(false); // Disable this; we are handling BiDi in our utility function
    doc.setLanguage('ar');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const align = isRTL ? 'right' : 'left';
    const alignOpp = isRTL ? 'left' : 'right';
    const xStart = isRTL ? pageWidth - margin : margin;
    const xEnd = isRTL ? margin : pageWidth - margin;
    
    // === Color Palette (institutional green/gold) ===
    const darkGreen = [0, 100, 60];
    const gold = [180, 150, 50];
    const darkText = [30, 30, 30];
    const grayText = [100, 100, 100];
    const lightGray = [245, 245, 245];
    const white = [255, 255, 255];
    
    const periodText = filterType === 'monthly' 
      ? `${monthNames[selectedMonth]} ${selectedYear}` 
      : `${selectedYear}`;
    const mosqueName = settings.mosqueName || t('reports.mosque_default_name');
    const mosqueAddress = settings.mosqueAddress || '';
    const mosquePhone = settings.mosquePhone || '';
    
    // =============================================
    // PAGE 1 HEADER — Official Letterhead
    // =============================================
    
    // Top gold accent line
    doc.setFillColor(...gold);
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    // Green header band
    doc.setFillColor(...darkGreen);
    doc.rect(0, 3, pageWidth, 32, 'F');
    
    // Mosque name (large, centered)
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(...white);
    doc.text(fixArabicText(mosqueName), pageWidth / 2, 17, { align: 'center' });
    
    // Mosque address & phone (smaller, centered below)
    if (mosqueAddress || mosquePhone) {
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 230, 220);
      const contactLine = [mosqueAddress, mosquePhone].filter(Boolean).join('  |  ');
      doc.text(fixArabicText(contactLine), pageWidth / 2, 25, { align: 'center' });
    }
    
    // Report title under header
    doc.setFont('Amiri-Regular', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 215, 200);
    doc.text(fixArabicText(t('reports.quality_management')), pageWidth / 2, 31, { align: 'center' });
    
    // Bottom gold accent line under header
    doc.setFillColor(...gold);
    doc.rect(0, 35, pageWidth, 1.5, 'F');
    
    // =============================================
    // Bismillah
    // =============================================
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(...darkGreen);
    doc.text(fixArabicText(t('reports.bismillah')), pageWidth / 2, 46, { align: 'center' });
    
    // =============================================
    // Report Title
    // =============================================
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...darkText);
    doc.text(fixArabicText(t('reports.report_title')), pageWidth / 2, 55, { align: 'center' });
    
    // Thin decorative line under title
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, 58, pageWidth / 2 + 40, 58);
    
    // =============================================
    // Metadata Block
    // =============================================
    const metaY = 64;
    doc.setFillColor(...lightGray);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, metaY, contentWidth, 18, 2, 2, 'FD');
    
    const colWidth = contentWidth / 5;
    const metaItems = [
      { label: t('reports.class'), value: reportData.className + (reportData.theory_summary?.books ? ` - ${reportData.theory_summary.books}` : '') },
      { label: t('reports.period'), value: periodText },
      { label: t('reports.active_days'), value: String(reportData.classActiveDays || 0) },
      { label: t('common.total_students'), value: t('reports.students_count', { count: reportData.report.length }) },
      { label: t('reports.date_label'), value: format(new Date(), 'yyyy-MM-dd') }
    ];
    
    metaItems.forEach((item, i) => {
      const colX = isRTL 
        ? pageWidth - margin - (colWidth * (i + 1)) + colWidth / 2 
        : margin + (colWidth * i) + colWidth / 2;
      
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      doc.text(fixArabicText(item.label), colX, metaY + 7, { align: 'center' });
      
      doc.setFont('Amiri-Bold', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      doc.text(fixArabicText(item.value), colX, metaY + 14, { align: 'center' });
    });
    
    // =============================================
    // Activities Section
    // =============================================
    let currentY = metaY + 24;
    if (classActivities) {
      doc.setFillColor(248, 250, 248);
      doc.setDrawColor(...darkGreen);
      doc.setLineWidth(0.3);
      
      const fixedActivities = fixArabicText(classActivities);
      const splitActivities = doc.splitTextToSize(fixedActivities, contentWidth - 16);
      const boxHeight = (splitActivities.length * 5) + 14;
      
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');
      
      // Green left/right accent bar
      doc.setFillColor(...darkGreen);
      if (isRTL) {
        doc.rect(pageWidth - margin - 3, currentY, 3, boxHeight, 'F');
      } else {
        doc.rect(margin, currentY, 3, boxHeight, 'F');
      }
      
      doc.setFont('Amiri-Bold', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGreen);
      const actTitleX = isRTL ? pageWidth - margin - 8 : margin + 8;
      doc.text(fixArabicText(t('reports.summary_activities')), actTitleX, currentY + 7, { align });
      
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.text(splitActivities, isRTL ? pageWidth - margin - 8 : margin + 8, currentY + 13, { align });
      
      currentY += boxHeight + 6;
    }
    
    // =============================================
    // Student Data Table
    // =============================================
    const tableHeaders = [
      t('reports.student_number'),
      t('reports.Student_Name'), 
      t('reports.Age'), 
      t('reports.pres.'), 
      t('reports.abs.')
    ].map(h => fixArabicText(h));
    
    const tableData = reportData.report.map((row, idx) => [
      `${idx + 1}`,
      fixArabicText(row.name),
      row.age ? fixArabicText(`${t('reports.Age')}: ${row.age}`) : '—',
      row.attendance.activeDays,
      row.attendance.absentDays
    ]);

    const finalHeaders = isRTL ? [...tableHeaders].reverse() : tableHeaders;
    const finalData = isRTL ? tableData.map(row => [...row].reverse()) : tableData;

    // Define column styles mapping based on visual index
    const getColumnStyles = () => {
      const baseStyles = {
        0: { cellWidth: 15, halign: 'center', textColor: grayText, font: 'Amiri-Bold' },
        1: { cellWidth: 100, halign: align, textColor: darkText, font: 'Amiri-Bold' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center', textColor: [22, 120, 50], font: 'Amiri-Bold' },
        4: { cellWidth: 35, halign: 'center', textColor: [200, 30, 30], font: 'Amiri-Bold' }
      };

      if (!isRTL) return baseStyles;

      const reversedStyles = {};
      const totalCols = tableHeaders.length;
      Object.keys(baseStyles).forEach(idx => {
        const newIdx = totalCols - 1 - parseInt(idx);
        reversedStyles[newIdx] = baseStyles[idx];
      });
      return reversedStyles;
    };

    const theoryTableTotalWidth = 210; // 15+100+25+35+35 = 210

    autoTable(doc, {
      startY: currentY,
      head: [finalHeaders],
      body: finalData,
      theme: 'grid',
      headStyles: { 
        fillColor: darkGreen, 
        textColor: white, 
        fontStyle: 'normal', 
        fontSize: 8, 
        halign: 'center',
        cellPadding: 3,
        font: 'Amiri-Bold'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5, 
        textColor: darkText, 
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        font: 'Amiri-Regular',
        halign: 'center'
      },
      columnStyles: getColumnStyles(),
      alternateRowStyles: { fillColor: [250, 253, 250] },
      margin: { left: (pageWidth - theoryTableTotalWidth) / 2, right: (pageWidth - theoryTableTotalWidth) / 2 },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.2
    });
    
    currentY = doc.lastAutoTable.finalY + 10;
    
    // =============================================
    // Theory Topics Section
    // =============================================
    if (reportData.theory_summary?.topics?.length > 0) {
      if (currentY + 40 > pageHeight - 50) { doc.addPage('l'); currentY = 20; }
      
      doc.setFont('Amiri-Bold', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...darkGreen);
      doc.text(fixArabicText(t('progress.theory.title')), pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;

      const topicsHeaders = [t('student_history.col_date'), t('progress.theory.topic')].map(h => fixArabicText(h));
      const topicsData = reportData.theory_summary.topics.map(topicObj => {
        const dateStr = format(new Date(topicObj.date), 'yyyy-MM-dd');
        return [dateStr, fixArabicText(topicObj.topic)];
      });

      const finalTopicsHeaders = isRTL ? [...topicsHeaders].reverse() : topicsHeaders;
      const finalTopicsData = isRTL ? topicsData.map(r => [...r].reverse()) : topicsData;

      autoTable(doc, {
        startY: currentY,
        head: [finalTopicsHeaders],
        body: finalTopicsData,
        theme: 'grid',
        headStyles: { 
          fillColor: [63, 81, 181], // Indigo / Blue 
          textColor: white, 
          fontStyle: 'normal', 
          fontSize: 8, 
          halign: 'center',
          cellPadding: 3,
          font: 'Amiri-Bold'
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5, 
          textColor: darkText, 
          lineColor: [200, 200, 200],
          lineWidth: 0.2,
          font: 'Amiri-Regular',
          halign: 'center'
        },
        columnStyles: isRTL ? {
          0: { cellWidth: 150, halign: align, font: 'Amiri-Regular' },
          1: { cellWidth: 50, halign: 'center', font: 'Amiri-Bold', textColor: grayText }
        } : {
          0: { cellWidth: 50, halign: 'center', font: 'Amiri-Bold', textColor: grayText },
          1: { cellWidth: 150, halign: align, font: 'Amiri-Regular' }
        },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        margin: { left: (pageWidth - 200) / 2, right: (pageWidth - 200) / 2 },
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // =============================================
    // Achievements & Notes Sections
    // =============================================
    if (achievements || generalNotes) {
      if (currentY + 40 > pageHeight - 50) { doc.addPage('l'); currentY = 20; }
      
      const halfWidth = (contentWidth - 8) / 2;
      
      if (achievements) {
        const achX = isRTL ? margin + halfWidth + 8 : margin;
        const achW = generalNotes ? halfWidth : contentWidth;
        
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(22, 120, 50);
        doc.setLineWidth(0.3);
        
        const fixedAch = fixArabicText(achievements);
        const splitAch = doc.splitTextToSize(fixedAch, achW - 14);
        const achHeight = Math.max((splitAch.length * 5) + 14, 25);
        
        doc.roundedRect(achX, currentY, achW, achHeight, 2, 2, 'FD');
        
        doc.setFont('Amiri-Bold', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(22, 120, 50);
        const achTextX = isRTL ? achX + achW - 6 : achX + 6;
        doc.text(fixArabicText(t('reports.notable_achievements_title')), achTextX, currentY + 7, { align });
        
        doc.setFont('Amiri-Regular', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...darkText);
        doc.text(splitAch, achTextX, currentY + 13, { align });
      }
      
      if (generalNotes) {
        const notesX = isRTL ? margin : (achievements ? margin + halfWidth + 8 : margin);
        const notesW = achievements ? halfWidth : contentWidth;
        
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(29, 78, 216);
        doc.setLineWidth(0.3);
        
        const fixedNotes = fixArabicText(generalNotes);
        const splitNotes = doc.splitTextToSize(fixedNotes, notesW - 14);
        const notesHeight = Math.max((splitNotes.length * 5) + 14, 25);
        
        doc.roundedRect(notesX, currentY, notesW, notesHeight, 2, 2, 'FD');
        
        doc.setFont('Amiri-Bold', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(29, 78, 216);
        const notesTextX = isRTL ? notesX + notesW - 6 : notesX + 6;
        doc.text(fixArabicText(t('reports.general_observations_title')), notesTextX, currentY + 7, { align });
        
        doc.setFont('Amiri-Regular', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...darkText);
        doc.text(splitNotes, notesTextX, currentY + 13, { align });
      }
    }
    
    // =============================================
    // Signature Block (on last page)
    // =============================================
    const sigY = pageHeight - 45;
    const sigWidth = 70;
    
    // Thin separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, sigY - 5, pageWidth - margin, sigY - 5);
    
    // Administrator signature (left / right for RTL)
    const adminSigX = isRTL ? pageWidth - margin - sigWidth : margin;
    doc.setDrawColor(...darkGreen);
    doc.setLineWidth(0.4);
    doc.line(adminSigX, sigY + 10, adminSigX + sigWidth, sigY + 10);
    doc.setFont('Amiri-Bold', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text(fixArabicText(t('reports.signature_label')), adminSigX + sigWidth / 2, sigY + 16, { align: 'center' });
    
    // Teacher signature (right / left for RTL)
    const teacherSigX = isRTL ? margin : pageWidth - margin - sigWidth;
    doc.line(teacherSigX, sigY + 10, teacherSigX + sigWidth, sigY + 10);
    doc.text(fixArabicText(t('reports.teacher_signature')), teacherSigX + sigWidth / 2, sigY + 16, { align: 'center' });
    
    // Stamp area (center)
    const stampX = pageWidth / 2 - 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(stampX, sigY - 2, 40, 20, 10, 10, 'D');
    doc.setFont('Amiri-Regular', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.text(fixArabicText(t('reports.stamp_area')), pageWidth / 2, sigY + 9, { align: 'center' });
    
    // Date under signatures
    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.text(
      fixArabicText(t('reports.generated_on', { date: format(new Date(), 'yyyy-MM-dd') })),
      pageWidth / 2, sigY + 22, { align: 'center' }
    );
    
    // =============================================
    // Footer on every page — branding + page numbers
    // =============================================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Bottom gold line
      doc.setFillColor(...gold);
      doc.rect(0, pageHeight - 8, pageWidth, 1, 'F');
      
      // Footer text
      doc.setFont('Amiri-Regular', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        fixArabicText(t('reports.footer_branding', { page: i, total: totalPages })),
        pageWidth / 2,
        pageHeight - 4,
        { align: 'center' }
      );
    }

    doc.save(t('reports.pdf_filename', { className: reportData.className, period: periodText.replace(' ', '_') }));
  };


  const downloadPDF = () => {
    if (!reportData) return;
    
    const selectedClassObj = classes.find(c => c.id === Number(selectedClass));
    if (selectedClassObj?.type === 'Theory') {
      downloadTheoryPDF();
    } else {
      downloadQuranicPDF();
    }
  };
  
  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">Loading classes...</div>;

  const isSelectedTheory = classes.find(c => c.id === Number(selectedClass))?.type === 'Theory';

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
              <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('reports.title')}</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('reports.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex gap-2">

            <button 
              onClick={downloadPDF}
              disabled={!reportData}
              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl font-bold text-sm border border-primary-100 hover:bg-primary-100 transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-tight shadow-sm shadow-primary-200"
            >
              <Download size={18} /> {t('reports.download_pdf')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.class')}</label>
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
            <label className={`block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.period_type')}</label>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              <button 
                onClick={() => setFilterType('monthly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'monthly' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('reports.monthly')}
              </button>
              <button 
                onClick={() => setFilterType('yearly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'yearly' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('reports.yearly')}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={`block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.year')}</label>
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
                <label className={`block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.month')}</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 py-2.5 text-gray-700"
                >
                  {monthNames.map((m, i) => (
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
              {generating ? t('reports.generating') : t('reports.generate')}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="space-y-6">
          {/* External Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className={`text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <BookOpen size={14} className="text-secondary-500"/> {t('reports.period_activities')}
              </label>
              <textarea 
                value={classActivities}
                onChange={(e) => setClassActivities(e.target.value)}
                placeholder={t('reports.activities_placeholder')}
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-secondary-200 h-24 resize-none"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className={`text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 size={14} className="text-green-500"/> {t('reports.notable_achievements')}
              </label>
              <textarea 
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder={t('reports.achievements_placeholder')}
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-green-100 h-24 resize-none"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
              <label className={`text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText size={14} className="text-primary-500"/> {t('reports.general_observations')}
              </label>
              <textarea 
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder={t('reports.observations_placeholder')}
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary-100 h-24 resize-none"
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
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('reports.report_title')}</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('reports.quality_management')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 w-full max-w-5xl border-t border-gray-200 mt-8 pt-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('reports.class')}</span>
                  <span className="text-sm font-black text-primary-700">
                    {reportData.className}
                    {isSelectedTheory && reportData.theory_summary?.books && <span className="text-gray-500 font-normal"> - {reportData.theory_summary.books}</span>}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('reports.period')}</span>
                  <span className="text-sm font-black text-secondary-700 lowercase first-letter:uppercase">{filterType === 'monthly' ? `${monthNames[selectedMonth]} ${selectedYear}` : selectedYear}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('reports.active_days')}</span>
                  <span className="text-sm font-black text-gray-900">{reportData.classActiveDays || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('common.students')}</span>
                  <span className="text-sm font-black text-gray-900">{t('reports.students_count', { count: reportData.report.length })}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('reports.status')}</span>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-green-600 uppercase">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> {t('reports.official')}
                  </div>
                </div>
              </div>

              {classActivities && (
                <div className={`mt-8 w-full border-secondary-500 py-2 ${isRTL ? 'border-r-4 pr-6 text-right' : 'border-l-4 pl-6 text-left'}`}>
                  <h4 className={`text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <BookOpen size={14}/> {t('reports.summary_activities')}
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
                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100`}>{t('reports.student_name')}</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{t('reports.age')}</th>
                    {!isSelectedTheory && (
                      <>
                        <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-amber-50/30" colSpan="2">{t('reports.hifz_progress')}</th>
                        <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-blue-50/30" colSpan="2">{t('reports.muraja_progress')}</th>
                      </>
                    )}
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{t('reports.pres')}</th>
                    <th className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{t('reports.abs')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.report.map((row) => (
                    <tr key={row.student_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className={`p-4 font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>{row.name}</td>
                      <td className="p-4 text-center text-xs font-black text-gray-400">{row.age || '—'}</td>
                      
                      {!isSelectedTheory && (
                        <>
                          <td className="p-4 text-center text-xs bg-amber-50/10 italic text-gray-500 border-r border-amber-100/30">
                            {row.hifz.start ? `${row.hifz.start.surah_name} (${row.hifz.start.start === row.hifz.start.end ? row.hifz.start.start : `${row.hifz.start.start}-${row.hifz.start.end}`})` : '—'}
                          </td>
                          <td className="p-4 text-center text-xs bg-amber-50/10 font-bold text-amber-700">
                            {row.hifz.end ? `${row.hifz.end.surah_name} (${row.hifz.end.start === row.hifz.end.end ? row.hifz.end.start : `${row.hifz.end.start}-${row.hifz.end.end}`})` : '—'}
                          </td>
                          
                          <td className="p-4 text-center text-xs bg-blue-50/10 italic text-gray-500 border-r border-blue-100/30">
                            {row.muraja.start ? `${row.muraja.start.surah_name} (${row.muraja.start.start === row.muraja.start.end ? row.muraja.start.start : `${row.muraja.start.start}-${row.muraja.start.end}`})` : '—'}
                          </td>
                          <td className="p-4 text-center text-xs bg-blue-50/10 font-bold text-blue-700">
                            {row.muraja.end ? `${row.muraja.end.surah_name} (${row.muraja.end.start === row.muraja.end.end ? row.muraja.end.start : `${row.muraja.end.start}-${row.muraja.end.end}`})` : '—'}
                          </td>
                        </>
                      )}
                      
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

            {/* Theory Topics History Rendering */}
            {isSelectedTheory && reportData.theory_summary?.topics?.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-white">
                <h3 className={`text-lg font-black text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <BookOpen size={20} className="text-primary-600"/> {t('progress.theory.title')}
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('student_history.col_date')}</th>
                        <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('progress.theory.topic')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportData.theory_summary.topics.map((topic, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className={`p-3 font-bold text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {format(new Date(topic.date), 'dd MMMM yyyy')}
                          </td>
                          <td className={`p-3 text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {topic.topic}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Global Sections (Bottom) */}
            {(achievements || generalNotes) && (
              <div className="p-10 border-t border-gray-100 space-y-8 bg-gray-50/30">
                {achievements && (
                  <div>
                    <h3 className={`text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                       <GraduationCap size={16}/> {t('reports.notable_achievements_title')}
                    </h3>
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${isRTL ? 'border-r-4 border-r-green-500 text-right' : 'border-l-4 border-l-green-500 text-left'}`}>
                      <p className="text-sm font-bold text-gray-700 whitespace-pre-wrap">{achievements}</p>
                    </div>
                  </div>
                )}
                {generalNotes && (
                  <div>
                    <h3 className={`text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                       <FileText size={16}/> {t('reports.general_observations_title')}
                    </h3>
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${isRTL ? 'border-r-4 border-r-primary-500 text-right' : 'border-l-4 border-l-primary-500 text-left'}`}>
                      <p className="text-sm font-bold text-gray-700 whitespace-pre-wrap">{generalNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teacher Note Input Area */}
            <div className="p-10 bg-white border-t border-gray-100 print:hidden">
              <label className={`text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText size={14} className="text-primary-500"/> {t('reports.general_observations')}
              </label>
              <textarea 
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder={t('reports.observations_placeholder')}
                className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary-100 h-24 resize-none"
              />
            </div>

            {/* Footer */}
            <div className={`p-8 border-t border-gray-100 flex justify-between items-end ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex flex-col gap-4 ${isRTL ? 'items-end' : 'items-start'}`}>
                <div className="w-40 h-px bg-gray-200" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('reports.signature_label')}</span>
              </div>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('reports.authorized_cert')}</p>
                <p className="text-[8px] text-gray-300">{t('reports.generated_on', { date: format(new Date(), 'EEEE, MMMM dd, yyyy') })}</p>
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
