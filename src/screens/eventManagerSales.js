/*
 * 행사 담당자 — 매출 현황 화면
 * 상단 요약 + 매장별 매출 랭킹 + 상세 매출(카드형 허브 → 상세, 사장님 앱 패턴 재현)
 */
(function () {
  const DETAIL_CARDS = [
    { key: 'period', icon: '📅', label: '기간별 매출' },
    { key: 'menu', icon: '🍽️', label: '메뉴별 매출' },
    { key: 'hour', icon: '🕒', label: '시간대별 매출' },
    { key: 'channel', icon: '🧾', label: '주문 방식별 매출' },
    { key: 'payment', icon: '💳', label: '결제수단별 매출' },
  ];

  function computeChannelRatio(eventId) {
    const rows = window.MockApi.getEventSalesByChannel(eventId);
    const total = rows.reduce(function (s, r) { return s + r.amount; }, 0) || 1;
    return rows.map(function (r) { return { name: r.name, amount: r.amount, pct: Math.round((r.amount / total) * 100) }; });
  }

  function emptyHtml() {
    return '<div class="empty-state"><div class="empty-state-emoji">📭</div><div>데이터가 없어요</div></div>';
  }

  function renderDetailBody(key, eventId) {
    if (key === 'period') {
      const s = window.MockApi.getEventDashboardSummary(eventId);
      const data = [{ name: '오늘', amount: s.todayAmount }, { name: '누적', amount: s.totalAmount }];
      return '<div class="section-caption">참여 매장들의 누적 매출 추이 데이터가 없어, 오늘 대비 누적 매출로 단순 비교해요</div><div class="chart-card">' + window.UI.barChartHtml(data) + '</div>';
    }
    if (key === 'menu') {
      const data = window.MockApi.getEventSalesByMenu(eventId);
      return data.length ? '<div class="chart-card">' + window.UI.rankListHtml(data) + '</div>' : emptyHtml();
    }
    if (key === 'hour') {
      const data = window.MockApi.getEventSalesByHour(eventId);
      return data.length ? '<div class="chart-card">' + window.UI.barChartHtml(data) + '</div>' : emptyHtml();
    }
    if (key === 'channel') {
      const data = window.MockApi.getEventSalesByChannel(eventId).slice().sort(function (a, b) { return b.amount - a.amount; });
      return data.length ? '<div class="chart-card">' + window.UI.donutChartHtml(data) + '</div>' : emptyHtml();
    }
    if (key === 'payment') {
      const data = window.MockApi.getEventSalesByPayment(eventId).slice().sort(function (a, b) { return b.amount - a.amount; });
      return data.length ? '<div class="chart-card">' + window.UI.donutChartHtml(data) + '</div>' : emptyHtml();
    }
    return '';
  }

  function render(params) {
    const esc = window.UI.escapeHtml;
    const eventId = params.eventId;
    const summary = window.MockApi.getEventDashboardSummary(eventId);
    const channelRatio = computeChannelRatio(eventId);
    const storeRank = window.MockApi.getEventSalesByStore(eventId);

    const channelRatioText = channelRatio.map(function (c) { return esc(c.name) + ' ' + c.pct + '%'; }).join(' · ');

    const detailListHtml = DETAIL_CARDS.map(function (d) {
      return (
        '<div class="card-list-item" data-detail-key="' + d.key + '" data-detail-label="' + esc(d.label) + '">' +
          '<div class="label-group"><span class="label-title">' + d.icon + ' ' + esc(d.label) + '</span></div>' +
          '<span class="chevron">›</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<style>' +
        '.sales-detail-overlay{position:absolute;inset:0;background:var(--color-bg);z-index:60;display:none;flex-direction:column;}' +
        '.sales-detail-overlay.show{display:flex;}' +
        '.channel-ratio-row{padding:0 20px 20px;font-size:var(--font-size-caption);color:var(--color-text-secondary);font-weight:700;}' +
      '</style>' +
      '<div class="topbar"><div class="topbar-side"></div><div class="topbar-title">매출 현황</div><div class="topbar-side"></div></div>' +
      '<div class="screen-scroll">' +

        '<div class="section-title">매출 요약</div>' +
        '<div class="summary-grid" style="padding-bottom:8px;">' +
          '<div class="summary-card"><span class="summary-label">누적 매출</span><span class="summary-value">' + window.UI.formatMoney(summary.totalAmount) + '</span></div>' +
          '<div class="summary-card"><span class="summary-label">오늘 매출</span><span class="summary-value">' + window.UI.formatMoney(summary.todayAmount) + '</span></div>' +
          '<div class="summary-card"><span class="summary-label">참여 매장 수</span><span class="summary-value">' + summary.storeCount + '개</span></div>' +
          '<div class="summary-card"><span class="summary-label">매장당 평균(오늘)</span><span class="summary-value">' + window.UI.formatMoney(summary.avgPerStoreToday) + '</span></div>' +
          '<div class="summary-card"><span class="summary-label">매장당 평균(누적)</span><span class="summary-value">' + window.UI.formatMoney(summary.avgPerStoreTotal) + '</span></div>' +
        '</div>' +
        '<div class="channel-ratio-row">주문경로 비중 · ' + channelRatioText + '</div>' +

        '<div class="section-title">매장별 매출 랭킹</div>' +
        '<div class="section-caption">오늘 매출 기준 · 높은 순</div>' +
        (storeRank.length ? window.UI.rankListHtml(storeRank) : emptyHtml()) +

        '<div class="section-title" style="margin-top:8px;">상세 매출</div>' +
        '<div style="padding:0 20px 24px;display:flex;flex-direction:column;gap:12px;">' + detailListHtml + '</div>' +

      '</div>' +
      window.EventManagerShell.tabbarHtml('eventManagerSales') +

      '<div class="sales-detail-overlay" id="sales-detail-overlay">' +
        '<div class="topbar"><div class="topbar-side"><button type="button" class="icon-btn" id="detail-back">←</button></div><div class="topbar-title" id="detail-title"></div><div class="topbar-side"></div></div>' +
        '<div class="screen-scroll" id="detail-body"></div>' +
      '</div>'
    );
  }

  function mount(root, params) {
    const eventId = params.eventId;
    window.EventManagerShell.attachTabbar(root, 'eventManagerSales', eventId);

    const overlay = root.querySelector('#sales-detail-overlay');
    const backBtn = root.querySelector('#detail-back');
    const titleEl = root.querySelector('#detail-title');
    const bodyEl = root.querySelector('#detail-body');

    root.querySelectorAll('[data-detail-key]').forEach(function (el) {
      el.addEventListener('click', function () {
        const key = el.getAttribute('data-detail-key');
        const label = el.getAttribute('data-detail-label');
        titleEl.textContent = label;
        bodyEl.innerHTML = renderDetailBody(key, eventId);
        overlay.classList.add('show');
      });
    });

    if (backBtn) backBtn.addEventListener('click', function () { overlay.classList.remove('show'); });
  }

  function unmount() {}

  window.Router.register('eventManagerSales', { render: render, mount: mount, unmount: unmount });
})();
