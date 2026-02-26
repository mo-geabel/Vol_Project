import arabicReshaper from 'arabic-reshaper';
import bidiJs from 'bidi-js';

const bidi = bidiJs();

// Check if text contains Arabic characters
const hasArabic = (text) =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

/**
 * Fixes Arabic text by reshaping it and applying Bidi reordering.
 * @param {string|number} text - The input text (could be mixed Arabic/English).
 * @returns {string} - The processed text ready for jsPDF.
 */
export const fixArabicText = (text) => {
  if (text === null || text === undefined || text === '') return '';

  // Ensure we work with a string
  const str = String(text);

  // Skip processing for non-Arabic text (numbers, pure English, etc.)
  if (!hasArabic(str)) return str;

  try {
    // 1. Reshape Arabic characters (joining them correctly)
    const reshapedText = arabicReshaper.convertArabic(str);

    // 2. Reorder for visual display using bidi algorithm
    // Use 'auto' direction so mixed Arabic/English text is handled correctly
    // (English segments stay LTR, Arabic segments get reordered for visual display)
    const embeddingLevels = bidi.getEmbeddingLevels(reshapedText);
    const reorderedText = bidi.getReorderedString(reshapedText, embeddingLevels);

    return reorderedText;
  } catch (error) {
    console.warn('Arabic text processing failed, returning original text:', error);
    return str;
  }
};
