/*
 * 주문 방식 관리 화면 (설정 > 주문 관리 > 주문 방식 관리)
 * - 예약 주문 / 딜리버리(좌석번호) 주문 / 고객 요청사항 수신 여부를 매장이 직접 켜고 끈다.
 * - 꺼진 항목은 개발자 테스트 패널에서도 해당 옵션이 비활성화되어, 실제로 그 유형의
 *   주문이 인입되지 않는 것처럼 시뮬레이션된다.
 */
(function () {
  function currentStoreId() {
    var user = window.MockApi.getCurrentUser();
    return user && user.storeId;
  }

  function rowHtml(icon, id, label, sub, on) {
    return (
      '<div class="settings-list-item no-toggle-click">' +
        '<div class="icon">' + icon + '</div>' +
        '<div class="label-group">' +
          '<div class="label">' + label + '</div>' +
          '<div class="label-sub">' + sub + '</div>' +
        '</div>' +
        '<button type="button" class="toggle' + (on ? ' on' : '') + '" id="' + id + '"><span class="toggle-knob"></span></button>' +
      '</div>'
    );
  }

  function contentHtml(settings) {
    return (
      rowHtml('📅', 'ocs-reservation-toggle', '예약 주문',
        settings.acceptReservationOrders ? '예약 주문을 받고 있어요' : '예약 주문을 받지 않아요',
        settings.acceptReservationOrders) +
      '<div class="divider-line"></div>' +
      rowHtml('🛎️', 'ocs-seat-toggle', '딜리버리 주문',
        settings.acceptSeatOrders ? '켜면 좌석번호 주문도 함께 들어와요' : '꺼져 있으면 호출번호 주문만 들어와요',
        settings.acceptSeatOrders) +
      '<div class="divider-line"></div>' +
      rowHtml('💬', 'ocs-note-toggle', '고객 요청사항',
        settings.acceptCustomerNotes ? '주문 시 고객 요청사항을 받고 있어요' : '고객 요청사항을 받지 않아요',
        settings.acceptCustomerNotes)
    );
  }

  function render() {
    return (
      '<style>' +
        '.settings-list-item.no-toggle-click{cursor:default;flex-wrap:wrap;row-gap:8px;}' +
        '.settings-list-item.no-toggle-click:active{background:transparent;}' +
        '.settings-list-item .label-group{display:flex;flex-direction:column;gap:4px;flex:0 1 auto;min-width:0;}' +
        '.settings-list-item .label-group .label{flex:none;}' +
        '.settings-list-item .label-sub{font-size:var(--font-size-caption);color:var(--color-text-secondary);font-weight:500;}' +
      '</style>' +
      '<div class="topbar">' +
        '<div class="topbar-side"><button type="button" class="icon-btn" id="ocs-back" aria-label="뒤로가기">←</button></div>' +
        '<div class="topbar-title">주문 방식 관리</div>' +
        '<div class="topbar-side"></div>' +
      '</div>' +
      '<div class="screen-scroll"><div id="ocs-content"></div></div>'
    );
  }

  function mount(root) {
    var storeId = currentStoreId();

    function refresh() {
      var settings = window.MockApi.getOrderChannelSettings(storeId);
      root.querySelector('#ocs-content').innerHTML = contentHtml(settings);
      bindToggles(settings);
    }

    function bindToggles(settings) {
      root.querySelector('#ocs-reservation-toggle').addEventListener('click', function () {
        var next = !settings.acceptReservationOrders;
        window.MockApi.updateOrderChannelSettings(storeId, { acceptReservationOrders: next });
        window.UI.toast(next ? '예약 주문을 받기 시작해요' : '예약 주문을 받지 않아요');
        refresh();
      });
      root.querySelector('#ocs-seat-toggle').addEventListener('click', function () {
        var next = !settings.acceptSeatOrders;
        window.MockApi.updateOrderChannelSettings(storeId, { acceptSeatOrders: next });
        window.UI.toast(next ? '딜리버리(좌석번호) 주문을 받기 시작해요' : '딜리버리 주문을 받지 않아요 · 호출번호 주문만 들어와요');
        refresh();
      });
      root.querySelector('#ocs-note-toggle').addEventListener('click', function () {
        var next = !settings.acceptCustomerNotes;
        window.MockApi.updateOrderChannelSettings(storeId, { acceptCustomerNotes: next });
        window.UI.toast(next ? '고객 요청사항을 받기 시작해요' : '고객 요청사항을 받지 않아요');
        refresh();
      });
    }

    root.querySelector('#ocs-back').addEventListener('click', function () {
      window.Router.back();
    });

    refresh();
  }

  function unmount() {}

  window.Router.register('orderChannelSettings', { render: render, mount: mount, unmount: unmount });
})();
