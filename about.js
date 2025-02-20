// Get DOM elements
const aboutButton = document.getElementById('about-btn');
const aboutModal = document.getElementById('about-modal');
const closeAboutButton = document.getElementById('close-about');
const sidebarElement = document.getElementById('sidebar');

// Function to close sidebar
function closeSidebar() {
    if (sidebarElement) {
        sidebarElement.classList.add('hidden');
        sidebarElement.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
}

// About button click handler
if (aboutButton) {
    aboutButton.addEventListener('click', () => {
        // Close the sidebar first
        closeSidebar();
        
        // Then show the About modal
        if (aboutModal) {
            aboutModal.classList.remove('hidden');
            aboutModal.classList.add('animate-fade-in');
        }
    });
}

// Close About modal button handler
if (closeAboutButton) {
    closeAboutButton.addEventListener('click', () => {
        if (aboutModal) {
            aboutModal.classList.add('animate-fade-out');
            setTimeout(() => {
                aboutModal.classList.add('hidden');
                aboutModal.classList.remove('animate-fade-out');
            }, 300);
        }
    });
}