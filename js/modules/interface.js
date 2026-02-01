import { formatCurrency, showToast, isValidDate, sanitizeInput } from './uteis.js';
import * as Consultas from './consultas.js';
import * as Comandos from './comandos.js';
import * as Relatorios from './relatorios.js';
import * as Notificacoes from './notificacoes.js';
import * as ProfileInterface from './profileInterface.js';

let charts = {};
let reportCharts = {};
const sidebar = document.getElementById('sidebar');

export function init() {
    // Inicializar sistema de perfis
    ProfileInterface.initProfileInterface();

    // Check Notifications on load
    runSmartChecks();
    Notificacoes.updateBadge(); // Initial badge sync

    setupEventListeners();

    // Load category options
    loadCategoryOptions('tx-category');
    loadCategoryOptions('budget-category');

    // Atualizar dashboard se houver perfil ativo
    const activeProfile = document.querySelector('#app:not(.hidden)');
    if (activeProfile) {
        updateDashboard();
    }

    if (window.lucide) window.lucide.createIcons();

    // Listener para mudança de perfil
    document.addEventListener('profileChanged', () => {
        updateDashboard();
        Notificacoes.updateBadge();
        runSmartChecks();

        // Reload category options when profile changes
        loadCategoryOptions('tx-category');
        loadCategoryOptions('budget-category');

        // Atualizar gerenciamento de perfis se estiver visível
        if (!document.getElementById('view-profiles')?.classList.contains('hidden')) {
            ProfileInterface.renderProfilesManagement();
        }
    });

    // Expor router globalmente para ser usado por outros módulos
    window.router = router;
}

// Função para carregar as opções de categoria no select
export function loadCategoryOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const validCategories = Comandos.getValidCategories();
    select.innerHTML = '';

    validCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

