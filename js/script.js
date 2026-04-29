'use strict';
/* ════════════════════════════════════════════════════════
   ÉTAT GLOBAL
════════════════════════════════════════════════════════ */
let userData     = { name:'', phone:'' };
let budgets      = [];          // [{ id, name, type, budget, expenses:[], createdAt }]
let activeBudId  = null;
let goals        = [];          // [{ id, name, target, saved, deadline }]
let archives     = [];          // snapshots archivés
let chartMain;
let chartCompare;
let chartType    = 'bar';
let editingId    = null;
let csvParsed    = [];
let savingsTarget= null;        // id goal en cours d'édition
let deferredPWA  = null;

/* ════════════════════════════════════════════════════════
   I18N — DICTIONNAIRE BILINGUE
════════════════════════════════════════════════════════ */
let lang = localStorage.getItem('nacc_lang') || 'fr';

const T = {
  fr: {
    // Login
    appSubtitle:     'Gestionnaire de budget intelligent v3',
    labelFullname:   'Nom complet',
    labelPhone:      'Téléphone',
    placeholderName: 'Chrys ATEBA',
    placeholderPhone:'690 634 101',
    btnStart:        '<i class="fas fa-rocket"></i> Commencer',
    loginErr:        'Veuillez remplir tous les champs.',

    // Nav
    navBudget:    'Budget',
    navSavings:   'Épargne',
    navHistory:   'Historique',
    navImport:    'Import CSV',
    navLogout:    'Déconnexion',
    langSwitch:   'EN',

    // Page Budget — cards
    myBudgets:     'Mes Budgets',
    newBudget:     '<i class="fas fa-plus"></i> Nouveau budget',
    activeBudget:  'Budget actif',
    labelNewAmount:'Nouveau montant (FCFA)',
    placeholderAmt:'Ex: 500 000',
    btnSetBudget:  '<i class="fas fa-check"></i> Mettre à jour le budget',
    expense:       'Dépense',
    labelTitle:    'Désignation',
    placeholderTitle:'Ex: Loyer',
    labelCategory: 'Catégorie',
    labelAmount:   'Montant (FCFA)',
    placeholderAmtExp:'Ex: 15 000',
    btnAddExpense: '<i class="fas fa-plus"></i> Ajouter la dépense',
    btnUpdateExpense: '<i class="fas fa-save"></i> Mettre à jour',
    statBudget:    'Budget',
    statSpent:     'Dépensé',
    statBalance:   'Solde',
    consumption:   'Consommation du budget',
    expenses:      'Dépenses',
    searchPlaceholder: '🔍 Rechercher...',
    allCategories: 'Toutes catégories',
    btnPDF:        '<i class="fas fa-file-pdf"></i> PDF',
    btnExcel:      '<i class="fas fa-file-excel"></i> Excel',
    btnArchive:    '<i class="fas fa-box-archive"></i> Archiver',
    btnReset:      '<i class="fas fa-trash-alt"></i> Reset',

    // Categories
    cats: ['🏠 Logement','🍽️ Alimentation','🚗 Transport','💊 Santé','🎓 Éducation','🎉 Loisirs','👗 Habillement','📱 Télécoms','🔧 Réparations','📦 Divers'],

    // Chart tabs
    tabBar:       'Barres',
    tabPie:       'Camembert',
    tabDoughnut:  'Anneau',

    // Savings
    newGoalTitle: 'Nouvel objectif d épargne',
    labelGoalName:'Nom de l objectif',
    placeholderGoalName:'Ex: Voyage',
    labelGoalTarget:'Montant cible (FCFA)',
    placeholderGoalTarget:'Ex: 1 000 000',
    labelGoalSaved:'Montant déjà épargné (FCFA)',
    placeholderGoalSaved:'Ex: 150 000',
    labelDeadline: 'Date limite (optionnel)',
    btnAddGoal:   '<i class="fas fa-plus"></i> Créer l objectif',
    myGoals:      'Mes objectifs',
    goalEmpty:    'Aucun objectif. Créez votre premier ci-dessus.',
    btnAddSavings:'<i class="fas fa-plus"></i> Ajouter',
    btnEditGoal:  '<i class="fas fa-pen"></i>',
    btnDelGoal:   '<i class="fas fa-trash"></i>',
    goalEarned:   'Épargné',
    goalTarget:   'Objectif',
    goalDeadline: 'Échéance',
    goalComplete: '🎉 Objectif atteint !',

    // History
    archivesTitle:'Archives budgétaires',
    archivesDesc: 'Les budgets archivés sont conservés pour comparaison et référence.',
    historyEmpty: '<i class="fas fa-box-archive"></i>Aucune archive. Archivez un budget depuis l onglet Budget.',
    compareTitle: 'Comparaison',
    labelBudget:  'Budget',
    labelSpent:   'Dépensé',
    labelBalance: 'Solde',
    labelExpenses:'Dépenses',
    btnDeleteArchive: '<i class="fas fa-trash"></i>',
    btnDetailArchive: '<i class="fas fa-eye"></i> Détail',
    surplusLabel: 'Excédent',
    overspentLabel:'Dépassement',

    // Import CSV
    importTitle:  'Importer des dépenses (CSV)',
    dropZoneText: '<p>Glissez votre fichier CSV ici ou <strong style="color:var(--accent);">cliquez pour parcourir</strong></p><p style="font-size:.72rem; margin-top:8px; opacity:.6;">Format: Désignation, Montant, Catégorie (optionnel), Date (optionnel)</p>',
    csvFormatTitle:'Format CSV attendu',
    csvFormatCode: 'Désignation;Montant;Catégorie;Date<br>Loyer;85000;🏠 Logement;15/01/2025<br>Épicerie;23500;🍽️ Alimentation;<br>Transport;5000;;',
    btnConfirmImport:'<i class="fas fa-check"></i> Importer',
    btnCancelImport: 'Annuler',
    csvTemplateTitle:'Modèle CSV',
    csvTemplateDesc:'Téléchargez un fichier modèle pour saisir vos dépenses directement dans Excel ou LibreOffice.',
    btnDownloadTemplate:'<i class="fas fa-file-csv"></i> Télécharger le modèle',
    csvTableCols: ['#','Désignation','Catégorie','Date','Montant'],

    // Modals
    modalNewBudget: 'Nouveau budget',
    labelBudgetName:'Nom du budget',
    placeholderBudgetName:'Ex: Budget Janvier, Projet Mariage…',
    labelPeriod:   'Type de période',
    periods: { mensuel:'📅 Mensuel', hebdo:'📆 Hebdomadaire', projet:'📋 Par projet', annuel:'🗓️ Annuel', perso:'✏️ Personnalisé' },
    labelInitialAmt:'Montant initial (FCFA)',
    btnCreate:     '<i class="fas fa-check"></i> Créer',
    btnCancel:     'Annuler',
    btnClose:      'Fermer',
    modalSavingsTitle:'Ajouter une épargne',
    labelSavingsAmt:'Montant épargné (FCFA)',
    placeholderSavingsAmt:'Ex: 25 000',
    btnConfirmSavings:'<i class="fas fa-check"></i> Confirmer',

    // Toasts / confirms
    confirmDeleteBudget: (name) => `Supprimer le budget "${name}" et toutes ses dépenses ?`,
    confirmLogout:   'Se déconnecter ?',
    confirmReset:    'Réinitialiser les dépenses du budget actif ? (Archives conservées)',
    confirmDeleteGoal:'Supprimer cet objectif ?',
    confirmDeleteArchive:'Supprimer cette archive ?',
    toastBudgetCreated: (name) => `Budget "${name}" créé ✓`,
    toastBudgetUpdated: '✓ Budget mis à jour',
    toastExpenseAdded:  '✓ Dépense ajoutée',
    toastExpenseUpdated:'✓ Dépense modifiée',
    toastExpenseDeleted:'Dépense supprimée.',
    toastBudgetDeleted: 'Budget supprimé.',
    toastGoalAdded:     '✓ Objectif créé',
    toastGoalUpdated:   '✓ Objectif mis à jour',
    toastGoalDeleted:   'Objectif supprimé.',
    toastSavingsAdded:  (n,g) => `+${n} ajouté à "${g}" ✓`,
    toastArchived:      '✓ Budget archivé avec succès',
    toastReset:         'Dépenses réinitialisées.',
    toastPDF:           'PDF généré ✓',
    toastExcel:         'Excel généré ✓',
    toastImported:      (n,g) => `✅ ${n} dépenses importées dans "${g}" !`,
    toastImportReady:   (n) => `${n} ligne(s) parsée(s). Vérifiez et confirmez.`,
    toastTemplate:      'Modèle téléchargé ✓',
    toastNoBudget:      'Sélectionnez un budget dans l onglet Budget d abord.',
    toastBudgetNeeded:  'Donnez un nom au budget.',
    toastExpenseNeeded: 'Désignation et montant requis.',
    toastNoExport:      'Aucune dépense à exporter.',
    toastEmptyCSV:      'Fichier vide.',
    toastNoValidCSV:    'Aucune ligne valide trouvée.',
    toastFileCSV:       'Veuillez sélectionner un fichier CSV.',
    toastBudgetOverrun: (x) => `⚠️ Budget dépassé de ${x} !`,
    toastOverrun80:     '⚠️ 80% du budget consommé.',

    // Archive modal
    archiveDetailTitle:(name) => `Archive : ${name}`,
    archiveBudget:  'Budget initial',
    archiveSpent:   'Total dépensé',
    archiveBalance: 'Solde final',
    archiveDate:    'Archivé le',
    archiveType:    'Type',
    archiveNbExp:   'Nombre de dépenses',
    archiveListTitle:'Liste des dépenses',
    archiveColNum:  '#',
    archiveColTitle:'Désignation',
    archiveColCat:  'Catégorie',
    archiveColDate: 'Date',
    archiveColAmt:  'Montant',

    // Misc
    pwaInstall:    '<i class="fas fa-download"></i> Installer',
    pwaLater:      'Plus tard',
    pwaPrompt:     'Installer l application',
    pwaDesc:       'pour l utiliser hors-ligne',
    noBudgetYet:   'Aucun budget. Créez-en un ci-dessous.',
    noExpenses:    '<i class="fas fa-receipt"></i><br>Aucune dépense pour ce budget.',
    createdOn:     'Créé le',
    budgetLabel:   'Budget',
    periodLabels:  { mensuel:'Mensuel', hebdo:'Hebdo', projet:'Projet', annuel:'Annuel', perso:'Perso' },
    selectBudget:  '— Sélectionner —',
  },

  en: {
    // Login
    appSubtitle:     'Smart budget manager v3',
    labelFullname:   'Full name',
    labelPhone:      'Phone number',
    placeholderName: 'John Doe',
    placeholderPhone:'699 000 000',
    btnStart:        '<i class="fas fa-rocket"></i> Get started',
    loginErr:        'Please fill in all fields.',

    // Nav
    navBudget:    'Budget',
    navSavings:   'Savings',
    navHistory:   'History',
    navImport:    'Import CSV',
    navLogout:    'Log out',
    langSwitch:   'FR',

    // Page Budget — cards
    myBudgets:     'My Budgets',
    newBudget:     '<i class="fas fa-plus"></i> New budget',
    activeBudget:  'Active budget',
    labelNewAmount:'New amount (FCFA)',
    placeholderAmt:'e.g. 500 000',
    btnSetBudget:  '<i class="fas fa-check"></i> Update budget',
    expense:       'Expense',
    labelTitle:    'Description',
    placeholderTitle:'e.g. Rent',
    labelCategory: 'Category',
    labelAmount:   'Amount (FCFA)',
    placeholderAmtExp:'e.g. 15 000',
    btnAddExpense: '<i class="fas fa-plus"></i> Add expense',
    btnUpdateExpense: '<i class="fas fa-save"></i> Save changes',
    statBudget:    'Budget',
    statSpent:     'Spent',
    statBalance:   'Balance',
    consumption:   'Budget usage',
    expenses:      'Expenses',
    searchPlaceholder: '🔍 Search...',
    allCategories: 'All categories',
    btnPDF:        '<i class="fas fa-file-pdf"></i> PDF',
    btnExcel:      '<i class="fas fa-file-excel"></i> Excel',
    btnArchive:    '<i class="fas fa-box-archive"></i> Archive',
    btnReset:      '<i class="fas fa-trash-alt"></i> Reset',

    // Categories
    cats: ['🏠 Housing','🍽️ Food','🚗 Transport','💊 Health','🎓 Education','🎉 Leisure','👗 Clothing','📱 Telecom','🔧 Repairs','📦 Other'],

    // Chart tabs
    tabBar:       'Bars',
    tabPie:       'Pie',
    tabDoughnut:  'Doughnut',

    // Savings
    newGoalTitle: 'New savings goal',
    labelGoalName:'Goal name',
    placeholderGoalName:'e.g. Paris trip',
    labelGoalTarget:'Target amount (FCFA)',
    placeholderGoalTarget:'e.g. 1 000 000',
    labelGoalSaved:'Amount already saved (FCFA)',
    placeholderGoalSaved:'e.g. 150 000',
    labelDeadline: 'Deadline (optional)',
    btnAddGoal:   '<i class="fas fa-plus"></i> Create goal',
    myGoals:      'My goals',
    goalEmpty:    'No goal yet. Create your first one above.',
    btnAddSavings:'<i class="fas fa-plus"></i> Add',
    btnEditGoal:  '<i class="fas fa-pen"></i>',
    btnDelGoal:   '<i class="fas fa-trash"></i>',
    goalEarned:   'Saved',
    goalTarget:   'Target',
    goalDeadline: 'Deadline',
    goalComplete: '🎉 Goal reached!',

    // History
    archivesTitle:'Budget archives',
    archivesDesc: 'Archived budgets are kept for comparison and reference.',
    historyEmpty: '<i class="fas fa-box-archive"></i>No archives yet. Archive a budget from the Budget tab.',
    compareTitle: 'Comparison',
    labelBudget:  'Budget',
    labelSpent:   'Spent',
    labelBalance: 'Balance',
    labelExpenses:'Expenses',
    btnDeleteArchive: '<i class="fas fa-trash"></i>',
    btnDetailArchive: '<i class="fas fa-eye"></i> Details',
    surplusLabel: 'Surplus',
    overspentLabel:'Overspent',

    // Import CSV
    importTitle:  'Import expenses (CSV)',
    dropZoneText: '<p>Drag your CSV file here or <strong style="color:var(--accent);">click to browse</strong></p><p style="font-size:.72rem; margin-top:8px; opacity:.6;">Format: Description, Amount, Category (opt), Date (opt)</p>',
    csvFormatTitle:'Expected CSV format',
    csvFormatCode: 'Description;Amount;Category;Date<br>Rent;85000;🏠 Housing;01/15/2025<br>Groceries;23500;🍽️ Food;<br>Transport;5000;;',
    btnConfirmImport:'<i class="fas fa-check"></i> Import',
    btnCancelImport: 'Cancel',
    csvTemplateTitle:'CSV Template',
    csvTemplateDesc:'Download a template to fill in your expenses directly in Excel or LibreOffice.',
    btnDownloadTemplate:'<i class="fas fa-file-csv"></i> Download template',
    csvTableCols: ['#','Description','Category','Date','Amount'],

    // Modals
    modalNewBudget: 'New budget',
    labelBudgetName:'Budget name',
    placeholderBudgetName:'e.g. January budget, Wedding project…',
    labelPeriod:   'Period type',
    periods: { mensuel:'📅 Monthly', hebdo:'📆 Weekly', projet:'📋 By project', annuel:'🗓️ Annual', perso:'✏️ Custom' },
    labelInitialAmt:'Initial amount (FCFA)',
    btnCreate:     '<i class="fas fa-check"></i> Create',
    btnCancel:     'Cancel',
    btnClose:      'Close',
    modalSavingsTitle:'Add savings',
    labelSavingsAmt:'Amount to save (FCFA)',
    placeholderSavingsAmt:'e.g. 25 000',
    btnConfirmSavings:'<i class="fas fa-check"></i> Confirm',

    // Toasts / confirms
    confirmDeleteBudget: (name) => `Delete budget "${name}" and all its expenses?`,
    confirmLogout:   'Log out?',
    confirmReset:    'Reset expenses for the active budget? (Archives kept)',
    confirmDeleteGoal:'Delete this goal?',
    confirmDeleteArchive:'Delete this archive?',
    toastBudgetCreated: (name) => `Budget "${name}" created ✓`,
    toastBudgetUpdated: '✓ Budget updated',
    toastExpenseAdded:  '✓ Expense added',
    toastExpenseUpdated:'✓ Expense updated',
    toastExpenseDeleted:'Expense deleted.',
    toastBudgetDeleted: 'Budget deleted.',
    toastGoalAdded:     '✓ Goal created',
    toastGoalUpdated:   '✓ Goal updated',
    toastGoalDeleted:   'Goal deleted.',
    toastSavingsAdded:  (n,g) => `+${n} added to "${g}" ✓`,
    toastArchived:      '✓ Budget archived successfully',
    toastReset:         'Expenses reset.',
    toastPDF:           'PDF generated ✓',
    toastExcel:         'Excel generated ✓',
    toastImported:      (n,g) => `✅ ${n} expenses imported into "${g}"!`,
    toastImportReady:   (n) => `${n} row(s) parsed. Review and confirm.`,
    toastTemplate:      'Template downloaded ✓',
    toastNoBudget:      'Select a budget in the Budget tab first.',
    toastBudgetNeeded:  'Give your budget a name.',
    toastExpenseNeeded: 'Description and amount required.',
    toastNoExport:      'No expenses to export.',
    toastEmptyCSV:      'Empty file.',
    toastNoValidCSV:    'No valid rows found.',
    toastFileCSV:       'Please select a CSV file.',
    toastBudgetOverrun: (x) => `⚠️ Budget exceeded by ${x}!`,
    toastOverrun80:     '⚠️ 80% of budget used.',

    // Archive modal
    archiveDetailTitle:(name) => `Archive: ${name}`,
    archiveBudget:  'Initial budget',
    archiveSpent:   'Total spent',
    archiveBalance: 'Final balance',
    archiveDate:    'Archived on',
    archiveType:    'Type',
    archiveNbExp:   'Number of expenses',
    archiveListTitle:'Expense list',
    archiveColNum:  '#',
    archiveColTitle:'Description',
    archiveColCat:  'Category',
    archiveColDate: 'Date',
    archiveColAmt:  'Amount',

    // Misc
    pwaInstall:    '<i class="fas fa-download"></i> Install',
    pwaLater:      'Later',
    pwaPrompt:     'Install app',
    pwaDesc:       'to use it offline',
    noBudgetYet:   'No budget. Create one below.',
    noExpenses:    '<i class="fas fa-receipt"></i><br>No expenses for this budget.',
    createdOn:     'Created on',
    budgetLabel:   'Budget',
    periodLabels:  { mensuel:'Monthly', hebdo:'Weekly', projet:'Project', annuel:'Annual', perso:'Custom' },
    selectBudget:  '— Select —',
  }
};

