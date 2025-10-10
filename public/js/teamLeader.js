// Team Leader specific JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeTeamLeaderApp();
});

function initializeTeamLeaderApp() {
    // Initialize all components
    initializeComponents();
    setupEventListeners();
    loadTeamData();
    setupRealTimeUpdates();
}

function initializeComponents() {
    // Bootstrap tooltips
    const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltips.map(function (tooltip) {
        return new bootstrap.Tooltip(tooltip);
    });

    // Bootstrap popovers
    const popovers = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popovers.map(function (popover) {
        return new bootstrap.Popover(popover);
    });
}

function setupEventListeners() {
    // Expense approval handlers
    document.querySelectorAll('.approve-expense').forEach(button => {
        button.addEventListener('click', handleExpenseApproval);
    });

    document.querySelectorAll('.reject-expense').forEach(button => {
        button.addEventListener('click', handleExpenseRejection);
    });

    // Team member management
    document.querySelectorAll('.remove-member').forEach(button => {
        button.addEventListener('click', handleMemberRemoval);
    });

    // Budget management
    document.querySelectorAll('.edit-budget').forEach(button => {
        button.addEventListener('click', handleBudgetEdit);
    });

    // Quick actions
    document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });

    // Search and filter
    const searchInput = document.getElementById('teamSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterTeamData);
    }

    // Export buttons
    document.querySelectorAll('.export-btn').forEach(button => {
        button.addEventListener('click', handleExport);
    });
}

function loadTeamData() {
    // Load team statistics
    fetch('/team-leader/api/team-stats')
        .then(response => response.json())
        .then(data => {
            updateTeamStats(data);
        })
        .catch(error => {
            console.error('Error loading team stats:', error);
        });

    // Load recent activities
    fetch('/team-leader/api/recent-activities')
        .then(response => response.json())
        .then(data => {
            updateRecentActivities(data);
        })
        .catch(error => {
            console.error('Error loading recent activities:', error);
        });
}

function handleExpenseApproval(event) {
    const button = event.currentTarget;
    const expenseId = button.dataset.expenseId;
    
    if (confirm('Are you sure you want to approve this expense?')) {
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        fetch(`/team-leader/expenses/approve/${expenseId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Expense approved successfully', 'success');
                updateExpenseRow(expenseId, 'approved');
            } else {
                showNotification('Error approving expense', 'error');
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-check"></i>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error approving expense', 'error');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-check"></i>';
        });
    }
}

function handleExpenseRejection(event) {
    const button = event.currentTarget;
    const expenseId = button.dataset.expenseId;
    
    if (confirm('Are you sure you want to reject this expense?')) {
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        fetch(`/team-leader/expenses/reject/${expenseId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Expense rejected successfully', 'success');
                updateExpenseRow(expenseId, 'rejected');
            } else {
                showNotification('Error rejecting expense', 'error');
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-times"></i>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error rejecting expense', 'error');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-times"></i>';
        });
    }
}

function updateExpenseRow(expenseId, status) {
    const row = document.querySelector(`[data-expense-id="${expenseId}"]`);
    if (row) {
        // Update status badge
        const statusBadge = row.querySelector('.expense-status');
        if (statusBadge) {
            statusBadge.className = `badge bg-${status === 'approved' ? 'success' : 'danger'} expense-status`;
            statusBadge.textContent = status;
        }
        
        // Remove action buttons
        const actionCell = row.querySelector('.expense-actions');
        if (actionCell) {
            actionCell.innerHTML = '<span class="text-muted">Action completed</span>';
        }
    }
}

function handleMemberRemoval(event) {
    const button = event.currentTarget;
    const memberId = button.dataset.memberId;
    const memberName = button.dataset.memberName;
    
    if (confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        fetch(`/team-leader/team/remove-member/${memberId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Team member removed successfully', 'success');
                // Remove the member row
                const row = button.closest('tr');
                if (row) {
                    row.remove();
                }
                // Update team stats
                loadTeamData();
            } else {
                showNotification('Error removing team member', 'error');
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-user-times"></i>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error removing team member', 'error');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-user-times"></i>';
        });
    }
}

function handleBudgetEdit(event) {
    const button = event.currentTarget;
    const budgetId = button.dataset.budgetId;
    
    // Open budget edit modal or redirect to edit page
    window.location.href = `/team-leader/budgets/edit/${budgetId}`;
}

function handleQuickAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    
    switch (action) {
        case 'add-expense':
            window.location.href = '/team-leader/expenses/add';
            break;
        case 'view-reports':
            generateTeamReport();
            break;
        case 'send-announcement':
            openAnnouncementModal();
            break;
        case 'schedule-meeting':
            openMeetingModal();
            break;
    }
}

function filterTeamData() {
    const searchTerm = document.getElementById('teamSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.team-member-row, .expense-row');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function handleExport(event) {
    const button = event.currentTarget;
    const exportType = button.dataset.exportType;
    
    showNotification(`Exporting ${exportType} data...`, 'info');
    
    fetch(`/team-leader/export/${exportType}`, {
        method: 'GET',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken()
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification(`${exportType} data exported successfully`, 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error exporting data', 'error');
    });
}

function updateTeamStats(stats) {
    // Update each stat card
    Object.keys(stats).forEach(statKey => {
        const element = document.querySelector(`[data-stat="${statKey}"]`);
        if (element) {
            // Animate number change
            animateValue(element, parseInt(element.textContent) || 0, stats[statKey], 1000);
        }
    });
}

function updateRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (container) {
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="mb-1">${activity.description}</p>
                    <small class="text-muted">${activity.time}</small>
                </div>
            </div>
        `).join('');
    }
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function setupRealTimeUpdates() {
    // Check for new expenses every minute
    setInterval(() => {
        fetch('/team-leader/api/pending-expenses-count')
            .then(response => response.json())
            .then(data => {
                updatePendingExpensesBadge(data.count);
            })
            .catch(error => console.error('Error fetching pending expenses:', error));
    }, 60000);
}

function updatePendingExpensesBadge(count) {
    const badge = document.querySelector('.pending-expenses-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
            
            // Pulse animation for new pending expenses
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

function generateTeamReport() {
    showNotification('Generating team report...', 'info');
    
    fetch('/team-leader/reports/generate', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Team report generated successfully', 'success');
            // Open report in new tab or download
            if (data.reportUrl) {
                window.open(data.reportUrl, '_blank');
            }
        } else {
            showNotification('Error generating report', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error generating report', 'error');
    });
}

function openAnnouncementModal() {
    // Implementation for announcement modal
    console.log('Open announcement modal');
}

function openMeetingModal() {
    // Implementation for meeting scheduling modal
    console.log('Open meeting modal');
}

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px;';
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${icons[type]} me-2"></i>
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

// Utility functions
window.TeamLeaderApp = {
    showNotification,
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString();
    }
};