# CVIRMS Development Log

## Day 1 - October 12, 2026
**Backend:** Initialized Node.js/Express setup.
**Frontend:** Initialized Next.js + Tailwind with CVIRMS colors.
**Integration:** Git initialized, .gitignore created, ready to push.

## Day 2 - October 12, 2026
**Backend:** Connected PostgreSQL. Created users, guests, employees, foreigners, notices tables. Added /api/db-test route.
**Frontend:** Built Navbar with ticker bar, and Hero Section with stats bar + floating bot, matching the CVIRMS Master Design Template. Configured PostCSS + Tailwind CSS v3 and constrained all SVG icons.
**Integration:** DB connection verified via /api/db-test. Landing page styling and port 3001 verified.
## Day 3 - October 12, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard.
**Backend:** OTP-based auth API (register, send-otp, verify-otp, /me). Users table updated. OTP MOCKED — TODO: integrate Fast2SMS.
**Frontend:** 2-step glassmorphism Login page (Phone → OTP + CAPTCHA). ProtectedRoute wrapper.
**Integration:** Full flow tested: Phone → OTP → Dashboard. Test user registered via curl.

## Performance Optimization - October 13, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard, agystack.
**Database Indexing:** Installed database-optimizer skill, Dexter, HypoPG. Created 15 indexes on users, guests, employees, foreigners, notices. Verified Index Scan on queries.
**Caching:** Installed cache-minimal + Redis client. Added cache middleware with TTL 30-120s. Applied to dashboard endpoints.
**Load Testing:** Installed k6. Created load-test.js with 3 scenarios. Smoke test passed with p95 < 500ms.
**Monitoring:** Added morgan logging + X-Response-Time header.

## Logo Integration - October 13, 2026
**Frontend:** Replaced all placeholder logos with official CVIRMS logo. Set favicon in layout.tsx metadata. Verified rendering on login page and sidebar.

## Day 4 - October 13, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard, agystack, /boost.
**Backend:** Built /api/dashboard/stats, /api/dashboard/recent-visitors, /api/dashboard/activity (protected by verifyToken). Realistic mock activity data with Indian names.
**Frontend:** Built Sidebar (with CVIRMS logo), Topbar, DashboardLayout. Bento Grid with 7 cards. Expandable Recent Visitor Logs table with styled empty state.
**Integration:** Dashboard loads with user from localStorage. Route protection confirmed. Charts animate. Rows expand/collapse.

## Day 5 - October 13, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard, agystack, /boost.
**Backend:** Verified /api/guests endpoints (POST, GET, GET/:id, PUT, DELETE) with verifyToken + ownership checks + validation.
**Frontend:** Add Tenant form completed. Visitor List page with search, expandable rows, and empty state. Coming Soon placeholder created. Sidebar navigation wired up. Avatar bug fixed (shows "D").
**Integration:** Full flow tested: Login → Add Tenant → DB insert → Stats update → Appears in Visitor List → Search works → Row expansion works. No more 404s on built pages. Coming Soon page for unbuilt routes.

## Sidebar Polish - October 13, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard, agystack, /boost.
**Frontend:** Enhanced Sidebar with animated brand header, nav item micro-interactions (slide + icon scale + animated active border), dashed section dividers, compliance mini-widget (85% ring), user profile footer with dropdown (Profile/Settings/Help/Logout), and subtle radial gradient background. Mobile responsive with hamburger toggle.
**Integration:** Verified all animations, dropdown interactions, and mobile behavior. No console errors.

## Day 6 - October 14, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard, agystack, Native /boost.
**Global Rename (Tenant → Customer):** 
- Replaced all UI occurrences of "Tenant" with "Customer" across headings, buttons, sidebar items, and routes.
- Renamed folder `app/dashboard/add-tenant/` to `app/dashboard/add-customer/`.
- Updated all links and route definitions to `/dashboard/add-customer`.
- Verified strict gate: 0 matches for "tenant" in frontend source files.
**QR Scanning & Identity Parsing:**
- Installed `jsqr` (v1.4.0) in `cvirms-frontend`.
- Built `components/AadhaarScanner.tsx` using FileReader, hidden HTML5 canvas rendering, jsQR engine, and DOMParser/XML attribute extraction for `<PrintLetterBarcodeData>`.
- Extracted 8 client-side fields: firstName, middleName, lastName, dob, gender, address, pincode, and masked Aadhaar number (`XXXX-XXXX-XXXX`). No server/API leakage.
**Forms & UI Updates:**
- **Add Customer Form:** Integrated Quick Fill toggle (`[Upload Aadhaar]` | `[Enter Manually]`), auto-filling 6 personal & identity fields while keeping phone number strictly manual. Replaced dropdown with fixed "Aadhaar Card" badge.
- **Add Employee Form:** Added Quick Fill AadhaarScanner integration, 4 clear sections (Quick Fill, Personal Details, Document Verification, Employment Details), mock FileReader previews for document/photo, and gradient CTA.
- **Employee List Page:** Fully wired table with avatar initials, pincode, contact, gender, document ID, joining date, status badge, search filter, and expandable drawer with full address, alternate contact, and photo details.
**Backend & Verification:**
- `/api/employees` endpoints (POST, GET, GET/:id, PUT, DELETE) verified with `verifyToken` middleware, ownership protection, and input validations (10-digit phone, 6-digit pincode).
- Tested and verified curl POST returning HTTP 201 Created.
- Re-verified full end-to-end integration across all 7 test cases.
- Foreigner form deferred to future milestone as specified.