function t(key, ...args) {
  const dict = T[lang];
  const val = dict[key];
  if (typeof val === 'function') return val(...args);
  return val !== undefined ? val : key;
}

function applyLang() {
  const d = T[lang];
  // html lang attr
  document.documentElement.lang = lang;

  // Login page
  document.querySelector('.login-sub').textContent          = d.appSubtitle;
  const lname = document.getElementById('login-name');
  const lphone = document.getElementById('login-phone');
  if (lname) { lname.previousElementSibling && (lname.previousElementSibling.textContent = d.labelFullname); lname.placeholder = d.placeholderName; }
  if (lphone) { lphone.previousElementSibling && (lphone.previousElementSibling.textContent = d.labelPhone); lphone.placeholder = d.placeholderPhone; }
  const startBtn = document.getElementById('start-app');
  if (startBtn) startBtn.innerHTML = d.btnStart;
  const loginErr = document.getElementById('login-err');
  if (loginErr) loginErr.textContent = d.loginErr;

  // Nav tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const navKeys = ['navBudget','navSavings','navHistory','navImport'];
  navTabs.forEach((tab,i) => { if(navKeys[i]) tab.innerHTML = `<i class="${tab.querySelector('i')?.className || 'fas fa-circle'}"></i> ${d[navKeys[i]]}`; });
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) btnLogout.title = d.navLogout;
  const langLabel = document.getElementById('lang-label');
  if (langLabel) langLabel.textContent = d.langSwitch;

  // PWA banner
  const pwaBanner = document.getElementById('pwa-banner');
  if (pwaBanner) {
    const pwaText = pwaBanner.querySelector('.pwa-text');
    if (pwaText) pwaText.innerHTML = `<strong>${d.pwaPrompt}</strong> ${d.pwaDesc}`;
    const pwaInst = document.getElementById('pwa-install');
    if (pwaInst) pwaInst.innerHTML = d.pwaInstall;
    const pwaDis = document.getElementById('pwa-dismiss');
    if (pwaDis) pwaDis.textContent = d.pwaLater;
  }

  // Page Budget
  const myBudgetsTitle = document.querySelector('#page-budget .card:first-child .card-title');
  if (myBudgetsTitle) myBudgetsTitle.innerHTML = `<i class="fas fa-layer-group"></i> ${d.myBudgets}`;
  const newBudgBtn = document.getElementById('btn-new-budget');
  if (newBudgBtn) newBudgBtn.innerHTML = d.newBudget;

  // Active budget section labels
  const abTitle = document.querySelector('#card-forms .card-title:first-child');
  if (abTitle) abTitle.innerHTML = `<i class="fas fa-wallet"></i> ${d.activeBudget}`;
  const totalAmtLabel = document.querySelector('label[for="total-amount"]') ||
    (document.getElementById('total-amount') && document.getElementById('total-amount').closest('.field')?.querySelector('label'));
  if (totalAmtLabel) totalAmtLabel.textContent = d.labelNewAmount;
  const totalAmt = document.getElementById('total-amount');
  if (totalAmt) totalAmt.placeholder = d.placeholderAmt;
  const setBudgBtn = document.getElementById('total-amount-button');
  if (setBudgBtn) setBudgBtn.innerHTML = d.btnSetBudget;

  // Expense form
  const expTitle = document.querySelectorAll('#card-forms .card-title')[1];
  if (expTitle) expTitle.innerHTML = `<i class="fas fa-minus-circle"></i> ${d.expense}`;
  applyFieldLabel('product-title', d.labelTitle, d.placeholderTitle);
  applyFieldLabel('expense-category', d.labelCategory, null);
  applyFieldLabel('user-amount', d.labelAmount, d.placeholderAmtExp);
  const addExpBtn = document.getElementById('check-amount');
  if (addExpBtn && !addExpBtn.dataset.editing) addExpBtn.innerHTML = d.btnAddExpense;

  // Update category select options
  const catSelect = document.getElementById('expense-category');
  if (catSelect) {
    const selected = catSelect.value;
    catSelect.innerHTML = d.cats.map(c => `<option value="${c}">${c}</option>`).join('');
    // try to preserve selection by index
  }
  const filterCat = document.getElementById('filter-category');
  if (filterCat) {
    const selVal = filterCat.value;
    filterCat.innerHTML = `<option value="">${d.allCategories}</option>` + d.cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }

  // Stats labels
  setStatLabel(0, d.statBudget);
  setStatLabel(1, d.statSpent);
  setStatLabel(2, d.statBalance);

  // Progress
  const progWrapLabel = document.querySelector('.prog-label span:first-child');
  if (progWrapLabel) progWrapLabel.textContent = d.consumption;

  // Expenses card title
  const expCardTitle = document.querySelector('#page-budget .card:nth-child(3) .card-title');
  if (expCardTitle) {
    const countEl = document.getElementById('expense-count');
    expCardTitle.innerHTML = `<i class="fas fa-list"></i> ${d.expenses}`;
    if (countEl) expCardTitle.appendChild(countEl);
  }

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = d.searchPlaceholder;

  // Chart tabs
  const chartTabs = document.querySelectorAll('.tab');
  if (chartTabs.length >= 3) {
    chartTabs[0].textContent = d.tabBar;
    chartTabs[1].textContent = d.tabPie;
    chartTabs[2].textContent = d.tabDoughnut;
  }

  // Export buttons
  const pdfBtn = document.getElementById('download-pdf');
  const xlsBtn = document.getElementById('download-excel');
  const arcBtn = document.getElementById('btn-archive');
  const rstBtn = document.getElementById('reset-all');
  if (pdfBtn) pdfBtn.innerHTML = d.btnPDF;
  if (xlsBtn) xlsBtn.innerHTML = d.btnExcel;
  if (arcBtn) arcBtn.innerHTML = d.btnArchive;
  if (rstBtn) rstBtn.innerHTML = d.btnReset;

  // Page Savings
  const newGoalCardTitle = document.querySelector('#page-goals .card:first-child .card-title');
  if (newGoalCardTitle) newGoalCardTitle.innerHTML = `<i class="fas fa-piggy-bank"></i> ${d.newGoalTitle}`;
  applyFieldLabel('goal-name', d.labelGoalName, d.placeholderGoalName);
  applyFieldLabel('goal-target', d.labelGoalTarget, d.placeholderGoalTarget);
  applyFieldLabel('goal-saved', d.labelGoalSaved, d.placeholderGoalSaved);
  applyFieldLabel('goal-deadline', d.labelDeadline, null);
  const addGoalBtn = document.getElementById('btn-add-goal');
  if (addGoalBtn) addGoalBtn.innerHTML = d.btnAddGoal;
  const myGoalsTitle = document.querySelector('#page-goals .card:nth-child(2) .card-title');
  if (myGoalsTitle) myGoalsTitle.innerHTML = `<i class="fas fa-trophy"></i> ${d.myGoals}`;

  // Page History
  const histTitle = document.querySelector('#page-history .card:first-child .card-title');
  if (histTitle) histTitle.innerHTML = `<i class="fas fa-clock-rotate-left"></i> ${d.archivesTitle}`;
  const histDesc = document.querySelector('#page-history .card:first-child p');
  if (histDesc) histDesc.textContent = d.archivesDesc;
  const compareTitle = document.querySelector('#compare-card .card-title');
  if (compareTitle) compareTitle.innerHTML = `<i class="fas fa-chart-bar"></i> ${d.compareTitle}`;

  // Page Import
  const importTitle = document.querySelector('#page-import .card:first-child .card-title');
  if (importTitle) importTitle.innerHTML = `<i class="fas fa-file-import"></i> ${d.importTitle}`;
  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) {
    const p = uploadZone.querySelector('p');
    const p2 = uploadZone.querySelectorAll('p')[1];
    // Just re-inject text part (not the input)
    const inp = uploadZone.querySelector('input');
    uploadZone.innerHTML = `<i class="fas fa-cloud-upload-alt"></i>${d.dropZoneText}`;
    if (inp) uploadZone.appendChild(inp);
  }
  const csvFormatTitle = document.querySelector('#page-import .card:nth-child(2) .card-title');
  if (csvFormatTitle) csvFormatTitle.innerHTML = `<i class="fas fa-info-circle"></i> ${d.csvFormatTitle}`;
  const csvFormatCode = document.querySelector('#page-import code');
  if (csvFormatCode) csvFormatCode.innerHTML = d.csvFormatCode;
  const confirmBtn = document.getElementById('btn-import-confirm');
  if (confirmBtn) confirmBtn.innerHTML = d.btnConfirmImport;
  const cancelBtn = document.getElementById('btn-import-cancel');
  if (cancelBtn) cancelBtn.textContent = d.btnCancelImport;
  const templateTitle = document.querySelector('#page-import .card:nth-child(3) .card-title');
  if (templateTitle) templateTitle.innerHTML = `<i class="fas fa-download"></i> ${d.csvTemplateTitle}`;
  const templateDesc = document.querySelector('#page-import .card:nth-child(3) p');
  if (templateDesc) templateDesc.textContent = d.csvTemplateDesc;
  const dlTmpl = document.getElementById('btn-download-template');
  if (dlTmpl) dlTmpl.innerHTML = d.btnDownloadTemplate;

  // Modal new budget
  const modalNewBudgetTitle = document.querySelector('#modal-new-budget .modal-title');
  if (modalNewBudgetTitle) modalNewBudgetTitle.innerHTML = `<i class="fas fa-plus-circle"></i> ${d.modalNewBudget}`;
  applyFieldLabel('nb-name', d.labelBudgetName, d.placeholderBudgetName);
  applyFieldLabel('nb-type', d.labelPeriod, null);
  const nbType = document.getElementById('nb-type');
  if (nbType) {
    nbType.innerHTML = Object.entries(d.periods).map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  }
  applyFieldLabel('nb-amount', d.labelInitialAmt, '0');
  const createBtn = document.getElementById('btn-create-budget');
  if (createBtn) createBtn.innerHTML = d.btnCreate;
  const cancelBtns = document.querySelectorAll('[data-close]');
  cancelBtns.forEach(b => { if (b.textContent.trim()==='Annuler'||b.textContent.trim()==='Cancel'||b.textContent.trim()==='Fermer'||b.textContent.trim()==='Close') {
    b.textContent = b.dataset.close==='modal-new-budget' ? d.btnCancel : d.btnClose;
  }});

  // Modal savings
  const savingsModalTitle = document.getElementById('savings-modal-title');
  if (savingsModalTitle) savingsModalTitle.textContent = d.modalSavingsTitle;
  applyFieldLabel('savings-add-amount', d.labelSavingsAmt, d.placeholderSavingsAmt);
  const confirmSavingsBtn = document.getElementById('btn-confirm-savings');
  if (confirmSavingsBtn) confirmSavingsBtn.innerHTML = d.btnConfirmSavings;

  // Re-render dynamic lists with new lang
  renderChips();
  if (document.getElementById('page-goals').classList.contains('active')) renderGoals();
  if (document.getElementById('page-history').classList.contains('active')) renderHistory();
}

