// Global sidebar toggle logic for mobile/tablet across roles
(function() {
    function initSidebarToggle() {
        const toggleBtn = document.getElementById('sidebarToggle') || document.getElementById('mobileSidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        function openSidebar() {
            sidebar.classList.add('show');
            overlay.classList.add('show');
            document.body.classList.add('sidebar-open');
        }
        function closeSidebar() {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            document.body.classList.remove('sidebar-open');
        }
        function toggleSidebar() {
            if (sidebar.classList.contains('show')) closeSidebar(); else openSidebar();
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleSidebar();
            });
        }
        overlay.addEventListener('click', closeSidebar);
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 992) closeSidebar();
        });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initSidebarToggle();
    } else {
        document.addEventListener('DOMContentLoaded', initSidebarToggle);
    }
})();


