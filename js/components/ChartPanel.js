import { ChartService } from '../services/ChartService.js';
import { TransactionService } from '../services/TransactionService.js';
import { EstimateService } from '../services/EstimateService.js';

export class ChartPanel {
    constructor() {
        this.chartService = new ChartService();
    }

    async updateCharts(monthlyData, categoryData, comparison) {
        // Actualizar el gráfico de gastos por categoría
        await this.chartService.updateExpenseChart(categoryData);

        // Procesar datos de ingresos por categoría
        const incomeCategoryData = await this.processIncomeCategoryData();
        await this.chartService.updateIncomeChart(incomeCategoryData);

        // Actualizar otros gráficos
        await this.chartService.updateEstimateComparisonChart(comparison);
        await this.chartService.updateExpenseTrendChart(monthlyData);
    }

    async processIncomeCategoryData() {
        const transactions = await TransactionService.getTransactions();
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        
        const categoryMap = new Map();
        incomeTransactions.forEach(transaction => {
            const currentAmount = categoryMap.get(transaction.category) || 0;
            categoryMap.set(transaction.category, currentAmount + transaction.amount);
        });

        return {
            labels: Array.from(categoryMap.keys()),
            amounts: Array.from(categoryMap.values())
        };
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'chart-panel';
        
        container.innerHTML = `
            <div class="charts-container">
                <div class="chart-section">
                    <h2>Resumen de Gastos por Categoría</h2>
                    <div class="chart-wrapper">
                        <canvas id="expenseChart"></canvas>
                    </div>
                </div>
                <div class="chart-section">
                    <h2>Resumen de Ingresos por Categoría</h2>
                    <div class="chart-wrapper">
                        <canvas id="incomeChart"></canvas>
                    </div>
                </div>
                <div class="chart-section">
                    <h2>Comparación de Gastos Estimados vs Reales</h2>
                    <div class="chart-wrapper">
                        <canvas id="estimateComparisonChart"></canvas>
                    </div>
                </div>
                <div class="chart-section">
                    <h2>Tendencia de Gastos e Ingresos</h2>
                    <div class="chart-wrapper">
                        <canvas id="expenseTrendChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Inicializar gráficos después de que los elementos <canvas> estén en el DOM
        setTimeout(() => this.chartService.initCharts(), 0);

        return container;
    }
}