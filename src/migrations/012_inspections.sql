-- IronTrack Pulse — Migration 012: Inspection Scheduling
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. jurisdictions — all 107 Arizona jurisdictions
-- ============================================================
CREATE TABLE IF NOT EXISTS jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city', 'town', 'county')),
  county TEXT NOT NULL,
  phone TEXT,
  portal_url TEXT,
  portal_provider TEXT CHECK (portal_provider IN ('accela', 'energov', 'citizenserve', 'url', 'offline', NULL)),
  portal_verified BOOLEAN DEFAULT false,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. project_jurisdiction — locks one jurisdiction per project
-- ============================================================
CREATE TABLE IF NOT EXISTS project_jurisdiction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  set_at TIMESTAMPTZ DEFAULT NOW(),
  set_by TEXT,
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_jurisdiction_project ON project_jurisdiction(project_id);

-- ============================================================
-- 3. inspection_requests — scheduling action log
-- ============================================================
CREATE TABLE IF NOT EXISTS inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  inspection_type TEXT NOT NULL,
  permit_number TEXT,
  requested_date DATE,
  contact_name TEXT,
  contact_phone TEXT,
  time_window TEXT DEFAULT 'Anytime' CHECK (time_window IN ('Anytime', 'AM', 'PM')),
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'redirected', 'called', 'completed', 'failed')),
  portal_url_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_project ON inspection_requests(project_id);

-- ============================================================
-- 4. RLS — open V1 (match existing pattern)
-- ============================================================
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_jurisdiction ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on jurisdictions" ON jurisdictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on project_jurisdiction" ON project_jurisdiction FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inspection_requests" ON inspection_requests FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. Seed Data — 107 Arizona Jurisdictions
-- ============================================================

