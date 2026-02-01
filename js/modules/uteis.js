export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function isCurrentMonth(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

export function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
}

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icons based on type
    let icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'warning') icon = 'alert-triangle';
    if (type === 'info') icon = 'info';

    toast.innerHTML = `
        <div class="toast-icon ${type}">
            <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${sanitizeInput(message)}</div>
        </div>
    `;

    container.appendChild(toast);

    // Initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
