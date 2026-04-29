// ════════════════════════════════════════════
//  ÉTAT GLOBAL
// ════════════════════════════════════════════
let userData = { name: "", phone: "" };
let expenses  = [];     // [{ id, title, amount, category, date }]
let budget    = 0;
let chart;
let chartType = "bar";
let editingId = null;

// ════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════
function fmt(n) {
    return Number(n).toLocaleString("fr-FR") + " FCFA";
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function showToast(msg, type = "success") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "show " + type;
    setTimeout(() => { t.className = ""; }, 3000);
}

// ════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════
document.getElementById("start-app").addEventListener("click", () => {
    const name  = document.getElementById("user-fullname").value.trim();
    const phone = document.getElementById("user-phone").value.trim();
    const err   = document.getElementById("login-error");

    if (!name || !phone) { err.style.display = "block"; return; }
    err.style.display = "none";

    userData = { name, phone };
    localStorage.setItem("nacc_user", JSON.stringify(userData));
    launchApp();
});

function launchApp() {
    document.getElementById("user-overlay").style.display = "none";
    document.getElementById("main-app").style.display = "block";
    document.getElementById("welcome-msg").textContent = `Bonjour, ${userData.name} 👋`;
    // QR Code
    setTimeout(() => {
        new QRCode(document.getElementById("qrcode-hidden"), {
            text: "https://nkou-ateba-dev.vercel.app",
            width: 100, height: 100
        });
    }, 500);
}

// ════════════════════════════════════════════
//  LOGOUT
// ════════════════════════════════════════════
document.getElementById("btn-logout").addEventListener("click", () => {
    if (!confirm("Se déconnecter ? Vos données sont sauvegardées.")) return;
    localStorage.removeItem("nacc_user");
    location.reload();
});

// ════════════════════════════════════════════
//  BUDGET
// ════════════════════════════════════════════
document.getElementById("total-amount-button").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("total-amount").value);
    if (!val || val <= 0) { showToast("Entrez un budget valide.", "error"); return; }
    budget = val;
    document.getElementById("total-amount").value = "";
    updateBalances();
    saveData();
    showToast("Budget fixé à " + fmt(budget));
});

// ════════════════════════════════════════════
//  AJOUTER / MODIFIER DÉPENSE
// ════════════════════════════════════════════
document.getElementById("check-amount").addEventListener("click", () => {
    const title = document.getElementById("product-title").value.trim();
    const cat   = document.getElementById("expense-category").value;
    const val   = parseFloat(document.getElementById("user-amount").value);

    if (!title || !val || val <= 0) { showToast("Désignation et montant requis.", "error"); return; }

    if (editingId) {
        // Mise à jour
        const idx = expenses.findIndex(e => e.id === editingId);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], title, category: cat, amount: val };
        }
        editingId = null;
        document.getElementById("check-amount").innerHTML = '<i class="fas fa-plus"></i> Ajouter la dépense';
    } else {
        // Nouveau
        expenses.push({
            id: uid(), title, category: cat,
            amount: val,
            date: new Date().toLocaleDateString("fr-FR")
        });
        // Datalist autocomplétion
        updateDatalist();
    }

    document.getElementById("product-title").value = "";
    document.getElementById("user-amount").value = "";
    document.getElementById("expense-category").value = "📦 Divers";

    renderList();
    updateBalances();
    updateChart();
    saveData();
    showToast("Dépense enregistrée ✓");
});

// ════════════════════════════════════════════
//  RENDU LISTE
// ════════════════════════════════════════════
function renderList() {
    const listEl  = document.getElementById("list");
    const search  = document.getElementById("search-input").value.toLowerCase();
    const catFilt = document.getElementById("filter-category").value;

    const filtered = expenses.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search);
        const matchCat    = !catFilt || e.category === catFilt;
        return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i>${
            expenses.length === 0
                ? "Aucune dépense enregistrée.<br>Commencez à saisir vos dépenses ci-dessus."
                : "Aucun résultat pour ce filtre."
        }</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(e => `
        <div class="expense-item" data-id="${e.id}">
            <div>
                <div class="e-name">${e.title}</div>
                <div class="e-cat">${e.category} · ${e.date || ""}</div>
            </div>
            <div class="e-amount">${fmt(e.amount)}</div>
            <button class="icon-btn edit-btn" onclick="editExpense('${e.id}')" title="Modifier">
                <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="icon-btn del-btn" onclick="deleteExpense('${e.id}')" title="Supprimer">
                <i class="fas fa-trash-can"></i>
            </button>
        </div>
    `).join("");
}

