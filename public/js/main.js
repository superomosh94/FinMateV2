// Unified sidebar/hamburger toggle handler
(function () {
    function safeGet(idOrSelector) {
        if (!idOrSelector) return null;
        if (idOrSelector[0] === '#' ) return document.getElementById(idOrSelector.slice(1));
        return document.querySelector(idOrSelector);
    }

    function createIfMissingOverlay(selector, className) {
        let el = null;
        if (!selector) el = document.querySelector('.' + className) || document.querySelector('#' + className);
        else el = document.getElementById(selector) || document.querySelector(selector);
        if (!el) {
            el = document.createElement('div');
            el.className = className;
            document.body.appendChild(el);
        }
        return el;
    }

    function wireToggle(options) {
        // options: { toggles: [], sidebarSelectors: [], overlaySelectors: [], openClassSidebar, openClassOverlay, overlayActiveClass }
        const toggleBtn = options.toggles.map(id => document.getElementById(id)).find(Boolean);
        const sidebar = options.sidebarSelectors.map(s => safeGet(s)).find(Boolean);
        let overlay = options.overlaySelectors.map(s => safeGet(s)).find(Boolean);

        if (!sidebar && !toggleBtn) return;

        if (!overlay && options.overlayCreate) {
            overlay = createIfMissingOverlay(options.overlayCreate, options.overlayClass || 'sidebar-overlay');
        }

        function open() {
            if (sidebar && options.openClassSidebar) sidebar.classList.add(options.openClassSidebar);
            if (overlay && options.openClassOverlay) overlay.classList.add(options.openClassOverlay);
            if (options.bodyClass) document.body.classList.add(options.bodyClass);
        }
        function close() {
            if (sidebar && options.openClassSidebar) sidebar.classList.remove(options.openClassSidebar);
            if (overlay && options.openClassOverlay) overlay.classList.remove(options.openClassOverlay);
            if (options.bodyClass) document.body.classList.remove(options.bodyClass);
        }
        function toggle() {
            const isOpen = sidebar && options.openClassSidebar && sidebar.classList.contains(options.openClassSidebar);
            if (isOpen) close(); else open();
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function (e) {
                if (e) e.preventDefault();
                toggle();
            });
        }

        if (overlay) overlay.addEventListener('click', close);
        window.addEventListener('resize', function () {
            if (window.innerWidth >= 992) close();
        });
    }

    function init() {
        // Admin sidebar (admin-sidebar.ejs)
        wireToggle({
            toggles: ['mobileMenuToggle'],
            sidebarSelectors: ['#adminSidebar', '.admin-sidebar'],
            overlaySelectors: ['#sidebarOverlay', '.sidebar-overlay'],
            overlayCreate: 'sidebarOverlay',
            overlayClass: 'sidebar-overlay',
            openClassSidebar: 'mobile-open',
            openClassOverlay: 'active',
            bodyClass: 'sidebar-open'
        });

        // Generic mobile sidebar used in main sidebar partial
        wireToggle({
            toggles: ['mobileSidebarToggle', 'sidebarToggle'],
            sidebarSelectors: ['#mobileSidebar', '.mobile-sidebar'],
            overlaySelectors: ['#mobileSidebarOverlay', '.mobile-sidebar-overlay'],
            overlayCreate: 'mobileSidebarOverlay',
            overlayClass: 'mobile-sidebar-overlay',
            openClassSidebar: 'mobile-open',
            openClassOverlay: 'show',
            bodyClass: 'sidebar-open'
        });

        // Fallback for elements that rely on .sidebar + .sidebar-overlay + 'show'
        wireToggle({
            toggles: ['sidebarToggle'],
            sidebarSelectors: ['.sidebar', '#sidebar', '.admin-sidebar'],
            overlaySelectors: ['.sidebar-overlay', '#sidebarOverlay'],
            overlayCreate: 'sidebarOverlay',
            overlayClass: 'sidebar-overlay',
            openClassSidebar: 'show',
            openClassOverlay: 'show',
            bodyClass: 'sidebar-open'
        });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') init();
    else document.addEventListener('DOMContentLoaded', init);
})();


