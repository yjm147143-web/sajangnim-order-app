/*
 * Mock 데이터 스키마 + 시드 데이터
 * 실제 백엔드 연동 시 이 파일과 mockApi.js만 실제 API 호출로 교체하면 화면 코드는 그대로 유지 가능.
 */
(function () {
  function minutesAgo(n) { return new Date(Date.now() - n * 60000).toISOString(); }
  function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

  function buildSeed() {
    const users = [
      { id: 'user-owner-1', role: 'OWNER', loginId: 'owner', password: '1234', name: '김사장', storeId: 'store-1' },
      { id: 'user-staff-1', role: 'STAFF', loginId: 'staff1', password: '1234', name: '박직원', phone: '01011112222', email: 'staff1@example.com', storeId: 'store-1', active: true, periodType: 'ALWAYS', periodStart: null, periodEnd: null },
      { id: 'user-staff-2', role: 'STAFF', loginId: 'staff2', password: '1234', name: '이직원', phone: '01033334444', email: 'staff2@example.com', storeId: 'store-1', active: false, periodType: 'RANGE', periodStart: '2026-07-01', periodEnd: '2026-07-31' },
      { id: 'user-manager-1', role: 'EVENT_MANAGER', loginId: 'manager', password: '1234', name: '최담당', eventIds: ['event-1', 'event-2'] },
    ];

    const events = [
      { id: 'event-1', name: '성수 야외 푸드마켓', location: '서울 성동구 성수동 골목공원', startDate: daysAgo(2).slice(0, 10), endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), managerName: '최담당', status: 'ONGOING' },
      { id: 'event-2', name: '한강 가을 피크닉 마켓', location: '서울 여의도 한강공원', startDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10), endDate: new Date(Date.now() + 22 * 86400000).toISOString().slice(0, 10), managerName: '최담당', status: 'UPCOMING' },
    ];

    const stores = [
      {
        id: 'store-1', eventId: 'event-1', name: '브루웍스 성수점', operatingStatus: 'OPEN', autoAcceptOrders: false,
        guideDisplayMode: 'time', cookTimeBase: 10, cookTimeMarginal: 2, cookTimeBatch: 6,
        cookHasHelper: false, cookHelperCount: 1, cookBufferMinutes: 2,
        statusChangedAt: minutesAgo(180), ownerName: '김사장', ownerPhone: '01012345678',
        cashSalesAmount: 84000, cashOrderCount: 6,
        todaySalesAmount: 612000, totalSalesAmount: 5480000, todayOrderCount: 58,
        salesStats: {
          byPayment: { 카드: { amount: 312000, count: 34 }, 간편결제: { amount: 186000, count: 18 }, 쿠폰: { amount: 30000, count: 6 } },
          byHour: [
            { hour: '10', amount: 42000 }, { hour: '11', amount: 88000 }, { hour: '12', amount: 145000 },
            { hour: '13', amount: 121000 }, { hour: '14', amount: 68000 }, { hour: '15', amount: 54000 },
            { hour: '16', amount: 94000 },
          ],
          byMenu: [
            { name: '아메리카노', qty: 46, amount: 207000 },
            { name: '카페라떼', qty: 33, amount: 165000 },
            { name: '크로플', qty: 24, amount: 144000 },
            { name: '레모네이드', qty: 19, amount: 95000 },
            { name: '바닐라라떼', qty: 12, amount: 66000 },
            { name: '초코쿠키', qty: 7, amount: 24500 },
          ],
          byDay: [
            { date: daysAgo(6).slice(0, 10), amount: 380000 },
            { date: daysAgo(5).slice(0, 10), amount: 452000 },
            { date: daysAgo(4).slice(0, 10), amount: 298000 },
            { date: daysAgo(3).slice(0, 10), amount: 517000 },
            { date: daysAgo(2).slice(0, 10), amount: 601000 },
            { date: daysAgo(1).slice(0, 10), amount: 439000 },
            { date: new Date().toISOString().slice(0, 10), amount: 612000 },
          ],
        },
      },
      { id: 'store-2', eventId: 'event-1', name: '고로케 트럭', operatingStatus: 'OPEN', autoAcceptOrders: true, guideDisplayMode: 'queue', cookTimeBase: 8, cookTimeMarginal: 1, cookTimeBatch: 8, cookHasHelper: true, cookHelperCount: 1, cookBufferMinutes: 2, statusChangedAt: minutesAgo(240), ownerName: '정사장', ownerPhone: '01022223333', cashSalesAmount: 156000, cashOrderCount: 11, todaySalesAmount: 470000, totalSalesAmount: 4700000, todayOrderCount: 62 },
      { id: 'store-3', eventId: 'event-1', name: '타코야끼 부스', operatingStatus: 'OPEN', autoAcceptOrders: false, guideDisplayMode: 'time', cookTimeBase: 6, cookTimeMarginal: 1, cookTimeBatch: 12, cookHasHelper: false, cookHelperCount: 1, cookBufferMinutes: 1, statusChangedAt: minutesAgo(200), ownerName: '한사장', ownerPhone: '01044445555', cashSalesAmount: 32000, cashOrderCount: 3, todaySalesAmount: 312000, totalSalesAmount: 2100000, todayOrderCount: 41 },
      { id: 'store-4', eventId: 'event-1', name: '크래프트비어 하우스', operatingStatus: 'OPEN', autoAcceptOrders: false, guideDisplayMode: 'time', cookTimeBase: 5, cookTimeMarginal: 1, cookTimeBatch: 4, cookHasHelper: false, cookHelperCount: 1, cookBufferMinutes: 2, statusChangedAt: minutesAgo(95), lastOrderAt: minutesAgo(95), ownerName: '윤사장', ownerPhone: '01055556666', cashSalesAmount: 210000, cashOrderCount: 9, todaySalesAmount: 588000, totalSalesAmount: 3300000, todayOrderCount: 38 },
      { id: 'store-5', eventId: 'event-1', name: '떡볶이 포차', operatingStatus: 'CLOSED', autoAcceptOrders: true, guideDisplayMode: 'queue', cookTimeBase: 10, cookTimeMarginal: 2, cookTimeBatch: 6, cookHasHelper: false, cookHelperCount: 1, cookBufferMinutes: 2, statusChangedAt: minutesAgo(45), ownerName: '서사장', ownerPhone: '01066667777', cashSalesAmount: 40000, cashOrderCount: 4, todaySalesAmount: 198000, totalSalesAmount: 1500000, todayOrderCount: 25 },
      { id: 'store-6', eventId: 'event-1', name: '핫도그 트럭', operatingStatus: 'PAUSED', autoAcceptOrders: false, guideDisplayMode: 'time', cookTimeBase: 7, cookTimeMarginal: 2, cookTimeBatch: 5, cookHasHelper: false, cookHelperCount: 1, cookBufferMinutes: 3, statusChangedAt: minutesAgo(15), ownerName: '문사장', ownerPhone: '01077778888', cashSalesAmount: 18000, cashOrderCount: 2, todaySalesAmount: 122000, totalSalesAmount: 980000, todayOrderCount: 16 },
    ];

    const categories = [
      { id: 'cat-1', storeId: 'store-1', name: '커피', sortOrder: 1 },
      { id: 'cat-2', storeId: 'store-1', name: '음료', sortOrder: 2 },
      { id: 'cat-3', storeId: 'store-1', name: '디저트', sortOrder: 3 },
    ];

    const menuItems = [
      { id: 'menu-1', storeId: 'store-1', categoryId: 'cat-1', name: '아메리카노', price: 4500, description: '깔끔한 원두 본연의 맛', imageUrl: '', origin: '콜롬비아산 원두', stockQuantity: 40, autoSoldoutEnabled: true, soldOut: false, exposed: true, sortOrder: 1, optionGroups: [{ id: 'og-1', name: '샷 추가', required: false, multiSelect: false, options: [{ name: '1샷 추가', price: 500 }, { name: '2샷 추가', price: 1000 }] }] },
      { id: 'menu-2', storeId: 'store-1', categoryId: 'cat-1', name: '카페라떼', price: 5000, description: '고소한 우유 거품 라떼', imageUrl: '', origin: '콜롬비아산 원두 · 국내산 우유', stockQuantity: 30, autoSoldoutEnabled: true, soldOut: false, exposed: true, sortOrder: 2, optionGroups: [] },
      { id: 'menu-3', storeId: 'store-1', categoryId: 'cat-1', name: '바닐라라떼', price: 5500, description: '달콤한 바닐라 시럽 라떼', imageUrl: '', origin: '', stockQuantity: 0, autoSoldoutEnabled: true, soldOut: true, exposed: true, sortOrder: 3, optionGroups: [] },
      { id: 'menu-4', storeId: 'store-1', categoryId: 'cat-2', name: '레모네이드', price: 5000, description: '상큼한 생레몬 에이드', imageUrl: '', origin: '국내산 레몬', stockQuantity: 25, autoSoldoutEnabled: false, soldOut: false, exposed: true, sortOrder: 1, optionGroups: [{ id: 'og-2', name: '얼음량', required: true, multiSelect: false, options: [{ name: '적게', price: 0 }, { name: '보통', price: 0 }, { name: '많이', price: 0 }] }] },
      { id: 'menu-5', storeId: 'store-1', categoryId: 'cat-3', name: '크로플', price: 6000, description: '바삭한 크로와상 와플', imageUrl: '', origin: '', stockQuantity: 15, autoSoldoutEnabled: true, soldOut: false, exposed: true, sortOrder: 1, optionGroups: [] },
      { id: 'menu-6', storeId: 'store-1', categoryId: 'cat-3', name: '초코쿠키', price: 3500, description: '진한 초콜릿 쿠키', imageUrl: '', origin: '', stockQuantity: 20, autoSoldoutEnabled: false, soldOut: false, exposed: false, sortOrder: 2, optionGroups: [] },
    ];

    function items(list) { return list; }

    const orders = [
      { id: 'order-1', storeId: 'store-1', paymentOrderNo: 'PG-820193', pickupNo: '1023', channel: 'QR', paymentMethod: '카드', amount: 9500, items: items([{ menuName: '아메리카노', optionNames: ['1샷 추가'], quantity: 1 }, { menuName: '초코쿠키', optionNames: [], quantity: 1 }]), customerContact: '01098765432', orderedAt: minutesAgo(4), acceptedAt: null, doneAt: null, status: 'WAITING', called: false, calledCount: 0, completeCount: 0, canceled: false, cancelReason: null, cancelType: null },
      { id: 'order-2', storeId: 'store-1', paymentOrderNo: 'PG-820194', pickupNo: '1024', channel: 'TABLET', paymentMethod: '간편결제', amount: 5000, items: items([{ menuName: '카페라떼', optionNames: [], quantity: 1 }]), customerContact: '01011223344', orderedAt: minutesAgo(3), acceptedAt: null, doneAt: null, status: 'WAITING', called: false, calledCount: 0, completeCount: 0, canceled: false, cancelReason: null, cancelType: null },
      { id: 'order-3', storeId: 'store-1', paymentOrderNo: 'PG-820188', pickupNo: '1019', channel: 'QR', paymentMethod: '카드', amount: 15000, items: items([{ menuName: '크로플', optionNames: [], quantity: 2 }, { menuName: '레모네이드', optionNames: ['보통'], quantity: 1 }]), customerContact: '0102938', orderedAt: minutesAgo(11), acceptedAt: minutesAgo(9), doneAt: null, status: 'PROCESSING', called: false, calledCount: 0, completeCount: 0, canceled: false, cancelReason: null, cancelType: null },
      { id: 'order-4', storeId: 'store-1', paymentOrderNo: 'PG-820185', pickupNo: '1017', channel: 'TABLET', paymentMethod: '쿠폰', amount: 4500, items: items([{ menuName: '아메리카노', optionNames: [], quantity: 1 }]), customerContact: '01055667788', orderedAt: minutesAgo(16), acceptedAt: minutesAgo(15), doneAt: null, status: 'PROCESSING', called: true, calledCount: 1, completeCount: 0, canceled: false, cancelReason: null, cancelType: null },
      { id: 'order-5', storeId: 'store-1', paymentOrderNo: 'PG-820180', pickupNo: '1014', channel: 'QR', paymentMethod: '카드', amount: 11000, items: items([{ menuName: '레모네이드', optionNames: ['많이'], quantity: 1 }, { menuName: '크로플', optionNames: [], quantity: 1 }]), customerContact: '01099887766', orderedAt: minutesAgo(21), acceptedAt: null, doneAt: null, status: 'WAITING', called: false, calledCount: 0, completeCount: 0, canceled: false, cancelReason: null, cancelType: null },
      { id: 'order-6', storeId: 'store-1', paymentOrderNo: 'PG-820160', pickupNo: '1005', channel: 'TABLET', paymentMethod: '카드', amount: 5500, items: items([{ menuName: '바닐라라떼', optionNames: [], quantity: 1 }]), customerContact: '01012312312', orderedAt: minutesAgo(48), acceptedAt: minutesAgo(46), doneAt: minutesAgo(30), status: 'DONE', called: true, calledCount: 2, completeCount: 1, canceled: false, cancelReason: null, cancelType: null },
      { id: 'order-7', storeId: 'store-1', paymentOrderNo: 'PG-820155', pickupNo: '1002', channel: 'QR', paymentMethod: '간편결제', amount: 6000, items: items([{ menuName: '크로플', optionNames: [], quantity: 1 }]), customerContact: '01043214321', orderedAt: minutesAgo(55), acceptedAt: minutesAgo(53), doneAt: minutesAgo(50), status: 'DONE', called: false, calledCount: 0, completeCount: 0, canceled: true, cancelReason: '품절', cancelType: 'RETURN' },
      { id: 'order-8', storeId: 'store-1', paymentOrderNo: 'PG-820150', pickupNo: '1000', channel: 'TABLET', paymentMethod: '카드', amount: 4500, items: items([{ menuName: '아메리카노', optionNames: [], quantity: 1 }]), customerContact: '01000000000', orderedAt: minutesAgo(60), acceptedAt: null, doneAt: minutesAgo(58), status: 'DONE', called: false, calledCount: 0, completeCount: 0, canceled: true, cancelReason: '고객 요청', cancelType: 'CANCEL' },
    ];

    const auditLogs = [];

    return { users, events, stores, categories, menuItems, orders, auditLogs };
  }

  const KEY = window.AppConfig.DB_KEY;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const seed = buildSeed();
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function reset() {
    const seed = buildSeed();
    save(seed);
    return seed;
  }

  window.MockDB = { load, save, reset };
})();