// Função para renderizar categorias personalizadas na UI
export function renderCustomCategories() {
    const data = getAppData();
    const listContainer = document.getElementById('custom-categories-list');
    const noCategoriesDiv = document.getElementById('no-custom-categories');

    listContainer.innerHTML = '';

    if (data.categories.length === 0) {
        noCategoriesDiv.classList.remove('hidden');
        return;
    }

    noCategoriesDiv.classList.add('hidden');

    data.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'flex justify-between items-center p-2 bg-dark rounded';
        categoryDiv.innerHTML = `
            <span>${category}</span>
            <div class="flex gap-1">
                <button class="btn-icon-sm text-muted" data-action="edit-category" data-category="${category}">
                    <i data-lucide="pencil" style="width: 14px;"></i>
                </button>
                <button class="btn-icon-sm text-red" data-action="delete-category" data-category="${category}">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(categoryDiv);
    });

    // Adicionar event listeners para editar e deletar
    listContainer.querySelectorAll('[data-action="edit-category"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            const newName = prompt('Digite o novo nome da categoria:', category);
            if (newName && newName.trim() !== category) {
                if (Comandos.editCategory(category, newName.trim())) {
                    showToast('Categoria atualizada com sucesso!');
                    renderCustomCategories();
                    loadCategoryOptions('tx-category');
                    loadCategoryOptions('budget-category');
                } else {
                    showToast('Erro ao atualizar categoria');
                }
            }
        });
    });

    listContainer.querySelectorAll('[data-action="delete-category"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            if (confirm(`Deseja realmente deletar a categoria "${category}"?`)) {
                if (Comandos.deleteCategory(category)) {
                    showToast('Categoria deletada com sucesso!');
                    renderCustomCategories();
                    loadCategoryOptions('tx-category');
                    loadCategoryOptions('budget-category');
                    renderTransactions();
                    renderBudgets();
                    updateDashboard();
                } else {
                    showToast('Erro ao deletar categoria');
                }
            }
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

// Funções para abrir/fechar modal de categorias
export function openCategoriesModal() {
    document.getElementById('modal-categories').classList.remove('hidden');
    renderCustomCategories();
}

export function closeCategoriesModal() {
    document.getElementById('modal-categories').classList.add('hidden');
}

function setupEventListeners() {
    // Sidebar Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn'); // Need to add this ID to HTML or select by text
    // Or we handle delegation. Let's assume I'll add the ID or use delegation.

    // Navigation (Delegation for router)
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const view = el.dataset.view;
            if (view) router(view);
        });
    });

    // Modal Triggers
    document.getElementById('open-tx-modal')?.addEventListener('click', openTransactionModal);
    document.getElementById('close-tx-modal')?.addEventListener('click', closeTransactionModal);

    document.getElementById('open-goal-modal')?.addEventListener('click', openNewGoalModal);
    document.getElementById('close-goal-modal')?.addEventListener('click', closeNewGoalModal);

    document.getElementById('close-value-modal')?.addEventListener('click', closeAddValueModal);

    // Forms
    document.getElementById('tx-form')?.addEventListener('submit', handleTxSubmit);
    document.getElementById('goal-form')?.addEventListener('submit', handleGoalSubmit);
    document.getElementById('goal-value-form')?.addEventListener('submit', handleGoalValueSubmit);

    // Search & Filter
    document.getElementById('search-tx')?.addEventListener('keyup', renderTransactions);
    document.getElementById('filter-type')?.addEventListener('change', renderTransactions);

    // Misc
    // document.getElementById('config-budgets-btn')?.addEventListener('click', () => showToast('Funcionalidade de editar orçamento em breve!'));
    document.getElementById('config-budgets-btn')?.addEventListener('click', () => openBudgetModal());
    document.getElementById('close-budget-modal')?.addEventListener('click', closeBudgetModal);
    document.getElementById('budget-form')?.addEventListener('submit', handleBudgetSubmit);

    // Categories Management
    document.getElementById('manage-categories-btn')?.addEventListener('click', openCategoriesModal);
    document.getElementById('close-categories-modal')?.addEventListener('click', closeCategoriesModal);
    document.getElementById('add-category-btn')?.addEventListener('click', () => {
        const categoryName = document.getElementById('new-category-name').value.trim();
        if (categoryName) {
            if (Comandos.addCategory(categoryName)) {
                showToast('Categoria adicionada com sucesso!');
                document.getElementById('new-category-name').value = '';
                renderCustomCategories();
                loadCategoryOptions('tx-category');
                loadCategoryOptions('budget-category');
            } else {
                showToast('Erro ao adicionar categoria');
            }
        } else {
            showToast('Nome da categoria não pode ser vazio');
        }
    });

    // Reports Listeners
    document.getElementById('report-year')?.addEventListener('change', () => renderReports());
    document.getElementById('report-month')?.addEventListener('change', () => renderReports());
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => Relatorios.exportToPDF('report-content', `Relatorio_${getCurrentDateString()}.pdf`));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        const year = parseInt(document.getElementById('report-year').value);
        const monthVal = document.getElementById('report-month').value;
        const month = monthVal === 'all' ? null : parseInt(monthVal);
        const stats = Relatorios.getReportData(year, month);
        Relatorios.exportToCSV(stats, `Relatorio_${getCurrentDateString()}.csv`);
    });

    // Notifications UI
    document.getElementById('btn-notifications')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('notif-panel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            renderNotifications(); // Refresh list when opening
        }
    });

    document.getElementById('btn-mark-read')?.addEventListener('click', (e) => {
        e.stopPropagation();
        Notificacoes.markAllAsRead();
        renderNotifications();
    });

    document.getElementById('btn-clear-all')?.addEventListener('click', (e) => {
        e.stopPropagation();
        Notificacoes.clearAll();
        renderNotifications();
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notif-panel');
        if (panel && !panel.classList.contains('hidden')) {
            if (!panel.contains(e.target) && !document.getElementById('btn-notifications').contains(e.target)) {
                panel.classList.add('hidden');
            }
        }
    });
}

function getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
}

export function router(viewName) {
    // Atualizar menu ativo
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Esconder todas as views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    // Mostrar view selecionada
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    // Atualizar título
    const titles = {
        'dashboard': 'Painel',
        'transactions': 'Transações',
        'budgets': 'Orçamentos',
        'goals': 'Metas',
        'reports': 'Relatórios',
        'profiles': 'Perfis'
    };
    document.getElementById('page-title').innerText = titles[viewName] || 'EcoFinance';

    // Ocultar botões de notificação e nova transação na view de perfis
    const btnNotifications = document.getElementById('btn-notifications');
    const btnNewTransaction = document.getElementById('open-tx-modal');

    if (viewName === 'profiles') {
        if (btnNotifications) btnNotifications.classList.add('hidden');
        if (btnNewTransaction) btnNewTransaction.classList.add('hidden');
    } else {
        if (btnNotifications) btnNotifications.classList.remove('hidden');
        if (btnNewTransaction) btnNewTransaction.classList.remove('hidden');
    }

    // Ações específicas
    if (viewName === 'dashboard') updateDashboard();
    if (viewName === 'transactions') renderTransactions();
    if (viewName === 'budgets') renderBudgets();
    if (viewName === 'goals') renderGoals();
    if (viewName === 'reports') renderReports();
    if (viewName === 'profiles') ProfileInterface.renderProfilesManagement();

    if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

// Expor router globalmente para uso em outros módulos
window.router = router;


// --- Functions exposed for general use or internal ---

export function updateDashboard() {
    const stats = Consultas.getDashboardStats();

    document.getElementById('dash-balance').innerText = formatCurrency(stats.totalBalance);
    document.getElementById('dash-income').innerText = formatCurrency(stats.monthlyIncome);
    document.getElementById('dash-expense').innerText = formatCurrency(stats.monthlyExpense);

    renderCharts();
    renderBudgetSummary();
}

function renderBudgetSummary() {
    const budgetContainer = document.getElementById('dash-budgets-list');
    if (!budgetContainer) return;
    budgetContainer.innerHTML = '';

    const currentBudgets = Consultas.getBudgetsStatus();

    currentBudgets.slice(0, 3).forEach(b => {
        const percent = Math.min((b.spent / b.limit) * 100, 100);
        let color = 'var(--color-green)';
        if (percent > 80) color = 'var(--color-orange)';
        if (percent >= 100) color = 'var(--color-red)';

        budgetContainer.innerHTML += `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span>${b.category}</span>
                    <span>${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${color};"></div>
                </div>
            </div>
        `;
    });
}

function renderCharts() {
    const ctxLine = document.getElementById('chartLine').getContext('2d');
    const ctxPie = document.getElementById('chartPie').getContext('2d');

    if (charts.line) charts.line.destroy();
    if (charts.pie) charts.pie.destroy();

    const expensesByCategory = Consultas.getExpensesByCategory();

    charts.pie = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: ['#F4A261', '#34d399', '#fb7185', '#3B82F6', '#A855F7'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#D1D5DB' } }
            }
        }
    });

    charts.line = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Receitas',
                    data: [4000, 4500, 4200, 5000, 5500, 5200],
                    borderColor: '#34d399',
                    tension: 0.4,
                    backgroundColor: 'transparent'
                },
                {
                    label: 'Despesas',
                    data: [3000, 3200, 3500, 3100, 3800, 3600],
                    borderColor: '#F4A261',
                    tension: 0.4,
                    backgroundColor: 'transparent'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { grid: { color: '#333', drawBorder: false }, ticks: { color: '#9CA3AF' } },
                x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
            },
            plugins: {
                legend: { labels: { color: '#D1D5DB' } }
            }
        }
    });
}

export function renderTransactions() {
    const list = document.getElementById('transactions-list');
    const searchInput = document.getElementById('search-tx');
    const filterInput = document.getElementById('filter-type');

    const search = searchInput ? searchInput.value : '';
    const filter = filterInput ? filterInput.value : 'all';

    list.innerHTML = '';

    const filtered = Consultas.getTransactions(filter, search);

    if (filtered.length === 0) {
        list.innerHTML = '<div class="text-center text-muted p-4">Nenhuma transação encontrada.</div>';
        return;
    }

    filtered.forEach(t => {
        const isIncome = t.type === 'income';
        const icon = isIncome ? 'arrow-down-left' : 'arrow-up-right';
        const colorClass = isIncome ? 'income' : 'expense';
        const amountClass = isIncome ? 'text-green' : 'text-orange';
        const sign = isIncome ? '+' : '-';

        const html = `
            <div class="transaction-item ${colorClass}">
                <div class="t-info">
                    <div class="t-icon">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold">${t.desc}</div>
                        <div class="text-sm text-muted">${t.category} • ${new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-bold ${amountClass}">${sign} ${formatCurrency(t.amount)}</span>
                    <button class="btn-icon text-red" data-action="delete" data-id="${t.id}">
                        <i data-lucide="trash-2" style="width: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });

    list.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('Deseja realmente excluir esta transação?')) {
                Comandos.deleteTransaction(id);
                renderTransactions();
                showToast('Transação removida.', 'error');
                updateDashboard();
            }
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

const ICONS = {
    'Alimentação': '🍔', 'Restaurante': '🍽️', 'Mercado': '🛒', 'Feira': '🥦',
    'Casa': '🏠', 'Moradia': '🏡', 'Aluguel': '🔑', 'Condomínio': 'building',
    'Transporte': '🚗', 'Combustível': '⛽', 'Uber': '🚖', 'Ônibus': '🚌',
    'Lazer': '🎉', 'Cinema': '🍿', 'Jogos': '🎮', 'Séries': '📺',
    'Saúde': '💊', 'Farmácia': '🏥', 'Médico': '👨‍⚕', 'Academia': '💪',
    'Educação': '📚', 'Curso': '🎓', 'Livros': '📖',
    'Viagem': '✈️', 'Hotel': '🏨',
    'Salário': '💰', 'Investimentos': '📈', 'Poupança': '🐷',
    'Outros': '📦'
};

function getCategoryIcon(category) {
    // Tenta encontrar correspondência direta
    if (ICONS[category]) return ICONS[category];

    // Tenta encontrar por palavra-chave
    const lowerCat = category.toLowerCase();
    for (const [key, icon] of Object.entries(ICONS)) {
        if (lowerCat.includes(key.toLowerCase())) return icon;
    }

    return '📦'; // Default
}

export function renderBudgets() {
    const container = document.getElementById('budgets-full-list');
    container.innerHTML = '';

    const currentBudgets = Consultas.getBudgetsStatus();

    if (currentBudgets.length === 0) {
        container.innerHTML = `
            <div class="text-center p-8 text-muted">
                <i data-lucide="target" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum orçamento definido.</p>
                <button class="btn-primary mt-4" id="create-first-budget-btn">Criar Primeiro Orçamento</button>
            </div>
         `;
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('create-first-budget-btn').addEventListener('click', () => {
            openBudgetModal();
        });
        return;
    }

    currentBudgets.forEach(b => {
        const percent = Math.min((b.spent / b.limit) * 100, 100);
        let color = 'var(--color-green)';
        let status = 'Confortável';

        if (percent > 60) { status = 'Moderado'; }
        if (percent > 85) { color = 'var(--color-orange)'; status = 'Atenção'; }
        if (percent >= 100) { color = 'var(--color-red)'; status = 'Crítico'; }

        const icon = getCategoryIcon(b.category);

        const html = `
            <div class="card relative-card">
                <div class="card-actions absolute top-2 right-2 flex gap-1">
                    <button class="btn-icon-sm text-muted" data-action="edit-budget" data-category="${b.category}" data-limit="${b.limit}" title="Editar">
                        <i data-lucide="pencil" style="width: 14px;"></i>
                    </button>
                    <button class="btn-icon-sm text-red" data-action="delete-budget" data-category="${b.category}" title="Excluir">
                        <i data-lucide="trash-2" style="width: 14px;"></i>
                    </button>
                </div>

                <div class="flex items-center gap-3 mb-3">
                    <div style="font-size: 2rem;">${icon}</div>
                    <div>
                        <h4 class="font-bold text-lg">${b.category}</h4>
                        <span class="text-sm text-muted">${status}</span>
                    </div>
                </div>

                <div class="flex justify-between items-end mb-1">
                    <span class="text-2xl font-bold" style="color: ${color}">${Math.round(percent)}%</span>
                    <span class="text-sm text-muted">${formatCurrency(b.spent)} de ${formatCurrency(b.limit)}</span>
                </div>
                
                <div class="progress-bar-bg" style="height: 12px;">
                    <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${color};"></div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    // Event Listeners
    container.querySelectorAll('[data-action="edit-budget"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            const limit = btn.getAttribute('data-limit');
            openBudgetModal(category, limit);
        });
    });

    container.querySelectorAll('[data-action="delete-budget"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            if (confirm(`Deseja parar de rastrear o orçamento de ${category}?`)) {
                Comandos.deleteBudget(category);
                renderBudgets();
                updateDashboard();
                showToast('Orçamento removido.');
            }
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

export function renderGoals() {
    const container = document.getElementById('goals-grid');
    container.innerHTML = '';

    const goals = Consultas.getGoals();

    goals.forEach(g => {
        const percent = Math.min((g.current / g.target) * 100, 100);

        const html = `
            <div class="card flex flex-col items-center text-center relative-card">
                 <div class="card-actions absolute top-2 right-2 flex gap-1">
                    <button class="btn-icon-sm text-muted" data-action="edit-goal" data-id="${g.id}" title="Editar">
                        <i data-lucide="pencil" style="width: 14px;"></i>
                    </button>
                    <button class="btn-icon-sm text-red" data-action="delete-goal" data-id="${g.id}" title="Excluir">
                        <i data-lucide="trash-2" style="width: 14px;"></i>
                    </button>
                </div>

                <div style="position: relative; width: 100px; height: 100px; margin-bottom: 1rem; margin-top: 1rem;">
                    <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#333" stroke-width="3" />
                        <path class="circle" stroke-dasharray="${percent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-orange)" stroke-width="3" />
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold;">
                        ${Math.round(percent)}%
                    </div>
                </div>
                <h3 class="font-bold">${g.name}</h3>
                <p class="text-sm text-muted mt-2">${formatCurrency(g.current)} de ${formatCurrency(g.target)}</p>
                <div style="margin-top: 1rem; width: 100%;">
                    <button class="btn-secondary text-sm w-full" data-action="add-goal-value" data-id="${g.id}">Adicionar Valor</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    // Event Listeners for buttons inside the cards
    container.querySelectorAll('[data-action="add-goal-value"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            openAddValueModal(id);
        });
    });

    container.querySelectorAll('[data-action="edit-goal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            openEditGoalModal(id);
        });
    });

    container.querySelectorAll('[data-action="delete-goal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('Deseja realmente excluir esta meta?')) {
                Comandos.deleteGoal(id);
                renderGoals();
                showToast('Meta removida.', 'error');
            }
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