// ════════════════════════════════════════════
//  EDIT / DELETE
// ════════════════════════════════════════════
function editExpense(id) {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    document.getElementById("product-title").value = e.title;
    document.getElementById("user-amount").value   = e.amount;
    document.getElementById("expense-category").value = e.category;
    editingId = id;
    document.getElementById("check-amount").innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
    document.getElementById("product-title").focus();
    showToast("Mode édition activé ✏️");
}

function deleteExpense(id) {
    if (!confirm("Supprimer cette dépense ?")) return;
    expenses = expenses.filter(e => e.id !== id);
    if (editingId === id) {
        editingId = null;
        document.getElementById("check-amount").innerHTML = '<i class="fas fa-plus"></i> Ajouter la dépense';
    }
    renderList();
    updateBalances();
    updateChart();
    saveData();
    showToast("Dépense supprimée.", "error");
}

// ════════════════════════════════════════════
//  BALANCES + PROGRESS
// ════════════════════════════════════════════
function updateBalances() {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const reste = budget - total;
    const pct   = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;

    document.getElementById("amount").textContent           = fmt(budget);
    document.getElementById("expenditure-value").textContent = fmt(total);
    document.getElementById("balance-amount").textContent   = fmt(reste);
    document.getElementById("progress-pct").textContent     = Math.round(pct) + "%";

    const fill = document.getElementById("progress-fill");
    fill.style.width = pct + "%";
    fill.className = "progress-bar-fill" + (pct >= 100 ? " over" : pct >= 80 ? " warn" : "");

    const balEl = document.getElementById("balance-amount");
    balEl.className = "stat-value " + (reste >= 0 ? (pct < 80 ? "positive" : "warning") : "negative");

    // Alerte dépassement
    if (budget > 0 && total > budget) {
        showToast("⚠️ Budget dépassé de " + fmt(total - budget), "error");
    }
}

// ════════════════════════════════════════════
//  GRAPHIQUE
// ════════════════════════════════════════════
function updateChart() {
    const ctx    = document.getElementById("expenseChart").getContext("2d");
    const labels = expenses.map(e => e.title);
    const data   = expenses.map(e => e.amount);
    const colors = expenses.map((_, i) => `hsl(${(i * 47) % 360}, 70%, 60%)`);

    if (chart) chart.destroy();

    if (expenses.length === 0) return;

    const isBar = chartType === "bar";
    chart = new Chart(ctx, {
        type: chartType,
        data: {
            labels,
            datasets: [{
                label: "Dépenses (FCFA)",
                data,
                backgroundColor: isBar ? "rgba(0,229,255,0.65)" : colors,
                borderColor:     isBar ? "rgba(0,229,255,1)"    : colors,
                borderWidth: 1,
                borderRadius: isBar ? 6 : 0
            }]
        },
        options: {
            responsive: true, animation: { duration: 400 },
            plugins: {
                legend: { labels: { color: "#f0f4ff", font: { family: "DM Sans" } }, display: !isBar },
                tooltip: { callbacks: { label: ctx => " " + fmt(ctx.raw) } }
            },
            ...(isBar ? {
                scales: {
                    x: { ticks: { color: "#8899bb" }, grid: { color: "rgba(255,255,255,0.06)" } },
                    y: { ticks: { color: "#8899bb" }, grid: { color: "rgba(255,255,255,0.06)" } }
                }
            } : {})
        }
    });
}

// Tabs
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function() {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        chartType = this.dataset.type;
        updateChart();
    });
});

// ════════════════════════════════════════════
//  FILTRES
// ════════════════════════════════════════════
document.getElementById("search-input").addEventListener("input", renderList);
document.getElementById("filter-category").addEventListener("change", renderList);

// ════════════════════════════════════════════
//  AUTOCOMPLETE DATALIST
// ════════════════════════════════════════════
function updateDatalist() {
    const dl    = document.getElementById("titles-history");
    const exist = new Set(Array.from(dl.options).map(o => o.value));
    const last  = expenses[expenses.length - 1];
    if (last && !exist.has(last.title)) {
        const opt = document.createElement("option");
        opt.value = last.title;
        dl.appendChild(opt);
    }
}

