/*
 * Box Drop Storage Simulator - lightweight SVG charts (no dependencies).
 *
 * renderStorageChart(container, result): step-line chart of white/blue stored
 * counts over time, with a marker line where inventory fills.
 *
 * Per design spec: white box -> blue color, blue box -> purple color.
 */
(function (root) {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var COLOR_WHITE_BOX = '#22d3ee'; // neon cyan (white box -> blue/cyan)
  var COLOR_BLUE_BOX = '#c084fc'; // neon purple (blue box -> purple)

  function t(key) {
    return root.BDS && root.BDS.i18n ? root.BDS.i18n.t(key) : key;
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVGNS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    return node;
  }

  // Reduce a dense series to a manageable number of step vertices while
  // preserving every value change.
  function compress(events, pick) {
    var pts = [];
    var prev = null;
    for (var i = 0; i < events.length; i++) {
      var v = pick(events[i]);
      var tt = events[i].t;
      if (prev === null) {
        pts.push({ t: tt, v: v });
        prev = v;
        continue;
      }
      if (v !== prev) {
        // step: horizontal to current t at previous value, then vertical.
        pts.push({ t: tt, v: prev });
        pts.push({ t: tt, v: v });
        prev = v;
      }
    }
    // ensure final point extends to last t.
    var lastT = events.length ? events[events.length - 1].t : 0;
    pts.push({ t: lastT, v: prev === null ? 0 : prev });
    return pts;
  }

  function renderStorageChart(container, result) {
    container.innerHTML = '';
    if (!result || !result.events || result.events.length < 2) return;

    var W = 640;
    var H = 320;
    var padL = 48;
    var padR = 16;
    var padT = 16;
    var padB = 40;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var maxT = result.doneAt || result.events[result.events.length - 1].t || 1;
    var maxCount = Math.max(
      result.params.whiteStorageLimit,
      result.params.blueStorageLimit,
      result.whiteStored,
      result.blueStored,
      1
    );

    function sx(tt) {
      return padL + (tt / maxT) * plotW;
    }
    function sy(v) {
      return padT + plotH - (v / maxCount) * plotH;
    }

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      width: '100%',
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'class': 'bds-chart'
    });

    // Grid + Y axis labels.
    var ySteps = Math.min(maxCount, 5);
    for (var gi = 0; gi <= ySteps; gi++) {
      var val = Math.round((maxCount / ySteps) * gi);
      var y = sy(val);
      svg.appendChild(
        el('line', {
          x1: padL, y1: y, x2: W - padR, y2: y,
          'class': 'bds-grid'
        })
      );
      var lbl = el('text', { x: padL - 8, y: y + 4, 'class': 'bds-axis-label', 'text-anchor': 'end' });
      lbl.textContent = String(val);
      svg.appendChild(lbl);
    }

    // X axis ticks (5 divisions).
    for (var xi = 0; xi <= 5; xi++) {
      var tt = (maxT / 5) * xi;
      var x = sx(tt);
      svg.appendChild(el('line', { x1: x, y1: padT, x2: x, y2: padT + plotH, 'class': 'bds-grid' }));
      var xlbl = el('text', { x: x, y: H - padB + 18, 'class': 'bds-axis-label', 'text-anchor': 'middle' });
      xlbl.textContent = formatAxisTime(tt);
      svg.appendChild(xlbl);
    }

    // Inventory-filled marker.
    if (result.invFilledAt != null) {
      var fx = sx(result.invFilledAt);
      svg.appendChild(el('line', { x1: fx, y1: padT, x2: fx, y2: padT + plotH, 'class': 'bds-marker' }));
    }

    // Limit reference lines.
    appendLimitLine(svg, sy(result.params.whiteStorageLimit), padL, W - padR, COLOR_WHITE_BOX);
    appendLimitLine(svg, sy(result.params.blueStorageLimit), padL, W - padR, COLOR_BLUE_BOX);

    // Series.
    appendSeries(svg, compress(result.events, function (e) { return e.whiteStored; }), sx, sy, COLOR_WHITE_BOX);
    appendSeries(svg, compress(result.events, function (e) { return e.blueStored; }), sx, sy, COLOR_BLUE_BOX);

    container.appendChild(svg);
    container.appendChild(buildLegend());
  }

  function appendLimitLine(svg, y, x1, x2, color) {
    svg.appendChild(
      el('line', {
        x1: x1, y1: y, x2: x2, y2: y,
        stroke: color, 'stroke-width': 1, 'stroke-dasharray': '2 4', opacity: 0.5
      })
    );
  }

  function appendSeries(svg, pts, sx, sy, color) {
    if (!pts.length) return;
    var d = '';
    for (var i = 0; i < pts.length; i++) {
      d += (i === 0 ? 'M' : 'L') + sx(pts[i].t).toFixed(2) + ' ' + sy(pts[i].v).toFixed(2) + ' ';
    }
    // `color` drives the CSS drop-shadow glow (currentColor) to match the stroke.
    svg.appendChild(el('path', { d: d.trim(), fill: 'none', stroke: color, color: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  }

  function buildLegend() {
    var wrap = document.createElement('div');
    wrap.className = 'bds-legend';
    wrap.appendChild(legendItem(COLOR_WHITE_BOX, t('legend_white')));
    wrap.appendChild(legendItem(COLOR_BLUE_BOX, t('legend_blue')));
    return wrap;
  }

  function legendItem(color, label) {
    var item = document.createElement('span');
    item.className = 'bds-legend-item';
    var sw = document.createElement('span');
    sw.className = 'bds-legend-swatch';
    sw.style.background = color;
    var tx = document.createElement('span');
    tx.textContent = label;
    item.appendChild(sw);
    item.appendChild(tx);
    return item;
  }

  function formatAxisTime(seconds) {
    var s = Math.round(seconds);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    if (h > 0) return h + 'h' + (m > 0 ? m + 'm' : '');
    if (m > 0) return m + 'm';
    return s + 's';
  }

  root.BDS = root.BDS || {};
  root.BDS.charts = { renderStorageChart: renderStorageChart };
})(typeof self !== 'undefined' ? self : this);
