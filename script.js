const CATEGORIES = ["貓咪用品", "賣場/Costco", "餐飲", "交通", "生活/帳單", "購物/治裝", "娛樂/聚餐", "醫療/健康", "理財/投資", "數位/軟體", "嗜好/裝備"];
let expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
let selectedCategory = "";
let pieChart = null;

// 初始化分類按鈕
window.onload = () => {
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
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);
};

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
    if (!selectedCategory || !amt) return alert("請選擇分類並輸入金額！");

    expenses.push({ id: Date.now(), category: selectedCategory, amount: parseInt(amt), memo, date: new Date().toLocaleDateString() });
    localStorage.setItem('my_expenses', JSON.stringify(expenses));
    document.getElementById('amount-input').value = "";
    document.getElementById('memo-input').value = "";
    alert("✅ 已紀錄");
}

function updateStats() {
    const totals = {}; CATEGORIES.forEach(c => totals[c] = 0);
    expenses.forEach(ex => totals[ex.category] += ex.amount);
    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: ['#333', '#555', '#777', '#999', '#BBB', '#DDD', '#E5E5E5', '#F0F0F0', '#2C2C2C', '#4A4A4A', '#888'], borderWidth: 0 }] },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });

    const container = document.getElementById('list-container');
    container.innerHTML = "";
    [...expenses].reverse().forEach(ex => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item-wrapper';
        
        // 紅色刪除按鈕 (底層)
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.innerText = "刪除";
        delBtn.onclick = () => {
            if(confirm("確定要刪除這筆紀錄嗎？")) {
                expenses = expenses.filter(e => e.id !== ex.id);
                localStorage.setItem('my_expenses', JSON.stringify(expenses));
                updateStats();
            }
        };

        // 白色內容區 (頂層)
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<div><div class="list-cat">${ex.category}</div><div class="list-memo">${ex.memo || ''}</div></div><div class="list-amt">$${ex.amount}</div>`;
        
        // 滑動邏輯 (相容滑鼠與觸控)
        let startX = 0;
        const handleStart = (x) => startX = x;
        const handleMove = (x) => {
            let diff = startX - x;
            if (diff > 50) item.classList.add('swiped');
            if (diff < -50) item.classList.remove('swiped');
        };

        item.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX));
        item.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX));
        item.addEventListener('mousedown', (e) => handleStart(e.clientX));
        item.addEventListener('mousemove', (e) => { if(e.buttons === 1) handleMove(e.clientX); });

        wrapper.appendChild(delBtn);
        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}
