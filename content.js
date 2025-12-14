// Content script to extract and hide colors on wplace.live

// Extracts colors in real-time from the page
function extractColorsFromPage() {
    const colors = [];
    const tooltips = document.querySelectorAll('.tooltip[data-tip]');
    
    tooltips.forEach(tooltip => {
        const colorName = tooltip.getAttribute('data-tip');
        if (colorName && colorName.trim()) {
            // Try to get the color from the element or its children
            let rgbStyle = window.getComputedStyle(tooltip).backgroundColor;
            
            // If transparent, check children
            if (rgbStyle === 'rgba(0, 0, 0, 0)' || rgbStyle === 'transparent') {
                const child = tooltip.querySelector('div, span, [style*="background"]');
                if (child) {
                    rgbStyle = window.getComputedStyle(child).backgroundColor;
                }
            }
            
            // If still transparent, try inline style
            if (rgbStyle === 'rgba(0, 0, 0, 0)' || rgbStyle === 'transparent') {
                const styleAttr = tooltip.getAttribute('style');
                if (styleAttr && styleAttr.includes('background')) {
                    const match = styleAttr.match(/background[^:]*:\s*([^;]+)/);
                    if (match) {
                        rgbStyle = match[1].trim();
                    }
                }
            }
            
            if (!colors.find(c => c.name === colorName)) {
                colors.push({
                    name: colorName,
                    rgb: rgbStyle
                });
            }
        }
    });
    
    return colors;
}

// Creates dynamic styles to hide colors
function applyHiddenStyles(disabledColors) {
    let styleId = 'wplace-color-hider-style';
    let style = document.getElementById(styleId);
    
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    
    // Create CSS rules for each disabled color
    let cssRules = '';
    disabledColors.forEach(colorName => {
        cssRules += `.tooltip[data-tip="${colorName}"] { display: none !important; }\n`;
    });
    
    style.textContent = cssRules;
}