-- === CITIES (type = 'city') ===
INSERT INTO jurisdictions (name, type, county, phone, portal_url, portal_provider, portal_verified, lat, lon) VALUES
('City of Apache Junction', 'city', 'Pinal', '480-474-5083', NULL, NULL, false, 33.4150, -111.5496),
('City of Avondale', 'city', 'Maricopa', '623-333-2000', NULL, NULL, false, 33.4356, -112.3496),
('City of Benson', 'city', 'Cochise', '520-586-2245', NULL, 'offline', false, 31.9676, -110.2946),
('City of Bisbee', 'city', 'Cochise', '520-432-6000', NULL, 'offline', false, 31.4484, -109.9284),
('City of Buckeye', 'city', 'Maricopa', '623-349-6200', 'https://buckeye-az-energovpub.tylerhost.net/apps/SelfService', 'energov', false, 33.3703, -112.5838),
('City of Bullhead City', 'city', 'Mohave', '928-763-9500', NULL, NULL, false, 35.1478, -114.5683),
('City of Casa Grande', 'city', 'Pinal', '520-421-8600', NULL, NULL, false, 32.8795, -111.7574),
('City of Chandler', 'city', 'Maricopa', '480-782-3000', 'https://chandleraz.gov/building', 'energov', false, 33.3062, -111.8413),
('City of Coolidge', 'city', 'Pinal', '520-723-6000', NULL, 'offline', false, 32.9776, -111.5174),
('City of Cottonwood', 'city', 'Yavapai', '928-634-5526', NULL, NULL, false, 34.7392, -112.0099),
('City of Douglas', 'city', 'Cochise', '520-417-7300', NULL, 'offline', false, 31.3445, -109.5453),
('City of El Mirage', 'city', 'Maricopa', '623-972-8116', NULL, NULL, false, 33.6131, -112.3246),
('City of Eloy', 'city', 'Pinal', '520-466-3201', NULL, 'offline', false, 32.7559, -111.5546),
('City of Flagstaff', 'city', 'Coconino', '928-213-2615', 'https://flagstaff-az-gov.avolvecloud.com/Portal/ePlan', 'url', false, 35.1983, -111.6513),
('City of Glendale', 'city', 'Maricopa', '623-930-2580', 'https://glendale-az.energovcloud.com/EnerGovProd/SelfService', 'energov', true, 33.5387, -112.1860),
('City of Globe', 'city', 'Gila', '928-425-7146', NULL, 'offline', false, 33.3942, -110.7866),
('City of Goodyear', 'city', 'Maricopa', '623-932-3010', 'https://goodyearaz.gov/building', 'energov', false, 33.4353, -112.3577),
('City of Holbrook', 'city', 'Navajo', '928-524-6225', NULL, 'offline', false, 34.9024, -110.1579),
('City of Kingman', 'city', 'Mohave', '928-753-8100', NULL, NULL, false, 35.1894, -114.0530),
('City of Lake Havasu City', 'city', 'Mohave', '928-453-4140', NULL, NULL, false, 34.4839, -114.3225),
('City of Marana', 'city', 'Pima', '520-382-1900', NULL, NULL, false, 32.4368, -111.2253),
('City of Maricopa', 'city', 'Pinal', '520-316-6983', NULL, NULL, false, 33.0581, -112.0476),
('City of Mesa', 'city', 'Maricopa', '480-644-2211', 'https://mesa.accela.com/citizenaccess/default.aspx', 'accela', true, 33.4152, -111.8315),
('City of Nogales', 'city', 'Santa Cruz', '520-287-6571', NULL, 'offline', false, 31.3404, -110.9343),
('City of Oro Valley', 'city', 'Pima', '520-229-4800', NULL, NULL, false, 32.3909, -110.9665),
('City of Page', 'city', 'Coconino', '928-645-4200', NULL, 'offline', false, 36.9147, -111.4558),
('City of Peoria', 'city', 'Maricopa', '623-773-7250', 'https://peoriaaz.gov/building-permits', 'energov', false, 33.5806, -112.2374),
('City of Phoenix', 'city', 'Maricopa', '602-262-7811', 'https://apps-secure.phoenix.gov/PDD', 'accela', true, 33.4484, -112.0740),
('City of Prescott', 'city', 'Yavapai', '928-777-1207', NULL, NULL, false, 34.5400, -112.4685),
('City of Prescott Valley', 'city', 'Yavapai', '928-759-3010', NULL, NULL, false, 34.6100, -112.3150),
('City of Safford', 'city', 'Graham', '928-432-4000', NULL, 'offline', false, 32.8340, -109.7076),
('City of San Luis', 'city', 'Yuma', '928-341-8520', NULL, 'offline', false, 32.4870, -114.7820),
('City of Scottsdale', 'city', 'Maricopa', '480-312-2500', 'https://eservices.scottsdaleaz.gov/bldgresources', 'accela', true, 33.4942, -111.9261),
('City of Sedona', 'city', 'Yavapai', '928-204-7100', NULL, NULL, false, 34.8697, -111.7610),
('City of Show Low', 'city', 'Navajo', '928-532-4000', NULL, 'offline', false, 34.2542, -110.0298),
('City of Sierra Vista', 'city', 'Cochise', '520-417-4400', NULL, NULL, false, 31.5455, -110.3035),
('City of Somerton', 'city', 'Yuma', '928-627-8866', NULL, 'offline', false, 32.5965, -114.7098),
('City of South Tucson', 'city', 'Pima', '520-792-2424', NULL, 'offline', false, 32.1955, -110.9688),
('City of Surprise', 'city', 'Maricopa', '623-222-1000', 'https://surpriseaz.gov/building', 'energov', false, 33.6292, -112.3680),
('City of Tempe', 'city', 'Maricopa', '480-350-8271', 'https://tempe-energov.tylerhost.net/apps/SelfService', 'energov', true, 33.4255, -111.9400),
('City of Tolleson', 'city', 'Maricopa', '623-936-7111', NULL, NULL, false, 33.4500, -112.2591),
('City of Tombstone', 'city', 'Cochise', '520-457-3540', NULL, 'offline', false, 31.7129, -110.0676),
('City of Tucson', 'city', 'Pima', '520-791-5550', 'https://pdsonline.tucsonaz.gov', 'citizenserve', true, 32.2226, -110.9747),
('City of Willcox', 'city', 'Cochise', '520-384-4271', NULL, 'offline', false, 32.2528, -109.8320),
('City of Winslow', 'city', 'Navajo', '928-289-2434', NULL, 'offline', false, 35.0242, -110.6974),
('City of Yuma', 'city', 'Yuma', '928-373-5175', NULL, NULL, false, 32.6927, -114.6277);

