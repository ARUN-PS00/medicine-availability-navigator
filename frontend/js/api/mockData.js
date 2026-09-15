/**
 * MAP (Medicine Availability Navigator) - Mock Data Fallback Layer
 * 
 * NOTE: This mock data strictly mirrors the backend schema (facilities, medicines, inventory)
 * and ML prediction format. It is used transparently when the FastAPI server or Supabase
 * database is offline or unconfigured.
 * Presentation enrichments (e.g. descriptions, precautions) are client-side only.
 */

export const MOCK_FACILITIES = [
  { id: "F001", name: "Synthetic District Hospital F001", type: "District Hospital", latitude: 12.9716, longitude: 77.5946, address: "Central District Circle, Sector 4", phone: "+91 80 2200 1001", open_hours: "24/7 Emergency & Pharmacy" },
  { id: "F002", name: "Synthetic District Hospital F002", type: "District Hospital", latitude: 12.9250, longitude: 77.5897, address: "South Ring Road, Medical Enclave", phone: "+91 80 2200 1002", open_hours: "24/7 Emergency & Pharmacy" },
  { id: "F003", name: "Synthetic CHC F003", type: "CHC", latitude: 12.9800, longitude: 77.6400, address: "East Community Health Center, Halasuru", phone: "+91 80 2500 2003", open_hours: "08:00 AM - 08:00 PM" },
  { id: "F004", name: "Synthetic CHC F004", type: "CHC", latitude: 12.9100, longitude: 77.6200, address: "Koramangala Community Complex", phone: "+91 80 2500 2004", open_hours: "08:00 AM - 08:00 PM" },
  { id: "F005", name: "Synthetic PHC F005", type: "PHC", latitude: 13.0100, longitude: 77.5500, address: "Yeshwanthpur Primary Health Post", phone: "+91 80 2800 3005", open_hours: "09:00 AM - 05:00 PM" },
  { id: "F006", name: "Synthetic PHC F006", type: "PHC", latitude: 12.9500, longitude: 77.5200, address: "Vijayanagar Primary Health Center", phone: "+91 80 2800 3006", open_hours: "09:00 AM - 05:00 PM" },
  { id: "F007", name: "Synthetic PHC F007", type: "PHC", latitude: 12.8900, longitude: 77.5700, address: "JP Nagar Primary Clinic Post", phone: "+91 80 2800 3007", open_hours: "09:00 AM - 05:00 PM" },
  { id: "F008", name: "Synthetic PHC F008", type: "PHC", latitude: 13.0300, longitude: 77.6000, address: "Hebbal Health Outpost", phone: "+91 80 2800 3008", open_hours: "09:00 AM - 05:00 PM" },
  { id: "F009", name: "Synthetic Pharmacy F009", type: "Pharmacy", latitude: 12.9750, longitude: 77.6050, address: "MG Road Central Jan Aushadhi Kendra", phone: "+91 80 2600 4009", open_hours: "08:00 AM - 10:00 PM" },
  { id: "F010", name: "Synthetic Pharmacy F010", type: "Pharmacy", latitude: 12.9350, longitude: 77.6150, address: "BTM Layout Community Pharmacy", phone: "+91 80 2600 4010", open_hours: "08:00 AM - 11:00 PM" }
];

