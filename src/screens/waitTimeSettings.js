/*
 * 예상 대기시간 관리 화면
 * - 예상 대기시간 사용 토글
 * - 대기 메뉴 (N)개당 예상 시간 (M)분 설정
 * - 최대 예상 대기시간 설정
 * - 고객 화면 미리보기 (실시간 갱신)
 */
(function () {
  function optionsHtml(values, current, suffix) {
    return values.map(function (v) {
      return '<option value="' + v + '"' + (v === current ? ' selected' : '') + '>' + v + suffix + '</option>';
    }).join('');
  }

  function rangeValues(start, end, step) {
    const out = [];
    for (let v = start; v <= end; v += step) out.push(v);
    return out;
  }

  function render() {
    const user = window.MockApi.getCurrentUser();
    const store = window.MockApi.getStore(user.storeId);
    const enabled = store.waitTimeGuideEnabled !== false;
    const n = store.waitTimeMenuCountUnit || 5;
    const m = store.waitTimeMinutesPerUnit || 10;
    const maxM = store.waitTimeMaxMinutes || 60;
    const info = window.MockApi.getEstimatedWaitInfo(user.storeId);

    const nOptions = optionsHtml(rangeValues(5, 50, 5), n, '개');
    const mOptions = optionsHtml(rangeValues(5, 60, 5), m, '분');
    const maxOptions = optionsHtml(rangeValues(5, 120, 5), maxM, '분');

    return (
      '<style>' +
      '.wait-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) var(--space-5);}' +
      '.wait-toggle-row .label-title{font-size:var(--font-size-body);font-weight:700;}' +
      '.wait-body{transition:opacity 0.15s ease;}' +
      '.wait-body.disabled{opacity:0.4;pointer-events:none;}' +
      '.wait-formula-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:0 var(--space-5) var(--space-4);font-size:var(--font-size-body);font-weight:600;}' +
      '.wait-formula-row select{width:auto;min-width:76px;height:44px;text-align:center;padding:0 28px 0 12px;}' +
      '.wait-max-wrap{padding:0 var(--space-5) var(--space-4);}' +
      '.preview-wrap{padding:0 var(--space-5) var(--space-6);}' +
      '.preview-body{text-align:center;font-size:var(--font-size-body);line-height:1.7;}' +
      '.preview-body b{font-weight:800;}' +
      '.preview-minutes{color:var(--color-accent-blue);}' +
      '</style>' +
      '<div class="topbar">' +
        '<div class="topbar-side"><button type="button" class="icon-btn" id="wait-back-btn" aria-label="뒤로가기">←</button></div>' +
        '<div class="topbar-title">예상 대기시간 관리</div>' +
        '<div class="topbar-side"></div>' +
      '</div>' +
      '<div class="screen-scroll">' +
        '<div class="wait-toggle-row">' +
          '<span class="label-title">예상 대기시간 사용</span>' +
          '<button type="button" class="toggle' + (enabled ? ' on' : '') + '" id="wait-enable-toggle" aria-label="예상 대기시간 사용 여부">' +
            '<span class="toggle-knob"></span>' +
          '</button>' +
        '</div>' +
        '<div class="divider-line"></div>' +
        '<div class="wait-body' + (enabled ? '' : ' disabled') + '" id="wait-body">' +
          '<div class="section-title">예상 대기시간 설정</div>' +
          '<div class="section-caption">대기·처리중인 주문의 메뉴 수량을 기준으로 예상 대기시간을 계산해요</div>' +
          '<div class="wait-formula-row">' +
            '<span>대기 메뉴</span>' +
            '<select class="input-field" id="select-n">' + nOptions + '</select>' +
            '<span>개당 예상 시간</span>' +
            '<select class="input-field" id="select-m">' + mOptions + '</select>' +
          '</div>' +
          '<div class="section-title">최대 예상 대기시간 설정</div>' +
          '<div class="section-caption">계산된 값이 이 시간을 넘으면 이 값으로 고정해서 보여줘요</div>' +
          '<div class="wait-max-wrap">' +
            '<select class="input-field" id="select-max">' + maxOptions + '</select>' +
          '</div>' +
          '<div class="section-title">고객 화면 미리보기</div>' +
          '<div class="preview-wrap">' +
            '<div class="preview-frame">' +
              '<div class="preview-frame-label">고객에게 보이는 화면이에요</div>' +
              '<div class="preview-body">' +
                '접수된 주문이 <b id="preview-qty">' + info.pendingQty + '개</b>일 경우<br/>' +
                '현재 예상 대기 시간은 <b class="preview-minutes" id="preview-min">' + info.minutes + '분</b> 입니다' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function mount(root) {
    const user = window.MockApi.getCurrentUser();
    const storeId = user.storeId;

    const enableToggle = root.querySelector('#wait-enable-toggle');
    const body = root.querySelector('#wait-body');
    const selN = root.querySelector('#select-n');
    const selM = root.querySelector('#select-m');
    const selMax = root.querySelector('#select-max');
    const previewQty = root.querySelector('#preview-qty');
    const previewMin = root.querySelector('#preview-min');

    function refreshDisabledState() {
      body.classList.toggle('disabled', !enableToggle.classList.contains('on'));
    }

    function refreshPreview() {
      const info = window.MockApi.getEstimatedWaitInfo(storeId);
      previewQty.textContent = info.pendingQty + '개';
      previewMin.textContent = info.minutes + '분';
    }

    function persist() {
      window.MockApi.updateWaitTimeSettings(storeId, {
        waitTimeGuideEnabled: enableToggle.classList.contains('on'),
        waitTimeMenuCountUnit: parseInt(selN.value, 10),
        waitTimeMinutesPerUnit: parseInt(selM.value, 10),
        waitTimeMaxMinutes: parseInt(selMax.value, 10),
      });
      refreshPreview();
    }

    root.querySelector('#wait-back-btn').addEventListener('click', function () {
      window.Router.showScreen('settings');
    });

    enableToggle.addEventListener('click', function () {
      enableToggle.classList.toggle('on');
      refreshDisabledState();
      persist();
    });

    [selN, selM, selMax].forEach(function (sel) {
      sel.addEventListener('change', persist);
    });
  }

  function unmount() {}

  window.Router.register('waitTimeSettings', { render: render, mount: mount, unmount: unmount });
})();
