/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */

const STORAGE_KEY = 'expense-tracker:transactions';

let transactions = [];
let searchKeyword = '';
let editingId = null;

function generateId() {
  return +new Date();
}

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

/**
 * ========================================================
 * Kriteria 1: DOM
 * ========================================================
 */
const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');

const transactionForm = document.getElementById('transactionForm');
const formCard = document.getElementById('formCard');
const formHeading = document.getElementById('form-heading');
const formError = document.getElementById('formError');
const cancelButton = document.getElementById('cancelEditButton');
const titleInput = document.getElementById('transactionFormTitleInput');
const amountInput = document.getElementById('transactionFormAmountInput');
const dateInput = document.getElementById('transactionFormDateInput');
const typeSelect = document.getElementById('transactionFormTypeSelect');
const submitButton = document.querySelector('[data-testid="transactionFormSubmitButton"]');

const searchForm = document.getElementById('searchTransactionForm');
const searchInput = document.getElementById('searchTransactionFormTitleInput');

const balanceEl = document.querySelector('.tracker-summary__balance-amount');
const incomeEl = document.querySelector('.tracker-summary__stat-amount--income');
const expenseEl = document.querySelector('.tracker-summary__stat-amount--expense');

const SUBMIT_LABEL_ADD = submitButton.textContent;
const SUBMIT_LABEL_EDIT = 'Simpan Perubahan';
const HEADING_ADD = formHeading.textContent;
const HEADING_EDIT = 'Ubah transaksi';

function formatRupiah(number) {
  const sign = number < 0 ? '-' : '';
  return sign + 'Rp ' + Math.abs(number).toLocaleString('id-ID');
}

function typeLabel(type) {
  return type === 'income' ? 'Pemasukan' : 'Pengeluaran';
}