// --- Modals Logic ---
function openTransactionModal() {
    document.getElementById('modal-tx').classList.remove('hidden');
    document.getElementById('tx-date').valueAsDate = new Date();
}

function closeTransactionModal() {
    document.getElementById('modal-tx').classList.add('hidden');
    document.getElementById('tx-form').reset();
}

function handleTxSubmit(e) {
    e.preventDefault();
    const desc = document.getElementById('tx-desc').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type').value;
    const category = document.getElementById('tx-category').value;
    const date = document.getElementById('tx-date').value;

    // Validações mais robustas
    if (!desc || desc.length < 2 || desc.length > 100) {
        showToast('Descrição deve ter entre 2 e 100 caracteres.', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
        showToast('Valor deve ser um número positivo e menor que 1 milhão.', 'error');
        return;
    }

    if (!['income', 'expense'].includes(type)) {
        showToast('Tipo de transação inválido.', 'error');
        return;
    }

    const validCategories = Comandos.getValidCategories();
    if (!validCategories.includes(category)) {
        showToast('Categoria inválida.', 'error');
        return;
    }

    if (!date || !isValidDate(date)) {
        showToast('Data inválida.', 'error');
        return;
    }

    const newTx = { desc, amount, type, category, date };

    Comandos.addTransaction(newTx);
    closeTransactionModal();
    showToast('Transação adicionada com sucesso!');
    updateDashboard(); // Always update dashboard
    runSmartChecks(); // Check for budget alerts
    if (!document.getElementById('view-transactions').classList.contains('hidden')) {
        renderTransactions();
    }
}

function openNewGoalModal() {
    document.getElementById('modal-goal').classList.remove('hidden');
    document.getElementById('goal-id').value = ''; // Reset ID for new goal
    document.querySelector('#modal-goal h3').innerText = 'Nova Meta';
    document.querySelector('#modal-goal button[type="submit"]').innerText = 'Criar Meta';
}

function openEditGoalModal(id) {
    const goal = Consultas.getGoalById(id);
    if (!goal) return;

    document.getElementById('modal-goal').classList.remove('hidden');
    document.getElementById('goal-id').value = goal.id;
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('goal-target').value = goal.target;

    document.querySelector('#modal-goal h3').innerText = 'Editar Meta';
    document.querySelector('#modal-goal button[type="submit"]').innerText = 'Salvar Alterações';
}

function closeNewGoalModal() {
    document.getElementById('modal-goal').classList.add('hidden');
    document.getElementById('goal-form').reset();
}

function handleGoalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('goal-id').value;
    const name = document.getElementById('goal-name').value.trim();
    const target = parseFloat(document.getElementById('goal-target').value);

    if (!name || name.length < 2 || name.length > 100) {
        showToast('Nome da meta deve ter entre 2 e 100 caracteres.', 'error');
        return;
    }

    if (isNaN(target) || target <= 0 || target > 1000000) {
        showToast('Valor alvo deve ser um número positivo e menor que 1 milhão.', 'error');
        return;
    }

    if (id) {
        // Edit Mode
        Comandos.updateGoal({ id: parseInt(id), name, target });
        showToast('Meta atualizada!');
    } else {
        // Create Mode
        Comandos.addGoal({ name, target, current: 0 });
        showToast('Nova meta criada!');
    }

    closeNewGoalModal();
    renderGoals();
}

