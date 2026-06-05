// 大大專屬的 API 網址
const API_URL = "https://script.google.com/macros/s/AKfycbxN6DwZjFyuig1l3jHXuHzif8kbf751D8czPpD0BxMiXFoVrnoh1TDYSBkhHB7jj0a14g/exec";

// 🌟 從支出清單中移除了「理財/投資」
const EXP_CATS = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "數位/軟體", "嗜好/裝備"];
const INC_CATS = ["薪資", "獎金", "中獎", "投資收入", "其他收入"];

const CAT_COLORS = {
    "貓咪用品": "#d6a278", "賣場/Costco": "#c48888", "餐飲": "#8dae99", "交通": "#8b9ba3",
    "生活/帳單": "#86a5b8", "購物/治裝": "#9b8dae", "娛樂/聚餐": "#d4a9b4", "醫療/健康": "#8bb0b3",
    "理財/投資": "#bd8888", "數位/軟體": "#80a3a3", "嗜好/裝備": "#a1a6a1", 
    "薪資": "#8dae99", "獎金": "#d4b383", "中獎": "#c48888", "投資收入": "#86a5b8", "其他收入": "#b0b5b9"
};

let expenses = []; 
let currentType = 'expense'; 
let selectedCategory = "";
let pieChart = null;
let detailPieChart = null;

function getLocalToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// 🌟 時光濾水器：不管拿到多髒的時間字串，都強制洗成 YYYY-MM-DD
function formatCleanDate(dateStr) {
    if (!dateStr) return '';
    let clean = String(dateStr);
    if (clean.startsWith("'")) clean = clean.substring(1);
    if (clean.includes('T')) clean = clean.split('T')[0];
    return clean.replace(/\//g, '-');
}

window.onload = async () => {
    renderCategoryGrid();
    document.getElementById('date-input').value = getLocalToday();
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data && data.length > 0) {
            expenses = data.map(record => {
                record.date = formatCleanDate(record.date);
                return record;
            });
            localStorage.setItem('my_expenses', JSON.stringify(expenses));
        } else {
            expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
        }
    } catch (error) {
        console.error("讀取雲端資料失敗", error);
        expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
    }
    
    // 把本機可能髒掉的舊資料也洗乾淨
    expenses = expenses.map(e => {
        e.date = formatCleanDate(e.date);
        return e;
    });
    
    updateStats();
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    }, 800);
};

function cancelSwipe(e) {
    if (!e.target.closest('.delete-btn') && !e.target.closest('.list-item-wrapper')) {
        document.querySelectorAll('.list-item.swiped').forEach(item => item.classList.remove('swiped'));
    }
}
document.addEventListener('touchstart', cancelSwipe);
document.addEventListener('mousedown', cancelSwipe);

function toggleMenu(open) {
    const drawer = document.getElementById('nav-drawer');
    const overlay = document.getElementById('menu-overlay');
    if (open) {
        drawer.classList.add('open');
        overlay.classList.add('show');
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
    }
}

function handleNav(view) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.innerText.includes(view === 'daily' ? '日' : '月'));
    });
    
    document.getElementById('daily-view').style.display = view === 'daily' ? 'flex' : 'none';
    document.getElementById('monthly-view').style.display = view === 'monthly' ? 'block' : 'none';
    
    if (view === 'monthly') renderMonthlyCalendar(); 
    toggleMenu(false); 
}

function setRecordType(type) {
    currentType = type;
    selectedCategory = "";
    document.getElementById('type-exp').classList.toggle('active', type === 'expense');
    document.getElementById('type-inc').classList.toggle('active', type === 'income');
    renderCategoryGrid();
    updateStats(); 
}

