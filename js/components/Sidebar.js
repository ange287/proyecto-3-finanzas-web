import { TransactionService } from '../services/TransactionService.js';
import { UIService } from '../services/UIService.js';

export class Sidebar {
    constructor(onTabChange) {
        this.onTabChange = onTabChange;
        this.currentTab = 'transactions'; // Agregar estado para la pestaña actual
    }

    setActiveTab(tab) {
        this.currentTab = tab;
    }

    async render() {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';

        // Obtener el balance actual
        const transactions = await TransactionService.getTransactions();
        const balance = transactions.reduce((acc, transaction) => {
            return acc + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        sidebar.innerHTML = `
            <div class="balance">
                <h2>Balance Actual</h2>
                <p class="amount">${UIService.formatCurrency(balance)}</p>
            </div>
            <div class="summary">
                <div class="summary-item">
                    <span>Ingresos</span>
                    <span class="income">${UIService.formatCurrency(totalIncome)}</span>
                </div>
                <div class="summary-item">
                    <span>Gastos</span>
                    <span class="expense">${UIService.formatCurrency(totalExpense)}</span>
                </div>
            </div>
            <nav class="menu">
                <button class="menu-item ${this.currentTab === 'transactions' ? 'active' : ''}" data-tab="transactions">
                    <i class="fas fa-exchange-alt"></i>
                    Transacciones
                </button>
                <button class="menu-item ${this.currentTab === 'estimates' ? 'active' : ''}" data-tab="estimates">
                    <i class="fas fa-chart-line"></i>
                    Gastos Estimados
                </button>
                <button class="menu-item ${this.currentTab === 'categories' ? 'active' : ''}" data-tab="categories">
                    <i class="fas fa-tags"></i>
                    Categorías
                </button>
                <button class="menu-item ${this.currentTab === 'charts' ? 'active' : ''}" data-tab="charts">
                    <i class="fas fa-chart-bar"></i>
                    Gráficos
                </button>
            </nav>
        `;

        // Agregar event listeners a los botones del menú
        const menuItems = sidebar.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.setActiveTab(tab); // Actualizar la pestaña activa
                this.onTabChange(tab);
                
                // Actualizar clase activa
                menuItems.forEach(menuItem => menuItem.classList.remove('active'));
                item.classList.add('active');
            });
        });

        return sidebar;
    }

    handleTabClick(tab) {
        // Actualizar botones activos
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });

        // Notificar al componente principal
        if (this.onTabChange) {
            this.onTabChange(tab);
        }
    }
} 