import { ChartService } from '../services/ChartService.js';
//import { TransactionService } from '../services/TransactionService.js';
//import { EstimateService } from '../services/EstimateService.js';

export class ChartPanel {
    constructor() {
        this.chartService = new ChartService();
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'chart-panel';

        container.innerHTML = `
            <div class="chart-section">
                <h2>Resumen de Gastos por Categoría</h2>
                <canvas id="expenseChart"></canvas>
            </div>
            <div class="chart-section">
                <h2>Comparación de Gastos Estimados vs. Reales</h2>
                <canvas id="estimateComparisonChart"></canvas>
            </div>
            <div class="chart-section">
                <h2>Tendencia de Gastos</h2>
                <canvas id="expenseTrendChart"></canvas>
            </div>
        `;

        // Inicializar gráficos después de que los elementos <canvas> estén en el DOM
        setTimeout(() => this.chartService.initCharts(), 0);

        return container;
    }

    async updateCharts(monthlyData, categoryData, comparison) {
        try {
            // Actualizar gráfico de gastos por categoría
            await this.chartService.updateExpenseChart(categoryData);
            
            // Actualizar gráfico de comparación
            await this.chartService.updateEstimateComparisonChart(comparison);
            
            // Actualizar gráfico de tendencia
            await this.chartService.updateExpenseTrendChart(monthlyData);
        } catch (error) {
            console.error('Error al actualizar los gráficos:', error);
            throw error;
        }
    }
}