function applyFieldLabel(inputId, labelText, placeholderText) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const label = el.closest('.field')?.querySelector('label');
  if (label && labelText) label.textContent = labelText;
  if (placeholderText) el.placeholder = placeholderText;
}

function setStatLabel(idx, text) {
  const labels = document.querySelectorAll('.stat-label');
  if (labels[idx]) labels[idx].textContent = text;
}

/* ════════════════════════════════════════════════════════
   LANG TOGGLE BUTTON
════════════════════════════════════════════════════════ */
document.getElementById('btn-lang').addEventListener('click', () => {
  lang = lang === 'fr' ? 'en' : 'fr';
  localStorage.setItem('nacc_lang', lang);
  applyLang();
  showToast(lang === 'en' ? '🇬🇧 Language: English' : '🇫🇷 Langue : Français');
});


/* ════════════════════════════════════════════════════════
   UTILITAIRES
════════════════════════════════════════════════════════ */
const fmt = n => Number(n).toLocaleString('fr-FR') + ' FCFA';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const today = () => new Date().toLocaleDateString('fr-FR');

function showToast(msg, type='success', dur=3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.className = '', dur);
}

/* ════════════════════════════════════════════════════════
   PWA — MANIFEST INLINE + SERVICE WORKER
════════════════════════════════════════════════════════ */
(function initPWA() {
  const manifest = {
    name: 'NACC Smart Budget',
    short_name: 'NACC Budget',
    start_url: './',
    display: 'standalone',
    background_color: '#080c14',
    theme_color: '#00e5ff',
    orientation: 'portrait',
    scope: './',
    icons: [
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="36" fill="%23080c14"/><text x="96" y="130" font-size="100" text-anchor="middle">💰</text></svg>', sizes:'192x192', type:'image/svg+xml' },
      { src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="%23080c14"/><text x="256" y="350" font-size="280" text-anchor="middle">💰</text></svg>', sizes:'512x512', type:'image/svg+xml' }
    ]
  };
  const blob = new Blob([JSON.stringify(manifest)], {type:'application/json'});
  document.getElementById('pwa-manifest').href = URL.createObjectURL(blob);

  // Service Worker inline
  const swCode = `
const CACHE = 'nacc-budget-v3';
const FILES = ['./', './index.html'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(()=>new Response('Hors ligne',{status:503})))));
  `;
  const swBlob = new Blob([swCode], {type:'text/javascript'});
  const swURL  = URL.createObjectURL(swBlob);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register(swURL).catch(()=>{}));
  }

  // Prompt installation
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPWA = e;
    document.getElementById('pwa-banner').classList.add('show');
  });
})();

