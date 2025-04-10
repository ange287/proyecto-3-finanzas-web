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

            // Si no hay estimados, mostrar mensaje
            if (estimates.length === 0) {
                container.innerHTML = '<div class="empty-message">No hay gastos estimados. Agrega uno nuevo usando el formulario superior.</div>';
                return;
            }

            // Ordenar estimados por fecha (más recientes primero)
            const sortedEstimates = estimates.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });

            // Crear tabla
            const table = document.createElement('table');
            table.innerHTML = `
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
                            <td>${estimate.category}</td>
                            <td>${estimate.month}/${estimate.year}</td>
                            <td>$${estimate.amount.toFixed(2)}</td>
                            <td>
                                <button class="delete-button" data-id="${estimate.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            // Limpiar y actualizar el contenedor
            container.innerHTML = '';
            container.appendChild(table);

            // Agregar event listeners para los botones de eliminar
            container.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    try {
                        await EstimateService.deleteEstimate(id);
                        const updatedEstimates = await EstimateService.getEstimates();
                        await this.updateEstimatesList(updatedEstimates);
                        UIService.showSuccess('Gasto estimado eliminado correctamente');
                    } catch (error) {
                        console.error('Error al eliminar gasto estimado:', error);
                        UIService.showError('Error al eliminar el gasto estimado');
                    }
                });
            });
        } catch (error) {
            console.error('Error al actualizar lista de gastos estimados:', error);
            UIService.showError('Error al cargar los gastos estimados');
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
        
        // Obtener las categorías disponibles
        const categories = await CategoryService.getCategories();
        const expenseCategories = categories.filter(category => category.type === 'expense');
        
        // Obtener el año actual y calcular los años a mostrar
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear, currentYear + 1];
        
        container.innerHTML = `
            <h3>Nuevo Gasto Estimado</h3>
            <form id="estimate-form">
                <select id="estimate-category" required>
                    <option value="">Seleccione categoría</option>
                    ${expenseCategories.map(category => `
                        <option value="${category.name}">${category.name}</option>
                    `).join('')}
                </select>
                <input type="number" id="estimate-amount" placeholder="Monto estimado" step="0.01" required>
                <div class="date-selectors">
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
                        ${years.map(year => `
                            <option value="${year}">${year}</option>
                        `).join('')}
                    </select>
                </div>
                <button type="submit">Agregar</button>
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