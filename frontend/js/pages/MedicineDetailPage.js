/**
 * MedicineDetailPage Component
 * Clinical specifications, facility inventory matrix, 30-day stock trajectory chart,
 * precautions, and bookmarking.
 */

import { api } from '../api/client.js';
import { state } from '../state.js';
import { MOCK_FACILITIES } from '../api/mockData.js';
import { renderStatusBadge } from '../components/StatusBadge.js';
import { renderErrorAlert } from '../components/ErrorAlert.js';
import { renderTableSkeleton } from '../components/SkeletonLoader.js';

export async function renderMedicineDetailPage(containerElement, params) {
  const medicineId = params.id;

  if (!medicineId) {
    containerElement.innerHTML = `
      <div class="container" style="padding: 3rem 0;">
        ${renderErrorAlert("No medicine specified. Please select a medicine from the search page.", {
          retryAction: () => window.location.hash = '#/search',
          retryButtonText: "Return to Medicine Search"
        })}
      </div>
    `;
    return;
  }

  // Record in recently viewed
  state.addRecent(medicineId);

  containerElement.innerHTML = `
    <div class="container animate-fade-in" id="medicine-detail-view">
      <!-- Breadcrumb & Back -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <a href="#/search" class="btn btn-ghost btn-sm" style="color: var(--slate-600);">
          &larr; Back to Catalog
        </a>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.8125rem; color: var(--slate-400);">Catalog Code: <strong>${escapeHtml(medicineId)}</strong></span>
          <button id="detail-bookmark-btn" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 0.4rem;">
            <svg id="detail-bookmark-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span id="detail-bookmark-label">Save</span>
          </button>
        </div>
      </div>

      <!-- Main Detail Split Layout -->
      <div class="medicine-detail-grid">
        <!-- Left: Clinical Info & Facility Availability Table -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <!-- Spec Header Card -->
          <div class="detail-header-card" id="medicine-spec-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
              <div>
                <span class="badge badge-primary" id="med-category-badge" style="margin-bottom: 0.5rem;">
                  Loading...
                </span>
                <h1 id="med-title" style="font-size: 2rem; color: var(--slate-900); margin-bottom: 0.5rem;">
                  Loading Medicine Profile...
                </h1>
                <p id="med-description" style="color: var(--slate-600); font-size: 0.9375rem; line-height: 1.5;">
                  Fetching therapeutic indications and dispensary records.
                </p>
              </div>
              <div id="med-overall-badge">
                ${renderStatusBadge('IN_STOCK')}
              </div>
            </div>

            <!-- Technical Attributes Grid -->
            <div class="detail-specs-grid">
              <div class="spec-item">
                <span class="spec-label">Dosage Form</span>
                <span class="spec-value" id="med-dosage">--</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Manufacturer</span>
                <span class="spec-value" id="med-manufacturer">--</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Active Composition</span>
                <span class="spec-value" id="med-composition">--</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Schedule & Class</span>
                <span class="spec-value">Essential Drug (Schedule H)</span>
              </div>
            </div>

            <!-- Precautionary Warning Box -->
            <div class="precaution-box" id="med-precaution-box">
              <svg style="flex-shrink: 0; margin-top: 2px;" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <div id="med-precaution-text">
                Always consult your prescribing doctor or clinical pharmacist before taking medication.
              </div>
            </div>
          </div>

          <!-- Facility Availability Table -->
          <div class="card" style="padding: 1.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <div>
                <h3 style="font-size: 1.25rem;">Dispensary Stock Availability</h3>
                <p style="font-size: 0.8125rem; color: var(--slate-500);">Current closing stock and ML shortage forecast by health facility</p>
              </div>
            </div>

            <div class="facility-table-container" id="facility-table-wrapper">
              ${renderTableSkeleton(4)}
            </div>
          </div>
        </div>

        <!-- Right Column: 30-Day Inventory Trajectory & AI Prediction -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <!-- AI Prediction Card -->
          <div class="card" style="background: linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%); border-color: var(--primary-200);">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <svg style="color: var(--primary-600);" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <h4 style="font-size: 1.125rem;">AI Supply Risk Assessment</h4>
            </div>

            <p style="font-size: 0.875rem; color: var(--slate-600); margin-bottom: 1rem;">
              Operational forecasting evaluating dispense velocity and restock cycle across primary facilities.
            </p>

            <div style="display: flex; flex-direction: column; gap: 0.75rem;" id="ai-prediction-metrics">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--slate-200);">
                <span style="font-size: 0.875rem; color: var(--slate-600);">Next-Day Shortage Probability</span>
                <span id="pred-proba" style="font-weight: 700; color: var(--slate-900);">--</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--slate-200);">
                <span style="font-size: 0.875rem; color: var(--slate-600);">Buffer Stock Remaining</span>
                <span id="pred-days" style="font-weight: 700; color: var(--slate-900);">-- days</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
                <span style="font-size: 0.875rem; color: var(--slate-600);">Network Supply Status</span>
                <span id="pred-status">--</span>
              </div>
            </div>
          </div>

          <!-- 30-Day Historical Trend Graph Card -->
          <div class="card" style="padding: 1.5rem;">
            <div class="chart-header">
              <div>
                <h4 style="font-size: 1.125rem;">30-Day Stock Trajectory</h4>
                <p style="font-size: 0.8125rem; color: var(--slate-500);">Historical daily closing units at primary hospital</p>
              </div>
            </div>

            <div style="position: relative; width: 100%; height: 200px;">
              <canvas id="stock-trajectory-canvas" width="400" height="200" class="chart-canvas"></canvas>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--slate-400); margin-top: 0.5rem;">
              <span>30 Days Ago</span>
              <span id="chart-date-latest">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bookmark button state & toggle
  const bookmarkBtn = containerElement.querySelector('#detail-bookmark-btn');
  const bookmarkIcon = containerElement.querySelector('#detail-bookmark-icon');
  const bookmarkLabel = containerElement.querySelector('#detail-bookmark-label');

  const updateBookmarkUI = () => {
    const isSaved = state.isSaved(medicineId);
    if (isSaved) {
      bookmarkIcon.setAttribute('fill', '#e11d48');
      bookmarkIcon.style.color = '#e11d48';
      bookmarkLabel.textContent = 'Saved';
      bookmarkBtn.classList.add('btn-primary');
      bookmarkBtn.classList.remove('btn-outline');
    } else {
      bookmarkIcon.setAttribute('fill', 'none');
      bookmarkIcon.style.color = 'currentColor';
      bookmarkLabel.textContent = 'Save';
      bookmarkBtn.classList.remove('btn-primary');
      bookmarkBtn.classList.add('btn-outline');
    }
  };

  updateBookmarkUI();
  bookmarkBtn.addEventListener('click', () => {
    state.toggleSave(medicineId);
    updateBookmarkUI();
  });

  // Fetch Medicine Details & Facilities Availability
  try {
    const medicine = await api.getMedicineById(medicineId);
    if (!medicine) {
      containerElement.innerHTML = `
        <div class="container" style="padding: 3rem 0;">
          ${renderErrorAlert(`Medicine "${medicineId}" not found in catalog.`, {
            retryAction: () => window.location.hash = '#/search',
            retryButtonText: "Back to Search"
          })}
        </div>
      `;
      return;
    }

    // Populate Medicine Spec Header
    containerElement.querySelector('#med-title').textContent = medicine.name;
    containerElement.querySelector('#med-category-badge').textContent = medicine.category || 'Essential Medicine';
    containerElement.querySelector('#med-description').textContent = medicine.description || '';
    containerElement.querySelector('#med-dosage').textContent = medicine.dosage_form || 'Tablet / Oral';
    containerElement.querySelector('#med-manufacturer').textContent = medicine.manufacturer || 'Approved Provider';
    containerElement.querySelector('#med-composition').textContent = medicine.composition || medicine.name;
    containerElement.querySelector('#med-precaution-text').textContent = medicine.precaution_warning || 'Consult doctor before use.';

    // Fetch Availability across facilities
    const availabilityList = await api.getAvailabilityAcrossFacilities(medicineId);

    // Determine overall status
    const inStockCount = availabilityList.filter(a => a.is_available).length;
    const overallStatus = inStockCount === 0 ? 'STOCKOUT' : (inStockCount < 2 ? 'LOW_STOCK' : 'IN_STOCK');
    containerElement.querySelector('#med-overall-badge').innerHTML = renderStatusBadge(overallStatus);

    // Populate Facility Availability Table
    const tableWrapper = containerElement.querySelector('#facility-table-wrapper');
    if (availabilityList.length === 0) {
      tableWrapper.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted);">No facilities currently report stock for this medication.</div>`;
    } else {
      tableWrapper.innerHTML = `
        <table class="facility-table">
          <thead>
            <tr>
              <th>Healthcare Facility</th>
              <th>Facility Type</th>
              <th>Current Stock</th>
              <th>Buffer Days</th>
              <th>Risk Level</th>
              <th>Directions</th>
            </tr>
          </thead>
          <tbody>
            ${availabilityList.map(item => {
              const facMatch = MOCK_FACILITIES.find(f => f.id === item.facility_id) || {};
              const lat = facMatch.latitude || 12.9716;
              const lng = facMatch.longitude || 77.5946;
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

              return `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--slate-900);">${escapeHtml(item.facility_name)}</div>
                    <div style="font-size: 0.75rem; color: var(--slate-500);">${escapeHtml(item.address || 'Facility Node')}</div>
                  </td>
                  <td>
                    <span class="badge badge-slate" style="font-size: 0.7rem;">${escapeHtml(item.facility_type)}</span>
                  </td>
                  <td>
                    <strong style="font-size: 0.9375rem; color: ${item.closing_stock > 0 ? 'var(--slate-800)' : 'var(--status-stockout-text)'};">
                      ${item.closing_stock} units
                    </strong>
                  </td>
                  <td>
                    <span style="font-weight: 500;">${item.days_of_stock_remaining > 0 ? item.days_of_stock_remaining + ' days' : '0 days'}</span>
                  </td>
                  <td>
                    ${renderStatusBadge(item.risk)}
                  </td>
                  <td>
                    <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="text-decoration: none; padding: 3px 8px; font-size: 0.72rem;">
                      🧭 DIRECTIONS
                    </a>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // Fetch Prediction for primary facility (F001)
    const prediction = await api.getPrediction('F001', medicineId);
    if (prediction) {
      const probPercent = Math.round((prediction.stockout_probability || 0.1) * 100);
      containerElement.querySelector('#pred-proba').textContent = `${probPercent}%`;
      containerElement.querySelector('#pred-days').textContent = `${prediction.days_of_stock_remaining || 8.5} days`;
      containerElement.querySelector('#pred-status').innerHTML = renderStatusBadge(prediction.risk);
    }

    // Fetch Inventory History & Render Chart
    const invData = await api.getInventory('F001', medicineId, 30);
    const history = invData.history || [];
    renderInventoryCanvasChart(containerElement.querySelector('#stock-trajectory-canvas'), history);

  } catch (err) {
    console.error("Error loading medicine detail page:", err);
  }
}

