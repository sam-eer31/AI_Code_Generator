// Code Generator Frontend Application
class CodeGeneratorApp {
    constructor() {
        this.apiBase = window.location.origin;
        this.ws = null;
        this.currentGenerationId = null;
        this.isGenerating = false;
        this.outputBuffer = '';
        this.tokenCount = 0;
        this.history = [];
        this.searchTimeout = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }
    
    initializeElements() {
        
        // Main elements
        this.elements = {
            // Header
            modelSelector: document.getElementById('modelSelector'),
            modelName: document.getElementById('modelName'),
            healthIndicator: document.getElementById('healthIndicator'),
            healthDot: document.querySelector('.health-dot'),
            healthText: document.querySelector('.health-text'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            sidebar: document.getElementById('sidebar'),
            settingsBtn: document.getElementById('settingsBtn'),
            
            // Prompt section
            promptSection: document.querySelector('.prompt-section'),
            promptInput: document.getElementById('promptInput'),
            generateBtn: document.getElementById('generateBtn'),
            stopBtn: document.getElementById('stopBtn'),
            
            // Output section
            outputContent: document.getElementById('outputContent'),
            outputMeta: document.getElementById('outputMeta'),
            languageBadge: document.getElementById('languageBadge'),
            filename: document.getElementById('filename'),
            copyAllBtn: document.getElementById('copyAllBtn'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            
            // Loading state
            emptyState: document.querySelector('.empty-state'),
            loadingState: document.getElementById('loadingState'),
            
            // History
            searchInput: document.getElementById('searchInput'),
            historyList: document.getElementById('historyList'),
            newGenerationBtn: document.getElementById('newGenerationBtn'),
            
            // Footer
            statusText: document.getElementById('statusText'),
            tokenCount: document.getElementById('tokenCount'),
            
            // Overlays
            toastContainer: document.getElementById('toastContainer'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            
            // Delete modal
            deleteModal: document.getElementById('deleteModal'),
            deleteModalClose: document.getElementById('deleteModalClose'),
            deleteModalCancel: document.getElementById('deleteModalCancel'),
            deleteModalConfirm: document.getElementById('deleteModalConfirm'),
            deleteModalPrompt: document.getElementById('deleteModalPrompt'),
            
            // Settings modal
            settingsModal: document.getElementById('settingsModal'),
            settingsModalClose: document.getElementById('settingsModalClose'),
            themeToggle: document.getElementById('themeToggle'),
            
            // Model modal
            modelModal: document.getElementById('modelModal'),
            modelModalClose: document.getElementById('modelModalClose'),
            modelList: document.getElementById('modelList'),
            
            // Font size controls
            codeFontSizeSelect: document.getElementById('codeFontSizeSelect'),
            applyFontSizeBtn: document.getElementById('applyFontSizeBtn'),
            fontSizePreview: document.getElementById('fontSizePreview')
        };
    }
    
    bindEvents() {
        // Generate button
        if (this.elements.generateBtn) {
            this.elements.generateBtn.addEventListener('click', () => this.startGeneration());
        }
        
        // Stop button
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => this.stopGeneration());
        }
        
        // Sidebar toggle
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('change', () => this.toggleSidebar());
        }
        
        // Sidebar toggle label click
        const sidebarToggleLabel = document.querySelector('label[for="sidebarToggle"]');
        if (sidebarToggleLabel) {
            sidebarToggleLabel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.elements.sidebarToggle.checked = !this.elements.sidebarToggle.checked;
                this.toggleSidebar();
            });
        }
        
        // New generation button
        if (this.elements.newGenerationBtn) {
            this.elements.newGenerationBtn.addEventListener('click', () => this.startNewGeneration());
        }
        
        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Prompt input changes
        if (this.elements.promptInput) {
            this.elements.promptInput.addEventListener('input', () => this.saveLastGeneration());
        }
        
        // Copy and download buttons
        if (this.elements.copyAllBtn) {
            this.elements.copyAllBtn.addEventListener('click', () => this.copyAllOutput());
        }
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAllOutput());
        }
        
        // Click outside sidebar to close
        document.addEventListener('click', (e) => this.handleClickOutside(e));
        
        // Delete modal events
        if (this.elements.deleteModalClose) {
            this.elements.deleteModalClose.addEventListener('click', () => this.hideDeleteModal());
        }
        if (this.elements.deleteModalCancel) {
            this.elements.deleteModalCancel.addEventListener('click', () => this.hideDeleteModal());
        }
        if (this.elements.deleteModalConfirm) {
            this.elements.deleteModalConfirm.addEventListener('click', () => this.confirmDelete());
        }
        
        // Settings events
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showSettingsModal();
            });
        }
        
        // Model selector events
        if (this.elements.modelSelector) {
            this.elements.modelSelector.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showModelModal();
            });
        }
        
        if (this.elements.modelModalClose) {
            this.elements.modelModalClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModelModal();
            });
        }
        
        if (this.elements.settingsModalClose) {
            this.elements.settingsModalClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
            });
        }
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('change', (e) => {
                this.handleThemeChange(e.target.checked);
            });
        }
        
        // Font size controls
        if (this.elements.codeFontSizeSelect) {
            this.elements.codeFontSizeSelect.addEventListener('change', (e) => {
                this.handleFontSizePreview(e.target.value);
            });
        }
        
        if (this.elements.applyFontSizeBtn) {
            this.elements.applyFontSizeBtn.addEventListener('click', () => {
                this.applyFontSize();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window events
        window.addEventListener('beforeunload', (event) => {
            // If currently generating, show a warning but don't pause generation yet
            if (this.isGenerating) {
                event.preventDefault();
                event.returnValue = 'Generation is in progress. Are you sure you want to leave?';
                return event.returnValue;
            }
        });
        
        // Start connection health checker
        this.startConnectionHealthChecker();
        
        // Handle page visibility change (when user cancels reload)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isGenerating) {
                // Page became visible again (user cancelled reload)
                // Check if WebSocket is still connected
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    console.log('Page reload cancelled, generation continuing...');
                    // Generation should continue normally
                } else if (this.ws && (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING)) {
                    console.log('WebSocket closed during reload attempt, reconnecting...');
                    // Reconnect WebSocket if it was closed
                    this.reconnectWebSocket();
                } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                    console.log('WebSocket still connecting, waiting...');
                    // WebSocket is still connecting, give it a moment
                    setTimeout(() => {
                        if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
                            this.reconnectWebSocket();
                        }
                    }, 2000);
                }
            }
        });
        
        // Handle actual page unload (when user proceeds with reload)
        window.addEventListener('pagehide', (event) => {
            if (this.isGenerating && this.currentGenerationId) {
                // Page is actually unloading, pause generation
                console.log('Page unloading, pausing generation...');
                
                // Use sendBeacon for more reliable delivery during page unload
                const data = JSON.stringify({ output: this.outputBuffer });
                navigator.sendBeacon(`${this.apiBase}/stop/${this.currentGenerationId}`, data);
            }
        });
    }
    
    async initializeApp() {
        try {
            // Check health status
            await this.checkHealth();
            
            // Initialize model selection
            await this.initializeModelSelection();
            
            // Load history
            await this.loadHistory();
            
            // Check for stuck generations and fix them
            await this.checkAndFixStuckGenerations();
            
            // Load last generation from localStorage
            this.loadLastGeneration();
            
            // Initialize loading elements
            this.initializeLoadingElements();
            
            // Set initial UI state
            this.updateUIState();
            
            // Initialize theme
            this.initializeTheme();
            
            // Initialize font size
            this.initializeFontSize();
            
            this.updateStatus('Ready');
        } catch (error) {
            this.showToast('Failed to initialize app', 'error');
            console.error('Initialization error:', error);
        }
    }
    
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const health = await response.json();
            
            this.updateHealthIndicator(health);
            return health;
        } catch (error) {
            this.updateHealthIndicator({ status: 'error', mongodb: false, ollama: false });
            throw error;
        }
    }
    
    updateHealthIndicator(health) {
        const { healthDot, healthText } = this.elements;
        
        if (health.status === 'ok') {
            healthDot.className = 'health-dot healthy';
            healthText.textContent = 'Connected';
        } else {
            healthDot.className = 'health-dot unhealthy';
            healthText.textContent = 'Disconnected';
        }
    }
    
    async loadHistory() {
        try {
            const response = await fetch(`${this.apiBase}/history`);
            const data = await response.json();
            this.history = data.generations || [];
            this.renderHistory();
        } catch (error) {
            console.error('Failed to load history:', error);
            this.showToast('Failed to load history', 'error');
        }
    }
    
    renderHistory() {
        const { historyList } = this.elements;
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No generations yet</div>';
            return;
        }
        
        const filteredHistory = this.filterHistory();
        
        historyList.innerHTML = filteredHistory.map(generation => `
            <div class="history-item ${generation._id === this.currentGenerationId ? 'active' : ''}" 
                 data-id="${generation._id}">
                <div class="history-item-header">
                    <div class="history-item-title">${generation.title || 'Untitled'}</div>
                    <div class="history-item-actions">
                        <button class="history-item-delete" data-id="${generation._id}" title="Delete generation">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 69 14"
                                class="svgIcon bin-top"
                            >
                                <g clip-path="url(#clip0_${generation._id}_24)">
                                    <path
                                        fill="black"
                                        d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"
                                    ></path>
                                </g>
                                <defs>
                                    <clipPath id="clip0_${generation._id}_24">
                                        <rect fill="white" height="14" width="69"></rect>
                                    </clipPath>
                                </defs>
                            </svg>

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 69 57"
                                class="svgIcon bin-bottom"
                            >
                                <g clip-path="url(#clip0_${generation._id}_22)">
                                    <path
                                        fill="black"
                                        d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
                                    ></path>
                                </g>
                                <defs>
                                    <clipPath id="clip0_${generation._id}_22">
                                        <rect fill="white" height="57" width="69"></rect>
                                    </clipPath>
                                </defs>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="history-item-meta">
                    <div class="history-item-status">
                        <span class="status-badge ${generation.status}">${generation.status}</span>
                    </div>
                    <div class="history-item-details">
                        <span class="history-item-date">${this.formatDate(generation.createdAt)}</span>
                        ${generation.language && generation.language !== 'unknown' ? 
                            `<span class="history-item-language">• ${generation.language}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't load generation if clicking on delete button
                if (e.target.closest('.history-item-delete')) {
                    return;
                }
                const id = item.dataset.id;
                this.loadGeneration(id);
            });
        });
        
        // Add delete button handlers
        historyList.querySelectorAll('.history-item-delete').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = deleteBtn.dataset.id;
                this.showDeleteModal(id);
            });
        });
    }
    
    filterHistory() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        if (!searchTerm) return this.history;
        
        return this.history.filter(generation => 
            generation.title.toLowerCase().includes(searchTerm) ||
            generation.prompt.toLowerCase().includes(searchTerm) ||
            (generation.output && generation.output.toLowerCase().includes(searchTerm))
        );
    }
    
    handleSearch(value) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.renderHistory();
        }, 300);
    }
    
    async loadGeneration(id) {
        try {
            const response = await fetch(`${this.apiBase}/history/${id}`);
            
            // Check if the generation exists
            if (!response.ok) {
                if (response.status === 404) {
                    // Generation was deleted, clear saved state and start fresh
                    console.log('Generation not found (likely deleted), clearing saved state');
                    this.clearSavedState();
                    this.startNewGeneration();
                    return;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            const generation = await response.json();
            
            this.currentGenerationId = id;
            this.displayGeneration(generation);
            this.renderHistory(); // Update active state
            
            this.showToast('Generation loaded', 'success');
        } catch (error) {
            console.error('Failed to load generation:', error);
            this.showToast('Failed to load generation', 'error');
            
            // If loading fails, clear saved state and start fresh
            this.clearSavedState();
            this.startNewGeneration();
        }
    }
    
    displayGeneration(generation) {
        const { outputContent, languageBadge, filename, copyAllBtn, downloadAllBtn } = this.elements;
        
        // Set current generation ID for regeneration
        this.currentGenerationId = generation._id;
        
        // Update UI state based on generation status
        this.updateUIState(generation);
        
        // Update metadata
        if (generation.language && generation.language !== 'unknown') {
            languageBadge.textContent = generation.language;
            languageBadge.style.display = 'inline-block';
        } else {
            languageBadge.style.display = 'none';
        }
        
        if (generation.filename) {
            filename.textContent = generation.filename;
            filename.style.display = 'inline-block';
        } else {
            filename.style.display = 'none';
        }
        
        // Display output
        if (generation.output && generation.output.trim()) {
            this.renderOutput(generation.output, generation.language);
            // Set output buffer for action buttons
            this.outputBuffer = generation.output;
            this.updateActionButtons();
        } else {
            // For stopped or failed generations, show appropriate message
            if (generation.status === 'stopped') {
                outputContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⏹️</div>
                        <h3>Generation Stopped</h3>
                        <p>This generation was stopped before completion. Click "Regenerate" to continue.</p>
                    </div>
                `;
            } else if (generation.status === 'failed') {
                outputContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">❌</div>
                        <h3>Generation Failed</h3>
                        <p>${generation.error || 'This generation failed due to an error.'} Click "Regenerate" to try again.</p>
                    </div>
                `;
            } else {
                outputContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>No Output</h3>
                        <p>This generation has no output content.</p>
                    </div>
                `;
            }
            copyAllBtn.disabled = true;
            downloadAllBtn.disabled = true;
        }
        
        // Update status
        this.updateStatus(`Loaded: ${generation.status}`);
        
        // Save state after loading generation
        this.saveLastGeneration();
    }
    
    async startGeneration() {
        const prompt = this.elements.promptInput.value.trim();
        if (!prompt) {
            this.showToast('Please enter a prompt', 'warning');
            return;
        }
        
        // Check if a model is selected
        const currentModel = this.getCurrentModel();
        if (!currentModel || currentModel === 'Select a model' || currentModel === 'No models available' || currentModel === 'Error loading models') {
            this.showToast('Please select a model before generating code', 'error');
            this.showModelModal();
            return;
        }
        
        try {
            this.setGeneratingState(true);
            this.showLoadingState();
            
            // Check if we're regenerating (have a current generation ID)
            if (this.currentGenerationId) {
                this.updateStatus('Regenerating...');
                
                // Reuse the existing generation ID
                await this.connectWebSocket(this.currentGenerationId);
                
                // Clear output and start streaming
                this.outputBuffer = '';
                this.tokenCount = 0;
                // Don't call renderOutput here - keep loading state visible
                this.updateStatus('Generating...');
            } else {
                this.updateStatus('Creating generation...');
                
                // Create new generation
                const response = await fetch(`${this.apiBase}/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                
                const { id } = await response.json();
                this.currentGenerationId = id;
                
                // Connect WebSocket
                await this.connectWebSocket(id);
                
                // Clear output and start streaming
                this.outputBuffer = '';
                this.tokenCount = 0;
                // Don't call renderOutput here - keep loading state visible
                this.updateStatus('Generating...');
            }
            
        } catch (error) {
            console.error('Failed to start generation:', error);
            this.showToast('Failed to start generation', 'error');
            this.setGeneratingState(false);
            this.hideLoadingState();
            this.updateStatus('Ready');
        }
    }
    
    async connectWebSocket(generationId) {
        const wsUrl = `${this.apiBase.replace('http', 'ws')}/ws/generate/${generationId}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showToast('Connection error', 'error');
            this.setGeneratingState(false);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.setGeneratingState(false);
            this.updateStatus('Ready');
        };
    }
    
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'token':
                // Hide loading state on first token
                if (this.tokenCount === 0) {
                    this.hideLoadingState();
                }
                this.outputBuffer += message.data;
                this.tokenCount++;
                this.renderOutput(this.outputBuffer);
                this.updateTokenCount();
                
                // Save state periodically during generation (every 10 tokens)
                if (this.tokenCount % 10 === 0) {
                    this.saveLastGeneration();
                }
                break;
                
            case 'progress':
                this.tokenCount = message.tokens;
                this.updateTokenCount();
                break;
                
            case 'status':
                this.updateStatus(message.status);
                break;
                
            case 'done':
                this.handleGenerationComplete(message);
                break;
                
            case 'error':
                this.handleGenerationError(message.message);
                break;
        }
    }
    
    handleGenerationComplete(data) {
        this.setGeneratingState(false);
        this.updateStatus('Completed');
        
        // Update metadata
        if (data.language) {
            this.elements.languageBadge.textContent = data.language;
            this.elements.languageBadge.style.display = 'inline-block';
        }
        
        if (data.filename) {
            this.elements.filename.textContent = data.filename;
            this.elements.filename.style.display = 'inline-block';
        }
        
        // Update action buttons based on content
        this.updateActionButtons();
        
        // Update UI state for completed generation
        this.updateUIState({ status: 'completed' });
        
        // Reload history to get updated status
        this.loadHistory();
        
        // Save to localStorage
        this.saveLastGeneration();
        
        this.showToast('Generation completed', 'success');
    }
    
    handleGenerationError(message) {
        this.setGeneratingState(false);
        this.hideLoadingState();
        this.updateStatus('Failed');
        this.updateUIState({ status: 'failed' });
        this.showToast(`Generation failed: ${message}`, 'error');
    }
    
    async stopGeneration() {
        if (!this.currentGenerationId) return;
        
        try {
            // Save current output before stopping
            let currentOutput = this.outputBuffer;
            
            // If the output doesn't end with closing markdown, add it
            if (currentOutput && !currentOutput.trim().endsWith('```')) {
                currentOutput = currentOutput.trim() + '\n```';
            }
            
            await fetch(`${this.apiBase}/stop/${this.currentGenerationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    output: currentOutput
                })
            });
            
            if (this.ws) {
                this.ws.close();
            }
            
            this.setGeneratingState(false);
            this.hideLoadingState();
            this.updateStatus('Stopped');
            
            // Update the current generation object with stopped status and current output
            const stoppedGeneration = {
                status: 'stopped',
                output: currentOutput,
                prompt: this.elements.promptInput.value
            };
            
            this.updateUIState(stoppedGeneration);
            this.showToast('Generation stopped', 'info');
            
            // Reload history
            this.loadHistory();
            
            // Save state after stopping
            this.saveLastGeneration();
        } catch (error) {
            console.error('Failed to stop generation:', error);
            this.showToast('Failed to stop generation', 'error');
        }
    }
    
    setGeneratingState(generating) {
        this.isGenerating = generating;
        
        this.elements.generateBtn.disabled = generating;
        this.elements.stopBtn.disabled = !generating;
        this.elements.promptInput.disabled = generating;
        this.elements.newGenerationBtn.disabled = generating;
        
        if (generating) {
            this.elements.generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin btn-icon"></i> Generating...';
            this.elements.newGenerationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin btn-icon"></i> Generating...';
        } else {
            this.elements.newGenerationBtn.innerHTML = '<i class="fa-solid fa-plus btn-icon"></i> New Generation';
        }
        // Don't set generate button text here - let updateUIState handle it
    }
    
    showLoadingState() {
        // Make sure the loading state elements exist
        if (this.elements.emptyState && this.elements.loadingState) {
            this.elements.emptyState.style.display = 'none';
            this.elements.loadingState.style.display = 'flex';
        } else {
            // If elements don't exist, recreate them
            this.initializeLoadingElements();
            // Try again after initialization
            if (this.elements.emptyState && this.elements.loadingState) {
                this.elements.emptyState.style.display = 'none';
                this.elements.loadingState.style.display = 'flex';
            }
        }
    }
    
    initializeLoadingElements() {
        const { outputContent } = this.elements;
        
        // Ensure the loading state is in the DOM
        if (!document.getElementById('loadingState')) {
            outputContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-gears"></i></div>
                    <h3>Ready to Generate</h3>
                    <p>Enter a prompt above and click "Generate Code" to start creating with AI.</p>
                </div>
                <div class="loading-state" id="loadingState" style="display: none;">
                    <div class="wrapper">
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                    </div>
                    <p class="loading-text">Generating your code...</p>
                </div>
            `;
        }
        
        // Re-initialize the element references
        this.elements.loadingState = document.getElementById('loadingState');
        this.elements.emptyState = document.querySelector('.empty-state');
    }
    
    hideLoadingState() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
        // Don't show empty state here as content will be rendered
    }
    
    updateUIState(generation = null) {
        // Determine if we should show prompt section
        const shouldShowPrompt = !generation || 
                                generation.status === 'processing' || 
                                generation.status === 'stopped' || 
                                generation.status === 'failed';
        
        // Show/hide prompt section
        this.elements.promptSection.style.display = shouldShowPrompt ? 'block' : 'none';
        
        // Update button text based on state
        if (generation && (generation.status === 'completed' || generation.status === 'stopped' || generation.status === 'failed')) {
            this.elements.generateBtn.innerHTML = '<i class="fa-solid fa-rotate btn-icon"></i> Regenerate';
        } else {
            this.elements.generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles btn-icon"></i> Generate Code';
        }
        
        // Update prompt input if loading from history, or clear it for new generation
        if (generation && generation.prompt) {
            this.elements.promptInput.value = generation.prompt;
        } else if (!generation) {
            // Clear prompt input for new generation
            this.elements.promptInput.value = '';
        }
    }
    
    startNewGeneration() {
        // Clear current state
        this.currentGenerationId = null;
        this.outputBuffer = '';
        this.tokenCount = 0;
        
        // Clear UI
        this.elements.promptInput.value = '';
        this.clearOutputSection();
        this.hideLoadingState();
        this.updateStatus('Ready');
        
        // Update UI state
        this.updateUIState();
        
        // Update history active state
        this.renderHistory();
        
        // Show prompt section
        this.elements.promptSection.style.display = 'block';
        
        // Clear saved state since we're starting fresh
        this.clearSavedState();
        
        this.showToast('Ready for new generation', 'info');
    }
    
    clearOutputSection() {
        const { outputContent, languageBadge, filename, copyAllBtn, downloadAllBtn, emptyState, loadingState } = this.elements;
        
        // Clear output content and show empty state
        outputContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-gears"></i></div>
                <h3>Ready to Generate</h3>
                <p>Enter a prompt above and click "Generate Code" to start creating with AI.</p>
            </div>
            <div class="loading-state" id="loadingState" style="display: none;">
                <div class="wrapper">
                    <div class="circle"></div>
                    <div class="circle"></div>
                    <div class="circle"></div>
                    <div class="shadow"></div>
                    <div class="shadow"></div>
                    <div class="shadow"></div>
                </div>
                <p class="loading-text">Generating your code...</p>
            </div>
        `;
        
        // Re-initialize the loading state element reference
        this.elements.loadingState = document.getElementById('loadingState');
        this.elements.emptyState = document.querySelector('.empty-state');
        
        // Clear metadata
        languageBadge.textContent = '';
        languageBadge.style.display = 'none';
        filename.textContent = '';
        filename.style.display = 'none';
        
        // Disable action buttons
        copyAllBtn.disabled = true;
        downloadAllBtn.disabled = true;
    }
    
    updateActionButtons() {
        const { copyAllBtn, downloadAllBtn } = this.elements;
        const hasContent = this.outputBuffer && this.outputBuffer.trim();
        
        // console.log('Updating action buttons, hasContent:', hasContent);
        // console.log('Output buffer:', this.outputBuffer);
        
        copyAllBtn.disabled = !hasContent;
        downloadAllBtn.disabled = !hasContent;
    }
    
    renderOutput(content, language = '') {
        const { outputContent } = this.elements;
        
        if (!content.trim()) {
            // If we're generating, don't show empty state - keep loading state
            if (this.isGenerating) {
                return;
            }
            
            outputContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-gears"></i></div>
                    <h3>Ready to Generate</h3>
                    <p>Enter a prompt above and click "Generate Code" to start creating with AI.</p>
                </div>
                <div class="loading-state" id="loadingState" style="display: none;">
                    <div class="wrapper">
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                </div>
                    <p class="loading-text">Generating your code...</p>
                </div>
            `;
            // Re-initialize the loading state element reference
            this.elements.loadingState = document.getElementById('loadingState');
            this.elements.emptyState = document.querySelector('.empty-state');
            return;
        }
        
        // During generation, always display as code block with real-time syntax highlighting
        if (this.isGenerating) {
            // Clean markdown code block markers during streaming
            const cleanedContent = this.cleanMarkdownStreaming(content);
            
            // Auto-detect language if not provided
            const detectedLanguage = language || this.detectLanguage(cleanedContent);
            outputContent.innerHTML = this.renderCodeBlock(cleanedContent, detectedLanguage);
            
            // Apply syntax highlighting immediately
            const codeElement = outputContent.querySelector('code');
            if (codeElement) {
                hljs.highlightElement(codeElement);
            }
            return;
        }
        
        // After completion, ensure content has complete code blocks before parsing
        const processedContent = this.ensureCompleteCodeBlock(content);
        const blocks = this.parseContent(processedContent);
        
        outputContent.innerHTML = blocks.map(block => {
            if (block.type === 'code') {
                return this.renderCodeBlock(block.content, block.language || language);
            } else {
                return `<div class="text-block">${this.escapeHtml(block.content)}</div>`;
            }
        }).join('');
        
        // Apply syntax highlighting
        this.applySyntaxHighlighting();
        
        // Update action buttons if we have content
        if (content.trim()) {
            this.outputBuffer = content;
            this.updateActionButtons();
        }
    }
    
    parseContent(content) {
        const blocks = [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const text = content.slice(lastIndex, match.index).trim();
                if (text) {
                    blocks.push({ type: 'text', content: text });
                }
            }
            
            // Add code block
            blocks.push({
                type: 'code',
                language: match[1] || '',
                content: match[2].trim()
            });
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
            const text = content.slice(lastIndex).trim();
            if (text) {
                blocks.push({ type: 'text', content: text });
            }
        }
        
        return blocks;
    }
    
    renderCodeBlock(code, language) {
        const blockId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const currentFontSize = localStorage.getItem('codeFontSize') || 'base';
        
        return `
            <div class="code-block" data-block-id="${blockId}">
                <div class="code-block-content">
                    <pre data-font-size="${currentFontSize}"><code class="language-${language || 'text'}">${this.escapeHtml(code)}</code></pre>
                </div>
            </div>
        `;
    }
    
    applySyntaxHighlighting() {
        // Apply highlight.js to all code blocks
        document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
        
        // Apply current font size to all code blocks
        const currentFontSize = localStorage.getItem('codeFontSize') || 'base';
        document.querySelectorAll('.code-block-content pre').forEach(block => {
            block.setAttribute('data-font-size', currentFontSize);
        });
    }
    
    detectLanguage(content) {
        const firstLine = content.trim().split('\n')[0];
        
        // Check for shebang
        if (firstLine.startsWith('#!')) {
            if (firstLine.includes('python')) return 'python';
            if (firstLine.includes('bash') || firstLine.includes('sh')) return 'bash';
            if (firstLine.includes('node')) return 'javascript';
        }
        
        // Check for common patterns
        if (content.includes('def ') && content.includes(':')) return 'python';
        if (content.includes('function ') || content.includes('const ') || content.includes('let ')) return 'javascript';
        if (content.includes('public class') || content.includes('private ') || content.includes('public ')) return 'java';
        if (content.includes('#include') || content.includes('int main')) return 'cpp';
        if (content.includes('fn ') && content.includes('->')) return 'rust';
        if (content.includes('package ') && content.includes('import ')) return 'go';
        if (content.includes('<?php')) return 'php';
        if (content.includes('class ') && content.includes('{')) return 'javascript';
        if (content.includes('SELECT ') || content.includes('INSERT ') || content.includes('UPDATE ')) return 'sql';
        if (content.includes('<html') || content.includes('<!DOCTYPE')) return 'html';
        if (content.includes('{') && content.includes('}') && content.includes(':')) return 'css';
        
        return 'text';
    }
    
    cleanMarkdownStreaming(content) {
        let cleaned = content.trim();
        
        // Remove ```language at the beginning
        cleaned = cleaned.replace(/^```\w*\s*\n?/i, '');
        
        // Remove ``` at the end
        cleaned = cleaned.replace(/\n?```\s*$/i, '');
        
        return cleaned.trim();
    }
    
    ensureCompleteCodeBlock(content) {
        let processed = content.trim();
        
        // If content starts with ``` but doesn't end with it, add the closing
        if (processed.startsWith('```') && !processed.endsWith('```')) {
            processed = processed + '\n```';
        }
        
        return processed;
    }
    
    async copyCodeBlock(blockId) {
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!block) return;
        
        const code = block.querySelector('code').textContent;
        // Clean any potential markdown that might be in the code
        const cleanedCode = this.cleanMarkdownForOutput(code);
        await this.copyToClipboard(cleanedCode);
        this.showToast('Code copied to clipboard', 'success');
    }
    
    downloadCodeBlock(blockId, language) {
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!block) return;
        
        const code = block.querySelector('code').textContent;
        // Clean any potential markdown that might be in the code
        const cleanedCode = this.cleanMarkdownForOutput(code);
        const extension = this.getFileExtension(language);
        const filename = `generated_code${extension}`;
        
        this.downloadFile(cleanedCode, filename);
        this.showToast('Code downloaded', 'success');
    }
    
    async copyAllOutput() {
        console.log('Copy all output clicked');
        console.log('Output buffer:', this.outputBuffer);
        
        if (!this.outputBuffer) {
            this.showToast('No output to copy', 'warning');
            return;
        }
        
        // Add success animation
        const copyBtn = this.elements.copyAllBtn;
        copyBtn.classList.add('success');
        
        // Temporarily change icon to checkmark
        const originalIcon = copyBtn.querySelector('.btn-icon').innerHTML;
        copyBtn.querySelector('.btn-icon').innerHTML = `
            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        
        // Clean markdown and get pure code
        const cleanedContent = this.cleanMarkdownForOutput(this.outputBuffer);
        console.log('Cleaned content:', cleanedContent);
        
        await this.copyToClipboard(cleanedContent);
        this.showToast('All output copied to clipboard', 'success');
        
        // Remove success animation and restore original icon after delay
        setTimeout(() => {
            copyBtn.classList.remove('success');
            copyBtn.querySelector('.btn-icon').innerHTML = originalIcon;
        }, 1200);
    }
    
    downloadAllOutput() {
        console.log('Download all output clicked');
        console.log('Output buffer:', this.outputBuffer);
        
        if (!this.outputBuffer) {
            this.showToast('No output to download', 'warning');
            return;
        }
        
        // Add downloading animation
        const downloadBtn = this.elements.downloadAllBtn;
        downloadBtn.classList.add('downloading');
        
        // Clean markdown and get pure code
        const cleanedContent = this.cleanMarkdownForOutput(this.outputBuffer);
        console.log('Cleaned content:', cleanedContent);
        
        const language = this.elements.languageBadge.textContent || 'text';
        const extension = this.getFileExtension(language);
        const filename = this.elements.filename.textContent || `generated_code${extension}`;
        
        this.downloadFile(cleanedContent, filename);
        this.showToast('All output downloaded', 'success');
        
        // Remove downloading animation and add success animation
        setTimeout(() => {
            downloadBtn.classList.remove('downloading');
            downloadBtn.classList.add('success');
            
            // Temporarily change icon to checkmark
            const originalIcon = downloadBtn.querySelector('.btn-icon').innerHTML;
            downloadBtn.querySelector('.btn-icon').innerHTML = `
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            `;
            
            // Remove success animation and restore original icon after delay
            setTimeout(() => {
                downloadBtn.classList.remove('success');
                downloadBtn.querySelector('.btn-icon').innerHTML = originalIcon;
            }, 1200);
        }, 500);
    }
    
    cleanMarkdownForOutput(content) {
        if (!content) return '';
        
        // Remove markdown code block markers
        let cleaned = content.trim();
        
        // Remove ```language at the beginning
        cleaned = cleaned.replace(/^```\w*\s*\n?/i, '');
        
        // Remove ``` at the end
        cleaned = cleaned.replace(/\n?```\s*$/i, '');
        
        return cleaned.trim();
    }
    
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed:', err);
                    this.showToast('Copy failed. Please copy manually.', 'error');
                    return;
                }
                
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Copy failed. Please copy manually.', 'error');
        }
    }
    
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    getFileExtension(language) {
        const extensions = {
            'python': '.py',
            'javascript': '.js',
            'typescript': '.ts',
            'html': '.html',
            'css': '.css',
            'java': '.java',
            'cpp': '.cpp',
            'c': '.c',
            'rust': '.rs',
            'go': '.go',
            'php': '.php',
            'ruby': '.rb',
            'swift': '.swift',
            'kotlin': '.kt',
            'scala': '.scala',
            'sql': '.sql',
            'bash': '.sh',
            'powershell': '.ps1',
            'yaml': '.yml',
            'json': '.json',
            'xml': '.xml',
            'markdown': '.md'
        };
        
        return extensions[language.toLowerCase()] || '.txt';
    }
    
    toggleSidebar() {
        if (this.elements.sidebarToggle.checked) {
            this.elements.sidebar.classList.add('open');
        } else {
            this.elements.sidebar.classList.remove('open');
        }
    }
    
    handleClickOutside(event) {
        const sidebar = this.elements.sidebar;
        const sidebarToggle = this.elements.sidebarToggle;
        const deleteModal = this.elements.deleteModal;
        const settingsModal = this.elements.settingsModal;
        
        // Check if sidebar is open and click is outside sidebar and toggle button
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(event.target) && 
            !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('open');
            this.elements.sidebarToggle.checked = false;
        }
        
        // Check if delete modal is open and click is outside modal content
        if (deleteModal.classList.contains('visible') && 
            !deleteModal.querySelector('.delete-modal-content').contains(event.target)) {
            this.hideDeleteModal();
        }
        
        // Check if settings modal is open and click is outside modal content
        if (settingsModal.classList.contains('visible') && 
            !settingsModal.querySelector('.settings-modal-content').contains(event.target)) {
            this.hideSettingsModal();
        }
        
        // Check if model modal is open and click is outside modal content
        const modelModal = this.elements.modelModal;
        if (modelModal.classList.contains('visible') && 
            !modelModal.querySelector('.model-modal-content').contains(event.target)) {
            this.hideModelModal();
        }
    }
    
    updateStatus(status) {
        this.elements.statusText.textContent = status;
    }
    
    updateTokenCount() {
        this.elements.tokenCount.textContent = this.tokenCount > 0 ? `${this.tokenCount} tokens` : '';
    }
    
    showToast(message, type = 'info') {
        const toastContainer = this.elements.toastContainer;
        const maxToasts = 2;
        
        // Remove oldest toast if we have reached the maximum
        const existingToasts = toastContainer.querySelectorAll('.toast');
        if (existingToasts.length >= maxToasts) {
            const oldestToast = existingToasts[0];
            if (oldestToast.parentNode) {
                oldestToast.parentNode.removeChild(oldestToast);
            }
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
    
    handleKeyboard(event) {
        // Ctrl/Cmd + Enter to generate
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            if (!this.isGenerating) {
                this.startGeneration();
            }
        }
        
        // Escape to stop generation, close sidebar, or close modals
        if (event.key === 'Escape') {
            if (this.isGenerating) {
                event.preventDefault();
                this.stopGeneration();
            } else if (this.elements.deleteModal.classList.contains('visible')) {
                event.preventDefault();
                this.hideDeleteModal();
            } else if (this.elements.settingsModal.classList.contains('visible')) {
                event.preventDefault();
                this.hideSettingsModal();
            } else if (this.elements.modelModal.classList.contains('visible')) {
                event.preventDefault();
                this.hideModelModal();
            } else if (this.elements.sidebar.classList.contains('open')) {
                event.preventDefault();
                this.elements.sidebar.classList.remove('open');
                this.elements.sidebarToggle.checked = false;
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        
        // Format: "Dec 15, 2023 at 2:30 PM"
        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        
        return date.toLocaleDateString('en-US', options);
    }
    
    saveLastGeneration() {
        const state = {
            generationId: this.currentGenerationId,
            prompt: this.elements.promptInput.value,
            outputBuffer: this.outputBuffer,
            tokenCount: this.tokenCount,
            isGenerating: this.isGenerating,
            timestamp: Date.now()
        };
        localStorage.setItem('appState', JSON.stringify(state));
    }
    
    loadLastGeneration() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Check if the saved state is recent (within last 24 hours)
                const isRecent = (Date.now() - state.timestamp) < (24 * 60 * 60 * 1000);
                
                if (isRecent && state.generationId) {
                    // Load the specific generation
                    this.loadGeneration(state.generationId);
                } else if (isRecent && state.prompt && state.outputBuffer) {
                    // Restore new generation state
                    this.restoreNewGenerationState(state);
                } else if (isRecent && state.prompt) {
                    // Restore just the prompt for new generation
                    this.restorePromptOnly(state);
                } else {
                    // State is too old, start fresh
                    this.clearSavedState();
                }
            }
        } catch (error) {
            console.error('Failed to load saved state:', error);
            this.clearSavedState();
        }
    }
    
    restoreNewGenerationState(state) {
        // Restore prompt and output
        this.elements.promptInput.value = state.prompt || '';
        this.outputBuffer = state.outputBuffer || '';
        this.tokenCount = state.tokenCount || 0;
        
        // Display the output
        if (this.outputBuffer) {
            this.renderOutput(this.outputBuffer);
            this.updateActionButtons();
        }
        
        // Update UI state for new generation
        this.updateUIState();
        this.updateStatus('Ready');
    }
    
    restorePromptOnly(state) {
        // Restore just the prompt
        this.elements.promptInput.value = state.prompt || '';
        
        // Update UI state for new generation
        this.updateUIState();
        this.updateStatus('Ready');
    }
    
    clearSavedState() {
        localStorage.removeItem('appState');
        localStorage.removeItem('lastGenerationId'); // Remove old format
    }
    
    showDeleteModal(generationId) {
        const generation = this.history.find(g => g._id === generationId);
        if (!generation) return;
        
        // Set the filename in the modal (fallback to title if no filename)
        const displayText = generation.filename || generation.title || 'Untitled';
        this.elements.deleteModalPrompt.textContent = displayText;
        
        // Store the generation ID for deletion
        this.deleteModalGenerationId = generationId;
        
        // Show the modal
        this.elements.deleteModal.classList.add('visible');
        
        // Focus the cancel button for accessibility
        this.elements.deleteModalCancel.focus();
    }
    
    hideDeleteModal() {
        this.elements.deleteModal.classList.remove('visible');
        this.deleteModalGenerationId = null;
    }
    
    showSettingsModal() {
        if (!this.elements.settingsModal || !this.elements.settingsModalClose) {
            return;
        }
        
        // Refresh font size select with currently applied font size
        this.refreshFontSizeSelect();
        
        this.elements.settingsModal.classList.add('visible');
        
        // Force a reflow to ensure the modal is visible
        this.elements.settingsModal.offsetHeight;
        
        // Focus the close button for accessibility
        this.elements.settingsModalClose.focus();
    }
    
    hideSettingsModal() {
        this.elements.settingsModal.classList.remove('visible');
    }
    
    async showModelModal() {
        try {
            // Load available models
            await this.loadAvailableModels();
            
            // Show the modal
            this.elements.modelModal.classList.add('visible');
            
            // Focus the close button for accessibility
            this.elements.modelModalClose.focus();
        } catch (error) {
            console.error('Error showing model modal:', error);
            this.showToast('Failed to load models', 'error');
        }
    }
    
    hideModelModal() {
        this.elements.modelModal.classList.remove('visible');
    }
    
    async loadAvailableModels() {
        try {
            const response = await fetch(`${this.apiBase}/models`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.renderModelList(data.models);
        } catch (error) {
            console.error('Error loading models:', error);
            this.elements.modelList.innerHTML = '<div class="error">Failed to load models</div>';
            throw error;
        }
    }
    
    renderModelList(models) {
        const currentModel = this.getCurrentModel();
        
        if (models.length === 0) {
            this.elements.modelList.innerHTML = '<div class="error">No models available</div>';
            return;
        }
        
        this.elements.modelList.innerHTML = models.map(model => `
            <div class="model-item ${model.name === currentModel ? 'selected' : ''}" 
                 data-model="${model.name}">
                <div class="model-item-name">${model.name}</div>
                <div class="model-item-size">${this.formatModelSize(model.size)}</div>
            </div>
        `).join('');
        
        // Add click handlers
        this.elements.modelList.querySelectorAll('.model-item').forEach(item => {
            item.addEventListener('click', () => {
                const modelName = item.dataset.model;
                this.selectModel(modelName);
            });
        });
    }
    
    async selectModel(modelName) {
        try {
            const response = await fetch(`${this.apiBase}/models/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: modelName })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to set model: ${response.statusText}`);
            }
            
            // Update UI
            this.elements.modelName.textContent = modelName;
            this.setCurrentModel(modelName);
            
            // Hide modal
            this.hideModelModal();
            
            // Show success message
            this.showToast(`Model changed to ${modelName}`, 'success');
            
        } catch (error) {
            console.error('Error selecting model:', error);
            this.showToast('Failed to change model', 'error');
        }
    }
    
    formatModelSize(bytes) {
        if (bytes === 0) return 'Unknown size';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    
    getCurrentModel() {
        return localStorage.getItem('selectedModel') || 'qwen2.5:14b';
    }
    
    setCurrentModel(modelName) {
        localStorage.setItem('selectedModel', modelName);
    }
    
    async initializeModelSelection() {
        try {
            // Get available models
            const response = await fetch(`${this.apiBase}/models`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            const models = data.models;
            
            if (models.length === 0) {
                this.elements.modelName.textContent = 'No models available';
                this.showToast('No models available. Please install models in Ollama.', 'warning');
                return;
            }
            
            // Get current model from localStorage
            let currentModel = this.getCurrentModel();
            
            // Check if current model is still available
            const availableModelNames = models.map(m => m.name);
            
            if (models.length === 1) {
                // Only one model available - auto-select it
                currentModel = models[0].name;
                this.setCurrentModel(currentModel);
                this.elements.modelName.textContent = currentModel;
                this.showToast(`Auto-selected model: ${currentModel}`, 'success');
            } else if (!availableModelNames.includes(currentModel)) {
                // Current model not available - don't auto-select
                this.elements.modelName.textContent = 'Select a model';
                this.showToast('Please select a model to continue', 'warning');
                return;
            } else {
                // Current model is available - use it
                this.elements.modelName.textContent = currentModel;
            }
            
            // Set the model in the backend
            await this.setModelInBackend(currentModel);
            
        } catch (error) {
            console.error('Error initializing model selection:', error);
            this.elements.modelName.textContent = 'Error loading models';
            this.showToast('Failed to load models', 'error');
        }
    }
    
    async setModelInBackend(modelName) {
        try {
            const response = await fetch(`${this.apiBase}/models/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: modelName })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to set model: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error setting model in backend:', error);
            // Don't show error toast here as it might be too intrusive
        }
    }
    
    handleThemeChange(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update highlight.js theme
        this.updateHighlightTheme(theme);
        
        this.showToast(`Switched to ${theme} theme`, 'success');
    }
    
    updateHighlightTheme(theme) {
        // Remove existing highlight.js theme
        const existingTheme = document.querySelector('link[href*="highlight.js"]');
        if (existingTheme) {
            existingTheme.remove();
        }
        
        // Add new theme
        const themeLink = document.createElement('link');
        themeLink.rel = 'stylesheet';
        themeLink.href = theme === 'dark' 
            ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
        document.head.appendChild(themeLink);
        
        // Re-apply highlighting to existing code blocks
        setTimeout(() => {
            this.applySyntaxHighlighting();
        }, 100);
    }
    
    initializeTheme() {
        // Get current theme from document (already set by the script in head)
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        
        // Set the toggle state based on current theme
        this.elements.themeToggle.checked = currentTheme === 'dark';
        
        // Update highlight.js theme if needed (it should already be set by the head script)
        this.updateHighlightTheme(currentTheme);
    }
    
    initializeFontSize() {
        // Get saved font size from localStorage
        const savedFontSize = localStorage.getItem('codeFontSize') || 'base';
        
        // Set the select value
        if (this.elements.codeFontSizeSelect) {
            this.elements.codeFontSizeSelect.value = savedFontSize;
        }
        
        // Apply the font size to all code blocks
        this.applyFontSizeToCodeBlocks(savedFontSize);
        
        // Update preview
        this.handleFontSizePreview(savedFontSize);
    }
    
    handleFontSizePreview(fontSize) {
        if (this.elements.fontSizePreview) {
            // Update the preview with the selected font size
            this.elements.fontSizePreview.setAttribute('data-size', fontSize);
        }
    }
    
    applyFontSize() {
        const selectedFontSize = this.elements.codeFontSizeSelect.value;
        
        // Save to localStorage
        localStorage.setItem('codeFontSize', selectedFontSize);
        
        // Apply to all code blocks
        this.applyFontSizeToCodeBlocks(selectedFontSize);
        
        // Show success message
        this.showToast(`Font size updated to ${this.getFontSizeLabel(selectedFontSize)}`, 'success');
    }
    
    applyFontSizeToCodeBlocks(fontSize) {
        // Apply font size to all existing code blocks
        const codeBlocks = document.querySelectorAll('.code-block-content pre');
        codeBlocks.forEach(block => {
            block.setAttribute('data-font-size', fontSize);
        });
    }
    
    getFontSizeLabel(fontSize) {
        const labels = {
            'xs': 'Extra Small',
            'sm': 'Small', 
            'base': 'Medium',
            'lg': 'Large',
            'xl': 'Extra Large',
            '2xl': '2X Large'
        };
        return labels[fontSize] || 'Medium';
    }
    
    refreshFontSizeSelect() {
        // Get the currently applied font size from localStorage
        const currentFontSize = localStorage.getItem('codeFontSize') || 'base';
        
        // Update the select value
        if (this.elements.codeFontSizeSelect) {
            this.elements.codeFontSizeSelect.value = currentFontSize;
        }
        
        // Update the preview
        this.handleFontSizePreview(currentFontSize);
    }
    
    async confirmDelete() {
        if (!this.deleteModalGenerationId) return;
        
        try {
            const response = await fetch(`${this.apiBase}/history/${this.deleteModalGenerationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from local history array
                this.history = this.history.filter(g => g._id !== this.deleteModalGenerationId);
                
                // If this was the current generation, clear it
                if (this.currentGenerationId === this.deleteModalGenerationId) {
                    this.currentGenerationId = null;
                    this.outputBuffer = '';
                    this.tokenCount = 0;
                    this.clearOutputSection();
                    this.updateUIState();
                    this.updateStatus('Ready');
                }
                
                // Re-render history
                this.renderHistory();
                
                // Hide modal
                this.hideDeleteModal();
                
                // Show success message
                this.showToast('Generation deleted successfully', 'success');
            } else {
                const errorText = await response.text();
                console.error('Delete failed with status:', response.status, 'Response:', errorText);
                throw new Error(`Failed to delete generation: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to delete generation:', error);
            this.showToast(`Failed to delete generation: ${error.message}`, 'error');
            this.hideDeleteModal();
        }
    }
    
    async cleanup() {
        // If currently generating, pause the generation
        if (this.isGenerating && this.currentGenerationId) {
            try {
                // Send stop request to backend
                await fetch(`${this.apiBase}/stop/${this.currentGenerationId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ output: this.outputBuffer })
                });
                console.log('Generation paused due to page unload');
            } catch (error) {
                console.error('Failed to pause generation on cleanup:', error);
            }
        }
        
        // Close WebSocket connection
        if (this.ws) {
            this.ws.close();
        }
        
        // Clear health checker interval
        if (this.connectionHealthInterval) {
            clearInterval(this.connectionHealthInterval);
        }
    }
    
    async reconnectWebSocket() {
        if (!this.currentGenerationId || !this.isGenerating) {
            return;
        }
        
        try {
            console.log('Attempting to reconnect WebSocket...');
            
            // Check if generation is still active on the backend
            const response = await fetch(`${this.apiBase}/history/${this.currentGenerationId}`);
            if (!response.ok) {
                throw new Error('Generation not found on backend');
            }
            
            const generation = await response.json();
            
            if (generation.status === 'processing') {
                // Generation is still active, reconnect WebSocket
                await this.connectWebSocket(this.currentGenerationId);
                console.log('WebSocket reconnected successfully');
            } else {
                // Generation completed or failed, update UI
                this.setGeneratingState(false);
                this.displayGeneration(generation);
                console.log('Generation completed while page was hidden');
            }
        } catch (error) {
            console.error('Failed to reconnect WebSocket:', error);
            // If reconnection fails, stop generation
            this.setGeneratingState(false);
            this.showToast('Generation connection lost', 'error');
        }
    }
    
    startConnectionHealthChecker() {
        // Check connection health every 10 seconds
        this.connectionHealthInterval = setInterval(async () => {
            if (this.isGenerating) {
                await this.checkGenerationHealth();
            }
        }, 10000);
    }
    
    async checkGenerationHealth() {
        if (!this.currentGenerationId || !this.isGenerating) {
            return;
        }
        
        try {
            // Check if backend is reachable
            const response = await fetch(`${this.apiBase}/health`, { 
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!response.ok) {
                throw new Error('Backend health check failed');
            }
            
            // Check if generation is still active
            const generationResponse = await fetch(`${this.apiBase}/history/${this.currentGenerationId}`, {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!generationResponse.ok) {
                throw new Error('Generation not found');
            }
            
            const generation = await generationResponse.json();
            
            // If generation is still processing but WebSocket is closed, mark as failed
            if (generation.status === 'processing' && 
                (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
                console.log('Generation stuck in processing state, marking as failed');
                await this.markGenerationAsFailed('Connection lost - generation interrupted');
            }
            
        } catch (error) {
            console.error('Connection health check failed:', error);
            
            // If we can't reach the backend, mark generation as failed
            if (this.isGenerating) {
                console.log('Backend unreachable, marking generation as failed');
                await this.markGenerationAsFailed('Server connection lost - generation failed');
            }
        }
    }
    
    async markGenerationAsFailed(errorMessage) {
        if (!this.currentGenerationId || !this.isGenerating) {
            return;
        }
        
        try {
            // Mark generation as failed in backend
            const response = await fetch(`${this.apiBase}/history/${this.currentGenerationId}/fail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: errorMessage,
                    output: this.outputBuffer 
                })
            });
            
            if (response.ok) {
                // Update local state
                this.setGeneratingState(false);
                
                // Update the generation object
                const generation = {
                    _id: this.currentGenerationId,
                    status: 'failed',
                    error: errorMessage,
                    output: this.outputBuffer,
                    prompt: this.elements.promptInput.value
                };
                
                // Display the failed generation with incomplete code
                this.displayGeneration(generation);
                
                // Show error message
                this.showToast('Generation failed due to connection loss', 'error');
                
                console.log('Generation marked as failed:', errorMessage);
            }
        } catch (error) {
            console.error('Failed to mark generation as failed:', error);
            // Even if backend update fails, update UI to prevent stuck state
            this.setGeneratingState(false);
            this.showToast('Generation failed - please try again', 'error');
        }
    }
    
    async checkAndFixStuckGenerations() {
        try {
            // Check if there are any generations stuck in processing state
            const stuckGenerations = this.history.filter(g => g.status === 'processing');
            
            if (stuckGenerations.length > 0) {
                console.log(`Found ${stuckGenerations.length} stuck generation(s), fixing...`);
                
                for (const generation of stuckGenerations) {
                    try {
                        // Check if generation is actually still active on backend
                        const response = await fetch(`${this.apiBase}/history/${generation._id}`);
                        if (response.ok) {
                            const backendGeneration = await response.json();
                            
                            if (backendGeneration.status === 'processing') {
                                // Mark as failed since it's stuck
                                await fetch(`${this.apiBase}/history/${generation._id}/fail`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                        error: 'Generation stuck due to connection loss',
                                        output: generation.output || ''
                                    })
                                });
                                
                                // Update local history
                                generation.status = 'failed';
                                generation.error = 'Generation stuck due to connection loss';
                                
                                console.log(`Fixed stuck generation: ${generation._id}`);
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to fix stuck generation ${generation._id}:`, error);
                        // Mark as failed locally if backend is unreachable
                        generation.status = 'failed';
                        generation.error = 'Generation stuck - backend unreachable';
                    }
                }
                
                // Re-render history to show updated statuses
                this.renderHistory();
                
                if (stuckGenerations.length > 0) {
                    this.showToast(`Fixed ${stuckGenerations.length} stuck generation(s)`, 'info');
                }
            }
        } catch (error) {
            console.error('Error checking for stuck generations:', error);
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CodeGeneratorApp();
    // Make app globally available after it's properly initialized
    window.app = app;
});