document.getElementById('pwa-install').addEventListener('click', () => {
  if (!deferredPWA) return;
  deferredPWA.prompt();
  deferredPWA.userChoice.then(() => {
    deferredPWA = null;
    document.getElementById('pwa-banner').classList.remove('show');
  });
});
document.getElementById('pwa-dismiss').addEventListener('click', () =>
  document.getElementById('pwa-banner').classList.remove('show'));

/* ════════════════════════════════════════════════════════
   NAVIGATION PAGES
════════════════════════════════════════════════════════ */
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    document.getElementById(this.dataset.page).classList.add('active');
    if (this.dataset.page === 'page-history') renderHistory();
    if (this.dataset.page === 'page-goals')   renderGoals();
  });
});

/* ════════════════════════════════════════════════════════
   MODALS
════════════════════════════════════════════════════════ */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-close]').forEach(btn =>
  btn.addEventListener('click', () => closeModal(btn.dataset.close)));
document.querySelectorAll('.modal-overlay').forEach(m =>
  m.addEventListener('click', e => { if(e.target===m) closeModal(m.id); }));

/* ════════════════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════════════════ */
document.getElementById('start-app').addEventListener('click', () => {
  const name  = document.getElementById('login-name').value.trim();
  const phone = document.getElementById('login-phone').value.trim();
  if (!name || !phone) { document.getElementById('login-err').style.display='block'; return; }
  userData = { name, phone };
  localStorage.setItem('nacc_user', JSON.stringify(userData));
  launchApp();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  if (!confirm('Se déconnecter ?')) return;
  localStorage.removeItem('nacc_user');
  location.reload();
});

