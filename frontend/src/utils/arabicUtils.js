import arabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Fixes Arabic and mixed Arabic/English text for jsPDF.
 * 1. Reshapes Arabic characters to handling initial/medial/final/isolated forms.
 * 2. Uses the Unicode Bidirectional Algorithm (bidi-js) to reorder the text
 *    into a visual string that jsPDF (which renders LTR) can display correctly.
 * 
 * This follows the "filtering" rule: English stays logical, Arabic is reordered.
 */
export const fixArabicText = (text) => {
  if (text === null || text === undefined || text === '') return '';

  const str = String(text);
  
  // If there's no Arabic or special presentation forms at all, return as-is
  // (Faster than running the full bidi algorithm for pure English/Numbers)
  if (!/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str)) {
    return str;
  }

  try {
    // Stage 1: Reshape Arabic
    // This connects letters (e.g. ب + ا -> با)
    const reshaped = arabicReshaper.convertArabic(str);

    // Stage 2: BiDi Reordering
    // This reorders the string segments (e.g. "Eng ARB" -> "BRA Eng") 
    // so it looks correct in jsPDF's LTR rendering engine.
    // 'rtl' is used as the base direction if the text contains Arabic.
    return bidi.getReorderedString(reshaped);
  } catch (error) {
    console.warn('Arabic text processing failed:', error);
    return str;
  }
};
