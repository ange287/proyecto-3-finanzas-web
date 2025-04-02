import { TransactionService } from './TransactionService.js';
import { EstimateService } from './EstimateService.js';
import { UIService } from './UIService.js';

export class ChartService {
    constructor() {
        this.charts = {};
    }

    async initCharts() {
        const transactions = await TransactionService.getTransactions();
        const monthlyData = TransactionService.processMonthlyData(transactions);
        const categoryData = TransactionService.processCategoryData(transactions);

        const today = new Date();
        const estimates = await EstimateService.getEstimates();
        const monthlyEstimates = estimates.filter(e =>
            e.month === today.getMonth() + 1 &&
            e.year === today.getFullYear()
        );

        const comparison = {
            labels: monthlyEstimates.map(e => UIService.formatCategoryName(e.category)),
            estimated: monthlyEstimates.map(e => e.amount),
            actual: monthlyEstimates.map(e => {
                const actualTransactions = transactions.filter(t =>
                    t.type === 'expense' &&
                    t.category === e.category &&
                    new Date(t.date).getMonth() + 1 === today.getMonth() + 1 &&
                    new Date(t.date).getFullYear() === today.getFullYear()
                );
                return actualTransactions.reduce((sum, t) => sum + t.amount, 0);
            })
        };

        // Verificar que los elementos <canvas> existen antes de inicializar gráficos
        if (document.getElementById('expenseChart')) {
            await this.updateExpenseChart(categoryData);
        }

        if (document.getElementById('estimateComparisonChart')) {
            await this.updateEstimateComparisonChart(comparison);
        }

        if (document.getElementById('expenseTrendChart')) {
            await this.updateExpenseTrendChart(monthlyData);
        }
    }

    async updateExpenseChart(categoryData) {
        const expenseChart = document.getElementById('expenseChart');
        if (!expenseChart) return;

        if (this.charts.expenseChart) {
            this.charts.expenseChart.destroy();
        }

        this.charts.expenseChart = new Chart(expenseChart, {
            type: 'pie',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.amounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return UIService.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    async updateEstimateComparisonChart(comparison) {
        const estimateChart = document.getElementById('estimateComparisonChart');
        if (!estimateChart) return;

        if (this.charts.estimateComparisonChart) {
            this.charts.estimateComparisonChart.destroy();
        }

        this.charts.estimateComparisonChart = new Chart(estimateChart, {
            type: 'bar',
            data: {
                labels: comparison.labels,
                datasets: [
                    {
                        label: 'Estimado',
                        data: comparison.estimated,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Real',
                        data: comparison.actual,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Categoría'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => UIService.formatCurrency(value)
                        },
                        title: {
                            display: true,
                            text: 'Monto'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += UIService.formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    async updateExpenseTrendChart(monthlyData) {
        const trendChart = document.getElementById('expenseTrendChart');
        if (!trendChart) return;

        if (this.charts.expenseTrendChart) {
            this.charts.expenseTrendChart.destroy();
        }

        this.charts.expenseTrendChart = new Chart(trendChart, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: monthlyData.incomes,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Gastos',
                        data: monthlyData.expenses,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => UIService.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
}