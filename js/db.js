const DB_NAME = 'finanzasDB';
const DB_VERSION = 2;

let db;

export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error al abrir la base de datos:', event.target.error);
            reject(new Error(`Error al abrir la base de datos: ${event.target.error.message}`));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Base de datos abierta correctamente');
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Actualizando esquema de la base de datos');

            // Crear object store para transacciones si no existe
            if (!db.objectStoreNames.contains('transactions')) {
                console.log('Creando almacén de transacciones');
                const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                transactionsStore.createIndex('date', 'date');
                transactionsStore.createIndex('type', 'type');
                transactionsStore.createIndex('category', 'category');
            }

            // Crear object store para estimaciones si no existe
            if (!db.objectStoreNames.contains('estimates')) {
                console.log('Creando almacén de estimaciones');
                const estimatesStore = db.createObjectStore('estimates', { keyPath: 'id', autoIncrement: true });
                estimatesStore.createIndex('month', 'month');
                estimatesStore.createIndex('year', 'year');
                estimatesStore.createIndex('category', 'category');
            }

            // Crear object store para categorías si no existe
            if (!db.objectStoreNames.contains('categories')) {
                console.log('Creando almacén de categorías');
                const categoriesStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                categoriesStore.createIndex('type', 'type');
                categoriesStore.createIndex('name', 'name', { unique: true });
            }
        };
    });
}

export async function addTransaction(transaction) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction_db = db.transaction(['transactions'], 'readwrite');
        const store = transaction_db.objectStore('transactions');
        const request = store.add(transaction);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Error al agregar transacción'));
    });
}

export async function getTransactions(filters = {}) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const request = store.getAll();

        request.onsuccess = () => {
            let transactions = request.result;

            // Aplicar filtros si existen
            if (filters.type) {
                transactions = transactions.filter(t => t.type === filters.type);
            }
            if (filters.category) {
                transactions = transactions.filter(t => t.category === filters.category);
            }

            resolve(transactions);
        };

        request.onerror = () => reject(new Error('Error al obtener transacciones'));
    });
}

export async function deleteTransaction(id) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readwrite');
        const store = transaction.objectStore('transactions');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Error al eliminar transacción'));
    });
}

export async function updateTransaction(id, transactionData) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readwrite');
        const store = transaction.objectStore('transactions');
        const request = store.put({ ...transactionData, id });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Error al actualizar transacción'));
    });
}

export async function addEstimate(estimate) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['estimates'], 'readwrite');
        const store = transaction.objectStore('estimates');
        const request = store.add(estimate);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Error al agregar estimación'));
    });
}

export async function getEstimates() {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['estimates'], 'readonly');
        const store = transaction.objectStore('estimates');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Error al obtener estimaciones'));
    });
}

export async function deleteEstimate(id) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['estimates'], 'readwrite');
        const store = transaction.objectStore('estimates');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Error al eliminar estimación'));
    });
}

export async function getEstimatesByMonthYear(month, year) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['estimates'], 'readonly');
        const store = transaction.objectStore('estimates');
        const request = store.getAll();

        request.onsuccess = () => {
            const estimates = request.result.filter(
                e => e.month === month && e.year === year
            );
            resolve(estimates);
        };

        request.onerror = () => reject(new Error('Error al obtener estimaciones'));
    });
}

// Funciones para gestionar categorías
export async function addCategory(category) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.add(category);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Error al agregar categoría'));
    });
}

export async function getCategories(type = null) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();

        request.onsuccess = () => {
            let categories = request.result;
            if (type) {
                categories = categories.filter(c => c.type === type);
            }
            resolve(categories);
        };

        request.onerror = () => reject(new Error('Error al obtener categorías'));
    });
}

export async function deleteCategory(id) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Error al eliminar categoría'));
    });
}

export async function updateCategory(id, category) {
    if (!db) {
        throw new Error('La base de datos no está inicializada.');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.put({ ...category, id });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Error al actualizar categoría'));
    });
}