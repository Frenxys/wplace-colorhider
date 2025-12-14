// Estrae i colori in tempo reale dalla pagina
let allColors = [];

async function getColorsFromPage() {
    try {
        const [tab] = await browser.tabs.query({ url: 'https://wplace.live/*', active: true });
        if (!tab) {
            console.error('Nessuna tab di wplace.live aperta');
            return [];
        }
        
        const response = await browser.tabs.sendMessage(tab.id, { action: 'getColors' });
        return response.colors || [];
    } catch (error) {
        console.error('Errore nell\'estrazione dei colori:', error);
        return [];
    }
}

// Carica lo stato dei colori disattivati dal storage
async function getDisabledColors() {
    try {
        const result = await browser.storage.local.get('disabledColors');
        return result.disabledColors || [];
    } catch (error) {
        console.error('Errore nel caricamento dello stato:', error);
        return [];
    }
}

// Salva lo stato dei colori disattivati
async function saveDisabledColors(disabled) {
    try {
        await browser.storage.local.set({ disabledColors: disabled });
        // Notifica il content script dei cambiamenti
        browser.tabs.query({ url: 'https://wplace.live/*' }, (tabs) => {
            tabs.forEach(tab => {
                browser.tabs.sendMessage(tab.id, {
                    action: 'updateDisabledColors',
                    disabledColors: disabled
                }).catch(() => {
                    // Ignora gli errori se il tab non è disponibile
                });
            });
        });
    } catch (error) {
        console.error('Errore nel salvataggio dello stato:', error);
    }
}

// Visualizza i colori nella popup
async function displayColors() {
    const colorsBox = document.getElementById('colors-box');
    colorsBox.innerHTML = '<div class="loading">Caricamento colori...</div>';

    allColors = await getColorsFromPage();
    const disabledColors = await getDisabledColors();

    if (!allColors || allColors.length === 0) {
        colorsBox.innerHTML = '<div class="no-colors">Nessun colore trovato</div>';
        return;
    }

    colorsBox.innerHTML = '';

    // Ordina i colori per nome
    allColors.sort((a, b) => a.name.localeCompare(b.name));

    allColors.forEach((color, index) => {
        const isDisabled = disabledColors.includes(color.name);
        
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item' + (isDisabled ? ' disabled' : '');
        colorItem.id = `color-${index}`;
        
        // Toggle checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'color-toggle';
        checkbox.checked = !isDisabled;
        checkbox.id = `toggle-${index}`;
        
        checkbox.addEventListener('change', async () => {
            const newDisabled = await getDisabledColors();
            
            if (checkbox.checked) {
                // Riattiva il colore
                const idx = newDisabled.indexOf(color.name);
                if (idx > -1) newDisabled.splice(idx, 1);
                colorItem.classList.remove('disabled');
            } else {
                // Disattiva il colore
                if (!newDisabled.includes(color.name)) {
                    newDisabled.push(color.name);
                }
                colorItem.classList.add('disabled');
            }
            
            await saveDisabledColors(newDisabled);
        });
        
        colorItem.appendChild(checkbox);
        
        // Anteprima colore
        const colorSample = document.createElement('div');
        colorSample.className = 'color-sample';
        colorSample.title = `${color.name} - ${color.rgb}`;
        
        if (color.rgb === 'transparent') {
            colorSample.classList.add('transparent');
        } else {
            colorSample.style.backgroundColor = color.rgb;
        }
        
        colorItem.appendChild(colorSample);
        
        // Copia il colore negli appunti al click
        colorItem.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                navigator.clipboard.writeText(color.rgb).then(() => {
                    showCopyNotification(colorItem);
                });
            }
        });
        
        colorsBox.appendChild(colorItem);
    });
}

function showCopyNotification(element) {
    const originalBackground = element.style.background;
    element.style.background = '#d4edda';
    element.style.borderColor = '#28a745';
    
    setTimeout(() => {
        element.style.background = originalBackground;
        element.style.borderColor = 'transparent';
    }, 1000);
}

// Attiva tutti i colori
document.addEventListener('DOMContentLoaded', async () => {
    displayColors();
    
    // Bottone "Attiva tutti"
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', async () => {
            await saveDisabledColors([]);
            await displayColors();
        });
    }
    
    // Bottone "Disattiva tutti"
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', async () => {
            const allColorNames = allColors.map(c => c.name);
            await saveDisabledColors(allColorNames);
            await displayColors();
        });
    }
    
    // Bottone refresh
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.animation = 'spin 0.6s linear';
            displayColors();
            setTimeout(() => {
                refreshBtn.style.animation = '';
            }, 600);
        });
    }
});