function openAddValueModal(id) {
    const goal = Consultas.getGoalById(id);
    if (!goal) return;

    document.getElementById('goal-id-add').value = id;
    document.getElementById('goal-name-display').innerText = `Meta: ${goal.name}`;
    document.getElementById('modal-goal-value').classList.remove('hidden');
}

function closeAddValueModal() {
    document.getElementById('modal-goal-value').classList.add('hidden');
    document.getElementById('goal-value-form').reset();
}

function handleGoalValueSubmit(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('goal-id-add').value);
    const amount = parseFloat(document.getElementById('goal-add-amount').value);

    // Validação de valor adicionado à meta
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
        showToast('Valor deve ser um número positivo e menor que 1 milhão.', 'error');
        return;
    }

    if (Comandos.addGoalValue(id, amount)) {
        closeAddValueModal();
        renderGoals();
        showToast(`R$ ${formatCurrency(amount)} adicionado à meta!`);
        runSmartChecks(); // Check for goal completion alerts
    } else {
        showToast('Falha ao adicionar valor à meta.', 'error');
    }
}

// --- ORÇAMENTOS MODAL ---
function openBudgetModal(category = null, limit = null) {
    const modal = document.getElementById('modal-budget');
    const form = document.getElementById('budget-form');
    const title = modal.querySelector('h3');

    modal.classList.remove('hidden');

    if (category) {
        // Edit Mode
        document.getElementById('budget-original-category').value = category;
        document.getElementById('budget-category').value = category;
        document.getElementById('budget-limit').value = limit;
        // document.getElementById('budget-category').readOnly = true; // Opcional: impedir mudar nome na edição
        title.innerText = 'Editar Orçamento';
    } else {
        // Create Mode
        document.getElementById('budget-original-category').value = '';
        form.reset();
        title.innerText = 'Novo Orçamento';
    }
}

