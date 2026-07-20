// 카이로 AI 연구소 디자인 원칙을 따른다

// ============================================
// 전역 변수
// ============================================
let currentDate = new Date();
let currentMonth = new Date();
let personalRecords = {}; // 개인택시 기록
let corporateRecords = {}; // 법인택시 기록
let corporateInfo = {}; // { carNumber, employeeId }
let selectedDate = null;

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // 오늘 날짜 설정
    const today = new Date();
    const todayStr = formatDate(today);
    document.getElementById('recordDate').value = todayStr;
    document.getElementById('recordDate').min = '2020-01-01';
    document.getElementById('recordDate').max = todayStr;

    // 저장된 데이터 불러오기
    loadData();

    // 이벤트 리스너 등록
    setupEventListeners();

    // 초기 화면 구성
    updateTaxiType();
    updateCalendar();
    updateStats();
});

// ============================================
// 이벤트 리스너 설정
// ============================================
function setupEventListeners() {
    // 택시 유형 선택
    document.querySelectorAll('input[name="taxiType"]').forEach(radio => {
        radio.addEventListener('change', updateTaxiType);
    });

    // 입력 필드 - 실시간 순수익 계산
    document.getElementById('revenue').addEventListener('input', calculateDailyProfit);
    document.getElementById('fuel').addEventListener('input', calculateDailyProfit);
    document.getElementById('expenseAmount').addEventListener('input', calculateDailyProfit);
    document.getElementById('recordDate').addEventListener('change', loadDayRecord);

    // 법인택시 설정 확인
    document.getElementById('confirmSetup').addEventListener('click', saveCorporateSetup);

    // 저장 버튼
    document.getElementById('saveBtn').addEventListener('click', saveRecord);

    // 달력 네비게이션
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

    // 메뉴
    document.getElementById('menuBtn').addEventListener('click', openMenu);
    document.getElementById('closeMenu').addEventListener('click', closeMenu);

    // 메뉴 아이템
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('deleteAllBtn').addEventListener('click', deleteAllRecords);

    // 모달 닫기
    document.getElementById('closeDetail').addEventListener('click', closeDetailModal);
    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailModal);
    document.getElementById('deleteRecordBtn').addEventListener('click', deleteRecord);

    document.getElementById('closeDayOff').addEventListener('click', closeDayOffModal);
    document.getElementById('closeDayOffBtn').addEventListener('click', closeDayOffModal);
    document.getElementById('setDayOffBtn').addEventListener('click', setDayOff);
    document.getElementById('removeDayOffBtn').addEventListener('click', removeDayOff);

    // 파일 입력 (숨겨진)
    const fileInput = document.createElement('input');
    fileInput.id = 'importFile';
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', importFromFile);
    document.body.appendChild(fileInput);
}

// ============================================
// 현재 기록 가져오기 (택시 유형에 따라)
// ============================================
function getCurrentRecords() {
    const taxiType = document.querySelector('input[name="taxiType"]:checked').value;
    return taxiType === 'corporate' ? corporateRecords : personalRecords;
}

// ============================================
// 택시 유형 변경
// ============================================
function updateTaxiType() {
    const taxiType = document.querySelector('input[name="taxiType"]:checked').value;
    const corporateSetup = document.getElementById('corporateSetup');
    const corporateFields = document.getElementById('corporateFields');
    const corporateStats = document.getElementById('corporateStats');

    if (taxiType === 'corporate') {
        corporateSetup.style.display = corporateInfo.carNumber ? 'none' : 'block';
        corporateFields.style.display = 'block';
        corporateStats.style.display = 'block';
    } else {
        corporateSetup.style.display = 'none';
        corporateFields.style.display = 'none';
        corporateStats.style.display = 'none';
    }

    loadDayRecord();
}

// ============================================
// 법인택시 정보 저장
// ============================================
function saveCorporateSetup() {
    const carNumber = document.getElementById('carNumber').value.trim();
    const employeeId = document.getElementById('employeeId').value.trim();

    if (!carNumber) {
        alert('차량번호를 입력해주세요.');
        return;
    }
    if (!employeeId) {
        alert('사번을 입력해주세요.');
        return;
    }

    corporateInfo = { carNumber, employeeId };
    saveData();
    document.getElementById('corporateSetup').style.display = 'none';
    showSaveMessage('정보가 저장되었습니다.');
}

