// Super Admin specific JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Confirm before destructive actions
    const deleteButtons = document.querySelectorAll('.btn-outline-danger');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    });

    // Role permissions management
    const permissionCheckboxes = document.querySelectorAll('.permission-checkbox');
    permissionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const roleId = this.dataset.roleId;
            const permissionId = this.dataset.permissionId;
            const isChecked = this.checked;

            updateRolePermission(roleId, permissionId, isChecked);
        });
    });

    // User status toggles
    const statusToggles = document.querySelectorAll('.user-status-toggle');
    statusToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const userId = this.dataset.userId;
            const isActive = this.checked;

            updateUserStatus(userId, isActive);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('tbody tr');
            
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Export data functionality
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const dataType = this.dataset.type;
            exportData(dataType);
        });
    });
});

// Update role permissions via AJAX
function updateRolePermission(roleId, permissionId, isChecked) {
    fetch('/super-admin/roles/update-permission', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
            role_id: roleId,
            permission_id: permissionId,
            granted: isChecked
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Permission updated successfully', 'success');
        } else {
            showNotification('Error updating permission', 'error');
            // Revert checkbox state
            const checkbox = document.querySelector(`[data-role-id="${roleId}"][data-permission-id="${permissionId}"]`);
            if (checkbox) {
                checkbox.checked = !isChecked;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating permission', 'error');
    });
}

// Update user status via AJAX
function updateUserStatus(userId, isActive) {
    fetch('/super-admin/users/update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
            user_id: userId,
            is_active: isActive
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('User status updated successfully', 'success');
        } else {
            showNotification('Error updating user status', 'error');
            // Revert toggle state
            const toggle = document.querySelector(`[data-user-id="${userId}"]`);
            if (toggle) {
                toggle.checked = !isActive;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating user status', 'error');
    });
}

// Export data function
function exportData(dataType) {
    showNotification(`Exporting ${dataType} data...`, 'info');
    
    fetch(`/super-admin/export/${dataType}`, {
        method: 'GET',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification(`${dataType} data exported successfully`, 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error exporting data', 'error');
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Chart initialization for dashboard
function initializeCharts() {
    // User distribution chart
    const userCtx = document.getElementById('userDistributionChart');
    if (userCtx) {
        new Chart(userCtx, {
            type: 'doughnut',
            data: {
                labels: ['Super Admin', 'Admin', 'Team Leader', 'Team Member', 'Individual User'],
                datasets: [{
                    data: [1, 1, 2, 5, 10], // Example data
                    backgroundColor: [
                        '#dc3545',
                        '#fd7e14',
                        '#20c997',
                        '#0dcaf0',
                        '#6f42c1'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Expense trend chart
    const expenseCtx = document.getElementById('expenseTrendChart');
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Total Expenses',
                    data: [1200, 1900, 1500, 2000, 1800, 2200],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true
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

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCharts);