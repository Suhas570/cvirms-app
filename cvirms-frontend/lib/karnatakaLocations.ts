export interface TalukaData {
  name: string;
  policeStations: string[];
}

export interface DistrictData {
  name: string;
  talukas: TalukaData[];
}

export interface StateData {
  name: string;
  districts: DistrictData[];
}

export const KARNATAKA_STATE: StateData = {
  name: 'Karnataka',
  districts: [
    { name: 'Bagalkot', talukas: [
      { name: 'Bagalkot', policeStations: ['Bagalkot Town PS', 'Bagalkot Rural PS', 'Navanagar PS'] },
      { name: 'Badami', policeStations: ['Badami PS', 'Kerur PS'] },
      { name: 'Bilgi', policeStations: ['Bilgi PS'] },
      { name: 'Hungund', policeStations: ['Hungund PS', 'Ilkal PS'] },
      { name: 'Jamkhandi', policeStations: ['Jamkhandi PS', 'Banahatti PS'] },
      { name: 'Mudhol', policeStations: ['Mudhol PS'] },
    ]},
    { name: 'Ballari', talukas: [
      { name: 'Ballari', policeStations: ['Ballari Town PS', 'Ballari Rural PS', 'Brucepet PS', 'Cowl Bazaar PS'] },
      { name: 'Hospet', policeStations: ['Hospet Town PS', 'Hospet Rural PS'] },
      { name: 'Kudligi', policeStations: ['Kudligi PS'] },
      { name: 'Sandur', policeStations: ['Sandur PS', 'Yeshwanthnagar PS'] },
      { name: 'Siruguppa', policeStations: ['Siruguppa PS'] },
    ]},
    { name: 'Bengaluru Urban', talukas: [
      { name: 'Bengaluru North', policeStations: ['Yelahanka PS', 'Jalahalli PS', 'Peenya PS', 'Hebbal PS'] },
      { name: 'Bengaluru South', policeStations: ['Jayanagar PS', 'JP Nagar PS', 'Banashankari PS'] },
      { name: 'Bengaluru East', policeStations: ['Indiranagar PS', 'Whitefield PS', 'Marathahalli PS'] },
      { name: 'Bengaluru West', policeStations: ['Rajajinagar PS', 'Vijayanagar PS', 'Basaveshwaranagar PS'] },
      { name: 'Anekal', policeStations: ['Anekal PS', 'Attibele PS', 'Sarjapura PS'] },
    ]},
    { name: 'Bengaluru Rural', talukas: [
      { name: 'Devanahalli', policeStations: ['Devanahalli PS', 'Doddaballapur PS'] },
      { name: 'Doddaballapur', policeStations: ['Doddaballapur Town PS', 'Doddaballapur Rural PS'] },
      { name: 'Hoskote', policeStations: ['Hoskote PS'] },
      { name: 'Nelamangala', policeStations: ['Nelamangala PS'] },
    ]},
    { name: 'Belagavi', talukas: [
      { name: 'Belagavi', policeStations: ['Belagavi Town PS', 'Belagavi Rural PS', 'Khade Bazar PS', 'Market PS'] },
      { name: 'Athani', policeStations: ['Athani PS'] },
      { name: 'Bailhongal', policeStations: ['Bailhongal PS'] },
      { name: 'Chikkodi', policeStations: ['Chikkodi PS'] },
      { name: 'Gokak', policeStations: ['Gokak PS'] },
      { name: 'Hukkeri', policeStations: ['Hukkeri PS', 'Sankeshwar PS'] },
      { name: 'Khanapur', policeStations: ['Khanapur PS'] },
      { name: 'Ramdurg', policeStations: ['Ramdurg PS'] },
      { name: 'Raybag', policeStations: ['Raybag PS'] },
      { name: 'Savadatti', policeStations: ['Savadatti PS'] },
    ]},
    { name: 'Bidar', talukas: [
      { name: 'Bidar', policeStations: ['Bidar Town PS', 'Bidar Rural PS', 'Gandhi Gunj PS'] },
      { name: 'Basavakalyan', policeStations: ['Basavakalyan PS'] },
      { name: 'Bhalki', policeStations: ['Bhalki PS'] },
      { name: 'Humnabad', policeStations: ['Humnabad PS'] },
      { name: 'Aurad', policeStations: ['Aurad PS'] },
    ]},
    { name: 'Chamarajanagar', talukas: [
      { name: 'Chamarajanagar', policeStations: ['Chamarajanagar Town PS', 'Chamarajanagar Rural PS'] },
      { name: 'Gundlupet', policeStations: ['Gundlupet PS'] },
      { name: 'Kollegal', policeStations: ['Kollegal PS'] },
      { name: 'Yelandur', policeStations: ['Yelandur PS'] },
    ]},
    { name: 'Chikkaballapur', talukas: [
      { name: 'Chikkaballapur', policeStations: ['Chikkaballapur Town PS', 'Chikkaballapur Rural PS'] },
      { name: 'Bagepalli', policeStations: ['Bagepalli PS'] },
      { name: 'Chintamani', policeStations: ['Chintamani PS'] },
      { name: 'Gauribidanur', policeStations: ['Gauribidanur PS'] },
      { name: 'Gudibande', policeStations: ['Gudibande PS'] },
      { name: 'Sidlaghatta', policeStations: ['Sidlaghatta PS'] },
    ]},
    { name: 'Chikkamagaluru', talukas: [
      { name: 'Chikkamagaluru', policeStations: ['Chikkamagaluru Town PS', 'Chikkamagaluru Rural PS'] },
      { name: 'Kadur', policeStations: ['Kadur PS'] },
      { name: 'Koppa', policeStations: ['Koppa PS'] },
      { name: 'Mudigere', policeStations: ['Mudigere PS'] },
      { name: 'Narasimharajapura', policeStations: ['Narasimharajapura PS'] },
      { name: 'Sringeri', policeStations: ['Sringeri PS'] },
      { name: 'Tarikere', policeStations: ['Tarikere PS'] },
    ]},
    { name: 'Chitradurga', talukas: [
      { name: 'Chitradurga', policeStations: ['Chitradurga Town PS', 'Chitradurga Rural PS'] },
      { name: 'Challakere', policeStations: ['Challakere PS'] },
      { name: 'Hiriyur', policeStations: ['Hiriyur PS'] },
      { name: 'Hosadurga', policeStations: ['Hosadurga PS'] },
      { name: 'Holalkere', policeStations: ['Holalkere PS'] },
      { name: 'Molakalmuru', policeStations: ['Molakalmuru PS'] },
    ]},
    { name: 'Dakshina Kannada', talukas: [
      { name: 'Mangaluru', policeStations: ['Mangaluru North PS', 'Mangaluru South PS', 'Kadri PS', 'Panambur PS'] },
      { name: 'Bantwal', policeStations: ['Bantwal Town PS', 'Bantwal Rural PS'] },
      { name: 'Belthangady', policeStations: ['Belthangady PS'] },
      { name: 'Puttur', policeStations: ['Puttur Town PS', 'Puttur Rural PS'] },
      { name: 'Sullia', policeStations: ['Sullia PS'] },
    ]},
    { name: 'Davanagere', talukas: [
      { name: 'Davanagere', policeStations: ['Davanagere Town PS', 'Davanagere Rural PS', 'Vidyanagar PS'] },
      { name: 'Channagiri', policeStations: ['Channagiri PS'] },
      { name: 'Harihar', policeStations: ['Harihar PS'] },
      { name: 'Honnali', policeStations: ['Honnali PS'] },
      { name: 'Jagalur', policeStations: ['Jagalur PS'] },
      { name: 'Nyamathi', policeStations: ['Nyamathi PS'] },
    ]},
    { name: 'Dharwad', talukas: [
      { name: 'Dharwad', policeStations: ['Dharwad Town PS', 'Dharwad Rural PS', 'Vidyagiri PS'] },
      { name: 'Hubballi', policeStations: ['Hubballi Town PS', 'Hubballi Rural PS', 'Gokul Road PS', 'Keshwapur PS'] },
      { name: 'Kalghatgi', policeStations: ['Kalghatgi PS'] },
      { name: 'Kundgol', policeStations: ['Kundgol PS'] },
      { name: 'Navalgund', policeStations: ['Navalgund PS'] },
    ]},
    { name: 'Gadag', talukas: [
      { name: 'Gadag', policeStations: ['Gadag Town PS', 'Gadag Rural PS'] },
      { name: 'Betageri', policeStations: ['Betageri PS'] },
      { name: 'Mundargi', policeStations: ['Mundargi PS'] },
      { name: 'Nargund', policeStations: ['Nargund PS'] },
      { name: 'Ron', policeStations: ['Ron PS'] },
      { name: 'Shirahatti', policeStations: ['Shirahatti PS'] },
    ]},
    { name: 'Hassan', talukas: [
      { name: 'Hassan', policeStations: ['Hassan Town PS', 'Hassan Rural PS'] },
      { name: 'Alur', policeStations: ['Alur PS'] },
      { name: 'Arakalagud', policeStations: ['Arakalagud PS'] },
      { name: 'Arsikere', policeStations: ['Arsikere PS'] },
      { name: 'Belur', policeStations: ['Belur PS'] },
      { name: 'Channarayapatna', policeStations: ['Channarayapatna PS'] },
      { name: 'Holenarasipura', policeStations: ['Holenarasipura PS'] },
      { name: 'Sakleshpur', policeStations: ['Sakleshpur PS'] },
    ]},
    { name: 'Haveri', talukas: [
      { name: 'Haveri', policeStations: ['Haveri Town PS', 'Haveri Rural PS'] },
      { name: 'Byadgi', policeStations: ['Byadgi PS'] },
      { name: 'Hanagal', policeStations: ['Hanagal PS'] },
      { name: 'Hirekerur', policeStations: ['Hirekerur PS'] },
      { name: 'Ranebennur', policeStations: ['Ranebennur Town PS', 'Ranebennur Rural PS'] },
      { name: 'Savanur', policeStations: ['Savanur PS'] },
      { name: 'Shiggaon', policeStations: ['Shiggaon PS'] },
    ]},
    { name: 'Kalaburagi', talukas: [
      { name: 'Kalaburagi', policeStations: ['Kalaburagi Town PS', 'Kalaburagi Rural PS', 'Brahmpur PS'] },
      { name: 'Afzalpur', policeStations: ['Afzalpur PS'] },
      { name: 'Aland', policeStations: ['Aland PS'] },
      { name: 'Chincholi', policeStations: ['Chincholi PS'] },
      { name: 'Chittapur', policeStations: ['Chittapur PS'] },
      { name: 'Jevargi', policeStations: ['Jevargi PS'] },
      { name: 'Sedam', policeStations: ['Sedam PS'] },
    ]},
    { name: 'Kodagu', talukas: [
      { name: 'Madikeri', policeStations: ['Madikeri Town PS', 'Madikeri Rural PS'] },
      { name: 'Somwarpet', policeStations: ['Somwarpet PS'] },
      { name: 'Virajpet', policeStations: ['Virajpet PS'] },
    ]},
    { name: 'Kolar', talukas: [
      { name: 'Kolar', policeStations: ['Kolar Town PS', 'Kolar Rural PS'] },
      { name: 'Bangarapet', policeStations: ['Bangarapet PS'] },
      { name: 'Malur', policeStations: ['Malur PS'] },
      { name: 'Mulbagal', policeStations: ['Mulbagal PS'] },
      { name: 'Srinivaspur', policeStations: ['Srinivaspur PS'] },
    ]},
    { name: 'Koppal', talukas: [
      { name: 'Koppal', policeStations: ['Koppal Town PS', 'Koppal Rural PS'] },
      { name: 'Gangavathi', policeStations: ['Gangavathi Town PS', 'Gangavathi Rural PS'] },
      { name: 'Kushtagi', policeStations: ['Kushtagi PS'] },
      { name: 'Yelburga', policeStations: ['Yelburga PS'] },
    ]},
    { name: 'Mandya', talukas: [
      { name: 'Mandya', policeStations: ['Mandya Town PS', 'Mandya Rural PS'] },
      { name: 'Krishnarajpet', policeStations: ['Krishnarajpet PS'] },
      { name: 'Maddur', policeStations: ['Maddur PS'] },
      { name: 'Malavalli', policeStations: ['Malavalli PS'] },
      { name: 'Nagamangala', policeStations: ['Nagamangala PS'] },
      { name: 'Pandavapura', policeStations: ['Pandavapura PS'] },
      { name: 'Srirangapatna', policeStations: ['Srirangapatna PS'] },
    ]},
    { name: 'Mysuru', talukas: [
      { name: 'Mysuru', policeStations: ['Mysuru Town PS', 'Mysuru Rural PS', 'Devaraja PS', 'Nazarbad PS', 'Vijayanagar PS'] },
      { name: 'Heggadadevankote', policeStations: ['Heggadadevankote PS'] },
      { name: 'Hunsur', policeStations: ['Hunsur PS'] },
      { name: 'Krishnarajanagara', policeStations: ['Krishnarajanagara PS'] },
      { name: 'Nanjangud', policeStations: ['Nanjangud Town PS', 'Nanjangud Rural PS'] },
      { name: 'Periyapatna', policeStations: ['Periyapatna PS'] },
      { name: 'T. Narasipura', policeStations: ['T. Narasipura PS'] },
    ]},
    { name: 'Raichur', talukas: [
      { name: 'Raichur', policeStations: ['Raichur Town PS', 'Raichur Rural PS'] },
      { name: 'Devadurga', policeStations: ['Devadurga PS'] },
      { name: 'Lingsugur', policeStations: ['Lingsugur PS'] },
      { name: 'Manvi', policeStations: ['Manvi PS'] },
      { name: 'Sindhanur', policeStations: ['Sindhanur Town PS', 'Sindhanur Rural PS'] },
    ]},
    { name: 'Ramanagara', talukas: [
      { name: 'Ramanagara', policeStations: ['Ramanagara Town PS', 'Ramanagara Rural PS'] },
      { name: 'Channapatna', policeStations: ['Channapatna Town PS', 'Channapatna Rural PS'] },
      { name: 'Kanakapura', policeStations: ['Kanakapura PS'] },
      { name: 'Magadi', policeStations: ['Magadi PS'] },
    ]},
    { name: 'Shivamogga', talukas: [
      { name: 'Shivamogga', policeStations: ['Shivamogga Town PS', 'Shivamogga Rural PS', 'Doddapete PS'] },
      { name: 'Bhadravathi', policeStations: ['Bhadravathi Town PS', 'Bhadravathi Rural PS'] },
      { name: 'Hosanagara', policeStations: ['Hosanagara PS'] },
      { name: 'Sagar', policeStations: ['Sagar PS'] },
      { name: 'Shikaripura', policeStations: ['Shikaripura PS'] },
      { name: 'Sorab', policeStations: ['Sorab PS'] },
      { name: 'Thirthahalli', policeStations: ['Thirthahalli PS'] },
    ]},
    { name: 'Tumakuru', talukas: [
      { name: 'Tumakuru', policeStations: ['Tumakuru Town PS', 'Tumakuru Rural PS'] },
      { name: 'Chikkanayakanahalli', policeStations: ['Chikkanayakanahalli PS'] },
      { name: 'Gubbi', policeStations: ['Gubbi PS'] },
      { name: 'Koratagere', policeStations: ['Koratagere PS'] },
      { name: 'Kunigal', policeStations: ['Kunigal PS'] },
      { name: 'Madhugiri', policeStations: ['Madhugiri PS'] },
      { name: 'Pavagada', policeStations: ['Pavagada PS'] },
      { name: 'Sira', policeStations: ['Sira PS'] },
      { name: 'Tiptur', policeStations: ['Tiptur Town PS', 'Tiptur Rural PS'] },
      { name: 'Turuvekere', policeStations: ['Turuvekere PS'] },
    ]},
    { name: 'Udupi', talukas: [
      { name: 'Udupi', policeStations: ['Udupi Town PS', 'Udupi Rural PS', 'Manipal PS'] },
      { name: 'Karkala', policeStations: ['Karkala Town PS', 'Karkala Rural PS'] },
      { name: 'Kundapura', policeStations: ['Kundapura PS'] },
    ]},
    { name: 'Uttara Kannada', talukas: [
      { name: 'Karwar', policeStations: ['Karwar Town PS', 'Karwar Rural PS'] },
      { name: 'Ankola', policeStations: ['Ankola PS'] },
      { name: 'Bhatkal', policeStations: ['Bhatkal PS'] },
      { name: 'Haliyal', policeStations: ['Haliyal PS'] },
      { name: 'Honnavar', policeStations: ['Honnavar PS'] },
      { name: 'Joida', policeStations: ['Joida PS'] },
      { name: 'Kumta', policeStations: ['Kumta PS'] },
      { name: 'Mundgod', policeStations: ['Mundgod PS'] },
      { name: 'Siddapur', policeStations: ['Siddapur PS'] },
      { name: 'Sirsi', policeStations: ['Sirsi Town PS', 'Sirsi Rural PS'] },
      { name: 'Yellapur', policeStations: ['Yellapur PS'] },
    ]},
    { name: 'Vijayapura', talukas: [
      { name: 'Vijayapura', policeStations: ['Vijayapura Town PS', 'Vijayapura Rural PS'] },
      { name: 'Basavana Bagevadi', policeStations: ['Basavana Bagevadi PS'] },
      { name: 'Indi', policeStations: ['Indi PS'] },
      { name: 'Muddebihal', policeStations: ['Muddebihal PS'] },
      { name: 'Sindagi', policeStations: ['Sindagi PS'] },
    ]},
    { name: 'Yadgir', talukas: [
      { name: 'Yadgir', policeStations: ['Yadgir Town PS', 'Yadgir Rural PS'] },
      { name: 'Shahapur', policeStations: ['Shahapur PS'] },
      { name: 'Shorapur', policeStations: ['Shorapur PS'] },
    ]},
    { name: 'Vijayanagara', talukas: [
      { name: 'Hosapete', policeStations: ['Hosapete Town PS', 'Hosapete Rural PS'] },
      { name: 'Hagaribommanahalli', policeStations: ['Hagaribommanahalli PS'] },
      { name: 'Harapanahalli', policeStations: ['Harapanahalli PS'] },
      { name: 'Hoovina Hadagali', policeStations: ['Hoovina Hadagali PS'] },
      { name: 'Kotturu', policeStations: ['Kotturu PS'] },
    ]},
  ],
};

// Helper: get districts for state
export function getDistricts(stateName: string): DistrictData[] {
  if (stateName === 'Karnataka') return KARNATAKA_STATE.districts;
  return [];
}

// Helper: get taluks for a district
export function getTalukas(districtName: string): TalukaData[] {
  const district = KARNATAKA_STATE.districts.find(d => d.name === districtName);
  return district?.talukas || [];
}

// Helper: get police stations for a taluk
export function getPoliceStations(districtName: string, talukaName: string): string[] {
  const district = KARNATAKA_STATE.districts.find(d => d.name === districtName);
  if (!district) return [];
  const taluka = district.talukas.find(t => t.name === talukaName);
  return taluka?.policeStations || [];
}