function closeBudgetModal() {
    document.getElementById('modal-budget').classList.add('hidden');
    document.getElementById('budget-form').reset();
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    const originalCategory = document.getElementById('budget-original-category').value;
    const category = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-limit').value);

    // Validação de orçamento
    if (!category) {
        showToast('Categoria é obrigatória.', 'error');
        return;
    }

    if (isNaN(limit) || limit <= 0 || limit > 1000000) {
        showToast('Limite deve ser um número positivo e menor que 1 milhão.', 'error');
        return;
    }

    const validCategories = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Viagem', 'Outros'];
    if (!validCategories.includes(category)) {
        showToast('Categoria inválida.', 'error');
        return;
    }

    if (originalCategory) {
        // Update
        if (Comandos.updateBudget(originalCategory, { category, limit })) {
            showToast('Orçamento atualizado!');
        } else {
            showToast('Erro ao atualizar.', 'error');
        }
    } else {
        // Create
        if (Comandos.addBudget({ category, limit })) {
            showToast('Orçamento criado!');
        } else {
            showToast('Categoria já existe!', 'error');
        }
    }

    closeBudgetModal();
    renderBudgets();
    updateDashboard();
    runSmartChecks(); // Check for budget alerts after update
}



// --- RELATÓRIOS ---

export function renderReports() {
    // Populate years if empty
    const yearSelect = document.getElementById('report-year');
    if (yearSelect.options.length === 0) {
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 5; i++) {
            const y = currentYear - i;
            const opt = document.createElement('option');
            opt.value = y;
            opt.innerText = y;
            yearSelect.appendChild(opt);
        }
    }

    const year = parseInt(yearSelect.value);
    const monthVal = document.getElementById('report-month').value;
    const month = monthVal === 'all' ? null : parseInt(monthVal);

    const stats = Relatorios.getReportData(year, month);

    // Update Stats Cards
    document.getElementById('report-balance').innerText = formatCurrency(stats.balance);
    document.getElementById('report-income').innerText = formatCurrency(stats.totalIncome);
    document.getElementById('report-expense').innerText = formatCurrency(stats.totalExpense);
    document.getElementById('report-savings-rate').innerText = `Taxa de Poupança: ${Math.round(stats.savingsRate)}%`;

    document.getElementById('report-top-cat').innerText = stats.topCategory;
    document.getElementById('report-top-cat-val').innerText = formatCurrency(stats.topCategoryValue);

    // Render Charts
    const ctxEvo = document.getElementById('reportChartEvolution').getContext('2d');
    const ctxCat = document.getElementById('reportChartCategory').getContext('2d');

    if (reportCharts.evo) reportCharts.evo.destroy();
    if (reportCharts.cat) reportCharts.cat.destroy();

    reportCharts.evo = new Chart(ctxEvo, Relatorios.getEvolutionChartConfig(stats, month === null));
    reportCharts.cat = new Chart(ctxCat, Relatorios.getCategoryChartConfig(stats));

    if (window.lucide) window.lucide.createIcons();
}

