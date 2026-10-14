const express = require('express');
const multer = require('multer');
const { OCRToolkit } = require('docscanr');

const router = express.Router();

// Configure Multer for in-memory storage (max 15MB per file)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed'), false);
    }
  },
});

// Initialize docscanr OCRToolkit
const toolkit = new OCRToolkit();
const aadhaarParser = toolkit.getParser('aadhaar');

/**
 * Helper to split full name into firstName, middleName, lastName
 */
function splitFullName(rawName) {
  if (!rawName) return { firstName: '', middleName: '', lastName: '' };
  const parts = rawName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '' };
  } else if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  } else if (parts.length === 3) {
    return { firstName: parts[0], middleName: parts[1], lastName: parts[2] };
  } else {
    return {
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  }
}

/**
 * Helper to extract unmasked 12-digit Aadhaar UID from raw OCR text
 */
function extractFullAadhaarNumber(ocrText) {
  if (!ocrText) return '';
  const match = ocrText.match(/\b([2-9]\d{3}\s?\d{4}\s?\d{4})\b/);
  if (match) {
    const digits = match[1].replace(/\s/g, '');
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  // Try finding continuous 12-digit sequence
  const digitsOnly = ocrText.replace(/\D/g, '');
  const seqMatch = digitsOnly.match(/([2-9]\d{11})/);
  if (seqMatch) {
    const d = seqMatch[1];
    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
  }
  return '';
}

const STOP_WORDS = [
  'government of india',
  'unique identification',
  'authority of india',
  'enrollment',
  'help@uidai.gov.in',
  'www.uidai.gov.in',
  'mera aadhaar',
  'meri pehchan',
  'my aadhaar',
  'republic of india',
  'sarkar',
  'bharat',
  'vid',
  'aadhaar',
  'uidai',
  'signature valid',
  'digitally signed',
  'choose file',
  'browse',
  'upload',
  'help',
  'female',
  'male',
  'gender',
  'dob',
  'date of birth',
  'year of birth',
  'yob',
  'address',
  'personal details',
  'first name',
  'middle name',
  'last name',
  'contact number',
  'number of guests',
  'pincode',
  'stay details',
  'id verification',
];

/**
 * Filter Kannada/Devanagari scripts and clean OCR address
 */
function cleanAddress(rawAddress) {
  if (!rawAddress) return '';
  return rawAddress
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      const lower = l.toLowerCase();
      if (STOP_WORDS.some((sw) => lower === sw || lower.startsWith(sw))) return false;
      // Filter out lines that don't have enough Latin/digit characters
      const cleanLatin = l.replace(/[^a-zA-Z0-9\s,.-/#]/g, '').trim();
      return cleanLatin.length >= 2;
    })
    .map((l) => l.replace(/[\u0900-\u0D7F]/g, '').replace(/[|\\_~]/g, '').trim())
    .filter(Boolean)
    .join(', ')
    .replace(/^address[:,]?\s*/i, '')
    .replace(/,\s*,+/g, ', ')
    .replace(/^,\s*/, '')
    .trim();
}

/**
 * Extract fallback name if docscanr parser missed it or hit a stopword
 */
function extractFallbackName(text) {
  if (!text) return '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Strategy 1: Find line immediately above DOB
  const dobIndex = lines.findIndex((l) =>
    /(?:DOB|Date of Birth|Birth|जन्म|\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b)/i.test(l)
  );
  if (dobIndex > 0) {
    for (let i = dobIndex - 1; i >= 0; i--) {
      const candidate = lines[i].replace(/[^a-zA-Z\s]/g, '').trim();
      const lower = candidate.toLowerCase();
      if (
        candidate.length >= 3 &&
        !STOP_WORDS.some((sw) => lower.includes(sw)) &&
        candidate.split(/\s+/).length <= 4
      ) {
        return candidate;
      }
    }
  }

  // Strategy 2: Look for 2-3 capitalized words
  for (const line of lines) {
    const candidate = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const lower = candidate.toLowerCase();
    if (candidate.length >= 4 && !STOP_WORDS.some((sw) => lower.includes(sw))) {
      const words = candidate.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        words.every((w) => /^[A-Z][a-zA-Z]+$/.test(w))
      ) {
        return candidate;
      }
    }
  }

  return '';
}