function launchApp() {
  document.getElementById('user-overlay').style.display = 'none';
  document.getElementById('main-nav').style.display = 'block';
  document.querySelectorAll('.app-page').forEach(p => { if(p.id==='page-budget') p.classList.add('active'); });
  document.getElementById('nav-username').textContent = userData.name;
  applyLang();
  setTimeout(() => new QRCode(document.getElementById('qrcode-hidden'),
    { text:'https://nkou-ateba-dev.vercel.app', width:100, height:100 }), 600);
  loadData();
}

/* ════════════════════════════════════════════════════════
   MULTI-BUDGETS
════════════════════════════════════════════════════════ */
document.getElementById('btn-new-budget').addEventListener('click', () => openModal('modal-new-budget'));

document.getElementById('btn-create-budget').addEventListener('click', () => {
  const name   = document.getElementById('nb-name').value.trim();
  const type   = document.getElementById('nb-type').value;
  const amount = parseFloat(document.getElementById('nb-amount').value) || 0;
  if (!name) { showToast('Donnez un nom au budget.','error'); return; }

  const nb = { id:uid(), name, type, budget:amount, expenses:[], createdAt: today() };
  budgets.push(nb);
  activeBudId = nb.id;
  saveData();
  renderChips();
  renderActiveBudget();
  closeModal('modal-new-budget');
  document.getElementById('nb-name').value = '';
  document.getElementById('nb-amount').value = '';
  showToast(`Budget "${name}" créé ✓`);
});

function renderChips() {
  const wrap = document.getElementById('budget-chips');
  if (budgets.length === 0) {
    wrap.innerHTML = `<div style="font-size:.82rem; color:var(--muted);">Aucun budget. Créez-en un ci-dessous.</div>`;
    return;
  }
  wrap.innerHTML = budgets.map(b => `
    <div class="budget-chip ${b.id===activeBudId?'active':''}" data-id="${b.id}">
      <span>${b.name}</span>
      <span class="chip-type">${periodLabel(b.type)}</span>
      <button class="chip-del" onclick="deleteBudget('${b.id}',event)" title="Supprimer">✕</button>
    </div>
  `).join('');
  wrap.querySelectorAll('.budget-chip').forEach(chip =>
    chip.addEventListener('click', function(e) {
      if(e.target.classList.contains('chip-del')) return;
      activeBudId = this.dataset.id;
      saveData();
      renderChips();
      renderActiveBudget();
    })
  );
}

function periodLabel(t) {
  return { mensuel:'Mensuel', hebdo:'Hebdo', projet:'Projet', annuel:'Annuel', perso:'Perso' }[t] || t;
}

function deleteBudget(id, e) {
  e.stopPropagation();
  const b = budgets.find(x=>x.id===id);
  if (!b) return;
  if (!confirm(`Supprimer le budget "${b.name}" et toutes ses dépenses ?`)) return;
  budgets = budgets.filter(x=>x.id!==id);
  if (activeBudId===id) activeBudId = budgets.length>0 ? budgets[0].id : null;
  saveData(); renderChips(); renderActiveBudget();
  showToast('Budget supprimé.','error');
}

function activeBudget() { return budgets.find(b=>b.id===activeBudId) || null; }

function renderActiveBudget() {
  const ab = activeBudget();
  const infoEl = document.getElementById('active-budget-info');
  if (ab) {
    infoEl.style.display = 'block';
    document.getElementById('active-budget-name').textContent = ab.name;
    document.getElementById('active-budget-type').innerHTML =
      `<span class="period-badge">${periodLabel(ab.type)}</span>
       <span style="font-size:.75rem; color:var(--muted); margin-left:8px;">Créé le ${ab.createdAt}</span>`;
  } else {
    infoEl.style.display = 'none';
  }
  renderList(); updateBalances(); updateChart();
  // Rebuild datalist
  const dl = document.getElementById('titles-dl');
  dl.innerHTML = '';
  if (ab) {
    [...new Set(ab.expenses.map(e=>e.title))].forEach(t => {
      const o=document.createElement('option'); o.value=t; dl.appendChild(o);
    });
  }
}

/* ════════════════════════════════════════════════════════
   BUDGET MONTANT
════════════════════════════════════════════════════════ */
document.getElementById('total-amount-button').addEventListener('click', () => {
  const ab  = activeBudget();
  if (!ab) { showToast('Créez ou sélectionnez un budget d\'abord.','error'); return; }
  const val = parseFloat(document.getElementById('total-amount').value);
  if (!val||val<=0) { showToast('Montant invalide.','error'); return; }
  ab.budget = val;
  document.getElementById('total-amount').value='';
  saveData(); updateBalances();
  showToast(`Budget fixé à ${fmt(val)}`);
});

/* ════════════════════════════════════════════════════════
   DÉPENSES
════════════════════════════════════════════════════════ */
document.getElementById('check-amount').addEventListener('click', () => {
  const ab    = activeBudget();
  if (!ab) { showToast('Sélectionnez un budget d\'abord.','error'); return; }
  const title = document.getElementById('product-title').value.trim();
  const cat   = document.getElementById('expense-category').value;
  const val   = parseFloat(document.getElementById('user-amount').value);
  if (!title||!val||val<=0) { showToast('Désignation et montant requis.','error'); return; }

  if (editingId) {
    const idx = ab.expenses.findIndex(e=>e.id===editingId);
    if (idx!==-1) ab.expenses[idx] = {...ab.expenses[idx], title, category:cat, amount:val};
    editingId = null;
    document.getElementById('check-amount').innerHTML = '<i class="fas fa-plus"></i> Ajouter la dépense';
  } else {
    ab.expenses.push({ id:uid(), title, category:cat, amount:val, date:today() });
    // Update datalist
    const dl=document.getElementById('titles-dl');
    const vals=new Set(Array.from(dl.options).map(o=>o.value));
    if (!vals.has(title)) { const o=document.createElement('option'); o.value=title; dl.appendChild(o); }
  }
  document.getElementById('product-title').value='';
  document.getElementById('user-amount').value='';
  document.getElementById('expense-category').value='📦 Divers';
  saveData(); renderList(); updateBalances(); updateChart();
  showToast('Dépense enregistrée ✓');
});

function editExpense(id) {
  const ab = activeBudget(); if (!ab) return;
  const e  = ab.expenses.find(x=>x.id===id); if (!e) return;
  document.getElementById('product-title').value = e.title;
  document.getElementById('user-amount').value   = e.amount;
  document.getElementById('expense-category').value = e.category;
  editingId = id;
  document.getElementById('check-amount').innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
  showToast('Mode édition ✏️','info');
  document.getElementById('product-title').focus();
}

