// update-portal-urls.mjs
// Updates portal_url and portal_provider for 90 Arizona jurisdictions missing portal URLs

const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ sql_text: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL Error ${res.status}: ${text}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

const jurisdictions = [
  // Counties
  { name: 'Apache County', url: 'https://www.apachecountyaz.gov/Building-Safety', provider: 'url' },
  { name: 'Cochise County', url: 'https://www4.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=335&original_iid=0&original_contactID=0', provider: 'citizenserve' },
  { name: 'Coconino County', url: 'https://co-coconino-az.smartgovcommunity.com/', provider: 'url' },
  { name: 'Gila County', url: 'https://www.gilacountyaz.gov/government/community_development/building_safety/index.php', provider: 'url' },
  { name: 'Graham County', url: 'https://www.graham.az.gov/277/Planning-Zoning', provider: 'url' },
  { name: 'Greenlee County', url: 'https://greenlee.az.gov/ova_dep/planning-and-zoning/', provider: 'url' },
  { name: 'La Paz County', url: 'https://www.lapaz.gov/589/BUILDING-SAFETY-PERMITS', provider: 'url' },
  { name: 'Mohave County', url: 'https://www.mohave.gov/departments/development-services/permitting/', provider: 'url' },
  { name: 'Navajo County', url: 'https://h9.maintstar.co/navajocounty/Portal/', provider: 'url' },
  { name: 'Santa Cruz County', url: 'https://www.santacruzcountyaz.gov/440/Building-Department', provider: 'url' },
  { name: 'Yavapai County', url: 'https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=300', provider: 'citizenserve' },
  { name: 'Yuma County', url: 'https://www.yumacountyaz.gov/government/development-services/divisions/customer-service', provider: 'url' },

  // Cities
  { name: 'City of Apache Junction', url: 'https://www.apachejunctionaz.gov/85/Building-Safety-and-Inspection', provider: 'url' },
  { name: 'City of Avondale', url: 'https://www.avondaleaz.gov/government/departments/development-services/building-services-division/inspections', provider: 'url' },
  { name: 'City of Benson', url: 'https://www.bensonaz.gov/departments/community_development/building_permits.php', provider: 'url' },
  { name: 'City of Bisbee', url: 'https://www.bisbeeaz.gov/2449/Building-Codes', provider: 'url' },
  { name: 'City of Bullhead City', url: 'https://www.bullheadcity.com/government/departments/development-services/building/permit-forms-information', provider: 'url' },
  { name: 'City of Casa Grande', url: 'https://rogue.casagrandeaz.gov/WebPermits', provider: 'url' },
  { name: 'City of Coolidge', url: 'https://www.coolidgeaz.com/development-services', provider: 'url' },
  { name: 'City of Cottonwood', url: 'https://cottonwoodaz.gov/158/Building-Division', provider: 'url' },
  { name: 'City of Douglas', url: 'https://www.douglasaz.gov/286/Planning-Permitting-Code-Compliance', provider: 'url' },
  { name: 'City of El Mirage', url: 'https://www.elmirageaz.gov/712/Permit-Center', provider: 'url' },
  { name: 'City of Eloy', url: 'https://eloyaz.gov/138/Building-Safety', provider: 'url' },
  { name: 'City of Globe', url: 'https://www.globeaz.gov/page/permits', provider: 'url' },
  { name: 'City of Holbrook', url: 'https://holbrookaz.gov/departments/building-department/', provider: 'url' },
  { name: 'City of Kingman', url: 'https://www.cityofkingman.gov/government/departments-a-h/development-services/permits-and-inspections', provider: 'url' },
  { name: 'City of Lake Havasu City', url: 'https://www.lhcaz.gov/development-permitting/building', provider: 'url' },
  { name: 'City of Marana', url: 'https://www.maranaaz.gov/Departments/Development-Services/Need-a-Permit', provider: 'url' },
  { name: 'City of Maricopa', url: 'https://www.maricopa-az.gov/Departments/Development-Services/Permit-Center', provider: 'url' },
  { name: 'City of Nogales', url: 'https://www.nogalesaz.gov/Construction-and-Inspections/', provider: 'url' },
  { name: 'City of Oro Valley', url: 'https://www.orovalleyaz.gov/Government/Departments/Community-and-Economic-Development/Services/Customer-Portal', provider: 'url' },
  { name: 'City of Page', url: 'https://cityofpage.org/departments/building-and-safety/', provider: 'url' },
  { name: 'City of Prescott', url: 'https://prsct.csqrcloud.com/community-etrakit/', provider: 'url' },
  { name: 'City of Prescott Valley', url: 'https://www.prescottvalley-az.gov/departments/development_services/permit_center.php', provider: 'url' },
  { name: 'City of Safford', url: 'https://www.cityofsafford.us/148/Building-Development-Permits-Codes', provider: 'url' },
  { name: 'City of San Luis', url: 'https://www.sanluisaz.gov/197/Building-Inspections-Codes', provider: 'url' },
  { name: 'City of Sedona', url: 'https://www.sedonaaz.gov/your-government/departments/community-development/permits', provider: 'url' },
  { name: 'City of Show Low', url: 'https://www.showlowaz.gov/o/cosl/page/city-permits-and-applications', provider: 'url' },
  { name: 'City of Sierra Vista', url: 'https://www.sierravistaaz.gov/our-city/departments/community-development/building-permits', provider: 'citizenserve' },
  { name: 'City of Somerton', url: 'https://www.somertonaz.gov/departments/community_development_services/building_safety_and_code_enforcement.php', provider: 'url' },
  { name: 'City of South Tucson', url: 'https://www.southtucsonaz.gov/devservices/page/permits', provider: 'url' },
  { name: 'City of Tolleson', url: 'https://www.tolleson.az.gov/739/Permits-Construction', provider: 'url' },
  { name: 'City of Tombstone', url: 'https://cityoftombstoneaz.gov/forms-permits/', provider: 'url' },
  { name: 'City of Willcox', url: 'https://willcox.az.gov/building-permits', provider: 'url' },
  { name: 'City of Winslow', url: 'https://www.winslowaz.gov/page/community-development', provider: 'url' },
  { name: 'City of Yuma', url: 'https://www.yumaaz.gov/government/community-development/development-portal', provider: 'energov' },

  // Towns
  { name: 'Town of Camp Verde', url: 'https://www.campverde.az.gov/departments/community_development/permits.php', provider: 'url' },
  { name: 'Town of Carefree', url: 'https://www.carefree.org/151/Building', provider: 'url' },
  { name: 'Town of Cave Creek', url: 'https://www.cavecreekaz.gov/219/Building-Permit-Zoning-Information', provider: 'url' },
  { name: 'Town of Chino Valley', url: 'https://www.chinoaz.net/200/Building', provider: 'url' },
  { name: 'Town of Clarkdale', url: 'https://www.clarkdale.az.gov/179/Building-Division', provider: 'url' },
  { name: 'Town of Clifton', url: 'https://cliftonaz.com/', provider: 'url' },
  { name: 'Town of Colorado City', url: 'https://tocc.us/building-permit-and-inspection/', provider: 'url' },
  { name: 'Town of Dewey-Humboldt', url: 'https://www.dhaz.gov/2203/Building-Permit', provider: 'url' },
  { name: 'Town of Duncan', url: 'https://duncanaz.us/home/services/building-permits-fees/', provider: 'url' },
  { name: 'Town of Eagar', url: 'https://www.eagaraz.gov/community-development/pages/forms-and-documents', provider: 'url' },
  { name: 'Town of Florence', url: 'https://twn-florence-az.smartgovcommunity.com/', provider: 'url' },
  { name: 'Town of Fountain Hills', url: 'https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=382', provider: 'citizenserve' },
  { name: 'Town of Fredonia', url: 'https://www.fredoniaaz.gov/forms-documents', provider: 'url' },
  { name: 'Town of Gila Bend', url: 'https://www.gilabendaz.org/279/Building-and-Safety', provider: 'url' },
  { name: 'Town of Guadalupe', url: 'https://www.guadalupeaz.org/building-construction-planning-zoning', provider: 'url' },
  { name: 'Town of Hayden', url: 'https://townofhaydenaz.gov/', provider: 'url' },
  { name: 'Town of Huachuca City', url: 'https://huachucacityaz.gov/', provider: 'url' },
  { name: 'Town of Jerome', url: 'https://jerome.az.gov/building-inspection', provider: 'url' },
  { name: 'Town of Kearny', url: 'https://www.pinal.gov/189/Building-Safety', provider: 'url' },
  { name: 'Town of Litchfield Park', url: 'https://www.litchfieldpark.gov/487/Building-Permit-Questions-and-Answers', provider: 'url' },
  { name: 'Town of Mammoth', url: 'https://www.pinal.gov/189/Building-Safety', provider: 'url' },
  { name: 'Town of Miami', url: 'https://miamiaz.gov/', provider: 'url' },
  { name: 'Town of Paradise Valley', url: 'https://www.paradisevalleyaz.gov/185/Building', provider: 'url' },
  { name: 'Town of Parker', url: 'https://www.townofparkeraz.com/page/community-development', provider: 'url' },
  { name: 'Town of Patagonia', url: 'https://www.santacruzcountyaz.gov/440/Building-Department', provider: 'url' },
  { name: 'Town of Payson', url: 'https://www.paysonaz.gov/departments/community-development/building-division', provider: 'url' },
  { name: 'Town of Pima', url: 'https://www.pimatown.az.gov/departments/planning_and_zoning.php', provider: 'url' },
  { name: 'Town of Pinetop-Lakeside', url: 'https://www.pinetoplakesideaz.gov/173/Building-Permits', provider: 'url' },
  { name: 'Town of Quartzsite', url: 'https://www.ci.quartzsite.az.us/government/departments/community_development/index.php', provider: 'url' },
  { name: 'Town of Sahuarita', url: 'https://aca-prod.accela.com/TOS/Default.aspx', provider: 'accela' },
  { name: 'Town of San Tan Valley', url: 'https://www.pinal.gov/189/Building-Safety', provider: 'url' },
  { name: 'Town of Snowflake', url: 'https://www.snowflakeaz.gov/departments/building-safety-department/', provider: 'url' },
  { name: 'Town of Springerville', url: 'https://www.springervilleaz.gov/building-department', provider: 'url' },
  { name: 'Town of St. Johns', url: 'https://stjohnsaz.gov/', provider: 'url' },
  { name: 'Town of Star Valley', url: 'https://starvalleyaz.com/building-department/building-permits/', provider: 'url' },
  { name: 'Town of Superior', url: 'https://superioraz.gov/index.php/government/planning-and-zoning', provider: 'url' },
  { name: 'Town of Taylor', url: 'https://www.tayloraz.gov/departments/permits/', provider: 'url' },
  { name: 'Town of Thatcher', url: 'https://www.thatcher.az.gov/departments/planning-zoning', provider: 'url' },
  { name: 'Town of Tusayan', url: 'https://tusayan-az.gov/engineering-development/', provider: 'url' },
  { name: 'Town of Wellton', url: 'https://www.welltonaz.gov/building-safety/pages/building-permits', provider: 'url' },
  { name: 'Town of Wickenburg', url: 'https://wickenburgaz.gov/1427/Permits', provider: 'url' },
  { name: 'Town of Williams', url: 'https://www.williamsaz.gov/departments_and_services/building_department', provider: 'url' },
  { name: 'Town of Winkelman', url: 'https://www.pinal.gov/189/Building-Safety', provider: 'url' },
  { name: 'Town of Youngtown', url: 'https://youngtownaz.hosted.civiclive.com/our_services/community_development/homeowners_guide_to_permitting', provider: 'url' },
];

