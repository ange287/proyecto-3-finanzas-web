import { getTransactions, addTransaction, deleteTransaction, updateTransaction } from '../db.js';
import { UIService } from './UIService.js';
import { ChartService } from './ChartService.js';

export class TransactionService {
    static async getTransactions(filters = {}) {
        try {
            let transactions = await getTransactions();

            // Aplicar filtros si existen
            if (filters.type) {
                transactions = transactions.filter(t => t.type === filters.type);
            }
            if (filters.category) {
                transactions = transactions.filter(t => t.category === filters.category);
            }

            return transactions;
        } catch (error) {
            console.error('Error al obtener transacciones:', error);
            UIService.showError('Error al cargar las transacciones');
            return [];
        }
    }

    static async addTransaction(transactionData) {
        try {
            await addTransaction(transactionData);
            UIService.showSuccess('Transacción agregada correctamente');
        } catch (error) {
            console.error('Error al agregar transacción:', error);
            UIService.showError('Error al agregar la transacción');
            throw error;
        }
    }

    static async deleteTransaction(id) {
        try {
            await deleteTransaction(id);
            UIService.showSuccess('Transacción eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            UIService.showError('Error al eliminar la transacción');
            throw error;
        }
    }

    static async updateTransaction(id, transactionData) {
        try {
            await updateTransaction(id, transactionData);
            UIService.showSuccess('Transacción actualizada correctamente');
        } catch (error) {
            console.error('Error al actualizar transacción:', error);
            UIService.showError('Error al actualizar la transacción');
            throw error;
        }
    }

    static processMonthlyData(transactions) {
        const monthlyData = {};
        const labels = [];
        const incomes = [];
        const expenses = [];

        // Agrupar transacciones por mes/año
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0 };
            }

            if (transaction.type === 'income') {
                monthlyData[monthYear].income += transaction.amount;
            } else {
                monthlyData[monthYear].expense += transaction.amount;
            }
        });

        // Ordenar las fechas cronológicamente
        Object.keys(monthlyData)
            .sort((a, b) => {
                const [monthA, yearA] = a.split('/').map(Number);
                const [monthB, yearB] = b.split('/').map(Number);
                if (yearA !== yearB) return yearA - yearB;
                return monthA - monthB;
            })
            .forEach(monthYear => {
                const [month, year] = monthYear.split('/');
                const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'short' });
                labels.push(`${monthName} ${year}`);
                incomes.push(monthlyData[monthYear].income);
                expenses.push(monthlyData[monthYear].expense);
            });

        return { labels, incomes, expenses };
    }

    static processCategoryData(transactions) {
        const categoryTotals = {};
        
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                const category = UIService.formatCategoryName(transaction.category);
                categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
            }
        });

        const labels = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);

        return { labels, amounts };
    }

    static async loadTransactions(filters = {}) {
        try {
            const transactions = await this.getTransactions(filters); // Obtener transacciones filtradas
            await this.renderTransactions(transactions); // Renderizar transacciones filtradas
            await this.updateBalance(transactions); // Actualizar balance con transacciones filtradas
            return transactions;
        } catch (error) {
            console.error('Error al cargar transacciones:', error);
            UIService.showError('Error al cargar las transacciones');
            throw error;
        }
    }

    static async updateBalance(transactions) {
        try {
            let balance = 0;
            let income = 0;
            let expense = 0;

            transactions.forEach(transaction => {
                const amount = parseFloat(transaction.amount);
                if (transaction.type === 'income') {
                    income += amount;
                    balance += amount;
                } else {
                    expense += amount;
                    balance -= amount;
                }
            });

            UIService.updateBalance(balance, income, expense);
        } catch (error) {
            console.error('Error al actualizar balance:', error);
            throw error;
        }
    }

    static async renderTransactions(transactions) {
        const container = document.getElementById('transactions-list');
        if (!container) return;

        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<p>No hay transacciones registradas</p>';
            return;
        }

        transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(transaction => {
                const transactionElement = document.createElement('div');
                transactionElement.className = `transaction-item ${transaction.type}`;
                
                transactionElement.innerHTML = `
                    <div class="transaction-info">
                        <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                        <span class="transaction-category">${UIService.getCategoryName(transaction.category)}</span>
                        ${transaction.description ? `<span class="transaction-description">${transaction.description}</span>` : ''}
                    </div>
                    <div class="transaction-amount">
                        ${transaction.type === 'income' ? '+' : '-'}$${this.formatCurrency(transaction.amount)}
                    </div>
                    <button class="delete-btn" data-id="${transaction.id}">×</button>
                `;

                const deleteBtn = transactionElement.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => this.deleteTransaction(transaction.id));

                container.appendChild(transactionElement);
            });
    }

    static formatCurrency(amount) {
        return amount.toFixed(2);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}