export const MOCK_MEDICINES = [
  {
    id: "M001",
    name: "Paracetamol 500mg",
    category: "Analgesics & Antipyretics",
    dosage_form: "Tablet (Oral)",
    manufacturer: "Karnataka Antibiotics & Pharmaceuticals",
    composition: "Paracetamol IP 500mg",
    description: "Fast-acting analgesic and antipyretic indicated for temporary relief of mild-to-moderate fever, headache, body ache, and musculoskeletal pain.",
    precaution_warning: "Do not exceed 4000mg in 24 hours. Prolonged usage may cause severe liver damage. Consult physician if fever persists > 3 days."
  },
  {
    id: "M002",
    name: "Amoxicillin 500mg",
    category: "Antibiotics & Antimicrobials",
    dosage_form: "Capsule (Oral)",
    manufacturer: "Cipla Healthcare Ltd.",
    composition: "Amoxicillin Trihydrate IP equivalent to Amoxicillin 500mg",
    description: "Broad-spectrum penicillin-type antibiotic used in the treatment of bacterial respiratory infections, ear-nose-throat infections, and urinary tract infections.",
    precaution_warning: "Complete full prescribed antibiotic regimen to prevent resistance. Contraindicated in individuals with penicillin allergy."
  },
  {
    id: "M003",
    name: "Metformin 500mg",
    category: "Antidiabetics",
    dosage_form: "Tablet (Extended-Release)",
    manufacturer: "Sun Pharmaceutical Industries",
    composition: "Metformin Hydrochloride IP 500mg",
    description: "First-line biguanide oral antihyperglycemic medication used for glycemic control in patients with Type 2 diabetes mellitus.",
    precaution_warning: "Take with or immediately after meals to reduce gastrointestinal upset. Monitor kidney function periodically."
  },
  {
    id: "M004",
    name: "Amlodipine 5mg",
    category: "Cardiovascular & Antihypertensives",
    dosage_form: "Tablet (Oral)",
    manufacturer: "Torrent Pharmaceuticals",
    composition: "Amlodipine Besylate IP equivalent to Amlodipine 5mg",
    description: "Calcium channel blocker used primarily for high blood pressure (hypertension) management and chronic stable angina prevention.",
    precaution_warning: "May cause dizziness or ankle swelling. Do not stop taking abruptly without medical consultation."
  },
  {
    id: "M005",
    name: "Azithromycin 500mg",
    category: "Antibiotics & Antimicrobials",
    dosage_form: "Film-Coated Tablet",
    manufacturer: "Zydus Cadila",
    composition: "Azithromycin Dihydrate IP equivalent to Azithromycin 500mg",
    description: "Macrolide antibiotic active against various atypical and bacterial pathogens of the respiratory tract, skin, and soft tissues.",
    precaution_warning: "Take once daily 1 hour before or 2 hours after meals. Report any severe diarrhea or irregular heartbeat."
  },
  {
    id: "M006",
    name: "Cetirizine 10mg",
    category: "Antiallergics & Antihistamines",
    dosage_form: "Film-Coated Tablet",
    manufacturer: "Dr. Reddy's Laboratories",
    composition: "Cetirizine Hydrochloride IP 10mg",
    description: "Second-generation antihistamine used to relieve seasonal allergic rhinitis, watery eyes, sneezing, runny nose, and hives (urticaria).",
    precaution_warning: "May cause mild drowsiness. Avoid operating heavy machinery or consuming alcohol while taking this medication."
  },
  {
    id: "M007",
    name: "Omeprazole 20mg",
    category: "Gastrointestinal",
    dosage_form: "Delayed-Release Capsule",
    manufacturer: "Alkem Laboratories",
    composition: "Omeprazole IP 20mg (Enteric-coated pellets)",
    description: "Proton pump inhibitor (PPI) that decreases stomach acid secretion. Prescribed for GERD, acid reflux, peptic ulcers, and Zollinger-Ellison syndrome.",
    precaution_warning: "Swallow whole with water at least 30-60 minutes before breakfast. Do not crush or chew pellets."
  },
  {
    id: "M008",
    name: "ORS",
    category: "Electrolytes & Rehydration",
    dosage_form: "Oral Powder Sachet",
    manufacturer: "FDC Limited",
    composition: "Sodium Chloride 2.6g, Potassium Chloride 1.5g, Sodium Citrate 2.9g, Dextrose Anhydrous 13.5g per sachet",
    description: "WHO-recommended oral rehydration salts formula to replace lost fluids and vital electrolytes due to acute diarrhea, vomiting, or dehydration.",
    precaution_warning: "Dissolve entire contents in exactly 1 liter of clean drinking water. Use within 24 hours of preparation; discard leftover."
  },
  {
    id: "M009",
    name: "Ibuprofen 400mg",
    category: "Analgesics & NSAIDs",
    dosage_form: "Film-Coated Tablet",
    manufacturer: "Abbott Healthcare",
    composition: "Ibuprofen IP 400mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) indicated for reducing inflammation, swelling, and acute pain from arthritis, dental pain, or sprains.",
    precaution_warning: "Take with food or milk to safeguard stomach lining. Avoid in patients with active gastrointestinal ulcers or severe heart failure."
  },
  {
    id: "M010",
    name: "Atorvastatin 10mg",
    category: "Cardiovascular & Lipid Regulating",
    dosage_form: "Film-Coated Tablet",
    manufacturer: "Lupin Pharmaceuticals",
    composition: "Atorvastatin Calcium IP equivalent to Atorvastatin 10mg",
    description: "HMG-CoA reductase inhibitor (statin) used alongside dietary modifications to lower elevated LDL cholesterol and reduce cardiovascular risk.",
    precaution_warning: "Usually taken once daily in the evening. Immediately inform doctor if experiencing unexplained muscle pain, tenderness, or weakness."
  }
];

