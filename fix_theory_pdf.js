const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/Reports.jsx', 'utf8');

const tStart = code.indexOf('const downloadTheoryPDF = () => {');
if (tStart === -1) process.exit(1);

const tEnd = code.indexOf('  const downloadPDF = () => {', tStart);
let theorySection = code.substring(tStart, tEnd);

// 1. Fix Table Headers
theorySection = theorySection.replace(
`    const tableHeaders = [
      t('reports.student_number'),
      t('reports.Student_Name'), 
      t('reports.Age'), 
      t('reports.Hifz_Start'), 
      t('reports.Hifz_End'), 
      t('reports.Muraja_Start'), 
      t('reports.Muraja_End'), 
      t('reports.pres.'), 
      t('reports.abs.')
    ]`,
`    const tableHeaders = [
      t('reports.student_number'),
      t('reports.Student_Name'), 
      t('reports.Age'), 
      t('reports.pres.'), 
      t('reports.abs.')
    ]`);

// 2. Fix Table Data
theorySection = theorySection.replace(
`    const tableData = reportData.report.map((row, idx) => [
      \`\${idx + 1}\`,
      fixArabicText(row.name),
      row.age ? fixArabicText(\`\${t('reports.Age')}: \${row.age}\`) : '—',
      row.hifz.start ? fixArabicText(\`\${t('reports.surah')} \${row.hifz.start.surah_name} \${t('reports.verse')} \${row.hifz.start.verse}\`) : '—',
      row.hifz.end ? fixArabicText(\`\${t('reports.surah')} \${row.hifz.end.surah_name} \${t('reports.verse')} \${row.hifz.end.verse}\`) : '—',
      row.muraja.start ? fixArabicText(\`\${t('reports.surah')} \${row.muraja.start.surah_name} \${t('reports.verse')} \${row.muraja.start.verse}\`) : '—',
      row.muraja.end ? fixArabicText(\`\${t('reports.surah')} \${row.muraja.end.surah_name} \${t('reports.verse')} \${row.muraja.end.verse}\`) : '—',
      row.attendance.activeDays,
      row.attendance.absentDays
    ]);`,
`    const tableData = reportData.report.map((row, idx) => [
      \`\${idx + 1}\`,
      fixArabicText(row.name),
      row.age ? fixArabicText(\`\${t('reports.Age')}: \${row.age}\`) : '—',
      row.attendance.activeDays,
      row.attendance.absentDays
    ]);`);

// 3. Fix Column Styles
theorySection = theorySection.replace(
`    // Define column styles mapping based on visual index
    const getColumnStyles = () => {
      const baseStyles = {
        0: { cellWidth: 10, halign: 'center', textColor: grayText, font: 'Amiri-Bold' },
        1: { cellWidth: 45, halign: align, textColor: darkText, font: 'Amiri-Bold' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 32 },
        4: { cellWidth: 32, font: 'Amiri-Bold', textColor: darkGreen },
        5: { cellWidth: 32 },
        6: { cellWidth: 32, font: 'Amiri-Bold', textColor: [29, 78, 216] },
        7: { cellWidth: 14, halign: 'center', textColor: [22, 120, 50], font: 'Amiri-Bold' },
        8: { cellWidth: 14, halign: 'center', textColor: [200, 30, 30], font: 'Amiri-Bold' }
      };`,
`    // Define column styles mapping based on visual index
    const getColumnStyles = () => {
      const baseStyles = {
        0: { cellWidth: 10, halign: 'center', textColor: grayText, font: 'Amiri-Bold' },
        1: { cellWidth: 60, halign: align, textColor: darkText, font: 'Amiri-Bold' }, // More space for Name
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 20, halign: 'center', textColor: [22, 120, 50], font: 'Amiri-Bold' }, // Pres
        4: { cellWidth: 20, halign: 'center', textColor: [200, 30, 30], font: 'Amiri-Bold' }  // Abs
      };`);

// 4. Update width and add theory topics section
theorySection = theorySection.replace(
`      // Table Width = 10 + 45 + 12 + (32*4) + (14*2) = 223mm
      // Centering logic: margin = (pageWidth - tableWidth) / 2
      margin: { left: (pageWidth - 223) / 2, right: (pageWidth - 223) / 2 },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.2
    });
    
    currentY = doc.lastAutoTable.finalY + 10;
    
    // =============================================
    // Achievements & Notes Sections
    // =============================================`,
`      margin: { left: (pageWidth - 126) / 2, right: (pageWidth - 126) / 2 },
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
          0: { cellWidth: 100, halign: align, font: 'Amiri-Regular' },
          1: { cellWidth: 40, halign: 'center', font: 'Amiri-Bold', textColor: grayText }
        } : {
          0: { cellWidth: 40, halign: 'center', font: 'Amiri-Bold', textColor: grayText },
          1: { cellWidth: 100, halign: align, font: 'Amiri-Regular' }
        },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        margin: { left: (pageWidth - 140) / 2, right: (pageWidth - 140) / 2 },
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // =============================================
    // Achievements & Notes Sections
    // =============================================`);

code = code.substring(0, tStart) + theorySection + code.substring(tEnd);
fs.writeFileSync('frontend/src/pages/admin/Reports.jsx', code);
console.log('SUCCESS');
