/**
 * MAP API Client
 * 
 * Interacts directly with the authoritative FastAPI backend:
 * - GET /health
 * - GET /facilities
 * - GET /medicines
 * - GET /inventory/{facility_id}/{medicine_id}
 * - GET /predict/{facility_id}/{medicine_id}
 * - GET /dashboard/summary
 * 
 * Gracefully falls back to mockData when the backend is offline or Supabase
 * credentials are not configured.
 */

import {
  MOCK_FACILITIES,
  MOCK_MEDICINES,
  MOCK_FACILITY_INVENTORY,
  generateMockHistory,
  MOCK_SUMMARY
} from './mockData.js';

const API_BASE_URL = window.MAP_API_BASE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 2500;

class ApiClient {
  constructor() {
    this.isBackendAvailable = null;
  }

  async fetchWithTimeout(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      this.isBackendAvailable = true;
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      this.isBackendAvailable = false;
      throw err;
    }
  }

  // Health Check
  async getHealth() {
    try {
      return await this.fetchWithTimeout('/health');
    } catch (e) {
      return { status: "offline", model_loaded: false, using_mock: true };
    }
  }

  // Facilities
  async getFacilities(type = null) {
    try {
      const endpoint = type ? `/facilities?type=${encodeURIComponent(type)}` : '/facilities';
      const data = await this.fetchWithTimeout(endpoint);
      // Merge with address & open_hours if available
      return data.map(f => {
        const mockMatch = MOCK_FACILITIES.find(m => m.id === f.id);
        return {
          ...f,
          address: mockMatch ? mockMatch.address : "Healthcare Facility Outpost",
          phone: mockMatch ? mockMatch.phone : "+91 80 2000 0000",
          open_hours: mockMatch ? mockMatch.open_hours : "09:00 AM - 05:00 PM"
        };
      });
    } catch (e) {
      console.info("[MAP API Client] Using mock facilities (backend offline or unconfigured).");
      if (type) {
        return MOCK_FACILITIES.filter(f => f.type.toLowerCase() === type.toLowerCase());
      }
      return MOCK_FACILITIES;
    }
  }

  // Medicines catalog
  async getMedicines() {
    try {
      const data = await this.fetchWithTimeout('/medicines');
      // Enrich backend medicine list with presentation metadata
      return data.map(m => {
        const enriched = MOCK_MEDICINES.find(item => item.id === m.id) || {};
        return {
          id: m.id,
          name: m.name,
          category: enriched.category || "General Therapeutic",
          dosage_form: enriched.dosage_form || "Tablet / Capsule",
          manufacturer: enriched.manufacturer || "Generic Pharmaceutical Manufacturer",
          composition: enriched.composition || m.name,
          description: enriched.description || "Essential therapeutic medicine formulated for clinical intervention.",
          precaution_warning: enriched.precaution_warning || "Use only under guidance of a licensed healthcare practitioner."
        };
      });
    } catch (e) {
      console.info("[MAP API Client] Using mock medicine catalog (backend offline or unconfigured).");
      return MOCK_MEDICINES;
    }
  }

  // Single medicine details by ID
  async getMedicineById(medicineId) {
    const medicines = await this.getMedicines();
    return medicines.find(m => m.id === medicineId) || null;
  }

  // Inventory records
  async getInventory(facilityId, medicineId, days = 30) {
    try {
      return await this.fetchWithTimeout(`/inventory/${encodeURIComponent(facilityId)}/${encodeURIComponent(medicineId)}?days=${days}`);
    } catch (e) {
      console.info(`[MAP API Client] Generating mock inventory history for ${facilityId}/${medicineId}.`);
      const fac = MOCK_FACILITIES.find(f => f.id === facilityId) || { name: facilityId };
      const med = MOCK_MEDICINES.find(m => m.id === medicineId) || { name: medicineId };
      const history = generateMockHistory(facilityId, medicineId, days);

      return {
        facility_id: facilityId,
        facility_name: fac.name,
        medicine_id: medicineId,
        medicine_name: med.name,
        record_count: history.length,
        history: history
      };
    }
  }

  // ML Stockout Prediction for facility & medicine
  async getPrediction(facilityId, medicineId) {
    try {
      return await this.fetchWithTimeout(`/predict/${encodeURIComponent(facilityId)}/${encodeURIComponent(medicineId)}`);
    } catch (e) {
      console.info(`[MAP API Client] Using mock prediction for ${facilityId}/${medicineId}.`);
      const fac = MOCK_FACILITIES.find(f => f.id === facilityId) || { name: facilityId, type: "Pharmacy" };
      const med = MOCK_MEDICINES.find(m => m.id === medicineId) || { name: medicineId };
      
      const invList = MOCK_FACILITY_INVENTORY[medicineId] || [];
      const match = invList.find(i => i.facility_id === facilityId);

      return {
        facility_id: facilityId,
        facility_name: fac.name,
        facility_type: fac.type,
        medicine_id: medicineId,
        medicine_name: med.name,
        as_of_date: new Date().toISOString().slice(0, 10),
        stockout_probability: match ? match.stockout_probability : 0.15,
        risk: match ? match.risk : "LOW_RISK",
        days_of_stock_remaining: match ? match.days_of_stock_remaining : 8.5,
        closing_stock: match ? match.closing_stock : 120
      };
    }
  }

  // Dashboard summary metrics & critical alerts
  async getDashboardSummary() {
    try {
      return await this.fetchWithTimeout('/dashboard/summary');
    } catch (e) {
      console.info("[MAP API Client] Using mock dashboard summary (backend offline or unconfigured).");
      return MOCK_SUMMARY;
    }
  }

  // Availability across all facilities for a single medicine
  async getAvailabilityAcrossFacilities(medicineId) {
    const facilities = await this.getFacilities();
    const inventoryList = MOCK_FACILITY_INVENTORY[medicineId] || [];

    return facilities.map(fac => {
      const inv = inventoryList.find(item => item.facility_id === fac.id);
      if (inv) {
        return {
          facility_id: fac.id,
          facility_name: fac.name,
          facility_type: fac.type,
          address: fac.address,
          closing_stock: inv.closing_stock,
          days_of_stock_remaining: inv.days_of_stock_remaining,
          stockout_probability: inv.stockout_probability,
          risk: inv.risk,
          is_available: inv.closing_stock > 0
        };
      }
      return {
        facility_id: fac.id,
        facility_name: fac.name,
        facility_type: fac.type,
        address: fac.address,
        closing_stock: 0,
        days_of_stock_remaining: 0,
        stockout_probability: 0.90,
        risk: "HIGH_RISK",
        is_available: false
      };
    });
  }
}

export const api = new ApiClient();
