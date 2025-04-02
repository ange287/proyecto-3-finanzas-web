import { initDB } from './db.js';
import { TransactionService } from './services/TransactionService.js';
import { EstimateService } from './services/EstimateService.js';
import { ChartService } from './services/ChartService.js';
import { UIService } from './services/UIService.js';
import { Sidebar } from './components/Sidebar.js';
import { TransactionForm } from './components/TransactionForm.js';
import { EstimateForm } from './components/EstimateForm.js';
import { ChartPanel } from './components/ChartPanel.js';
import { CategoryManager } from './components/CategoryManager.js';
import { CategoryService } from './services/CategoryService.js';

class App {
    constructor() {
        this.currentTab = 'transactions';
        this.transactionForm = new TransactionForm(this.handleTransactionSubmit.bind(this));
        this.estimateForm = new EstimateForm(this.handleEstimateSubmit.bind(this));
        this.chartPanel = new ChartPanel();
        this.categoryManager = new CategoryManager(this.handleCategoryChange.bind(this));
    }

    async init() {
        try {
            console.log('Iniciando aplicación...');
            await initDB(); // Asegúrate de que la base de datos esté inicializada
            console.log('Base de datos inicializada correctamente');
            await this.render();
            console.log('Interfaz renderizada');
            await this.loadInitialData();
            console.log('Datos iniciales cargados');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            UIService.showError(`Error al inicializar la aplicación: ${error.message}`);
            const appContainer = document.getElementById('app');
            if (appContainer) {
                appContainer.innerHTML = `
                    <div class="error-container">
                        <h2>Error al cargar la aplicación</h2>
                        <p>Ha ocurrido un error al intentar cargar la aplicación. Por favor, intenta recargar la página.</p>
                        <p>Si el problema persiste, asegúrate de que:</p>
                        <ul>
                            <li>Tu navegador soporta IndexedDB</li>
                            <li>No estás en modo privado/incógnito</li>
                            <li>No has deshabilitado el almacenamiento local</li>
                        </ul>
                        <button onclick="window.location.reload()">Recargar página</button>
                    </div>
                `;
            }
        }
    }

    async render() {
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = '';

        // Crear sidebar
        const sidebar = new Sidebar(this.handleTabChange.bind(this));
        const sidebarElement = await sidebar.render();
        appContainer.appendChild(sidebarElement);

        // Crear contenido principal
        const mainContent = document.createElement('main');
        mainContent.className = 'main-content';

        // Contenedor para pestañas
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';

        // Crear contenedor de contenido
        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';
        tabsContainer.appendChild(contentContainer);

        mainContent.appendChild(tabsContainer);
        appContainer.appendChild(mainContent);

        // Mostrar la pestaña inicial
        await this.handleTabChange('transactions');
    }

    async handleTabChange(tab) {
        this.currentTab = tab;
        const contentContainer = document.querySelector('.content-container');
        if (!contentContainer) return;

        // Buscar si ya existe el contenido de la pestaña
        let existingTabContent = contentContainer.querySelector(`.tab-content[data-tab="${tab}"]`);

        // Si no existe, renderizar el contenido de la pestaña
        if (!existingTabContent) {
            try {
                let content;
                switch (tab) {
                    case 'transactions':
                        content = await this.transactionForm.render();
                        const transactions = await TransactionService.getTransactions();
                        await this.transactionForm.updateTransactionsList(transactions);
                        break;
                    case 'estimates':
                        content = await this.estimateForm.render();
                        const estimates = await EstimateService.getEstimates();
                        await this.estimateForm.updateEstimatesList(estimates);
                        break;
                    case 'categories':
                        content = await this.categoryManager.render();
                        await this.categoryManager.updateCategoriesList();
                        break;
                    case 'charts':
                        content = await this.chartPanel.render();
                        await this.updateCharts();
                        break;
                    default:
                        throw new Error(`Pestaña desconocida: ${tab}`);
                }

                if (!content || !(content instanceof Node)) {
                    throw new Error(`El contenido de la pestaña "${tab}" no es un nodo válido.`);
                }

                // Crear un contenedor para la pestaña y agregarlo al DOM
                const tabContent = document.createElement('div');
                tabContent.className = 'tab-content';
                tabContent.dataset.tab = tab;
                tabContent.appendChild(content);
                contentContainer.appendChild(tabContent);
            } catch (error) {
                console.error('Error al cambiar de pestaña:', error);
                UIService.showError('Error al cargar la pestaña');
            }
        }

        // Mostrar la pestaña actual y ocultar las demás
        contentContainer.querySelectorAll('.tab-content').forEach(tabContent => {
            tabContent.style.display = tabContent.dataset.tab === tab ? 'block' : 'none';
        });

        // Cargar datos actualizados cuando se cambia a las pestañas de estimaciones o categorías
        if (tab === 'estimates' || tab === 'categories') {
            await this.loadInitialData();
        }
    }

