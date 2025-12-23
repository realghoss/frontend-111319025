// === YouTube API 背景影片控制 ===
var player;
var isIntroDone = false; // 紀錄是否已經過完開場動畫

// 1. 載入 YouTube IFrame Player API 代碼
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. 當 API 準備好時，建立播放器
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: 'vWbDEsDbXBA', // 你的影片 ID
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'rel': 0,
            'loop': 0,
            'playsinline': 1,
            'disablekb': 1,
            'origin': window.location.origin, // 重要！
            'enablejsapi': 1,
            'modestbranding': 1,
            'iv_load_policy': 3
        },
        events: {
            'onStateChange': onPlayerStateChange,
            // ★★★ 新增：當播放器準備好時 ★★★
            'onReady': onPlayerReady
        }
    });
}

// 當 YouTube 播放器準備完成時觸發
function onPlayerReady(event) {
    // 1. 隱藏 Loading 畫面
    const loader = document.getElementById('loader-screen');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);

    // 2. 顯示 ENTER SITE 按鈕
    const startOverlay = document.getElementById('start-overlay');
    startOverlay.style.display = 'flex'; // 恢復顯示

    // 3. 預先載入影片 (讓它偷跑一下緩衝，這樣點擊時會更順)
    // 注意：有些瀏覽器可能會擋，但這行有助於加速
    player.mute();
    // event.target.playVideo(); // 先偷跑播放
    // setTimeout(() => { event.target.pauseVideo(); }, 100); // 0.1秒後暫停
}

// 3. 使用者點擊 "ENTER SITE" 後觸發
function startExperience() {
    // 隱藏遮罩
    document.getElementById('start-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('start-overlay').style.display = 'none';
    }, 500);

    if (player && player.playVideo) {
        player.unMute();
        player.setVolume(50); // 預設音量 50
        player.playVideo();

        // --- 修改：顯示新的音量面板 ---
        document.getElementById('volume-control-panel').style.display = 'flex';

        checkIntroTime();
    }
}

// 4. 監控時間：前 8 秒開場 -> 轉場 -> 背景模式
function checkIntroTime() {
    var checkInterval = setInterval(function () {
        if (!player || !player.getCurrentTime) return;

        var currentTime = player.getCurrentTime();

        // 如果播放超過 8 秒，且還沒執行過轉場
        if (currentTime > 8 && !isIntroDone) {
            isIntroDone = true;

            // A. 加上 .faded class (讓 CSS 控制變淡)
            document.querySelector('.video-background').classList.add('faded');

            // ★★★ 關鍵修改：強制清除 iframe 上的行內 opacity 設定 ★★★
            // 這樣 CSS 的 .faded 才能生效！
            player.getIframe().style.opacity = "";

            // B. 網頁內容浮現
            document.getElementById('main-hero-content').classList.add('visible');

            // C. 導覽列浮現
            document.getElementById('site-header').classList.remove('nav-hidden');
            document.getElementById('site-header').classList.add('nav-visible');

            clearInterval(checkInterval);
        }
    }, 500);
}

// 5. 狀態改變監聽 (關鍵修改！)
function onPlayerStateChange(event) {
    var iframe = player.getIframe();

    // 當影片播放結束 (State = 0)
    if (event.data === YT.PlayerState.ENDED) {
        // ★★★ 關鍵修改 1：先把動畫關掉，讓它「瞬間」消失 ★★★
        iframe.style.transition = 'none';

        // 然後設為透明 (這時候就會是 0 秒切換，不會拖泥帶水)
        iframe.style.opacity = 0;

        // 等待 5 秒重播
        setTimeout(function () {
            player.seekTo(0);
            player.playVideo();
        }, 5000);
    }

    // 當影片開始播放 (State = 1)
    if (event.data === YT.PlayerState.PLAYING) {
        // ★★★ 關鍵修改 2：重播時，把動畫加回來 ★★★
        // 這樣背景浮現時才會柔和，不會突然閃出來
        iframe.style.transition = 'opacity 2s ease';

        // 清空行內樣式，交還給 CSS 控制 (維持背景亮度)
        iframe.style.opacity = "";
    }
}
// 6. 新增：音量滑桿控制
function toggleVolumePanel() {
    const panel = document.getElementById('volume-control-panel');
    panel.classList.toggle('active'); // 切換 active class 來展開/收合
}

