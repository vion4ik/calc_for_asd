// ========== НАСТРОЙКИ ==========
const USD_RATE = 85;

// Наценка по региону
const regionMarkup = {
  RU: 0,
  EU: 15
};

// ========== ТАБЛИЦЫ ЦЕН (за 25 ELO) ==========
const soloPrices = [
  { min: 900,  max: 1050, pricePerElo: 125 / 25 },
  { min: 1050, max: 1200, pricePerElo: 125 / 25 },
  { min: 1200, max: 1350, pricePerElo: 150 / 25 },
  { min: 1350, max: 1530, pricePerElo: 175 / 25 },
  { min: 1530, max: 1750, pricePerElo: 200 / 25 },
  { min: 1750, max: 2000, pricePerElo: 250 / 25 },
  { min: 2000, max: 2100, pricePerElo: 300 / 25 },
  { min: 2100, max: 2200, pricePerElo: 325 / 25 },
  { min: 2200, max: 2300, pricePerElo: 350 / 25 },
  { min: 2300, max: 2400, pricePerElo: 375 / 25 },
  { min: 2400, max: 2500, pricePerElo: 400 / 25 },
  { min: 2500, max: 2600, pricePerElo: 450 / 25 },
  { min: 2600, max: 2700, pricePerElo: 550 / 25 },
  { min: 2700, max: 2800, pricePerElo: 700 / 25 },
  { min: 2800, max: 2900, pricePerElo: 850 / 25 },
  { min: 2900, max: 3000, pricePerElo: 1000 / 25 }
];

const partyPrices = [
  { min: 900,  max: 1050, pricePerElo: 200 / 25 },
  { min: 1050, max: 1200, pricePerElo: 200 / 25 },
  { min: 1200, max: 1350, pricePerElo: 250 / 25 },
  { min: 1350, max: 1530, pricePerElo: 300 / 25 },
  { min: 1530, max: 1750, pricePerElo: 350 / 25 },
  { min: 1750, max: 2000, pricePerElo: 400 / 25 },
  { min: 2000, max: 2100, pricePerElo: 500 / 25 },
  { min: 2100, max: 2200, pricePerElo: 600 / 25 },
  { min: 2200, max: 2300, pricePerElo: 700 / 25 },
  { min: 2300, max: 2400, pricePerElo: 800 / 25 },
  { min: 2400, max: 2500, pricePerElo: 900 / 25 },
  { min: 2500, max: 2600, pricePerElo: 1000 / 25 },
  { min: 2600, max: 2700, pricePerElo: 1200 / 25 },
  { min: 2700, max: 2800, pricePerElo: 1500 / 25 },
  { min: 2800, max: 2900, pricePerElo: 1800 / 25 },
  { min: 2900, max: 3000, pricePerElo: 2000 / 25 }
];

// ========== СОСТОЯНИЕ ==========
let currentCurrency = 'RUB';
let currentRegion = 'RU';

// ========== РАСЧЁТ ==========
function calculateBoostByElo(currentElo, desiredElo, priceTable, markup) {
  if (currentElo >= desiredElo) return { error: '❌ Конечный ELO должен быть больше начального' };
  if (currentElo < 0 || desiredElo < 0) return { error: '❌ ELO не может быть отрицательным' };
  if (desiredElo > 3000) return { error: '❌ Максимальный ELO — 3000' };

  let totalCost = 0;
  let remaining = desiredElo - currentElo;
  let pos = currentElo < 900 ? 900 : currentElo;

  if (currentElo < 900 && desiredElo < 900) {
    totalCost = (desiredElo - currentElo) * priceTable[0].pricePerElo;
    const multiplier = 1 + (markup / 100);
    return { totalCost: totalCost * multiplier, error: null };
  }

  for (const tier of priceTable) {
    if (pos >= tier.min && pos < tier.max) {
      const tierMax = tier.max === Infinity ? desiredElo : tier.max;
      const maxGain = tierMax - pos;
      const gain = Math.min(remaining, maxGain);
      if (gain > 0) {
        totalCost += gain * tier.pricePerElo;
        pos += gain;
        remaining -= gain;
      }
    }
    if (remaining <= 0) break;
  }

  if (remaining > 0) return { error: '❌ Нет цен для ELO выше ' + pos };

  const multiplier = 1 + (markup / 100);
  return { totalCost: totalCost * multiplier, error: null };
}

// ========== ФОРМАТ ЦЕНЫ ==========
function formatPrice(priceInRub) {
  if (currentCurrency === 'USD') {
    return '$' + (priceInRub / USD_RATE).toFixed(2);
  }
  return priceInRub.toFixed(2) + ' руб';
}

// ========== ГЛАВНЫЙ РАСЧЁТ ==========
function calculate() {
  const boostType = document.getElementById('boostType').value;
  const currentElo = parseFloat(document.getElementById('currentElo').value);
  const targetValue = parseFloat(document.getElementById('targetInput').value);
  const markup = regionMarkup[currentRegion] || 0;
  const resultDiv = document.getElementById('result');

  if (isNaN(currentElo) || isNaN(targetValue)) {
    resultDiv.innerHTML = '<div class="placeholder">⚠️ Введите корректные числа</div>';
    return;
  }

  const priceTable = boostType === 'party' ? partyPrices : soloPrices;
  const result = calculateBoostByElo(currentElo, targetValue, priceTable, markup);

  if (result.error) {
    resultDiv.innerHTML = '<div class="placeholder">' + result.error + '</div>';
    return;
  }

  resultDiv.innerHTML = '<div class="price">' + formatPrice(result.totalCost) + '</div>';
}

// ========== ПЕРЕКЛЮЧАТЕЛЬ ВАЛЮТЫ ==========
document.querySelectorAll('#currencySwitch .switch-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#currencySwitch .switch-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentCurrency = btn.getAttribute('data-currency');
    const resultDiv = document.getElementById('result');
    if (resultDiv && resultDiv.querySelector('.price')) calculate();
  });
});

// ========== ПЕРЕКЛЮЧАТЕЛЬ РЕГИОНА ==========
document.querySelectorAll('#regionSwitch .switch-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#regionSwitch .switch-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentRegion = btn.getAttribute('data-region');

    const warning = document.getElementById('euWarning');
    if (warning) warning.style.display = currentRegion === 'EU' ? 'block' : 'none';

    const resultDiv = document.getElementById('result');
    if (resultDiv && resultDiv.querySelector('.price')) calculate();
  });
});

// ========== ENTER НА ПОЛЯХ ==========
document.querySelectorAll('input').forEach(function (input) {
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') calculate();
  });
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.onload = function () {
  const warning = document.getElementById('euWarning');
  if (warning) warning.style.display = 'none';
};