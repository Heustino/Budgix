// ===============================
// MODE SOMBRE PAR DÉFAUT
// ===============================
document.body.classList.add("dark-mode");

/* ===============================
   VARIABLES PRINCIPALES
================================= */

let totalAmount = document.getElementById("total-amount");
let userAmount = document.getElementById("user-amount");
const checkAmountButton = document.getElementById("check-amount");
const totalAmountButton = document.getElementById("total-amount-button");
const productTitle = document.getElementById("product-title");
const errorMessage = document.getElementById("budget-error");
const productTitleError = document.getElementById("product-title-error");
const amount = document.getElementById("amount");
const expenditureValue = document.getElementById("expenditure-value");
const balanceValue = document.getElementById("balance-amount");
const list = document.getElementById("list");

let tempAmount = 0;
let chart;

/* ===============================
   DEFINIR LE BUDGET
================================= */

totalAmountButton.addEventListener("click", () => {

  tempAmount = parseInt(totalAmount.value);

  if (!tempAmount || tempAmount < 0) {
    errorMessage.classList.remove("hide");
    return;
  }

  errorMessage.classList.add("hide");

  amount.innerText = tempAmount;
  balanceValue.innerText = tempAmount - parseInt(expenditureValue.innerText);

  totalAmount.value = "";

  saveData();
});

/* ===============================
   DESACTIVER LES BOUTONS EDIT
================================= */

function disableButtons(bool) {
  let editButtons = document.getElementsByClassName("edit");
  Array.from(editButtons).forEach(btn => {
    btn.disabled = bool;
  });
}

/* ===============================
   MODIFIER OU SUPPRIMER DEPENSE
================================= */

function modifyElement(element, edit = false) {

  let parentDiv = element.parentElement;
  let parentAmount = parseInt(parentDiv.querySelector(".amount").innerText);

  if (edit) {
    productTitle.value = parentDiv.querySelector(".product").innerText;
    userAmount.value = parentAmount;
    disableButtons(true);
  }

  expenditureValue.innerText =
    parseInt(expenditureValue.innerText) || 0 - parentAmount;

  balanceValue.innerText =
    tempAmount - parseInt(expenditureValue.innerText) || 0;

  parentDiv.remove();

  updateChart();
  saveData();
}

/* ===============================
   CREER UNE LIGNE DE DEPENSE
================================= */

function listCreator(name, value) {

  let sublistContent = document.createElement("div");
  sublistContent.classList.add("sublist-content", "flex-space");

  sublistContent.innerHTML = `
    <p class="product">${name}</p>
    <p class="amount">${value}</p>
  `;

  let editBtn = document.createElement("button");
  editBtn.classList.add("fa-solid", "fa-pen-to-square", "edit");
  editBtn.onclick = () => modifyElement(editBtn, true);

  let deleteBtn = document.createElement("button");
  deleteBtn.classList.add("fa-solid", "fa-trash-can", "delete");
  deleteBtn.onclick = () => modifyElement(deleteBtn);

  sublistContent.appendChild(editBtn);
  sublistContent.appendChild(deleteBtn);

  list.appendChild(sublistContent);
}

/* ===============================
   AJOUTER UNE DEPENSE
================================= */

checkAmountButton.addEventListener("click", () => {

  if (!userAmount.value || !productTitle.value) {
    productTitleError.classList.remove("hide");
    return;
  }

  productTitleError.classList.add("hide");
  disableButtons(false);

  let expenditure = parseInt(userAmount.value);
  let sum = parseInt(expenditureValue.innerText) + expenditure;

  expenditureValue.innerText = sum;
  balanceValue.innerText = tempAmount - sum;

  listCreator(productTitle.value, userAmount.value);

  productTitle.value = "";
  userAmount.value = "";

  updateChart();
  saveData();
});

/* ===============================
   GRAPHIQUE STATISTIQUE
================================= */

function updateChart() {

  let labels = [];
  let data = [];

  document.querySelectorAll(".sublist-content").forEach(item => {
    labels.push(item.querySelector(".product").innerText);
    data.push(parseInt(item.querySelector(".amount").innerText));
  });

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
  label: "Dépenses",
  data: data,
  backgroundColor: document.body.classList.contains("dark-mode")
    ? "rgba(0, 224, 255, 0.7)"
    : "rgba(13,110,253,0.7)",
  borderRadius: 8
}]
    },
    options: {
  responsive: true,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      ticks: {
        // color: document.body.classList.contains("dark-mode")
        //   ? "#ffffff"
        //   : "#333333"
        ticks: {
  color: "#ffffff"
}
      },
      grid: {
        color: document.body.classList.contains("dark-mode")
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.1)"
      }
    },
    y: {
      ticks: {
        // color: document.body.classList.contains("dark-mode")
        //   ? "#ffffff"
        //   : "#333333"
        ticks: {
  color: "#ffffff"
}
      },
      grid: {
        color: document.body.classList.contains("dark-mode")
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.1)"
      }
    }
  }
}
  });
}