// Realistic Facility Stock Matrix for the 10 essential medicines
export const MOCK_FACILITY_INVENTORY = {
  "M001": [
    { facility_id: "F001", closing_stock: 450, days_of_stock_remaining: 14.5, stockout_probability: 0.08, risk: "LOW_RISK" },
    { facility_id: "F002", closing_stock: 320, days_of_stock_remaining: 9.8, stockout_probability: 0.12, risk: "LOW_RISK" },
    { facility_id: "F003", closing_stock: 180, days_of_stock_remaining: 6.2, stockout_probability: 0.22, risk: "LOW_RISK" },
    { facility_id: "F004", closing_stock: 0, days_of_stock_remaining: 0, stockout_probability: 0.94, risk: "HIGH_RISK" },
    { facility_id: "F009", closing_stock: 210, days_of_stock_remaining: 12.0, stockout_probability: 0.05, risk: "LOW_RISK" },
    { facility_id: "F010", closing_stock: 85, days_of_stock_remaining: 3.5, stockout_probability: 0.42, risk: "LOW_RISK" }
  ],
  "M002": [
    { facility_id: "F001", closing_stock: 190, days_of_stock_remaining: 5.4, stockout_probability: 0.35, risk: "LOW_RISK" },
    { facility_id: "F002", closing_stock: 15, days_of_stock_remaining: 0.8, stockout_probability: 0.86, risk: "HIGH_RISK" },
    { facility_id: "F003", closing_stock: 220, days_of_stock_remaining: 8.5, stockout_probability: 0.15, risk: "LOW_RISK" },
    { facility_id: "F009", closing_stock: 0, days_of_stock_remaining: 0, stockout_probability: 0.98, risk: "HIGH_RISK" }
  ],
  "M003": [
    { facility_id: "F001", closing_stock: 520, days_of_stock_remaining: 18.0, stockout_probability: 0.04, risk: "LOW_RISK" },
    { facility_id: "F002", closing_stock: 240, days_of_stock_remaining: 7.5, stockout_probability: 0.18, risk: "LOW_RISK" },
    { facility_id: "F005", closing_stock: 110, days_of_stock_remaining: 5.0, stockout_probability: 0.28, risk: "LOW_RISK" },
    { facility_id: "F010", closing_stock: 310, days_of_stock_remaining: 15.2, stockout_probability: 0.06, risk: "LOW_RISK" }
  ],
  "M004": [
    { facility_id: "F001", closing_stock: 310, days_of_stock_remaining: 12.4, stockout_probability: 0.09, risk: "LOW_RISK" },
    { facility_id: "F003", closing_stock: 140, days_of_stock_remaining: 6.0, stockout_probability: 0.25, risk: "LOW_RISK" },
    { facility_id: "F009", closing_stock: 80, days_of_stock_remaining: 3.2, stockout_probability: 0.48, risk: "LOW_RISK" }
  ],
  "M005": [
    { facility_id: "F001", closing_stock: 28, days_of_stock_remaining: 1.2, stockout_probability: 0.78, risk: "HIGH_RISK" },
    { facility_id: "F002", closing_stock: 290, days_of_stock_remaining: 11.0, stockout_probability: 0.11, risk: "LOW_RISK" },
    { facility_id: "F004", closing_stock: 0, days_of_stock_remaining: 0, stockout_probability: 0.95, risk: "HIGH_RISK" },
    { facility_id: "F010", closing_stock: 145, days_of_stock_remaining: 7.0, stockout_probability: 0.19, risk: "LOW_RISK" }
  ],
  "M006": [
    { facility_id: "F001", closing_stock: 240, days_of_stock_remaining: 9.0, stockout_probability: 0.14, risk: "LOW_RISK" },
    { facility_id: "F002", closing_stock: 210, days_of_stock_remaining: 8.2, stockout_probability: 0.16, risk: "LOW_RISK" },
    { facility_id: "F006", closing_stock: 160, days_of_stock_remaining: 6.5, stockout_probability: 0.20, risk: "LOW_RISK" },
    { facility_id: "F009", closing_stock: 350, days_of_stock_remaining: 16.0, stockout_probability: 0.05, risk: "LOW_RISK" }
  ],
  "M007": [
    { facility_id: "F001", closing_stock: 340, days_of_stock_remaining: 13.0, stockout_probability: 0.07, risk: "LOW_RISK" },
    { facility_id: "F003", closing_stock: 190, days_of_stock_remaining: 7.4, stockout_probability: 0.17, risk: "LOW_RISK" },
    { facility_id: "F007", closing_stock: 0, days_of_stock_remaining: 0, stockout_probability: 0.92, risk: "HIGH_RISK" }
  ],
  "M008": [
    { facility_id: "F001", closing_stock: 580, days_of_stock_remaining: 19.5, stockout_probability: 0.03, risk: "LOW_RISK" },
    { facility_id: "F002", closing_stock: 490, days_of_stock_remaining: 16.0, stockout_probability: 0.05, risk: "LOW_RISK" },
    { facility_id: "F003", closing_stock: 310, days_of_stock_remaining: 11.0, stockout_probability: 0.10, risk: "LOW_RISK" },
    { facility_id: "F009", closing_stock: 620, days_of_stock_remaining: 22.0, stockout_probability: 0.02, risk: "LOW_RISK" }
  ],
  "M009": [
    { facility_id: "F001", closing_stock: 330, days_of_stock_remaining: 11.2, stockout_probability: 0.10, risk: "LOW_RISK" },
    { facility_id: "F004", closing_stock: 42, days_of_stock_remaining: 1.8, stockout_probability: 0.74, risk: "HIGH_RISK" },
    { facility_id: "F008", closing_stock: 120, days_of_stock_remaining: 5.5, stockout_probability: 0.26, risk: "LOW_RISK" },
    { facility_id: "F010", closing_stock: 240, days_of_stock_remaining: 9.5, stockout_probability: 0.13, risk: "LOW_RISK" }
  ],
  "M010": [
    { facility_id: "F001", closing_stock: 140, days_of_stock_remaining: 7.8, stockout_probability: 0.15, risk: "LOW_RISK" },
    { facility_id: "F002", closing_stock: 115, days_of_stock_remaining: 6.2, stockout_probability: 0.21, risk: "LOW_RISK" },
    { facility_id: "F009", closing_stock: 28, days_of_stock_remaining: 1.1, stockout_probability: 0.81, risk: "HIGH_RISK" }
  ]
};