// ============================================
// 순수익 계산
// ============================================
function calculateDailyProfit() {
    const revenue = parseInt(document.getElementById('revenue').value) || 0;
    const fuel = parseInt(document.getElementById('fuel').value) || 0;
    const expenseAmount = parseInt(document.getElementById('expenseAmount').value) || 0;
    const profit = revenue - fuel - expenseAmount;

    document.getElementById('dailyProfit').textContent = formatCurrency(profit);
}

// ============================================
// 날짜별 기록 불러오기
// ============================================
function loadDayRecord() {
    const dateStr = document.getElementById('recordDate').value;
    const records = getCurrentRecords();
    const record = records[dateStr];

    if (record) {
        document.getElementById('revenue').value = record.revenue || 0;
        document.getElementById('fuel').value = record.fuel || 0;
        document.getElementById('expenseName').value = record.expenseName || '';
        document.getElementById('expenseAmount').value = record.expenseAmount || 0;
        document.getElementById('memo').value = record.memo || '';
        document.getElementById('tripCount').value = record.tripCount || 0;
    } else {
        document.getElementById('revenue').value = '';
        document.getElementById('fuel').value = '';
        document.getElementById('expenseName').value = '';
        document.getElementById('expenseAmount').value = '';
        document.getElementById('memo').value = '';
        document.getElementById('tripCount').value = '';
    }

    calculateDailyProfit();
}

// ============================================
// 기록 저장
// ============================================
function saveRecord() {
    const dateStr = document.getElementById('recordDate').value;
    const revenue = parseInt(document.getElementById('revenue').value) || 0;
    const fuel = parseInt(document.getElementById('fuel').value) || 0;
    const expenseName = document.getElementById('expenseName').value.trim();
    const expenseAmount = parseInt(document.getElementById('expenseAmount').value) || 0;
    const memo = document.getElementById('memo').value.trim();
    const tripCount = parseInt(document.getElementById('tripCount').value) || 0;

    if (revenue === 0) {
        alert('매출을 입력해주세요.');
        return;
    }

    const records = getCurrentRecords();
    records[dateStr] = {
        revenue,
        fuel,
        expenseName,
        expenseAmount,
        memo,
        tripCount,
        dayOff: records[dateStr]?.dayOff || false
    };

    saveData();
    showSaveMessage('✅ 방금 저장되었습니다.');
    updateCalendar();
    updateStats();

    // 0.5초 후 메시지 사라짐
    setTimeout(() => {
        document.getElementById('saveMessage').textContent = '';
    }, 500);
}

// ============================================
// 저장 메시지 표시
// ============================================
function showSaveMessage(message) {
    const messageEl = document.getElementById('saveMessage');
    messageEl.textContent = message;
}