-- === TOWNS (type = 'town') ===
INSERT INTO jurisdictions (name, type, county, phone, portal_url, portal_provider, portal_verified, lat, lon) VALUES
('Town of Camp Verde', 'town', 'Yavapai', '928-567-6631', NULL, 'offline', false, 34.5636, -111.8543),
('Town of Carefree', 'town', 'Maricopa', '480-488-3686', NULL, 'offline', false, 33.8222, -111.9223),
('Town of Cave Creek', 'town', 'Maricopa', '480-488-1400', NULL, NULL, false, 33.8317, -111.9507),
('Town of Chino Valley', 'town', 'Yavapai', '928-636-2646', NULL, 'offline', false, 34.7575, -112.4535),
('Town of Clarkdale', 'town', 'Yavapai', '928-639-2400', NULL, 'offline', false, 34.7714, -112.0579),
('Town of Clifton', 'town', 'Greenlee', '928-865-4146', NULL, 'offline', false, 33.0509, -109.2962),
('Town of Colorado City', 'town', 'Mohave', '928-875-2646', NULL, 'offline', false, 36.9903, -112.9758),
('Town of Dewey-Humboldt', 'town', 'Yavapai', '928-632-7362', NULL, 'offline', false, 34.5311, -112.2486),
('Town of Duncan', 'town', 'Greenlee', '928-359-2733', NULL, 'offline', false, 32.7195, -109.0968),
('Town of Eagar', 'town', 'Apache', '928-333-4128', NULL, 'offline', false, 34.1109, -109.2923),
('Town of Florence', 'town', 'Pinal', '520-868-7500', NULL, NULL, false, 33.0314, -111.3873),
('Town of Fountain Hills', 'town', 'Maricopa', '480-816-5100', NULL, NULL, false, 33.6117, -111.7174),
('Town of Fredonia', 'town', 'Coconino', '928-643-7241', NULL, 'offline', false, 36.9461, -112.5268),
('Town of Gila Bend', 'town', 'Maricopa', '928-683-2255', NULL, 'offline', false, 32.9478, -112.7166),
('Town of Gilbert', 'town', 'Maricopa', '480-503-6700', 'https://www.gilbertaz.gov/departments/development-services', 'energov', true, 33.3528, -111.7890),
('Town of Guadalupe', 'town', 'Maricopa', '480-730-3080', NULL, 'offline', false, 33.3711, -111.9632),
('Town of Hayden', 'town', 'Gila', '520-356-7801', NULL, 'offline', false, 33.0056, -110.7866),
('Town of Huachuca City', 'town', 'Cochise', '520-456-1354', NULL, 'offline', false, 31.6278, -110.3338),
('Town of Jerome', 'town', 'Yavapai', '928-634-7943', NULL, 'offline', false, 34.7489, -112.1138),
('Town of Kearny', 'town', 'Pinal', '520-363-5547', NULL, 'offline', false, 33.0573, -110.9108),
('Town of Litchfield Park', 'town', 'Maricopa', '623-935-5033', NULL, NULL, false, 33.4931, -112.3579),
('Town of Mammoth', 'town', 'Pinal', '520-487-2331', NULL, 'offline', false, 32.7231, -110.6405),
('Town of Miami', 'town', 'Gila', '928-473-4403', NULL, 'offline', false, 33.3992, -110.8686),
('Town of Paradise Valley', 'town', 'Maricopa', '480-948-7411', NULL, NULL, false, 33.5310, -111.9425),
('Town of Parker', 'town', 'La Paz', '928-669-9265', NULL, 'offline', false, 34.1500, -114.2891),
('Town of Patagonia', 'town', 'Santa Cruz', '520-394-2229', NULL, 'offline', false, 31.5395, -110.7546),
('Town of Payson', 'town', 'Gila', '928-474-5242', NULL, NULL, false, 34.2309, -111.3251),
('Town of Pima', 'town', 'Graham', '928-485-2311', NULL, 'offline', false, 32.8964, -109.8276),
('Town of Pinetop-Lakeside', 'town', 'Navajo', '928-368-8696', NULL, 'offline', false, 34.1425, -109.9574),
('Town of Quartzsite', 'town', 'La Paz', '928-927-4333', NULL, 'offline', false, 33.6639, -114.2300),
('Town of Queen Creek', 'town', 'Maricopa', '480-358-3000', 'https://www.queencreek.org/departments/development-services', 'url', false, 33.2487, -111.6343),
('Town of Sahuarita', 'town', 'Pima', '520-822-8800', NULL, NULL, false, 31.9576, -110.9557),
('Town of San Tan Valley', 'town', 'Pinal', NULL, NULL, NULL, false, 33.1948, -111.5618),
('Town of Snowflake', 'town', 'Navajo', '928-536-7103', NULL, 'offline', false, 34.5133, -110.0790),
('Town of Springerville', 'town', 'Apache', '928-333-2656', NULL, 'offline', false, 34.1334, -109.2837),
('Town of St. Johns', 'town', 'Apache', '928-337-4517', NULL, 'offline', false, 34.5059, -109.3607),
('Town of Star Valley', 'town', 'Gila', '928-474-2682', NULL, 'offline', false, 34.2548, -111.2590),
('Town of Superior', 'town', 'Pinal', '520-689-5752', NULL, 'offline', false, 33.2940, -111.0968),
('Town of Taylor', 'town', 'Navajo', '928-536-7103', NULL, 'offline', false, 34.4650, -110.0910),
('Town of Thatcher', 'town', 'Graham', '928-428-2290', NULL, 'offline', false, 32.8490, -109.7590),
('Town of Tusayan', 'town', 'Coconino', '928-638-9909', NULL, 'offline', false, 35.9742, -112.1213),
('Town of Wellton', 'town', 'Yuma', '928-785-3348', NULL, 'offline', false, 32.6728, -114.1468),
('Town of Wickenburg', 'town', 'Maricopa', '928-684-5451', NULL, NULL, false, 33.9686, -112.7299),
('Town of Williams', 'town', 'Coconino', '928-635-4451', NULL, 'offline', false, 35.2494, -112.1871),
('Town of Winkelman', 'town', 'Pinal', '520-356-7854', NULL, 'offline', false, 32.9884, -110.7697),
('Town of Youngtown', 'town', 'Maricopa', '623-933-8286', NULL, 'offline', false, 33.5942, -112.3013);