// Generates 30-day realistic inventory trajectory for chart rendering
export function generateMockHistory(facility_id, medicine_id, days = 30) {
  const history = [];
  const today = new Date();
  let baseStock = 280;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const received = (i % 7 === 0) ? Math.floor(Math.random() * 80) + 120 : 0;
    const dispensed = Math.floor(Math.random() * 25) + 15;
    const opening = baseStock;
    const closing = Math.max(0, opening + received - dispensed);
    baseStock = closing;

    history.push({
      date: dateStr,
      opening_stock: opening,
      received_quantity: received,
      dispensed_quantity: dispensed,
      closing_stock: closing,
      days_since_restock: (i % 7)
    });
  }

  return history;
}

export const MOCK_SUMMARY = {
  total_facilities: 10,
  total_medicines: 10,
  as_of_date: new Date().toISOString().slice(0, 10),
  high_risk_count: 5,
  stockout_count: 3,
  critical_alerts: [
    {
      facility_id: "F004",
      facility_name: "Synthetic CHC F004",
      medicine_id: "M001",
      medicine_name: "Paracetamol 500mg",
      closing_stock: 0,
      stockout_probability: 0.94,
      risk: "HIGH_RISK"
    },
    {
      facility_id: "F009",
      facility_name: "Synthetic Pharmacy F009",
      medicine_id: "M002",
      medicine_name: "Amoxicillin 500mg",
      closing_stock: 0,
      stockout_probability: 0.98,
      risk: "HIGH_RISK"
    },
    {
      facility_id: "F002",
      facility_name: "Synthetic District Hospital F002",
      medicine_id: "M002",
      medicine_name: "Amoxicillin 500mg",
      closing_stock: 15,
      stockout_probability: 0.86,
      risk: "HIGH_RISK"
    },
    {
      facility_id: "F004",
      facility_name: "Synthetic CHC F004",
      medicine_id: "M005",
      medicine_name: "Azithromycin 500mg",
      closing_stock: 0,
      stockout_probability: 0.95,
      risk: "HIGH_RISK"
    },
    {
      facility_id: "F009",
      facility_name: "Synthetic Pharmacy F009",
      medicine_id: "M010",
      medicine_name: "Atorvastatin 10mg",
      closing_stock: 28,
      stockout_probability: 0.81,
      risk: "HIGH_RISK"
    }
  ]
};

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Critical Stockout Forecast",
    message: "Synthetic CHC F004 has run out of Paracetamol 500mg. Alternative stock available at District Hospital F001 (450 units).",
    type: "critical",
    timestamp: "20 minutes ago",
    read: false,
    link: "#/medicine/M001"
  },
  {
    id: "notif-2",
    title: "Antibiotic Restock Alert",
    message: "Amoxicillin 500mg has reached critical reserve (15 units) at District Hospital F002. High probability of shortage within 24 hours.",
    type: "warning",
    timestamp: "2 hours ago",
    read: false,
    link: "#/medicine/M002"
  },
  {
    id: "notif-3",
    title: "New Facility Added to Network",
    message: "Synthetic Pharmacy F010 in BTM Layout is now connected for live stock telemetry and availability inquiries.",
    type: "info",
    timestamp: "1 day ago",
    read: true,
    link: "#/pharmacies"
  },
  {
    id: "notif-4",
    title: "Supply Chain Telemetry Online",
    message: "Real-time automated AI predictions updated for all 10 essential therapeutic catalog medicines.",
    type: "info",
    timestamp: "2 days ago",
    read: true,
    link: "#/dashboard"
  }
];
