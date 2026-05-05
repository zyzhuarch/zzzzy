const EXP_CATS = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "理財/投資", "數位/軟體", "嗜好/裝備"];
const INC_CATS = ["薪資", "獎金", "中獎", "投資收入", "其他收入"];

// 專屬莫蘭迪色票 (藍綠灰粉為主)
const CAT_COLORS = {
    "貓咪用品": "#d6a278", "賣場/Costco": "#c48888", "餐飲": "#8dae99", "交通": "#8b9ba3",
    "生活/帳單": "#86a5b8", "購物/治裝": "#9b8dae", "娛樂/聚餐": "#d4a9b4", "醫療/健康": "#8bb0b3",
    "理財/投資": "#bd8888", "數位/軟體": "#80a3a3", "嗜好/裝備": "#a1a6a1",
    "薪資": "#8dae99", "獎金": "#d4b383", "中獎": "#c48888", "投資收入": "#86a5b8", "其他收入": "#b0b5b9"
};

let expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
let currentType = 'expense';
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
            // 先重置所有按鈕的樣式
            document.querySelectorAll('.cat-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.backgroundColor = '#f8fafa';
                b.style.color = 'var(--text-color)';
                b.style.borderColor = 'var(--border-color)';
                b.style.boxShadow = 'none';
            });
            
            // 為點擊的按鈕染上對應的圓餅圖顏色！
            btn.classList.add('selected');
            const targetColor = CAT_COLORS[cat] || 'var(--primary)';
            btn.style.backgroundColor = targetColor;
            btn.style.borderColor = targetColor;
            btn.style.color = '#ffffff';
            btn.style.boxShadow = `0 4px 10px ${targetColor}40`; // 加上淡淡的同色系陰影
            
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
        id: Date.now(), type: currentType, category: selectedCategory, amount: parseInt(amt), memo, date: new Date().toLocaleDateString() 
    });
    
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    
    // 記帳後清除分類選取狀態
    selectedCategory = "";
    renderCategoryGrid();
    updateStats(); 
}

function updateStats() {
    const totals = {};
    expenses.forEach(ex => { totals[ex.category] = (totals[ex.category] || 0) + ex.amount; });

    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);
    const bgColors = labels.map(k => CAT_COLORS[k] || "#ccc");

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 2, borderColor: '#f2f5f6' }] },
        options: { cutout: '70%', plugins: { legend: { display: false } } }
    });

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
        const amtColor = ex.type === 'income' ? 'var(--income-color)' : 'var(--text-color)';

        item.innerHTML = `
            <div class="color-indicator" style="background:${color}"></div>
            <div style="flex:1">
                <div class="list-cat">${ex.category}</div>
                <div class="list-memo">${ex.memo || ''} (${ex.date})</div>
            </div>
            <div class="list-amt" style="color:${amtColor}">${displayAmt}</div>
        `;
        
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