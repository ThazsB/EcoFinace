/**
 * Script de Demonstração - Gera dados de teste para o Fins
 * 
 * Este script cria:
 * - Transações ao longo de 6 meses
 * - Notificações
 * - Orçamentos e metas
 * 
 * Como usar:
 * 1. Abra o console do navegador na página do Fins
 * 2. Certifique-se de que há um perfil ativo logado
 * 3. Copie e cole este código no console
 * 4. Execute (pressione Enter)
 */

// Função principal para gerar dados de demonstração
export function generateDemoData() {
    // Primeiro, precisa haver um perfil ativo
    const activeProfileId = localStorage.getItem('fins_active_profile');

    if (!activeProfileId) {
        console.error('Nenhum perfil ativo encontrado. Por favor, faça login em um perfil primeiro.');
        return;
    }

    console.log('Iniciando geração de dados de demonstração para o perfil:', activeProfileId);

    const transactionsKey = `fins_${activeProfileId}_transactions`;
    const notificationsKey = `fins_${activeProfileId}_notifications`;
    const budgetsKey = `fins_${activeProfileId}_budgets`;
    const goalsKey = `fins_${activeProfileId}_goals`;

    // Gerar transações dos últimos 6 meses
    const transactions = generateTransactions(6);
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));
    console.log(`Geradas ${transactions.length} transações`);

    // Gerar notificações
    const notifications = generateNotifications();
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    console.log(`Geradas ${notifications.length} notificações`);

    // Gerar orçamentos
    const budgets = generateBudgets();
    localStorage.setItem(budgetsKey, JSON.stringify(budgets));
    console.log(`Gerados ${budgets.length} orçamentos`);

    // Gerar metas
    const goals = generateGoals();
    localStorage.setItem(goalsKey, JSON.stringify(goals));
    console.log(`Geradas ${goals.length} metas`);

    console.log('Dados de demonstração gerados com sucesso!');
    console.log('Atualize a página para ver os dados.');

    // Disparar evento para atualizar a interface
    window.location.reload();
}

// Função para gerar transações
function generateTransactions(months) {
    const transactions = [];
    const categories = {
        income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
        expense: ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação']
    };

    const now = new Date();
    let transactionId = Date.now();

    // Gerar transações para cada dia dos últimos 'months' meses
    for (let m = 0; m < months; m++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
            const dateStr = date.toISOString().split('T')[0];

            // Salário no primeiro dia do mês (se for mês atual ou anterior)
            if (d === 1 && m < 3) {
                transactions.push({
                    id: transactionId++,
                    desc: 'Salário',
                    amount: 5000 + Math.random() * 1000,
                    type: 'income',
                    category: 'Salário',
                    date: dateStr
                });
            }

            // Transação de despesa aleatória (2-5 por dia)
            const expenseCount = Math.floor(Math.random() * 4) + 2;
            for (let i = 0; i < expenseCount; i++) {
                const category = categories.expense[Math.floor(Math.random() * categories.expense.length)];
                let amount;

                switch (category) {
                    case 'Alimentação': amount = 50 + Math.random() * 100; break;
                    case 'Moradia': amount = 800 + Math.random() * 200; break;
                    case 'Transporte': amount = 20 + Math.random() * 50; break;
                    case 'Lazer': amount = 100 + Math.random() * 200; break;
                    case 'Saúde': amount = 50 + Math.random() * 150; break;
                    case 'Educação': amount = 200 + Math.random() * 300; break;
                    default: amount = 50 + Math.random() * 100;
                }

                transactions.push({
                    id: transactionId++,
                    desc: `${category} - ${getRandomStore()}`,
                    amount: Math.round(amount * 100) / 100,
                    type: 'expense',
                    category: category,
                    date: dateStr
                });
            }

            // Receita extra ocasional (10% de chance)
            if (Math.random() < 0.1) {
                const category = categories.income[Math.floor(Math.random() * categories.income.length)];
                transactions.push({
                    id: transactionId++,
                    desc: category,
                    amount: Math.round((200 + Math.random() * 800) * 100) / 100,
                    type: 'income',
                    category: category,
                    date: dateStr
                });
            }
        }
    }

    return transactions;
}

// Função para gerar notificações
function generateNotifications() {
    const notifications = [];
    const now = new Date();
    let notifId = Date.now();

    // Notificações dos últimos 30 dias
    for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // 1-3 notificações por dia
        const count = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < count; j++) {
            const types = ['info', 'success', 'warning', 'error'];
            const type = types[Math.floor(Math.random() * types.length)];

            let title, message;

            switch (type) {
                case 'info':
                    title = 'Resumo Financeiro';
                    message = `Seu resumo de ${date.toLocaleDateString('pt-BR')} está disponível.`;
                    break;
                case 'success':
                    title = 'Meta Atingida! 🎉';
                    message = 'Você alcançou 80% da sua meta de economia!';
                    break;
                case 'warning':
                    title = 'Alerta de Gastos';
                    message = 'Suas despesas desta semana aumentaram 15% em relação à semana anterior.';
                    break;
                case 'error':
                    title = 'Orçamento Estourado!';
                    message = 'Você excedeu o limite de Alimentação este mês.';
                    break;
            }

            notifications.push({
                id: notifId++,
                title,
                message,
                type,
                date: date.toISOString(),
                read: Math.random() > 0.5 // 50% lidas
            });
        }
    }

    return notifications;
}

// Função para gerar orçamentos
function generateBudgets() {
    return [
        { category: 'Alimentação', limit: 1500 },
        { category: 'Moradia', limit: 2000 },
        { category: 'Transporte', limit: 500 },
        { category: 'Lazer', limit: 800 },
        { category: 'Saúde', limit: 400 }
    ];
}

// Função para gerar metas
function generateGoals() {
    const now = new Date();
    return [
        {
            id: Date.now(),
            name: 'Fundo de Emergência',
            target: 10000,
            current: 4500,
            deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString().split('T')[0]
        },
        {
            id: Date.now() + 1,
            name: 'Viagem de Férias',
            target: 5000,
            current: 1200,
            deadline: new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString().split('T')[0]
        },
        {
            id: Date.now() + 2,
            name: 'Novo Computador',
            target: 3000,
            current: 2800,
            deadline: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString().split('T')[0]
        }
    ];
}

// Função auxiliar para gerar nomes de lojas
function getRandomStore() {
    const stores = [
        'Supermercado', 'Restaurante', 'Farmácia', 'Posto de Gasolina',
        'Shopping', 'Cinema', 'Academia', 'Livraria', 'Loja de Roupas',
        'Eletrônicos', 'Construtoras', 'Uber', 'iFood'
    ];
    return stores[Math.floor(Math.random() * stores.length)];
}

// Executar a função
generateDemoData();
