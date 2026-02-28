const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/admin/Reports.jsx', 'utf8');

const oldFuncStart = content.indexOf('const downloadPDF = () => {');
const funcEndString = "doc.save(t('reports.pdf_filename', { className: reportData.className, period: periodText.replace(' ', '_') }));\n  };";
const oldFuncEnd = content.indexOf(funcEndString, oldFuncStart) + funcEndString.length;

const originalFunc = content.slice(oldFuncStart, oldFuncEnd);

// Theory branch
let theoryFunc = originalFunc.replace('const downloadPDF = () => {', 'const downloadTheoryPDF = () => {');
theoryFunc = theoryFunc.replace(/const isTheory = [^;]+;/, 'const isTheory = true;');

// Remove quranic columns
theoryFunc = theoryFunc.replace(/!isTheory \? t\('reports\.Hifz_Start'\) : null,[\s\S]*?!isTheory \? t\('reports\.Muraja_End'\) : null,/, '');
theoryFunc = theoryFunc.replace(/let dynamicColumns = \[\];[\s\S]*?if \(!isTheory\) \{[\s\S]*?dynamicColumns = \[[\s\S]*?\];[\s\S]*?\}/, 'let dynamicColumns = [];');
theoryFunc = theoryFunc.replace(/if \(isTheory\) \{[\s\S]*?baseStyles = \{[\s\S]*?\} else \{[\s\S]*?baseStyles = \{[\s\S]*?\}[\s\S]*?\}/, `baseStyles = {
          0: { cellWidth: 10, halign: 'center', textColor: grayText, font: 'Amiri-Bold' },
          1: { cellWidth: 60, halign: align, textColor: darkText, font: 'Amiri-Bold' }, 
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 20, halign: 'center', textColor: [22, 120, 50], font: 'Amiri-Bold' }, 
          4: { cellWidth: 20, halign: 'center', textColor: [200, 30, 30], font: 'Amiri-Bold' }  
        };`);
theoryFunc = theoryFunc.replace(/const tableWidth = isTheory \? 126 : 223;/, 'const tableWidth = 126;');

// Quranic branch
let quranicFunc = originalFunc.replace('const downloadPDF = () => {', 'const downloadQuranicPDF = () => {');
quranicFunc = quranicFunc.replace(/const isTheory = [^;]+;/, 'const isTheory = false;');

quranicFunc = quranicFunc.replace(/isTheory && reportData\.theory_summary\?\.books \? ` - \$\{reportData\.theory_summary\.books\}` : ''/g, "''");
quranicFunc = quranicFunc.replace(/if \(isTheory && reportData\.theory_summary\?\.topics\?\.length > 0\) \{[\s\S]*?currentY = doc\.lastAutoTable\.finalY \+ 10;[\s\S]*?\}/, '');

quranicFunc = quranicFunc.replace(/if \(isTheory\) \{[\s\S]*?baseStyles = \{[\s\S]*?\} else \{/, '');
quranicFunc = quranicFunc.replace(/\};\n        \}/, '};');

quranicFunc = quranicFunc.replace(/const tableWidth = isTheory \? 126 : 223;/, 'const tableWidth = 223;');
        
const dispatcher = `
  const downloadPDF = () => {
    if (!reportData) return;
    if (isSelectedTheory) {
      downloadTheoryPDF();
    } else {
      downloadQuranicPDF();
    }
  };
`;

const newCode = theoryFunc + '\n\n' + quranicFunc + '\n\n' + dispatcher;

content = content.slice(0, oldFuncStart) + newCode + content.slice(oldFuncEnd);

fs.writeFileSync('frontend/src/pages/admin/Reports.jsx', content);
console.log('Successfully split PDF generation logic.');