function deleteExpense(id) {
  const ab = activeBudget(); if (!ab) return;
  if (!confirm('Supprimer cette dépense ?')) return;
  ab.expenses = ab.expenses.filter(e=>e.id!==id);
  if (editingId===id) {
    editingId=null;
    document.getElementById('check-amount').innerHTML='<i class="fas fa-plus"></i> Ajouter la dépense';
  }
  saveData(); renderList(); updateBalances(); updateChart();
  showToast('Supprimée.','error');
}

/* ════════════════════════════════════════════════════════
   RENDU LISTE
════════════════════════════════════════════════════════ */
function renderList() {
  const ab     = activeBudget();
  const listEl = document.getElementById('list');
  const search = document.getElementById('search-input').value.toLowerCase();
  const catF   = document.getElementById('filter-category').value;

  if (!ab || ab.expenses.length===0) {
    listEl.innerHTML=`<div class="empty-state"><i class="fas fa-receipt"></i>${
      !ab ? 'Créez un budget pour commencer.' : 'Aucune dépense. Ajoutez-en ci-dessus.'}</div>`;
    document.getElementById('expense-count').textContent = '';
    return;
  }

  const filtered = ab.expenses.filter(e=>
    e.title.toLowerCase().includes(search) && (!catF||e.category===catF)
  );

  document.getElementById('expense-count').textContent =
    `(${filtered.length}/${ab.expenses.length})`;

  if (filtered.length===0) {
    listEl.innerHTML=`<div class="empty-state"><i class="fas fa-search"></i>Aucun résultat pour ce filtre.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(e=>`
    <div class="expense-item">
      <div>
        <div class="e-name">${e.title}</div>
        <div class="e-meta">${e.category} · ${e.date||''}</div>
      </div>
      <div class="e-amount">${fmt(e.amount)}</div>
      <button class="icon-btn edit-btn" onclick="editExpense('${e.id}')" title="Modifier"><i class="fas fa-pen-to-square"></i></button>
      <button class="icon-btn del-btn"  onclick="deleteExpense('${e.id}')" title="Supprimer"><i class="fas fa-trash-can"></i></button>
    </div>
  `).join('');
}

document.getElementById('search-input').addEventListener('input', renderList);
document.getElementById('filter-category').addEventListener('change', renderList);

/* ════════════════════════════════════════════════════════
   BALANCES + PROGRESS
════════════════════════════════════════════════════════ */
function updateBalances() {
  const ab    = activeBudget();
  const total = ab ? ab.expenses.reduce((s,e)=>s+e.amount,0) : 0;
  const bud   = ab ? ab.budget : 0;
  const reste = bud - total;
  const pct   = bud>0 ? Math.min((total/bud)*100,100) : 0;

  document.getElementById('amount').textContent           = fmt(bud);
  document.getElementById('expenditure-value').textContent = fmt(total);
  document.getElementById('balance-amount').textContent   = fmt(reste);
  document.getElementById('prog-pct').textContent         = Math.round(pct)+'%';

  const fill = document.getElementById('prog-fill');
  fill.style.width = pct+'%';
  fill.className = 'prog-fill' + (pct>=100?' over':pct>=80?' warn':'');

  const balEl = document.getElementById('balance-amount');
  balEl.className = 'stat-value ' + (reste<0?'neg':pct>=80?'war':'pos');

  if (bud>0 && total>bud)
    showToast('⚠️ Budget dépassé de '+fmt(total-bud),'error',5000);
}

/* ════════════════════════════════════════════════════════
   GRAPHIQUE PRINCIPAL
════════════════════════════════════════════════════════ */
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',function(){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  this.classList.add('active');
  chartType=this.dataset.type;
  updateChart();
}));

function updateChart() {
  const ab  = activeBudget();
  const ctx = document.getElementById('expenseChart').getContext('2d');
  if (chartMain) chartMain.destroy();
  if (!ab||ab.expenses.length===0) return;

  const labels = ab.expenses.map(e=>e.title);
  const data   = ab.expenses.map(e=>e.amount);
  const colors = ab.expenses.map((_,i)=>`hsl(${(i*53)%360},68%,62%)`);
  const isBar  = chartType==='bar';

  chartMain = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets:[{
        label:'Dépenses (FCFA)', data,
        backgroundColor: isBar?'rgba(0,229,255,0.6)':colors,
        borderColor:     isBar?'rgba(0,229,255,1)':colors,
        borderWidth:1, borderRadius: isBar?6:0
      }]
    },
    options:{
      responsive:true, animation:{duration:400},
      plugins:{
        legend:{ labels:{color:'#f0f4ff',font:{family:'DM Sans'}}, display:!isBar },
        tooltip:{ callbacks:{ label:c=>' '+fmt(c.raw) } }
      },
      ...(isBar?{ scales:{
        x:{ ticks:{color:'#8899bb'}, grid:{color:'rgba(255,255,255,0.05)'} },
        y:{ ticks:{color:'#8899bb'}, grid:{color:'rgba(255,255,255,0.05)'} }
      }}:{})
    }
  });
}

/* ════════════════════════════════════════════════════════
   ARCHIVER UN BUDGET
════════════════════════════════════════════════════════ */
document.getElementById('btn-archive').addEventListener('click', () => {
  const ab = activeBudget();
  if (!ab) { showToast('Aucun budget actif.','error'); return; }
  if (ab.expenses.length===0) { showToast('Pas de dépenses à archiver.','error'); return; }
  if (!confirm(`Archiver le budget "${ab.name}" ? Il sera déplacé dans l'historique.`)) return;

  const snapshot = {
    id: uid(),
    name: ab.name,
    type: ab.type,
    budget: ab.budget,
    expenses: [...ab.expenses],
    createdAt: ab.createdAt,
    archivedAt: today(),
    total: ab.expenses.reduce((s,e)=>s+e.amount,0)
  };
  archives.unshift(snapshot);
  // Réinitialiser le budget actif (garder le montant, vider les dépenses)
  ab.expenses = [];
  saveData();
  renderList(); updateBalances(); updateChart();
  renderHistory();
  showToast(`Budget archivé ✓ Retrouvez-le dans l'Historique.`,'info',4000);
});

/* ════════════════════════════════════════════════════════
   HISTORIQUE
════════════════════════════════════════════════════════ */
function renderHistory() {
  const listEl = document.getElementById('history-list');
  if (archives.length===0) {
    listEl.innerHTML=`<div class="empty-state"><i class="fas fa-box-archive"></i>Aucune archive disponible.</div>`;
    document.getElementById('compare-card').style.display='none';
    return;
  }

  listEl.innerHTML = archives.map((a,i)=>{
    const pct = a.budget>0 ? Math.min((a.total/a.budget)*100,100):0;
    const barColor = pct>=100?'var(--danger)':pct>=80?'var(--warn)':'var(--success)';
    return `
    <div class="history-item" onclick="showArchiveDetail('${a.id}')">
      <div class="history-item-header">
        <div class="history-item-name">${a.name} <span class="period-badge" style="margin-left:6px;">${periodLabel(a.type)}</span></div>
        <div class="history-item-date">Archivé le ${a.archivedAt}</div>
      </div>
      <div class="history-item-stats">
        <div class="history-stat">Budget<span>${fmt(a.budget)}</span></div>
        <div class="history-stat">Dépensé<span>${fmt(a.total)}</span></div>
        <div class="history-stat">Solde<span style="color:${a.total>a.budget?'var(--danger)':'var(--success)'}">${fmt(a.budget-a.total)}</span></div>
      </div>
      <div class="compare-bar-wrap">
        <div class="compare-bar"><div class="compare-bar-fill" style="width:${pct}%;background:${barColor};"></div></div>
      </div>
    </div>`;
  }).join('');

  // Graphique comparaison si ≥ 2 archives
  if (archives.length>=2) renderCompareChart();
}

