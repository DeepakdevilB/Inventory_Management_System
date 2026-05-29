// Main application logic for Inventory Management System

// DOM elements
const itemsList = document.getElementById('itemsList');
const addItemForm = document.getElementById('addItemForm');
const editItemForm = document.getElementById('editItemForm');
const exportToHadoopBtn = document.getElementById('exportToHadoop');
const hadoopExportResult = document.getElementById('hadoopExportResult');
const hadoopExportDetails = document.getElementById('hadoopExportDetails');
const lowStockTable = document.getElementById('lowStockTable');

// Magic Fill buttons
const magicFillBtn = document.getElementById('magicFillBtn');
const editMagicFillBtn = document.getElementById('editMagicFillBtn');
const refreshDashboardBtn = document.getElementById('refreshDashboard');

// Views
const dashboardView = document.getElementById('dashboardView');
const inventoryView = document.getElementById('inventoryView');
const reportsView = document.getElementById('reportsView');

// Navigation links
const dashboardLink = document.getElementById('dashboardLink');
const inventoryLink = document.getElementById('inventoryLink');
const reportsLink = document.getElementById('reportsLink');

// Summary elements
const totalItemsCount = document.getElementById('totalItemsCount');
const totalInventoryValue = document.getElementById('totalInventoryValue');
const totalQuantity = document.getElementById('totalQuantity');
const lowStockCount = document.getElementById('lowStockCount');
const totalSalesAmountEl = document.getElementById('totalSalesAmount');
const totalItemsSoldEl = document.getElementById('totalItemsSold');

// Sales elements
const saleForm = document.getElementById('saleForm');
const saleItemsContainer = document.getElementById('saleItemsContainer');
const addSaleItemBtn = document.getElementById('addSaleItem');
const saleCustomerInput = document.getElementById('saleCustomer');
const saleTotalPreview = document.getElementById('saleTotalPreview');
const salesHistoryBody = document.getElementById('salesHistoryBody');
const refreshSalesHistoryBtn = document.getElementById('refreshSalesHistory');

// Bootstrap modal instances
let addItemModal;
let editItemModal;

// Active view tracker
let currentView = 'dashboard';
let cachedItems = [];
let saleItemRowCounter = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap modals
  addItemModal = new bootstrap.Modal(document.getElementById('addItemModal'));
  editItemModal = new bootstrap.Modal(document.getElementById('editItemModal'));
  
  // Initialize charts
  if (window.ChartManager) {
    window.ChartManager.initialize();
  }
  
  // Load all data
  loadDashboardData();
  loadItems();
  loadSalesHistory();
  
  // Set up event listeners
  setupEventListeners();

  // Ensure at least one sale item row exists
  ensureSaleItemRow();
  
  // Set active link
  dashboardLink.classList.add('active');
});

// Load dashboard data
const loadDashboardData = async () => {
  try {
    // Load summary data
    const summary = await ApiService.getInventorySummary();
    updateSummaryCards(summary);
    
    // Load low stock items
    const lowStockItems = await ApiService.getLowStockItems();
    displayLowStockItems(lowStockItems);
    
    // Update charts
    if (window.ChartManager) {
      window.ChartManager.updateAll();
    }
  } catch (error) {
    showError('Failed to load dashboard data: ' + error.message);
  }
};

// Update summary cards with data
const updateSummaryCards = (summary) => {
  if (totalItemsCount) totalItemsCount.textContent = summary.totalItems;
  if (totalInventoryValue) totalInventoryValue.textContent = `$${summary.totalValue.toFixed(2)}`;
  if (totalQuantity) totalQuantity.textContent = summary.totalQuantity;
  if (lowStockCount) lowStockCount.textContent = summary.lowStockCount;
  if (totalSalesAmountEl) totalSalesAmountEl.textContent = summary.totalSalesAmount ? `$${summary.totalSalesAmount.toFixed(2)}` : '$0.00';
  if (totalItemsSoldEl) totalItemsSoldEl.textContent = summary.totalItemsSold || 0;
};

// Display low stock items in the table
const displayLowStockItems = (items) => {
  if (!lowStockTable) return;
  
  if (items.length === 0) {
    lowStockTable.innerHTML = '<tr><td colspan="6" class="text-center">No low stock items</td></tr>';
    return;
  }
  
  lowStockTable.innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td><span class="text-warning fw-bold">${item.quantity}</span></td>
      <td>${item.minStockLevel}</td>
      <td>${item.supplier}</td>
      <td>
        <button class="btn btn-sm btn-primary btn-restock" data-id="${item._id}">
          <i class="bi bi-plus-circle"></i> Restock
        </button>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners to restock buttons
  document.querySelectorAll('.btn-restock').forEach(button => {
    button.addEventListener('click', () => openRestockModal(button.getAttribute('data-id')));
  });
};

