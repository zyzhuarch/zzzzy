// 大大專屬的 API 網址
const API_URL = "https://script.google.com/macros/s/AKfycbxN6DwZjFyuig1l3jHXuHzif8kbf751D8czPpD0BxMiXFoVrnoh1TDYSBkhHB7jj0a14g/exec";

const EXP_CATS = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "理財/投資", "數位/軟體", "嗜好/裝備"];
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

// 取得台灣當地今天的日期 YYYY-MM-DD，用於預設輸入框
function getLocalToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

window.onload = async () => {
    renderCategoryGrid();
    document.getElementById('date-input').value = getLocalToday();
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data && data.length > 0) {
            // 🌟 絕對字串魔法：雲端傳回來的資料，我們只取最原始的字串格式
            expenses = data.map(record => {
                // 清理可能出現的單引號
                if (typeof record.date === 'string' && record.date.startsWith("'")) {
                    record.date = record.date.substring(1);
                }
                // 雲端如果有 T (時間格式)，我們只取前面的日期，並把 / 統一轉回 - 確保格式一致
                if (record.date && record.date.includes('T')) {
                    record.date = record.date.split('T')[0];
                }
                record.date = record.date.replace(/\//g, '-');
                return record;
            });
            localStorage.setItem('my_expenses', JSON.stringify(expenses));
        } else {
            expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
        }
    } catch (error) {
        console.error("讀取雲端資料失敗，先使用本機暫存", error);
        expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
    }
    
    updateStats();
    
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    }, 800);
};

function cancelSwipe(e) {
    if (!e.target.closest('.delete-btn') && !e.target.closest('.list-item-wrapper')) {
        document.querySelectorAll('.list-item.swiped').forEach(item => {
            item.classList.remove('swiped');
        });
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
    
    if (view === 'monthly') renderMonthlyView();
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
    // 🌟 抓取使用者填入的 YYYY-MM-DD
    const dateVal = document.getElementById('date-input').value; 
    
    if (!selectedCategory || !amt || !dateVal) return alert("大大，請選擇分類、日期並輸入金額喔！");

    const newRecord = { 
        id: Date.now(), 
        type: currentType, 
        category: selectedCategory, 
        amount: parseInt(amt), 
        memo: memo, 
        // 🌟 網頁本機存的也是純字串 YYYY-MM-DD
        date: dateVal 
    };

    expenses.push(newRecord);
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    selectedCategory = "";
    renderCategoryGrid();
    updateStats(); 

    // 傳給雲端前，加上單引號保護字串，並把 - 換成 / (試算表比較喜歡斜線)
    const cloudRecord = { ...newRecord, date: "'" + dateVal.replace(/-/g, '/') };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: "add", data: cloudRecord }) 
        });
        console.log("成功同步新增到雲端！");
    } catch (error) {
        console.error("雲端同步失敗", error);
    }
}

function updateStats() {
    const filteredExpenses = expenses.filter(e => e.type === currentType);
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
        options: { 
            cutout: '75%', 
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let percentage = Math.round((value / grandTotal) * 100) + '%';
                            if (label) label += ': ';
                            return label + percentage;
                        }
                    }
                }
            } 
        }
    });

    const typeLabel = currentType === 'expense' ? '總支出' : '總收入';
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
                    await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ action: "delete", id: targetId })
                    });
                    console.log(`已同步刪除雲端紀錄 ID: ${targetId}`);
                } catch(error) {
                    console.error("雲端刪除失敗", error);
                }
            }
        };

        const item = document.createElement('div');
        item.className = 'list-item';
        const color = CAT_COLORS[ex.category] || "#ccc";
        const displayAmt = ex.type === 'income' ? `+${ex.amount}` : `$${ex.amount}`;
        const amtColor = ex.type === 'income' ? 'var(--income-color)' : 'var(--text-color)';

        // 🌟 網頁上的顯示，直接拿我們存的字串
        const displayDate = ex.date || '';

        item.innerHTML = `
            <div class="color-indicator" style="background:${color}"></div>
            <div style="flex:1">
                <div class="list-cat">${ex.category}</div>
                <div class="list-memo">${ex.memo || ''} (${displayDate})</div>
            </div>
            <div class="list-amt" style="color:${amtColor}">${displayAmt}</div>
        `;
        
        let startX = 0;
        item.ontouchstart = (e) => {
            document.querySelectorAll('.list-item.swiped').forEach(el => { if(el !== item) el.classList.remove('swiped'); });
            startX = e.touches[0].clientX;
        };
        item.ontouchmove = (e) => {
            let diff = startX - e.touches[0].clientX;
            if (diff > 50) item.classList.add('swiped');
            if (diff < -50) item.classList.remove('swiped');
        };
        item.onmousedown = (e) => {
            document.querySelectorAll('.list-item.swiped').forEach(el => { if(el !== item) el.classList.remove('swiped'); });
            startX = e.clientX;
        };
        item.onmousemove = (e) => { 
            if(e.buttons === 1) { 
                let d = startX - e.clientX; 
                if (d > 50) item.classList.add('swiped'); 
                if (d < -50) item.classList.remove('swiped'); 
            } 
        };

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