-- === COUNTIES (type = 'county') ===
INSERT INTO jurisdictions (name, type, county, phone, portal_url, portal_provider, portal_verified, lat, lon) VALUES
('Apache County', 'county', 'Apache', '928-337-7527', NULL, 'offline', false, 34.8994, -109.4992),
('Cochise County', 'county', 'Cochise', '520-432-9200', NULL, NULL, false, 31.8793, -109.7507),
('Coconino County', 'county', 'Coconino', '928-679-8850', NULL, NULL, false, 35.8297, -111.7738),
('Gila County', 'county', 'Gila', '928-402-8758', NULL, NULL, false, 33.7997, -110.8127),
('Graham County', 'county', 'Graham', '928-428-3250', NULL, 'offline', false, 32.9307, -109.8865),
('Greenlee County', 'county', 'Greenlee', '928-865-2072', NULL, 'offline', false, 33.2106, -109.2440),
('La Paz County', 'county', 'La Paz', '928-669-6138', NULL, 'offline', false, 33.7293, -113.9811),
('Maricopa County', 'county', 'Maricopa', '602-506-3301', 'https://accela.maricopa.gov/citizenaccess', 'accela', true, 33.3489, -112.4903),
('Mohave County', 'county', 'Mohave', '928-757-0915', NULL, NULL, false, 35.7047, -113.7631),
('Navajo County', 'county', 'Navajo', '928-524-4100', NULL, 'offline', false, 34.9018, -110.3212),
('Pima County', 'county', 'Pima', '520-724-9000', 'https://webcms.pima.gov/government/development_services/', 'url', true, 32.0954, -111.5498),
('Pinal County', 'county', 'Pinal', '520-866-6442', 'https://pinal.gov/357/Building-Safety', 'url', false, 32.7495, -111.4882),
('Santa Cruz County', 'county', 'Santa Cruz', '520-375-7700', NULL, 'offline', false, 31.5260, -110.8470),
('Yavapai County', 'county', 'Yavapai', '928-771-3214', NULL, NULL, false, 34.5928, -112.5004),
('Yuma County', 'county', 'Yuma', '928-817-5100', NULL, NULL, false, 32.6870, -114.1453);