// Open restock modal (reuses the edit modal but focuses on quantity)
const openRestockModal = async (itemId) => {
  try {
    const item = await ApiService.getItem(itemId);
    
    document.getElementById('editItemId').value = item._id;
    document.getElementById('editName').value = item.name;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editQuantity').value = item.quantity;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editSupplier').value = item.supplier;
    document.getElementById('editMinStockLevel').value = item.minStockLevel || 10;
    
    // Focus on quantity field
    setTimeout(() => {
      document.getElementById('editQuantity').focus();
      document.getElementById('editQuantity').select();
    }, 500);
    
    editItemModal.show();
  } catch (error) {
    showError('Failed to load item details: ' + error.message);
  }
};

// Load all items from the API
const loadItems = async () => {
  try {
    const items = await ApiService.getItems();
    cachedItems = items;
    displayItems(items);
    populateSaleItemOptions();
  } catch (error) {
    showError('Failed to load items: ' + error.message);
  }
};
// Populate sale item dropdowns
const populateSaleItemOptions = () => {
  if (!saleItemsContainer) return;

  const selects = saleItemsContainer.querySelectorAll('.sale-item-select');

  if (!selects.length) {
    ensureSaleItemRow();
    return;
  }

  selects.forEach(select => {
    const previousValue = select.value;
    select.innerHTML = getSaleItemOptionsHtml();
    if (previousValue) {
      select.value = previousValue;
    }
  });

  updateSalePreview();
};

const ensureSaleItemRow = () => {
  if (!saleItemsContainer) return;
  if (!saleItemsContainer.querySelector('.sale-item-row')) {
    addSaleItemRow();
  }
};

const getSaleItemOptionsHtml = () => {
  if (!cachedItems.length) {
    return '<option value="">No items available</option>';
  }

  return [
    '<option value="">Select an item</option>',
    ...cachedItems.map(item => `<option value="${item._id}">${item.name} - $${item.price.toFixed(2)}</option>`)
  ].join('');
};

const addSaleItemRow = () => {
  if (!saleItemsContainer) return null;

  const row = document.createElement('div');
  row.className = 'sale-item-row border rounded p-3 mb-3';
  row.dataset.rowId = `sale-item-${Date.now()}-${saleItemRowCounter++}`;
  row.innerHTML = `
    <div class="row g-3 align-items-end">
      <div class="col-md-6">
        <label class="form-label">Select Item</label>
        <select class="form-select sale-item-select">
          ${getSaleItemOptionsHtml()}
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-control sale-item-quantity" min="1" placeholder="Qty">
        <div class="form-text sale-item-stock">Available: -</div>
      </div>
      <div class="col-md-2 text-end">
        <button type="button" class="btn btn-outline-danger btn-remove-sale-item" title="Remove item">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
    <div class="text-end small text-muted mt-2">
      Line Total: <span class="sale-item-total fw-bold">$0.00</span>
    </div>
  `;

  saleItemsContainer.appendChild(row);
  updateSalePreview();
  return row;
};

const removeSaleItemRow = (row) => {
  if (!row || !saleItemsContainer) return;
  row.remove();
  ensureSaleItemRow();
  updateSalePreview();
};

const resetSaleForm = () => {
  if (saleForm) {
    saleForm.reset();
  }
  if (saleItemsContainer) {
    saleItemsContainer.innerHTML = '';
    addSaleItemRow();
  }
  updateSalePreview();
};

const collectSaleItemsFromForm = () => {
  if (!saleItemsContainer) return [];

  const rows = saleItemsContainer.querySelectorAll('.sale-item-row');
  const saleItems = [];

  rows.forEach(row => {
    const select = row.querySelector('.sale-item-select');
    const quantityInput = row.querySelector('.sale-item-quantity');

    if (!select || !quantityInput) {
      return;
    }

    const itemId = (select.value || '').trim();
    const quantityRaw = (quantityInput.value || '').trim();

    if (!itemId && !quantityRaw) {
      return;
    }

    const quantity = quantityRaw === '' ? NaN : Number(quantityRaw);

    saleItems.push({
      itemId,
      quantity,
      row
    });
  });

  return saleItems;
};

