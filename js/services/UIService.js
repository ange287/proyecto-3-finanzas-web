import { EstimateService } from './EstimateService.js';
import { TransactionForm } from '../components/TransactionForm.js'; // Importar TransactionForm

export class UIService {
    static getCategoryName(category) {
        const categories = {
            food: 'Alimentación',
            transport: 'Transporte',
            entertainment: 'Ocio',
            housing: 'Vivienda',
            utilities: 'Servicios',
            health: 'Salud',
            education: 'Educación',
            shopping: 'Compras',
            other: 'Otros'
        };
        return categories[category] || category; // Devolver el valor original si no coincide
    }

    static getMonthName(month) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 
            'Mayo', 'Junio', 'Julio', 'Agosto',
            'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1];
    }

    static updateBalance(balance, income, expense) {
        const balanceElement = document.getElementById('balance');
        const incomeElement = document.getElementById('total-income');
        const expenseElement = document.getElementById('total-expense');

        if (balanceElement) {
            balanceElement.textContent = `Balance: ${this.formatCurrency(balance)}`;
        } else {
            console.error('Elemento "balance" no encontrado en el DOM.');
        }

        if (incomeElement) {
            incomeElement.textContent = `Ingresos: ${this.formatCurrency(income)}`;
        } else {
            console.error('Elemento "total-income" no encontrado en el DOM.');
        }

        if (expenseElement) {
            expenseElement.textContent = `Gastos: ${this.formatCurrency(expense)}`;
        } else {
            console.error('Elemento "total-expense" no encontrado en el DOM.');
        }
    }

    static renderTransactions(transactions) {
        const container = document.getElementById('transactions-list');
        if (!container) return;

        container.innerHTML = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(transaction => `
                <div class="transaction-item ${transaction.type}">
                    <div class="transaction-info">
                        <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                        <span class="transaction-category">${this.getCategoryName(transaction.category)}</span>
                        ${transaction.description ? `<span class="transaction-description">${transaction.description}</span>` : ''}
                    </div>
                    <div class="transaction-amount">
                        ${transaction.type === 'income' ? '+' : '-'}$${this.formatCurrency(transaction.amount)}
                    </div>
                    <button class="delete-btn" data-id="${transaction.id}">×</button>
                </div>
            `)
            .join('');

        // Agregar event listeners para los botones de eliminar
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id);
                try {
                    await window.app.deleteTransaction(id);
                } catch (error) {
                    this.showError('Error al eliminar la transacción');
                }
            });
        });
    }

    static async renderEstimates(estimates) {
        const container = document.getElementById('estimates-list');
        if (!container) return;

        container.innerHTML = '';

        if (estimates.length === 0) {
            container.innerHTML = '<p>No hay estimaciones registradas</p>';
            return;
        }

        // Ordenar estimaciones por año y mes
        estimates.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });

        estimates.forEach(estimate => {
            const estimateElement = document.createElement('div');
            estimateElement.className = 'estimate-item';
            
            const content = document.createElement('div');
            content.className = 'estimate-content';
            content.innerHTML = `
                <div class="estimate-info">
                    <span class="estimate-category">${this.getCategoryName(estimate.category)}</span>
                    <span class="estimate-date">${this.getMonthName(estimate.month)} ${estimate.year}</span>
                </div>
                <div class="estimate-amount">$${this.formatCurrency(estimate.amount)}</div>
            `;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.innerHTML = '×';
            deleteButton.onclick = () => EstimateService.deleteEstimate(estimate.id);

            estimateElement.appendChild(content);
            estimateElement.appendChild(deleteButton);
            container.appendChild(estimateElement);
        });
    }

    static async renderTransactionFilters(onFilterChange) {
        const filtersContainer = document.getElementById('filters-container');
        if (!filtersContainer) return;

        const transactionForm = new TransactionForm();
        const filters = await transactionForm.renderFilters(onFilterChange);
        filtersContainer.innerHTML = '';
        filtersContainer.appendChild(filters);
    }

    static setCurrentDate() {
        const dateInput = document.getElementById('estimate-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    static showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    static showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    static resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            if (formId === 'estimate-form') {
                EstimateService.setDefaultMonthYear();
            }
        }
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static formatCategoryName(category) {
        const categoryNames = {
            food: 'Alimentación',
            transport: 'Transporte',
            entertainment: 'Entretenimiento',
            housing: 'Vivienda',
            utilities: 'Servicios',
            health: 'Salud',
            education: 'Educación',
            shopping: 'Compras',
            other: 'Otros'
        };
        return categoryNames[category] || category;
    }

    static formatMonthName(month) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return monthNames[month - 1] || '';
    }
}