/*
 * 개발자 핀 버튼 (QA/데모용, 실제 제품 화면이 아님)
 * - 새 주문 5개 추가: 신규 주문이 실시간으로 들어오는 상황을 시뮬레이션
 * - 오프라인 시뮬레이션: 네트워크 단절 상태(주문 화면의 오프라인 배너/버튼 비활성화)를 켜고 끌 수 있음
 *   (실제 navigator.onLine을 바꿀 수 없으므로, window 'offline'/'online' 이벤트를 직접 발생시켜
 *    order.js가 이미 갖고 있는 오프라인 처리 로직을 그대로 재사용한다)
 */
(function () {
  var STYLE = '' +
    '#dev-pin-btn{position:absolute;left:14px;bottom:96px;width:48px;height:48px;border-radius:50%;' +
    'background:#1a1a2e;border:2px dashed #7c5cff;color:#fff;font-size:20px;display:none;' +
    'align-items:center;justify-content:center;cursor:pointer;z-index:70;box-shadow:0 4px 14px rgba(0,0,0,0.35);}' +
    '#dev-pin-btn.show{display:flex;}' +
    '#dev-pin-btn:active{transform:scale(0.94);}' +
    '#dev-pin-menu{position:absolute;left:14px;bottom:150px;min-width:220px;background:#1a1a2e;color:#fff;' +
    'border:1px solid #7c5cff;border-radius:14px;padding:8px;z-index:71;display:none;' +
    'box-shadow:0 8px 24px rgba(0,0,0,0.4);}' +
    '#dev-pin-menu.show{display:block;}' +
    '#dev-pin-menu .dev-pin-title{font-size:11px;font-weight:700;color:#7c5cff;padding:6px 10px 4px;letter-spacing:0.5px;}' +
    '#dev-pin-menu button{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;' +
    'border:none;color:#fff;font-size:13px;font-weight:600;padding:10px;border-radius:8px;cursor:pointer;}' +
    '#dev-pin-menu button:active{background:rgba(255,255,255,0.12);}' +
    '#dev-pin-menu .dev-pin-sub{font-size:11px;color:#a9a9c7;font-weight:500;margin-top:1px;}';

  var simulatedOffline = false;

  function isOffline() { return simulatedOffline; }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstElementChild;
  }

  function menuHtml() {
    return (
      '<div class="dev-pin-title">🛠️ 개발자 도구</div>' +
      '<button type="button" id="dev-pin-add-orders">' +
        '<span>🧾</span><span><div>새 주문 5개 추가</div><div class="dev-pin-sub">대기 탭에 예약 주문 2건 + 현장 주문 3건 생성</div></span>' +
      '</button>' +
      '<button type="button" id="dev-pin-toggle-offline">' +
        '<span>' + (simulatedOffline ? '🟢' : '📶') + '</span>' +
        '<span><div>' + (simulatedOffline ? '온라인으로 복귀' : '오프라인 시뮬레이션') + '</div>' +
        '<div class="dev-pin-sub">' + (simulatedOffline ? '현재 오프라인 상태로 시뮬레이션 중' : '네트워크 단절 상태를 재현') + '</div></span>' +
      '</button>'
    );
  }

  function currentOwnerContext() {
    var user = window.MockApi.getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'STAFF')) return null;
    return user;
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    var frame = document.querySelector('.device-frame');
    if (!frame) return;

    var btn = el('<button type="button" id="dev-pin-btn" aria-label="개발자 도구">🛠️</button>');
    var menu = el('<div id="dev-pin-menu"></div>');
    frame.appendChild(btn);
    frame.appendChild(menu);

    function closeMenu() { menu.classList.remove('show'); }
    function openMenu() {
      menu.innerHTML = menuHtml();
      menu.classList.add('show');
      bindMenuEvents();
    }

    function bindMenuEvents() {
      var addBtn = menu.querySelector('#dev-pin-add-orders');
      var offlineBtn = menu.querySelector('#dev-pin-toggle-offline');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          var user = currentOwnerContext();
          if (!user) {
            window.UI.toast('사장님/직원 계정에서만 사용할 수 있어요');
            closeMenu();
            return;
          }
          var created = window.MockApi.seedRandomOrders(user.storeId, 5, 2);
          window.dispatchEvent(new CustomEvent('mock:orders-changed', { detail: { storeId: user.storeId } }));
          window.UI.toast('새 주문 ' + created.length + '건을 추가했어요 (예약 2 · 현장 3)');
          closeMenu();
        });
      }
      if (offlineBtn) {
        offlineBtn.addEventListener('click', function () {
          simulatedOffline = !simulatedOffline;
          window.dispatchEvent(new Event(simulatedOffline ? 'offline' : 'online'));
          window.UI.toast(simulatedOffline ? '오프라인 상태를 시뮬레이션해요' : '온라인 상태로 되돌렸어요');
          openMenu(); // 라벨 갱신을 위해 다시 그림
        });
      }
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('show')) closeMenu();
      else openMenu();
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== btn) closeMenu();
    });

    function refreshVisibility() {
      btn.classList.toggle('show', !!currentOwnerContext());
      if (!currentOwnerContext()) closeMenu();
    }
    refreshVisibility();
    setInterval(refreshVisibility, 800);
  }

  window.DevTools = { isOffline: isOffline };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
