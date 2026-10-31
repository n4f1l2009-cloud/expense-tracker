/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */

const STORAGE_KEY = 'expense-tracker:transactions';

// Array utama penyimpan semua transaksi
let transactions = [];
// Kata kunci pencarian aktif (kosong = tampilkan semua)
let searchKeyword = '';
// ID transaksi yang sedang diedit (null = mode Tambah)
let editingId = null;

// Fungsi ID unik
function generateId() {
  return +new Date();
}

/**
 * ========================================================
 * Kriteria 1: DOM
 * ========================================================
 */
const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');

const transactionForm = document.getElementById('transactionForm');
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

function formatRupiah(number) {
  return 'Rp ' + number.toLocaleString('id-ID');
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

// Membuat satu kartu transaksi dengan document.createElement()
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

  const date = document.createElement('p');
  date.setAttribute('data-testid', 'transactionItemDate');
  date.className = 'tracker-transaction-item__date';
  date.textContent = `Tanggal: ${transaction.date}`;

  const type = document.createElement('p');
  type.setAttribute('data-testid', 'transactionItemType');
  type.className = 'tracker-transaction-item__date';
  type.textContent = `Tipe: ${typeLabel(transaction.type)}`;

  detail.append(title, date, type);

  const right = document.createElement('div');
  right.className = 'tracker-transaction-item__right';

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

  right.append(amount, actions);
  card.append(icon, detail, right);
  return card;
}

function createEmptyState(text) {
  const p = document.createElement('p');
  p.className = 'tracker-transaction-item__date';
  p.textContent = text;
  return p;
}

// Render semua transaksi (sesuai filter pencarian) ke layar
function renderTransactions() {
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  const keyword = searchKeyword.trim().toLowerCase();
  const visible = transactions.filter((t) => t.title.toLowerCase().includes(keyword));

  for (const transaction of visible) {
    const card = createTransactionCard(transaction);
    if (transaction.type === 'income') {
      incomeList.appendChild(card);
    } else {
      expenseList.appendChild(card);
    }
  }

  if (!incomeList.children.length) {
    incomeList.appendChild(createEmptyState('Belum ada pemasukan.'));
  }
  if (!expenseList.children.length) {
    expenseList.appendChild(createEmptyState('Belum ada pengeluaran.'));
  }
}

// Panel Dasbor: selalu dihitung dari seluruh transaksi (bukan hasil filter)
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

// Satu-satunya jalur pembaruan tampilan: lewat Custom Event
const UPDATE_EVENT = 'transaction:updated';

document.addEventListener(UPDATE_EVENT, () => {
  renderTransactions();
  updateDashboard();
});

// Dipanggil setiap data berubah: simpan lalu kirim sinyal
function commitChanges() {
  saveTransactions();
  document.dispatchEvent(new Event(UPDATE_EVENT));
}

function resetFormMode() {
  editingId = null;
  transactionForm.reset();
  submitButton.textContent = SUBMIT_LABEL_ADD;
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  if (editingId === id) resetFormMode();
  commitChanges();
}

function startEdit(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  editingId = id;
  titleInput.value = transaction.title;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  typeSelect.value = transaction.type;
  submitButton.textContent = SUBMIT_LABEL_EDIT;
  titleInput.focus();
  transactionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const type = typeSelect.value;

  // Validasi (Skilled)
  if (title === '') {
    alert('Keterangan transaksi tidak boleh kosong!');
    return;
  }
  if (!(amount >= 1)) {
    alert('Nominal transaksi minimal Rp 1!');
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

// Pencarian langsung saat mengetik; kolom kosong otomatis menampilkan semua
searchInput.addEventListener('input', () => {
  searchKeyword = searchInput.value;
  renderTransactions();
});

// Tombol "Cari" tetap berfungsi tanpa me-reload halaman
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
document.dispatchEvent(new Event(UPDATE_EVENT));