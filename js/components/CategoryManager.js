import { UIService } from '../services/UIService.js';
import { CategoryService } from '../services/CategoryService.js';

export class CategoryManager {
    constructor(onCategoryChange) {
        this.onCategoryChange = onCategoryChange;
        // Eliminar la llamada a ensureDefaultCategories del constructor
    }

    async handleSubmit(event) {
        event.preventDefault();
        const input = document.getElementById('category-name');
        const name = input.value.trim();
        
        if (!name) return;

        try {
            await CategoryService.addCategory({
                name: name,
                type: 'expense'
            });
            await this.updateCategoriesList();
            if (this.onCategoryChange) {
                await this.onCategoryChange(); // Actualizar selectores de categorías
            }
            UIService.showSuccess('Categoría agregada correctamente');
            input.value = '';
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            UIService.showError(error.message);
        }
    }

    async handleRestoreDefaults() {
        try {
            await CategoryService.restoreDefaultCategories();
            await this.updateCategoriesList();
            UIService.showSuccess('Categorías predefinidas restauradas');
        } catch (error) {
            console.error('Error al restaurar categorías:', error);
            UIService.showError(error.message);
        }
    }

    async handleDeleteCategory(id) {
        try {
            await CategoryService.deleteCategory(id);
            const categories = await CategoryService.getCategories();
            await this.renderCategoriesList(categories);
            if (this.onCategoryChange) {
                await this.onCategoryChange(); // Actualiza otras partes del programa
            }
            UIService.showSuccess('Categoría eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            UIService.showError(error.message);
        }
    }

    async updateCategoriesList() {
        try {
            const container = document.querySelector('.categories-list');
            if (!container) return;

            const categories = await CategoryService.getCategories();
            const expenseCategories = categories.filter(category => category.type === 'expense');
            
            if (expenseCategories.length === 0) {
                container.innerHTML = '<div class="empty-message">No hay categorías de gastos. Agrega una nueva categoría o restaura las predefinidas.</div>';
                return;
            }

            // Agregar cada categoría directamente al contenedor
            container.innerHTML = '';
            expenseCategories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item';
                categoryItem.innerHTML = `
                    <span class="category-name">${category.name}</span>
                    <button class="delete-category" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                container.appendChild(categoryItem);
            });

            // Agregar event listeners para los botones de eliminar
            container.querySelectorAll('.delete-category').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    try {
                        await CategoryService.deleteCategory(id);
                        const updatedCategories = await CategoryService.getCategories();
                        await this.updateCategoriesList();
                        if (this.onCategoryChange) {
                            await this.onCategoryChange();
                        }
                        UIService.showSuccess('Categoría eliminada correctamente');
                    } catch (error) {
                        console.error('Error al eliminar categoría:', error);
                        UIService.showError('Error al eliminar la categoría');
                    }
                });
            });
        } catch (error) {
            console.error('Error al actualizar lista de categorías:', error);
            UIService.showError('Error al cargar las categorías');
        }
    }

    async renderCategoriesList(categories) {
        const container = document.querySelector('.categories-list');
        if (!container) return;

        // Limpiar los event listeners anteriores removiendo y recreando el contenedor
        const newContainer = document.createElement('div');
        newContainer.className = 'categories-list';
        container.parentNode.replaceChild(newContainer, container);

        const expenseCategories = categories.filter(category => category.type === 'expense');
        
        if (expenseCategories.length === 0) {
            newContainer.innerHTML = '<div class="empty-message">No hay categorías de gastos. Agrega una nueva categoría o restaura las predefinidas.</div>';
            return;
        }

        newContainer.innerHTML = expenseCategories
            .map(category => `
                <div class="category-item">
                    <span class="category-name">${category.name}</span>
                    <button class="delete-category" data-id="${category.id}">Eliminar</button>
                </div>
            `).join('');

        // Agregar event listeners para los botones de eliminar
        newContainer.querySelectorAll('.delete-category').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id);
                await this.handleDeleteCategory(id);
            });
        });
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'category-manager';
        
        container.innerHTML = `
            <h2>Gestión de Categorías</h2>
            <div class="category-form">
                <div class="category-input-group">
                    <input type="text" id="category-name" placeholder="Nueva categoría" required>
                    <button type="button" class="add-category">Agregar</button>
                </div>
                <button type="button" class="restore-button">Restaurar predefinidas</button>
            </div>
            <div class="categories-list">
                <!-- Las categorías se agregarán dinámicamente aquí -->
            </div>
        `;

        // Agregar event listeners
        const addButton = container.querySelector('.add-category');
        const restoreButton = container.querySelector('.restore-button');
        const input = container.querySelector('#category-name');

        addButton.addEventListener('click', () => this.handleSubmit({ preventDefault: () => {} }));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit({ preventDefault: () => {} });
            }
        });
        restoreButton.addEventListener('click', () => this.handleRestoreDefaults());

        // Cargar categorías iniciales
        await this.updateCategoriesList();

        return container;
    }

    async ensureDefaultCategories() {
        try {
            const categories = await CategoryService.getCategories();
            if (categories.length === 0) {
                await CategoryService.restoreDefaultCategories();
            }
        } catch (error) {
            console.error('Error al asegurar categorías predefinidas:', error);
            UIService.showError('Error al cargar las categorías predefinidas');
        }
    }
}