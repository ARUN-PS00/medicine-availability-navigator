/**
 * Modal Component
 * Accessible dialog window with backdrop dismissal and focus management.
 */

export class Modal {
  constructor({ title = '', content = '', footer = '', onClose = null } = {}) {
    this.title = title;
    this.content = content;
    this.footer = footer;
    this.onClose = onClose;
    this.element = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  render() {
    const modalWrapper = document.createElement('div');
    modalWrapper.className = 'modal-overlay';
    modalWrapper.id = 'active-modal-overlay';

    modalWrapper.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 id="modal-title" style="font-size: 1.25rem; font-weight: 700; color: var(--slate-900);">
            ${this.title}
          </h3>
          <button type="button" class="btn-ghost btn-icon close-modal-btn" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          ${this.content}
        </div>

        ${this.footer ? `<div class="modal-footer">${this.footer}</div>` : ''}
      </div>
    `;

    // Event listeners
    modalWrapper.addEventListener('click', (e) => {
      if (e.target === modalWrapper || e.target.closest('.close-modal-btn')) {
        this.close();
      }
    });

    this.element = modalWrapper;
    return modalWrapper;
  }

  open() {
    if (!this.element) {
      this.render();
    }
    document.body.appendChild(this.element);
    // Trigger transition
    requestAnimationFrame(() => {
      this.element.classList.add('open');
    });

    document.addEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.element) return;
    this.element.classList.remove('open');
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';

    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
      if (this.onClose) this.onClose();
    }, 250);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }
}