// Update sale total preview and stock info
const updateSalePreview = () => {
  if (!saleItemsContainer || !saleTotalPreview) return;

  let total = 0;
  let totalQuantity = 0;

  saleItemsContainer.querySelectorAll('.sale-item-row').forEach(row => {
    const select = row.querySelector('.sale-item-select');
    const quantityInput = row.querySelector('.sale-item-quantity');
    const stockInfo = row.querySelector('.sale-item-stock');
    const lineTotalEl = row.querySelector('.sale-item-total');

    if (!select || !quantityInput) {
      return;
    }

    const selectedItem = cachedItems.find(item => item._id === select.value);
    const quantityValue = (quantityInput.value || '').trim();
    const quantity = quantityValue === '' ? 0 : Number(quantityValue);

    if (stockInfo) {
      stockInfo.textContent = selectedItem ? `Available: ${selectedItem.quantity}` : 'Available: -';
    }

    let lineTotal = 0;

    if (selectedItem && quantity > 0) {
      lineTotal = selectedItem.price * quantity;
      total += lineTotal;
      totalQuantity += quantity;
    }

    if (lineTotalEl) {
      lineTotalEl.textContent = `$${lineTotal.toFixed(2)}`;
    }
  });

  saleTotalPreview.textContent = total > 0 ? `$${total.toFixed(2)}` : '-';
  return { total, totalQuantity };
};

// Load sales history
const loadSalesHistory = async () => {
  if (!salesHistoryBody) return;

  try {
    const sales = await ApiService.getSalesHistory();
    displaySalesHistory(sales);
  } catch (error) {
    showError('Failed to load sales history: ' + error.message);
  }
};

const displaySalesHistory = (sales) => {
  if (!salesHistoryBody) return;

  if (!sales.length) {
    salesHistoryBody.innerHTML = '<tr><td colspan="5" class="text-center">No sales recorded yet.</td></tr>';
    return;
  }

  salesHistoryBody.innerHTML = sales.map(sale => `
    <tr>
      <td>${formatSaleItemsCell(sale)}</td>
      <td>${sale.customerName || 'Walk-in Customer'}</td>
      <td>${getSaleTotalQuantity(sale)}</td>
      <td>$${(sale.totalAmount || 0).toFixed(2)}</td>
      <td>${new Date(sale.saleDate).toLocaleString()}</td>
    </tr>
  `).join('');
};

const formatSaleItemsCell = (sale) => {
  if (Array.isArray(sale.items) && sale.items.length) {
    return sale.items.map(item => `
      <div>${item.itemName} <span class="text-muted">x${item.quantity}</span></div>
    `).join('');
  }

  const fallbackName = sale.itemName || 'N/A';
  const fallbackQuantity = sale.quantity || 0;
  return `<div>${fallbackName} <span class="text-muted">x${fallbackQuantity}</span></div>`;
};

const getSaleTotalQuantity = (sale) => {
  if (typeof sale.totalQuantity === 'number' && !Number.isNaN(sale.totalQuantity)) {
    return sale.totalQuantity;
  }
  return sale.quantity || 0;
};