// ============================================
// 달력 업데이트
// ============================================
function updateCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    document.getElementById('monthTitle').textContent = `${year}년 ${month + 1}월`;

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // 요일 헤더
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const header = document.createElement('div');
    header.style.display = 'contents';

    for (let day of dayNames) {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.textAlign = 'center';
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.color = '#667eea';
        dayHeader.style.marginBottom = '10px';
        dayHeader.style.fontSize = '12px';
        calendar.appendChild(dayHeader);
    }

    // 날짜 셀
    const records = getCurrentRecords();
    let currentDate = new Date(startDate);
    while (currentDate <= lastDay) {
        const dateStr = formatDate(currentDate);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        const dayNum = currentDate.getDate();
        const isToday = dateStr === formatDate(new Date());
        const isCurrentMonth = currentDate.getMonth() === month;
        const hasRecord = records[dateStr];
        const isDayOff = hasRecord?.dayOff;

        if (!isCurrentMonth) {
            dayDiv.classList.add('other-month');
        }
        if (isToday) {
            dayDiv.classList.add('today');
        }
        if (isDayOff) {
            dayDiv.classList.add('day-off');
        } else if (hasRecord) {
            dayDiv.classList.add('has-record');
        }

        let content = `<div class="calendar-day-number">${dayNum}</div>`;

        if (isDayOff) {
            content += '<div class="calendar-day-off-label">휴무</div>';
        } else if (hasRecord) {
            const profit = hasRecord.revenue - hasRecord.fuel - hasRecord.expenseAmount;
            content += `<div class="calendar-day-profit">${formatCurrency(profit)}</div>`;
        }

        dayDiv.innerHTML = content;

        if (isCurrentMonth) {
            dayDiv.addEventListener('click', () => openDateDetail(dateStr));
        }

        calendar.appendChild(dayDiv);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// ============================================
// 날짜별 상세 정보 모달
// ============================================
function openDateDetail(dateStr) {
    selectedDate = dateStr;
    const records = getCurrentRecords();
    const record = records[dateStr];
    const isDayOff = record?.dayOff;

    document.getElementById('detailDate').textContent = dateStr;
    const detailBody = document.getElementById('detailBody');

    if (isDayOff) {
        detailBody.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">휴무일입니다</p>';
    } else if (record) {
        const profit = record.revenue - record.fuel - record.expenseAmount;
        let html = `
            <div class="detail-item">
                <div class="detail-label">매출</div>
                <div class="detail-value">${formatCurrency(record.revenue)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">주유비</div>
                <div class="detail-value">${formatCurrency(record.fuel)}</div>
            </div>
        `;

        if (record.expenseName) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">${record.expenseName}</div>
                    <div class="detail-value">${formatCurrency(record.expenseAmount)}</div>
                </div>
            `;
        }

        html += `
            <div class="detail-item" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                <div class="detail-label" style="color: rgba(255,255,255,0.9);">순수익</div>
                <div class="detail-value" style="color: white;">${formatCurrency(profit)}</div>
            </div>
        `;

        if (record.memo) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">메모</div>
                    <div class="detail-value" style="white-space: pre-wrap; font-size: 14px;">${record.memo}</div>
                </div>
            `;
        }

        const taxiType = document.querySelector('input[name="taxiType"]:checked').value;
        if (taxiType === 'corporate' && (corporateInfo.carNumber || record.tripCount)) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">차량번호</div>
                    <div class="detail-value">${record.carNumber || corporateInfo.carNumber || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">사번</div>
                    <div class="detail-value">${record.employeeId || corporateInfo.employeeId || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">운행 건수</div>
                    <div class="detail-value">${record.tripCount}건</div>
                </div>
            `;
        }

        detailBody.innerHTML = html;
    } else {
        detailBody.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">기록이 없습니다</p>';
    }

    document.getElementById('deleteRecordBtn').style.display = record && !isDayOff ? 'block' : 'none';
    document.getElementById('detailModal').style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
    selectedDate = null;
}

function deleteRecord() {
    if (!selectedDate) return;

    const confirmed = confirm('정말 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.');
    if (!confirmed) return;

    const records = getCurrentRecords();
    delete records[selectedDate];
    saveData();
    closeDetailModal();
    updateCalendar();
    updateStats();
}

// ============================================
// 휴무일 설정
// ============================================
function openDayOffModal(dateStr) {
    selectedDate = dateStr;
    const records = getCurrentRecords();
    const record = records[dateStr];
    const isDayOff = record?.dayOff;

    document.getElementById('dayOffDate').textContent = dateStr;
    document.getElementById('setDayOffBtn').style.display = isDayOff ? 'none' : 'block';
    document.getElementById('removeDayOffBtn').style.display = isDayOff ? 'block' : 'none';
    document.getElementById('dayOffModal').style.display = 'flex';
}

function closeDayOffModal() {
    document.getElementById('dayOffModal').style.display = 'none';
    selectedDate = null;
}

function setDayOff() {
    if (!selectedDate) return;

    const records = getCurrentRecords();
    // 이미 운행 기록이 있으면 설정 불가
    if (records[selectedDate] && !records[selectedDate].dayOff) {
        alert('이미 운행 기록이 있는 날짜는 휴무일로 설정할 수 없습니다.');
        closeDayOffModal();
        return;
    }

    records[selectedDate] = {
        revenue: 0,
        fuel: 0,
        expenseName: '',
        expenseAmount: 0,
        memo: '',
        tripCount: 0,
        dayOff: true
    };

    saveData();
    closeDayOffModal();
    updateCalendar();
    updateStats();
}

function removeDayOff() {
    if (!selectedDate) return;

    const records = getCurrentRecords();
    delete records[selectedDate];
    saveData();
    closeDayOffModal();
    updateCalendar();
    updateStats();
}

// ============================================
// 월별 통계 업데이트
// ============================================
function updateStats() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    let totalRevenue = 0;
    let totalExpense = 0;
    let totalTrips = 0;

    const records = getCurrentRecords();
    for (const dateStr in records) {
        const [y, m, d] = dateStr.split('-');
        if (parseInt(y) === year && parseInt(m) === month + 1) {
            const record = records[dateStr];
            totalRevenue += record.revenue;
            totalExpense += record.fuel + record.expenseAmount;
            totalTrips += record.tripCount;
        }
    }

    const totalProfit = totalRevenue - totalExpense;

    document.getElementById('monthRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('monthExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('monthProfit').textContent = formatCurrency(totalProfit);
    document.getElementById('monthTrips').textContent = `${totalTrips}건`;
}

// ============================================
// 월 변경
// ============================================
function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    updateCalendar();
    updateStats();
}

// ============================================
// 메뉴
// ============================================
function openMenu() {
    document.getElementById('menuModal').style.display = 'flex';
}

function closeMenu() {
    document.getElementById('menuModal').style.display = 'none';
}

// ============================================
// CSV 내보내기
// ============================================
function exportToCSV() {
    let csv = '날짜,매출,주유비,기타비용 항목,기타비용,순수익,메모\n';

    const records = getCurrentRecords();
    const sortedDates = Object.keys(records).sort();
    for (const dateStr of sortedDates) {
        const record = records[dateStr];
        const profit = record.revenue - record.fuel - record.expenseAmount;

        const row = [
            dateStr,
            record.revenue,
            record.fuel,
            record.expenseName,
            record.expenseAmount,
            profit,
            `"${record.memo.replace(/"/g, '""')}"`
        ].join(',');

        csv += row + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `택시기록_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closeMenu();
    alert('엑셀 파일이 저장되었습니다.');
}

// ============================================
// 백업 내보내기 (JSON)
// ============================================
function exportBackup() {
    const backup = {
        personalRecords,
        corporateRecords,
        corporateInfo,
        exportDate: formatDate(new Date())
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `택시기록_백업_${formatDate(new Date())}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// 백업 불러오기
// ============================================
function importFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const backup = JSON.parse(event.target.result);
            personalRecords = backup.personalRecords || {};
            corporateRecords = backup.corporateRecords || {};
            corporateInfo = backup.corporateInfo || {};
            saveData();
            updateTaxiType();
            updateCalendar();
            updateStats();
            alert('백업이 복구되었습니다.');
        } catch (error) {
            alert('파일을 읽을 수 없습니다.');
        }
    };
    reader.readAsText(file);
}