    async handleTransactionSubmit(transactionData) {
        try {
            await TransactionService.addTransaction(transactionData);
            await this.loadInitialData();
            UIService.showSuccess('Transacción agregada correctamente');
        } catch (error) {
            UIService.showError('Error al agregar la transacción');
        }
    }

    async handleEstimateSubmit(estimateData) {
        try {
            await EstimateService.addEstimate(estimateData);
            await this.loadInitialData();
            UIService.showSuccess('Estimación agregada correctamente');
        } catch (error) {
            UIService.showError('Error al agregar la estimación');
        }
    }

    async handleCategoryChange() {
        await this.transactionForm.updateCategorySelectors();
        await this.estimateForm.updateCategorySelectors();
        await this.updateCharts(); // Actualizar gráficos si es necesario
    }

    async loadInitialData(filters = {}) {
        try {
            const transactions = await TransactionService.getTransactions(filters);
            const estimates = await EstimateService.getEstimates();
            const categories = await CategoryService.getCategories(); // Asegurar que las categorías se carguen

            await this.updateSidebar();
            await this.updateCharts();

            await this.transactionForm.updateTransactionsList(transactions);
            await this.estimateForm.updateEstimatesList(estimates);
            await this.transactionForm.updateCategorySelectors();
            await this.estimateForm.updateCategorySelectors();

            // Renderizar categorías automáticamente
            const categoryManagerContainer = document.querySelector('.categories-list');
            if (categoryManagerContainer) {
                await this.categoryManager.updateCategoriesList();
            }

            // Renderizar filtros
            const filtersContainer = document.getElementById('filters-container');
            if (filtersContainer) {
                filtersContainer.innerHTML = '';
                const filters = await this.transactionForm.renderFilters(async (newFilters) => {
                    await this.loadInitialData(newFilters);
                });
                filtersContainer.appendChild(filters);
            }
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            UIService.showError('Error al cargar los datos');
        }
    }

    async updateSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const newSidebar = new Sidebar(this.handleTabChange.bind(this));
            newSidebar.setActiveTab(this.currentTab); // Establecer la pestaña activa antes de renderizar
            const newSidebarElement = await newSidebar.render();
            sidebar.replaceWith(newSidebarElement);
        }
    }

    async updateCharts() {
        try {
            const transactions = await TransactionService.getTransactions();
            const monthlyData = TransactionService.processMonthlyData(transactions);
            const categoryData = TransactionService.processCategoryData(transactions);

            const estimates = await EstimateService.getEstimates();

            // Agrupar datos por mes y año
            const comparison = {
                labels: [],
                estimated: [],
                actual: []
            };

            const groupedEstimates = estimates.reduce((acc, estimate) => {
                const key = `${estimate.month}/${estimate.year}`;
                acc[key] = (acc[key] || 0) + estimate.amount;
                return acc;
            }, {});

            const groupedTransactions = transactions.reduce((acc, transaction) => {
                if (transaction.type === 'expense') {
                    const date = new Date(transaction.date);
                    const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
                    acc[key] = (acc[key] || 0) + transaction.amount;
                }
                return acc;
            }, {});

            // Ordenar las fechas cronológicamente (de más antiguo a más reciente)
            const sortedKeys = Object.keys(groupedEstimates).sort((a, b) => {
                const [monthA, yearA] = a.split('/').map(Number);
                const [monthB, yearB] = b.split('/').map(Number);
                if (yearA !== yearB) return yearA - yearB;
                return monthA - monthB;
            });

            // Crear arrays ordenados para los datos
            const orderedLabels = [];
            const orderedEstimated = [];
            const orderedActual = [];

            // Obtener el rango de fechas completo
            const dates = new Set();
            [...Object.keys(groupedEstimates), ...Object.keys(groupedTransactions)].forEach(key => {
                dates.add(key);
            });

            // Ordenar todas las fechas cronológicamente
            Array.from(dates)
                .sort((a, b) => {
                    const [monthA, yearA] = a.split('/').map(Number);
                    const [monthB, yearB] = b.split('/').map(Number);
                    if (yearA !== yearB) return yearA - yearB;
                    return monthA - monthB;
                })
                .forEach(key => {
                    const [month, year] = key.split('/');
                    const monthName = UIService.formatMonthName(parseInt(month));
                    orderedLabels.push(`${monthName} ${year}`);
                    orderedEstimated.push(groupedEstimates[key] || 0);
                    orderedActual.push(groupedTransactions[key] || 0);
                });

            comparison.labels = orderedLabels;
            comparison.estimated = orderedEstimated;
            comparison.actual = orderedActual;

            await this.chartPanel.updateCharts(monthlyData, categoryData, comparison);
        } catch (error) {
            console.error('Error al actualizar gráficos:', error);
            UIService.showError('Error al actualizar los gráficos');
        }
    }
}

// Inicializar la aplicación
const app = new App();
app.init();

// Exportar funciones para acceso desde la consola (debug)
window.app = {
    reloadTransactions: TransactionService.loadTransactions,
    updateBalance: TransactionService.updateBalance,
    deleteTransaction: TransactionService.deleteTransaction,
    deleteEstimate: EstimateService.deleteEstimate
};