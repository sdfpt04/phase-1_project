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

const apiKey = '673662b7bb875798f441614e';

async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`);
    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error(data['error-type']);
    }

    const rate = data.conversion_rates[toCurrency];
    if (rate) {
      return (amount * rate).toFixed(2);
    } else {
      throw new Error(`Unable to get the conversion rate for ${toCurrency}`);
    }
  } catch (error) {
    console.error(error);
    alert('Currency conversion failed: ' + error.message);
    return null; 
  }
}

document.getElementById('convert-currency').addEventListener('click', async () => {
  const toCurrency = document.getElementById('currency-selector').value;
  const currentBalanceAmount = parseFloat(domElements.currentBalance.textContent.replace(/KSH\s*/, ''));

  const convertedAmount = await convertCurrency(currentBalanceAmount, 'KES', toCurrency);
  if (convertedAmount !== null) {
    domElements.currentBalance.textContent = `${convertedAmount} ${toCurrency}`;
  }
});


function fetchTransactions() {
  const transactionsJSON = localStorage.getItem('transactions');
  return transactionsJSON ? JSON.parse(transactionsJSON) : [];
}

// Handle form submission
function handleTransactionSubmit(e) {
  e.preventDefault();

  const amount = Math.abs(parseFloat(domElements.amountInput.value)) * (domElements.transactionTypeSelect.value === 'expense' ? -1 : 1);

  if (domElements.descriptionInput.value.trim() === '' || isNaN(amount)) {
    alert('Please provide a valid description and amount for the transaction.');
    return;
  }

  const transactionData = {
    id: Date.now(),
    description: domElements.descriptionInput.value,
    amount,
    type: domElements.transactionTypeSelect.value,
  };

  const transactions = fetchTransactions();
  transactions.push(transactionData);
  localStorage.setItem('transactions', JSON.stringify(transactions));

  domElements.descriptionInput.value = '';
  domElements.amountInput.value = '';

  updateUI();
}

// Delete transaction function
function deleteTransaction(id) {
  const transactions = fetchTransactions();
  const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
  localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

  updateUI();
}

function updateTransactionsUI(transactions) {
  domElements.transactionRecord.innerHTML = '';

  transactions.forEach(transaction => {
    const sign = transaction.amount < 0 ? '-' : '+';
    const transactionElement = document.createElement('li');
    transactionElement.className = transaction.amount < 0 ? 'outgo' : 'income';
    transactionElement.innerHTML = `
      ${transaction.description} <span>${sign}KSH ${Math.abs(transaction.amount)}</span>
      <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">x</button>
    `;
    domElements.transactionRecord.appendChild(transactionElement);
  });

  updateBalanceDisplays(transactions);
}

function updateBalanceDisplays(transactions) {
  const amounts = transactions.map(transaction => transaction.amount);
  const total = amounts.reduce((acc, amount) => acc + amount, 0).toFixed(2);
  const earnings = amounts.filter(amount => amount > 0).reduce((acc, amount) => acc + amount, 0).toFixed(2);
  const expenses = amounts.filter(amount => amount < 0).reduce((acc, amount) => acc + amount, 0).toFixed(2);

  domElements.currentBalance.textContent = `KSH ${total}`;
  domElements.totalEarnings.textContent = `+ KSH ${earnings}`;
  domElements.totalExpenses.textContent = `- KSH ${Math.abs(expenses)}`;
}

async function updateUI() {
  const transactions = fetchTransactions();
  updateTransactionsUI(transactions);
}

domElements.transactionForm.addEventListener('submit', handleTransactionSubmit);
window.addEventListener('DOMContentLoaded', updateUI);
