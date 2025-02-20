document.addEventListener('DOMContentLoaded', () => {
    const deleteAllChatsBtn = document.getElementById('delete-all-chats');
    const deleteAllConfirmationModal = document.getElementById('delete-all-confirmation-modal');
    const cancelDeleteAllBtn = document.getElementById('cancel-delete-all');
    const confirmDeleteAllBtn = document.getElementById('confirm-delete-all');
    const settingsModal = document.getElementById('settings-modal');

    // Only proceed if all required elements are found
    if (deleteAllChatsBtn && deleteAllConfirmationModal && cancelDeleteAllBtn && confirmDeleteAllBtn && settingsModal) {
        // Show confirmation modal when delete all button is clicked
        deleteAllChatsBtn.addEventListener('click', () => {
            deleteAllConfirmationModal.classList.remove('hidden');
        });

        // Hide confirmation modal when cancel is clicked
        cancelDeleteAllBtn.addEventListener('click', () => {
            deleteAllConfirmationModal.classList.add('hidden');
        });

        // Handle delete all chats when confirmed
        confirmDeleteAllBtn.addEventListener('click', () => {
            // Clear all messages
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }

            // Show welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.classList.remove('hidden');
            }

            // Clear chat history data and update UI
            window.chatHistoryData = {};
            window.updateChatHistoryUI();

            // Clear local storage
            localStorage.removeItem('chatHistory');

            // Hide both modals
            deleteAllConfirmationModal.classList.add('hidden');
            settingsModal.classList.add('hidden');

            // Reset current chat ID
            window.currentChatId = Date.now();
        });
    } else {
        console.warn('Some delete-all-chats modal elements are missing in the DOM');
    }
});