function renderMonthlyView() {
    const container = document.getElementById('monthly-content');
    container.innerHTML = '';
    
    const tree = {};
    
    expenses.forEach(ex => {
        // 🌟 月紀錄的解析，只認 YYYY-MM-DD
        let y, m, day;
        if (ex.date && ex.date.includes('-')) {
            const parts = ex.date.split('-');
            y = parts[0]; 
            m = parts[1]; 
            day = parts[2];
        } else {
            // 如果是很舊沒有 date 欄位的資料，才用 id 解析
            const d = new Date(ex.id);
            y = String(d.getFullYear()); 
            m = String(d.getMonth() + 1).padStart(2, '0'); 
            day = String(d.getDate()).padStart(2, '0');
        }

        const monthKey = `${y}年 ${m}月份`;
        const dateKey = `${y}/${m}/${day}`;

        if(!tree[monthKey]) tree[monthKey] = { totalExp: 0, days: {} };
        if(!tree[monthKey].days[dateKey]) tree[monthKey].days[dateKey] = { totalExp: 0, records: [] };
        
        tree[monthKey].days[dateKey].records.push(ex);
        
        if (ex.type === 'expense') {
            tree[monthKey].totalExp += ex.amount;
            tree[monthKey].days[dateKey].totalExp += ex.amount;
        }
    });

    Object.keys(tree).sort((a,b)=>b.localeCompare(a)).forEach(monthKey => {
        const mData = tree[monthKey];
        
        const mWrapper = document.createElement('div'); 
        mWrapper.className = 'history-month-wrapper';
        
        const mHeader = document.createElement('div'); 
        mHeader.className = 'history-month-header';
        mHeader.innerHTML = `<span>${monthKey}</span><span style="color:var(--danger); font-size:14px;">月總花費: $${mData.totalExp}</span>`;
        
        const daysContainer = document.createElement('div'); 
        daysContainer.className = 'history-days-container';
        
        Object.keys(mData.days).sort((a,b)=>b.localeCompare(a)).forEach(dateKey => {
            const dData = mData.days[dateKey];
            const displayDay = dateKey.split('/')[1] + '/' + dateKey.split('/')[2];
            
            const dRow = document.createElement('div'); 
            dRow.className = 'history-day-row';
            dRow.innerHTML = `
                <div class="day-info">
                    <span class="day-date">${displayDay}</span>
                    <span class="day-total">日總花費: $${dData.totalExp}</span>
                </div>
                <div class="day-arrow">➔</div>
            `;
            
            dRow.onclick = () => openDayDetail(dateKey, dData.records);
            daysContainer.appendChild(dRow);
        });
        
        mWrapper.appendChild(mHeader); 
        mWrapper.appendChild(daysContainer); 
        container.appendChild(mWrapper);
    });
    
    if (Object.keys(tree).length === 0) {
        container.innerHTML = '<div style="text-align:center; margin-top: 30px; color:#8fa3ad;">目前還沒有紀錄喔！</div>';
    }
}

function openDayDetail(dateString, records) {
    const modal = document.getElementById('day-detail-modal');
    document.getElementById('detail-date-title').innerText = dateString;
    
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
        options: { 
            cutout: '75%', 
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let percentage = grandTotal > 0 ? Math.round((value / grandTotal) * 100) + '%' : '0%';
                            return label ? label + ': ' + percentage : percentage;
                        }
                    }
                }
            } 
        }
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
