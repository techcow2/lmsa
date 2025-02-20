document.addEventListener('DOMContentLoaded', () => {
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help');
    const sidebarElement = document.getElementById('sidebar');
    // Function to close sidebar
    function closeSidebar() {
        if (sidebarElement) {
            sidebarElement.classList.add('hidden');
            sidebarElement.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    }

    // Only proceed if all required elements are found
    if (helpBtn && helpModal && closeHelpBtn) {
        // Function to close help modal
        function closeHelpModal() {
            helpModal.classList.add('hidden');
        }

        // Event listeners
        helpBtn.addEventListener('click', () => {
            // Close the sidebar first
            closeSidebar();
            // Show the help modal
            helpModal.classList.remove('hidden');
        });

        closeHelpBtn.addEventListener('click', closeHelpModal);

        // Close modal when clicking outside
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                closeHelpModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
                closeHelpModal();
            }
        });
    } else {
        console.warn('Some help modal elements are missing in the DOM');
    }
});