function showArchiveDetail(id) {
  const a = archives.find(x=>x.id===id); if (!a) return;
  document.getElementById('archive-modal-title').textContent = `📦 ${a.name}`;
  const rows = a.expenses.map((e,i)=>`
    <tr>
      <td>${i+1}</td><td>${e.title}</td><td>${e.category}</td>
      <td>${e.date||'-'}</td><td style="font-family:'Syne',sans-serif;font-weight:700;">${fmt(e.amount)}</td>
    </tr>`).join('');
  document.getElementById('archive-modal-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
      <div class="stat-card"><div class="stat-label">Budget</div><div class="stat-value" style="font-size:.9rem;">${fmt(a.budget)}</div></div>
      <div class="stat-card"><div class="stat-label">Dépensé</div><div class="stat-value war" style="font-size:.9rem;">${fmt(a.total)}</div></div>
      <div class="stat-card"><div class="stat-label">Solde</div><div class="stat-value ${a.total>a.budget?'neg':'pos'}" style="font-size:.9rem;">${fmt(a.budget-a.total)}</div></div>
    </div>
    <div style="overflow-x:auto;max-height:260px;overflow-y:auto;">
      <table class="csv-table">
        <thead><tr><th>#</th><th>Désignation</th><th>Catégorie</th><th>Date</th><th>Montant</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <button class="btn btn-danger btn-sm" style="margin-top:14px;" onclick="deleteArchive('${a.id}')">
      <i class="fas fa-trash"></i> Supprimer cette archive
    </button>
  `;
  openModal('modal-archive-detail');
}

function deleteArchive(id) {
  if (!confirm('Supprimer définitivement cette archive ?')) return;
  archives = archives.filter(a=>a.id!==id);
  saveData(); renderHistory();
  closeModal('modal-archive-detail');
  showToast('Archive supprimée.','error');
}

function renderCompareChart() {
  const card = document.getElementById('compare-card');
  card.style.display = 'block';
  const ctx = document.getElementById('compareChart').getContext('2d');
  if (chartCompare) chartCompare.destroy();

  const last = archives.slice(0, Math.min(6, archives.length)).reverse();
  chartCompare = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last.map(a=>a.name),
      datasets:[
        { label:'Budget', data:last.map(a=>a.budget), backgroundColor:'rgba(0,229,255,0.5)', borderRadius:6 },
        { label:'Dépensé', data:last.map(a=>a.total), backgroundColor:'rgba(255,71,87,0.55)', borderRadius:6 }
      ]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ labels:{color:'#f0f4ff',font:{family:'DM Sans'}}} },
      scales:{
        x:{ ticks:{color:'#8899bb'}, grid:{color:'rgba(255,255,255,0.05)'} },
        y:{ ticks:{color:'#8899bb'}, grid:{color:'rgba(255,255,255,0.05)'} }
      }
    }
  });
}

/* ════════════════════════════════════════════════════════
   OBJECTIFS D'ÉPARGNE
════════════════════════════════════════════════════════ */
document.getElementById('btn-add-goal').addEventListener('click', () => {
  const name     = document.getElementById('goal-name').value.trim();
  const target   = parseFloat(document.getElementById('goal-target').value)||0;
  const saved    = parseFloat(document.getElementById('goal-saved').value)||0;
  const deadline = document.getElementById('goal-deadline').value;
  if (!name||target<=0) { showToast('Nom et montant cible requis.','error'); return; }
  goals.push({ id:uid(), name, target, saved, deadline });
  saveData(); renderGoals();
  document.getElementById('goal-name').value='';
  document.getElementById('goal-target').value='';
  document.getElementById('goal-saved').value='';
  document.getElementById('goal-deadline').value='';
  showToast(`Objectif "${name}" créé ✓`,'info');
});

function renderGoals() {
  const listEl = document.getElementById('goals-list');
  if (goals.length===0) {
    listEl.innerHTML=`<div class="empty-state"><i class="fas fa-piggy-bank"></i>Aucun objectif. Créez-en un ci-dessus.</div>`;
    return;
  }
  listEl.innerHTML = goals.map(g=>{
    const pct     = Math.min((g.saved/g.target)*100,100);
    const reste   = g.target - g.saved;
    let deadlineStr='';
    if (g.deadline) {
      const dl = new Date(g.deadline);
      const diff= Math.ceil((dl-new Date())/(1000*60*60*24));
      deadlineStr=`<span style="font-size:.72rem;color:${diff<30?'var(--warn)':'var(--muted)'};">
        ${diff>0?`⏳ ${diff} jours restants`:'⚠️ Délai dépassé'}</span>`;
    }
    return `
    <div class="goal-card">
      <div class="goal-header">
        <div>
          <div class="goal-name">🎯 ${g.name}</div>
          <div class="goal-amounts">
            Épargné : <strong style="color:var(--gold);">${fmt(g.saved)}</strong>
            / Cible : <strong>${fmt(g.target)}</strong>
            — Reste : <strong>${fmt(Math.max(0,reste))}</strong>
          </div>
          ${deadlineStr}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <div class="goal-pct">${Math.round(pct)}%</div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-gold btn-sm" onclick="openAddSavings('${g.id}')">
              <i class="fas fa-plus"></i> Épargner
            </button>
            <button class="icon-btn del-btn" onclick="deleteGoal('${g.id}')"><i class="fas fa-trash-can"></i></button>
          </div>
        </div>
      </div>
      <div class="goal-prog-bg">
        <div class="goal-prog-fill" style="width:${pct}%;background:${pct>=100?'var(--success)':'linear-gradient(90deg,var(--gold),#ff8f00)'};"></div>
      </div>
      ${pct>=100?`<div style="font-size:.8rem;color:var(--success);margin-top:8px;text-align:center;">🎉 Objectif atteint !</div>`:''}
    </div>`;
  }).join('');
}

function openAddSavings(id) {
  savingsTarget = id;
  const g = goals.find(x=>x.id===id);
  document.getElementById('savings-modal-title').textContent = `💰 Ajouter une épargne — ${g.name}`;
  document.getElementById('savings-add-amount').value = '';
  openModal('modal-add-savings');
}

document.getElementById('btn-confirm-savings').addEventListener('click', ()=>{
  const val = parseFloat(document.getElementById('savings-add-amount').value)||0;
  if (!val||val<=0) { showToast('Montant invalide.','error'); return; }
  const g = goals.find(x=>x.id===savingsTarget);
  if (!g) return;
  g.saved += val;
  saveData(); renderGoals();
  closeModal('modal-add-savings');
  showToast(`+${fmt(val)} ajouté à "${g.name}" ✓`,'info');
  if (g.saved>=g.target) showToast(`🎉 Objectif "${g.name}" atteint !`,'success',5000);
});

function deleteGoal(id) {
  const g=goals.find(x=>x.id===id);
  if (!g||!confirm(`Supprimer l'objectif "${g.name}" ?`)) return;
  goals=goals.filter(x=>x.id!==id);
  saveData(); renderGoals();
  showToast('Objectif supprimé.','error');
}

/* ════════════════════════════════════════════════════════
   IMPORT CSV
════════════════════════════════════════════════════════ */
const uploadZone = document.getElementById('upload-zone');
const csvFileInput = document.getElementById('csv-file');

uploadZone.addEventListener('click', ()=>csvFileInput.click());
uploadZone.addEventListener('dragover', e=>{ e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', ()=>uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e=>{ e.preventDefault(); uploadZone.classList.remove('drag-over'); handleCSVFile(e.dataTransfer.files[0]); });
csvFileInput.addEventListener('change', e=>handleCSVFile(e.target.files[0]));

function handleCSVFile(file) {
  if (!file) return;
  if (!file.name.match(/\.(csv|txt)$/i)) { showToast('Fichier CSV requis.','error'); return; }
  const reader = new FileReader();
  reader.onload = ev => parseCSV(ev.target.result);
  reader.readAsText(file, 'UTF-8');
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
  if (lines.length===0) { showToast('Fichier vide.','error'); return; }

  // Détecte séparateur
  const sep = lines[0].includes(';') ? ';' : ',';
  const first = lines[0].toLowerCase();

  // Ignore ligne d'en-tête si elle contient des mots-clés
  const hasHeader = first.includes('désignation')||first.includes('designation')||first.includes('montant')||first.includes('titre');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  csvParsed = dataLines.map((l,i)=>{
    const cols = l.split(sep).map(c=>c.trim().replace(/^"|"$/g,''));
    const title    = cols[0]||`Ligne ${i+1}`;
    const amount   = parseFloat((cols[1]||'0').replace(/\s/g,'').replace(',','.'));
    const category = cols[2]||'📦 Divers';
    const date     = cols[3]||today();
    return { id:uid(), title, amount:isNaN(amount)?0:amount, category, date };
  }).filter(e=>e.amount>0);

  if (csvParsed.length===0) { showToast('Aucune ligne valide trouvée.','error'); return; }

  // Afficher prévisualisation
  document.getElementById('csv-count').textContent = `${csvParsed.length} dépense(s) prête(s) à importer`;
  const table = document.getElementById('csv-table');
  table.innerHTML = `
    <thead><tr><th>#</th><th>Désignation</th><th>Catégorie</th><th>Date</th><th>Montant</th></tr></thead>
    <tbody>
      ${csvParsed.slice(0,20).map((e,i)=>`
        <tr>
          <td>${i+1}</td><td>${e.title}</td><td>${e.category}</td>
          <td>${e.date}</td>
          <td style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent);">${fmt(e.amount)}</td>
        </tr>`).join('')}
      ${csvParsed.length>20?`<tr><td colspan="5" style="text-align:center;color:var(--muted);font-size:.78rem;">...et ${csvParsed.length-20} ligne(s) supplémentaire(s)</td></tr>`:''}
    </tbody>`;
  document.getElementById('csv-preview').style.display='block';
  showToast(`${csvParsed.length} ligne(s) parsée(s). Vérifiez et confirmez.`,'info',4000);
}

document.getElementById('btn-import-confirm').addEventListener('click', ()=>{
  const ab = activeBudget();
  if (!ab) {
    showToast('Sélectionnez un budget dans l\'onglet Budget d\'abord.','error'); return;
  }
  ab.expenses.push(...csvParsed);
  saveData();
  document.getElementById('csv-preview').style.display='none';
  document.getElementById('csv-table').innerHTML='';
  csvParsed=[];
  csvFileInput.value='';

  // Switcher vers page budget
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.app-page').forEach(p=>p.classList.remove('active'));
  document.querySelector('[data-page="page-budget"]').classList.add('active');
  document.getElementById('page-budget').classList.add('active');
  renderList(); updateBalances(); updateChart();
  showToast(`✅ ${ab.expenses.length} dépenses importées dans "${ab.name}" !`,'success',5000);
});

document.getElementById('btn-import-cancel').addEventListener('click', ()=>{
  document.getElementById('csv-preview').style.display='none';
  csvParsed=[];
});

// Télécharger modèle
document.getElementById('btn-download-template').addEventListener('click', ()=>{
  const csv = `Désignation;Montant;Catégorie;Date\nLoyer;85000;🏠 Logement;${today()}\nÉpicerie;23500;🍽️ Alimentation;${today()}\nTransport;5000;🚗 Transport;\nMédicaments;12000;💊 Santé;`;
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='modele_budget_nacc.csv'; a.click();
  showToast('Modèle téléchargé ✓');
});

/* ════════════════════════════════════════════════════════
   EXPORT PDF
════════════════════════════════════════════════════════ */
document.getElementById('download-pdf').addEventListener('click', ()=>{
  const ab = activeBudget();
  if (!ab||ab.expenses.length===0) { showToast('Aucune dépense à exporter.','error'); return; }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF();
  const now = new Date();
  const ds  = now.toLocaleDateString('fr-FR');
  const ts  = now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const total = ab.expenses.reduce((s,e)=>s+e.amount,0);

  doc.setFontSize(20); doc.setTextColor(0,229,255);
  doc.text(`Rapport Budget — ${userData.name}`, 14, 20);
  doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Budget: ${ab.name} (${periodLabel(ab.type)})  |  Généré le ${ds} à ${ts}`, 14, 28);
  doc.text(`Tél: ${userData.phone}`, 14, 34);
  doc.setDrawColor(0,229,255); doc.line(14,38,196,38);

  doc.setFontSize(11); doc.setTextColor(40);
  doc.text(`Budget initial : ${fmt(ab.budget)}`, 14, 47);
  doc.text(`Total dépenses : ${fmt(total)}`, 14, 54);
  doc.text(`Solde restant  : ${fmt(ab.budget-total)}`, 14, 61);

  doc.autoTable({
    startY:70,
    head:[['#','Désignation','Catégorie','Date','Montant (FCFA)']],
    body: ab.expenses.map((e,i)=>[i+1,e.title,e.category,e.date||'-',e.amount.toLocaleString('fr-FR')]),
    theme:'grid',
    headStyles:{fillColor:[0,50,80],textColor:[0,229,255]}
  });

  if (chartMain) {
    const img = document.getElementById('expenseChart').toDataURL('image/png');
    let y = doc.lastAutoTable.finalY+15;
    if (y>200){doc.addPage(); y=20;}
    doc.text('Graphique des dépenses :', 14, y);
    doc.addImage(img,'PNG',14,y+5,180,70);
  }

  const ph = doc.internal.pageSize.height;
  const qrC = document.querySelector('#qrcode-hidden canvas');
  if (qrC) doc.addImage(qrC.toDataURL('image/png'),'PNG',165,ph-42,30,30);
  doc.setFontSize(8); doc.setTextColor(120);
  doc.text('NKOU ATEBA Cédric Christian — nkou-ateba-dev.vercel.app',14,ph-12);
  doc.save(`Rapport_${ab.name}_${userData.name}_${ds.replace(/\//g,'-')}.pdf`);
  showToast('PDF généré ✓');
});

/* ════════════════════════════════════════════════════════
   EXPORT EXCEL
════════════════════════════════════════════════════════ */
document.getElementById('download-excel').addEventListener('click', ()=>{
  const ab = activeBudget();
  if (!ab) { showToast('Aucun budget actif.','error'); return; }
  const total = ab.expenses.reduce((s,e)=>s+e.amount,0);
  const rows=[
    [`NACC Smart Budget — ${userData.name}`],
    ['Téléphone', userData.phone],
    ['Budget', ab.name, `(${periodLabel(ab.type)})`],
    ['Montant budget', ab.budget],
    ['Total dépenses', total],
    ['Solde restant', ab.budget-total],
    [],
    ['#','Désignation','Catégorie','Date','Montant (FCFA)'],
    ...ab.expenses.map((e,i)=>[i+1,e.title,e.category,e.date||'-',e.amount])
  ];
  if (goals.length>0) {
    rows.push([],['OBJECTIFS D\'ÉPARGNE'],['Nom','Cible','Épargné','Reste','%']);
    goals.forEach(g=>rows.push([g.name,g.target,g.saved,Math.max(0,g.target-g.saved),Math.round((g.saved/g.target)*100)+'%']));
  }
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:4},{wch:30},{wch:22},{wch:12},{wch:16}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Budget');
  XLSX.writeFile(wb,`Budget_${ab.name}_${userData.name}.xlsx`);
  showToast('Excel généré ✓');
});

/* ════════════════════════════════════════════════════════
   RESET
════════════════════════════════════════════════════════ */
document.getElementById('reset-all').addEventListener('click', ()=>{
  if (!confirm('Réinitialiser les dépenses du budget actif ? (Archives conservées)')) return;
  const ab = activeBudget(); if (!ab) return;
  ab.expenses=[]; ab.budget=0;
  saveData(); renderList(); updateBalances(); if(chartMain)chartMain.destroy();
  showToast('Dépenses réinitialisées.','error');
});

/* ════════════════════════════════════════════════════════
   PERSISTANCE
════════════════════════════════════════════════════════ */
function saveData() {
  localStorage.setItem('naccV3', JSON.stringify({ budgets, activeBudId, goals, archives }));
}

function loadData() {
  try {
    const raw = localStorage.getItem('naccV3');
    if (!raw) {
      // Créer un budget par défaut
      const def = { id:uid(), name:'Budget Principal', type:'mensuel', budget:0, expenses:[], createdAt:today() };
      budgets=[def]; activeBudId=def.id;
      saveData();
    } else {
      const d = JSON.parse(raw);
      budgets    = d.budgets    || [];
      activeBudId= d.activeBudId|| (budgets[0]?.id||null);
      goals      = d.goals      || [];
      archives   = d.archives   || [];
    }
  } catch(e) {
    console.warn('Données corrompues, reset.'); budgets=[]; goals=[]; archives=[];
    const def={id:uid(),name:'Budget Principal',type:'mensuel',budget:0,expenses:[],createdAt:today()};
    budgets=[def]; activeBudId=def.id; saveData();
  }
  renderChips(); renderActiveBudget();
}

/* ════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════ */
window.addEventListener('load', ()=>{
  applyLang();
  const saved = JSON.parse(localStorage.getItem('nacc_user')||'null');
  if (saved) { userData=saved; launchApp(); }
});
