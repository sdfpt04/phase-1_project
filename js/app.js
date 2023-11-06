// DOM elements
const domElements = {
  currentBalance: document.getElementById('current-balance'),
  totalEarnings: document.getElementById('total-earnings'),
  totalExpenses: document.getElementById('total-expenses'),
  transactionRecord: document.getElementById('transaction-record'),
  transactionForm: document.getElementById('transaction-form'),
  descriptionInput: document.getElementById('description'),
  amountInput: document.getElementById('amount'),
  transactionTypeSelect: document.getElementById('transaction-type')
};

// Fetching transaction records from the server
async function fetchTransactions() {
  const response = await fetch('http://localhost:3000/transactions');
  return response.json();
}

// Submit a new transaction to the server
async function handleTransactionSubmit(e) {
  e.preventDefault();

  const { transactionTypeSelect, descriptionInput, amountInput } = domElements;
  const amount = Math.abs(parseFloat(amountInput.value)) * (transactionTypeSelect.value === 'expense' ? -1 : 1);

  if (descriptionInput.value.trim() === '' || isNaN(amount)) {
    alert('Please provide a valid description and amount for the transaction.');
    return;
  }

  const transactionData = {
    id: Date.now(),
    description: descriptionInput.value,
    amount,
    type: transactionTypeSelect.value,
  };

  await fetch('http://localhost:3000/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionData)
  });

  descriptionInput.value = '';
  amountInput.value = '';

  updateUI();
}

// Remove a transaction from the server and update the UI
async function deleteTransaction(id) {
  await fetch(`http://localhost:3000/transactions/${id}`, {
    method: 'DELETE'
  });

  updateUI();
}

// Update the transactions in the DOM and recalculate balances
function updateTransactionsUI(transactions) {
  const { transactionRecord } = domElements;
  transactionRecord.innerHTML = ''; 

  transactions.forEach(transaction => {
    const sign = transaction.amount < 0 ? '-' : '+';
    const transactionElement = document.createElement('li');
    transactionElement.className = transaction.amount < 0 ? 'outgo' : 'income';
    transactionElement.innerHTML = `
      ${transaction.description} <span>${sign}$${Math.abs(transaction.amount)}</span>
      <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">x</button>
    `;
    transactionRecord.appendChild(transactionElement);
  });

  updateBalanceDisplays(transactions);
}

// Update balance, earnings, and expenses displays
function updateBalanceDisplays(transactions) {
  const { currentBalance, totalEarnings, totalExpenses } = domElements;
  const amounts = transactions.map(transaction => transaction.amount);
  const total = amounts.reduce((acc, amount) => acc + amount, 0).toFixed(2);
  const earnings = amounts.filter(amount => amount > 0).reduce((acc, amount) => acc + amount, 0).toFixed(2);
  const expenses = amounts.filter(amount => amount < 0).reduce((acc, amount) => acc + amount, 0).toFixed(2);

  currentBalance.textContent = `$${total}`;
  totalEarnings.textContent = `+ $${earnings}`;
  totalExpenses.textContent = `- $${Math.abs(expenses)}`;
}

// Refresh the UI with the latest transactions
async function updateUI() {
  const transactions = await fetchTransactions();
  updateTransactionsUI(transactions);
}

// Event listeners
domElements.transactionForm.addEventListener('submit', handleTransactionSubmit);

// Initialize the app on load
window.addEventListener('DOMContentLoaded', updateUI);