// Adds the button to open the color modal
function addColorHiderButton() {
    // Check if button already exists
    if (document.getElementById('wplace-color-hider-btn')) {
        return true;
    }
    
    // Find the "Eyedropper" button div
    const eyedropperDiv = Array.from(document.querySelectorAll('.tooltip')).find(el => 
        el.textContent.includes('Contagocce')
    );
    
    if (!eyedropperDiv) {
        console.log('Eyedropper button not found');
        return false;
    }
    
    // Clone the div
    const buttonContainer = eyedropperDiv.cloneNode(true);
    buttonContainer.id = 'wplace-color-hider-btn';
    
    // Modify the tooltip content
    const tooltipContent = buttonContainer.querySelector('.tooltip-content');
    if (tooltipContent) {
        tooltipContent.textContent = 'Hide Colors';
    }
    
    // Modify the button
    const button = buttonContainer.querySelector('button');
    if (button) {
        button.title = 'Hide Colors';
        // Change SVG to eye icon
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
    
    // Insert the cloned button after the eyedropper
    eyedropperDiv.parentNode.insertBefore(buttonContainer, eyedropperDiv.nextSibling);
    
    // Click event to open modal
    button.addEventListener('click', showColorHiderModal);
    
    console.log('Color hider button added successfully');
    return true;
}

// Shows the color modal
async function showColorHiderModal() {
    // Toggle if modal already exists
    let modal = document.getElementById('wplace-color-hider-modal');
    if (modal) {
        modal.remove();
        return;
    }
    
    // Create modal
    modal = document.createElement('div');
    modal.id = 'wplace-color-hider-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Hide Colors';
    title.style.cssText = 'margin: 0; font-size: 20px; font-weight: 600;';
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
    `;
    closeBtn.addEventListener('mouseover', () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)');
    closeBtn.addEventListener('mouseout', () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)');
    closeBtn.addEventListener('click', () => {
        // Remove both modal and overlay
        const overlay = document.getElementById('wplace-color-hider-overlay');
        if (overlay) overlay.remove();
        modal.remove();
    });
    header.appendChild(closeBtn);
    modal.appendChild(header);
    
    // Action buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = `
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
    `;
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = '✓ All';
    selectAllBtn.style.cssText = `
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid #667eea;
        color: #667eea;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    `;
    selectAllBtn.addEventListener('mouseover', () => {
        selectAllBtn.style.background = 'rgba(102, 126, 234, 0.2)';
    });
    selectAllBtn.addEventListener('mouseout', () => {
        selectAllBtn.style.background = 'rgba(102, 126, 234, 0.1)';
    });
    
    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.textContent = '✗ None';
    deselectAllBtn.style.cssText = `
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid #667eea;
        color: #667eea;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    `;
    deselectAllBtn.addEventListener('mouseover', () => {
        deselectAllBtn.style.background = 'rgba(102, 126, 234, 0.2)';
    });
    deselectAllBtn.addEventListener('mouseout', () => {
        deselectAllBtn.style.background = 'rgba(102, 126, 234, 0.1)';
    });
    
    buttonsDiv.appendChild(selectAllBtn);
    buttonsDiv.appendChild(deselectAllBtn);
    modal.appendChild(buttonsDiv);
    
    // Content area with colors
    const content = document.createElement('div');
    content.id = 'wplace-modal-colors';
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 12px;
    `;
    modal.appendChild(content);
    
    // Add modal to DOM
    document.body.appendChild(modal);
    
    // Load colors
    const colors = extractColorsFromPage();
    const disabledColors = await getDisabledColorsFromStorage();
    
    colors.sort((a, b) => a.name.localeCompare(b.name));
    
    colors.forEach((color, index) => {
        const isDisabled = disabledColors.includes(color.name);
        
        const colorItem = document.createElement('div');
        colorItem.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        `;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !isDisabled;
        checkbox.style.cssText = `
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #667eea;
        `;
        
        const colorSample = document.createElement('div');
        colorSample.title = `${color.name} - ${color.rgb}`;
        colorSample.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 6px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.2s;
            ${color.rgb === 'transparent' ? `
                background-image: 
                    linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 8px 8px;
                background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            ` : `background-color: ${color.rgb};`}
        `;
        
        if (isDisabled) {
            colorItem.style.opacity = '0.5';
        }
        
        colorSample.addEventListener('mouseover', () => {
            colorSample.style.transform = 'scale(1.05)';
        });
        colorSample.addEventListener('mouseout', () => {
            colorSample.style.transform = 'scale(1)';
        });
        
        checkbox.addEventListener('change', async () => {
            const newDisabled = await getDisabledColorsFromStorage();
            
            if (checkbox.checked) {
                const idx = newDisabled.indexOf(color.name);
                if (idx > -1) newDisabled.splice(idx, 1);
                colorItem.style.opacity = '1';
            } else {
                if (!newDisabled.includes(color.name)) {
                    newDisabled.push(color.name);
                }
                colorItem.style.opacity = '0.5';
            }
            
            await saveDisabledColorsToStorage(newDisabled);
        });
        
        colorItem.appendChild(checkbox);
        colorItem.appendChild(colorSample);
        content.appendChild(colorItem);
    });
    
    // Button functions
    selectAllBtn.addEventListener('click', async () => {
        await saveDisabledColorsToStorage([]);
        modal.remove();
        showColorHiderModal();
    });
    
    deselectAllBtn.addEventListener('click', async () => {
        const allColorNames = colors.map(c => c.name);
        await saveDisabledColorsToStorage(allColorNames);
        modal.remove();
        showColorHiderModal();
    });
    
    // Dark background overlay to close
    const overlay = document.createElement('div');
    overlay.id = 'wplace-color-hider-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
    `;
    overlay.addEventListener('click', () => {
        overlay.remove();
        modal.remove();
    });
    
    document.body.insertBefore(overlay, document.body.firstChild);
}

// Storage functions
async function getDisabledColorsFromStorage() {
    try {
        const result = await browser.storage.local.get('disabledColors');
        return result.disabledColors || [];
    } catch (error) {
        console.log('Error loading state:', error);
        return [];
    }
}

async function saveDisabledColorsToStorage(disabled) {
    try {
        await browser.storage.local.set({ disabledColors: disabled });
        applyHiddenStyles(disabled);
    } catch (error) {
        console.log('Error saving state:', error);
    }
}

// Load disabled colors from storage
async function loadDisabledColors() {
    try {
        const result = await browser.storage.local.get('disabledColors');
        const disabled = result.disabledColors || [];
        applyHiddenStyles(disabled);
        
        // Try to add button with retry
        if (!addColorHiderButton()) {
            // If fails, retry after delay
            setTimeout(addColorHiderButton, 500);
            setTimeout(addColorHiderButton, 1000);
            setTimeout(addColorHiderButton, 2000);
        }
    } catch (error) {
        console.log('Error loading disabled colors:', error);
    }
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getColors') {
        // Extract colors in real-time
        const colors = extractColorsFromPage();
        sendResponse({ colors: colors });
    } else if (request.action === 'updateDisabledColors') {
        applyHiddenStyles(request.disabledColors);
        sendResponse({ success: true });
    }
    return true;
});

// Load disabled colors on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDisabledColors);
} else {
    loadDisabledColors();
}

window.addEventListener('load', () => {
    // Try to add button on load as well
    setTimeout(() => {
        if (!addColorHiderButton()) {
            setTimeout(addColorHiderButton, 500);
            setTimeout(addColorHiderButton, 1000);
        }
    }, 100);
});
