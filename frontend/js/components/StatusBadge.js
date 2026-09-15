/**
 * StatusBadge Component
 * Renders color-coded availability and risk indicators.
 */

export function renderStatusBadge(statusType, label = null) {
  let badgeClass = 'badge-instock';
  let defaultLabel = 'In Stock';

  const normalized = (statusType || '').toUpperCase();

  if (normalized === 'HIGH_RISK' || normalized === 'STOCKOUT' || normalized === 'CRITICAL') {
    badgeClass = 'badge-stockout';
    defaultLabel = normalized === 'STOCKOUT' ? 'Out of Stock' : 'Stockout Risk';
  } else if (normalized === 'LOW_STOCK' || normalized === 'LOW_RISK_WARN' || normalized === 'WARNING') {
    badgeClass = 'badge-lowstock';
    defaultLabel = 'Low Stock';
  } else if (normalized === 'IN_STOCK' || normalized === 'LOW_RISK' || normalized === 'AVAILABLE') {
    badgeClass = 'badge-instock';
    defaultLabel = 'In Stock';
  } else {
    badgeClass = 'badge-slate';
    defaultLabel = statusType || 'Unknown';
  }

  return `
    <span class="badge ${badgeClass}">
      <span class="badge-dot"></span>
      <span>${label || defaultLabel}</span>
    </span>
  `;
}
