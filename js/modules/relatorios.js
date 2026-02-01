import { getAppData } from './armazenamento.js';
import { formatCurrency } from './uteis.js';

// --- Data Processing ---

export function getReportData(year = new Date().getFullYear(), month = null) {
    const data = getAppData();
    let transactions = data.transactions;

    // Filter by year
    transactions = transactions.filter(t => new Date(t.date).getFullYear() === year);

    // Filter by month if specified (0-11)
    if (month !== null) {
        transactions = transactions.filter(t => new Date(t.date).getMonth() === month);
    }

    return calculateStats(transactions);
}

function calculateStats(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;
    let categoryExpenses = {};
    let monthlyData = Array(12).fill(0).map(() => ({ income: 0, expense: 0 }));
    let dailyData = {};

    transactions.forEach(t => {
        const date = new Date(t.date);
        const amount = t.amount;
        const monthIndex = date.getMonth(); // 0-11
        const dayKey = t.date; // YYYY-MM-DD

        if (t.type === 'income') {
            totalIncome += amount;
            monthlyData[monthIndex].income += amount;

            if (!dailyData[dayKey]) dailyData[dayKey] = { income: 0, expense: 0 };
            dailyData[dayKey].income += amount;
        } else if (t.type === 'expense') {
            totalExpense += amount;
            monthlyData[monthIndex].expense += amount;

            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + amount;

            if (!dailyData[dayKey]) dailyData[dayKey] = { income: 0, expense: 0 };
            dailyData[dayKey].expense += amount;
        }
    });

    // Find top expense category
    let maxCatVal = 0;
    let maxCatName = '-';
    for (const [cat, val] of Object.entries(categoryExpenses)) {
        if (val > maxCatVal) {
            maxCatVal = val;
            maxCatName = cat;
        }
    }

    // Sort daily data keys
    const sortedDays = Object.keys(dailyData).sort();

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
        topCategory: maxCatName,
        topCategoryValue: maxCatVal,
        categoryExpenses,
        monthlyData, // For annual view
        dailyData: sortedDays.map(date => ({ date, ...dailyData[date] })) // For monthly view
    };
}

// --- Chart Generation Helpers ---

export function getCategoryChartConfig(stats) {
    const labels = Object.keys(stats.categoryExpenses);
    const data = Object.values(stats.categoryExpenses);
    const colors = [
        '#F4A261', '#34d399', '#fb7185', '#3B82F6', '#A855F7',
        '#EAB308', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
    ];

    return {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#9CA3AF' } }
            }
        }
    };
}

export function getEvolutionChartConfig(stats, isAnnual) {
    let labels, incomeData, expenseData;

    if (isAnnual) {
        labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        incomeData = stats.monthlyData.map(d => d.income);
        expenseData = stats.monthlyData.map(d => d.expense);
    } else {
        // Daily view for the selected month
        labels = stats.dailyData.map(d => {
            const date = new Date(d.date + 'T00:00:00');
            return date.getDate(); // Just the day number
        });
        incomeData = stats.dailyData.map(d => d.income);
        expenseData = stats.dailyData.map(d => d.expense);
    }

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: '#34d399',
                    borderRadius: 4,
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: '#fb7185',
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: '#333' },
                    ticks: { color: '#9CA3AF' },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF' }
                }
            },
            plugins: {
                legend: { labels: { color: '#D1D5DB' } }
            }
        }
    };
}

// --- Export Functions ---

export async function exportToPDF(elementId, filename = 'relatorio.pdf') {
    // Check if libraries are loaded
    if (!window.jspdf || !window.html2canvas) {
        alert('Bibliotecas de exportação (jsPDF/html2canvas) não carregadas.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const element = document.getElementById(elementId);

    if (!element) return;

    // Temporary style adjustments for better printing
    const originalBg = element.style.backgroundColor;
    const originalColor = element.style.color;

    // We might want to force a light theme or specific dark theme for PDF, 
    // but capturing "as is" is usually what users expect from "screenshot" style PDF.
    // However, dark mode screenshots often look bad if printed. 
    // For now, let's keep it WYSIWYG but ensure background is captured.

    try {
        const canvas = await window.html2canvas(element, {
            scale: 2, // Better resolution
            backgroundColor: '#1f2937', // Ensure background is dark (matching app theme)
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 size setup
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If image is taller than page, might need multi-page logic, 
        // but for a dashboard summary, fitting to width is usually enough 
        // or just let it cut off if it's too huge (simplified for now).

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);

        // Simple multipage support if needed
        // if (heightLeft > pdfHeight) ... complicated logic omitted for MVP

        pdf.save(filename);

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Verifique o console.');
    }
}

export function exportToCSV(stats, filename = 'relatorio.csv') {
    // Generate CSV content from specific transaction data or summary
    // Let's export the daily summary for the chart data, or maybe the list of transactions?
    // Usually people want the raw transactions.

    const data = getAppData().transactions; // Get all or filtered? 
    // Ideally we should reuse the filtered transactions from getReportData, 
    // but that function returns aggregate stats. 
    // Let's just re-fetch and filter here based on current context if possible, 
    // or just export the aggregate data.

    // For a "Report" export, usually aggregate data is nice, but raw data is more useful.
    // Let's export category summary + monthly summary.

    let csvContent = "data:text/csv;charset=utf-8,";

    csvContent += "Resumo Financeiro\n\n";
    csvContent += `Receitas Totais,${stats.totalIncome.toFixed(2)}\n`;
    csvContent += `Despesas Totais,${stats.totalExpense.toFixed(2)}\n`;
    csvContent += `Saldo,${stats.balance.toFixed(2)}\n\n`;

    csvContent += "Gastos por Categoria\n";
    csvContent += "Categoria,Valor\n";
    Object.entries(stats.categoryExpenses).forEach(([cat, val]) => {
        csvContent += `${cat},${val.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