function renderCategoryGrid() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = "";
    const list = currentType === 'expense' ? EXP_CATS : INC_CATS;
    list.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'cat-btn';
        btn.innerText = cat;
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.backgroundColor = '#f8fafa';
                b.style.color = 'var(--text-color)';
                b.style.borderColor = 'var(--border-color)';
                b.style.boxShadow = 'none';
            });
            btn.classList.add('selected');
            const targetColor = CAT_COLORS[cat] || 'var(--primary)';
            btn.style.backgroundColor = targetColor;
            btn.style.borderColor = targetColor;
            btn.style.color = '#ffffff';
            btn.style.boxShadow = `0 4px 10px ${targetColor}40`;
            selectedCategory = cat;
        };
        grid.appendChild(btn);
    });
}

async function addRecord() {
    const amt = document.getElementById('amount-input').value;
    const memo = document.getElementById('memo-input').value;
    const dateVal = document.getElementById('date-input').value; 
    
    if (!selectedCategory || !amt || !dateVal) return alert("大大，請選擇分類、日期並輸入金額喔！");

    const newRecord = { 
        id: Date.now(), type: currentType, category: selectedCategory, amount: parseInt(amt), memo: memo, date: dateVal 
    };

    expenses.push(newRecord);
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    selectedCategory = "";
    renderCategoryGrid();
    updateStats(); 

    const cloudRecord = { ...newRecord, date: "'" + dateVal.replace(/-/g, '/') };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: "add", data: cloudRecord }) 
        });
    } catch (error) {
        console.error("雲端同步失敗", error);
    }
}

function updateStats() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    const filteredExpenses = expenses.filter(e => {
        if (e.type !== currentType) return false;
        
        let cleanDate = formatCleanDate(e.date);
        if (cleanDate && cleanDate.includes('-')) {
            return cleanDate.startsWith(currentMonthPrefix); 
        } else {
            const d = new Date(e.id);
            return d.getFullYear() === currentYear && d.getMonth() === today.getMonth();
        }
    });

    const totals = {};
    let grandTotal = 0;
    
    filteredExpenses.forEach(ex => { 
        totals[ex.category] = (totals[ex.category] || 0) + ex.amount; 
        grandTotal += ex.amount;
    });

    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);
    const bgColors = labels.map(k => CAT_COLORS[k] || "#ccc");

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 2, borderColor: '#f2f5f6' }] },
        options: { cutout: '75%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { let label = context.label || ''; let value = context.raw || 0; let percentage = grandTotal > 0 ? Math.round((value / grandTotal) * 100) + '%' : '0%'; return label ? label + ': ' + percentage : percentage; } } } } }
    });

    const typeLabel = currentType === 'expense' ? '當月支出' : '當月收入';
    const totalText = `<span style="font-size:12px; color:#8fa3ad; margin-bottom:2px;">${typeLabel}</span><span style="font-size:22px; font-weight:bold; color:var(--text-color);">$${grandTotal}</span>`;
    document.getElementById('chart-center-text').innerHTML = totalText;
    document.getElementById('list-total').innerText = `${typeLabel}: $${grandTotal}`;

    const container = document.getElementById('list-container');
    container.innerHTML = "";
    [...filteredExpenses].reverse().forEach(ex => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item-wrapper';
        
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.innerText = "刪除";
        
        delBtn.onclick = async () => {
            if(confirm("確定要刪除嗎？")) {
                const targetId = ex.id;
                expenses = expenses.filter(e => e.id !== targetId);
                localStorage.setItem('my_expenses', JSON.stringify(expenses));
                updateStats();
                try {
                    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "delete", id: targetId }) });
                } catch(error) {}
            }
        };

        const item = document.createElement('div');
        item.className = 'list-item';
        const color = CAT_COLORS[ex.category] || "#ccc";
        const displayAmt = ex.type === 'income' ? `+${ex.amount}` : `$${ex.amount}`;
        const amtColor = ex.type === 'income' ? 'var(--income-color)' : 'var(--text-color)';
        const displayDate = formatCleanDate(ex.date);

        item.innerHTML = `
            <div class="color-indicator" style="background:${color}"></div>
            <div style="flex:1">
                <div class="list-cat">${ex.category}</div>
                <div class="list-memo">${ex.memo || ''} (${displayDate})</div>
            </div>
            <div class="list-amt" style="color:${amtColor}">${displayAmt}</div>
        `;
        
        let startX = 0;
        item.ontouchstart = (e) => { document.querySelectorAll('.list-item.swiped').forEach(el => { if(el !== item) el.classList.remove('swiped'); }); startX = e.touches[0].clientX; };
        item.ontouchmove = (e) => { let diff = startX - e.touches[0].clientX; if (diff > 50) item.classList.add('swiped'); if (diff < -50) item.classList.remove('swiped'); };
        item.onmousedown = (e) => { document.querySelectorAll('.list-item.swiped').forEach(el => { if(el !== item) el.classList.remove('swiped'); }); startX = e.clientX; };
        item.onmousemove = (e) => { if(e.buttons === 1) { let d = startX - e.clientX; if (d > 50) item.classList.add('swiped'); if (d < -50) item.classList.remove('swiped'); } };

        wrapper.appendChild(delBtn);
        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}

