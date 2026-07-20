/*
 * 직원 계정 관리 화면
 * - 계정 목록 (사용 여부 토글 포함)
 * - 직원 계정 생성 (바텀시트)
 */
(function () {
  function periodLabel(u) {
    if (u.periodType === 'RANGE' && u.periodStart && u.periodEnd) {
      return u.periodStart + ' ~ ' + u.periodEnd;
    }
    return '상시';
  }

  function staffRowHtml(u) {
    const sub = [u.loginId, window.UI.formatContact(u.phone), periodLabel(u)]
      .filter(function (v) { return v; })
      .map(function (v) { return window.UI.escapeHtml(v); })
      .join(' · ');
    return (
      '<div class="card-list-item" style="cursor:default;">' +
        '<div class="label-group">' +
          '<div class="label-title">' + window.UI.escapeHtml(u.name) + '</div>' +
          '<div class="label-sub">' + sub + '</div>' +
        '</div>' +
        '<button type="button" class="toggle' + (u.active ? ' on' : '') + '" data-toggle-id="' + u.id + '" aria-label="계정 사용 여부">' +
          '<span class="toggle-knob"></span>' +
        '</button>' +
      '</div>'
    );
  }

  function renderStaffListHtml(storeId) {
    const list = window.MockApi.getStaffAccounts(storeId);
    if (!list.length) {
      return '<div class="empty-state"><div class="empty-state-emoji">🧑‍🍳</div><div>등록된 직원 계정이 없어요</div></div>';
    }
    return '<div class="staff-list">' + list.map(staffRowHtml).join('') + '</div>';
  }

  function permissionNoticeHtml() {
    return (
      '<div class="permission-notice">' +
        '<div class="permission-notice-title">🔒 자동 \'직원\' 권한이 부여돼요</div>' +
        '<div class="permission-notice-body">이 계정은 주문 처리만 가능해요. 매출·환불·정산·메뉴 변경 같은 운영 기능은 사장님 본인 계정에서만 쓸 수 있어요.</div>' +
      '</div>'
    );
  }

  function createSheetHtml() {
    return (
      '<div class="sheet-title">직원 계정 추가</div>' +
      '<div class="input-group">' +
        '<div class="input-label">직원명</div>' +
        '<input class="input-field" type="text" id="staff-name" placeholder="직원 이름" />' +
        '<div class="input-error" id="err-staff-name" style="display:none;"></div>' +
      '</div>' +
      '<div class="input-group">' +
        '<div class="input-label">로그인 ID</div>' +
        '<input class="input-field" type="text" id="staff-loginid" placeholder="로그인에 사용할 아이디" autocomplete="off" />' +
        '<div class="input-error" id="err-staff-loginid" style="display:none;"></div>' +
      '</div>' +
      '<div class="input-group">' +
        '<div class="input-label">비밀번호</div>' +
        '<input class="input-field" type="password" id="staff-password" placeholder="비밀번호" autocomplete="new-password" />' +
        '<div class="input-error" id="err-staff-password" style="display:none;"></div>' +
      '</div>' +
      '<div class="input-group">' +
        '<div class="input-label">핸드폰 번호</div>' +
        '<input class="input-field" type="tel" id="staff-phone" placeholder="010-0000-0000" />' +
      '</div>' +
      '<div class="input-group">' +
        '<div class="input-label">이메일</div>' +
        '<input class="input-field" type="email" id="staff-email" placeholder="example@email.com" />' +
        '<div class="input-help-caption">비밀번호 찾기 · 계정 안내 발송에 사용돼요</div>' +
      '</div>' +
      '<div class="input-group">' +
        '<div class="input-label">계정 사용 기간</div>' +
        '<div class="period-toggle">' +
          '<button type="button" class="segment-tab active" data-period="ALWAYS" id="period-btn-always">상시</button>' +
          '<button type="button" class="segment-tab" data-period="RANGE" id="period-btn-range">기간 설정</button>' +
        '</div>' +
        '<div class="period-range-fields" id="period-range-fields" style="display:none;">' +
          '<input class="input-field" type="date" id="staff-period-start" />' +
          '<span class="period-range-sep">~</span>' +
          '<input class="input-field" type="date" id="staff-period-end" />' +
        '</div>' +
      '</div>' +
      permissionNoticeHtml() +
      '<div class="input-error" id="staff-form-error" style="display:none;margin-top:10px;"></div>' +
      '<button type="button" class="btn btn-primary" id="staff-save-btn" style="margin-top:14px;">저장</button>'
    );
  }

  function openCreateSheet(storeId, onCreated) {
    window.UI.showBottomSheet(createSheetHtml(), function (host) {
      let periodType = 'ALWAYS';
      const nameInput = host.querySelector('#staff-name');
      const loginIdInput = host.querySelector('#staff-loginid');
      const pwInput = host.querySelector('#staff-password');
      const phoneInput = host.querySelector('#staff-phone');
      const emailInput = host.querySelector('#staff-email');
      const alwaysBtn = host.querySelector('#period-btn-always');
      const rangeBtn = host.querySelector('#period-btn-range');
      const rangeFields = host.querySelector('#period-range-fields');
      const startInput = host.querySelector('#staff-period-start');
      const endInput = host.querySelector('#staff-period-end');
      const formError = host.querySelector('#staff-form-error');
      const saveBtn = host.querySelector('#staff-save-btn');

      function clearFieldErrors() {
        ['#err-staff-name', '#err-staff-loginid', '#err-staff-password'].forEach(function (sel) {
          const el = host.querySelector(sel);
          el.style.display = 'none';
          el.textContent = '';
        });
        formError.style.display = 'none';
        formError.textContent = '';
      }

      function showFieldError(sel, msg) {
        const el = host.querySelector(sel);
        el.textContent = msg;
        el.style.display = 'block';
      }

      alwaysBtn.addEventListener('click', function () {
        periodType = 'ALWAYS';
        alwaysBtn.classList.add('active');
        rangeBtn.classList.remove('active');
        rangeFields.style.display = 'none';
      });
      rangeBtn.addEventListener('click', function () {
        periodType = 'RANGE';
        rangeBtn.classList.add('active');
        alwaysBtn.classList.remove('active');
        rangeFields.style.display = 'flex';
      });

      saveBtn.addEventListener('click', function () {
        clearFieldErrors();
        const name = nameInput.value.trim();
        const loginId = loginIdInput.value.trim();
        const password = pwInput.value;
        let hasError = false;

        if (!name) { showFieldError('#err-staff-name', '직원명을 입력해주세요.'); hasError = true; }
        if (!loginId) { showFieldError('#err-staff-loginid', '로그인 ID를 입력해주세요.'); hasError = true; }
        if (!password) { showFieldError('#err-staff-password', '비밀번호를 입력해주세요.'); hasError = true; }

        if (periodType === 'RANGE' && (!startInput.value || !endInput.value)) {
          formError.textContent = '기간 설정을 선택했다면 시작일과 종료일을 모두 입력해주세요.';
          formError.style.display = 'block';
          hasError = true;
        }

        if (hasError) return;

        const payload = {
          name: name,
          loginId: loginId,
          password: password,
          phone: phoneInput.value.trim(),
          email: emailInput.value.trim(),
          periodType: periodType,
          periodStart: periodType === 'RANGE' ? startInput.value : null,
          periodEnd: periodType === 'RANGE' ? endInput.value : null,
        };

        window.MockApi.createStaffAccount(storeId, payload);
        window.UI.closeModal();
        window.UI.toast('직원 계정을 추가했어요');
        onCreated();
      });
    });
  }

  function render() {
    const user = window.MockApi.getCurrentUser();
    const storeId = user.storeId;
    return (
      '<style>' +
      '.staff-list{padding:0 var(--space-5) var(--space-5);display:flex;flex-direction:column;gap:var(--space-2);}' +
      '.permission-notice{background:#eef4ff;border:1px solid #cfe3ff;border-radius:var(--radius-card);padding:var(--space-4);margin-top:var(--space-2);}' +
      '.permission-notice-title{font-size:var(--font-size-body);font-weight:800;margin-bottom:6px;}' +
      '.permission-notice-body{font-size:var(--font-size-caption);color:var(--color-text-secondary);line-height:1.5;}' +
      '.period-toggle{display:flex;gap:8px;}' +
      '.period-toggle .segment-tab{flex:1;}' +
      '.period-range-fields{display:none;align-items:center;gap:8px;margin-top:10px;}' +
      '.period-range-fields .input-field{flex:1;height:44px;}' +
      '.period-range-sep{color:var(--color-text-secondary);flex-shrink:0;}' +
      '.input-help-caption{font-size:var(--font-size-micro);color:var(--color-text-secondary);}' +
      '</style>' +
      '<div class="topbar">' +
        '<div class="topbar-side"><button type="button" class="icon-btn" id="staff-back-btn" aria-label="뒤로가기">←</button></div>' +
        '<div class="topbar-title">직원 계정 관리</div>' +
        '<div class="topbar-side"><button type="button" class="pill-btn active" id="staff-add-btn">+ 직원 추가</button></div>' +
      '</div>' +
      '<div class="screen-scroll">' +
        '<div class="section-title">계정 목록</div>' +
        '<div id="staff-list-wrap">' + renderStaffListHtml(storeId) + '</div>' +
      '</div>'
    );
  }

  function mount(root) {
    const user = window.MockApi.getCurrentUser();
    const storeId = user.storeId;
    const listWrap = root.querySelector('#staff-list-wrap');

    function bindListEvents() {
      listWrap.querySelectorAll('[data-toggle-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const id = btn.getAttribute('data-toggle-id');
          const nextActive = !btn.classList.contains('on');
          window.MockApi.toggleStaffActive(id, nextActive);
          btn.classList.toggle('on', nextActive);
          window.UI.toast(nextActive ? '계정을 활성화했어요' : '계정을 비활성화했어요');
        });
      });
    }

    function refreshList() {
      listWrap.innerHTML = renderStaffListHtml(storeId);
      bindListEvents();
    }

    root.querySelector('#staff-back-btn').addEventListener('click', function () {
      window.Router.showScreen('settings');
    });
    root.querySelector('#staff-add-btn').addEventListener('click', function () {
      openCreateSheet(storeId, refreshList);
    });

    bindListEvents();
  }

  function unmount() {}

  window.Router.register('staffAccounts', { render: render, mount: mount, unmount: unmount });
})();
