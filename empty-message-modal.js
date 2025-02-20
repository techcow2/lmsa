document.addEventListener('DOMContentLoaded', () => {
    const emptyMessageModal = document.getElementById('empty-message-modal');
    const closeModalButton = emptyMessageModal.querySelector('.close-modal');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');

    // Function to show the modal
    function showEmptyMessageModal() {
        emptyMessageModal.classList.remove('hidden');
        emptyMessageModal.classList.add('active');
    }

    // Function to hide the modal
    function hideEmptyMessageModal() {
        emptyMessageModal.classList.remove('active');
        setTimeout(() => {
            emptyMessageModal.classList.add('hidden');
        }, 300); // Match the transition duration
    }

    // Handle empty message check before form submission
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const messageContent = userInput.value.trim();
            if (messageContent === '') {
                e.preventDefault();
                showEmptyMessageModal();
                userInput.focus();
            }
        }
    });

    // Handle empty message check for send button
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', (e) => {
            const messageContent = userInput.value.trim();
            if (messageContent === '') {
                e.preventDefault();
                showEmptyMessageModal();
                userInput.focus();
            }
        });
    }

    // Close modal when clicking the close button
    closeModalButton.addEventListener('click', hideEmptyMessageModal);

    // Close modal when clicking outside
    emptyMessageModal.addEventListener('click', (e) => {
        if (e.target === emptyMessageModal) {
            hideEmptyMessageModal();
        }
    });

    // Close modal when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && emptyMessageModal.classList.contains('active')) {
            hideEmptyMessageModal();
        }
    });
});