// debug-helper.js - Fashion AI Extension Debug Utility
// This file provides debugging utilities for troubleshooting the extension

window.FashionAIDebugger = {
    // Check extension state
    checkExtensionState() {
        console.log('=== Fashion AI Extension Debug Report ===');
        
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            extensionState: {},
            domState: {},
            errors: [],
            performance: {}
        };

        // Check extension state
        report.extensionState = {
            hasRunFashionAI: !!window.hasRunFashionAI,
            fashionAIInstanceId: window.fashionAIInstanceId || 'none',
            productFinderAvailable: !!window.ProductFinder,
            devConfigAvailable: !!window.DEV_CONFIG
        };

        // Check DOM state
        const container = document.getElementById('fashion-ai-search-container');
        report.domState = {
            searchContainerExists: !!container,
            containerVisible: container ? container.style.display !== 'none' : false,
            scriptsLoaded: this.getLoadedScripts(),
            highlightsCount: document.querySelectorAll('.fashion-ai-highlight').length
        };

        // Check for common errors
        report.errors = this.collectErrors();

        // Performance metrics
        if (performance.memory) {
            report.performance.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }

        console.table(report.extensionState);
        console.table(report.domState);
        
        if (report.errors.length > 0) {
            console.warn('Errors found:', report.errors);
        } else {
            console.log('✅ No errors detected');
        }

        return report;
    },

    // Get loaded scripts
    getLoadedScripts() {
        const scripts = Array.from(document.querySelectorAll('script')).map(script => {
            const src = script.src;
            if (src && src.includes('chrome-extension://')) {
                return src.split('/').pop();
            }
            return null;
        }).filter(Boolean);

        return scripts;
    },

    // Collect potential errors
    collectErrors() {
        const errors = [];

        // Check if ProductFinder class is properly exported
        if (!window.ProductFinder) {
            errors.push('ProductFinder class not available on window object');
        } else {
            try {
                new window.ProductFinder(() => {});
                errors.push('✅ ProductFinder class can be instantiated');
            } catch (e) {
                errors.push(`ProductFinder instantiation failed: ${e.message}`);
            }
        }

        // Check if multiple instances might exist
        const containers = document.querySelectorAll('#fashion-ai-search-container');
        if (containers.length > 1) {
            errors.push(`Multiple UI containers found: ${containers.length}`);
        }

        // Check for script conflicts
        const scripts = this.getLoadedScripts();
        const duplicates = scripts.filter((item, index) => scripts.indexOf(item) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate scripts detected: ${duplicates.join(', ')}`);
        }

        return errors;
    },

    // Force cleanup and restart
    forceRestart() {
        console.log('🔄 Forcing Fashion AI restart...');
        
        // Clear global state
        window.hasRunFashionAI = false;
        delete window.fashionAIInstanceId;
        
        // Remove UI elements
        document.querySelectorAll('#fashion-ai-search-container').forEach(el => el.remove());
        document.querySelectorAll('.fashion-ai-highlight').forEach(el => el.remove());
        document.querySelectorAll('.fashion-ai-error-notification').forEach(el => el.remove());
        
        // Remove duplicate scripts
        document.querySelectorAll('script[src*="ProductFinder.js"]').forEach((script, index) => {
            if (index > 0) script.remove(); // Keep only the first one
        });
        
        console.log('✅ Cleanup completed. Click extension icon to restart.');
    },

    // Test script loading
    async testScriptLoading() {
        console.log('🧪 Testing script loading...');
        
        try {
            // Check if ProductFinder script is accessible
            const scriptUrl = chrome.runtime.getURL('ProductFinder.js');
            const response = await fetch(scriptUrl);
            
            if (response.ok) {
                console.log('✅ ProductFinder.js is accessible');
                const text = await response.text();
                
                // Check if class is properly defined
                if (text.includes('class ProductFinder')) {
                    console.log('✅ ProductFinder class found in script');
                } else {
                    console.error('❌ ProductFinder class not found in script');
                }
                
                if (text.includes('window.ProductFinder = ProductFinder')) {
                    console.log('✅ Class export statement found');
                } else {
                    console.error('❌ Class export statement not found');
                }
                
            } else {
                console.error('❌ Cannot access ProductFinder.js:', response.status);
            }
        } catch (error) {
            console.error('❌ Script loading test failed:', error);
        }
    },

    // Test AI worker
    async testAIWorker() {
        console.log('🧪 Testing AI Worker...');
        
        try {
            const worker = new Worker(chrome.runtime.getURL('ai-worker.js'), { type: 'module' });
            
            const testPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Worker test timeout'));
                }, 10000);
                
                worker.onmessage = (event) => {
                    clearTimeout(timeout);
                    if (event.data.type === 'WORKER_READY') {
                        console.log('✅ AI Worker loaded successfully');
                        resolve();
                    } else if (event.data.type === 'ERROR') {
                        reject(new Error(event.data.payload.message));
                    }
                };
                
                worker.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
            });
            
            await testPromise;
            worker.terminate();
            
        } catch (error) {
            console.error('❌ AI Worker test failed:', error);
        }
    },

    // Test complete initialization flow
    async testFullFlow() {
        console.log('🧪 Testing complete initialization flow...');
        
        try {
            // 1. Test script loading
            await this.testScriptLoading();
            
            // 2. Test AI worker
            await this.testAIWorker();
            
            // 3. Test class availability
            if (window.ProductFinder) {
                const instance = new window.ProductFinder((status) => {
                    console.log('Status:', status);
                });
                console.log('✅ ProductFinder instance created successfully');
            } else {
                console.error('❌ ProductFinder class not available for testing');
            }
            
            console.log('🎉 All tests completed successfully');
            
        } catch (error) {
            console.error('❌ Full flow test failed:', error);
        }
    },

    // Generate diagnostic report
    generateDiagnosticReport() {
        const report = this.checkExtensionState();
        
        const diagnosticText = `
Fashion AI Extension Diagnostic Report
Generated: ${report.timestamp}
URL: ${report.url}

Extension State:
- Has Run: ${report.extensionState.hasRunFashionAI}
- Instance ID: ${report.extensionState.fashionAIInstanceId}
- ProductFinder Available: ${report.extensionState.productFinderAvailable}

DOM State:
- Container Exists: ${report.domState.searchContainerExists}
- Container Visible: ${report.domState.containerVisible}
- Scripts Loaded: ${report.domState.scriptsLoaded.join(', ')}
- Highlights Count: ${report.domState.highlightsCount}

${report.errors.length > 0 ? `Errors:\n${report.errors.map(e => `- ${e}`).join('\n')}` : 'No errors detected'}

Performance:
${report.performance.memory ? `Memory Usage: ${report.performance.memory.used}MB / ${report.performance.memory.total}MB` : 'Memory info not available'}

User Agent: ${report.userAgent}
        `.trim();
        
        // Copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(diagnosticText).then(() => {
                console.log('📋 Diagnostic report copied to clipboard');
            });
        }
        
        return diagnosticText;
    },

    // Quick fixes
    quickFixes: {
        clearCache() {
            console.log('🧹 Clearing extension cache...');
            chrome.storage.local.clear();
            chrome.storage.sync.clear();
            console.log('✅ Cache cleared');
        },
        
        resetUI() {
            console.log('🔄 Resetting UI...');
            document.querySelectorAll('#fashion-ai-search-container').forEach(el => el.remove());
            document.querySelectorAll('.fashion-ai-highlight').forEach(el => el.remove());
            console.log('✅ UI reset');
        },
        
        reloadExtension() {
            console.log('🔄 Reloading extension...');
            chrome.runtime.reload();
        }
    }
};

// Auto-run basic diagnostics if debug mode is enabled
if (window.DEV_CONFIG && window.DEV_CONFIG.DEBUG_MODE) {
    console.log('🔍 Fashion AI Debug Helper loaded');
    console.log('Run FashionAIDebugger.checkExtensionState() for diagnostics');
    console.log('Run FashionAIDebugger.testFullFlow() for comprehensive testing');
    console.log('Run FashionAIDebugger.forceRestart() to clean restart');
}

// Export for external access
window.debugFashionAI = window.FashionAIDebugger; 