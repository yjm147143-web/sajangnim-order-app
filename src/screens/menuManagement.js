/*
 * 메뉴 관리 화면 (목록 + 추가/수정 폼)
 * - 'menuManagement' : 카테고리 탭 + 메뉴 목록 (품절 토글 / 순서 변경)
 * - 'menuEdit'       : 메뉴 추가/수정 폼 (옵션그룹 편집 + 실시간 미리보기)
 *
 * 참고: 명세서에는 카테고리 자체를 관리하는 화면이 없어, 메뉴 폼에서 "새 카테고리 추가"를
 * 선택하면 이 화면 모듈 내부의 세션 한정 배열(extraCategories)에 임시로 등록해 탭/셀렉트에 반영한다.
 * mockApi.js에는 카테고리 생성 API가 없어 DB에 영구 저장하지 않으며, 대신 메뉴 아이템에는
 * categoryName 필드를 함께 저장해 새로고침 후에도 메뉴 목록에는 카테고리명이 표시되도록 한다.
 */
(function () {
  function esc(s) { return window.UI.escapeHtml(s); }
  function money(n) { return window.UI.formatMoney(n); }

  function currentStoreId() {
    var user = window.MockApi.getCurrentUser();
    return user && user.storeId;
  }

  // 세션 한정(새로고침 시 소실) 임시 카테고리 목록 — "새 카테고리 추가" 시 사용
  var extraCategories = [];

  function getAllCategories(storeId) {
    var registered = window.MockApi.getCategories(storeId);
    var extra = extraCategories.filter(function (c) { return c.storeId === storeId; });
    return registered.concat(extra);
  }

  /* =========================================================
   * 1) 메뉴 목록 화면 ('menuManagement')
   * ========================================================= */

  function tabsHtml(categories, selectedCategoryId) {
    if (!categories.length) return '';
    var html = '<div class="segment-tabs">';
    html += '<button type="button" class="segment-tab' + (selectedCategoryId === null ? ' active' : '') + '" data-cat="">전체</button>';
    categories.forEach(function (c) {
      html += '<button type="button" class="segment-tab' + (selectedCategoryId === c.id ? ' active' : '') + '" data-cat="' + c.id + '">' + esc(c.name) + '</button>';
    });
    html += '</div>';
    return html;
  }

  function menuRowHtml(item, categories, isSpecific) {
    var cat = categories.find(function (c) { return c.id === item.categoryId; });
    var catName = cat ? cat.name : (item.categoryName || '미분류');
    return (
      '<div class="menu-row" data-menu-id="' + item.id + '">' +
        '<div class="menu-row-thumb">' + (item.imageUrl ? '<img src="' + esc(item.imageUrl) + '" alt="" />' : '🍽️') + '</div>' +
        '<div class="menu-row-body">' +
          '<div class="menu-row-name">' + esc(item.name) +
            (item.soldOut ? ' <span class="badge badge-danger-soft">품절</span>' : '') +
            (item.exposed === false ? ' <span class="badge badge-neutral">미노출</span>' : '') +
          '</div>' +
          '<div class="menu-row-sub">' + esc(catName) + (item.description ? ' · ' + esc(item.description) : '') + '</div>' +
          '<div class="menu-row-price">' + money(item.price) + ' · 재고 ' + (item.stockQuantity != null ? item.stockQuantity + '개' : '-') + '</div>' +
        '</div>' +
        '<div class="menu-row-side">' +
          (isSpecific ?
            '<div class="menu-row-order-btns">' +
              '<button type="button" class="icon-btn-sm" data-action="move-up" data-menu-id="' + item.id + '">▲</button>' +
              '<button type="button" class="icon-btn-sm" data-action="move-down" data-menu-id="' + item.id + '">▼</button>' +
            '</div>' : ''
          ) +
          '<div class="menu-row-soldout-toggle">' +
            '<span class="menu-row-toggle-label">품절</span>' +
            '<button type="button" class="toggle' + (item.soldOut ? ' on' : '') + '" data-action="toggle-soldout" data-menu-id="' + item.id + '"><span class="toggle-knob"></span></button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function listBodyHtml(items, categories, isSpecific) {
    if (!items.length) {
      return '<div class="empty-state"><div class="empty-state-emoji">🍽️</div><div>등록된 메뉴가 없어요</div></div>';
    }
    return '<div class="menu-list">' + items.map(function (item) { return menuRowHtml(item, categories, isSpecific); }).join('') + '</div>';
  }

  function renderMenuList() {
    return (
      '<style>' +
        '.menu-list{padding-bottom:24px;}' +
        '.menu-row-soldout-toggle{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;}' +
        '.menu-row-toggle-label{font-size:var(--font-size-micro);color:var(--color-text-secondary);font-weight:700;}' +
        '.menu-add-btn{background:none;border:none;font-size:var(--font-size-body);font-weight:700;color:var(--color-text-primary);cursor:pointer;padding:8px;white-space:nowrap;}' +
      '</style>' +
      '<div class="topbar">' +
        '<div class="topbar-side"><button type="button" class="icon-btn" id="menu-back">←</button></div>' +
        '<div class="topbar-title">메뉴 관리</div>' +
        '<div class="topbar-side"><button type="button" class="menu-add-btn" id="menu-add-btn">+ 메뉴 추가</button></div>' +
      '</div>' +
      '<div class="screen-scroll"><div id="menu-list-wrap"></div></div>'
    );
  }

  function mountMenuList(root) {
    var storeId = currentStoreId();
    var selectedCategoryId = null; // null = 전체

    function refresh() {
      var categories = getAllCategories(storeId);
      var isSpecific = selectedCategoryId !== null;
      var items = window.MockApi.getMenuItems(storeId, isSpecific ? selectedCategoryId : undefined);
      var wrap = root.querySelector('#menu-list-wrap');
      wrap.innerHTML = tabsHtml(categories, selectedCategoryId) + listBodyHtml(items, categories, isSpecific);
    }

    root.querySelector('#menu-back').addEventListener('click', function () {
      window.Router.back();
    });
    root.querySelector('#menu-add-btn').addEventListener('click', function () {
      window.Router.showScreen('menuEdit', {});
    });

    root.addEventListener('click', function (e) {
      var toggleBtn = e.target.closest('[data-action="toggle-soldout"]');
      if (toggleBtn) {
        var tid = toggleBtn.getAttribute('data-menu-id');
        var item = window.MockApi.getMenuItem(tid);
        var next = !item.soldOut;
        window.MockApi.toggleSoldOut(tid, next);
        window.UI.toast(next ? '품절 처리했어요' : '판매중으로 변경했어요');
        refresh();
        return;
      }
      var moveBtn = e.target.closest('[data-action="move-up"],[data-action="move-down"]');
      if (moveBtn) {
        var mid = moveBtn.getAttribute('data-menu-id');
        var dir = moveBtn.getAttribute('data-action') === 'move-up' ? 'up' : 'down';
        window.MockApi.moveMenuItem(mid, dir);
        refresh();
        return;
      }
      var tabBtn = e.target.closest('[data-cat]');
      if (tabBtn) {
        var catVal = tabBtn.getAttribute('data-cat');
        selectedCategoryId = catVal ? catVal : null;
        refresh();
        return;
      }
      var row = e.target.closest('.menu-row[data-menu-id]');
      if (row) {
        window.Router.showScreen('menuEdit', { menuId: row.getAttribute('data-menu-id') });
      }
    });

    refresh();
  }

  window.Router.register('menuManagement', { render: renderMenuList, mount: mountMenuList, unmount: function () {} });

  /* =========================================================
   * 2) 메뉴 추가/수정 폼 화면 ('menuEdit')
   * ========================================================= */

  function buildInitialState(params) {
    params = params || {};
    var storeId = currentStoreId();
    if (params.menuId) {
      var item = window.MockApi.getMenuItem(params.menuId);
      return {
        isEdit: true,
        id: item.id,
        storeId: storeId,
        name: item.name || '',
        categoryId: item.categoryId || '',
        newCategoryName: '',
        price: item.price != null ? item.price : '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        origin: item.origin || '',
        nutritionInfo: item.nutritionInfo || '',
        allergyInfo: item.allergyInfo || '',
        stockQuantity: item.stockQuantity != null ? item.stockQuantity : '',
        autoSoldoutEnabled: item.autoSoldoutEnabled !== false,
        exposed: item.exposed !== false,
        soldOut: !!item.soldOut,
        useOptionGroups: !!(item.optionGroups && item.optionGroups.length),
        optionGroups: JSON.parse(JSON.stringify(item.optionGroups || [])),
      };
    }
    return {
      isEdit: false,
      id: null,
      storeId: storeId,
      name: '',
      categoryId: params.categoryId || '',
      newCategoryName: '',
      price: '',
      description: '',
      imageUrl: '',
      origin: '',
      nutritionInfo: '',
      allergyInfo: '',
      stockQuantity: '',
      autoSoldoutEnabled: true,
      exposed: true,
      soldOut: false,
      useOptionGroups: false,
      optionGroups: [],
    };
  }

  function categorySelectHtml(categories, state) {
    var options = '<option value="">선택해주세요</option>';
    categories.forEach(function (c) {
      options += '<option value="' + c.id + '"' + (state.categoryId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    });
    options += '<option value="__new__"' + (state.categoryId === '__new__' ? ' selected' : '') + '>+ 새 카테고리 추가</option>';
    return '<select class="input-field" id="category-select">' + options + '</select>';
  }

  function renderOptionGroupsList(state) {
    if (!state.optionGroups.length) {
      return '<div class="section-caption" style="padding:0 0 12px;">아직 추가된 옵션 그룹이 없어요</div>';
    }
    return state.optionGroups.map(function (g, gi) {
      var optionsHtml = (g.options || []).map(function (o, oi) {
        return (
          '<div class="option-row">' +
            '<input class="input-field" type="text" placeholder="옵션명" value="' + esc(o.name) + '" data-field="opt-name" data-group-idx="' + gi + '" data-opt-idx="' + oi + '" />' +
            '<input class="input-field" type="number" placeholder="추가 금액" value="' + (o.price || 0) + '" data-field="opt-price" data-group-idx="' + gi + '" data-opt-idx="' + oi + '" />' +
            '<button type="button" class="icon-btn-sm" data-action="remove-option" data-group-idx="' + gi + '" data-opt-idx="' + oi + '">✕</button>' +
          '</div>'
        );
      }).join('');
      return (
        '<div class="option-group-card">' +
          '<div class="option-group-head">' +
            '<input class="input-field" type="text" style="flex:1;height:44px;" placeholder="옵션 그룹명 (예: 사이즈)" value="' + esc(g.name) + '" data-field="group-name" data-group-idx="' + gi + '" />' +
            '<button type="button" class="icon-btn-sm" data-action="remove-group" data-group-idx="' + gi + '" style="margin-left:8px;">✕</button>' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
            '<button type="button" class="pill-btn' + (g.required ? ' active' : '') + '" data-action="toggle-required" data-group-idx="' + gi + '">' + (g.required ? '필수' : '선택') + '</button>' +
            '<button type="button" class="pill-btn' + (g.multiSelect ? ' active' : '') + '" data-action="toggle-multi" data-group-idx="' + gi + '">' + (g.multiSelect ? '복수선택 허용' : '단일선택') + '</button>' +
          '</div>' +
          optionsHtml +
          '<button type="button" class="btn btn-secondary btn-sm" data-action="add-option" data-group-idx="' + gi + '">+ 옵션 추가</button>' +
        '</div>'
      );
    }).join('');
  }

  function renderPreviewHtml(state) {
    var priceNum = Number(state.price) || 0;
    var previewSoldOut = (state.autoSoldoutEnabled && state.stockQuantity !== '' && Number(state.stockQuantity) <= 0) || !!state.soldOut;
    var classes = 'menu-preview-card' + (previewSoldOut ? ' menu-preview-soldout' : '') + (!state.exposed ? ' menu-edit-preview-hidden' : '');
    return (
      '<div class="' + classes + '">' +
        '<div class="menu-preview-image">' + (state.imageUrl ? '<img src="' + esc(state.imageUrl) + '" alt="" />' : '이미지 없음') + '</div>' +
        '<div class="menu-preview-body">' +
          '<div class="menu-preview-name">' + esc(state.name || '메뉴명을 입력해주세요') + '</div>' +
          (state.description ? '<div class="menu-preview-desc">' + esc(state.description) + '</div>' : '') +
          '<div class="menu-preview-price">' + money(priceNum) + '</div>' +
          (state.origin ? '<div class="menu-preview-origin">원산지 · ' + esc(state.origin) + '</div>' : '') +
          (state.nutritionInfo ? '<div class="menu-preview-origin">영양정보 · ' + esc(state.nutritionInfo) + '</div>' : '') +
          (state.allergyInfo ? '<div class="menu-preview-origin">알레르기 정보 · ' + esc(state.allergyInfo) + '</div>' : '') +
        '</div>' +
      '</div>' +
      (!state.exposed ? '<div class="section-caption" style="text-align:center;">고객 화면에 노출되지 않아요 (미노출 설정)</div>' : '')
    );
  }

  function validate(state) {
    if (!state.name || !state.name.trim()) return { field: 'name', message: '메뉴명 미입력' };
    if (!state.categoryId) return { field: 'category', message: '카테고리 미입력' };
    if (state.categoryId === '__new__' && (!state.newCategoryName || !state.newCategoryName.trim())) {
      return { field: 'category', message: '카테고리 미입력' };
    }
    if (state.price === '' || state.price === null || isNaN(Number(state.price)) || Number(state.price) <= 0) {
      return { field: 'price', message: '메뉴 가격 미입력' };
    }
    if (state.autoSoldoutEnabled) {
      if (state.stockQuantity === '' || state.stockQuantity === null || isNaN(Number(state.stockQuantity))) {
        return { field: 'stock', message: '재고 수량 미입력' };
      }
    }
    return null;
  }

  function doSave(state) {
    var categoryId = state.categoryId;
    var categoryName = null;
    if (categoryId === '__new__') {
      categoryName = state.newCategoryName.trim();
      categoryId = 'cat-custom-' + Date.now();
      extraCategories.push({ id: categoryId, storeId: state.storeId, name: categoryName, sortOrder: 999 });
    }

    var cleanGroups = [];
    if (state.useOptionGroups) {
      cleanGroups = state.optionGroups
        .filter(function (g) { return g.name && g.name.trim(); })
        .map(function (g) {
          return {
            id: g.id || ('og-' + Date.now() + Math.random().toString(36).slice(2, 6)),
            name: g.name.trim(),
            required: !!g.required,
            multiSelect: !!g.multiSelect,
            options: (g.options || [])
              .filter(function (o) { return o.name && o.name.trim(); })
              .map(function (o) { return { name: o.name.trim(), price: Number(o.price) || 0 }; }),
          };
        });
    }

    var payload = {
      name: state.name.trim(),
      categoryId: categoryId,
      price: Number(state.price),
      description: (state.description || '').trim(),
      imageUrl: (state.imageUrl || '').trim(),
      origin: (state.origin || '').trim(),
      nutritionInfo: (state.nutritionInfo || '').trim(),
      allergyInfo: (state.allergyInfo || '').trim(),
      stockQuantity: state.stockQuantity === '' ? 0 : Number(state.stockQuantity),
      autoSoldoutEnabled: !!state.autoSoldoutEnabled,
      exposed: !!state.exposed,
      optionGroups: cleanGroups,
    };
    if (categoryName) payload.categoryName = categoryName;

    var result = state.isEdit
      ? window.MockApi.updateMenuItem(state.id, payload)
      : window.MockApi.addMenuItem(state.storeId, payload);

    if (result.autoSoldoutTriggered && result.autoSoldoutTriggered.length) {
      window.UI.showModal({
        title: '자동 품절 처리',
        message: '재고가 모두 소진되어 자동으로 품절 처리되었어요',
        buttons: [{ label: '확인', variant: 'btn-primary', onClick: function () { window.Router.back(); } }],
      });
    } else {
      window.UI.toast('저장되었어요');
      window.Router.back();
    }
  }

  function renderMenuEdit(params) {
    var state = buildInitialState(params);
    var categories = getAllCategories(state.storeId);
    return (
      '<style>' +
        '.menu-edit-subcaption{font-size:var(--font-size-micro);color:var(--color-text-secondary);font-weight:500;display:block;margin-top:2px;}' +
        '.menu-edit-preview-hidden{opacity:0.45;}' +
        '.menu-edit-form-pad{padding:20px;}' +
        '.menu-image-upload-row{display:flex;align-items:center;gap:12px;}' +
        '.menu-image-thumb{width:64px;height:64px;border-radius:12px;background:var(--color-divider);display:flex;' +
          'align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;font-size:24px;}' +
        '.menu-image-thumb img{width:100%;height:100%;object-fit:cover;}' +
        '.menu-image-upload-actions{display:flex;flex-direction:column;align-items:flex-start;gap:4px;}' +
        '.menu-image-upload-actions label.btn{cursor:pointer;}' +
      '</style>' +
      '<div class="topbar">' +
        '<div class="topbar-side"><button type="button" class="icon-btn" id="edit-back">←</button></div>' +
        '<div class="topbar-title">' + (state.isEdit ? '메뉴 수정' : '메뉴 추가') + '</div>' +
        '<div class="topbar-side"></div>' +
      '</div>' +
      '<div class="screen-scroll">' +
        '<div class="menu-edit-form-pad">' +

          '<div class="input-group">' +
            '<div class="input-label">메뉴명</div>' +
            '<input class="input-field" type="text" id="f-name" placeholder="메뉴명을 입력해주세요" value="' + esc(state.name) + '" />' +
            '<div class="input-error" id="err-name" style="display:none;"></div>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">카테고리</div>' +
            categorySelectHtml(categories, state) +
            '<div class="input-error" id="err-category" style="display:none;"></div>' +
          '</div>' +
          '<div class="input-group" id="new-category-group" style="' + (state.categoryId === '__new__' ? '' : 'display:none;') + '">' +
            '<div class="input-label">새 카테고리명</div>' +
            '<input class="input-field" type="text" id="f-new-category" placeholder="새 카테고리명을 입력해주세요" value="' + esc(state.newCategoryName) + '" />' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">메뉴 가격</div>' +
            '<input class="input-field" type="number" id="f-price" placeholder="가격을 입력해주세요" value="' + (state.price === '' ? '' : state.price) + '" />' +
            '<div class="input-error" id="err-price" style="display:none;"></div>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">메뉴 설명</div>' +
            '<textarea class="input-field" id="f-desc" placeholder="메뉴 설명을 입력해주세요">' + esc(state.description) + '</textarea>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">메뉴 이미지</div>' +
            '<div class="menu-image-upload-row">' +
              '<div class="menu-image-thumb" id="menu-image-thumb">' +
                (state.imageUrl ? '<img src="' + esc(state.imageUrl) + '" alt="" />' : '<span>📷</span>') +
              '</div>' +
              '<div class="menu-image-upload-actions">' +
                '<label class="btn btn-outline btn-sm" for="f-image-file">사진 선택</label>' +
                (state.imageUrl ? '<button type="button" class="btn-text" id="remove-image-btn">이미지 삭제</button>' : '') +
              '</div>' +
              '<input type="file" accept="image/*" id="f-image-file" style="display:none;" />' +
            '</div>' +
            '<span class="menu-edit-subcaption">앨범에서 선택하거나 카메라로 바로 촬영할 수 있어요</span>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">원산지 (선택)</div>' +
            '<input class="input-field" type="text" id="f-origin" placeholder="원산지를 입력해주세요" value="' + esc(state.origin) + '" />' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">영양 정보 (선택)</div>' +
            '<textarea class="input-field" id="f-nutrition" placeholder="예: 열량 350kcal, 당류 20g">' + esc(state.nutritionInfo) + '</textarea>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">알레르기 정보 (선택)</div>' +
            '<textarea class="input-field" id="f-allergy" placeholder="예: 우유, 밀, 대두 함유">' + esc(state.allergyInfo) + '</textarea>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="toggle-row">' +
              '<div class="label-group" style="display:flex;flex-direction:column;">' +
                '<span class="input-label" style="margin:0;">자동 품절</span>' +
                '<span class="menu-edit-subcaption">재고가 0이 되면 자동으로 품절 처리해요</span>' +
              '</div>' +
              '<button type="button" class="toggle' + (state.autoSoldoutEnabled ? ' on' : '') + '" id="toggle-auto-soldout"><span class="toggle-knob"></span></button>' +
            '</div>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">재고 수량<span id="stock-required-hint" style="color:var(--color-accent-red);' + (state.autoSoldoutEnabled ? '' : 'display:none;') + '"> · 자동품절 ON 시 필수</span></div>' +
            '<input class="input-field" type="number" id="f-stock" placeholder="재고 수량을 입력해주세요" value="' + (state.stockQuantity === '' ? '' : state.stockQuantity) + '" />' +
            '<div class="input-error" id="err-stock" style="display:none;"></div>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="toggle-row">' +
              '<span class="input-label" style="margin:0;">메뉴 노출</span>' +
              '<button type="button" class="toggle' + (state.exposed ? ' on' : '') + '" id="toggle-exposed"><span class="toggle-knob"></span></button>' +
            '</div>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="toggle-row">' +
              '<span class="input-label" style="margin:0;">옵션 그룹 사용</span>' +
              '<button type="button" class="toggle' + (state.useOptionGroups ? ' on' : '') + '" data-action="toggle-use-option-groups"><span class="toggle-knob"></span></button>' +
            '</div>' +
            '<div id="option-groups-wrap" style="margin-top:12px;' + (state.useOptionGroups ? '' : 'display:none;') + '">' +
              '<div id="option-groups-list">' + renderOptionGroupsList(state) + '</div>' +
              '<button type="button" class="btn btn-outline btn-sm" data-action="add-group">+ 옵션 그룹 추가</button>' +
            '</div>' +
          '</div>' +

          '<div class="input-group">' +
            '<div class="input-label">고객 화면 미리보기</div>' +
            '<div id="menu-preview-container">' + renderPreviewHtml(state) + '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +
      '<div class="cta-fixed">' +
        '<div class="input-error" id="err-general" style="display:none;margin-bottom:8px;text-align:center;"></div>' +
        '<button type="button" class="btn btn-primary" id="save-btn">저장</button>' +
      '</div>'
    );
  }

  function mountMenuEdit(root, params) {
    var state = buildInitialState(params);

    function updatePreview() {
      root.querySelector('#menu-preview-container').innerHTML = renderPreviewHtml(state);
    }

    function clearErrors() {
      ['name', 'category', 'price', 'stock', 'general'].forEach(function (key) {
        var el = root.querySelector('#err-' + key);
        if (el) { el.style.display = 'none'; el.textContent = ''; }
      });
    }

    function showError(field, msg) {
      var el = root.querySelector('#err-' + field);
      if (!el) el = root.querySelector('#err-general');
      el.textContent = msg;
      el.style.display = 'block';
    }

    root.querySelector('#edit-back').addEventListener('click', function () {
      window.Router.back();
    });

    root.querySelector('#f-name').addEventListener('input', function (e) { state.name = e.target.value; updatePreview(); });
    root.querySelector('#f-price').addEventListener('input', function (e) { state.price = e.target.value; updatePreview(); });
    root.querySelector('#f-desc').addEventListener('input', function (e) { state.description = e.target.value; updatePreview(); });
    root.querySelector('#f-origin').addEventListener('input', function (e) { state.origin = e.target.value; updatePreview(); });
    root.querySelector('#f-nutrition').addEventListener('input', function (e) { state.nutritionInfo = e.target.value; updatePreview(); });
    root.querySelector('#f-allergy').addEventListener('input', function (e) { state.allergyInfo = e.target.value; updatePreview(); });
    root.querySelector('#f-stock').addEventListener('input', function (e) { state.stockQuantity = e.target.value; updatePreview(); });

    function updateImageUI() {
      root.querySelector('#menu-image-thumb').innerHTML = state.imageUrl
        ? '<img src="' + esc(state.imageUrl) + '" alt="" />'
        : '<span>📷</span>';
      var removeBtn = root.querySelector('#remove-image-btn');
      if (state.imageUrl && !removeBtn) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn-text'; btn.id = 'remove-image-btn'; btn.textContent = '이미지 삭제';
        btn.addEventListener('click', function () { state.imageUrl = ''; updateImageUI(); updatePreview(); });
        root.querySelector('.menu-image-upload-actions').appendChild(btn);
      } else if (!state.imageUrl && removeBtn) {
        removeBtn.remove();
      }
    }
    root.querySelector('#f-image-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        state.imageUrl = ev.target.result;
        updateImageUI();
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
    var initialRemoveBtn = root.querySelector('#remove-image-btn');
    if (initialRemoveBtn) {
      initialRemoveBtn.addEventListener('click', function () { state.imageUrl = ''; updateImageUI(); updatePreview(); });
    }

    var newCategoryInput = root.querySelector('#f-new-category');
    if (newCategoryInput) {
      newCategoryInput.addEventListener('input', function (e) { state.newCategoryName = e.target.value; });
    }

    root.querySelector('#category-select').addEventListener('change', function (e) {
      state.categoryId = e.target.value;
      root.querySelector('#new-category-group').style.display = (state.categoryId === '__new__') ? '' : 'none';
    });

    var autoToggle = root.querySelector('#toggle-auto-soldout');
    autoToggle.addEventListener('click', function () {
      state.autoSoldoutEnabled = !state.autoSoldoutEnabled;
      autoToggle.classList.toggle('on', state.autoSoldoutEnabled);
      var hint = root.querySelector('#stock-required-hint');
      if (hint) hint.style.display = state.autoSoldoutEnabled ? '' : 'none';
      updatePreview();
    });

    var exposedToggle = root.querySelector('#toggle-exposed');
    exposedToggle.addEventListener('click', function () {
      state.exposed = !state.exposed;
      exposedToggle.classList.toggle('on', state.exposed);
      updatePreview();
    });

    var useGroupsToggle = root.querySelector('[data-action="toggle-use-option-groups"]');
    useGroupsToggle.addEventListener('click', function () {
      state.useOptionGroups = !state.useOptionGroups;
      useGroupsToggle.classList.toggle('on', state.useOptionGroups);
      root.querySelector('#option-groups-wrap').style.display = state.useOptionGroups ? '' : 'none';
    });

    function renderGroupsList() {
      root.querySelector('#option-groups-list').innerHTML = renderOptionGroupsList(state);
    }

    var groupsWrap = root.querySelector('#option-groups-wrap');

    groupsWrap.addEventListener('click', function (e) {
      var addGroupBtn = e.target.closest('[data-action="add-group"]');
      if (addGroupBtn) {
        state.optionGroups.push({ id: 'og-' + Date.now() + Math.random().toString(36).slice(2, 6), name: '', required: false, multiSelect: false, options: [] });
        renderGroupsList();
        return;
      }
      var removeGroupBtn = e.target.closest('[data-action="remove-group"]');
      if (removeGroupBtn) {
        state.optionGroups.splice(Number(removeGroupBtn.getAttribute('data-group-idx')), 1);
        renderGroupsList();
        return;
      }
      var addOptionBtn = e.target.closest('[data-action="add-option"]');
      if (addOptionBtn) {
        var giAdd = Number(addOptionBtn.getAttribute('data-group-idx'));
        state.optionGroups[giAdd].options.push({ name: '', price: 0 });
        renderGroupsList();
        return;
      }
      var removeOptionBtn = e.target.closest('[data-action="remove-option"]');
      if (removeOptionBtn) {
        var giRem = Number(removeOptionBtn.getAttribute('data-group-idx'));
        var oiRem = Number(removeOptionBtn.getAttribute('data-opt-idx'));
        state.optionGroups[giRem].options.splice(oiRem, 1);
        renderGroupsList();
        return;
      }
      var reqBtn = e.target.closest('[data-action="toggle-required"]');
      if (reqBtn) {
        var giReq = Number(reqBtn.getAttribute('data-group-idx'));
        state.optionGroups[giReq].required = !state.optionGroups[giReq].required;
        renderGroupsList();
        return;
      }
      var multiBtn = e.target.closest('[data-action="toggle-multi"]');
      if (multiBtn) {
        var giMulti = Number(multiBtn.getAttribute('data-group-idx'));
        state.optionGroups[giMulti].multiSelect = !state.optionGroups[giMulti].multiSelect;
        renderGroupsList();
        return;
      }
    });

    groupsWrap.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('[data-field="group-name"]')) {
        state.optionGroups[Number(t.getAttribute('data-group-idx'))].name = t.value;
      } else if (t.matches('[data-field="opt-name"]')) {
        state.optionGroups[Number(t.getAttribute('data-group-idx'))].options[Number(t.getAttribute('data-opt-idx'))].name = t.value;
      } else if (t.matches('[data-field="opt-price"]')) {
        state.optionGroups[Number(t.getAttribute('data-group-idx'))].options[Number(t.getAttribute('data-opt-idx'))].price = Number(t.value) || 0;
      }
    });

    root.querySelector('#save-btn').addEventListener('click', function () {
      clearErrors();
      var err = validate(state);
      if (err) { showError(err.field, err.message); return; }
      doSave(state);
    });
  }

  window.Router.register('menuEdit', { render: renderMenuEdit, mount: mountMenuEdit, unmount: function () {} });
})();