/**
 * Render smooth responsive area chart on HTML5 Canvas without external dependencies
 */
function renderInventoryCanvasChart(canvas, history) {
  if (!canvas || !history || history.length === 0) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 20, right: 15, bottom: 25, left: 35 };

  const values = history.map(d => d.closing_stock);
  const maxVal = Math.max(...values, 100) * 1.15;
  const minVal = 0;

  ctx.clearRect(0, 0, w, h);

  // Draw Horizontal Gridlines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = '#94a3b8';

  const gridSteps = 3;
  for (let i = 0; i <= gridSteps; i++) {
    const yVal = minVal + (maxVal - minVal) * (i / gridSteps);
    const yPos = h - padding.bottom - (i / gridSteps) * (h - padding.top - padding.bottom);

    ctx.beginPath();
    ctx.moveTo(padding.left, yPos);
    ctx.lineTo(w - padding.right, yPos);
    ctx.stroke();

    ctx.fillText(Math.round(yVal).toString(), 4, yPos + 3);
  }

  // Calculate Points
  const points = [];
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  for (let i = 0; i < values.length; i++) {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = h - padding.bottom - ((values[i] - minVal) / (maxVal - minVal)) * chartH;
    points.push({ x, y });
  }

  // Draw Gradient Fill Area
  const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
  gradient.addColorStop(0, 'rgba(13, 148, 136, 0.35)');
  gradient.addColorStop(1, 'rgba(13, 148, 136, 0.0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, h - padding.bottom);
  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw Trend Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw current point pulse dot
  const lastPoint = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#0d9488';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