// Display items in the table
const displayItems = (items) => {
  if (!itemsList) return;
  
  if (items.length === 0) {
    itemsList.innerHTML = '<tr><td colspan="8" class="text-center">No items found</td></tr>';
    return;
  }
  
  itemsList.innerHTML = items.map(item => {
    // Highlight low stock items
    const quantityClass = item.quantity <= (item.minStockLevel || 10) ? 'text-danger fw-bold' : '';
    
    return `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td class="${quantityClass}">${item.quantity}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>${item.minStockLevel || 10}</td>
        <td>${item.supplier}</td>
        <td>${new Date(item.dateAdded).toLocaleDateString()}</td>
        <td class="action-buttons">
          <button class="btn btn-sm btn-warning btn-edit" data-id="${item._id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${item._id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Add event listeners to buttons
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', () => openEditModal(button.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', () => deleteItem(button.getAttribute('data-id')));
  });
};

// Switch between views (dashboard, inventory, reports)
const switchView = (viewName) => {
  // Hide all views
  dashboardView.classList.add('d-none');
  inventoryView.classList.add('d-none');
  reportsView.classList.add('d-none');
  
  // Remove active class from all links
  dashboardLink.classList.remove('active');
  inventoryLink.classList.remove('active');
  reportsLink.classList.remove('active');
  
  // Show the selected view and mark its link as active
  switch(viewName) {
    case 'dashboard':
      dashboardView.classList.remove('d-none');
      dashboardLink.classList.add('active');
      loadDashboardData();
      break;
    case 'inventory':
      inventoryView.classList.remove('d-none');
      inventoryLink.classList.add('active');
      loadItems();
      break;
    case 'reports':
      reportsView.classList.remove('d-none');
      reportsLink.classList.add('active');
      if (window.ChartManager) {
        window.ChartManager.updateAll();
      }
      break;
  }
  
  currentView = viewName;
};

// Set up all event listeners
const setupEventListeners = () => {
  // Add item form submission
  if (addItemForm) {
    addItemForm.addEventListener('submit', handleAddItem);
  }
  
  // Edit item form submission
  if (editItemForm) {
    editItemForm.addEventListener('submit', handleUpdateItem);
  }
  
  // Export to Hadoop button
  if (exportToHadoopBtn) {
    exportToHadoopBtn.addEventListener('click', handleExportToHadoop);
  }
  
  // Navigation links
  if (dashboardLink) {
    dashboardLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('dashboard');
    });
  }
  
  if (inventoryLink) {
    inventoryLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('inventory');
    });
  }
  
  if (reportsLink) {
    reportsLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('reports');
    });
  }

  if (saleForm) {
    saleForm.addEventListener('submit', handleRecordSale);
  }

  if (saleItemsContainer) {
    saleItemsContainer.addEventListener('change', handleSaleItemsInput);
    saleItemsContainer.addEventListener('input', handleSaleItemsInput);
    saleItemsContainer.addEventListener('click', handleSaleItemsClick);
  }

  if (addSaleItemBtn) {
    addSaleItemBtn.addEventListener('click', () => addSaleItemRow());
  }

  if (refreshSalesHistoryBtn) {
    refreshSalesHistoryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadSalesHistory();
    });
  }

  // Magic fill
  if (magicFillBtn) {
    magicFillBtn.addEventListener('click', () => handleMagicFill('add'));
  }
  if (editMagicFillBtn) {
    editMagicFillBtn.addEventListener('click', () => handleMagicFill('edit'));
  }

  // Refresh Dashboard
  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const originalHtml = refreshDashboardBtn.innerHTML;
      refreshDashboardBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Refreshing...';
      refreshDashboardBtn.disabled = true;
      
      try {
        await loadDashboardData();
        // Also refresh items just to be safe
        await loadItems();
      } catch (error) {
        console.error('Failed to refresh data', error);
      } finally {
        refreshDashboardBtn.innerHTML = originalHtml;
        refreshDashboardBtn.disabled = false;
      }
    });
  }
};

const handleMagicFill = async (mode) => {
  const nameInputId = mode === 'add' ? 'name' : 'editName';
  const categoryInputId = mode === 'add' ? 'category' : 'editCategory';
  const priceInputId = mode === 'add' ? 'price' : 'editPrice';
  const supplierInputId = mode === 'add' ? 'supplier' : 'editSupplier';
  const descriptionInputId = mode === 'add' ? 'description' : 'editDescription';
  const btnId = mode === 'add' ? 'magicFillBtn' : 'editMagicFillBtn';

  const nameInput = document.getElementById(nameInputId);
  const itemName = nameInput.value.trim();

  if (!itemName) {
    showError('Please enter an item name first to use Magic Fill.');
    nameInput.focus();
    return;
  }

  const btn = document.getElementById(btnId);
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Filling...';
  btn.disabled = true;

  try {
    const details = await ApiService.getMagicFill(itemName);
    
    if (details.category) document.getElementById(categoryInputId).value = details.category;
    if (details.price) document.getElementById(priceInputId).value = details.price;
    if (details.supplier) document.getElementById(supplierInputId).value = details.supplier;
    if (details.description) document.getElementById(descriptionInputId).value = details.description;
    
  } catch (error) {
    showError('Magic Fill failed: ' + error.message);
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
};

const handleSaleItemsInput = (event) => {
  if (
    event.target.classList.contains('sale-item-select') ||
    event.target.classList.contains('sale-item-quantity')
  ) {
    updateSalePreview();
  }
};

const handleSaleItemsClick = (event) => {
  const removeButton = event.target.closest('.btn-remove-sale-item');
  if (removeButton) {
    const row = removeButton.closest('.sale-item-row');
    removeSaleItemRow(row);
  }
};

// Handle adding a new item
const handleAddItem = async (event) => {
  event.preventDefault();
  
  const newItem = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    quantity: parseInt(document.getElementById('quantity').value),
    price: parseFloat(document.getElementById('price').value),
    supplier: document.getElementById('supplier').value,
    minStockLevel: parseInt(document.getElementById('minStockLevel').value)
  };
  
  try {
    await ApiService.createItem(newItem);
    addItemForm.reset();
    addItemModal.hide();
    loadItems();
    // Refresh dashboard data if on dashboard
    if (currentView === 'dashboard') {
      loadDashboardData();
    }
    showSuccess('Item added successfully!');
  } catch (error) {
    showError('Failed to add item: ' + error.message);
  }
};

// Open the edit modal and populate with item data
const openEditModal = async (itemId) => {
  try {
    const item = await ApiService.getItem(itemId);
    
    document.getElementById('editItemId').value = item._id;
    document.getElementById('editName').value = item.name;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editDescription').value = item.description || '';
    document.getElementById('editQuantity').value = item.quantity;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editSupplier').value = item.supplier;
    document.getElementById('editMinStockLevel').value = item.minStockLevel || 10;
    
    editItemModal.show();
  } catch (error) {
    showError('Failed to load item details: ' + error.message);
  }
};

// Handle updating an item
const handleUpdateItem = async (event) => {
  event.preventDefault();
  
  const itemId = document.getElementById('editItemId').value;
  const updatedItem = {
    name: document.getElementById('editName').value,
    category: document.getElementById('editCategory').value,
    description: document.getElementById('editDescription').value,
    quantity: parseInt(document.getElementById('editQuantity').value),
    price: parseFloat(document.getElementById('editPrice').value),
    supplier: document.getElementById('editSupplier').value,
    minStockLevel: parseInt(document.getElementById('editMinStockLevel').value)
  };
  
  try {
    await ApiService.updateItem(itemId, updatedItem);
    editItemModal.hide();
    loadItems();
    // Refresh dashboard data if on dashboard
    if (currentView === 'dashboard') {
      loadDashboardData();
    }
    showSuccess('Item updated successfully!');
  } catch (error) {
    showError('Failed to update item: ' + error.message);
  }
};

// Handle recording a sale
const handleRecordSale = async (event) => {
  event.preventDefault();

  if (!saleItemsContainer) return;

  const saleItemEntries = collectSaleItemsFromForm();

  if (!saleItemEntries.length) {
    showError('Please add at least one item to the sale.');
    return;
  }

  const validEntries = saleItemEntries.filter(
    (entry) => entry.itemId && !Number.isNaN(entry.quantity) && entry.quantity > 0
  );

  const invalidEntries = saleItemEntries.filter(
    (entry) => !entry.itemId || Number.isNaN(entry.quantity) || entry.quantity <= 0
  );

  if (!validEntries.length) {
    showError('Please select at least one item and enter a quantity greater than zero.');
    invalidEntries.forEach(entry => {
      entry.row?.classList.add('border-danger');
      setTimeout(() => entry.row?.classList.remove('border-danger'), 1500);
    });
    return;
  }

  if (invalidEntries.length) {
    invalidEntries.forEach(entry => removeSaleItemRow(entry.row));
  }

  const saleData = {
    customerName: saleCustomerInput?.value || undefined,
    items: validEntries.map(entry => ({
      itemId: entry.itemId,
      quantity: entry.quantity
    }))
  };

  try {
    await ApiService.createSale(saleData);
    resetSaleForm();
    loadItems();
    loadDashboardData();
    loadSalesHistory();
    showSuccess('Sale recorded successfully!');
  } catch (error) {
    showError('Failed to record sale: ' + error.message);
  }
};

// Handle deleting an item
const deleteItem = async (itemId) => {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }
  
  try {
    await ApiService.deleteItem(itemId);
    loadItems();
    // Refresh dashboard data if on dashboard
    if (currentView === 'dashboard') {
      loadDashboardData();
    }
    showSuccess('Item deleted successfully!');
  } catch (error) {
    showError('Failed to delete item: ' + error.message);
  }
};

// Handle exporting to Hadoop
const handleExportToHadoop = async () => {
  try {
    const result = await ApiService.exportToHadoop();
    
    // Display the export result
    hadoopExportDetails.innerHTML = `
      <p><strong>Status:</strong> ${result.message}</p>
      <p><strong>Items Exported:</strong> ${result.exportedItems}</p>
      <p><strong>Export Path:</strong> ${result.filePath}</p>
      <p class="mt-3">Data has been successfully exported for Hadoop processing.</p>
    `;
    
    // Show the result card
    hadoopExportResult.classList.remove('d-none');
    
    // Scroll to the result
    hadoopExportResult.scrollIntoView({ behavior: 'smooth' });
    
    showSuccess('Data exported to Hadoop successfully!');
  } catch (error) {
    showError('Failed to export to Hadoop: ' + error.message);
  }
};

// Show success message (you can enhance this with a toast or alert library)
const showSuccess = (message) => {
  console.log('Success:', message);
  alert(message);
};

// Show error message (you can enhance this with a toast or alert library)
const showError = (message) => {
  console.error('Error:', message);
  alert('Error: ' + message);
}; 