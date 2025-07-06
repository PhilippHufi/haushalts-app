class BookkeepingApp {
    constructor() {
        this.accounts = [];
        this.transactions = [];
        this.receipts = [];
        this.currentReceiptType = 'kassenbon';
        this.init();
    }

    init() {
        this.loadData();
        this.loadDefaultAccounts();
        this.bindEvents();
        this.updateAccountDropdowns();
        this.renderAccounts();
        this.renderTransactions();
        this.renderBalance();
        this.renderReceipts();
        this.setupPWA();
        this.updateDashboard();
        this.initCharts();
    }

    setupPWA() {
        let deferredPrompt;
        const installButton = document.getElementById('install-button');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'block';
        });

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.showNotification('✅ App wird installiert!', 'success');
                }
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App läuft im Standalone-Modus');
        }
    }

    addTouchEvents() {
        // Verbesserte Touch-Unterstützung für mobile Geräte
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            button.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });

        // Tap-to-focus für Input-Felder
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('touchstart', function() {
                this.style.borderColor = 'var(--primary-color)';
            });
        });

        // Haptic Feedback (wenn verfügbar)
        if ('vibrate' in navigator) {
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    navigator.vibrate(50);
                });
            });
        }
    }

    loadDefaultAccounts() {
        if (this.accounts.length === 0) {
            const defaultAccounts = [
                // Vermögenskonten
                { name: 'Bargeld', type: 'Aktiva', icon: '💵', category: 'Vermögen' },
                { name: 'Girokonto', type: 'Aktiva', icon: '🏦', category: 'Vermögen' },
                { name: 'Sparkonto', type: 'Aktiva', icon: '💰', category: 'Vermögen' },
                { name: 'PayPal', type: 'Aktiva', icon: '💳', category: 'Vermögen' },
                
                // Ausgabenkategorien
                { name: 'Essen', type: 'Aufwendungen', icon: '🍕', category: 'Ausgaben' },
                { name: 'Haushalt', type: 'Aufwendungen', icon: '🏠', category: 'Ausgaben' },
                { name: 'Kleidung', type: 'Aufwendungen', icon: '👕', category: 'Ausgaben' },
                { name: 'Transport', type: 'Aufwendungen', icon: '🚗', category: 'Ausgaben' },
                { name: 'Unterhaltung', type: 'Aufwendungen', icon: '🎬', category: 'Ausgaben' },
                { name: 'Gesundheit', type: 'Aufwendungen', icon: '🏥', category: 'Ausgaben' },
                { name: 'Miete', type: 'Aufwendungen', icon: '🏘️', category: 'Ausgaben' },
                { name: 'Nebenkosten', type: 'Aufwendungen', icon: '💡', category: 'Ausgaben' },
                { name: 'Versicherungen', type: 'Aufwendungen', icon: '🛡️', category: 'Ausgaben' },
                { name: 'Sonstiges', type: 'Aufwendungen', icon: '📦', category: 'Ausgaben' },
                
                // Einnahmen
                { name: 'Gehalt', type: 'Erlöse', icon: '💼', category: 'Einnahmen' },
                { name: 'Nebeneinkommen', type: 'Erlöse', icon: '💸', category: 'Einnahmen' },
                { name: 'Geschenke', type: 'Erlöse', icon: '🎁', category: 'Einnahmen' }
            ];

            defaultAccounts.forEach(account => {
                this.accounts.push(account);
            });
        }
    }

    bindEvents() {
        document.getElementById('account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAccount();
        });

        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        document.getElementById('receipt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processReceipt();
        });

        document.getElementById('receipt-to-transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTransactionFromReceipt();
        });

        // Receipt type selector
        document.querySelectorAll('.receipt-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.receipt-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentReceiptType = e.target.dataset.type;
                document.getElementById('receipt-label').textContent = 
                    this.currentReceiptType === 'kassenbon' ? 
                    'Kassenbon fotografieren oder hochladen:' : 
                    'Rechnung fotografieren oder hochladen:';
            });
        });

        // Calendar controls
        document.getElementById('calendar-month').addEventListener('change', () => {
            this.updateCalendarView();
        });
        
        document.getElementById('calendar-filter').addEventListener('change', () => {
            this.updateCalendarView();
        });

        // Set default date and month
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        // Set calendar month with error handling
        const calendarMonth = document.getElementById('calendar-month');
        if (calendarMonth) {
            calendarMonth.value = new Date().toISOString().slice(0, 7);
        }
        
        // Add touch-friendly events for mobile
        this.addTouchEvents();
    }

    addAccount() {
        const name = document.getElementById('account-name').value;
        const type = document.getElementById('account-type').value;
        const category = document.getElementById('account-category').value;
        const icon = document.getElementById('account-icon').value || this.getDefaultIcon(category);

        if (this.accounts.find(acc => acc.name === name)) {
            this.showNotification('⚠️ Konto existiert bereits!', 'error');
            return;
        }

        this.accounts.push({ name, type, category, icon });
        this.updateAccountDropdowns();
        this.renderAccounts();
        this.renderBalance();
        this.saveData();
        
        document.getElementById('account-form').reset();
        
        this.showNotification('✅ Konto erfolgreich hinzugefügt!', 'success');
    }

    getDefaultIcon(category) {
        const icons = {
            'Vermögen': '💰',
            'Ausgaben': '💸',
            'Einnahmen': '💵',
            'Sonstiges': '📦'
        };
        return icons[category] || '📁';
    }

    addTransaction() {
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;
        const debitAccount = document.getElementById('debit-account').value;
        const creditAccount = document.getElementById('credit-account').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const notes = document.getElementById('notes').value;

        if (debitAccount === creditAccount) {
            this.showNotification('⚠️ Soll- und Haben-Konto müssen unterschiedlich sein!', 'error');
            return;
        }

        this.transactions.push({
            id: Date.now(),
            date,
            description,
            debitAccount,
            creditAccount,
            amount,
            notes,
            vendor: ''
        });

        this.renderTransactions();
        this.renderBalance();
        this.updateCalendarView();
        this.updateDashboard();
        this.saveData();
        
        document.getElementById('transaction-form').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        this.showNotification('✅ Transaktion erfolgreich hinzugefügt!', 'success');
    }

    updateAccountDropdowns() {
        const debitSelect = document.getElementById('debit-account');
        const creditSelect = document.getElementById('credit-account');
        
        debitSelect.innerHTML = '<option value="">Konto auswählen</option>';
        creditSelect.innerHTML = '<option value="">Konto auswählen</option>';

        this.accounts.forEach(account => {
            const option1 = document.createElement('option');
            option1.value = account.name;
            option1.textContent = account.name;
            debitSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = account.name;
            option2.textContent = account.name;
            creditSelect.appendChild(option2);
        });
    }

    renderAccounts() {
        const tbody = document.getElementById('accounts-tbody');
        tbody.innerHTML = '';

        // Gruppiere Konten nach Kategorie
        const groupedAccounts = {};
        this.accounts.forEach(account => {
            const category = account.category || account.type;
            if (!groupedAccounts[category]) {
                groupedAccounts[category] = [];
            }
            groupedAccounts[category].push(account);
        });

        // Rendere jede Gruppe
        Object.entries(groupedAccounts).forEach(([category, accounts]) => {
            // Kategorie-Header
            const categoryRow = document.createElement('tr');
            categoryRow.className = 'category-header';
            categoryRow.innerHTML = `
                <td colspan="4"><strong>${category}</strong></td>
            `;
            tbody.appendChild(categoryRow);

            // Konten in der Kategorie
            accounts.forEach((account, index) => {
                const balance = this.getAccountBalance(account.name);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <span class="account-icon">${account.icon || '📁'}</span>
                        ${account.name}
                    </td>
                    <td>${account.type}</td>
                    <td class="${balance >= 0 ? 'positive' : 'negative'}">€${balance.toFixed(2)}</td>
                    <td>
                        <button class="delete-btn" onclick="app.deleteAccount('${account.name}')" 
                                title="Konto löschen" ${this.isAccountUsed(account.name) ? 'disabled' : ''}>
                            🗑️
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
    }

    deleteAccount(accountName) {
        if (this.isAccountUsed(accountName)) {
            this.showNotification('⚠️ Konto kann nicht gelöscht werden, da es noch Transaktionen enthält!', 'error');
            return;
        }

        if (confirm(`Möchten Sie das Konto "${accountName}" wirklich löschen?`)) {
            this.accounts = this.accounts.filter(acc => acc.name !== accountName);
            this.updateAccountDropdowns();
            this.renderAccounts();
            this.saveData();
            this.showNotification('✅ Konto erfolgreich gelöscht!', 'success');
        }
    }

    isAccountUsed(accountName) {
        return this.transactions.some(t => 
            t.debitAccount === accountName || t.creditAccount === accountName
        );
    }

    renderTransactions() {
        const tbody = document.getElementById('transactions-tbody');
        tbody.innerHTML = '';

        this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(transaction.date).toLocaleDateString('de-DE')}</td>
                <td>${transaction.description}</td>
                <td>${transaction.debitAccount}</td>
                <td>${transaction.creditAccount}</td>
                <td>€${transaction.amount.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    getAccountBalance(accountName) {
        let balance = 0;
        const account = this.accounts.find(acc => acc.name === accountName);
        
        if (!account) return 0;

        this.transactions.forEach(transaction => {
            if (transaction.debitAccount === accountName) {
                if (account.type === 'Aktiva' || account.type === 'Aufwendungen') {
                    balance += transaction.amount;
                } else {
                    balance -= transaction.amount;
                }
            }
            if (transaction.creditAccount === accountName) {
                if (account.type === 'Aktiva' || account.type === 'Aufwendungen') {
                    balance -= transaction.amount;
                } else {
                    balance += transaction.amount;
                }
            }
        });

        return balance;
    }

    renderBalance() {
        const assets = document.getElementById('assets');
        const liabilities = document.getElementById('liabilities');
        const equity = document.getElementById('equity');
        const profitLoss = document.getElementById('profit-loss-content');

        assets.innerHTML = '';
        liabilities.innerHTML = '';
        equity.innerHTML = '';
        profitLoss.innerHTML = '';

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        this.accounts.forEach(account => {
            const balance = this.getAccountBalance(account.name);
            
            if (balance !== 0) {
                const item = document.createElement('div');
                item.className = 'account-item';
                item.innerHTML = `
                    <span>${account.name}</span>
                    <span class="${balance >= 0 ? 'positive' : 'negative'}">€${Math.abs(balance).toFixed(2)}</span>
                `;

                switch (account.type) {
                    case 'Aktiva':
                        assets.appendChild(item);
                        totalAssets += balance;
                        break;
                    case 'Passiva':
                        liabilities.appendChild(item);
                        totalLiabilities += balance;
                        break;
                    case 'Eigenkapital':
                        equity.appendChild(item);
                        totalEquity += balance;
                        break;
                    case 'Erlöse':
                        const revenueItem = document.createElement('div');
                        revenueItem.className = 'account-item';
                        revenueItem.innerHTML = `
                            <span>${account.name}</span>
                            <span class="positive">€${balance.toFixed(2)}</span>
                        `;
                        profitLoss.appendChild(revenueItem);
                        totalRevenue += balance;
                        break;
                    case 'Aufwendungen':
                        const expenseItem = document.createElement('div');
                        expenseItem.className = 'account-item';
                        expenseItem.innerHTML = `
                            <span>${account.name}</span>
                            <span class="negative">€${balance.toFixed(2)}</span>
                        `;
                        profitLoss.appendChild(expenseItem);
                        totalExpenses += balance;
                        break;
                }
            }
        });

        const profit = totalRevenue - totalExpenses;
        const profitItem = document.createElement('div');
        profitItem.className = 'account-item';
        profitItem.style.fontWeight = 'bold';
        profitItem.style.borderTop = '2px solid #333';
        profitItem.innerHTML = `
            <span>Gewinn/Verlust</span>
            <span class="${profit >= 0 ? 'positive' : 'negative'}">€${profit.toFixed(2)}</span>
        `;
        profitLoss.appendChild(profitItem);

        const assetTotal = document.createElement('div');
        assetTotal.className = 'account-item';
        assetTotal.style.fontWeight = 'bold';
        assetTotal.style.borderTop = '2px solid #333';
        assetTotal.innerHTML = `
            <span>Gesamt Aktiva</span>
            <span class="positive">€${totalAssets.toFixed(2)}</span>
        `;
        assets.appendChild(assetTotal);

        const liabilityTotal = document.createElement('div');
        liabilityTotal.className = 'account-item';
        liabilityTotal.style.fontWeight = 'bold';
        liabilityTotal.style.borderTop = '2px solid #333';
        liabilityTotal.innerHTML = `
            <span>Gesamt Passiva</span>
            <span class="positive">€${totalLiabilities.toFixed(2)}</span>
        `;
        liabilities.appendChild(liabilityTotal);

        const equityTotal = document.createElement('div');
        equityTotal.className = 'account-item';
        equityTotal.style.fontWeight = 'bold';
        equityTotal.style.borderTop = '2px solid #333';
        equityTotal.innerHTML = `
            <span>Gesamt Eigenkapital</span>
            <span class="positive">€${(totalEquity + profit).toFixed(2)}</span>
        `;
        equity.appendChild(equityTotal);
    }

    loadData() {
        const savedAccounts = localStorage.getItem('bookkeeping-accounts');
        const savedTransactions = localStorage.getItem('bookkeeping-transactions');
        
        if (savedAccounts) {
            this.accounts = JSON.parse(savedAccounts);
        }
        
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }

        const savedReceipts = localStorage.getItem('bookkeeping-receipts');
        if (savedReceipts) {
            this.receipts = JSON.parse(savedReceipts);
        }
    }

    saveData() {
        localStorage.setItem('bookkeeping-accounts', JSON.stringify(this.accounts));
        localStorage.setItem('bookkeeping-transactions', JSON.stringify(this.transactions));
        localStorage.setItem('bookkeeping-receipts', JSON.stringify(this.receipts));
    }

    async processReceipt() {
        const fileInput = document.getElementById('receipt-image');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('📷 Bitte wählen Sie ein Bild aus', 'error');
            return;
        }

        const previewDiv = document.getElementById('receipt-preview');
        const previewImg = document.getElementById('preview-image');
        const extractedDataDiv = document.getElementById('extracted-data');
        
        previewDiv.style.display = 'block';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            this.extractDataFromReceipt(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }

    extractDataFromReceipt(imageData, file) {
        const extractedDataDiv = document.getElementById('extracted-data');
        extractedDataDiv.innerHTML = '<div class="loading">Beleg wird verarbeitet...</div>';

        setTimeout(() => {
            const mockData = this.simulateOCR(file.name, this.currentReceiptType);
            
            let itemsHTML = '';
            if (mockData.items && mockData.items.length > 0) {
                itemsHTML = `
                    <h5>Einzelpositionen:</h5>
                    <div class="receipt-items">
                        ${mockData.items.map(item => `
                            <div class="receipt-item">
                                <span>${item.name}</span>
                                <span>€${item.price.toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="receipt-total">
                            <strong>Summe:</strong>
                            <strong>€${mockData.total}</strong>
                        </div>
                    </div>
                `;
            }
            
            extractedDataDiv.innerHTML = `
                <h4>Extrahierte Daten</h4>
                <p><strong>Typ:</strong> ${this.currentReceiptType === 'kassenbon' ? 'Kassenbon' : 'Rechnung'}</p>
                <p><strong>Datum:</strong> ${mockData.date}</p>
                <p><strong>Verkäufer:</strong> ${mockData.vendor}</p>
                <p><strong>Beschreibung:</strong> ${mockData.description}</p>
                ${itemsHTML}
                <p><strong>Gesamtbetrag:</strong> €${mockData.amount}</p>
                <p><strong>Kategorie:</strong> ${mockData.category}</p>
            `;

            document.getElementById('receipt-date').value = mockData.date;
            document.getElementById('receipt-description').value = mockData.description;
            document.getElementById('receipt-amount').value = mockData.amount;
            document.getElementById('receipt-category').value = mockData.category;
            document.getElementById('receipt-vendor').value = mockData.vendor;
            
            document.getElementById('receipt-transaction-form').style.display = 'block';
            
            this.currentReceiptData = {
                id: Date.now(),
                imageData: imageData,
                fileName: file.name,
                extractedData: mockData,
                receiptType: this.currentReceiptType,
                processed: false
            };
        }, 2000);
    }

    simulateOCR(fileName, receiptType) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        if (receiptType === 'kassenbon') {
            // Simuliere realistische Kassenbon-Daten mit Einzelpositionen
            const kassenbonExamples = [
                {
                    date: dateStr,
                    vendor: 'REWE',
                    items: [
                        { name: 'Milch 1L', price: 1.29 },
                        { name: 'Brot', price: 2.45 },
                        { name: 'Käse 200g', price: 3.49 },
                        { name: 'Tomaten 500g', price: 2.99 },
                        { name: 'Apfel 1kg', price: 2.49 },
                        { name: 'Butter', price: 2.89 },
                        { name: 'Eier 10 Stück', price: 2.29 },
                        { name: 'Joghurt 4er Pack', price: 1.99 },
                        { name: 'Wasser 6x1,5L', price: 2.49 }
                    ],
                    category: 'Essen'
                },
                {
                    date: dateStr,
                    vendor: 'DM Drogerie',
                    items: [
                        { name: 'Shampoo', price: 3.95 },
                        { name: 'Zahnpasta', price: 2.45 },
                        { name: 'Deo', price: 2.99 },
                        { name: 'Duschgel', price: 1.95 },
                        { name: 'Waschmittel', price: 7.99 }
                    ],
                    category: 'Haushalt'
                },
                {
                    date: dateStr,
                    vendor: 'ALDI',
                    items: [
                        { name: 'Hackfleisch 500g', price: 3.99 },
                        { name: 'Nudeln 500g', price: 0.89 },
                        { name: 'Passata', price: 0.79 },
                        { name: 'Parmesan', price: 2.49 },
                        { name: 'Basilikum frisch', price: 1.29 },
                        { name: 'Olivenöl', price: 4.99 },
                        { name: 'Knoblauch', price: 0.99 }
                    ],
                    category: 'Essen'
                }
            ];
            
            const selectedReceipt = kassenbonExamples[Math.floor(Math.random() * kassenbonExamples.length)];
            const totalAmount = selectedReceipt.items.reduce((sum, item) => sum + item.price, 0);
            
            return {
                date: selectedReceipt.date,
                vendor: selectedReceipt.vendor,
                description: `Einkauf bei ${selectedReceipt.vendor}`,
                amount: totalAmount.toFixed(2),
                category: selectedReceipt.category,
                items: selectedReceipt.items,
                total: totalAmount.toFixed(2)
            };
        } else {
            // Rechnungsdaten bleiben gleich
            const rechnungData = [
                { date: dateStr, vendor: 'Staples Deutschland GmbH', description: 'Büromaterial Bestellung', amount: '145.67', category: 'Büroaufwand' },
                { date: dateStr, vendor: 'Deutsche Telekom AG', description: 'Internetrechnung', amount: '59.99', category: 'Büroaufwand' },
                { date: dateStr, vendor: 'Restaurant Adler', description: 'Geschäftsessen', amount: '125.50', category: 'Bewirtung' },
                { date: dateStr, vendor: 'IKEA Deutschland GmbH', description: 'Büroausstattung', amount: '299.99', category: 'Büroaufwand' },
                { date: dateStr, vendor: 'Aral Station', description: 'Tankrechnung', amount: '78.45', category: 'Reisekosten' }
            ];
            
            return rechnungData[Math.floor(Math.random() * rechnungData.length)];
        }
    }

    createTransactionFromReceipt() {
        const date = document.getElementById('receipt-date').value;
        const description = document.getElementById('receipt-description').value;
        const amount = parseFloat(document.getElementById('receipt-amount').value);
        const category = document.getElementById('receipt-category').value;
        const vendor = document.getElementById('receipt-vendor').value;
        const notes = document.getElementById('receipt-notes').value;

        this.transactions.push({
            id: Date.now(),
            date,
            description,
            debitAccount: category,
            creditAccount: 'Bank',
            amount,
            vendor,
            notes,
            receiptType: this.currentReceiptType
        });

        this.currentReceiptData.processed = true;
        this.currentReceiptData.transactionId = this.transactions[this.transactions.length - 1].id;
        this.receipts.push(this.currentReceiptData);

        this.renderTransactions();
        this.renderBalance();
        this.renderReceipts();
        this.updateCalendarView();
        this.updateDashboard();
        this.saveData();

        document.getElementById('receipt-form').reset();
        document.getElementById('receipt-preview').style.display = 'none';
        document.getElementById('receipt-transaction-form').style.display = 'none';
        
        this.showNotification('✅ Beleg gespeichert und Transaktion erstellt!', 'success');
    }

    renderReceipts() {
        const gallery = document.getElementById('receipts-gallery');
        gallery.innerHTML = '';

        this.receipts.forEach(receipt => {
            const receiptItem = document.createElement('div');
            receiptItem.className = 'receipt-item';
            receiptItem.innerHTML = `
                <img src="${receipt.imageData}" alt="${receipt.fileName}">
                <h4>${receipt.extractedData.description}</h4>
                <p><strong>${receipt.extractedData.vendor}</strong></p>
                <p>${new Date(receipt.extractedData.date).toLocaleDateString('de-DE')}</p>
                <p class="amount">€${receipt.extractedData.amount}</p>
                <p>${receipt.extractedData.category}</p>
                <p style="font-size: 12px; color: #999;">${receipt.receiptType === 'kassenbon' ? 'Kassenbon' : 'Rechnung'}</p>
            `;
            gallery.appendChild(receiptItem);
        });
    }

    showNotification(message, type = 'info') {
        // Moderne Toast-Benachrichtigung
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Notification Styles hinzufügen falls nicht vorhanden
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    transform: translateX(400px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    max-width: 400px;
                    border-left: 4px solid var(--primary-color);
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-success {
                    border-left-color: var(--success-color);
                }
                .notification-error {
                    border-left-color: var(--danger-color);
                }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    padding: 0;
                    line-height: 1;
                }
                .notification-close:hover {
                    color: var(--text-primary);
                }
                @media (max-width: 768px) {
                    .notification {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                        transform: translateY(-100px);
                    }
                    .notification.show {
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Animation starten
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Close Button Event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove nach 4 Sekunden
        setTimeout(() => {
            if (notification.classList.contains('show')) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
        
        // Haptic Feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(type === 'success' ? [50, 50, 50] : [100]);
        }
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Update views when tabs are shown
    if (window.bookkeepingApp) {
        if (tabName === 'calendar') {
            window.bookkeepingApp.updateCalendarView();
        } else if (tabName === 'dashboard') {
            window.bookkeepingApp.updateDashboard();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.bookkeepingApp = new BookkeepingApp();
    window.app = window.bookkeepingApp; // For deleteAccount function
});

// Dashboard functions
BookkeepingApp.prototype.updateDashboard = function() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate monthly stats
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let totalBalance = 0;
    
    this.transactions.forEach(transaction => {
        const transDate = new Date(transaction.date);
        const amount = parseFloat(transaction.amount);
        
        // Calculate total balance
        const debitAccount = this.accounts.find(acc => acc.name === transaction.debitAccount);
        const creditAccount = this.accounts.find(acc => acc.name === transaction.creditAccount);
        
        if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
            if (creditAccount && creditAccount.type === 'Erlöse') {
                monthlyIncome += amount;
            }
            if (debitAccount && debitAccount.type === 'Aufwendungen') {
                monthlyExpense += amount;
            }
        }
    });
    
    // Calculate total balance from all asset accounts
    this.accounts.forEach(account => {
        if (account.type === 'Aktiva') {
            totalBalance += this.getAccountBalance(account.name);
        }
    });
    
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome * 100) : 0;
    
    // Update dashboard values
    document.getElementById('total-income').textContent = `€${monthlyIncome.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `€${monthlyExpense.toFixed(2)}`;
    document.getElementById('total-balance').textContent = `€${totalBalance.toFixed(2)}`;
    document.getElementById('savings-rate').textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;
    
    // Update recent transactions
    this.updateRecentTransactions();
    
    // Update charts
    this.updateCharts();
};

BookkeepingApp.prototype.updateRecentTransactions = function() {
    const recentList = document.getElementById('recent-transactions-list');
    recentList.innerHTML = '';
    
    const recentTransactions = this.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentTransactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'recent-transaction-item';
        
        const account = this.accounts.find(acc => acc.name === transaction.debitAccount);
        const icon = account ? account.icon : '📄';
        
        item.innerHTML = `
            <div>
                <span class="account-icon">${icon}</span>
                <strong>${transaction.description}</strong>
                <div style="font-size: 0.875rem; color: #666;">
                    ${new Date(transaction.date).toLocaleDateString('de-DE')}
                </div>
            </div>
            <div style="text-align: right;">
                <strong class="${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    €${transaction.amount.toFixed(2)}
                </strong>
                <div style="font-size: 0.875rem; color: #666;">
                    ${transaction.debitAccount}
                </div>
            </div>
        `;
        recentList.appendChild(item);
    });
};

BookkeepingApp.prototype.initCharts = function() {
    // Initialize Chart.js charts
    const expenseCtx = document.getElementById('expense-chart');
    const incomeExpenseCtx = document.getElementById('income-expense-chart');
    
    if (expenseCtx && incomeExpenseCtx) {
        this.expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        this.incomeExpenseChart = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Einnahmen',
                    data: [],
                    backgroundColor: '#10b981'
                }, {
                    label: 'Ausgaben',
                    data: [],
                    backgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
};

BookkeepingApp.prototype.updateCharts = function() {
    if (!this.expenseChart || !this.incomeExpenseChart) return;
    
    // Update expense distribution chart
    const expensesByCategory = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    this.transactions.forEach(transaction => {
        const transDate = new Date(transaction.date);
        if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
            const debitAccount = this.accounts.find(acc => acc.name === transaction.debitAccount);
            if (debitAccount && debitAccount.type === 'Aufwendungen') {
                if (!expensesByCategory[transaction.debitAccount]) {
                    expensesByCategory[transaction.debitAccount] = 0;
                }
                expensesByCategory[transaction.debitAccount] += transaction.amount;
            }
        }
    });
    
    this.expenseChart.data.labels = Object.keys(expensesByCategory);
    this.expenseChart.data.datasets[0].data = Object.values(expensesByCategory);
    this.expenseChart.update();
    
    // Update income vs expense chart (last 6 months)
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    this.transactions.forEach(transaction => {
        const transDate = new Date(transaction.date);
        const monthKey = `${transDate.getFullYear()}-${String(transDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
            const creditAccount = this.accounts.find(acc => acc.name === transaction.creditAccount);
            const debitAccount = this.accounts.find(acc => acc.name === transaction.debitAccount);
            
            if (creditAccount && creditAccount.type === 'Erlöse') {
                monthlyData[monthKey].income += transaction.amount;
            }
            if (debitAccount && debitAccount.type === 'Aufwendungen') {
                monthlyData[monthKey].expense += transaction.amount;
            }
        }
    });
    
    const labels = Object.keys(monthlyData).map(key => {
        const [year, month] = key.split('-');
        return new Date(year, month - 1).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    });
    
    this.incomeExpenseChart.data.labels = labels;
    this.incomeExpenseChart.data.datasets[0].data = Object.values(monthlyData).map(d => d.income);
    this.incomeExpenseChart.data.datasets[1].data = Object.values(monthlyData).map(d => d.expense);
    this.incomeExpenseChart.update();
};

// Add updateCalendarView method to BookkeepingApp class
BookkeepingApp.prototype.updateCalendarView = function() {
    const selectedMonth = document.getElementById('calendar-month').value;
    const selectedCategory = document.getElementById('calendar-filter').value;
    
    if (!selectedMonth) return;
    
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Filter transactions for the selected month
    const monthTransactions = this.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate &&
               (!selectedCategory || transaction.debitAccount === selectedCategory);
    });
    
    // Calculate totals
    const totalExpenses = monthTransactions.reduce((sum, transaction) => {
        const account = this.accounts.find(acc => acc.name === transaction.debitAccount);
        return account && account.type === 'Aufwendungen' ? sum + transaction.amount : sum;
    }, 0);
    
    const receiptCount = monthTransactions.length;
    
    // Update summary cards
    document.getElementById('total-expenses').textContent = `${totalExpenses.toFixed(2)} €`;
    document.getElementById('receipt-count').textContent = receiptCount;
    
    // Update transactions list
    const transactionsList = document.getElementById('calendar-transactions-list');
    transactionsList.innerHTML = '';
    
    if (monthTransactions.length === 0) {
        transactionsList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Keine Transaktionen für diesen Zeitraum</p>';
        return;
    }
    
    monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <div class="date">${new Date(transaction.date).toLocaleDateString('de-DE')}</div>
                <div class="description">${transaction.description}</div>
                ${transaction.vendor ? `<div class="vendor">${transaction.vendor}</div>` : ''}
                ${transaction.notes ? `<div class="vendor">${transaction.notes}</div>` : ''}
            </div>
            <div class="transaction-amount">€${transaction.amount.toFixed(2)}</div>
        `;
        transactionsList.appendChild(transactionItem);
    });
};

// Initialize calendar view on page load
BookkeepingApp.prototype.initCalendar = function() {
    // Set current month as default
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('calendar-month').value = currentMonth;
    
    // Update view after a short delay to ensure everything is loaded
    setTimeout(() => {
        this.updateCalendarView();
    }, 100);
};

// Add to the existing init method
BookkeepingApp.prototype.originalInit = BookkeepingApp.prototype.init;
BookkeepingApp.prototype.init = function() {
    this.originalInit();
    this.initCalendar();
};