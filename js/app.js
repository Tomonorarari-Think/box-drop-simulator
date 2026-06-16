/*
 * Box Drop Storage Simulator - UI wiring.
 *
 * Connects the DOM to i18n, simulation, formatters and charts. No frameworks.
 */
(function (root) {
  'use strict';

  var i18n = root.BDS.i18n;
  var sim = root.BDS.simulation;
  var fmt = root.BDS.format;
  var charts = root.BDS.charts;

  var NUMERIC_FIELDS = [
    'stageInterval',
    'whiteCooldown',
    'blueCooldown',
    'inventoryLimit',
    'whiteStorageLimit',
    'blueStorageLimit',
    'whiteOpenTime',
    'blueOpenTime'
  ];
  var SELECT_FIELDS = [
    'cooldownResetMode',
    'simultaneousPriority',
    'maxDropsPerClear',
    'firstDropRule',
    'nonSelectedBehavior',
    'endCondition'
  ];

  var lastResult = null;

  function $(id) { return document.getElementById(id); }
  function t(key) { return i18n.t(key); }

  // ---------- i18n application ----------
  function applyTranslations() {
    document.documentElement.lang = i18n.getLang();

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var val = t(key);
      if (nodes[i].tagName === 'TITLE') {
        document.title = val;
      } else {
        nodes[i].textContent = val;
      }
    }
    updateThemeLabel();
    // Re-render results so dynamic strings (units, durations) follow language.
    if (lastResult) renderResult(lastResult);
  }

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { root.localStorage.setItem('bds.theme', theme); } catch (e) {}
    updateThemeLabel();
    // Charts read CSS vars at render time; re-render to pick up theme colors.
    if (lastResult) charts.renderStorageChart($('chart'), lastResult);
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
  function updateThemeLabel() {
    var dark = currentTheme() === 'dark';
    var icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = dark ? '☀️' : '🌙';
    var label = $('theme-label');
    if (label) label.textContent = dark ? t('theme_light') : t('theme_dark');
  }

  // ---------- Form <-> params ----------
  function setForm(params) {
    NUMERIC_FIELDS.forEach(function (k) { $(k).value = params[k]; });
    SELECT_FIELDS.forEach(function (k) { $(k).value = params[k]; });
  }

  function readForm() {
    var params = {};
    var valid = true;
    NUMERIC_FIELDS.forEach(function (k) {
      var raw = $(k).value;
      var n = parseFloat(raw);
      if (raw === '' || !isFinite(n) || n < 0) valid = false;
      params[k] = n;
    });
    SELECT_FIELDS.forEach(function (k) {
      params[k] = $(k).value;
    });
    params.maxDropsPerClear = parseInt(params.maxDropsPerClear, 10);
    return { params: params, valid: valid };
  }

  function persistForm() {
    try {
      var read = readForm();
      root.localStorage.setItem('bds.params', JSON.stringify(read.params));
    } catch (e) {}
  }

  function loadPersistedParams() {
    try {
      var raw = root.localStorage.getItem('bds.params');
      if (raw) {
        var saved = JSON.parse(raw);
        return Object.assign({}, sim.DEFAULTS, saved);
      }
    } catch (e) {}
    return Object.assign({}, sim.DEFAULTS);
  }

  // ---------- Rendering results ----------
  function renderResult(result) {
    lastResult = result;
    $('result-placeholder').hidden = true;

    if (!result.completed) {
      $('result-body').hidden = true;
      var err = $('result-error');
      err.hidden = false;
      err.textContent = t('error_no_finish');
      return;
    }
    $('result-error').hidden = true;
    $('result-body').hidden = false;

    $('val-inv').textContent = fmt.durationWithSeconds(result.invFilledAt);
    $('val-storage').textContent = fmt.durationWithSeconds(result.storageTime);
    $('val-opening').textContent = fmt.durationWithSeconds(result.openingTime);
    $('val-total').textContent = fmt.durationWithSeconds(result.doneAt);

    $('val-white').textContent = fmt.withCommas(result.whiteStored) + ' ' + t('unit_items');
    $('val-blue').textContent = fmt.withCommas(result.blueStored) + ' ' + t('unit_items');
    $('sub-white').textContent = result.whiteDoneAt != null ? fmt.durationWithSeconds(result.whiteDoneAt) : t('not_reached');
    $('sub-blue').textContent = result.blueDoneAt != null ? fmt.durationWithSeconds(result.blueDoneAt) : t('not_reached');

    renderFirstReached(result);
    highlightFirstCard(result);
    renderTimeline(result);
    charts.renderStorageChart($('chart'), result);
  }

  function renderFirstReached(result) {
    var firstEl = $('val-first');
    var both = result.params.endCondition === 'both';
    if (both && result.whiteDoneAt != null && result.blueDoneAt != null) {
      firstEl.innerHTML =
        '<div>' + boxLabel('white') + ': ' + fmt.durationWithSeconds(result.whiteDoneAt) + '</div>' +
        '<div>' + boxLabel('blue') + ': ' + fmt.durationWithSeconds(result.blueDoneAt) + '</div>';
    } else if (result.firstReached) {
      firstEl.textContent = boxLabel(result.firstReached);
    } else {
      firstEl.textContent = t('not_reached');
    }
  }

  function highlightFirstCard(result) {
    var white = $('card-white');
    var blue = $('card-blue');
    white.classList.remove('is-first');
    blue.classList.remove('is-first');
    removeBadges();
    if (!result.firstReached) return;
    var card = result.firstReached === 'white' ? white : blue;
    card.classList.add('is-first');
    var badge = document.createElement('div');
    badge.className = 'card-first-badge';
    badge.textContent = t('reached_limit_first');
    card.appendChild(badge);
  }

  function removeBadges() {
    var badges = document.querySelectorAll('.card-first-badge');
    for (var i = 0; i < badges.length; i++) badges[i].remove();
  }

  function boxLabel(box) {
    return box === 'white' ? t('white_box') : t('blue_box');
  }

  function renderTimeline(result) {
    var tl = $('timeline');
    tl.innerHTML = '';
    var fillDur = result.invFilledAt || 0;
    var storeDur = result.storageTime || 0;
    var total = fillDur + storeDur || 1;

    var fillSeg = document.createElement('div');
    fillSeg.className = 'timeline-seg seg-fill';
    fillSeg.style.width = (fillDur / total * 100) + '%';
    fillSeg.textContent = t('phase_fill');
    fillSeg.title = t('phase_fill') + ': ' + fmt.durationWithSeconds(fillDur);

    var storeSeg = document.createElement('div');
    storeSeg.className = 'timeline-seg seg-store';
    storeSeg.style.width = (storeDur / total * 100) + '%';
    storeSeg.textContent = t('phase_store');
    storeSeg.title = t('phase_store') + ': ' + fmt.durationWithSeconds(storeDur);

    tl.appendChild(fillSeg);
    tl.appendChild(storeSeg);
  }

  // ---------- Tooltips ----------
  function setupTooltips() {
    var tip = $('tooltip');
    var helps = document.querySelectorAll('.help');
    helps.forEach(function (h) {
      function show(e) {
        var key = h.getAttribute('data-tip');
        tip.textContent = t(key);
        tip.hidden = false;
        position(e);
      }
      function position(e) {
        var x = (e.clientX || 0) + 14;
        var y = (e.clientY || 0) + 14;
        var rect = tip.getBoundingClientRect();
        if (x + rect.width > root.innerWidth - 8) x = root.innerWidth - rect.width - 8;
        if (y + rect.height > root.innerHeight - 8) y = (e.clientY || 0) - rect.height - 14;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
      }
      function hide() { tip.hidden = true; }
      h.addEventListener('mouseenter', show);
      h.addEventListener('mousemove', position);
      h.addEventListener('mouseleave', hide);
      h.addEventListener('focus', function () {
        var r = h.getBoundingClientRect();
        show({ clientX: r.right, clientY: r.bottom });
      });
      h.addEventListener('blur', hide);
      h.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  // ---------- Actions ----------
  function onCalculate() {
    var read = readForm();
    if (!read.valid) {
      $('result-placeholder').hidden = true;
      $('result-body').hidden = true;
      var err = $('result-error');
      err.hidden = false;
      err.textContent = t('error_invalid');
      return;
    }
    persistForm();
    var result = sim.simulate(read.params);
    renderResult(result);
  }

  function onReset() {
    setForm(sim.DEFAULTS);
    persistForm();
  }

  // ---------- Init ----------
  function init() {
    // Language.
    var lang = i18n.detectDefault();
    i18n.setLang(lang);
    $('lang-select').value = lang;

    // Theme.
    // Dark-first: the gamer HUD look leads with dark mode unless the user
    // has explicitly chosen light or their OS prefers light.
    var theme = 'dark';
    try {
      var savedTheme = root.localStorage.getItem('bds.theme');
      if (savedTheme === 'dark' || savedTheme === 'light') theme = savedTheme;
      else if (root.matchMedia && root.matchMedia('(prefers-color-scheme: light)').matches) theme = 'light';
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);

    // Form.
    setForm(loadPersistedParams());

    applyTranslations();
    setupTooltips();

    $('lang-select').addEventListener('change', function () {
      i18n.setLang($('lang-select').value);
      applyTranslations();
    });
    $('theme-toggle').addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    $('calculate').addEventListener('click', onCalculate);
    $('reset').addEventListener('click', onReset);

    // Persist inputs as the user edits.
    NUMERIC_FIELDS.concat(SELECT_FIELDS).forEach(function (k) {
      $(k).addEventListener('change', persistForm);
    });

    // Allow Enter in number fields to trigger calculation.
    NUMERIC_FIELDS.forEach(function (k) {
      $(k).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') onCalculate();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof self !== 'undefined' ? self : this);