function changeVolume(vol) {
    if (player) {
        player.setVolume(vol);

        // 更新圖示
        const icon = document.getElementById('volume-icon');
        if (vol == 0) {
            icon.innerHTML = '🔇';
        } else {
            icon.innerHTML = '🔊';
        }
    }
}

// 7. 修改：快速靜音切換 (配合滑桿連動)
function toggleMute() {
    var slider = document.getElementById('volume-slider');

    if (player.isMuted()) {
        player.unMute();
        // 恢復到滑桿目前的數值
        player.setVolume(slider.value);
        document.getElementById('volume-icon').innerHTML = '🔊';
    } else {
        player.mute();
        document.getElementById('volume-icon').innerHTML = '🔇';
    }
}


// ==========================================
// 0. 頁面切換邏輯 (SPA Navigation)
// ==========================================
function switchPage(pageId) {
    // 1. 隱藏所有頁面區塊
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    // 2. 顯示目標區塊
    const targetSection = document.getElementById('section-' + pageId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // 3. 更新導覽列按鈕狀態
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    const activeNav = document.getElementById('nav-' + pageId);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

// ==========================================
// 1. 卡片資料庫 (Cards Data)
// ==========================================
const cardsData = [
    { id: 1, name: "松鼠", class: "elf", cost: 2, atk: "2", hp: "2", image: "images/el1-2-5.png", desc: "" },
    { id: 1, name: "甲蟲", class: "elf", cost: 3, atk: "0", hp: "2", image: "images/el1-5-2.png", desc: "" },
    { id: 1, name: "老頭", class: "elf", cost: 8, atk: "6", hp: "6", image: "images/el2-4-6.png", desc: "" },
    { id: 1, name: "松鼠", class: "elf", cost: 9, atk: "2", hp: "2", image: "images/el2-5-1.png", desc: "" },

    { id: 2, name: "迅捷劍", class: "royal", cost: 1, atk: "1", hp: "1", image: "images/ro1-1-1.png", desc: "疾馳" },
    { id: 2, name: "魯米那斯騎士", class: "royal", cost: 1, atk: "1", hp: "1", image: "images/ro1-1-2.png", desc: "當自己的士兵‧從者卡進入戰場時，到回合結束為止，使這張卡片+1/+0。 <br>【進化時】召喚1張『騎士』到自己的戰場上。" },
    { id: 2, name: "劍閃", class: "royal", cost: 1, atk: "N/A", hp: "N/A", image: "images/ro1-1-3.png", desc: "【融合】財寶‧卡片<br>隨機給予1張敵方戰場上的從者卡2點傷害。增加1張『黃金短劍』到自己的手牌中。如果已有卡片與這張卡片進行【融合】，則會由自己的牌堆中抽取1張卡片。" },
    { id: 2, name: "財寶庫", class: "royal", cost: 1, atk: "N/A", hp: "N/A", image: "images/ro1-1-4.png", desc: "【策動】破壞這張卡片。指定1個【模式】並發動該能力。<br>（1）增加1張『黃金短劍』與1張『黃金首飾』到自己的手牌中。<br>（2）增加1張『黃金之杯』與1張『黃金之靴』到自己的手牌中。" },
    { id: 2, name: "異端武士", class: "royal", cost: 2, atk: "2", hp: "1", image: "images/ro1-1-6.png", desc: "【入場曲】如果為已超進化解禁的回合，則會使這張卡片獲得【必殺】。<br>【突進】" },
    { id: 2, name: "你怎麼敢不解槍士的?", class: "royal", cost: 2, atk: "1", hp: "2", image: "images/ro1-2-1.png", desc: "【入場曲】召喚1張『騎士』到自己的戰場上。<br>當自己的士兵‧從者卡進入戰場時，使其獲得【突進】。" },
    { id: 2, name: "王女", class: "royal", cost: 2, atk: "1", hp: "1", image: "images/ro1-2-4.png", desc: "【入場曲】增加1張『沉穩的女僕‧諾嘉』到自己的手牌中。<br>【潛行】<br>【超進化時】使自己戰場上全部的其他從者卡+1/+1。" },
    { id: 2, name: "杯、靴", class: "royal", cost: 2, atk: "2", hp: "1", image: "images/ro1-2-5.png", desc: "【入場曲】增加1張『黃金之靴』到自己的手牌中。<br>【謝幕曲】增加1張『黃金之杯』到自己的手牌中。" },
    { id: 2, name: "首、劍", class: "royal", cost: 2, atk: "1", hp: "2", image: "images/ro1-2-6.png", desc: "【入場曲】增加1張『黃金首飾』到自己的手牌中。<br>【謝幕曲】增加1張『黃金短劍』到自己的手牌中。" },
    { id: 2, name: "槍哥", class: "royal", cost: 3, atk: "1", hp: "1", image: "images/ro1-4-4.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 3, atk: "1", hp: "1", image: "images/ro1-4-5.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 3, atk: "1", hp: "1", image: "images/ro1-5-2.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 4, atk: "1", hp: "1", image: "images/ro2-1-2.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 4, atk: "1", hp: "1", image: "images/ro2-1-4.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 4, atk: "1", hp: "1", image: "images/ro2-1-6.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 5, atk: "1", hp: "1", image: "images/ro2-2-5.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 6, atk: "1", hp: "1", image: "images/ro2-4-1.png", desc: "" },
    { id: 2, name: "瞬息的迅捷劍士", class: "royal", cost: 7, atk: "1", hp: "1", image: "images/ro2-4-5.png", desc: "" },


    { id: 3, name: "次元超越", class: "witch", cost: 1, atk: "-", hp: "-", image: "images/wi1-1-3.png", desc: "" },
    { id: 3, name: "次元超越", class: "witch", cost: 1, atk: "-", hp: "-", image: "images/wi1-1-4.png", desc: "" },
    { id: 3, name: "次元超越", class: "witch", cost: 3, atk: "-", hp: "-", image: "images/wi1-4-6.png", desc: "" },
    { id: 3, name: "次元超越", class: "witch", cost: 4, atk: "-", hp: "-", image: "images/wi1-5-6.png", desc: "" },
    { id: 3, name: "次元超越", class: "witch", cost: 5, atk: "-", hp: "-", image: "images/wi2-2-6.png", desc: "" },
    { id: 3, name: "次元超越", class: "witch", cost: 6, atk: "-", hp: "-", image: "images/wi2-3-5.png", desc: "" },
    { id: 3, name: "次元超越", class: "witch", cost: 18, atk: "-", hp: "-", image: "images/wi2-5-2.png", desc: "" },

    { id: 4, name: "巴哈姆特", class: "dragon", cost: 2, atk: "9", hp: "9", image: "images/dr1-2-6.png", desc: "" },
    { id: 4, name: "巴哈姆特", class: "dragon", cost: 3, atk: "9", hp: "9", image: "images/dr1-4-1.png", desc: "" },
    { id: 4, name: "巴哈姆特", class: "dragon", cost: 3, atk: "9", hp: "9", image: "images/dr1-4-4.png", desc: "" },
    { id: 4, name: "巴哈姆特", class: "dragon", cost: 5, atk: "9", hp: "9", image: "images/dr2-1-1.png", desc: "" },
    { id: 4, name: "巴哈姆特", class: "dragon", cost: 7, atk: "9", hp: "9", image: "images/dr2-3-4.png", desc: "" },

    { id: 6, name: "吸血鬼", class: "abyss", cost: 7, atk: "2", hp: "1", image: "images/ab2-4-4.png", desc: "必殺。" },
    { id: 6, name: "吸血鬼", class: "abyss", cost: 8, atk: "2", hp: "1", image: "images/ab2-4-6.png", desc: "必殺。" },
    { id: 6, name: "吸血鬼", class: "abyss", cost: 9, atk: "2", hp: "1", image: "images/ab2-5-2.png", desc: "必殺。" },

    { id: 7, name: "天界獵犬", class: "bishop", cost: 1, atk: "2", hp: "2", image: "images/bi1-1-5.png", desc: "守護。" },
    { id: 7, name: "天界獵犬", class: "bishop", cost: 3, atk: "2", hp: "2", image: "images/bi1-4-6.png", desc: "守護。" },
    { id: 7, name: "天界獵犬", class: "bishop", cost: 3, atk: "2", hp: "2", image: "images/bi1-5-1.png", desc: "守護。" },

    { id: 8, name: "古代創造物", class: "nemesis", cost: 2, atk: "3", hp: "1", image: "images/ne1-2-2.png", desc: "突進。" },
    { id: 8, name: "古代創造物", class: "nemesis", cost: 2, atk: "3", hp: "1", image: "images/ne1-3-4.png", desc: "突進。" },
    { id: 8, name: "古代創造物", class: "nemesis", cost: 3, atk: "3", hp: "1", image: "images/ne1-5-1.png", desc: "突進。" },
];

const grid = document.getElementById('card-grid');

// ==========================================
// 2. 卡片渲染邏輯 (Render Logic)
// ==========================================
function renderCards(filterClass = 'all', filterCost = 'all', searchTerm = '') {
    if (!grid) return; // 防止找不到元素時報錯
    grid.innerHTML = '';

    const filtered = cardsData.filter(card => {
        const matchClass = filterClass === 'all' || card.class === filterClass;
        const matchCost = filterCost === 'all' || (filterCost === '7' ? card.cost >= 7 : card.cost == filterCost);
        const matchName = card.name.includes(searchTerm);
        return matchClass && matchCost && matchName;
    });

    filtered.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-item';
        cardEl.innerHTML = `<img src="${card.image}" alt="${card.name}">`;
        cardEl.addEventListener('click', () => openCardModal(card));
        grid.appendChild(cardEl);
    });
}

// 綁定過濾器事件
const filterClass = document.getElementById('filter-class');
const filterCost = document.getElementById('filter-cost');
const searchInput = document.getElementById('search-input');

if (filterClass && filterCost && searchInput) {
    filterClass.addEventListener('change', (e) => renderCards(e.target.value, filterCost.value, searchInput.value));
    filterCost.addEventListener('change', (e) => renderCards(filterClass.value, e.target.value, searchInput.value));
    searchInput.addEventListener('input', (e) => renderCards(filterClass.value, filterCost.value, e.target.value));
}

// ==========================================
// 3. 統一彈出視窗控制 (Modal Control)
// ==========================================
const cardModal = document.getElementById('card-modal');
const ruleModal = document.getElementById('rule-modal');

// --- A. 卡片視窗邏輯 ---
function openCardModal(card) {
    document.getElementById('modal-img').src = card.image;
    document.getElementById('modal-name').textContent = card.name;
    document.getElementById('modal-class').textContent = card.class.toUpperCase();
    document.getElementById('modal-cost').textContent = card.cost;
    document.getElementById('modal-atk').textContent = card.atk;
    document.getElementById('modal-hp').textContent = card.hp;
    document.getElementById('modal-desc').innerHTML = card.desc;

    if (cardModal) cardModal.style.display = 'flex';
}

// 綁定卡片視窗關閉按鈕
const cardCloseBtn = document.querySelector('#card-modal .close-btn');
if (cardCloseBtn) {
    cardCloseBtn.addEventListener('click', () => {
        cardModal.style.display = 'none';
    });
}

// --- B. 規則視窗邏輯 ---
function openRuleModal(ruleKey) {
    // 需要先定義 rulesData (在下方)，所以這裡會存取全域變數
    const data = rulesData[ruleKey];
    if (data && ruleModal) {
        document.getElementById('rule-modal-title').textContent = data.title;
        document.getElementById('rule-modal-body').innerHTML = data.content;
        ruleModal.style.display = 'flex';
    }
}

// 綁定規則視窗關閉按鈕
const ruleCloseBtn = document.querySelector('#rule-modal .close-btn');
if (ruleCloseBtn) {
    ruleCloseBtn.addEventListener('click', () => {
        ruleModal.style.display = 'none';
    });
}

// --- C. 點擊背景關閉 ---
window.onclick = (e) => {
    if (e.target == cardModal) cardModal.style.display = 'none';
    if (e.target == ruleModal) ruleModal.style.display = 'none';
}

// ==========================================
// 4. 雷達圖功能 (Radar Chart)
// ==========================================
let myRadarChart = null;

function initRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;

    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['解場', '打頭', '節奏', '回血', '搓盾'],
            datasets: [{
                label: '能力值',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                borderColor: '#D4AF37',
                borderWidth: 2,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: '#333' },
                    grid: { color: '#333' },
                    pointLabels: { color: '#e0e0e0', font: { size: 14 } },
                    suggestedMin: 0,
                    suggestedMax: 5,
                    ticks: { display: false, maxTicksLimit: 6 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function showRadar(dataArray, deckName) {
    if (!myRadarChart) initRadarChart();
    myRadarChart.data.datasets[0].data = dataArray;
    document.getElementById('chart-title').innerHTML = deckName + " 能力分析";
    myRadarChart.update();
}

// ==========================================
// 5. 本週熱門卡組功能
// ==========================================
let myWeeklyChart = null;

const weeklyDecksData = {
    'lootroyal': {
        title: '財寶皇 - 運籌帷幄 最強進攻卡組',
        img: 'images/decks/lootroyal.png',
        intro: '難度:困難<br>以財寶系列卡牌獲取財寶，再將財寶活用於各種情況的牌組。因為其不講理的【連續輸出】而穩坐T0位置，但同時也是個【節奏靈活/不穩定】的雙面刃。',
        strat: '起手留換盡量找「3/3/3歐克托莉絲」和任意2費牌，並依照對手的中盤舖場能力考慮抓解場對策。持續累計手牌，當集齊能連續打頭致死的輸出牌後，再連續打出，不留給對方喘息機會。',
        stats: [5, 5, 2, 2, 2]
    },

    'earthwitch': {
        title: '進化土法 - 絕對血量優勢 最強防守卡組',
        img: 'images/decks/earthwitch.png',
        intro: '難度:簡單<br>以土片軸為核心進行解場，再以進化軸斬殺，是【全盤強勢且富續航力】的牌組。【超高回血量】亦是其T0的一大原因。',
        strat: '起手抓能堆土的牌，為「8/5/5拉拉安瑟姆」的無限復活做準備。中盤多利用自動進化牌刷奧義，在「6/7/6聖德芬」解放奧義發動後，便能做到:超進化拉拉安瑟姆過2盾打8、聖德芬打10、法術打2的一回殺戰術。',
        stats: [4, 4, 4, 5, 2]
    },

    'evoroyal': {
        title: '進化皇 - 盤面火力壓制',
        img: 'images/decks/evoroyal.png',
        intro: '難度:簡單<br>從序盤開始【持續壓制】對手，不停考驗對方橫向解場能力。尾盤還能連續做出5隻超進化的大場面，使對方不得不按投降。',
        strat: '起手抓低費牌和「4/4/4王斷天宮」，確保一開始節奏不斷。後續便是不停出功課給對方寫，8費的「6/4/4艾蜜莉亞」+「5/1/3魯米納斯法師」combo，抑或是9費的「4/4/3席耶提」+「5/1/3魯米納斯法師」combo，直到對手不支倒下為止。',
        stats: [4, 3, 5, 2, 4]
    },
    'questbishop': {
        title: '紋章教 - 往日榮光仍在',
        img: 'images/decks/questbishop.png',
        intro: '難度:困難<br>以【紋章數量分配傷害】給對手的牌組。只要將對手的場面解掉，對方主戰者便必須吃下紋章數量的傷害，不停扣血。',
        strat: '起手抓抽牌卡和「3/2/3格里姆尼爾」，並盡量準時拍出「4/4/4瑪文」和「6/4/6維爾伯特」，以最快疊上5個紋章。',
        stats: [3, 2, 3, 4, 5]
    },
    'destroynemesis': {
        title: '破壞仇 - 終焉倒計時',
        img: 'images/decks/destroynemesis.png',
        intro: '難度:普通<br>以破壞自己場上的牌來觸發【破壞自己卡片時】和【被破壞時】效果。兼具穩定回血、打頭且又有爆發，常常能使敵人錯估局勢而被逆轉。',
        strat: '起手全力找抽牌卡和能下蛋的牌，場上有3顆蛋便能穩固勝利。橫向解場較弱，遇到特定職業要提前保留能多解的牌。小心奧丁把蛋插掉。',
        stats: [3, 3, 2, 4, 3]
    },
    'modeabyss': {
        title: '模式夜 - 等我寫完作業',
        img: 'images/decks/modeabyss.png',
        intro: '難度:普通<br>每次進行【模式選擇】能累計信仰，當信仰>=10後，拍出「2/2/2夏姆納可亞」便能永久多選擇一個的選項。',
        strat: '序盤抓低費解場牌，保證在疊信仰時不被偷太多血量。盡量早拍出「2/2/2夏姆納可亞」，已將場面優勢導回己方。後續防斬用「5/4/4團結者」、逼不得已用「9/5/9銀雪夕月」，將高級資源最大利用。',
        stats: [3, 3, 3, 4, 4]
    },
    'rinoelf': {
        title: '蟲妖 - 爆發勢不可擋',
        img: 'images/decks/rinoelf.png',
        intro: '難度:極困難<br>在手牌中累積「0費卡片」，再利用「3/0/2殺戮破魔蟲」的攻擊力=連擊數特性，一回合突破防守，斬殺對方。',
        strat: '起手抓「2費/磷光輝岩」和「3費/聖樹權杖」，一邊解場一邊set斬殺所需的資源。一般而言，本回合能打出的傷害為[甲蟲數量*(費用-甲蟲數量*3+0費牌張數)]。',
        stats: [4, 5, 2, 2, 1]
    },
    'midabyss': {
        title: '中速夜 - 死者軍團',
        img: 'images/decks/midabyss.png',
        intro: '難度:普通<br>以夜魔【高效的鋪場】為核心，在從者戰上贏過對方的牌組。將小優勢以舖場的方式擴大，再以buff場上從者的牌終結對手。',
        strat: '起手抓2費牌穩固墓地和死靈術以利中盤解場，找機會拍下「6/3/3屍骸士兵」和「6/2/7巴薩拉加」得到場面優勢，再以「6/2/4涅槃」或「8/6/6凱爾貝洛斯」提高在場從者攻擊力，直取對手。',
        stats: [2, 3, 4, 4, 4]
    },
    'facedragon': {
        title: '臉龍 - 打頭慾望強烈',
        img: 'images/decks/facedragon.png',
        intro: '難度:超簡單<br>臉龍的臉是【打臉】的意思，顧名思義沒有甚麼好思顧的，打臉就對了。',
        strat: '大哥!!大哥救救我呀!!',
        stats: [2, 5, 3, 2, 3]
    },
    'puppetnemesis': {
        title: '人偶仇 - 蹲得越低...',
        img: 'images/decks/puppetnemesis.png',
        intro: '難度:簡單<br>前期以【人偶】進行穩定解場，尾盤再以【少數爆發牌】一口氣拿下對手。從開服就存在的牌組，卻始終面臨著同樣的問題:我的奧契絲呢?',
        strat: '牌組看似簡單且有不錯的雷達圖數值，其實卻有著高度的不穩定性。5費一定要拍到「5/3/3枷薇」，8費以後盡量拍出「8/5/5奧契絲」等打頭的牌。',
        stats: [4, 4, 3, 2, 4]
    },
    'evodragon': {
        title: '進化龍 - 我賭對面解不掉',
        img: 'images/decks/evodragon.png',
        intro: '難度:簡單<br>類似節奏牌組而更著重於【超進化數量】，將「10/4/4智龍」降費後打出，以獲得盤面優勢，最後以高費終端斬殺對方。',
        strat: '前期以跳費為主，爭取「3/2/1梅格」早點超進化。輔以「7/4/4奧莉薇」雙超進化特性，目的使「10/4/4智龍」降為1甚至0費，一舉改變局勢。',
        stats: [4, 3, 4, 2, 2]
    },
};

function initWeeklyChart() {
    const ctx = document.getElementById('radarChartWeekly');
    if (!ctx) return;

    myWeeklyChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['解場', '打頭', '節奏', '回血', '搓盾'],
            datasets: [{
                label: '能力值',
                data: [5, 5, 2, 2, 2],
                backgroundColor: 'rgba(234, 42, 51, 0.2)',
                borderColor: '#ea2a33',
                borderWidth: 2,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: '#333' },
                    grid: { color: '#333' },
                    pointLabels: { color: '#e0e0e0' },
                    suggestedMin: 0,
                    suggestedMax: 5,
                    ticks: { display: false, maxTicksLimit: 6 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateWeeklyView(element, deckKey) {
    const data = weeklyDecksData[deckKey];
    if (!data) return;


    document.querySelectorAll('.weekly-tier-list li').forEach(li => {
        li.classList.remove('active');
    });

    element.classList.add('active');

    document.getElementById('weekly-title').textContent = data.title;
    document.getElementById('weekly-img').src = data.img;
    document.getElementById('weekly-intro').innerHTML = data.intro;
    document.getElementById('weekly-strat').innerHTML = data.strat;

    if (!myWeeklyChart) initWeeklyChart();
    else {
        myWeeklyChart.data.datasets[0].data = data.stats;
        myWeeklyChart.update();
    }
}

// ==========================================
// 6. 規則內容資料庫 (Rules Data)
// ==========================================
const rulesData = {
    'win': {
        title: '勝利條件',
        content: `<p>Shadowverse WB 是一款 1 對 1 的卡牌對戰遊戲。</p><p>雙方主戰者體力皆為 20 點。將對手歸零即可獲勝。</p>`
    },
    'pp': {
        title: 'PP 點數機制',
        content: `<p>PP 每回合回復並增加上限 1 點，最大 10 點。</p>`
    },
    'evo': {
        title: '進化系統',
        content: `<p>先攻第 5 回合 / 後攻第 4 回合可開始進化。</p>`
    },
    'classes': {
        title: '職業特性簡介',
        content: `<ul><li>精靈：連擊</li><li>皇家：協作</li><li>巫師：增幅</li><li>龍族：跳費</li></ul>`
    },
    'hand': {
        title: '手牌上限規則',
        content: `
            <p>遊戲中，雙方玩家的手牌上限皆為 <strong>9 張</strong>。</p>
            <br>
            <p style="color: #ff6b6b;">爆牌 (Overdraw)：</p>
            <p>當你的手牌已有 9 張時，若透過抽牌或效果獲得新卡片，該卡片會直接變成「墓場」並被破壞。</p>
        `
    }
};

// ==========================================
// 7. 初始化執行 (Init)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderCards();
    initRadarChart();
    initWeeklyChart();
});


// ==========================================
// 8. 歷史卡組系統 (History System)
// ==========================================

const historyData = {
    'v3': {
        title: "絕傑的繼承者 推薦牌組",
        decks: [
            {
                name: "馬賽班恩妖精 <br>(マゼルバインエルフ)",
                class: "elf",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 1, 4, 3, 3]
            },
            {
                name: "甲蟲妖精 <br>(リノエルフ)",
                class: "elf",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [5, 5, 1, 1, 1]
            },
            {
                name: "艾茲迪亞妖精 <br>(エズディアエルフ)",
                class: "elf",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 5, 2, 5, 2]
            },
            {
                name: "財寶皇家 <br>(財宝ロイヤル)",
                class: "royal",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 5, 2, 2, 2]
            },
            {
                name: "混軸巫師 <br>(ハイウィッチ)",
                class: "witch",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [4, 4, 4, 5, 3]
            },
            {
                name: "快攻龍族 <br>(アグロドラゴン)",
                class: "dragon",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [1, 4, 2, 3, 1]
            },
            {
                name: "OTK幻想龍族 <br>(OTKドラゴン)",
                class: "dragon",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 1, 3, 3, 2]
            },
            {
                name: "模式夜魔 <br>(モードナイトメア)",
                class: "abyss",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 3, 4, 5, 5]
            },
            {
                name: "紋章主教 <br>(クレストビショップ)",
                class: "bishop",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [5, 5, 2, 5, 5]
            },
            {
                name: "里榭娜復仇者 <br>(破壊ネメシス)",
                class: "nemesis",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [2, 4, 2, 3, 4]
            },
        ]
    },
    'v2': {
        title: "無限進化 推薦牌組",
        decks: [
            {
                name: "甲蟲妖精 <br>(リノエルフ)",
                class: "elf",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [5, 5, 1, 1, 1]
            },
            {
                name: "協作皇家 <br>(連携ロイヤル)",
                class: "royal",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [5, 3, 5, 1, 4]
            },
            {
                name: "混軸巫師 <br>(ハイウィッチ)",
                class: "witch",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [4, 5, 4, 5, 3]
            },
            {
                name: "小鳳龍族 <br>(ほーちゃんドラゴン)",
                class: "dragon",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 3, 4, 4, 2]
            },
            {
                name: "控制夜魔 <br>(コントロールナイトメア)",
                class: "abyss",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [4, 1, 4, 3, 4]
            },
            {
                name: "守護主教 <br>(守護ビショップ)",
                class: "bishop",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [2, 1, 5, 3, 5]
            },
            {
                name: "造物復仇者 <br>(アーティファクトネメシス)",
                class: "nemesis",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 3, 3, 4, 2]
            },
            {
                name: "人偶復仇者 <br>(人形ネメシス)",
                class: "nemesis",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 4, 2, 1, 2]
            }
        ]
    },
    'v1': {
        title: "傳說揭幕 推薦牌組",
        decks: [
            {
                name: "甲蟲妖精 <br>(リノエルフ)",
                class: "elf",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [5, 5, 1, 1, 1]
            },
            {
                name: "中速皇家 <br>(ミッドレンジロイヤル)",
                class: "royal",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [3, 4, 5, 1, 5]
            },
            {
                name: "增幅巫師 <br>(スペルウィッチ)",
                class: "witch",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [4, 5, 4, 3, 4]
            },
            {
                name: "造物復仇者 <br>(アーティファクトネメシス)",
                class: "nemesis",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [4, 4, 5, 4, 1]
            },
            {
                name: "人偶復仇者 <br>(人形ネメシス)",
                class: "nemesis",
                images: ["images/ro1-5-2.png", "images/ro2-4-1.png"],
                stats: [4, 4, 3, 2, 3]
            }

        ]
    }
};

