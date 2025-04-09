// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsPanel = document.getElementById('settingsPanel');
    const providerSelect = document.getElementById('providerSelect');
    const openaiModels = document.querySelector('.openai-models');
    const anthropicModels = document.querySelector('.anthropic-models');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const promptInput = document.getElementById('promptInput');
    const sendButton = document.getElementById('sendButton');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    const conversation = document.getElementById('conversation');
    
    // Model settings
    let modelSettings = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000
    };
    
    // Conversation history
    let conversationHistory = [];
    
    // Event listeners
    settingsIcon.addEventListener('click', toggleSettingsPanel);
    providerSelect.addEventListener('change', toggleModelOptions);
    temperatureSlider.addEventListener('input', updateTemperatureValue);
    saveSettingsBtn.addEventListener('click', saveSettings);
    sendButton.addEventListener('click', sendPrompt);
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrompt();
        }
    });
    clearButton.addEventListener('click', clearConversation);
    saveButton.addEventListener('click', saveConversation);
    
    // Functions
    function toggleSettingsPanel() {
        settingsPanel.style.display = settingsPanel.style.display === 'none' || settingsPanel.style.display === '' ? 'block' : 'none';
    }
    
    function toggleModelOptions() {
        const provider = providerSelect.value;
        if (provider === 'openai') {
            openaiModels.style.display = 'block';
            anthropicModels.style.display = 'none';
            modelSettings.model = document.getElementById('openaiModelSelect').value;
        } else {
            openaiModels.style.display = 'none';
            anthropicModels.style.display = 'block';
            modelSettings.model = document.getElementById('anthropicModelSelect').value;
        }
        modelSettings.provider = provider;
    }
    
    function updateTemperatureValue() {
        temperatureValue.textContent = temperatureSlider.value;
        modelSettings.temperature = parseFloat(temperatureSlider.value);
    }
    
    function saveSettings() {
        modelSettings.provider = providerSelect.value;
        modelSettings.model = modelSettings.provider === 'openai' 
            ? document.getElementById('openaiModelSelect').value 
            : document.getElementById('anthropicModelSelect').value;
        modelSettings.temperature = parseFloat(temperatureSlider.value);
        modelSettings.max_tokens = parseInt(document.getElementById('maxTokensInput').value);
        
        toggleSettingsPanel();
        
        // Show confirmation message
        addSystemMessage(`Settings saved. Using ${modelSettings.provider} - ${modelSettings.model}`);
    }
    
    function addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'system-message');
        messageDiv.style.textAlign = 'center';
        messageDiv.style.color = '#666';
        messageDiv.style.margin = '10px 0';
        messageDiv.textContent = text;
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }
    
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user-message');
        
        const header = document.createElement('div');
        header.classList.add('message-header');
        header.textContent = 'You';
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        content.textContent = text;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
        
        // Add to history
        conversationHistory.push({
            role: 'user',
            content: text
        });
    }
    
    function addAIMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'ai-message');
        
        const header = document.createElement('div');
        header.classList.add('message-header');
        header.textContent = modelSettings.provider === 'openai' ? 'OpenAI' : 'Anthropic';
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        content.textContent = text;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
        
        // Add to history
        conversationHistory.push({
            role: 'assistant',
            content: text
        });
    }
    
    function addLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('loading');
        loadingDiv.id = 'loadingIndicator';
        
        const dotsDiv = document.createElement('div');
        dotsDiv.classList.add('loading-dots');
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dotsDiv.appendChild(dot);
        }
        
        loadingDiv.appendChild(dotsDiv);
        conversation.appendChild(loadingDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }
    
    function removeLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    async function sendPrompt() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;
        
        // Add user message
        addUserMessage(prompt);
        promptInput.value = '';
        
        // Add loading indicator
        addLoadingIndicator();
        
        // Prepare request data
        const requestData = {
            prompt: prompt,
            provider: modelSettings.provider,
            model: modelSettings.model,
            temperature: modelSettings.temperature,
            max_tokens: modelSettings.max_tokens
        };
        
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            // Remove loading indicator
            removeLoadingIndicator();
            
            if (data.error) {
                addSystemMessage(`Error: ${data.error}`);
                console.error('API Error:', data);
            } else {
                addAIMessage(data.response);
            }
            
        } catch (error) {
            removeLoadingIndicator();
            addSystemMessage(`Error: ${error.message}`);
            console.error('Request Error:', error);
        }
    }
    
    function clearConversation() {
        // Clear the conversation div but keep the welcome message
        while (conversation.firstChild) {
            conversation.removeChild(conversation.firstChild);
        }
        
        // Add back the welcome message
        const welcomeDiv = document.createElement('div');
        welcomeDiv.classList.add('welcome-message');
        
        const welcomeTitle = document.createElement('h2');
        welcomeTitle.textContent = 'Welcome to the LLM Interaction Interface!';
        
        const welcomeText = document.createElement('p');
        welcomeText.textContent = 'Enter your prompt below to start a conversation with an AI language model.';
        
        welcomeDiv.appendChild(welcomeTitle);
        welcomeDiv.appendChild(welcomeText);
        conversation.appendChild(welcomeDiv);
        
        // Clear conversation history
        conversationHistory = [];
    }
    
    async function saveConversation() {
        if (conversationHistory.length === 0) {
            addSystemMessage('No conversation to save.');
            return;
        }
        
        try {
            const response = await fetch('/save_conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation: conversationHistory
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                addSystemMessage(`Error saving conversation: ${data.error}`);
            } else {
                addSystemMessage(`Conversation saved successfully as ${data.filename}`);
            }
            
        } catch (error) {
            addSystemMessage(`Error: ${error.message}`);
            console.error('Save Error:', error);
        }
    }
    
    // Initialize
    function init() {
        // Set initial values
        document.getElementById('openaiModelSelect').value = modelSettings.model;
        document.getElementById('maxTokensInput').value = modelSettings.max_tokens;
    }
    
    init();
});