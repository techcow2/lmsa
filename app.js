const chatContainer = document.getElementById('chat-container');
const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const serverIpInput = document.getElementById('server-ip');
const serverPortInput = document.getElementById('server-port');
const systemPromptInput = document.getElementById('system-prompt');
const clearChatButton = document.getElementById('clear-chat');
const loadingIndicator = document.getElementById('loading-indicator');
const sidebar = document.getElementById('sidebar');
const newChatButton = document.getElementById('new-chat');
const chatHistory = document.getElementById('chat-history');
const settingsButton = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsButton = document.getElementById('close-settings');
const welcomeMessage = document.getElementById('welcome-message');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebarButton = document.getElementById('close-sidebar');
const loadedModelDisplay = document.getElementById('loaded-model');

// New variables for send and stop buttons
const sendButton = document.getElementById('send-button');
const stopButton = document.getElementById('stop-button');

// New variables for confirmation modal
const confirmationModal = document.getElementById('confirmation-modal');
const confirmActionButton = document.getElementById('confirm-action');
const cancelActionButton = document.getElementById('cancel-action');
const confirmationMessage = document.getElementById('confirmation-message');

// New variables for context menu
const contextMenu = document.getElementById('context-menu');
const copyTextButton = document.getElementById('copy-text');
const regenerateTextButton = document.getElementById('regenerate-text');

// New variables for exit functionality
const exitButton = document.getElementById('exit-btn');

let API_URL = '';

// Load saved server settings
const savedIp = localStorage.getItem('serverIp');
const savedPort = localStorage.getItem('serverPort');

if (serverIpInput && serverPortInput) {
    if (savedIp) serverIpInput.value = savedIp;
    if (savedPort) serverPortInput.value = savedPort;
    
    if (savedIp && savedPort) {
        API_URL = `http://${savedIp}:${savedPort}/v1/chat/completions`;
    }

    // Add event listeners for IP and port inputs
    serverIpInput.addEventListener('change', updateServerUrl);
    serverPortInput.addEventListener('change', updateServerUrl);
}

function updateServerUrl() {
    const ip = serverIpInput.value.trim();
    const port = serverPortInput.value.trim();
    
    if (ip && port) {
        API_URL = `http://${ip}:${port}/v1/chat/completions`;
        localStorage.setItem('serverIp', ip);
        localStorage.setItem('serverPort', port);
        fetchAvailableModels();
    }
}
let currentChatId = Date.now();
let chatHistoryData = {};
let systemPrompt = '';
let temperature = 0.9;
let availableModels = [];
let isFirstMessage = true;
let chatToDelete = null; // New variable to store the chat ID to be deleted
let longPressTimer;
let selectedText = '';
let selectedMessageElement = null;
let actionToPerform = null;

// New variable for AbortController
let abortController = null;

// Prevent default touch behavior except for the messages container
document.body.addEventListener('touchmove', function(e) {
    if (e.target.closest('#messages') === null) {
        e.preventDefault();
    }
}, { passive: false });

// Allow scrolling within the messages container
if (messagesContainer) {
    messagesContainer.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: true });
}



if (systemPromptInput) {
    systemPromptInput.addEventListener('change', () => {
        systemPrompt = systemPromptInput.value;
        localStorage.setItem('systemPrompt', systemPrompt);
    });
}

function initializeTemperature() {
    const temperatureInput = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    const temperatureLock = document.getElementById('temperature-lock');

    if (temperatureInput && temperatureValue && temperatureLock) {
        temperatureInput.addEventListener('input', () => {
            const inputValue = temperatureInput.value;
            const parsedValue = parseFloat(inputValue);
            
            if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 2.0 && /^\d*\.?\d{0,1}$/.test(inputValue)) {
                temperature = parsedValue;
                temperatureValue.textContent = temperature.toFixed(1);
                localStorage.setItem('temperature', temperature);
            } else {
                temperatureInput.value = temperature.toFixed(1);
            }
        });

        temperatureLock.addEventListener('click', () => {
            const isLocked = temperatureInput.disabled;
            temperatureInput.disabled = !isLocked;
            temperatureLock.innerHTML = isLocked ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-lock"></i>';
        });

        // Load saved temperature
        const savedTemperature = localStorage.getItem('temperature');
        if (savedTemperature) {
            const parsedTemperature = parseFloat(savedTemperature);
            if (!isNaN(parsedTemperature) && parsedTemperature >= 0 && parsedTemperature <= 2.0) {
                temperatureInput.value = parsedTemperature.toFixed(1);
                temperature = parsedTemperature;
                temperatureValue.textContent = temperature.toFixed(1);
            } else {
                // If saved temperature is invalid, set to default
                temperatureInput.value = '0.9';
                temperature = 0.9;
                temperatureValue.textContent = '0.9';
            }
        } else {
            // Set default temperature to 0.9
            temperatureInput.value = '0.9';
            temperature = 0.9;
            temperatureValue.textContent = '0.9';
        }
    }
}