// ============================================
// 모든 기록 삭제
// ============================================
function deleteAllRecords() {
    const confirmed = confirm('정말 모든 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.');
    if (!confirmed) return;

    const taxiType = document.querySelector('input[name="taxiType"]:checked').value;
    if (taxiType === 'corporate') {
        corporateRecords = {};
    } else {
        personalRecords = {};
    }
    
    saveData();
    closeMenu();
    updateCalendar();
    updateStats();
    alert('모든 기록이 삭제되었습니다.');
}

// ============================================
// 데이터 저장 (localStorage)
// ============================================
function saveData() {
    const data = {
        personalRecords,
        corporateRecords,
        corporateInfo
    };
    localStorage.setItem('taxiRecordData', JSON.stringify(data));
}

// ============================================
// 데이터 불러오기 (localStorage)
// ============================================
function loadData() {
    const stored = localStorage.getItem('taxiRecordData');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            personalRecords = data.personalRecords || data.records || {};
            corporateRecords = data.corporateRecords || {};
            corporateInfo = data.corporateInfo || {};
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    }
}

// ============================================
// 유틸리티 함수
// ============================================

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 통화 포맷
function formatCurrency(amount) {
    if (amount < 0) {
        return '-' + Math.abs(amount).toLocaleString('ko-KR') + '원';
    }
    return amount.toLocaleString('ko-KR') + '원';
}

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
    const detailModal = document.getElementById('detailModal');
    const menuModal = document.getElementById('menuModal');
    const dayOffModal = document.getElementById('dayOffModal');

    if (e.target === detailModal) {
        closeDetailModal();
    }
    if (e.target === menuModal) {
        closeMenu();
    }
    if (e.target === dayOffModal) {
        closeDayOffModal();
    }
});
