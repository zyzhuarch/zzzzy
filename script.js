const EXP_CATS = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "理財/投資", "數位/軟體", "嗜好/裝備"];
const INC_CATS = ["薪資", "獎金", "中獎", "投資收入", "其他收入"];

// 定義分類顏色映射 (讓圓餅圖與清單同步)
const CAT_COLORS = {
    "貓咪用品": "#ff9f43", "賣場/Costco": "#ee5253", "餐飲": "#10ac84", "交通": "#2e86de",
    "生活/帳單": "#54a0ff", "購物/治裝": "#5f27cd", "娛樂/聚餐": "#ff9ff3", "醫療/健康": "#0abde3",
    "理財/投資": "#ff6b6b", "數位/軟體": "#48dbfb", "嗜好/裝備": "#8395a7",
    "薪資": "#1dd1a1", "獎金": "#feca57", "中獎": "#ff6b6b", "投資收入": "#48dbfb", "其他收入": "#c8d6e5"
};

let expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
let currentType = 'expense'; // expense 或 income
let selectedCategory = "";
let pieChart = null;

window.onload = () => {
    renderCategoryGrid();
    updateStats();
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    }, 800);
};

// 切換支出/收入選單
function setRecordType(type) {
    currentType = type;
    selectedCategory = "";
    document.getElementById('type-exp').classList.toggle('active', type === 'expense');
    document.getElementById('type-inc').classList.toggle('active', type === 'income');
    renderCategoryGrid();
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
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategory = cat;
        };
        grid.appendChild(btn);
    });
}

function addRecord() {
    const amt = document.getElementById('amount-input').value;
    const memo = document.getElementById('memo-input').value;
    if (!selectedCategory || !amt) return alert("大大，請選擇分類並輸入金額喔！");

    expenses.push({ 
        id: Date.now(), 
        type: currentType,
        category: selectedCategory, 
        amount: parseInt(amt), 
        memo, 
        date: new Date().toLocaleDateString() 
    });
    
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    updateStats(); 
}

function updateStats() {
    // 1. 更新圖表 (區分顏色)
    const totals = {};
    expenses.forEach(ex => {
        totals[ex.category] = (totals[ex.category] || 0) + ex.amount;
    });

    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);
    const bgColors = labels.map(k => CAT_COLORS[k] || "#ccc");

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }] },
        options: { cutout: '75%', plugins: { legend: { display: false } } }
    });

    // 2. 更新清單 (加入顏色小方塊)
    const container = document.getElementById('list-container');
    container.innerHTML = "";
    [...expenses].reverse().forEach(ex => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item-wrapper';
        
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.innerText = "刪除";
        delBtn.onclick = () => {
            if(confirm("確定要刪除嗎？")) {
                expenses = expenses.filter(e => e.id !== ex.id);
                localStorage.setItem('my_expenses', JSON.stringify(expenses));
                updateStats();
            }
        };

        const item = document.createElement('div');
        item.className = 'list-item';
        const color = CAT_COLORS[ex.category] || "#ccc";
        const displayAmt = ex.type === 'income' ? `+${ex.amount}` : `$${ex.amount}`;
        const amtClass = ex.type === 'income' ? 'style="color:#52b788"' : '';

        item.innerHTML = `
            <div class="color-indicator" style="background:${color}"></div>
            <div style="flex:1">
                <div class="list-cat">${ex.category}</div>
                <div class="list-memo">${ex.memo || ''} (${ex.date})</div>
            </div>
            <div class="list-amt" ${amtClass}>${displayAmt}</div>
        `;
        
        // 滑動邏輯
        let startX = 0;
        item.ontouchstart = (e) => startX = e.touches[0].clientX;
        item.ontouchmove = (e) => {
            let diff = startX - e.touches[0].clientX;
            if (diff > 50) item.classList.add('swiped');
            if (diff < -50) item.classList.remove('swiped');
        };
        item.onmousedown = (e) => startX = e.clientX;
        item.onmousemove = (e) => { if(e.buttons === 1) { let d = startX - e.clientX; if (d > 50) item.classList.add('swiped'); if (d < -50) item.classList.remove('swiped'); } };

        wrapper.appendChild(delBtn);
        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}

function switchTab(tab) {
    document.querySelectorAll('.main-toggle .toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('chart-container').style.display = tab === 'chart' ? 'block' : 'none';
    document.getElementById('list-container').style.display = tab === 'list' ? 'flex' : 'none';
}

function switchScreen(id) {
    // 為了維持同一頁，這個功能暫時保留但可不使用
}