function switchTab(tab, btnElement) {
    document.querySelectorAll('.main-toggle .toggle-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    document.getElementById('chart-container').style.display = tab === 'chart' ? 'block' : 'none';
    document.getElementById('list-container-wrapper').style.display = tab === 'list' ? 'flex' : 'none';
}

function renderMonthlyCalendar() {
    const container = document.getElementById('monthly-content');
    container.innerHTML = '';
    
    const dataTree = {};
    
    expenses.forEach(ex => {
        let cleanDate = formatCleanDate(ex.date);
        
        let y, m, day;
        if (cleanDate && cleanDate.includes('-')) {
            const parts = cleanDate.split('-');
            y = parts[0]; m = parts[1]; day = parts[2];
        } else {
            const d = new Date(ex.id);
            y = String(d.getFullYear()); m = String(d.getMonth() + 1).padStart(2, '0'); day = String(d.getDate()).padStart(2, '0');
        }

        if(!dataTree[y]) dataTree[y] = {};
        if(!dataTree[y][m]) dataTree[y][m] = { totalExp: 0, totalInc: 0, days: {} };
        if(!dataTree[y][m].days[day]) dataTree[y][m].days[day] = { totalExp: 0, records: [] };
        
        dataTree[y][m].days[day].records.push(ex);
        
        if (ex.type === 'expense') {
            dataTree[y][m].totalExp += ex.amount;
            dataTree[y][m].days[day].totalExp += ex.amount;
        } else if (ex.type === 'income') {
            dataTree[y][m].totalInc += ex.amount;
        }
    });

    if (Object.keys(dataTree).length === 0) {
        container.innerHTML = '<div style="text-align:center; margin-top: 30px; color:#8fa3ad;">目前還沒有紀錄喔！</div>';
        return;
    }

    Object.keys(dataTree).sort((a,b)=>b-a).forEach(y => {
        const yTitle = document.createElement('div');
        yTitle.className = 'calendar-year-title';
        yTitle.innerText = `${y}年`;
        container.appendChild(yTitle);

        Object.keys(dataTree[y]).sort((a,b)=>b-a).forEach(m => {
            const mData = dataTree[y][m];
            
            const mCard = document.createElement('div');
            mCard.className = 'calendar-month-card';

            const mHeader = document.createElement('div');
            mHeader.className = 'calendar-month-header';
            
            const balance = mData.totalInc - mData.totalExp;
            
            mHeader.innerHTML = `
                <div class="month-name">${parseInt(m)}月</div>
                <div class="month-stats">
                    <div style="color: var(--income-color);">月收入: $${mData.totalInc}</div>
                    <div style="color: var(--danger);">月支出: $${mData.totalExp}</div>
                    <div style="color: var(--text-color); font-size: 14px;">餘額: $${balance}</div>
                </div>
            `;
            mCard.appendChild(mHeader);

            const weekHeader = document.createElement('div');
            weekHeader.className = 'calendar-grid week-header';
            ['日','一','二','三','四','五','六'].forEach(w => {
                const wSpan = document.createElement('span');
                wSpan.innerText = w;
                weekHeader.appendChild(wSpan);
            });
            mCard.appendChild(weekHeader);

            const daysGrid = document.createElement('div');
            daysGrid.className = 'calendar-grid days-grid';

            const firstDayObj = new Date(y, parseInt(m)-1, 1);
            const firstDayIndex = firstDayObj.getDay(); 
            
            for(let i = 0; i < firstDayIndex; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day empty';
                daysGrid.appendChild(emptyCell);
            }

            const daysInMonth = new Date(y, parseInt(m), 0).getDate();

            for(let d = 1; d <= daysInMonth; d++) {
                const dayStr = String(d).padStart(2, '0');
                const cell = document.createElement('div');
                cell.className = 'calendar-day';
                
                const dData = mData.days[dayStr];
                
                if(dData) {
                    cell.classList.add('has-record');
                    
                    let amtHtml = '';
                    if (dData.totalExp > 0) {
                        amtHtml = `<div class="date-amt">${dData.totalExp}</div>`;
                    }
                    
                    cell.innerHTML = `
                        <div class="date-num">${d}</div>
                        ${amtHtml}
                    `;
                    const dateKey = `${y}-${m}-${dayStr}`;
                    cell.onclick = () => openDayDetail(dateKey, dData.records);
                } else {
                    cell.innerHTML = `<div class="date-num">${d}</div>`;
                }
                
                daysGrid.appendChild(cell);
            }

            mCard.appendChild(daysGrid);
            container.appendChild(mCard);
        });
    });
}

function openDayDetail(dateString, records) {
    const modal = document.getElementById('day-detail-modal');
    document.getElementById('detail-date-title').innerText = dateString.replace(/-/g, '/');
    
    const expensesOnly = records.filter(e => e.type === 'expense');
    let grandTotal = 0;
    const totals = {};
    
    expensesOnly.forEach(ex => { 
        totals[ex.category] = (totals[ex.category] || 0) + ex.amount; 
        grandTotal += ex.amount;
    });
    
    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);
    const bgColors = labels.map(k => CAT_COLORS[k] || "#ccc");
    
    const ctx = document.getElementById('detailExpenseChart').getContext('2d');
    if (detailPieChart) detailPieChart.destroy();
    
    detailPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 2, borderColor: '#f2f5f6' }] },
        options: { cutout: '75%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { let label = context.label || ''; let value = context.raw || 0; let percentage = grandTotal > 0 ? Math.round((value / grandTotal) * 100) + '%' : '0%'; return label ? label + ': ' + percentage : percentage; } } } } }
    });
    
    document.getElementById('detail-chart-center-text').innerHTML = `<span style="font-size:12px; color:#8fa3ad; margin-bottom:2px;">當日總支出</span><span style="font-size:22px; font-weight:bold; color:var(--text-color);">$${grandTotal}</span>`;
    
    const listContainer = document.getElementById('detail-list-container');
    listContainer.innerHTML = '';
    
    [...records].reverse().forEach(ex => {
        const item = document.createElement('div');
        item.className = 'list-item static-item'; 
        const color = CAT_COLORS[ex.category] || "#ccc";
        const displayAmt = ex.type === 'income' ? `+${ex.amount}` : `$${ex.amount}`;
        const amtColor = ex.type === 'income' ? 'var(--income-color)' : 'var(--text-color)';
        
        item.innerHTML = `
            <div class="color-indicator" style="background:${color}"></div>
            <div style="flex:1">
                <div class="list-cat">${ex.category}</div>
                <div class="list-memo">${ex.memo || ''}</div>
            </div>
            <div class="list-amt" style="color:${amtColor}">${displayAmt}</div>
        `;
        listContainer.appendChild(item);
    });
    
    modal.classList.add('show');
}

function closeDayDetail() {
    document.getElementById('day-detail-modal').classList.remove('show');
}
