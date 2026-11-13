const socket = io();

let items = [];
let logs = [];
let currentCurrency = 'USD';
let usdToInrRate = 84.0;

// Socket connection indicators
const statusEl = document.getElementById('connection-status');
socket.on('connect', () => {
  statusEl.textContent = 'Live Connected';
  statusEl.className = 'status-badge connected';
});
socket.on('disconnect', () => {
  statusEl.textContent = 'Disconnected';
  statusEl.className = 'status-badge disconnected';
});

// Listen for real-time inventory updates from server
socket.on('inventory-updated', (payload) => {
  if (payload.type === 'CREATED') {
    items.unshift(payload.item);
  } else if (payload.type === 'UPDATED' || payload.type === 'STOCK_ADJUSTED') {
    const idx = items.findIndex((i) => i._id === payload.item._id);
    if (idx !== -1) items[idx] = payload.item;
  } else if (payload.type === 'DELETED') {
    items = items.filter((i) => i._id !== payload.itemId);
  }

  if (payload.log) {
    logs.unshift(payload.log);
    if (logs.length > 50) logs.pop();
  }

  renderDashboard();
  renderLogs();
});

// Initialize data
async function init() {
  try {
    const [cfgRes, itemsRes, logsRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/inventory'),
      fetch('/api/logs')
    ]);
    const cfg = await cfgRes.json();
    usdToInrRate = cfg.usdToInrRate || 84.0;
    items = await itemsRes.json();
    logs = await logsRes.json();

    renderDashboard();
    renderLogs();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

function formatPrice(usdAmount) {
  if (currentCurrency === 'INR') {
    const inr = usdAmount * usdToInrRate;
    return '₹' + inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setCurrency(currency) {
  currentCurrency = currency;
  document.getElementById('btn-usd').classList.toggle('active', currency === 'USD');
  document.getElementById('btn-inr').classList.toggle('active', currency === 'INR');
  renderDashboard();
}

function renderDashboard() {
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = '';

  let totalUnits = 0;
  let totalValuationUSD = 0;
  let lowStockCount = 0;

  items.forEach((item) => {
    totalUnits += item.quantity;
    const lineValueUSD = item.quantity * item.unitPriceUSD;
    totalValuationUSD += lineValueUSD;
    const isLow = item.quantity <= item.reorderLevel;
    if (isLow) lowStockCount++;

    const tr = document.createElement('tr');
    if (isLow) tr.className = 'low-stock';

    tr.innerHTML = `
      <td><strong>${item.sku}</strong></td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>
        <div class="qty-controls">
          <button class="qty-btn" onclick="adjustStock('${item._id}', ${item.quantity - 1})">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="adjustStock('${item._id}', ${item.quantity + 1})">+</button>
        </div>
      </td>
      <td>${formatPrice(item.unitPriceUSD)}</td>
      <td>${formatPrice(lineValueUSD)}</td>
      <td><button class="del-btn" onclick="deleteItem('${item._id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('kpi-skus').textContent = items.length;
  document.getElementById('kpi-units').textContent = totalUnits.toLocaleString();
  document.getElementById('kpi-valuation').textContent = formatPrice(totalValuationUSD);
  document.getElementById('kpi-low-stock').textContent = lowStockCount;
}

function renderLogs() {
  const list = document.getElementById('activity-log-list');
  list.innerHTML = '';

  logs.forEach((log) => {
    const li = document.createElement('li');
    li.className = `log-item ${log.action}`;
    const time = new Date(log.createdAt).toLocaleTimeString();
    li.innerHTML = `
      <div><strong>[${log.action}]</strong> ${log.itemName} (${log.sku})</div>
      <div>${log.details}</div>
      <div class="log-meta">
        <span>By: ${log.performedBy}</span>
        <span>${time}</span>
      </div>
    `;
    list.appendChild(li);
  });
}

// Add Item Form Handler
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    sku: document.getElementById('sku').value.trim(),
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    quantity: Number(document.getElementById('quantity').value),
    unitPriceUSD: Number(document.getElementById('unitPriceUSD').value)
  };

  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    e.target.reset();
    document.getElementById('category').value = 'Electronics';
  } else {
    const err = await res.json();
    alert(err.message || 'Error creating item');
  }
});

async function adjustStock(id, newQty) {
  if (newQty < 0) return;
  await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: newQty })
  });
}

async function deleteItem(id) {
  await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
}

init();