/* ===============================
   GENERATION PDF CORPORATE
================================= */

/* ===============================
   GENERATION PDF CORPORATE PRO
================================= */

document.getElementById("download-pdf").addEventListener("click", () => {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const referenceNumber = "REF-" + Date.now();
  const today = new Date().toLocaleString();

  const primaryColor = [13, 110, 253];
  const accentColor = [111, 66, 193];

  /* ===============================
     HEADER CORPORATE
  ================================= */

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("RAPPORT FINANCIER NACC", 20, 18);

  doc.setFontSize(10);
  doc.text("Date : " + today, 140, 15);
  doc.text("Référence : " + referenceNumber, 140, 22);

  /* ===============================
     QR CODE EN HAUT À DROITE
  ================================= */

  let qrContainer = document.createElement("div");

  new QRCode(qrContainer, {
    text: `Ref:${referenceNumber}\nBudget:${amount.innerText}\nSolde:${balanceValue.innerText}`,
    width: 100,
    height: 100
  });

  setTimeout(() => {

    let qrCanvas = qrContainer.querySelector("canvas");
    let qrImage = qrCanvas.toDataURL("image/png");

    // Position propre en haut à droite
    doc.addImage(qrImage, "PNG", 160, 35, 35, 35);

    /* ===============================
       INFOS BUDGET
    ================================= */

    doc.setTextColor(0);
    doc.setFontSize(12);

    doc.text("Budget : " + amount.innerText, 20, 45);
    doc.text("Dépenses : " + expenditureValue.innerText, 20, 55);
    doc.text("Solde : " + balanceValue.innerText, 20, 65);

    /* ===============================
       TABLEAU PROFESSIONNEL
    ================================= */

    let tableData = [];

    document.querySelectorAll(".sublist-content").forEach((item, index) => {
      tableData.push([
        index + 1,
        item.querySelector(".product").innerText,
        item.querySelector(".amount").innerText
      ]);
    });

    doc.autoTable({
      startY: 85, // 👈 IMPORTANT : évite chevauchement QR
      head: [["#", "Désignation", "Montant"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: accentColor,
        textColor: 255
      }
    });

    /* ===============================
       GRAPHIQUE DANS LE PDF
    ================================= */

    let chartCanvas = document.getElementById("expenseChart");
    let chartImage = chartCanvas.toDataURL("image/png", 1.0);

    let finalY = doc.lastAutoTable.finalY + 10;

// Si on dépasse la page → nouvelle page
if (finalY + 80 > 280) {
  doc.addPage();
  finalY = 20;
}

doc.addImage(chartImage, "PNG", 20, finalY, 170, 70);

    /* ===============================
       SAUVEGARDE
    ================================= */

    doc.save("rapport_budget_nacc.pdf");

  }, 400); // délai nécessaire pour QR

});

/* ===============================
   EXPORT EXCEL
================================= */

document.getElementById("download-excel").addEventListener("click", () => {

  let data = [
    ["Référence", "REF-" + Date.now()],
    ["Budget", amount.innerText],
    ["Total Dépenses", expenditureValue.innerText],
    ["Solde", balanceValue.innerText],
    [],
    ["#", "Désignation", "Montant"]
  ];

  let index = 1;

  document.querySelectorAll(".sublist-content").forEach(item => {
    data.push([
      index++,
      item.querySelector(".product").innerText,
      item.querySelector(".amount").innerText
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Budget");

  XLSX.writeFile(wb, "rapport_budget_nacc.xlsx");
});

/* ===============================
   MODE SOMBRE
================================= */

document.getElementById("toggle-dark").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

/* ===============================
   SAUVEGARDE LOCALE
================================= */

function saveData() {

  let data = {
    budget: amount.innerText,
    expenses: []
  };

  document.querySelectorAll(".sublist-content").forEach(item => {
    data.expenses.push({
      title: item.querySelector(".product").innerText,
      amount: item.querySelector(".amount").innerText
    });
  });

  localStorage.setItem("naccBudgetData", JSON.stringify(data));
}

function loadData() {

  let saved = localStorage.getItem("naccBudgetData");
  if (!saved) return;

  let data = JSON.parse(saved);

  amount.innerText = data.budget;
  tempAmount = parseInt(data.budget);

  data.expenses.forEach(exp => {
    listCreator(exp.title, exp.amount);
    expenditureValue.innerText =
      parseInt(expenditureValue.innerText) || 0 + parseInt(exp.amount);
  });

  balanceValue.innerText =
    tempAmount - parseInt(expenditureValue.innerText) || 0;

  updateChart();
}

window.onload = loadData;

/* ===============================
   SERVICE WORKER (PWA)
================================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch(err => console.log("Erreur:", err));
  });
}