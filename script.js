// ===============================
// MODE SOMBRE PAR DÉFAUT
// ===============================
document.body.classList.add("dark-mode");

// ===============================
// VARIABLES PRINCIPALES
// ===============================
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

// ===============================
// DEFINIR LE BUDGET
// ===============================
totalAmountButton.addEventListener("click", () => {

  tempAmount = parseInt(totalAmount.value);

  if (!tempAmount || tempAmount < 0) {
    errorMessage.classList.remove("hide");
    return;
  }

  errorMessage.classList.add("hide");

  amount.innerText = tempAmount;

  let currentExpenditure = parseInt(expenditureValue.innerText) || 0;
  balanceValue.innerText = tempAmount - currentExpenditure;

  totalAmount.value = "";

  saveData();
});

// ===============================
// DESACTIVER BOUTONS EDIT
// ===============================
function disableButtons(bool) {
  let editButtons = document.getElementsByClassName("edit");
  Array.from(editButtons).forEach(btn => {
    btn.disabled = bool;
  });
}

// ===============================
// MODIFIER / SUPPRIMER DEPENSE
// ===============================
function modifyElement(element, edit = false) {

  let parentDiv = element.parentElement;
  let parentAmount = parseInt(parentDiv.querySelector(".amount").innerText);

  let currentExpenditure = parseInt(expenditureValue.innerText) || 0;
  let newExpenditure = currentExpenditure - parentAmount;

  expenditureValue.innerText = newExpenditure;

  let totalBudget = parseInt(amount.innerText) || 0;
  balanceValue.innerText = totalBudget - newExpenditure;

  if (edit) {
    productTitle.value = parentDiv.querySelector(".product").innerText;
    userAmount.value = parentAmount;
    disableButtons(true);
  }

  parentDiv.remove();

  updateChart();
  saveData();
}

// ===============================
// CREER LIGNE DEPENSE
// ===============================
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

// ===============================
// AJOUTER DEPENSE
// ===============================
checkAmountButton.addEventListener("click", () => {

  if (!userAmount.value || !productTitle.value) {
    productTitleError.classList.remove("hide");
    return;
  }

  productTitleError.classList.add("hide");
  disableButtons(false);

  let expenditure = parseInt(userAmount.value);

  let currentExpenditure = parseInt(expenditureValue.innerText) || 0;
  let sum = currentExpenditure + expenditure;

  expenditureValue.innerText = sum;

  let totalBudget = parseInt(amount.innerText) || 0;
  balanceValue.innerText = totalBudget - sum;

  listCreator(productTitle.value, userAmount.value);

  productTitle.value = "";
  userAmount.value = "";

  updateChart();
  saveData();
});

// ===============================
// GRAPHIQUE
// ===============================
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
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#ffffff" },
          grid: {
            color: document.body.classList.contains("dark-mode")
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.1)"
          }
        },
        y: {
          ticks: { color: "#ffffff" },
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

// ===============================
// MODE SOMBRE TOGGLE
// ===============================
document.getElementById("toggle-dark").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  updateChart();
});

// ===============================
// SAUVEGARDE LOCALE
// ===============================
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

// ===============================
// CHARGEMENT DONNEES
// ===============================
function loadData() {

  let saved = localStorage.getItem("naccBudgetData");
  if (!saved) return;

  let data = JSON.parse(saved);

  amount.innerText = data.budget;
  tempAmount = parseInt(data.budget) || 0;

  let totalExpenditure = 0;

  data.expenses.forEach(exp => {
    listCreator(exp.title, exp.amount);
    totalExpenditure += parseInt(exp.amount);
  });

  expenditureValue.innerText = totalExpenditure;
  balanceValue.innerText = tempAmount - totalExpenditure;

  updateChart();
}

window.onload = loadData;

// ===============================
// SERVICE WORKER
// ===============================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("Service Worker enregistré"))
      .catch(err => console.log("Erreur:", err));
  });
}
