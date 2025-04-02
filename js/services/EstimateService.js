import { addEstimate, getEstimates as dbGetEstimates, deleteEstimate, getTransactions } from '../db.js';
import { UIService } from './UIService.js';
import { ChartService } from './ChartService.js';

export class EstimateService {
    static async getEstimates() {
        try {
            return await dbGetEstimates();
        } catch (error) {
            console.error('Error al obtener estimaciones:', error);
            throw error;
        }
    }

    static async handleEstimateSubmit(event) {
        event.preventDefault();
        
        try {
            const category = document.getElementById('estimate-category').value;
            const amount = parseFloat(document.getElementById('estimate-amount').value);
            const month = parseInt(document.getElementById('estimate-month').value);
            const year = parseInt(document.getElementById('estimate-year').value);

            if (!category || !amount || !month || !year) {
                UIService.showError('Por favor complete todos los campos');
                return;
            }

            const estimate = {
                category,
                amount,
                month,
                year,
                // Crear una fecha para el primer día del mes seleccionado
                date: new Date(year, month - 1, 1)
            };

            await this.addEstimate(estimate);
            await this.loadEstimates();
            
            document.getElementById('estimate-form').reset();
            this.setDefaultMonthYear();
            UIService.showSuccess('Estimación agregada correctamente');
            await ChartService.updateEstimateCharts();
        } catch (error) {
            console.error('Error al agregar estimación:', error);
            UIService.showError('Error al agregar la estimación');
        }
    }

    static async addEstimate(estimate) {
        try {
            await addEstimate(estimate); // Llamar a la función de la base de datos
            UIService.showSuccess('Estimación agregada correctamente');
        } catch (error) {
            console.error('Error al agregar estimación:', error);
            UIService.showError('Error al agregar la estimación');
            throw error;
        }
    }

    static async loadEstimates() {
        try {
            const estimates = await this.getEstimates();
            await UIService.renderEstimates(estimates);
        } catch (error) {
            console.error('Error al cargar estimaciones:', error);
            UIService.showError('Error al cargar las estimaciones');
        }
    }

    static async deleteEstimate(id) {
        try {
            await deleteEstimate(id);
            await this.loadEstimates();
            UIService.showSuccess('Estimación eliminada correctamente');
            await ChartService.updateEstimateCharts();
        } catch (error) {
            console.error('Error al eliminar estimación:', error);
            UIService.showError('Error al eliminar la estimación');
        }
    }

    static async compareWithActual(month, year) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const estimates = await this.getEstimates();
            const transactions = await getTransactions({
                startDate,
                endDate,
                type: 'expense'
            });

            const comparison = {
                estimated: {},
                actual: {}
            };

            // Procesar estimaciones
            estimates.forEach(estimate => {
                comparison.estimated[estimate.category] = estimate.amount;
            });

            // Procesar transacciones reales
            transactions.forEach(transaction => {
                comparison.actual[transaction.category] = (comparison.actual[transaction.category] || 0) + transaction.amount;
            });

            return comparison;
        } catch (error) {
            console.error('Error al comparar estimaciones:', error);
            throw error;
        }
    }

    static setDefaultMonthYear() {
        const today = new Date();
        const monthSelect = document.getElementById('estimate-month');
        const yearSelect = document.getElementById('estimate-year');
        
        if (monthSelect && yearSelect) {
            monthSelect.value = (today.getMonth() + 1).toString();
            yearSelect.value = today.getFullYear().toString();
        }
    }

    static initializeForm() {
        this.setDefaultMonthYear();
        const form = document.getElementById('estimate-form');
        if (form) {
            form.addEventListener('submit', e => this.handleEstimateSubmit(e));
        }
    }
}