## OTP + Captcha Upgrade - October 14, 2026
**Plugins Used:** Ponytail, Loop Library, Gravitas, Awesome Skills, Taskboard, agystack, Native /boost.
**Database Migration:**
- Added `otp_attempts` (INT DEFAULT 0) and `captcha_sessions` (JSONB DEFAULT '[]'::jsonb) to `users` table via `cvirms-backend/database/add-auth-upgrade-columns.js`.
**Backend Security & Architecture:**
- Installed `svg-captcha` (v1.4.0) and `express-rate-limit` (v8.7.1).
- Implemented `GET /api/auth/captcha` returning an alphanumeric SVG challenge (5-6 characters, A-Z a-z 0-9, no arithmetic symbols, case-insensitive).
- Integrated `sendOtpLimiter` and `verifyOtpLimiter` to protect against credential stuffing and brute-force attacks.
- Enhanced `sendSmsOTP()` utility with isolated interface and clear TODO for Fast2SMS swap.
- Implemented atomic verification in PostgreSQL: `UPDATE users SET is_verified = TRUE, otp_code = NULL ... WHERE id = $1 AND otp_code = $2 AND otp_expires_at > NOW()` ensuring zero replay and zero race condition under concurrency.
- Implemented brute-force lockout: tracks `otp_attempts` and clears `otp_code` after 5 failed attempts (HTTP 429).
- Enforced strict OTP expiry rejection across all environments.
**Frontend Glassmorphism UI:**
- Redesigned `app/login/page.tsx` into a single-card layout showing phone/user_id input, alphanumeric SVG captcha challenge, captcha answer input, and "Send OTP" button all on the first screen.
- Configured inline OTP reveal on the same glassmorphism card upon successful OTP dispatch, with 6 JetBrains Mono input boxes, auto-advance, backspace navigation, paste support, and 30s countdown timer.
- Removed legacy emojis; strictly compliant with Lucide SVG icons and CVIRMS Master Design Template.
- Persists tokens to `localStorage.cvirms_token` and `localStorage.cvirms_user`.
**Verification:**
- Verified all 8 security gates in `scratch/verify-otp-captcha-upgrade.js` with exit code 0.

## Aadhaar Extraction Fixes - October 14, 2026
**Fixed:**
1. Name extraction: Smart line-scanning finds name above DOB line, filters out Government/India labels. Now populates firstName/middleName/lastName.
2. Address cleaning: cleanAddress() filters Kannada/garbage lines by English-ratio (0.75+) scoring, removes pipe/special chars, extracts pincode separately.
3. Aadhaar number: Masking removed. Now shows full 12 digits formatted as "9876 5432 7101".
**Verified:** Auto-fill works in both Add Customer and Add Employee forms. Phone stays manual.

## Aadhaar QR-Based Extraction - October 14, 2026
**Root Cause:** OCR (Tesseract.js) failed on bilingual (Kannada + English) Aadhaar cards — Kannada text was misread as garbage English.
**Fix:** Switched to QR-code-first approach. The QR on the back of Aadhaar contains structured XML with 100% accurate English data (name, DOB, gender, address, pincode). Decodes client-side using jsQR — no API, no cost.
**Also Fixed:** Duplicate success banner now shows only once.

## Aadhaar OCR — Kannada Filter Fix - October 14, 2026
**Change:** Loaded Tesseract with 'eng+kan' (both languages). Now Kannada text outputs as Kannada Unicode, which we filter out, leaving clean English lines. Added image preprocessing (grayscale + contrast + binarization + upscale) for better accuracy. Address now assembled from English-only lines.

## Aadhaar Server-Side OCR via docscanr - October 14, 2026
**Change:** Replaced client-side OCR with server-side `docscanr` and `multer` memory storage in Node.js backend (`POST /api/ocr/extract`).
- Node.js backend uses `OCRToolkit` and `AadhaarParser` from `docscanr` to parse Indian documents.
- Automatically handles image preprocessing, name extraction, date of birth, gender, full 12-digit Aadhaar UID, address, and pincode.
- Frontend `AadhaarScanner.tsx` uploads document images via `FormData` to the Node.js backend and populates form fields with clean JSON.
- Phone number remains manual/empty for guest verification. Single success banner rendered.

*(We will update this file at the end of every day).*

## Customer Aadhaar OCR & Manual Mode - October 14, 2026
**Scope:** Customer module ONLY (`add-customer/page.tsx`). Employee and Foreigner modules remain pure manual entry.
**Features:**
1. **Mode Switcher:** Segmented control at top of Customer page allowing instant switching between "Aadhaar OCR" and "Manual Entry".
2. **Dual-Side Upload:** Front side (Identity, Name, DOB, Aadhaar UID) and Back side (Address, Pincode) with real-time thumbnail previews and remove actions.
3. **Automated Extraction:** Backend endpoint (`POST /api/ocr/extract`) processes images using `docscanr` with bilingual Kannada/Devanagari text filtering, line-above-DOB name detection, and fallback extraction.
4. **Phone Field Exemption:** Contact Number (Phone) strictly remains blank/manual for verification.
5. **Aadhaar Format:** Aadhaar number automatically formatted into 12 digits (`XXXX XXXX XXXX`) with client-side Luhn-like validation.

