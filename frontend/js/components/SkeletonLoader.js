/**
 * SkeletonLoader Component
 * Renders shimmering placeholders while asynchronous data loads.
 */

export function renderMedicineCardSkeleton(count = 6) {
  return Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="skeleton" style="height: 1.25rem; width: 30%; border-radius: var(--radius-full);"></div>
        <div class="skeleton" style="height: 1.5rem; width: 1.5rem; border-radius: 50%;"></div>
      </div>
      <div class="skeleton skeleton-title" style="margin-top: 0.5rem;"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
      <div style="margin-top: auto; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div class="skeleton" style="height: 1.25rem; width: 35%; border-radius: var(--radius-full);"></div>
        <div class="skeleton" style="height: 2rem; width: 5rem; border-radius: var(--radius-md);"></div>
      </div>
    </div>
  `).join('');
}

export function renderTableSkeleton(rows = 4) {
  return `
    <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem;">
      ${Array.from({ length: rows }).map(() => `
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div class="skeleton" style="height: 1.25rem; flex: 2;"></div>
          <div class="skeleton" style="height: 1.25rem; flex: 1;"></div>
          <div class="skeleton" style="height: 1.25rem; flex: 1;"></div>
          <div class="skeleton" style="height: 1.25rem; flex: 1;"></div>
        </div>
      `).join('')}
    </div>
  `;
}
