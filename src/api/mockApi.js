/*
 * Mock API 레이어 — 모든 화면은 이 함수들만 호출한다.
 * 실제 백엔드 연동 시 함수 시그니처는 유지한 채 본문만 fetch(real endpoint)로 교체하면 된다.
 */
(function () {
  let DB = window.MockDB.load();

  function persist() { window.MockDB.save(DB); }
  function uid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 9); }
  function findUser(loginId) { return DB.users.find(function (u) { return u.loginId === loginId; }); }
  function findStore(id) { return DB.stores.find(function (s) { return s.id === id; }); }

  // ---------------- Session ----------------
  const SESSION_KEY = 'order-app-session';
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }
  function setSession(userId) { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: userId })); }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    return DB.users.find(function (u) { return u.id === s.userId; }) || null;
  }

  function getAutoLogin() { return localStorage.getItem('order-app-auto-login') || null; }
  function setAutoLogin(loginId) {
    if (loginId) localStorage.setItem('order-app-auto-login', loginId);
    else localStorage.removeItem('order-app-auto-login');
  }

  function login(params) {
    const role = params.role, loginId = (params.loginId || '').trim(), password = params.password || '';
    if (!loginId) return { ok: false, message: '아이디를 입력해주세요.' };
    if (!password) return { ok: false, message: '비밀번호를 입력해주세요.' };
    const user = findUser(loginId);
    if (!user || user.password !== password) return { ok: false, message: '아이디 또는 비밀번호가 올바르지 않아요.' };
    if (user.role === 'STAFF' && user.active === false) return { ok: false, message: '아이디 또는 비밀번호가 올바르지 않아요.' };
    const boardRole = user.role === 'STAFF' ? 'OWNER' : user.role;
    if (boardRole !== role) {
      return { ok: false, message: role === 'OWNER' ? '사장님 계정이 아닙니다' : '행사 담당자 계정이 아닙니다' };
    }
    setSession(user.id);
    if (params.autoLogin) setAutoLogin(loginId); else setAutoLogin(null);
    return { ok: true, user: user };
  }

  function logout() { clearSession(); }

  // ---------------- Store / Settings ----------------
  function getStore(storeId) { return findStore(storeId); }

  function updateOperatingStatus(storeId, status) {
    const store = findStore(storeId);
    store.operatingStatus = status;
    store.statusChangedAt = new Date().toISOString();
    persist();
    return store;
  }

  function updateAutoAccept(storeId, enabled) {
    const store = findStore(storeId);
    store.autoAcceptOrders = enabled;
    persist();
    return store;
  }

  function getCustomerGuideSettings(storeId) {
    const store = findStore(storeId);
    return {
      displayMode: store.guideDisplayMode || 'time',
      cookTimeBase: store.cookTimeBase != null ? store.cookTimeBase : 10,
      cookTimeMarginal: store.cookTimeMarginal != null ? store.cookTimeMarginal : 2,
      cookTimeBatch: store.cookTimeBatch != null ? store.cookTimeBatch : 6,
      hasHelper: !!store.cookHasHelper,
      helperCount: store.cookHelperCount != null ? store.cookHelperCount : 1,
      bufferMinutes: store.cookBufferMinutes != null ? store.cookBufferMinutes : 2,
    };
  }

  function updateCustomerGuideSettings(storeId, payload) {
    const store = findStore(storeId);
    if (payload.displayMode !== undefined) store.guideDisplayMode = payload.displayMode;
    if (payload.cookTimeBase !== undefined) store.cookTimeBase = payload.cookTimeBase;
    if (payload.cookTimeMarginal !== undefined) store.cookTimeMarginal = payload.cookTimeMarginal;
    if (payload.cookTimeBatch !== undefined) store.cookTimeBatch = payload.cookTimeBatch;
    if (payload.hasHelper !== undefined) store.cookHasHelper = payload.hasHelper;
    if (payload.helperCount !== undefined) store.cookHelperCount = payload.helperCount;
    if (payload.bufferMinutes !== undefined) store.cookBufferMinutes = payload.bufferMinutes;
    persist();
    return getCustomerGuideSettings(storeId);
  }

  function getQrMenuInfo(storeId) {
    const store = findStore(storeId);
    return { url: window.AppConfig.QR_ORDER_BASE_URL + storeId, storeName: store.name };
  }

  // ---------------- Menu ----------------
  function getCategories(storeId) {
    return DB.categories.filter(function (c) { return c.storeId === storeId; }).sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  function getMenuItems(storeId, categoryId) {
    let list = DB.menuItems.filter(function (m) { return m.storeId === storeId; });
    if (categoryId) list = list.filter(function (m) { return m.categoryId === categoryId; });
    return list.sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  function getMenuItem(id) { return DB.menuItems.find(function (m) { return m.id === id; }); }

  function checkAutoSoldout(item) {
    if (item.autoSoldoutEnabled && item.stockQuantity <= 0) { item.soldOut = true; return true; }
    return false;
  }

  function addMenuItem(storeId, payload) {
    const maxOrder = Math.max(0, ...DB.menuItems.filter(function (m) { return m.storeId === storeId && m.categoryId === payload.categoryId; }).map(function (m) { return m.sortOrder; }));
    const item = Object.assign({ id: uid('menu'), storeId: storeId, soldOut: false, sortOrder: maxOrder + 1, optionGroups: [] }, payload);
    const triggered = checkAutoSoldout(item);
    DB.menuItems.push(item);
    persist();
    return { item: item, autoSoldoutTriggered: triggered ? [item.name] : [] };
  }

  function updateMenuItem(id, payload) {
    const item = getMenuItem(id);
    Object.assign(item, payload);
    const triggered = checkAutoSoldout(item);
    persist();
    return { item: item, autoSoldoutTriggered: triggered ? [item.name] : [] };
  }

  function toggleSoldOut(id, soldOut) {
    const item = getMenuItem(id);
    item.soldOut = soldOut;
    persist();
    return item;
  }

  function moveMenuItem(id, direction) {
    const item = getMenuItem(id);
    const siblings = getMenuItems(item.storeId, item.categoryId);
    const idx = siblings.findIndex(function (m) { return m.id === id; });
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return item;
    const other = siblings[swapIdx];
    const tmp = item.sortOrder; item.sortOrder = other.sortOrder; other.sortOrder = tmp;
    persist();
    return item;
  }

  // ---------------- Staff ----------------
  function getStaffAccounts(storeId) {
    return DB.users.filter(function (u) { return u.role === 'STAFF' && u.storeId === storeId; });
  }

  function createStaffAccount(storeId, payload) {
    const user = Object.assign({ id: uid('user'), role: 'STAFF', storeId: storeId, active: true, periodType: 'ALWAYS', periodStart: null, periodEnd: null }, payload);
    DB.users.push(user);
    persist();
    return user;
  }

  function toggleStaffActive(id, active) {
    const user = DB.users.find(function (u) { return u.id === id; });
    user.active = active;
    persist();
    return user;
  }

  // ---------------- Orders ----------------
  function getOrder(id) { return DB.orders.find(function (o) { return o.id === id; }); }

  function getOrders(storeId, opts) {
    opts = opts || {};
    let list = DB.orders.filter(function (o) { return o.storeId === storeId; });
    if (opts.status) list = list.filter(function (o) { return o.status === opts.status; });
    if (opts.menuFilter) list = list.filter(function (o) { return o.items.some(function (it) { return it.menuName === opts.menuFilter; }); });
    if (opts.search) {
      const q = opts.search.trim();
      list = list.filter(function (o) { return o.pickupNo.indexOf(q) !== -1; });
    }
    list = list.slice().sort(function (a, b) {
      const ta = new Date(a.orderedAt).getTime(), tb = new Date(b.orderedAt).getTime();
      return opts.sortDir === 'asc' ? ta - tb : tb - ta;
    });
    return list;
  }

  function acceptOrder(id) {
    const o = getOrder(id);
    o.status = 'PROCESSING';
    o.acceptedAt = new Date().toISOString();
    persist();
    return { order: o, notification: '주문 완료' };
  }

  function cancelOrder(id, reason) {
    const o = getOrder(id);
    o.status = 'DONE';
    o.canceled = true;
    o.cancelReason = reason;
    o.cancelType = 'CANCEL';
    o.doneAt = new Date().toISOString();
    persist();
    return { order: o, notification: '주문 취소' };
  }

  function callCustomer(id) {
    const o = getOrder(id);
    o.called = true;
    o.calledCount = (o.calledCount || 0) + 1;
    persist();
    return { order: o, notification: '픽업 안내' };
  }

  function completeOrder(id) {
    const o = getOrder(id);
    o.status = 'DONE';
    o.completeCount = (o.completeCount || 0) + 1;
    o.doneAt = new Date().toISOString();
    persist();
    return { order: o };
  }

  function cancelPayment(id, reason) {
    const o = getOrder(id);
    o.status = 'DONE';
    o.canceled = true;
    o.cancelReason = reason;
    o.cancelType = 'PAYMENT_CANCEL';
    o.doneAt = new Date().toISOString();
    persist();
    return { order: o, notification: '결제 취소' };
  }

  function revertOrder(id) {
    const o = getOrder(id);
    o.status = 'PROCESSING';
    o.canceled = false;
    o.cancelReason = null;
    o.cancelType = null;
    persist();
    return { order: o };
  }

  function returnOrder(id, reason) {
    const o = getOrder(id);
    o.canceled = true;
    o.cancelReason = reason;
    o.cancelType = 'RETURN';
    persist();
    return { order: o, notification: '반품' };
  }

  function bulkAction(ids, action, extra) {
    const results = ids.map(function (id) {
      if (action === 'accept') return acceptOrder(id);
      if (action === 'call') return callCustomer(id);
      if (action === 'complete') return completeOrder(id);
      return null;
    });
    return results;
  }

  // ---------------- Sales (사장님) ----------------
  function ordersFor(storeId) { return DB.orders.filter(function (o) { return o.storeId === storeId; }); }

  function getSalesByChannel(storeId) {
    const store = findStore(storeId);
    const done = ordersFor(storeId).filter(function (o) { return o.status === 'DONE' && !o.canceled; });
    const qr = done.filter(function (o) { return o.channel === 'QR'; });
    const tablet = done.filter(function (o) { return o.channel === 'TABLET'; });
    const qrAmount = qr.reduce(function (s, o) { return s + o.amount; }, 0);
    const tabletAmount = tablet.reduce(function (s, o) { return s + o.amount; }, 0);
    return [
      { name: 'QR오더', amount: qrAmount + Math.round(store.todaySalesAmount ? 0 : 0), count: qr.length },
      { name: '태블릿오더', amount: tabletAmount, count: tablet.length },
      { name: '현금', amount: store.cashSalesAmount || 0, count: store.cashOrderCount || 0 },
    ];
  }

  function getSalesByPayment(storeId) {
    const store = findStore(storeId);
    const stats = store.salesStats && store.salesStats.byPayment;
    if (!stats) return [];
    return Object.keys(stats).map(function (k) { return { name: k, amount: stats[k].amount, count: stats[k].count }; });
  }

  function getSalesByHour(storeId) {
    const store = findStore(storeId);
    return (store.salesStats && store.salesStats.byHour || []).map(function (h) { return { name: h.hour + '시', amount: h.amount }; });
  }

  function getSalesByMenu(storeId) {
    const store = findStore(storeId);
    return (store.salesStats && store.salesStats.byMenu || []).slice().sort(function (a, b) { return b.amount - a.amount; });
  }

  function getSalesByPeriod(storeId) {
    const store = findStore(storeId);
    return (store.salesStats && store.salesStats.byDay || []).map(function (d) { return { name: d.date.slice(5).replace('-', '.'), amount: d.amount, date: d.date }; });
  }

  // ---------------- Event Manager ----------------
  function getMyEvents(userId) {
    const user = DB.users.find(function (u) { return u.id === userId; });
    return DB.events.filter(function (e) { return user.eventIds.indexOf(e.id) !== -1; });
  }

  function getEvent(eventId) { return DB.events.find(function (e) { return e.id === eventId; }); }

  function getStoresByEvent(eventId) { return DB.stores.filter(function (s) { return s.eventId === eventId; }); }

  function getEventDashboardSummary(eventId) {
    const stores = getStoresByEvent(eventId);
    const open = stores.filter(function (s) { return s.operatingStatus === 'OPEN'; }).length;
    const paused = stores.filter(function (s) { return s.operatingStatus === 'PAUSED'; }).length;
    const closed = stores.filter(function (s) { return s.operatingStatus === 'CLOSED'; }).length;
    const todayAmount = stores.reduce(function (s, st) { return s + (st.todaySalesAmount || 0); }, 0);
    const totalAmount = stores.reduce(function (s, st) { return s + (st.totalSalesAmount || 0); }, 0);
    const todayOrderCount = stores.reduce(function (s, st) { return s + (st.todayOrderCount || 0); }, 0);
    return {
      storeCount: stores.length, open: open, paused: paused, closed: closed,
      todayAmount: todayAmount, totalAmount: totalAmount, todayOrderCount: todayOrderCount,
      avgPerStoreToday: stores.length ? Math.round(todayAmount / stores.length) : 0,
      avgPerStoreTotal: stores.length ? Math.round(totalAmount / stores.length) : 0,
    };
  }

  function getAttentionStores(eventId) {
    const event = getEvent(eventId);
    const stores = getStoresByEvent(eventId);
    const attention = [];
    stores.forEach(function (store) {
      const waitingOrders = DB.orders.filter(function (o) { return o.storeId === store.id && o.status === 'WAITING' && !o.canceled; });
      const delayed = waitingOrders.find(function (o) { return (Date.now() - new Date(o.orderedAt).getTime()) / 60000 >= 15; });
      if (delayed) attention.push({ storeId: store.id, storeName: store.name, reason: '대기 주문이 15분 이상 지연되고 있어요' });
      if (store.operatingStatus === 'OPEN' && store.lastOrderAt && (Date.now() - new Date(store.lastOrderAt).getTime()) / 60000 >= 60) {
        attention.push({ storeId: store.id, storeName: store.name, reason: '1시간 이상 신규 주문이 없어요' });
      }
      if (store.operatingStatus === 'CLOSED' && event.status === 'ONGOING' && store.statusChangedAt && (Date.now() - new Date(store.statusChangedAt).getTime()) / 60000 >= 30) {
        attention.push({ storeId: store.id, storeName: store.name, reason: '30분 이상 마감 상태가 지속되고 있어요' });
      }
    });
    return attention;
  }

  function bulkUpdateStoreStatus(storeIds, targetStatus) {
    let success = 0, skipped = 0, failed = 0;
    const failedNames = [];
    storeIds.forEach(function (id) {
      const store = findStore(id);
      if (store.operatingStatus === targetStatus) { skipped++; return; }
      const fail = Math.random() < 0.1;
      if (fail) { failed++; failedNames.push(store.name); return; }
      store.operatingStatus = targetStatus;
      store.statusChangedAt = new Date().toISOString();
      success++;
    });
    persist();
    return { success: success, skipped: skipped, failed: failed, failedNames: failedNames };
  }

  function addAuditLog(eventId, message, resultSummary) {
    DB.auditLogs.unshift({ id: uid('audit'), eventId: eventId, message: message, resultSummary: resultSummary, timestamp: new Date().toISOString() });
    persist();
  }

  function getAuditLogs(eventId) { return DB.auditLogs.filter(function (a) { return a.eventId === eventId; }); }

  function getEventSalesSummary(eventId) {
    return getEventDashboardSummary(eventId);
  }

  function getEventSalesByStore(eventId) {
    const stores = getStoresByEvent(eventId);
    return stores.map(function (s) { return { name: s.name, amount: s.todaySalesAmount || 0, totalAmount: s.totalSalesAmount || 0, storeId: s.id }; })
      .sort(function (a, b) { return b.amount - a.amount; });
  }

  function getEventSalesByPayment(eventId) {
    const stores = getStoresByEvent(eventId);
    const agg = { 카드: 0, 간편결제: 0, 쿠폰: 0 };
    stores.forEach(function (s) {
      if (s.salesStats && s.salesStats.byPayment) {
        Object.keys(s.salesStats.byPayment).forEach(function (k) { agg[k] = (agg[k] || 0) + s.salesStats.byPayment[k].amount; });
      } else if (s.todaySalesAmount) {
        agg['카드'] += Math.round(s.todaySalesAmount * 0.6);
        agg['간편결제'] += Math.round(s.todaySalesAmount * 0.3);
        agg['쿠폰'] += Math.round(s.todaySalesAmount * 0.1);
      }
    });
    return Object.keys(agg).map(function (k) { return { name: k, amount: agg[k] }; });
  }

  function getEventSalesByHour(eventId) {
    const stores = getStoresByEvent(eventId);
    const hours = ['10', '11', '12', '13', '14', '15', '16'];
    return hours.map(function (h) {
      let amount = 0;
      stores.forEach(function (s) {
        const found = s.salesStats && s.salesStats.byHour && s.salesStats.byHour.find(function (x) { return x.hour === h; });
        amount += found ? found.amount : Math.round((s.todaySalesAmount || 0) / hours.length);
      });
      return { name: h + '시', amount: amount };
    });
  }

  function getEventSalesByChannel(eventId) {
    const stores = getStoresByEvent(eventId);
    let qr = 0, tablet = 0;
    stores.forEach(function (s) {
      const orders = DB.orders.filter(function (o) { return o.storeId === s.id && o.status === 'DONE' && !o.canceled; });
      qr += orders.filter(function (o) { return o.channel === 'QR'; }).reduce(function (sum, o) { return sum + o.amount; }, 0);
      tablet += orders.filter(function (o) { return o.channel === 'TABLET'; }).reduce(function (sum, o) { return sum + o.amount; }, 0);
      if (!orders.length && s.todaySalesAmount) { qr += Math.round(s.todaySalesAmount * 0.65); tablet += Math.round(s.todaySalesAmount * 0.35); }
    });
    return [{ name: 'QR오더', amount: qr }, { name: '태블릿오더', amount: tablet }];
  }

  function getEventSalesByMenu(eventId) {
    const stores = getStoresByEvent(eventId);
    let rows = [];
    stores.forEach(function (s) {
      if (s.salesStats && s.salesStats.byMenu) {
        s.salesStats.byMenu.forEach(function (m) { rows.push({ name: m.name + ' (' + s.name + ')', qty: m.qty, amount: m.amount }); });
      }
    });
    return rows.sort(function (a, b) { return b.amount - a.amount; }).slice(0, 8);
  }

  window.MockApi = {
    getCurrentUser: getCurrentUser, getAutoLogin: getAutoLogin, login: login, logout: logout,
    getStore: getStore, updateOperatingStatus: updateOperatingStatus, updateAutoAccept: updateAutoAccept,
    getCustomerGuideSettings: getCustomerGuideSettings, updateCustomerGuideSettings: updateCustomerGuideSettings, getQrMenuInfo: getQrMenuInfo,
    getCategories: getCategories, getMenuItems: getMenuItems, getMenuItem: getMenuItem,
    addMenuItem: addMenuItem, updateMenuItem: updateMenuItem, toggleSoldOut: toggleSoldOut, moveMenuItem: moveMenuItem,
    getStaffAccounts: getStaffAccounts, createStaffAccount: createStaffAccount, toggleStaffActive: toggleStaffActive,
    getOrder: getOrder, getOrders: getOrders, acceptOrder: acceptOrder, cancelOrder: cancelOrder,
    callCustomer: callCustomer, completeOrder: completeOrder, cancelPayment: cancelPayment,
    revertOrder: revertOrder, returnOrder: returnOrder, bulkAction: bulkAction,
    getSalesByChannel: getSalesByChannel, getSalesByPayment: getSalesByPayment, getSalesByHour: getSalesByHour,
    getSalesByMenu: getSalesByMenu, getSalesByPeriod: getSalesByPeriod,
    getMyEvents: getMyEvents, getEvent: getEvent, getStoresByEvent: getStoresByEvent,
    getEventDashboardSummary: getEventDashboardSummary, getAttentionStores: getAttentionStores,
    bulkUpdateStoreStatus: bulkUpdateStoreStatus, addAuditLog: addAuditLog, getAuditLogs: getAuditLogs,
    getEventSalesSummary: getEventSalesSummary, getEventSalesByStore: getEventSalesByStore,
    getEventSalesByPayment: getEventSalesByPayment, getEventSalesByHour: getEventSalesByHour,
    getEventSalesByChannel: getEventSalesByChannel, getEventSalesByMenu: getEventSalesByMenu,
  };
})();
