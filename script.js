const CATEGORIES = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "理財/投資", "數位/軟體", "嗜好/裝備"];
let expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
let selectedCategory = "";
let pieChart = null;

// 初始化
window.onload = () => {
    // 渲染分類按鈕
    const grid = document.getElementById('category-grid');
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'cat-btn';
        btn.innerText = cat;
        btn.onclick = () => selectCategory(cat, btn);
        grid.appendChild(btn);
    });

    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    }, 1000);
};

function selectCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedCategory = cat;
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'screen-stats') updateStats();
}

function switchTab(tab) {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('chart-container').style.display = tab === 'chart' ? 'block' : 'none';
    document.getElementById('list-container').style.display = tab === 'list' ? 'flex' : 'none';
}

function addExpense() {
    const amt = document.getElementById('amount-input').value;
    const memo = document.getElementById('memo-input').value;

    if (!selectedCategory || !amt) {
        alert("大大，請選擇分類並輸入金額喔！");
        return;
    }

    const newRecord = {
        id: Date.now(),
        category: selectedCategory,
        amount: parseInt(amt),
        memo: memo,
        date: new Date().toLocaleDateString()
    };

    expenses.push(newRecord);
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    
    // 清空輸入
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    alert("✅ 紀錄成功！");
}

function updateStats() {
    // 1. 處理圖表數據
    const totals = {};
    CATEGORIES.forEach(c => totals[c] = 0);
    expenses.forEach(ex => totals[ex.category] += ex.amount);

    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: ['#333', '#555', '#777', '#999', '#BBB', '#DDD', '#E5E5E5', '#F0F0F0', '#2C2C2C', '#4A4A4A', '#888'], borderWidth: 0 }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });

    // 2. 渲染列表與滑動刪除
    const container = document.getElementById('list-container');
    container.innerHTML = "";
    [...expenses].reverse().forEach(ex => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item-wrapper';
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<div><div class="list-cat">${ex.category}</div><div class="list-memo">${ex.memo || ''} (${ex.date})</div></div><div class="list-amt">$${ex.amount}</div>`;
        
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-label';
        delBtn.innerText = "刪除";
        delBtn.onclick = () => {
            if(confirm("確定要刪除這筆紀錄嗎？")) {
                expenses = expenses.filter(e => e.id !== ex.id);
                localStorage.setItem('my_expenses', JSON.stringify(expenses));
                updateStats();
            }
        };

        // 滑動偵測
        let startX = 0;
        item.ontouchstart = (e) => startX = e.touches[0].clientX;
        item.ontouchmove = (e) => {
            let diff = startX - e.touches[0].clientX;
            if (diff > 50) item.classList.add('swiped');
            if (diff < -50) item.classList.remove('swiped');
        };

        wrapper.appendChild(delBtn);
        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}