// 2. 切換版本的函數
function switchHistoryVersion(element, versionKey) {
    // A. 處理側邊欄的亮燈效果
    document.querySelectorAll('#history-sidebar li').forEach(li => {
        li.classList.remove('active');
    });
    element.classList.add('active');

    // B. 取得該版本的資料
    const data = historyData[versionKey];
    if (!data) return;

    // C. 更新右側標題
    document.getElementById('history-title').textContent = data.title;

    // D. 生成牌組列表 (Render)
    const container = document.getElementById('history-list-container');
    container.innerHTML = ''; // 先清空舊的

    data.decks.forEach(deck => {
        // 建立外框
        const deckDiv = document.createElement('div');
        deckDiv.className = 'deck-item';

        // 綁定點擊事件 (更新雷達圖)
        deckDiv.onclick = function () {
            showRadar(deck.stats, deck.name);
        };

        // 職業中文對照表 (簡單版)
        const classMap = { elf: '妖', royal: '皇', witch: '巫', dragon: '龍', abyss: '魔', vampire: '魔', bishop: '主', nemesis: '仇' };
        const iconText = classMap[deck.class] || '?';

        // 填入 HTML 內容
        deckDiv.innerHTML = `
            <div class="deck-icon ${deck.class}">${iconText}</div>
            <div class="deck-imgs">
                <img src="${deck.images[0]}" alt="Card">
                <img src="${deck.images[1]}" alt="Card">
            </div>
            <div class="deck-name">${deck.name}</div>
            <span class="arrow-icon">➤</span>
        `;

        container.appendChild(deckDiv);
    });
}

// 3. 頁面載入時，預設顯示 Ver 3.0
document.addEventListener('DOMContentLoaded', () => {
    // 找到第一個版本按鈕並模擬點擊
    const firstVer = document.querySelector('#history-sidebar li');
    if (firstVer) {
        switchHistoryVersion(firstVer, 'v30');
    }
});