function createButton(testId, text, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('data-testid', testId);
  button.className = 'tracker-transaction-item__btn';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function createTransactionCard(transaction) {
  const card = document.createElement('div');
  card.setAttribute('data-testid', 'transactionItem');
  card.className = 'tracker-transaction-item';

  const icon = document.createElement('div');
  icon.className = `tracker-transaction-item__icon tracker-transaction-item__icon--${transaction.type}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = transaction.type === 'income' ? '↓' : '↑';

  const detail = document.createElement('div');
  detail.className = 'tracker-transaction-item__detail';

  const title = document.createElement('h3');
  title.setAttribute('data-testid', 'transactionItemTitle');
  title.className = 'tracker-transaction-item__title';
  title.textContent = transaction.title;
  title.title = transaction.title;

  const date = document.createElement('p');
  date.setAttribute('data-testid', 'transactionItemDate');
  date.className = 'tracker-transaction-item__date';
  date.textContent = `Tanggal: ${transaction.date}`;

  const type = document.createElement('p');
  type.setAttribute('data-testid', 'transactionItemType');
  type.className = 'tracker-transaction-item__date';
  type.textContent = `Tipe: ${typeLabel(transaction.type)}`;

  detail.append(title, date, type);

  const amount = document.createElement('p');
  amount.setAttribute('data-testid', 'transactionItemAmount');
  amount.className = `tracker-transaction-item__amount tracker-transaction-item__amount--${transaction.type}`;
  amount.textContent = `Nominal: Rp${transaction.amount}`;

  const actions = document.createElement('div');
  actions.className = 'tracker-transaction-item__actions';
  actions.append(
    createButton('transactionItemEditTypeButton', 'Ubah Tipe', () => toggleType(transaction.id)),
    createButton('transactionItemEditButton', 'Edit', () => startEdit(transaction.id)),
    createButton('transactionItemDeleteButton', 'Hapus', () => deleteTransaction(transaction.id))
  );

  card.append(icon, detail, amount, actions);
  return card;
}

function createEmptyState(text) {
  const p = document.createElement('p');
  p.className = 'tracker-empty';
  p.textContent = text;
  return p;
}

function renderTransactions() {
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  const keyword = searchKeyword.trim().toLowerCase();
  const visible = transactions.filter((t) => t.title.toLowerCase().includes(keyword));

  for (const transaction of visible) {
    const card = createTransactionCard(transaction);
    (transaction.type === 'income' ? incomeList : expenseList).appendChild(card);
  }

  const searching = keyword !== '';
  if (!incomeList.children.length) {
    incomeList.appendChild(createEmptyState(searching ? 'Tidak ada pemasukan yang cocok.' : 'Belum ada pemasukan. Catat yang pertama di atas.'));
  }
  if (!expenseList.children.length) {
    expenseList.appendChild(createEmptyState(searching ? 'Tidak ada pengeluaran yang cocok.' : 'Belum ada pengeluaran. Catat yang pertama di atas.'));
  }
}

// Dasbor selalu dihitung dari seluruh transaksi (bukan hasil filter)
function updateDashboard() {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  balanceEl.textContent = formatRupiah(totalIncome - totalExpense);
  incomeEl.textContent = formatRupiah(totalIncome);
  expenseEl.textContent = formatRupiah(totalExpense);
}

/**
 * ========================================================
 * Kriteria 2: Web Storage + Custom Event
 * ========================================================
 */
function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadTransactions() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    transactions = Array.isArray(stored) ? stored : [];
  } catch (error) {
    transactions = [];
  }
}

const UPDATE_EVENT = 'transaction:updated';

document.addEventListener(UPDATE_EVENT, () => {
  renderTransactions();
  updateDashboard();
});

function commitChanges() {
  saveTransactions();
  document.dispatchEvent(new Event(UPDATE_EVENT));
}

/* ---------- Form: error inline & mode edit ---------- */
function showError(message, field) {
  formError.textContent = message;
  formError.hidden = false;
  field.classList.add('is-invalid');
  field.focus();
}

function clearError() {
  formError.hidden = true;
  formError.textContent = '';
  titleInput.classList.remove('is-invalid');
  amountInput.classList.remove('is-invalid');
}

titleInput.addEventListener('input', clearError);
amountInput.addEventListener('input', clearError);

function resetFormMode() {
  editingId = null;
  transactionForm.reset();
  dateInput.value = todayString();
  submitButton.textContent = SUBMIT_LABEL_ADD;
  formHeading.textContent = HEADING_ADD;
  formCard.classList.remove('is-editing');
  cancelButton.hidden = true;
  clearError();
}

cancelButton.addEventListener('click', resetFormMode);

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  if (editingId === id) resetFormMode();
  commitChanges();
}

function startEdit(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  clearError();
  editingId = id;
  titleInput.value = transaction.title;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  typeSelect.value = transaction.type;
  submitButton.textContent = SUBMIT_LABEL_EDIT;
  formHeading.textContent = HEADING_EDIT;
  formCard.classList.add('is-editing');
  cancelButton.hidden = false;
  formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  titleInput.focus({ preventScroll: true });
}

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value || todayString();
  const type = typeSelect.value;

  if (title === '') {
    showError('Isi keterangan transaksi dulu.', titleInput);
    return;
  }
  if (!(amount >= 1)) {
    showError('Nominal minimal Rp 1.', amountInput);
    return;
  }

  if (editingId !== null) {
    const target = transactions.find((t) => t.id === editingId);
    if (target) {
      target.title = title;
      target.amount = amount;
      target.date = date;
      target.type = type;
    }
  } else {
    transactions.push({ id: generateId(), title, amount, date, type });
  }

  resetFormMode();
  commitChanges();
});

/**
 * ========================================================
 * Kriteria 3: Ubah Tipe dan Pencarian
 * ========================================================
 */
function toggleType(id) {
  const target = transactions.find((t) => t.id === id);
  if (!target) return;
  target.type = target.type === 'income' ? 'expense' : 'income';
  commitChanges();
}

searchInput.addEventListener('input', () => {
  searchKeyword = searchInput.value;
  renderTransactions();
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  searchKeyword = searchInput.value;
  renderTransactions();
});

/**
 * ========================================================
 * Inisialisasi
 * ========================================================
 */
loadTransactions();
dateInput.value = todayString();
document.dispatchEvent(new Event(UPDATE_EVENT));