// ════════════════════════════════════════════
//  PDF
// ════════════════════════════════════════════
document.getElementById("download-pdf").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR");
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    doc.setFontSize(20); doc.setTextColor(0, 229, 255);
    doc.text(`Rapport Budget — ${userData.name}`, 14, 20);
    doc.setFontSize(9); doc.setTextColor(130);
    doc.text(`Généré le ${dateStr} à ${timeStr}  |  Tél: ${userData.phone}`, 14, 28);
    doc.setDrawColor(0, 229, 255); doc.line(14, 32, 196, 32);

    doc.setFontSize(11); doc.setTextColor(40);
    doc.text(`Budget initial : ${fmt(budget)}`, 14, 42);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    doc.text(`Total dépenses : ${fmt(total)}`, 14, 49);
    doc.text(`Solde restant  : ${fmt(budget - total)}`, 14, 56);

    const rows = expenses.map((e, i) => [i + 1, e.title, e.category, e.date || "-", e.amount.toLocaleString("fr-FR")]);
    doc.autoTable({
        startY: 65,
        head: [["#", "Désignation", "Catégorie", "Date", "Montant (FCFA)"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [0, 50, 80], textColor: [0, 229, 255] }
    });

    if (expenses.length > 0) {
        const chartImg = document.getElementById("expenseChart").toDataURL("image/png");
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > 200) { doc.addPage(); finalY = 20; }
        doc.text("Graphique des dépenses :", 14, finalY);
        doc.addImage(chartImg, "PNG", 14, finalY + 5, 180, 70);
    }

    const ph = doc.internal.pageSize.height;
    const qrC = document.querySelector("#qrcode-hidden canvas");
    if (qrC) doc.addImage(qrC.toDataURL("image/png"), "PNG", 165, ph - 42, 30, 30);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text("Réalisé par NKOU ATEBA Cédric Christian — nkou-ateba-dev.vercel.app", 14, ph - 12);

    doc.save(`Rapport_Budget_${userData.name}_${dateStr.replace(/\//g,"-")}.pdf`);
    showToast("PDF généré ✓");
});

// ════════════════════════════════════════════
//  EXCEL
// ════════════════════════════════════════════
document.getElementById("download-excel").addEventListener("click", () => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const rows = [
        ["NACC Smart Budget — " + userData.name],
        ["Téléphone", userData.phone],
        ["Budget initial", budget],
        ["Total dépenses", total],
        ["Solde restant", budget - total],
        [],
        ["#", "Désignation", "Catégorie", "Date", "Montant (FCFA)"],
        ...expenses.map((e, i) => [i + 1, e.title, e.category, e.date || "-", e.amount])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budget");
    XLSX.writeFile(wb, `Budget_${userData.name}.xlsx`);
    showToast("Fichier Excel généré ✓");
});

// ════════════════════════════════════════════
//  RESET
// ════════════════════════════════════════════
document.getElementById("reset-all").addEventListener("click", () => {
    if (!confirm("Réinitialiser TOUTES les données ? Cette action est irréversible.")) return;
    localStorage.removeItem("naccData");
    expenses = []; budget = 0;
    renderList(); updateBalances(); if (chart) chart.destroy();
    showToast("Données réinitialisées.", "error");
});

// ════════════════════════════════════════════
//  SAUVEGARDE / CHARGEMENT
// ════════════════════════════════════════════
function saveData() {
    localStorage.setItem("naccData", JSON.stringify({ budget, expenses }));
}

function loadData() {
    const raw = localStorage.getItem("naccData");
    if (!raw) return;
    try {
        const d = JSON.parse(raw);
        budget   = d.budget   || 0;
        expenses = d.expenses || [];
        renderList(); updateBalances(); updateChart();
        // Rebuild datalist
        const dl = document.getElementById("titles-history");
        [...new Set(expenses.map(e => e.title))].forEach(t => {
            const opt = document.createElement("option"); opt.value = t; dl.appendChild(opt);
        });
    } catch(e) { console.warn("Données corrompues, reset."); }
}

// ════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════
window.onload = () => {
    const savedUser = JSON.parse(localStorage.getItem("nacc_user") || "null");
    if (savedUser) {
        userData = savedUser;
        launchApp();
    }
    loadData();
};