function updateLoadedModelDisplay(modelName) {
    if (loadedModelDisplay) {
        loadedModelDisplay.textContent = `Loaded Model: ${modelName}`;
        loadedModelDisplay.style.display = 'block';
    }
}

async function fetchAvailableModels() {
    try {
        if (!serverIpInput || !serverPortInput) return;
        const response = await fetch(`http://${serverIpInput.value}:${serverPortInput.value}/v1/models`);
        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        availableModels = data.data.map(model => model.id);
        console.log('Available models:', availableModels);
        if (availableModels.length > 0) {
            updateLoadedModelDisplay(availableModels[0]);
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        appendMessage('error', 'Failed to fetch available models. Please check your LM Studio server connection.');
    }
}

if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        hideWelcomeMessage();
        appendMessage('user', message);
        userInput.value = '';
        showLoadingIndicator();
        toggleSendStopButton();

        if (isFirstMessage) {
            if (loadedModelDisplay) {
                loadedModelDisplay.style.display = 'none';
            }
            isFirstMessage = false;
        }

        try {
            if (!(await isServerRunning())) {
                throw new Error('LM Studio server is not running');
            }

            if (availableModels.length === 0) {
                await fetchAvailableModels();
            }

            if (availableModels.length === 0) {
                throw new Error('No models available');
            }

            const currentChat = chatHistoryData[currentChatId] || [];
            const messages = [
                { role: 'system', content: systemPrompt },
                ...currentChat.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message }
            ];

            abortController = new AbortController();

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: availableModels[0], // Use the first available model
                    messages: messages,
                    temperature: temperature,
                    stream: true, // Enable streaming
                }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let aiMessage = '';
            const aiMessageElement = appendMessage('ai', '');

            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (isFirstChunk) {
                    hideLoadingIndicator();
                    isFirstChunk = false;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                const parsedLines = lines
                    .map(line => line.replace(/^data: /, '').trim())
                    .filter(line => line !== '' && line !== '[DONE]')
                    .map(line => JSON.parse(line));

                for (const parsedLine of parsedLines) {
                    const { choices } = parsedLine;
                    const { delta } = choices[0];
                    const { content } = delta;
                    if (content) {
                        aiMessage += content;
                        aiMessageElement.innerHTML = sanitizeInput(aiMessage);
                        initializeCodeMirror(aiMessageElement);
                        scrollToBottom();
                    }
                }
            }

            updateChatHistory(message, aiMessage);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Error:', error);
                appendMessage('error', 'An error occurred while fetching the response. Please check your LM Studio server connection.');
            }
        } finally {
            hideLoadingIndicator();
            toggleSendStopButton();
            abortController = null;
        }
    });
}

// New function to toggle between send and stop buttons
function toggleSendStopButton() {
    if (sendButton && stopButton) {
        sendButton.classList.toggle('hidden');
        stopButton.classList.toggle('hidden');
    }
}

// Add click event listener for stop button
if (stopButton) {
    stopButton.addEventListener('click', () => {
        if (abortController) {
            abortController.abort();
        }
    });
}

