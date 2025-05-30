import { UIService } from '../services/UIService.js';
import { TransactionService } from '../services/TransactionService.js';
import { CategoryService } from '../services/CategoryService.js';

/**
 * Clase que maneja el formulario de transacciones y la lista de transacciones
 */
export class TransactionForm {
    /**
     * Constructor de la clase
     * @param {Function} onSubmit - Función callback que se ejecuta cuando se envía el formulario
     */
    constructor(onSubmit) {
        this.onSubmit = onSubmit;
        // Estado para mantener los filtros actuales
        this.currentFilters = {
            type: '',
            category: ''
        };
    }

    setDefaultDate() {
        try {
            const dateInput = document.getElementById('date');
            if (!dateInput) {
                console.error('No se encontró el campo de fecha');
                return;
            }
            
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            dateInput.value = formattedDate;
            console.log('Fecha establecida:', formattedDate);
        } catch (error) {
            console.error('Error al establecer la fecha:', error);
        }
    }

    /**
     * Carga y muestra las transacciones aplicando los filtros especificados
     * @param {Object} filters - Filtros a aplicar (tipo y categoría)
     */
    async loadInitialData(filters = {}) {
        const transactions = await TransactionService.getTransactions(filters);
        await this.updateTransactionsList(transactions);
    }

    /**
     * Maneja el envío del formulario de nueva transacción
     * @param {Event} event - Evento del formulario
     */
    handleSubmit(event) {
        event.preventDefault();
        
        const formData = {
            type: document.getElementById('type').value,
            amount: parseFloat(document.getElementById('amount').value),
            date: document.getElementById('date').value,
            category: document.getElementById('category').value,
            description: document.getElementById('description').value
        };

        this.onSubmit(formData);
        event.target.reset();
        this.updateCategorySelectors();
        this.setDefaultDate();
    }

    /**
     * Actualiza las opciones del selector de categorías con las categorías disponibles
     */
    async updateCategorySelectors() {
        const categories = await CategoryService.getCategories();
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = categories
                .filter(category => category.type === 'expense')
                .map(category => `<option value="${category.name}">${category.name}</option>`)
                .join('');
        }
    }

    /**
     * Actualiza la lista de transacciones en la interfaz
     * @param {Array} transactions - Lista de transacciones a mostrar
     */
    async updateTransactionsList(transactions) {
        try {
            const container = document.querySelector('.transactions-list');
            if (!container) return;

            // Ordenar transacciones por fecha (más recientes primero)
            const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th>Monto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedTransactions.map(transaction => `
                            <tr class="${transaction.type}">
                                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                                <td>${transaction.category}</td>
                                <td>${transaction.description || ''}</td>
                                <td class="amount">${UIService.formatCurrency(transaction.amount)}</td>
                                <td>
                                    <button class="delete-button" data-id="${transaction.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Agregar event listeners para los botones de eliminar
            container.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    try {
                        await TransactionService.deleteTransaction(id);
                        const updatedTransactions = await TransactionService.getTransactions();
                        await this.updateTransactionsList(updatedTransactions);
                        await TransactionService.updateBalance(updatedTransactions); // Actualizar balance
                        UIService.showSuccess('Transacción eliminada correctamente');
                    } catch (error) {
                        console.error('Error al eliminar transacción:', error);
                        UIService.showError('Error al eliminar la transacción');
                    }
                });
            });
        } catch (error) {
            console.error('Error al actualizar lista de transacciones:', error);
            UIService.showError('Error al cargar las transacciones');
        }
    }

    /**
     * Renderiza los controles de filtrado de transacciones
     * @param {Function} onFilterChange - Callback que se ejecuta cuando se aplican los filtros
     * @returns {HTMLElement} Contenedor con los controles de filtrado
     */
    async renderFilters(onFilterChange) {
        const container = document.createElement('div');
        container.className = 'filters';

        const categories = await CategoryService.getCategories();
        const categoryOptions = categories.map(category => 
            `<option value="${category.name}" ${this.currentFilters.category === category.name ? 'selected' : ''}>${category.name}</option>`
        ).join('');

        container.innerHTML = `
            <div class="filters-row">
                <select id="filter-type">
                    <option value="" ${this.currentFilters.type === '' ? 'selected' : ''}>Todos los tipos</option>
                    <option value="income" ${this.currentFilters.type === 'income' ? 'selected' : ''}>Ingreso</option>
                    <option value="expense" ${this.currentFilters.type === 'expense' ? 'selected' : ''}>Gasto</option>
                </select>
                <select id="filter-category">
                    <option value="" ${this.currentFilters.category === '' ? 'selected' : ''}>Todas las categorías</option>
                    ${categoryOptions}
                </select>
                <button id="apply-filters">Aplicar Filtros</button>
            </div>
        `;

        container.querySelector('#apply-filters').addEventListener('click', () => {
            const type = document.getElementById('filter-type').value;
            const category = document.getElementById('filter-category').value;
            
            // Guardar los valores actuales de los filtros
            this.currentFilters.type = type;
            this.currentFilters.category = category;
            
            onFilterChange({ type, category });
        });

        return container;
    }

    /**
     * Renderiza el formulario completo de transacciones
     * @returns {HTMLElement} Contenedor con el formulario, filtros y lista de transacciones
     */
    async render() {
        const container = document.createElement('div');
        container.className = 'form-container';
        
        // Crear el formulario de nueva transacción
        const formSection = document.createElement('div');
        formSection.innerHTML = `
            <h3>Nueva Transacción</h3>
            <form id="transaction-form">
                <div class="form-row">
                    <select id="type" required>
                        <option value="">Seleccione tipo</option>
                        <option value="income">Ingreso</option>
                        <option value="expense">Gasto</option>
                    </select>
                    <select id="category" required>
                        <option value="">Seleccione categoría</option>
                    </select>
                </div>
                <input type="number" id="amount" placeholder="Monto" step="0.01" required>
                <input type="date" id="date" required>
                <input type="text" id="description" placeholder="Descripción (opcional)">
                <button type="submit">Agregar</button>
            </form>
        `;
        container.appendChild(formSection);

        // Configurar el formulario
        const form = container.querySelector('form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Agregar los filtros después del formulario
        const filters = await this.renderFilters(async (newFilters) => {
            await this.loadInitialData(newFilters);
        });
        container.appendChild(filters);

        // Agregar el contenedor para la lista de transacciones
        const listContainer = document.createElement('div');
        listContainer.className = 'transactions-list';
        container.appendChild(listContainer);

        // Asegurarnos de que el DOM esté listo antes de establecer la fecha
        setTimeout(() => this.setDefaultDate(), 0);

        return container;
    }
}