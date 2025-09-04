/**
 * Admin Dashboard JavaScript
 * Comprehensive fitness tracker admin panel functionality
 */

class AdminDashboard {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.charts = {};
        this.apiBase = '/api/admin';
        
        this.init();
    }

    async init() {
        this.showLoading();
        
        try {
            // Check authentication
            await this.checkAuth();
            
            // Initialize dashboard
            await this.loadDashboard();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading
            this.hideLoading();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to load admin dashboard');
            this.hideLoading();
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
        
        if (!token) {
            this.redirectToLogin();
            return;
        }

        try {
            const response = await fetch('/api/admin/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            document.getElementById('adminUsername').textContent = data.username || 'Admin';
            
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
        }
    }

    setupEventListeners() {
        // Sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });
        }

        // Search and filter inputs
        document.getElementById('userSearch')?.addEventListener('input', debounce(() => this.filterUsers(), 300));
        document.getElementById('workoutSearch')?.addEventListener('input', debounce(() => this.filterWorkouts(), 300));
        document.getElementById('exerciseSearch')?.addEventListener('input', debounce(() => this.filterExercises(), 300));

        // Auto-refresh every 5 minutes
        setInterval(() => {
            if (document.querySelector('#dashboard.active')) {
                this.loadDashboard();
            }
        }, 300000);
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        // Create toast notification
        const toast = this.createToast('error', message);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showSuccess(message) {
        const toast = this.createToast('success', message);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    createToast(type, message) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
        toast.style.cssText = 'top: 100px; right: 20px; z-index: 10000; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        return toast;
    }

    // Navigation
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Add active class to corresponding nav link
        document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');

        // Load section data
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'workouts':
                await this.loadWorkouts();
                break;
            case 'exercises':
                await this.loadExercises();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    // Dashboard functionality
    async loadDashboard() {
        try {
            // Load statistics
            const statsResponse = await this.apiCall('/stats');
            this.updateDashboardStats(statsResponse);

            // Load charts
            await this.loadDashboardCharts();

            // Load recent activity
            await this.loadRecentActivity();

        } catch (error) {
            console.error('Dashboard load error:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalWorkouts').textContent = stats.totalWorkouts || 0;
        document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
        document.getElementById('totalCalories').textContent = this.formatNumber(stats.totalCalories || 0);
    }

    async loadDashboardCharts() {
        try {
            // Registration trend chart
            const registrationData = await this.apiCall('/charts/registration-trend');
            this.createRegistrationChart(registrationData);

            // Workout categories chart
            const workoutData = await this.apiCall('/charts/workout-categories');
            this.createWorkoutChart(workoutData);

        } catch (error) {
            console.error('Charts load error:', error);
        }
    }

    createRegistrationChart(data) {
        const ctx = document.getElementById('registrationChart');
        if (!ctx) return;

        if (this.charts.registration) {
            this.charts.registration.destroy();
        }

        this.charts.registration = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'New Users',
                    data: data.values || [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createWorkoutChart(data) {
        const ctx = document.getElementById('workoutChart');
        if (!ctx) return;

        if (this.charts.workout) {
            this.charts.workout.destroy();
        }

        this.charts.workout = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        '#667eea',
                        '#51cf66',
                        '#ffd43b',
                        '#ff6b6b',
                        '#339af0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadRecentActivity() {
        try {
            const activities = await this.apiCall('/recent-activity');
            const tbody = document.getElementById('recentActivityTable');
            
            tbody.innerHTML = activities.map(activity => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                                ${activity.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-semibold">${activity.username}</div>
                                <small class="text-muted">${activity.email}</small>
                            </div>
                        </div>
                    </td>
                    <td>${activity.activity}</td>
                    <td>${this.formatDate(activity.date)}</td>
                    <td>
                        <span class="badge bg-${activity.status === 'completed' ? 'success' : 'warning'}">
                            ${activity.status}
                        </span>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Recent activity load error:', error);
        }
    }

    // Users management
    async loadUsers(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: this.pageSize,
                search: document.getElementById('userSearch')?.value || '',
                status: document.getElementById('userStatusFilter')?.value || '',
                role: document.getElementById('userRoleFilter')?.value || ''
            });

            const data = await this.apiCall(`/users?${params}`);
            this.renderUsersTable(data.users);
            this.renderPagination('usersPagination', data.totalPages, page, (p) => this.loadUsers(p));

        } catch (error) {
            console.error('Users load error:', error);
            this.showError('Failed to load users');
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTable');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-3">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-semibold">${user.username}</div>
                            <small class="text-muted">${user.first_name || ''} ${user.last_name || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${user.last_login ? this.formatDate(user.last_login) : 'Never'}</td>
                <td>
                    <span class="badge bg-info">${user.total_workouts || 0}</span>
                </td>
                <td>
                    <span class="badge bg-${user.is_active ? 'success' : 'secondary'}">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminDashboard.viewUser(${user.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="adminDashboard.editUser(${user.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-${user.is_active ? 'secondary' : 'success'}" 
                                onclick="adminDashboard.toggleUserStatus(${user.id}, ${!user.is_active})">
                            <i class="bi bi-${user.is_active ? 'pause' : 'play'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async toggleUserStatus(userId, status) {
        try {
            await this.apiCall(`/users/${userId}/status`, 'PUT', { is_active: status });
            this.showSuccess(`User ${status ? 'activated' : 'deactivated'} successfully`);
            this.loadUsers(this.currentPage);
        } catch (error) {
            this.showError('Failed to update user status');
        }
    }

    // Workouts management
    async loadWorkouts(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: this.pageSize,
                search: document.getElementById('workoutSearch')?.value || '',
                dateFrom: document.getElementById('workoutDateFrom')?.value || '',
                dateTo: document.getElementById('workoutDateTo')?.value || '',
                intensity: document.getElementById('workoutIntensity')?.value || '',
                status: document.getElementById('workoutStatus')?.value || ''
            });

            const data = await this.apiCall(`/workouts?${params}`);
            this.renderWorkoutsTable(data.workouts);

        } catch (error) {
            console.error('Workouts load error:', error);
            this.showError('Failed to load workouts');
        }
    }

    renderWorkoutsTable(workouts) {
        const tbody = document.getElementById('workoutsTable');
        if (!tbody) return;

        tbody.innerHTML = workouts.map(workout => `
            <tr>
                <td>${this.formatDate(workout.workout_date)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                            ${workout.username.charAt(0).toUpperCase()}
                        </div>
                        ${workout.username}
                    </div>
                </td>
                <td>
                    <div>
                        <div class="fw-semibold">${workout.name || 'Unnamed Workout'}</div>
                        <small class="text-muted">${workout.description || ''}</small>
                    </div>
                </td>
                <td>${workout.duration_minutes || 0} min</td>
                <td>${workout.total_calories_burned || 0} cal</td>
                <td>
                    <span class="badge bg-${this.getIntensityColor(workout.intensity)}">
                        ${workout.intensity || 'N/A'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${workout.is_completed ? 'success' : 'warning'}">
                        ${workout.is_completed ? 'Completed' : 'Planned'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminDashboard.viewWorkout(${workout.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="adminDashboard.deleteWorkout(${workout.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getIntensityColor(intensity) {
        const colors = {
            'low': 'success',
            'moderate': 'warning',
            'high': 'danger',
            'very_high': 'dark'
        };
        return colors[intensity] || 'secondary';
    }

    // Exercises management
    async loadExercises() {
        try {
            const params = new URLSearchParams({
                search: document.getElementById('exerciseSearch')?.value || '',
                category: document.getElementById('exerciseCategory')?.value || '',
                difficulty: document.getElementById('exerciseDifficulty')?.value || ''
            });

            const data = await this.apiCall(`/exercises?${params}`);
            this.renderExercisesGrid(data.exercises);

        } catch (error) {
            console.error('Exercises load error:', error);
            this.showError('Failed to load exercises');
        }
    }

    renderExercisesGrid(exercises) {
        const grid = document.getElementById('exercisesGrid');
        if (!grid) return;

        grid.innerHTML = exercises.map(exercise => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="stat-card h-100">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h6 class="mb-0">${exercise.name}</h6>
                        <span class="badge bg-${this.getCategoryColor(exercise.category)}">
                            ${exercise.category}
                        </span>
                    </div>
                    <p class="text-muted small">${exercise.instructions || 'No instructions available'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${exercise.difficulty_level} level</small>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="adminDashboard.editExercise(${exercise.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="adminDashboard.deleteExercise(${exercise.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryColor(category) {
        const colors = {
            'cardio': 'danger',
            'strength': 'primary',
            'flexibility': 'success',
            'balance': 'warning',
            'sports': 'info',
            'functional': 'secondary'
        };
        return colors[category] || 'secondary';
    }

    // Analytics
    async loadAnalytics() {
        try {
            const data = await this.apiCall('/analytics');
            
            document.getElementById('avgSessionDuration').textContent = data.avgSessionDuration || '0 min';
            document.getElementById('retentionRate').textContent = (data.retentionRate || 0) + '%';
            document.getElementById('popularExercise').textContent = data.popularExercise || 'N/A';
            document.getElementById('growthRate').textContent = (data.growthRate || 0) + '%';

            // Load advanced charts
            this.createActivityHeatmap(data.activityHeatmap);
            this.createPerformanceChart(data.performanceTrends);

        } catch (error) {
            console.error('Analytics load error:', error);
            this.showError('Failed to load analytics');
        }
    }

    createActivityHeatmap(data) {
        // Implementation for activity heatmap
        // This would create a complex heatmap visualization
    }

    createPerformanceChart(data) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx || !data) return;

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: data.datasets || []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Utility functions
    async apiCall(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(this.apiBase + endpoint, options);
        
        if (!response.ok) {
            if (response.status === 401) {
                this.redirectToLogin();
                return;
            }
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
    }

    redirectToLogin() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    renderPagination(containerId, totalPages, currentPage, callback) {
        const container = document.getElementById(containerId);
        if (!container || totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let pagination = '';
        
        // Previous button
        pagination += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ${currentPage > 1 ? callback.name + '(' + (currentPage - 1) + ')' : ''}">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            pagination += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); ${callback.name}(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        pagination += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ${currentPage < totalPages ? callback.name + '(' + (currentPage + 1) + ')' : ''}">Next</a>
            </li>
        `;

        container.innerHTML = pagination;
    }

    // Filter functions
    filterUsers() {
        this.loadUsers(1);
    }

    filterWorkouts() {
        this.loadWorkouts(1);
    }

    filterExercises() {
        this.loadExercises();
    }

    // Action functions
    refreshDashboard() {
        this.loadDashboard();
    }

    refreshAnalytics() {
        this.loadAnalytics();
    }

    // Placeholder functions for modals and actions
    showAddUserModal() {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }

    async addUser() {
        // Implementation for adding user
        this.showSuccess('User added successfully');
    }

    viewUser(userId) {
        // Implementation for viewing user details
        console.log('View user:', userId);
    }

    editUser(userId) {
        // Implementation for editing user
        console.log('Edit user:', userId);
    }

    viewWorkout(workoutId) {
        // Implementation for viewing workout details
        console.log('View workout:', workoutId);
    }

    deleteWorkout(workoutId) {
        // Implementation for deleting workout
        if (confirm('Are you sure you want to delete this workout?')) {
            console.log('Delete workout:', workoutId);
        }
    }

    editExercise(exerciseId) {
        // Implementation for editing exercise
        console.log('Edit exercise:', exerciseId);
    }

    deleteExercise(exerciseId) {
        // Implementation for deleting exercise
        if (confirm('Are you sure you want to delete this exercise?')) {
            console.log('Delete exercise:', exerciseId);
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.redirectToLogin();
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Global functions for inline event handlers
function showSection(sectionId) {
    adminDashboard.showSection(sectionId);
}

function showProfile() {
    console.log('Show profile');
}

function showSettings() {
    adminDashboard.showSection('settings');
}

function logout() {
    adminDashboard.logout();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