async function isServerRunning() {
    try {
        if (!serverIpInput || !serverPortInput) return false;
        const response = await fetch(`http://${serverIpInput.value}:${serverPortInput.value}/v1/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
        actionToPerform = 'clearAllChats';
        showConfirmationModal('Are you sure you want to clear all chats? This action cannot be undone.');
    });
}

function clearAllChats() {
    messagesContainer.innerHTML = '';
    showWelcomeMessage();
    chatHistoryData = {};
    updateChatHistoryUI();
    settingsModal.classList.add('hidden');
    localStorage.removeItem('chatHistory');
}

if (newChatButton) {
    newChatButton.addEventListener('click', () => {
        currentChatId = Date.now();
        messagesContainer.innerHTML = '';
        showWelcomeMessage();
        userInput.focus();
        // Always close sidebar on mobile when creating new chat
        if (sidebar.classList.contains('active') || !sidebar.classList.contains('hidden')) {
            toggleSidebar();
        }
        settingsModal.classList.add('hidden');
    });
}

if (settingsButton) {
    settingsButton.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('animate-fade-in');
    });
}

if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', () => {
        settingsModal.classList.add('animate-fade-out');
        setTimeout(() => {
            settingsModal.classList.add('hidden');
            settingsModal.classList.remove('animate-fade-out');
        }, 300);
    });
}

function toggleSidebar() {
    if (!sidebar) return; // Ensure sidebar element exists
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
    settingsModal.classList.add('hidden');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.add('animate-slide-in');
        sidebar.classList.remove('animate-slide-out');
    } else {
        sidebar.classList.add('animate-slide-out');
        sidebar.classList.remove('animate-slide-in');
        setTimeout(() => {
            sidebar.classList.remove('animate-slide-out');
        }, 300);
    }
}

function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender, 'animate-fade-in', 'mb-4', 'p-4', 'rounded-lg');
    messageElement.innerHTML = sanitizeInput(message);
    
    // Add long-press event listeners for AI messages
    if (sender === 'ai') {
        messageElement.addEventListener('touchstart', handleTouchStart);
        messageElement.addEventListener('touchend', handleTouchEnd);
        messageElement.addEventListener('touchmove', handleTouchMove);
        messageElement.addEventListener('mousedown', handleMouseDown);
        messageElement.addEventListener('mouseup', handleMouseUp);
        messageElement.addEventListener('mouseleave', handleMouseLeave);
    }
    
    messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
    initializeCodeMirror(messageElement);
    scrollToBottom();
    return messageElement;
}

function sanitizeInput(input) {
    // First escape HTML to prevent XSS
    const div = document.createElement('div');
    div.textContent = input;
    let sanitized = div.innerHTML;
    
    // Handle thinking sections
    sanitized = sanitized.replace(/Let's approach this step by step:\n/g, '<div class="think"><div class="reasoning-intro">Let\'s approach this step by step:</div>');
    sanitized = sanitized.replace(/^(\d+\)\s*.*?)(?=\n\d+\)|$)/gm, '<div class="reasoning-step">$1</div>');
    
    // Handle code blocks with language specification
    sanitized = sanitized.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
    });
    
    // Handle inline code
    sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle headers
    sanitized = sanitized.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    sanitized = sanitized.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    sanitized = sanitized.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Handle lists
    sanitized = sanitized.replace(/^\* (.+)$/gm, '<li>$1</li>');
    sanitized = sanitized.replace(/^- (.+)$/gm, '<li>$1</li>');
    sanitized = sanitized.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Wrap lists in appropriate containers
    sanitized = sanitized.replace(/(<li>.*?<\/li>\n*)+/g, '<ul>$&</ul>');
    
    // Handle emphasis and strong
    sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
    sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Handle links
    sanitized = sanitized.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300">$1</a>');
    
    // Handle paragraphs
    sanitized = sanitized.replace(/\n\n/g, '</p><p>');
    sanitized = '<p>' + sanitized + '</p>';
    
    // Close thinking section div if it was opened
    if (sanitized.includes('think')) {
        sanitized += '</div>';
    }
    
    return sanitized;
}

function initializeCodeMirror(element) {
    const codeBlocks = element.querySelectorAll('pre code');
    codeBlocks.forEach((block, index) => {
        const language = block.className.replace('language-', '');
        const codeMirrorContainer = document.createElement('div');
        codeMirrorContainer.className = 'code-mirror-container';
        block.parentNode.replaceWith(codeMirrorContainer);

        const editor = CodeMirror(codeMirrorContainer, {
            value: block.textContent,
            mode: language,
            theme: 'monokai',
            lineNumbers: true,
            readOnly: true,
        });

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.className = 'copy-button';
        copyButton.addEventListener('click', () => copyToClipboard(editor.getValue()));
        codeMirrorContainer.appendChild(copyButton);
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
}

function showLoadingIndicator() {
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.innerHTML = '<span class="loading-ellipsis">...</span>';
    }
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('animate-fade-in');
    messagesContainer.insertBefore(loadingIndicator, messagesContainer.firstChild);
    scrollToBottom();
}

function hideLoadingIndicator() {
    if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
}

function showWelcomeMessage() {
    if (welcomeMessage) welcomeMessage.style.display = 'flex';
    if (messagesContainer) messagesContainer.style.display = 'none';
}

function hideWelcomeMessage() {
    if (welcomeMessage) welcomeMessage.style.display = 'none';
    if (messagesContainer) messagesContainer.style.display = 'flex';
}

function updateChatHistory(userMessage, aiMessage) {
    if (!chatHistoryData[currentChatId]) {
        chatHistoryData[currentChatId] = [];
    }
    chatHistoryData[currentChatId].push({ role: 'user', content: userMessage });
    chatHistoryData[currentChatId].push({ role: 'assistant', content: aiMessage });
    updateChatHistoryUI();
    saveChatHistory();
}

function updateChatHistoryUI() {
    if (!chatHistory) return;
    chatHistory.innerHTML = '';
    Object.entries(chatHistoryData).forEach(([id, messages]) => {
        const button = document.createElement('button');
        button.classList.add('w-full', 'text-left', 'py-2', 'px-4', 'hover:bg-gray-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-gray-500', 'text-gray-300', 'animate-fade-in');
        
        const chatTitle = document.createElement('span');
        chatTitle.textContent = messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '');
        button.appendChild(chatTitle);
        
        const trashIcon = document.createElement('i');
        trashIcon.classList.add('fas', 'fa-trash', 'trash-icon');
        trashIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(id);
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
        button.appendChild(trashIcon);
        
        button.addEventListener('click', () => loadChat(id));
        chatHistory.appendChild(button);
    });
}

function showDeleteConfirmation(id) {
    chatToDelete = id;
    actionToPerform = 'deleteChat';
    showConfirmationModal('Are you sure you want to delete this chat? This action cannot be undone.');
}

function showExitConfirmation() {
    actionToPerform = 'exit';
    showConfirmationModal('Are you sure you want to exit the application?');
}


function showConfirmationModal(message) {
    if (confirmationModal && confirmationMessage) {
        confirmationMessage.textContent = message;
        confirmationModal.classList.remove('hidden');
        confirmationModal.classList.add('animate-fade-in');
    }
}

function hideConfirmationModal() {
    if (confirmationModal) {
        confirmationModal.classList.add('animate-fade-out');
        setTimeout(() => {
            confirmationModal.classList.add('hidden');
            confirmationModal.classList.remove('animate-fade-out');
        }, 300);
    }
}

function deleteChatHistory(id) {
    delete chatHistoryData[id];
    updateChatHistoryUI();
    saveChatHistory();
    if (id === currentChatId) {
        messagesContainer.innerHTML = '';
        showWelcomeMessage();
        currentChatId = Date.now();
    }
    hideConfirmationModal();
}

function loadChat(id) {
    currentChatId = id;
    messagesContainer.innerHTML = '';
    hideWelcomeMessage();
    const messages = chatHistoryData[id];
    lazyLoadMessages(messages, 0);
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
    settingsModal.classList.add('hidden');
}

function lazyLoadMessages(messages, startIndex, chunkSize = 10) {
    const endIndex = Math.min(startIndex + chunkSize, messages.length);
    for (let i = startIndex; i < endIndex; i++) {
        appendMessage(messages[i].role, messages[i].content);
    }
    if (endIndex < messages.length) {
        setTimeout(() => lazyLoadMessages(messages, endIndex), 100);
    } else {
        scrollToBottom();
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        sidebar && 
        !sidebar.classList.contains('hidden') && 
        !e.target.closest('#sidebar') && 
        !e.target.closest('#sidebar-toggle')) {
        toggleSidebar();
    }
});
document.getElementById('about-btn').addEventListener('click', () => {
    document.getElementById('about-modal').classList.remove('hidden');
    // Close the sidebar when About button is clicked
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768) { // Only close on mobile view
        sidebar.classList.add('hidden');
    }
});
// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        if (sidebar) {
            sidebar.classList.remove('hidden');
            sidebar.classList.remove('active');
        }
        document.body.classList.remove('sidebar-open');
    } else {
        if (sidebar) sidebar.classList.add('hidden');
    }
});

// Save chat history to local storage
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistoryData));
}

// Load chat history from local storage
function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistoryData = JSON.parse(savedHistory);
        updateChatHistoryUI();
    }
}

// Load saved server URL
function loadServerUrl() {
    const savedUrl = localStorage.getItem('serverUrl');
    if (savedUrl && serverUrlInput) {
        serverUrlInput.value = savedUrl;
        API_URL = savedUrl + '/v1/chat/completions';
    }
}

// Load saved system prompt
function loadSystemPrompt() {
    const savedPrompt = localStorage.getItem('systemPrompt');
    if (savedPrompt && systemPromptInput) {
        systemPromptInput.value = savedPrompt;
        systemPrompt = savedPrompt;
    }
}

// Scroll to bottom of chat container
function scrollToBottom() {
    if (messagesContainer) messagesContainer.scrollTop = 0;
}

// Add scroll to bottom button
const scrollToBottomBtn = document.createElement('button');
scrollToBottomBtn.textContent = '↓';
scrollToBottomBtn.classList.add('fixed', 'bottom-20', 'right-4', 'bg-blue-600', 'text-white', 'rounded-full', 'w-10', 'h-10', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'hidden', 'animate-fade-in');
document.body.appendChild(scrollToBottomBtn);

scrollToBottomBtn.addEventListener('click', () => {
    if (messagesContainer) {
        messagesContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

if (messagesContainer) {
    messagesContainer.addEventListener('scroll', () => {
        const isScrolledToBottom = messagesContainer.scrollTop === 0;
        scrollToBottomBtn.classList.toggle('hidden', isScrolledToBottom);
    });
}

// Long-press handling functions
function handleTouchStart(e) {
    startLongPress(e);
}

function handleTouchEnd(e) {
    clearLongPress();
}

function handleTouchMove(e) {
    clearLongPress();
}

function handleMouseDown(e) {
    startLongPress(e);
}

function handleMouseUp(e) {
    clearLongPress();
}

function handleMouseLeave(e) {
    clearLongPress();
}

function startLongPress(e) {
    clearLongPress();
    longPressTimer = setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            selectedText = selection.toString();
            selectedMessageElement = e.currentTarget;
            showContextMenu(e);
        }
    }, 500); // 500ms for long-press
}

function clearLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(e) {
    if (contextMenu) {
        const rect = e.target.getBoundingClientRect();
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        e.preventDefault();
    }
}

// Hide context menu when clicking outside
document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.style.display = 'none';
    }
});

// Copy text functionality
if (copyTextButton) {
    copyTextButton.addEventListener('click', () => {
        if (selectedText) {
            navigator.clipboard.writeText(selectedText).then(() => {
                console.log('Text copied to clipboard');
                contextMenu.style.display = 'none';
            }).catch(err => {
                console.error('Error copying text: ', err);
            });
        }
    });
}

// Regenerate text functionality
if (regenerateTextButton) {
    regenerateTextButton.addEventListener('click', async () => {
        if (selectedMessageElement) {
            const messageIndex = Array.from(messagesContainer.children).indexOf(selectedMessageElement);
            if (messageIndex !== -1) {
                // Remove this message and all subsequent messages
                while (messagesContainer.children.length > messageIndex) {
                    messagesContainer.removeChild(messagesContainer.firstChild);
                }
                
                // Remove corresponding messages from chatHistoryData
                chatHistoryData[currentChatId] = chatHistoryData[currentChatId].slice(0, messageIndex * 2);
                
                // Get the last user message
                const lastUserMessage = chatHistoryData[currentChatId][chatHistoryData[currentChatId].length - 2].content;
                
                // Regenerate the AI response
                contextMenu.style.display = 'none';
                await generateAIResponse(lastUserMessage);
            }
        }
    });
}

async function generateAIResponse(userMessage) {
    showLoadingIndicator();
    toggleSendStopButton();

    try {
        if (!(await isServerRunning())) {
            throw new Error('LM Studio server is not running');
        }

        if (availableModels.length === 0) {
            await fetchAvailableModels();
        }

        if (availableModels.length === 0) {
            throw new Error('No models available');
        }

        const currentChat = chatHistoryData[currentChatId] || [];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...currentChat.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage }
        ];

        abortController = new AbortController();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: availableModels[0], // Use the first available model
                messages: messages,
                temperature: temperature,
                stream: true, // Enable streaming
            }),
            signal: abortController.signal,
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let aiMessage = '';
        const aiMessageElement = appendMessage('ai', '');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            const parsedLines = lines
                .map(line => line.replace(/^data: /, '').trim())
                .filter(line => line !== '' && line !== '[DONE]')
                .map(line => JSON.parse(line));

            for (const parsedLine of parsedLines) {
                const { choices } = parsedLine;
                const { delta } = choices[0];
                const { content } = delta;
                if (content) {
                    aiMessage += content;
                    aiMessageElement.innerHTML = sanitizeInput(aiMessage);
                    initializeCodeMirror(aiMessageElement);
                    scrollToBottom();
                }
            }
        }

        updateChatHistory(userMessage, aiMessage);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
        } else {
            console.error('Error:', error);
            appendMessage('error', 'An error occurred while fetching the response. Please check your LM Studio server connection.');
        }
    } finally {
        hideLoadingIndicator();
        toggleSendStopButton();
        abortController = null;
    }
}

function closeApplication() {
    // Send a message to the main process to close the application
    if (window.electron) {
        window.electron.send('close-app');
    } else {
        console.log('Electron not available. Unable to close the application.');
        alert('This function is only available in the desktop application.');
    }
}

// Initialize the UI
document.addEventListener('DOMContentLoaded', () => {
    // About modal functionality
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAbout = document.getElementById('close-about');

    if (aboutBtn && aboutModal && closeAbout) {
        aboutBtn.addEventListener('click', () => {
            aboutModal.classList.remove('hidden');
        });

        closeAbout.addEventListener('click', () => {
            aboutModal.classList.add('hidden');
        });

        // Close modal when clicking outside
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.add('hidden');
            }
        });
    }

    loadChatHistory();
    loadServerUrl();
    loadSystemPrompt();
    initializeTemperature();
    updateChatHistoryUI();
    fetchAvailableModels();

    // Set initial sidebar state
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.add('hidden');
    }

    // Add animation classes
    document.body.classList.add('animate-fade-in');
    if (chatContainer) chatContainer.classList.add('animate-fade-in');
    if (sidebar) sidebar.classList.add('animate-fade-in');

    // Add smooth scrolling to the chat container
    if (messagesContainer) messagesContainer.style.scrollBehavior = 'smooth';

    // Show welcome message on initial load
    showWelcomeMessage();

    // Ensure sidebar toggle button exists before adding event listener
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Ensure close sidebar button exists before adding event listener
    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (confirmActionButton) {
        confirmActionButton.addEventListener('click', () => {
            if (actionToPerform === 'deleteChat' && chatToDelete) {
                deleteChatHistory(chatToDelete);
                chatToDelete = null;
            } else if (actionToPerform === 'clearAllChats') {
                clearAllChats();
            } else if (actionToPerform === 'exit') {
                closeApplication();
            }
            hideConfirmationModal();
            actionToPerform = null; // Reset the action
        });
    }
    

    if (cancelActionButton) {
        cancelActionButton.addEventListener('click', hideConfirmationModal);
    }

    // Add event listener for the Exit button
    if (exitButton) {
        exitButton.addEventListener('click', () => {
            showExitConfirmation();
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
    }
});

// New function to hide loading indicator on page load
function hideLoadingIndicatorOnLoad() {
    if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
}

// Add event listener to hide loading indicator when the page loads
window.addEventListener('load', hideLoadingIndicatorOnLoad);