async function updateJurisdictions() {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`Starting updates for ${jurisdictions.length} jurisdictions...`);

  // Build batch UPDATE using CASE statements - process in batches of 20
  const batchSize = 20;
  
  for (let i = 0; i < jurisdictions.length; i += batchSize) {
    const batch = jurisdictions.slice(i, i + batchSize);
    
    // Build individual UPDATE statements for this batch
    for (const j of batch) {
      const safeName = j.name.replace(/'/g, "''");
      const safeUrl = j.url.replace(/'/g, "''");
      const safeProvider = j.provider.replace(/'/g, "''");
      
      const sql = `UPDATE jurisdictions SET portal_url = '${safeUrl}', portal_provider = '${safeProvider}' WHERE name = '${safeName}' AND (portal_url IS NULL OR portal_url = '');`;
      
      try {
        await execSQL(sql);
        console.log(`  ✓ Updated: ${j.name}`);
        successCount++;
      } catch (err) {
        console.error(`  ✗ Error updating ${j.name}: ${err.message}`);
        errors.push({ name: j.name, error: err.message });
        errorCount++;
      }
    }
    
    // Small delay between batches
    if (i + batchSize < jurisdictions.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`✓ Successfully updated: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
  }

  // Now check how many rows were actually modified
  try {
    const checkSql = `SELECT COUNT(*) as total, COUNT(portal_url) as with_url FROM jurisdictions WHERE state_code = 'AZ';`;
    const result = await execSQL(checkSql);
    console.log('\nDatabase check:', result);
  } catch (err) {
    console.log('Could not run check query:', err.message);
  }
}

updateJurisdictions().catch(console.error);