// --- NOTIFICATIONS & SMART CHECKS ---

export function runSmartChecks() {
    const budgets = Consultas.getBudgetsStatus();
    Notificacoes.checkBudgetAlerts(budgets);
    const goals = Consultas.getGoals();
    Notificacoes.checkGoalAlerts(goals);

    // Re-render badge only (list is rendered on open)
    Notificacoes.updateBadge();
}

function renderNotifications() {
    // Badge is handled by module's internal calls (updateBadge) on data change,
    // or by explicit calls. Logic is centralized there.

    const list = document.getElementById('notif-list');
    const allNotifs = Notificacoes.getNotifications();

    // Ensure badge is up to date visually too
    Notificacoes.updateBadge();

    if (!list) return;

    list.innerHTML = '';

    if (allNotifs.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-muted text-sm">Nenhuma notificação.</div>';
        return;
    }

    allNotifs.forEach(n => {
        // Icons based on type
        let icon = 'info';
        let typeClass = 'info';
        if (n.type === 'success') { icon = 'check-circle'; typeClass = 'success'; }
        if (n.type === 'warning') { icon = 'alert-triangle'; typeClass = 'warning'; }
        if (n.type === 'error') { icon = 'alert-circle'; typeClass = 'error'; }

        // Date formatting: Just time if today, date if older
        const dateObj = new Date(n.date);
        const dateStr = dateObj.toLocaleDateString() === new Date().toLocaleDateString()
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : dateObj.toLocaleDateString();

        const html = `
            <div class="notif-item ${n.read ? 'read' : 'unread'} flex items-start gap-3" 
                 data-notification-id="${n.id}" data-read="${n.read}">
                <div class="notif-icon ${typeClass}">
                    <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">
                        <span>${n.title}</span>
                        <span class="notif-time">${dateStr}</span>
                    </div>
                    <p class="notif-message">${n.message}</p>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });

    // Add event delegation for notification clicks
    list.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', function () {
            const notifId = parseInt(this.getAttribute('data-notification-id'));
            const isRead = this.getAttribute('data-read') === 'true';

            if (!isRead) {
                Notificacoes.markAsRead(notifId);
                this.classList.remove('unread');
                this.classList.add('read');
                this.setAttribute('data-read', 'true');
            }
        });
    });

    if (window.lucide) window.lucide.createIcons();
}