/**
 * Extract fallback address from combined text if parser address is missing
 */
function extractFallbackAddress(text) {
  if (!text) return '';
  const match = text.match(/(?:Address|पता)[\s:]*([\s\S]+?)(?=\b\d{6}\b|$)/i);
  if (match) {
    return cleanAddress(match[1]);
  }
  return '';
}

/**
 * POST /api/ocr/extract
 * Accepts single file ('file' or 'image') or dual files ('front' and 'back')
 */
router.post('/extract', upload.any(), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Please upload at least one Aadhaar image.',
      });
    }

    // Separate front, back, or generic single file
    const frontFile = files.find((f) => f.fieldname === 'front') || files[0];
    const backFile = files.find((f) => f.fieldname === 'back');

    let frontText = '';
    let backText = '';
    let combinedText = '';
    let parsedFront = null;
    let parsedBack = null;

    // Process Front image
    if (frontFile && frontFile.buffer) {
      try {
        const ocrFront = await toolkit.extractText(frontFile.buffer, { preprocess: true });
        frontText = ocrFront.text || '';
        combinedText += `\n${frontText}`;
        parsedFront = aadhaarParser.parse(frontText);
      } catch (err) {
        console.warn('Front OCR extraction warning:', err.message);
      }
    }

    // Process Back image if provided
    if (backFile && backFile.buffer) {
      try {
        const ocrBack = await toolkit.extractText(backFile.buffer, { preprocess: true });
        backText = ocrBack.text || '';
        combinedText += `\n${backText}`;
        parsedBack = aadhaarParser.parse(backText);
      } catch (err) {
        console.warn('Back OCR extraction warning:', err.message);
      }
    }

    // Combine extracted fields
    const frontFields = parsedFront?.fields || {};
    const backFields = parsedBack?.fields || {};

    // 1. Name
    let rawName = frontFields.name?.value || backFields.name?.value || '';
    if (!rawName || STOP_WORDS.some((sw) => rawName.toLowerCase().includes(sw))) {
      rawName = extractFallbackName(frontText) || extractFallbackName(combinedText);
    }
    const { firstName, middleName, lastName } = splitFullName(rawName);

    // 2. Date of Birth
    const dob = frontFields.dateOfBirth?.value || backFields.dateOfBirth?.value || '';

    // 3. Gender
    let gender = frontFields.gender?.value || backFields.gender?.value || '';
    if (!gender) {
      if (/female/i.test(combinedText)) gender = 'Female';
      else if (/transgender/i.test(combinedText)) gender = 'Other';
      else if (/male/i.test(combinedText)) gender = 'Male';
      else gender = 'Male';
    }

    // 4. Aadhaar Number (Full unmasked 12 digits prioritized)
    let aadhaarNumber = extractFullAadhaarNumber(combinedText);
    if (!aadhaarNumber) {
      aadhaarNumber = frontFields.aadhaarNumber?.value || backFields.aadhaarNumber?.value || '';
    }

    // 5. Address (Cleaned of Kannada/Devanagari scripts)
    let rawAddress = backFields.address?.value || frontFields.address?.value || '';
    let address = cleanAddress(rawAddress);
    if (!address) {
      address = extractFallbackAddress(backText) || extractFallbackAddress(combinedText);
    }

    // 6. Pincode
    let pincode = backFields.pinCode?.value || frontFields.pinCode?.value || '';
    if (!pincode) {
      const pinMatch = combinedText.match(/\b([1-9]\d{5})\b/);
      if (pinMatch) pincode = pinMatch[1];
    }

    const extractedData = {
      name: rawName,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      aadhaarNumber,
      address,
      pincode,
    };

    console.log('[DOCSCANR EXTRACTED DATA]:', {
      ...extractedData,
      aadhaarNumber: aadhaarNumber ? `XXXX XXXX ${aadhaarNumber.slice(-4)}` : '',
    });

    return res.status(200).json({
      success: true,
      message: 'Aadhaar data extracted successfully via docscanr',
      data: extractedData,
    });
  } catch (error) {
    console.error('Error during OCR processing:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process document image with OCR',
    });
  }
});

module.exports = router;

