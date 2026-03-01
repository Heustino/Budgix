<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>NACC Smart Budget</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- FontAwesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

  <!-- CSS -->
  <link rel="stylesheet" href="style.css">

  <!-- jsPDF -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

</head>
<body class="dark-mode">

<button id="toggle-dark" class="toggle-btn">
  <i class="fa-solid fa-moon"></i>
</button>

<div class="wrapper">

  <div class="container total-amount-container">
    <h3>Définir le Budget</h3>
    <input type="number" id="total-amount" placeholder="Montant du budget">
    <button id="total-amount-button" class="submit">Valider Budget</button>
    <p id="budget-error" class="error hide">Montant invalide</p>
  </div>

  <div class="container user-amount-container">
    <h3>Ajouter Dépense</h3>
    <input type="text" id="product-title" placeholder="Désignation">
    <input type="number" id="user-amount" placeholder="Montant">
    <button id="check-amount" class="submit">Ajouter</button>
    <p id="product-title-error" class="error hide">Champs requis</p>
  </div>

  <div class="output-container flex-space">
    <div>
      <p>Budget</p>
      <span id="amount">0</span>
    </div>
    <div>
      <p>Dépenses</p>
      <span id="expenditure-value">0</span>
    </div>
    <div>
      <p>Solde</p>
      <span id="balance-amount">0</span>
    </div>
  </div>

  <div class="list">
    <h3>Liste des Dépenses</h3>
    <div id="list"></div>
  </div>

  <button id="download-pdf" class="submit" style="margin-top:20px;">
    Télécharger PDF
  </button>

</div>

<script src="script.js"></script>

</body>
</html>
