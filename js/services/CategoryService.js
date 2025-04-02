import { addCategory, getCategories, deleteCategory, updateCategory, getTransactions, getEstimates } from '../db.js';
import { UIService } from './UIService.js';

const DEFAULT_CATEGORIES = [
    { name: 'Alimentación', type: 'expense' },
    { name: 'Transporte', type: 'expense' },
    { name: 'Vivienda', type: 'expense' },
    { name: 'Salud', type: 'expense' },
    { name: 'Educación', type: 'expense' },
    { name: 'Ocio', type: 'expense' }
];

export class CategoryService {
    static async getCategories() {
        try {
            let categories = await getCategories();
            
            // Si no hay categorías, restaurar las predefinidas
            if (categories.length === 0) {
                await this.restoreDefaultCategories();
                categories = await getCategories();
            }
            
            return categories;
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }
    }

    static async validateCategory(categoryName, type) {
        try {
            const categories = await this.getCategories();
            return categories.some(c => 
                c.name.toLowerCase() === categoryName.toLowerCase() && 
                c.type === type
            );
        } catch (error) {
            console.error('Error al validar categoría:', error);
            return false;
        }
    }

    static async addCategory(category) {
        try {
            if (!category.name || !category.type) {
                throw new Error('Nombre y tipo son requeridos');
            }

            const categories = await getCategories();
            const exists = categories.some(c => 
                c.name.toLowerCase() === category.name.toLowerCase() && 
                c.type === category.type
            );

            if (exists) {
                throw new Error('Ya existe una categoría con ese nombre y tipo');
            }

            await addCategory(category); // Guardar en la base de datos
            return await getCategories(); // Retornar categorías actualizadas
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            throw error;
        }
    }

    static async deleteCategory(id) {
        try {
            const categories = await getCategories();
            const category = categories.find(c => c.id === id);

            if (!category) {
                throw new Error('Categoría no encontrada');
            }

            // Verificar si la categoría está en uso
            const transactions = await getTransactions();
            const estimates = await getEstimates();
            
            const isInUse = transactions.some(t => t.category === category.name) ||
                           estimates.some(e => e.category === category.name);

            if (isInUse) {
                throw new Error('No se puede eliminar una categoría que está en uso');
            }

            // Eliminar la categoría de la base de datos
            await deleteCategory(id);
            
            // Verificar que la categoría fue eliminada
            const updatedCategories = await getCategories();
            const stillExists = updatedCategories.some(c => c.id === id);
            
            if (stillExists) {
                throw new Error('Error al eliminar la categoría de la base de datos');
            }

            return true;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            UIService.showError(error.message);
            throw error;
        }
    }

    static async restoreDefaultCategories() {
        try {
            const currentCategories = await getCategories();
            
            // Agregar cada categoría predefinida si no existe
            for (const defaultCategory of DEFAULT_CATEGORIES) {
                const exists = currentCategories.some(c => 
                    c.name.toLowerCase() === defaultCategory.name.toLowerCase() &&
                    c.type === defaultCategory.type
                );
                
                if (!exists) {
                    await addCategory(defaultCategory);
                }
            }

            return await this.getCategories();
        } catch (error) {
            console.error('Error al restaurar categorías predefinidas:', error);
            throw error;
        }
    }

    static async updateCategory(id, category) {
        try {
            if (!category.name || !category.type) {
                throw new Error('Nombre y tipo son requeridos');
            }

            const categories = await getCategories();
            const exists = categories.some(c => 
                c.id !== id && 
                c.name.toLowerCase() === category.name.toLowerCase() && 
                c.type === category.type
            );

            if (exists) {
                throw new Error('Ya existe una categoría con ese nombre y tipo');
            }

            return await updateCategory(id, category);
        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            throw error;
        }
    }
}