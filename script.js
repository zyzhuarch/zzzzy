const CATEGORIES = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "理財/投資", "數位/軟體", "嗜好/裝備"];
let expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
let selectedCategory = "";
let pieChart = null;
let currentTab = 'chart'; // 紀錄當前是顯示圖表還是清單

window.onload = () => {
    // 產生分類按鈕
    const grid = document.getElementById('category-grid');
    CATEGORIES.forEach(cat => {
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

    // 初始更新統計區
    updateStats();

    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    }, 1000);
};

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('chart-container').style.display = tab === 'chart' ? 'block' : 'none';
    document.getElementById('list-container').style.display = tab === 'list' ? 'flex' : 'none';
    
    updateStats(); // 切換時也重新渲染內容
}

function addExpense() {
    const amt = document.getElementById('amount-input').value;
    const memo = document.getElementById('memo-input').value;
    if (!selectedCategory || !amt) return alert("請先選擇分類並輸入金額喔！");

    expenses.push({ 
        id: Date.now(), 
        category: selectedCategory, 
        amount: parseInt(amt), 
        memo, 
        date: new Date().toLocaleDateString() 
    });
    
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    
    // 清空輸入並更新上方統計
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    updateStats(); 
}

function updateStats() {
    // 1. 更新圖表
    const totals = {}; CATEGORIES.forEach(c => totals[c] = 0);
    expenses.forEach(ex => totals[ex.category] += ex.amount);
    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: ['#333', '#4c85b4', '#777', '#999', '#BBB', '#DDD', '#E5E5E5', '#F0F0F0', '#2C2C2C', '#4A4A4A', '#888'], borderWidth: 0 }] },
        options: { cutout: '70%', plugins: { legend: { display: false } } } // 隱藏圖例讓版面更乾淨
    });

    // 2. 更新清單
    const container = document.getElementById('list-container');
    container.innerHTML = "";
    [...expenses].reverse().forEach(ex => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item-wrapper';
        
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.innerText = "刪除";
        delBtn.onclick = () => {
            if(confirm("大大，確定要刪除這筆紀錄嗎？")) {
                expenses = expenses.filter(e => e.id !== ex.id);
                localStorage.setItem('my_expenses', JSON.stringify(expenses));
                updateStats();
            }
        };

        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<div><div class="list-cat">${ex.category}</div><div class="list-memo">${ex.memo || ''} (${ex.date})</div></div><div class="list-amt">$${ex.amount}</div>`;
        
        // 滑動邏輯
        let startX = 0;
        item.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
        item.addEventListener('touchmove', (e) => {
            let diff = startX - e.touches[0].clientX;
            if (diff > 50) item.classList.add('swiped');
            if (diff < -50) item.classList.remove('swiped');
        });
        // 電腦版滑動支援
        item.addEventListener('mousedown', (e) => startX = e.clientX);
        item.addEventListener('mousemove', (e) => { if(e.buttons === 1) { let diff = startX - e.clientX; if (diff > 50) item.classList.add('swiped'); if (diff < -50) item.classList.remove('swiped'); } });

        wrapper.appendChild(delBtn);
        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}