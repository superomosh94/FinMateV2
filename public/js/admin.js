// Admin specific JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    initializeBootstrapComponents();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initializeCharts();
    
    // Setup real-time updates
    setupRealTimeUpdates();
});

function initializeBootstrapComponents() {
    // Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

function setupEventListeners() {
    // Auto-dismiss alerts
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    });

    // Confirm destructive actions
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });

    // Bulk actions
    const bulkActionSelect = document.getElementById('bulkAction');
    const bulkActionButton = document.getElementById('applyBulkAction');
    const selectAllCheckbox = document.getElementById('selectAll');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');

    if (selectAllCheckbox && itemCheckboxes.length > 0) {
        selectAllCheckbox.addEventListener('change', function() {
            itemCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActionButton();
        });

        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateSelectAllCheckbox();
                updateBulkActionButton();
            });
        });
    }

    if (bulkActionSelect && bulkActionButton) {
        bulkActionSelect.addEventListener('change', updateBulkActionButton);
    }

    // Search and filter functionality
    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }

    const filterSelects = document.querySelectorAll('.table-filter');
    filterSelects.forEach(select => {
        select.addEventListener('change', filterTable);
    });

    // Expense approval/rejection
    const approveButtons = document.querySelectorAll('.btn-approve');
    const rejectButtons = document.querySelectorAll('.btn-reject');

    approveButtons.forEach(button => {
        button.addEventListener('click', handleExpenseAction);
    });

    rejectButtons.forEach(button => {
        button.addEventListener('click', handleExpenseAction);
    });

    // Quick stats refresh
    const refreshStatsBtn = document.getElementById('refreshStats');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', refreshStats);
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    
    if (selectAllCheckbox && itemCheckboxes.length > 0) {
        const allChecked = Array.from(itemCheckboxes).every(checkbox => checkbox.checked);
        const someChecked = Array.from(itemCheckboxes).some(checkbox => checkbox.checked);
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
}

function updateBulkActionButton() {
    const bulkActionSelect = document.getElementById('bulkAction');
    const bulkActionButton = document.getElementById('applyBulkAction');
    const selectedItems = document.querySelectorAll('.item-checkbox:checked');
    
    if (bulkActionSelect && bulkActionButton) {
        const hasSelection = selectedItems.length > 0;
        const hasAction = bulkActionSelect.value !== '';
        
        bulkActionButton.disabled = !(hasSelection && hasAction);
    }
}

function filterTable() {
    const searchTerm = (document.getElementById('tableSearch')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    const activeFilters = {};
    
    // Collect active filters
    document.querySelectorAll('.table-filter').forEach(select => {
        if (select.value) {
            activeFilters[select.name] = select.value;
        }
    });

    rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        let shouldShow = true;
        
        // Apply search filter
        if (searchTerm && !rowText.includes(searchTerm)) {
            shouldShow = false;
        }
        
        // Apply other filters
        for (const [filterName, filterValue] of Object.entries(activeFilters)) {
            const cell = row.querySelector(`[data-${filterName}]`);
            if (cell && cell.getAttribute(`data-${filterName}`) !== filterValue) {
                shouldShow = false;
                break;
            }
        }
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

function handleExpenseAction(e) {
    const button = e.currentTarget;
    const expenseId = button.dataset.expenseId;
    const action = button.classList.contains('btn-approve') ? 'approve' : 'reject';
    
    if (confirm(`Are you sure you want to ${action} this expense?`)) {
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        fetch(`/admin/expenses/${action}/${expenseId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(`Expense ${action}ed successfully`, 'success');
                // Remove the row or update its status
                const row = button.closest('tr');
                if (row) {
                    if (action === 'approve') {
                        row.querySelector('.badge').className = 'badge bg-success';
                        row.querySelector('.badge').textContent = 'approved';
                    } else {
                        row.querySelector('.badge').className = 'badge bg-danger';
                        row.querySelector('.badge').textContent = 'rejected';
                    }
                    
                    // Remove action buttons
                    row.querySelectorAll('.btn-approve, .btn-reject').forEach(btn => btn.remove());
                }
            } else {
                showNotification(`Error ${action}ing expense`, 'error');
                button.disabled = false;
                button.innerHTML = action === 'approve' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(`Error ${action}ing expense`, 'error');
            button.disabled = false;
            button.innerHTML = action === 'approve' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
        });
    }
}

function refreshStats() {
    const refreshBtn = document.getElementById('refreshStats');
    const statsContainer = document.getElementById('statsContainer');
    
    if (refreshBtn && statsContainer) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        statsContainer.classList.add('loading');
        
        fetch('/admin/dashboard/stats')
            .then(response => response.json())
            .then(data => {
                updateStatsDisplay(data);
            })
            .catch(error => {
                console.error('Error refreshing stats:', error);
                showNotification('Error refreshing statistics', 'error');
            })
            .finally(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                statsContainer.classList.remove('loading');
            });
    }
}

function updateStatsDisplay(stats) {
    // Update each stat card with new data
    Object.keys(stats).forEach(statKey => {
        const element = document.querySelector(`[data-stat="${statKey}"]`);
        if (element) {
            element.textContent = stats[statKey];
        }
    });
}

function initializeCharts() {
    // Expense by category chart
    const expenseCategoryCtx = document.getElementById('expenseCategoryChart');
    if (expenseCategoryCtx) {
        const chartData = JSON.parse(expenseCategoryCtx.dataset.chart || '{}');
        
        new Chart(expenseCategoryCtx, {
            type: 'pie',
            data: {
                labels: chartData.labels || [],
                datasets: [{
                    data: chartData.data || [],
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#f5576c',
                        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                        '#fa709a', '#fee140'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Monthly trend chart
    const monthlyTrendCtx = document.getElementById('monthlyTrendChart');
    if (monthlyTrendCtx) {
        new Chart(monthlyTrendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Expenses',
                    data: [1200, 1900, 1500, 2000, 1800, 2200, 2400, 2100, 2300, 2500, 2700, 3000],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function setupRealTimeUpdates() {
    // Check for new notifications every 30 seconds
    setInterval(() => {
        fetch('/admin/notifications/count')
            .then(response => response.json())
            .then(data => {
                updateNotificationBadge(data.count);
            })
            .catch(error => console.error('Error fetching notification count:', error));
    }, 30000);
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
            
            // Add pulse animation for new notifications
            if (parseInt(badge.dataset.lastCount || 0) < count) {
                badge.classList.add('pulse');
                setTimeout(() => badge.classList.remove('pulse'), 2000);
            }
        } else {
            badge.style.display = 'none';
        }
        badge.dataset.lastCount = count;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px;';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Utility function for formatting numbers
function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

// Utility function for formatting currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Export functions for global use
window.AdminApp = {
    showNotification,
    formatNumber,
    formatCurrency,
    refreshStats
};