/*
 * 공용 UI 헬퍼 — 포맷팅, 토스트/모달/바텀시트, 차트 SVG, 주문 카드 조각
 */
(function () {
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatMoney(n) { return (n || 0).toLocaleString('ko-KR') + '원'; }

  function clockLabel(iso) {
    const d = new Date(iso);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function elapsedLabel(iso) {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return mins + '분 경과';
    return Math.floor(mins / 60) + '시간 ' + (mins % 60) + '분 경과';
  }

  function isPhoneSuspicious(contact) {
    if (!contact || contact.indexOf('@') !== -1) return false;
    const digits = contact.replace(/[^0-9]/g, '');
    return digits.indexOf('010') !== 0 || digits.length !== 11;
  }

  function formatContact(contact) {
    if (!contact) return '';
    if (contact.indexOf('@') !== -1) return contact;
    const d = contact.replace(/[^0-9]/g, '');
    if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    return contact;
  }

  // ---------------- 5분 단위 시간대 버킷 ----------------
  function bucketKeyOf(iso) {
    const d = new Date(iso);
    d.setSeconds(0, 0);
    d.setMinutes(Math.floor(d.getMinutes() / 5) * 5);
    return d.getTime();
  }

  function bucketLabel(key) {
    const start = new Date(key);
    const end = new Date(key + 5 * 60000);
    function hm(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    return hm(start) + ' ~ ' + hm(end);
  }

  function groupByBucket(orders) {
    const groups = [];
    let current = null;
    orders.forEach(function (o) {
      const key = bucketKeyOf(o.orderedAt);
      if (!current || current.key !== key) {
        current = { key: key, label: bucketLabel(key), orders: [] };
        groups.push(current);
      }
      current.orders.push(o);
    });
    return groups;
  }

  // ---------------- Channel / status badges ----------------
  function channelBadgeHtml(channel) {
    if (channel === 'QR') return '<span class="channel-badge channel-qr">🔳 QR오더</span>';
    return '<span class="channel-badge channel-tablet">🖥️ 태블릿오더</span>';
  }

  function operatingStatusMeta(status) {
    if (status === 'OPEN') return { label: '영업 중', cls: 'open', dot: '🟢' };
    if (status === 'PAUSED') return { label: '일시중지', cls: 'paused', dot: '🟠' };
    return { label: '마감', cls: 'closed', dot: '🔴' };
  }

  function statusPillHtml(status) {
    const meta = operatingStatusMeta(status);
    return '<span class="status-pill ' + meta.cls + '">' + meta.dot + ' ' + meta.label + '</span>';
  }

  // ---------------- Toast ----------------
  let toastTimer = null;
  function toast(message, actionLabel, onAction) {
    const host = document.getElementById('toast-host');
    if (!host) return;
    host.innerHTML = '<div class="toast ' + (actionLabel ? 'toast-with-action' : '') + '" id="active-toast">' +
      '<span>' + escapeHtml(message) + '</span>' +
      (actionLabel ? '<button class="toast-action" id="toast-action-btn">' + escapeHtml(actionLabel) + '</button>' : '') +
      '</div>';
    const el = document.getElementById('active-toast');
    requestAnimationFrame(function () { el.classList.add('show'); });
    if (actionLabel && onAction) {
      document.getElementById('toast-action-btn').addEventListener('click', function () {
        onAction();
        hideToast();
      });
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3000);
  }
  function hideToast() {
    const el = document.getElementById('active-toast');
    if (el) el.classList.remove('show');
  }

  // ---------------- Center Modal ----------------
  function showModal(opts) {
    const host = document.getElementById('modal-host');
    const buttonsHtml = (opts.buttons || []).map(function (b, i) {
      return '<button class="btn ' + (b.variant || 'btn-secondary') + '" data-idx="' + i + '">' + escapeHtml(b.label) + '</button>';
    }).join('');
    host.innerHTML = '<div class="modal-overlay" id="active-modal">' +
      '<div class="modal-card">' +
      (opts.title ? '<div class="modal-title">' + escapeHtml(opts.title) + '</div>' : '') +
      (opts.message ? '<div class="modal-message">' + opts.message + '</div>' : '') +
      (opts.bodyHtml || '') +
      '<div class="btn-row" style="flex-direction:column;gap:8px;">' + buttonsHtml + '</div>' +
      '</div></div>';
    requestAnimationFrame(function () { document.getElementById('active-modal').classList.add('show'); });
    (opts.buttons || []).forEach(function (b, i) {
      host.querySelector('[data-idx="' + i + '"]').addEventListener('click', function () {
        closeModal();
        if (b.onClick) b.onClick();
      });
    });
    return host;
  }
  function closeModal() {
    const host = document.getElementById('modal-host');
    host.innerHTML = '';
  }

  function confirmModal(title, message, confirmLabel, onConfirm, opts) {
    opts = opts || {};
    showModal({
      title: title, message: message,
      buttons: [
        { label: confirmLabel, variant: opts.danger ? 'btn-danger-solid' : 'btn-primary', onClick: onConfirm },
        { label: opts.cancelLabel || '취소', variant: 'btn-secondary' },
      ],
    });
  }

  // ---------------- Bottom Sheet ----------------
  function showBottomSheet(innerHtml, onMount) {
    const host = document.getElementById('modal-host');
    host.innerHTML = '<div class="modal-overlay-bottom" id="active-sheet"><div class="sheet-card">' +
      '<div class="sheet-handle"></div>' + innerHtml + '</div></div>';
    requestAnimationFrame(function () { document.getElementById('active-sheet').classList.add('show'); });
    document.getElementById('active-sheet').addEventListener('click', function (e) {
      if (e.target.id === 'active-sheet') closeModal();
    });
    if (onMount) onMount(host);
  }

  // ---------------- Chart: Bar ----------------
  function barChartHtml(data) {
    const max = Math.max(1, ...data.map(function (d) { return d.amount; }));
    return '<div class="bar-chart-row">' + data.map(function (d) {
      const h = Math.round((d.amount / max) * 100);
      return '<div class="bar-chart-col">' +
        '<div class="bar-chart-bar' + (d.amount === max ? ' max' : '') + '" style="height:' + Math.max(h, 3) + '%"></div>' +
        '<div class="bar-chart-label">' + escapeHtml(d.name) + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  // ---------------- Chart: Donut (SVG) ----------------
  const DONUT_COLORS = ['#111111', '#6b7684', '#e5e8eb', '#3182f6'];
  function donutChartHtml(data) {
    const total = data.reduce(function (s, d) { return s + d.amount; }, 0) || 1;
    let acc = 0;
    const r = 40, cx = 50, cy = 50, circumference = 2 * Math.PI * r;
    const circles = data.map(function (d, i) {
      const frac = d.amount / total;
      const dash = frac * circumference;
      const offset = circumference - acc * circumference;
      acc += frac;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + DONUT_COLORS[i % DONUT_COLORS.length] +
        '" stroke-width="16" stroke-dasharray="' + dash + ' ' + circumference + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" />';
    }).join('');
    const svg = '<svg viewBox="0 0 100 100" width="120" height="120">' + circles + '</svg>';
    const legend = '<div class="donut-legend">' + data.map(function (d, i) {
      const pct = Math.round((d.amount / total) * 100);
      return '<div class="donut-legend-item"><span class="donut-legend-dot" style="background:' + DONUT_COLORS[i % DONUT_COLORS.length] + '"></span>' +
        '<span class="donut-legend-name">' + escapeHtml(d.name) + '</span>' +
        '<span class="donut-legend-value">' + pct + '% · ' + formatMoney(d.amount) + '</span></div>';
    }).join('') + '</div>';
    return '<div class="donut-wrap">' + svg + legend + '</div>';
  }

  // ---------------- Chart: Ranking list ----------------
  function rankListHtml(data, opts) {
    opts = opts || {};
    const max = Math.max(1, ...data.map(function (d) { return d.amount; }));
    return '<div class="rank-list">' + data.map(function (d, i) {
      const pct = Math.round((d.amount / max) * 100);
      return '<div class="rank-row" ' + (opts.clickable ? 'data-rank-idx="' + i + '" style="cursor:pointer"' : '') + '>' +
        '<div class="rank-index">' + (i + 1) + '</div>' +
        '<div class="rank-body">' +
        '<div class="rank-name-row"><span>' + escapeHtml(d.name) + '</span><span>' + formatMoney(d.amount) + '</span></div>' +
        '<div class="rank-bar-track"><div class="rank-bar-fill' + (i === 0 ? ' max' : '') + '" style="width:' + pct + '%"></div></div>' +
        (d.qty != null ? '<div class="rank-sub">판매 ' + d.qty + '개</div>' : '') +
        '</div></div>';
    }).join('') + '</div>';
  }

  function salesChartHtml(dimension, data) {
    if (!data.length) return '<div class="empty-state"><div class="empty-state-emoji">📭</div><div>해당 기간의 매출이 없어요</div></div>';
    if (dimension === 'period' || dimension === 'hour') return barChartHtml(data);
    if (dimension === 'payment' || dimension === 'channel') return donutChartHtml(data);
    if (dimension === 'menu' || dimension === 'store') return rankListHtml(data);
    return '';
  }

  window.UI = {
    escapeHtml: escapeHtml, formatMoney: formatMoney, clockLabel: clockLabel, elapsedLabel: elapsedLabel,
    isPhoneSuspicious: isPhoneSuspicious, formatContact: formatContact,
    bucketKeyOf: bucketKeyOf, bucketLabel: bucketLabel, groupByBucket: groupByBucket,
    channelBadgeHtml: channelBadgeHtml, operatingStatusMeta: operatingStatusMeta, statusPillHtml: statusPillHtml,
    toast: toast, showModal: showModal, closeModal: closeModal, confirmModal: confirmModal, showBottomSheet: showBottomSheet,
    barChartHtml: barChartHtml, donutChartHtml: donutChartHtml, rankListHtml: rankListHtml, salesChartHtml: salesChartHtml,
  };
})();
