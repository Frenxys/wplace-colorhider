// Background script per gestire i messaggi e lo storage

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveColors') {
        // Salva i colori nello storage locale
        browser.storage.local.set({ colors: request.colors })
            .then(() => {
                console.log(`${request.colors.length} colori salvati nello storage`);
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Errore nel salvataggio:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Indica che la risposta sarà asincrona
    }
});
