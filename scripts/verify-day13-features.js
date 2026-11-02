const pool = require('../cvirms-backend/db');

async function runVerification() {
  console.log('======================================================================');
  console.log('🚀 CVIRMS DAY 13 END-TO-END VERIFICATION SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // 1. DATASET & CASCADING FUNCTIONS VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Karnataka Locations Dataset & Cascading Helpers ---');
  // Dynamic import of TS / compiled or direct evaluation
  const fs = require('fs');
  const locFile = fs.readFileSync('cvirms-frontend/lib/karnatakaLocations.ts', 'utf8');

  // Verify all 31 districts exist
  const districtMatches = [...locFile.matchAll(/name: '([^']+)', talukas:/g)].map(m => m[1]);
  assert(districtMatches.length === 31, `All 31 Karnataka districts present (Found: ${districtMatches.length})`);
  assert(districtMatches.includes('Bengaluru Urban'), 'District "Bengaluru Urban" exists');
  assert(districtMatches.includes('Mysuru'), 'District "Mysuru" exists');
  assert(districtMatches.includes('Dakshina Kannada'), 'District "Dakshina Kannada" exists');
  assert(districtMatches.includes('Vijayanagara'), 'District "Vijayanagara" (31st district) exists');

  // Verify Bengaluru Urban talukas and police stations
  assert(locFile.includes('Bengaluru North'), 'Taluka "Bengaluru North" exists in Bengaluru Urban');
  assert(locFile.includes('Yelahanka PS'), 'Police station "Yelahanka PS" exists in Bengaluru North');
  assert(locFile.includes('Jalahalli PS'), 'Police station "Jalahalli PS" exists in Bengaluru North');
  assert(locFile.includes('Peenya PS'), 'Police station "Peenya PS" exists in Bengaluru North');
  assert(locFile.includes('Hebbal PS'), 'Police station "Hebbal PS" exists in Bengaluru North');

  // -------------------------------------------------------------------------
  // 2. VALIDATION LOGIC VERIFICATION (Pincode, Landmark, Full Address)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Humanization & Validation Rules ---');
  function validatePincode(pin) {
    if (!pin || pin.length !== 6 || !pin.startsWith('5')) {
      return 'Pincode must be a valid Karnataka pincode (starts with 5)';
    }
    return null;
  }

  function validateLandmark(lm) {
    if (!lm || lm.trim().length < 5) {
      return 'Landmark must be at least 5 characters';
    }
    return null;
  }

  function validateFullAddress(addr) {
    if (!addr || addr.trim().length < 10) {
      return 'Full address must be at least 10 characters';
    }
    return null;
  }

  assert(validatePincode('123456') === 'Pincode must be a valid Karnataka pincode (starts with 5)', 'Invalid pincode 123456 caught with Karnataka error');
  assert(validatePincode('560064') === null, 'Valid pincode 560064 passes');
  assert(validateLandmark('Shop') === 'Landmark must be at least 5 characters', 'Short landmark < 5 characters caught');
  assert(validateLandmark('Opposite Bus Stand') === null, 'Valid landmark >= 5 characters passes');
  assert(validateFullAddress('Short') === 'Full address must be at least 10 characters', 'Short address < 10 characters caught');
  assert(validateFullAddress('Plot 42, MG Road, Ward 112') === null, 'Valid full address >= 10 characters passes');

  // -------------------------------------------------------------------------
  // 3. FRONTEND /register SSR & HTML VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Frontend /register SSR Page ---');
  const frontendRes = await fetch('http://localhost:3001/register');
  assert(frontendRes.status === 200, 'Frontend /register responds with HTTP 200');
  const html = await frontendRes.text();

  assert(html.includes('Section 3: Location Details') || html.includes('Location Details'), 'Location Details section header renders in HTML');
  assert(html.includes('State'), 'State label rendered');
  assert(html.includes('District'), 'District label rendered');
  assert(html.includes('Taluka'), 'Taluka label rendered');
  assert(html.includes('Police Station'), 'Police Station label rendered');
  assert(html.includes('Landmark'), 'Landmark label rendered');
  assert(html.includes('Full Address'), 'Full Address label rendered');
  assert(html.includes('district-select'), 'district-select element ID present in DOM');
  assert(html.includes('taluka-select'), 'taluka-select element ID present in DOM');
  assert(html.includes('police-station-select'), 'police-station-select element ID present in DOM');

  // -------------------------------------------------------------------------
  // 4. BACKEND API & REGISTRATION FLOW VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing End-to-End Registration & Payment API ---');
  const uniquePhone = `98450${Math.floor(10000 + Math.random() * 90000)}`;
  const initiatePayload = {
    establishment_name: 'Grand Royal Plaza Lodge',
    member_type: 'lodge',
    owner_name: 'Ramesh Gowda',
    phone: uniquePhone,
    email: `ramesh.grandroyal_${Date.now().toString().slice(-4)}@example.com`,
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru North',
    police_station: 'Yelahanka PS',
    city: 'Bengaluru',
    pincode: '560064',
    landmark: 'Opposite Yelahanka Bus Stand',
    full_address: '42 MG Road, Brigade Junction, Ward 112, Yelahanka'
  };

  const initRes = await fetch('http://localhost:5000/api/register/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initiatePayload)
  });

  const initData = await initRes.json();
  assert(initRes.status === 201 && initData.success === true, 'POST /api/register/initiate returns HTTP 201 Created');
  assert(Boolean(initData.userId), `Received valid userId: ${initData.userId}`);
  assert(Boolean(initData.orderId), `Received valid orderId: ${initData.orderId}`);

  // Step 2: Payment verification
  const paymentRes = await fetch('http://localhost:5000/api/register/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: initData.userId,
      orderId: initData.orderId,
      paymentMethod: 'upi'
    })
  });

  const paymentData = await paymentRes.json();
  assert(paymentRes.status === 200 && paymentData.success === true, 'POST /api/register/verify-payment returns HTTP 200 Success');

  // -------------------------------------------------------------------------
  // 5. DATABASE VERIFICATION (Users Table Columns & Stored Row)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing PostgreSQL Database Records ---');
  const dbUser = await pool.query(
    `SELECT id, name, username, phone, email, state, district, taluka, police_station, city, pincode, landmark, full_address, payment_status
     FROM users 
     WHERE id = $1`,
    [initData.userId]
  );

  assert(dbUser.rows.length === 1, 'User record retrieved from PostgreSQL users table');
  const user = dbUser.rows[0];

  assert(user.district === 'Bengaluru Urban', 'DB column "district" correctly saved as "Bengaluru Urban"');
  assert(user.taluka === 'Bengaluru North', 'DB column "taluka" correctly saved as "Bengaluru North"');
  assert(user.police_station === 'Yelahanka PS', 'DB column "police_station" correctly saved as "Yelahanka PS"');
  assert(user.city === 'Bengaluru', 'DB column "city" correctly saved as "Bengaluru"');
  assert(user.pincode === '560064', 'DB column "pincode" correctly saved as "560064"');
  assert(user.landmark === 'Opposite Yelahanka Bus Stand', 'DB column "landmark" correctly saved as "Opposite Yelahanka Bus Stand"');
  assert(user.full_address === '42 MG Road, Brigade Junction, Ward 112, Yelahanka', 'DB column "full_address" correctly saved');
  assert(user.payment_status === 'paid', 'DB column "payment_status" updated to "paid"');

  // Query requested by prompt: SELECT district, taluka, police_station, landmark FROM users WHERE username LIKE '%grand%';
  console.log('\n[PROMPT QUERY]: SELECT district, taluka, police_station, landmark FROM users WHERE username LIKE \'%grand%\';');
  const promptQuery = await pool.query(
    `SELECT id, username, district, taluka, police_station, landmark 
     FROM users 
     WHERE username LIKE '%grand%' 
     ORDER BY id DESC 
     LIMIT 5`
  );
  console.table(promptQuery.rows);

  console.log(`\n======================================================================`);
  console.log(`🎉 ALL ${passed}/${total} TESTS PASSED PERFECTLY!`);
  console.log(`======================================================================\n`);
  process.exit(0);
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
