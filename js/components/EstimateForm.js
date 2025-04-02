import { UIService } from '../services/UIService.js';
import { EstimateService } from '../services/EstimateService.js';
import { CategoryService } from '../services/CategoryService.js';

export class EstimateForm {
    constructor(onSubmit) {
        this.onSubmit = onSubmit;
    }

    handleSubmit(event) {
        event.preventDefault();
        
        const formData = {
            category: document.getElementById('estimate-category').value,
            amount: parseFloat(document.getElementById('estimate-amount').value),
            month: parseInt(document.getElementById('estimate-month').value),
            year: parseInt(document.getElementById('estimate-year').value)
        };

        this.onSubmit(formData);
        event.target.reset();
        this.setDefaultMonthYear();
    }

    async updateCategorySelectors() {
        const categories = await CategoryService.getCategories();
        const categorySelect = document.getElementById('estimate-category');
        if (categorySelect) {
            categorySelect.innerHTML = categories
                .filter(category => category.type === 'expense') // Filtrar solo categorías de tipo 'expense'
                .map(category => `<option value="${category.name}">${category.name}</option>`)
                .join('');
        }
    }

    async updateEstimatesList(estimates) {
        try {
            const container = document.querySelector('.estimates-list');
            if (!container) return;

            if (estimates.length === 0) {
                container.innerHTML = '<div class="empty-message">No hay gastos estimados. Agrega uno nuevo usando el formulario superior.</div>';
                return;
            }

            // Ordenar estimaciones por fecha (más recientes primero)
            const sortedEstimates = estimates.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Fecha</th>
                            <th>Monto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedEstimates.map(estimate => `
                            <tr>
                                <td>${UIService.formatCategoryName(estimate.category)}</td>
                                <td>${UIService.formatMonthName(estimate.month)} ${estimate.year}</td>
                                <td class="amount">${UIService.formatCurrency(estimate.amount)}</td>
                                <td>
                                    <button class="delete-button delete-estimate" data-id="${estimate.id}" title="Eliminar estimación">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Agregar event listeners para los botones de eliminar
            container.querySelectorAll('.delete-estimate').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = parseInt(e.target.closest('.delete-estimate').dataset.id);
                    if (confirm('¿Estás seguro de que deseas eliminar este gasto estimado?')) {
                        try {
                            await EstimateService.deleteEstimate(id);
                            await this.updateEstimatesList(estimates.filter(e => e.id !== id));
                            UIService.showSuccess('Estimación eliminada correctamente');
                        } catch (error) {
                            console.error('Error al eliminar estimación:', error);
                            UIService.showError('Error al eliminar la estimación');
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error al actualizar la lista de estimaciones:', error);
            throw error;
        }
    }

    setDefaultMonthYear() {
        const today = new Date();
        const monthSelect = document.getElementById('estimate-month');
        const yearSelect = document.getElementById('estimate-year');
        
        if (monthSelect && yearSelect) {
            monthSelect.value = (today.getMonth() + 1).toString();
            yearSelect.value = today.getFullYear().toString();
        }
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'form-container';
        
        container.innerHTML = `
            <h3>Nuevo Gasto Estimado</h3>
            <form id="estimate-form">
                <select id="estimate-category" required>
                    <option value="">Seleccione categoría</option>
                    <option value="food">Alimentación</option>
                    <option value="transport">Transporte</option>
                    <option value="entertainment">Ocio</option>
                    <option value="housing">Vivienda</option>
                </select>
                <input type="number" id="estimate-amount" placeholder="Monto estimado" step="0.01" required>
                <select id="estimate-month" required>
                    <option value="">Seleccione mes</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                </select>
                <select id="estimate-year" required>
                    <option value="">Seleccione año</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                </select>
                <button type="submit">Agregar Estimación</button>
            </form>
            <div class="estimates-list"></div>
        `;

        const form = container.querySelector('form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Establecer mes y año por defecto
        setTimeout(() => this.setDefaultMonthYear(), 0);

        // Cargar la lista de estimaciones automáticamente al renderizar
        const estimates = await EstimateService.getEstimates();
        await this.updateEstimatesList(estimates);

        return container; // Asegúrate de devolver el contenedor
    }
}