(function () {
  function safeCreateIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(type, title, message) {
    const container = ensureToastContainer();
    const tone = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const iconMap = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };
    const toast = document.createElement('div');

    toast.className = 'toast toast-' + tone;
    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${iconMap[tone]}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" type="button" aria-label="Close notification">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);
    safeCreateIcons();

    setTimeout(() => {
      if (!toast.isConnected) {
        return;
      }
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.safeCreateIcons = safeCreateIcons;
  window.showToast = showToast;

  document.addEventListener('DOMContentLoaded', safeCreateIcons);
})();
