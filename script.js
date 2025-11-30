const firebaseConfig = {
    apiKey: "AIzaSyC5FKXH7a06_jXk5rkj_vsplGkga_CQ1aQ",
    authDomain: "partysoul-64201.firebaseapp.com",
    databaseURL: "https://partysoul-64201-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "partysoul-64201",
    storageBucket: "partysoul-64201.firebasestorage.app",
    messagingSenderId: "71365640479",
    appId: "1:71365640479:web:d5653d89f4a858a14c702a"
};

// Инициализация Firebase
let db, auth;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    console.log('Firebase инициализирован');
} catch (error) {
    console.error('Ошибка инициализации Firebase:', error);
}

// Глобальные переменные
let viewsData = {};
let firesData = {};
let articlesMap = new Map();
let currentUser = null;
let usernameTimeout = null;
let friendsData = {};
let friendRequests = {};
let wallPosts = {};
let currentWallUserId = null;
let wallPostsCache = new Map();

let currentStep = 1;
const totalSteps = 3;

let marketplaceItems = {};
let userBalance = 1000; // Начальный баланс для всех пользователей

// Коллекция предустановленных emoji аватаров
const defaultAvatars = [
    '😀', '😎', '🤩', '🧐', '😊', '😇', '🥰', '😍',
    '🤠', '🥳', '😜', '🤪', '😏', '😌', '😴', '🥺',
    '😋', '🤓', '😺', '😸', '😹', '😻', '😼', '😽',
    '🙈', '🙉', '🙊', '💩', '👻', '💀', '👽', '👾',
    '🤖', '🎃', '😈', '👹', '👺', '🤡', '👏', '👍',
    '❤️', '💕', '💖', '💯', '✨', '🌟', '🎉', '🎊',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄'
];

// Переменные для управления дублированием событий
let wallEventListeners = new Set();
let profileEventListeners = new Set();

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация...');
    
    // Update current date
    updateCurrentDate();
    
    // Create mobile menu button
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.innerHTML = '<span></span><span></span><span></span>';
    document.querySelector('nav .nav-container').prepend(mobileMenuButton);
    
    mobileMenuButton.addEventListener('click', function() {
        this.classList.toggle('active');
        const navList = document.querySelector('nav ul');
        navList.classList.toggle('show');
        
        // Animate hamburger to X
        const spans = this.querySelectorAll('span');
        if (this.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // Проверка авторизации для раздела "Друзья"
            if (targetId === 'friends' && !currentUser) {
                showLoginModal();
                return;
            }
            
            showSection(targetId);
            setActiveNavLink(this);
            
            // Close mobile menu if open
            if (mobileMenuButton.classList.contains('active')) {
                mobileMenuButton.click();
            }
        });
    });
    
    // Sidebar links
    document.querySelectorAll('.sidebar-link, .read-more').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                showSection(targetId);
                
                const navLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
                if (navLink) setActiveNavLink(navLink);
            }
        });
    });
    
    // Scroll to top button
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopButton.classList.add('visible');
        } else {
            scrollToTopButton.classList.remove('visible');
        }
    });
    
    scrollToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Initialize systems
    initSystems();
    
    // Image modal functionality
    document.querySelectorAll('.image-container img, .gallery-item img').forEach(img => {
        img.addEventListener('click', function() {
            createImageModal(this.src, this.alt);
        });
    });
    
    // Video initialization
    initVideos();
    
    // Initialize modals
    initAuthModals();
    
    // Initialize profile system
    initProfileSystem();
    
    // Initialize avatar system
    initAvatarSystem();
    
    // Initialize friends system
    initFriendsSystem();
    
    // Initialize wall system
    initWallSystem();
    
    // Initialize
    showSection('home');
    
    // Check mobile menu on resize
    window.addEventListener('resize', checkMobileMenu);
    checkMobileMenu();
});

// ==================== СИСТЕМА ДРУЗЕЙ С ИСПРАВЛЕННОЙ СТАТИСТИКОЙ ====================

function initFriendsSystem() {
    console.log('Инициализация системы друзей...');
    
    // Поиск друзей
    const searchBtn = document.getElementById('search-friends-btn');
    const searchInput = document.getElementById('friend-search');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchFriends);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFriends();
            }
        });
    }
    
    // Загружаем данные друзей при входе пользователя
    if (currentUser) {
        loadFriendsData();
    }
}

// Загрузка данных друзей
function loadFriendsData() {
    if (!currentUser || !db) return;
    
    console.log('Загрузка данных друзей для пользователя:', currentUser.uid);
    
    // Загружаем список друзей
    db.ref('friends/' + currentUser.uid).on('value', (snapshot) => {
        friendsData = snapshot.val() || {};
        updateFriendsList();
        console.log('Данные друзей загружены:', friendsData);
    });
    
    // Загружаем входящие заявки
    db.ref('friendRequests/' + currentUser.uid).on('value', (snapshot) => {
        friendRequests = snapshot.val() || {};
        updateFriendRequests();
        console.log('Заявки в друзья загружены:', friendRequests);
    });
}

// Обновление списка заявок и счётчика
function updateFriendRequests() {
    const requestsList = document.getElementById('friend-requests-list');
    const requestsCount = document.getElementById('requests-count');
    const requestsSection = document.getElementById('friend-requests-section');
    
    const requestUids = Object.keys(friendRequests);
    const pendingCount = requestUids.length;
    
    requestsCount.textContent = `(${pendingCount})`;
    
    // Обновляем бейдж в навигации
    updateFriendsNavBadge(pendingCount);
    
    if (pendingCount === 0) {
        requestsList.innerHTML = '<div class="no-results"><i class="fas fa-inbox"></i><p>Нет входящих заявок</p></div>';
        return;
    }
    
    let html = '';
    
    requestUids.forEach(uid => {
        const request = friendRequests[uid];
        
        html += `
            <div class="request-item">
                <div class="request-info">
                    <div class="request-avatar">
                        ${request.fromAvatar || (request.fromName ? request.fromName.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div class="request-details">
                        <h4>${request.fromName || 'Пользователь'}</h4>
                        ${request.fromUsername ? `<div class="request-username">@${request.fromUsername}</div>` : ''}
                        <div class="request-date">${new Date(request.timestamp).toLocaleDateString('ru-RU')}</div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn-accept" onclick="acceptFriendRequest('${uid}')">
                        <i class="fas fa-check"></i> Принять
                    </button>
                    <button class="btn-decline" onclick="declineFriendRequest('${uid}')">
                        <i class="fas fa-times"></i> Отклонить
                    </button>
                </div>
            </div>
        `;
    });
    
    requestsList.innerHTML = html;
}

// Функция для обновления бейджа в навигации
function updateFriendsNavBadge(count) {
    const friendsNavLink = document.querySelector('.nav-link[href="#friends"]');
    if (!friendsNavLink) return;
    
    let badge = friendsNavLink.querySelector('.notification-badge');
    
    // Удаляем существующий бейдж если нет заявок
    if (count === 0 && badge) {
        badge.remove();
        return;
    }
    
    // Создаем бейдж если его нет
    if (count > 0 && !badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge';
        friendsNavLink.style.position = 'relative';
        friendsNavLink.appendChild(badge);
    }
    
    // Обновляем количество
    if (count > 0 && badge) {
        badge.textContent = count > 9 ? '9+' : count;
    }
}

// Поиск пользователей
async function searchFriends() {
    const searchTerm = document.getElementById('friend-search').value.trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchTerm) {
        showNotification('Введите имя или username для поиска', 'warning');
        return;
    }
    
    if (!currentUser) {
        showNotification('Войдите в систему для поиска друзей', 'error');
        showLoginModal();
        return;
    }
    
    try {
        showNotification('Поиск...', 'warning');
        resultsContainer.innerHTML = '<div class="no-results"><i class="fas fa-spinner fa-spin"></i><p>Поиск...</p></div>';
        
        // Ищем пользователей по имени или username
        const usersSnapshot = await db.ref('users').once('value');
        const allUsers = usersSnapshot.val() || {};
        
        const results = [];
        
        Object.keys(allUsers).forEach(uid => {
            // Пропускаем текущего пользователя
            if (uid === currentUser.uid) return;
            
            const user = allUsers[uid];
            const userName = user.name || '';
            const userUsername = user.username || '';
            const userEmail = user.email || '';
            
            // Поиск по имени, username или email
            const searchLower = searchTerm.toLowerCase();
            if (userName.toLowerCase().includes(searchLower) || 
                userUsername.toLowerCase().includes(searchLower) ||
                userEmail.toLowerCase().includes(searchLower)) {
                
                results.push({
                    uid: uid,
                    ...user
                });
            }
        });
        
        displaySearchResults(results);
        
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showNotification('Ошибка поиска', 'error');
        resultsContainer.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><p>Ошибка поиска</p></div>';
    }
}

// Отображение результатов поиска
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Пользователи не найдены</p></div>';
        return;
    }
    
    let html = '';
    
    results.forEach(user => {
        const isFriend = friendsData[user.uid];
        const hasIncomingRequest = friendRequests[user.uid];
        
        let actionButton = '';
        
        if (isFriend) {
            actionButton = `
                <button class="btn-secondary" onclick="viewFriendProfile('${user.uid}')">
                    <i class="fas fa-user"></i> Профиль
                </button>
                <button class="btn-primary" onclick="viewUserWall('${user.uid}')">
                    <i class="fas fa-stream"></i> Стена
                </button>
            `;
        } else if (hasIncomingRequest) {
            actionButton = `<div class="friendship-status status-pending">Заявка получена</div>`;
        } else {
            actionButton = `<button class="btn-primary" onclick="sendFriendRequest('${user.uid}')">
                <i class="fas fa-user-plus"></i> Добавить
            </button>`;
        }
        
        html += `
            <div class="search-result-item">
                <div class="search-result-info">
                    <div class="search-result-avatar">
                        ${user.avatar || (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div class="search-result-details">
                        <h4>${user.name || 'Пользователь'}</h4>
                        ${user.username ? `<div class="search-result-username">@${user.username}</div>` : ''}
                    </div>
                </div>
                <div class="search-result-actions">
                    ${actionButton}
                    <button class="btn-secondary" onclick="viewFriendProfile('${user.uid}')">
                        <i class="fas fa-eye"></i> Профиль
                    </button>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Отправка заявки в друзья
async function sendFriendRequest(friendUid) {
    if (!currentUser || !db) {
        showNotification('Войдите в систему', 'error');
        return;
    }
    
    try {
        // Создаем заявку в друзья
        const requestData = {
            from: currentUser.uid,
            fromName: currentUser.name,
            fromUsername: currentUser.username,
            fromAvatar: currentUser.avatar,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        // Сохраняем заявку у получателя
        await db.ref('friendRequests/' + friendUid + '/' + currentUser.uid).set(requestData);
        
        showNotification('Заявка в друзья отправлена!', 'success');
        
        // Обновляем результаты поиска
        searchFriends();
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        showNotification('Ошибка отправки заявки', 'error');
    }
}

// Обновление списка друзей
function updateFriendsList() {
    const friendsList = document.getElementById('friends-list');
    const friendsCount = document.getElementById('friends-count');
    const noFriends = document.getElementById('no-friends');
    
    const friendUids = Object.keys(friendsData);
    friendsCount.textContent = `(${friendUids.length})`;
    
    if (friendUids.length === 0) {
        noFriends.style.display = 'block';
        friendsList.innerHTML = '';
        friendsList.appendChild(noFriends);
        return;
    }
    
    noFriends.style.display = 'none';
    
    // Загружаем данные друзей
    loadFriendsDetails(friendUids).then(friends => {
        let html = '';
        
        friends.forEach(friend => {
            if (!friend) return;
            
            html += `
                <div class="friend-item">
                    <div class="friend-avatar" onclick="viewFriendProfile('${friend.uid}')">
                        ${friend.avatar || (friend.name ? friend.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div class="friend-name">${friend.name || 'Пользователь'}</div>
                    ${friend.username ? `<div class="friend-username">@${friend.username}</div>` : ''}
                    <div class="friend-actions">
                        <button class="friend-action-btn btn-view" onclick="viewFriendProfile('${friend.uid}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="friend-action-btn btn-primary" onclick="viewUserWall('${friend.uid}')">
                            <i class="fas fa-stream"></i>
                        </button>
                        <button class="friend-action-btn btn-remove" onclick="removeFriend('${friend.uid}')">
                            <i class="fas fa-user-minus"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        friendsList.innerHTML = html;
    });
}

// Загрузка деталей друзей
async function loadFriendsDetails(friendUids) {
    const friends = [];
    
    for (const uid of friendUids) {
        try {
            const snapshot = await db.ref('users/' + uid).once('value');
            const userData = snapshot.val();
            if (userData) {
                friends.push({
                    uid: uid,
                    ...userData
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки данных друга:', error);
        }
    }
    
    return friends;
}

// Принятие заявки в друзья
async function acceptFriendRequest(fromUid) {
    try {
        const request = friendRequests[fromUid];
        
        // Добавляем в друзья у текущего пользователя
        await db.ref('friends/' + currentUser.uid + '/' + fromUid).set({
            since: new Date().toISOString(),
            ...request
        });
        
        // Добавляем в друзья у отправителя
        await db.ref('friends/' + fromUid + '/' + currentUser.uid).set({
            since: new Date().toISOString(),
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar
        });
        
        // Удаляем заявку
        await db.ref('friendRequests/' + currentUser.uid + '/' + fromUid).remove();
        
        showNotification('Заявка принята!', 'success');
        
    } catch (error) {
        console.error('Ошибка принятия заявки:', error);
        showNotification('Ошибка принятия заявки', 'error');
    }
}

// Отклонение заявки в друзья
async function declineFriendRequest(fromUid) {
    try {
        await db.ref('friendRequests/' + currentUser.uid + '/' + fromUid).remove();
        showNotification('Заявка отклонена', 'success');
        
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        showNotification('Ошибка отклонения заявки', 'error');
    }
}

// Удаление друга
async function removeFriend(friendUid) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя из друзей?')) {
        return;
    }
    
    try {
        // Удаляем у текущего пользователя
        await db.ref('friends/' + currentUser.uid + '/' + friendUid).remove();
        
        // Удаляем у друга
        await db.ref('friends/' + friendUid + '/' + currentUser.uid).remove();
        
        showNotification('Пользователь удален из друзей', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления друга:', error);
        showNotification('Ошибка удаления друга', 'error');
    }
}

// Просмотр профиля друга
async function viewFriendProfile(friendUid) {
    try {
        showNotification('Загрузка профиля...', 'warning');
        
        const snapshot = await db.ref('users/' + friendUid).once('value');
        const friendData = snapshot.val();
        
        if (!friendData) {
            showNotification('Профиль не найден', 'error');
            return;
        }
        
        await showFriendProfile(friendUid, friendData);
        showNotification('Профиль загружен', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Функция для получения реальной статистики друга
async function getFriendRealStats(friendUid) {
    try {
        // Получаем количество друзей друга
        const friendsSnapshot = await db.ref('friends/' + friendUid).once('value');
        const friendFriends = friendsSnapshot.val() || {};
        const friendsCount = Object.keys(friendFriends).length;
        
        // Получаем реальное количество огоньков друга из всех источников
        const totalFires = await calculateUserTotalFires(friendUid);
        
        console.log(`Статистика друга ${friendUid}:`, { friendsCount, totalFires });
        
        return {
            friendsCount: friendsCount,
            totalFires: totalFires
        };
        
    } catch (error) {
        console.error('Ошибка загрузки статистики друга:', error);
        return {
            friendsCount: 0,
            totalFires: 0
        };
    }
}

// Функция для расчета общего количества огоньков пользователя
async function calculateUserTotalFires(userId) {
    try {
        let totalFires = 0;
        
        // Считаем огоньки из статей
        const articlesSnapshot = await db.ref('articles').once('value');
        const articles = articlesSnapshot.val() || {};
        
        Object.values(articles).forEach(article => {
            if (article.authorId === userId) {
                totalFires += article.fires || 0;
            }
        });
        
        // Считаем огоньки из постов на стене
        const wallSnapshot = await db.ref('wall/' + userId).once('value');
        const wallPosts = wallSnapshot.val() || {};
        
        Object.values(wallPosts).forEach(post => {
            totalFires += post.fires || 0;
        });
        
        console.log(`Общее количество огоньков для ${userId}: ${totalFires}`);
        
        return totalFires;
        
    } catch (error) {
        console.error('Ошибка расчета огоньков:', error);
        return 0;
    }
}

// Отображение профиля друга с исправленной статистикой
async function showFriendProfile(friendUid, friendData) {
    const container = document.getElementById('friend-profile-container');
    const isFriend = friendsData[friendUid];
    
    let friendshipStatus = '';
    let actionButtons = '';
    
    if (isFriend) {
        friendshipStatus = '<div class="friendship-status status-friends">Друг</div>';
        actionButtons = `
            <button class="btn-primary" onclick="viewUserWall('${friendUid}')">
                <i class="fas fa-stream"></i> Посмотреть стену
            </button>
            <button class="btn-danger" onclick="removeFriend('${friendUid}')">
                <i class="fas fa-user-minus"></i> Удалить из друзей
            </button>
        `;
    } else if (friendRequests[friendUid]) {
        friendshipStatus = '<div class="friendship-status status-pending">Заявка получена</div>';
        actionButtons = `
            <button class="btn-accept" onclick="acceptFriendRequest('${friendUid}')">
                <i class="fas fa-check"></i> Принять заявку
            </button>
            <button class="btn-decline" onclick="declineFriendRequest('${friendUid}')">
                <i class="fas fa-times"></i> Отклонить
            </button>
        `;
    } else {
        friendshipStatus = '<div class="friendship-status status-not-friends">Не в друзьях</div>';
        actionButtons = `
            <button class="btn-primary" onclick="sendFriendRequest('${friendUid}')">
                <i class="fas fa-user-plus"></i> Добавить в друзья
            </button>
            <button class="btn-secondary" onclick="viewUserWall('${friendUid}')">
                <i class="fas fa-stream"></i> Посмотреть стену
            </button>
        `;
    }
    
    // ЗАГРУЖАЕМ РЕАЛЬНЫЕ ДАННЫЕ ДРУГА
    const friendStats = await getFriendRealStats(friendUid);
    
    const html = `
        <div class="friend-profile-card card">
            ${friendshipStatus}
            <div class="friend-profile-avatar">
                ${friendData.avatar || (friendData.name ? friendData.name.charAt(0).toUpperCase() : 'U')}
            </div>
            <h2 class="friend-profile-name">${friendData.name || 'Пользователь'}</h2>
            ${friendData.username ? `<div class="friend-profile-username">@${friendData.username}</div>` : ''}
            
            <div class="friend-profile-stats">
                <div class="friend-stat">
                    <span class="friend-stat-value">${friendStats.totalFires}</span>
                    <span class="friend-stat-label">Огоньков получено</span>
                </div>
                <div class="friend-stat">
                    <span class="friend-stat-value">${friendStats.friendsCount}</span>
                    <span class="friend-stat-label">Друзей</span>
                </div>
            </div>
            
            <div class="friend-profile-actions">
                ${actionButtons}
                <button class="btn-secondary" onclick="showSection('friends')">
                    <i class="fas fa-arrow-left"></i> Назад к друзьям
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    showSection('friend-profile');
}

// Функция для пересчета и обновления огоньков пользователя
async function recalculateUserFires(userId) {
    if (!db) return 0;
    
    try {
        const totalFires = await calculateUserTotalFires(userId);
        
        // Обновляем в базе
        await db.ref('users/' + userId + '/stats/totalFires').set(totalFires);
        
        console.log(`Пересчитаны огоньки для ${userId}: ${totalFires}`);
        
        return totalFires;
        
    } catch (error) {
        console.error('Ошибка пересчета огоньков:', error);
        return 0;
    }
}

// Просмотр стены пользователя
function viewUserWall(userId) {
    showWallSection(userId);
    showSection('profile');
}

// ==================== СИСТЕМА СТЕНЫ ====================

function initWallSystem() {
    console.log('Инициализация системы стены...');
    
    // Защита от дублирования событий
    if (wallEventListeners.has('initialized')) {
        console.log('Система стены уже инициализирована');
        return;
    }
    
    // Кнопка перехода к стене - ОДНОРАЗОВАЯ привязка
    const wallBtn = document.getElementById('profile-wall-btn');
    if (wallBtn && !wallEventListeners.has('wall-btn')) {
        wallBtn.addEventListener('click', function() {
            showWallSection();
        });
        wallEventListeners.add('wall-btn');
    }
    
    // Кнопка назад от стены - ОДНОРАЗОВАЯ привязка
    const backBtn = document.getElementById('wall-back-btn');
    if (backBtn && !wallEventListeners.has('back-btn')) {
        backBtn.addEventListener('click', showProfileSection);
        wallEventListeners.add('back-btn');
    }
    
    // Форма добавления поста - ОДНОРАЗОВАЯ привязка
    const postForm = document.getElementById('wall-post-form');
    if (postForm && !wallEventListeners.has('post-form')) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addWallPost();
        });
        wallEventListeners.add('post-form');
    }
    
    // Счетчик символов - ОДНОРАЗОВАЯ привязка
    const postContent = document.getElementById('wall-post-content');
    if (postContent && !wallEventListeners.has('char-counter')) {
        postContent.addEventListener('input', function() {
            const charCount = this.value.length;
            const counter = document.getElementById('char-count');
            if (counter) counter.textContent = charCount;
        });
        wallEventListeners.add('char-counter');
    }
    
    wallEventListeners.add('initialized');
    console.log('Система стены инициализирована');
}

// Показать раздел стены
function showWallSection(userId = null) {
    console.log('Показ стены для пользователя:', userId || currentUser?.uid);
    
    // Скрываем другие секции профиля
    document.querySelector('.profile-card')?.classList.add('hidden');
    document.getElementById('edit-profile-section')?.classList.add('hidden');
    
    // Показываем секцию стены
    const wallSection = document.getElementById('wall-section');
    if (wallSection) {
        wallSection.classList.remove('hidden');
    }
    
    // Устанавливаем, чью стену показываем
    currentWallUserId = userId || currentUser?.uid;
    
    if (currentWallUserId) {
        loadWallPosts(currentWallUserId);
    } else {
        console.error('Нет ID пользователя для загрузки стены');
        showNotification('Ошибка загрузки стены', 'error');
    }
}

// Загрузка постов стены
function loadWallPosts(userId) {
    if (!db || !userId) {
        console.error('Firebase не инициализирован или отсутствует userId');
        showWallError('Ошибка загрузки постов');
        return;
    }
    
    console.log('Загрузка постов для пользователя:', userId);
    
    const postsContainer = document.getElementById('wall-posts');
    if (!postsContainer) {
        console.error('Контейнер постов не найден');
        return;
    }
    
    // Показываем индикатор загрузки
    postsContainer.innerHTML = `
        <div class="loading-posts">
            <i class="fas fa-spinner"></i>
            <p>Загрузка постов...</p>
        </div>
    `;
    
    // Устанавливаем короткий таймаут для лучшего UX
    const loadTimeout = setTimeout(() => {
        showWallError('Долгая загрузка... Пожалуйста, подождите');
    }, 3000);
    
    // ЗАГРУЖАЕМ ПОСТЫ СРАЗУ - без кэша для свежих данных
    db.ref('wall/' + userId).orderByChild('timestamp').once('value')
        .then((snapshot) => {
            clearTimeout(loadTimeout);
            const posts = snapshot.val() || {};
            
            console.log(`Загружено ${Object.keys(posts).length} постов для пользователя ${userId}`);
            
            // Сохраняем в кэш на короткое время
            const cacheKey = `wall_${userId}`;
            wallPostsCache.set(cacheKey, {
                posts: posts,
                timestamp: Date.now()
            });
            
            displayWallPosts(posts, userId);
        })
        .catch((error) => {
            clearTimeout(loadTimeout);
            console.error('Ошибка загрузки постов:', error);
            showWallError('Ошибка загрузки постов: ' + error.message);
        });
}

// Показать ошибку загрузки стены
function showWallError(message) {
    const postsContainer = document.getElementById('wall-posts');
    if (postsContainer) {
        postsContainer.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn-primary" onclick="retryLoadWallPosts()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            </div>
        `;
    }
}

// Повторная загрузка постов
function retryLoadWallPosts() {
    if (currentWallUserId) {
        loadWallPosts(currentWallUserId);
    }
}

// Отображение постов стены
async function displayWallPosts(posts, userId) {
    const postsContainer = document.getElementById('wall-posts');
    if (!postsContainer) return;
    
    const isOwnWall = userId === currentUser?.uid;
    
    // Загружаем данные пользователя, если это чужая стена
    let wallUser = null;
    if (!isOwnWall) {
        try {
            const userSnapshot = await db.ref('users/' + userId).once('value');
            wallUser = userSnapshot.val();
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        }
    }
    
    if (Object.keys(posts).length === 0) {
        if (isOwnWall) {
            postsContainer.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-stream"></i>
                    <p>На вашей стене пока нет записей</p>
                    <p class="hint">Будьте первым, кто поделится чем-то интересным!</p>
                </div>
            `;
        } else {
            postsContainer.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-stream"></i>
                    <p>На стене пользователя пока нет записей</p>
                </div>
            `;
        }
        return;
    }
    
    let html = '';
    
    // Добавляем информационный блок для чужой стены
    if (!isOwnWall && wallUser) {
        html += `
            <div class="wall-info">
                <h4>Стена пользователя ${wallUser.name || 'Пользователь'}</h4>
                <p>Вы просматриваете публичные записи этого пользователя</p>
            </div>
        `;
    }
    
    // Сортируем посты по времени (новые сверху) и ограничиваем количество
    const sortedPosts = Object.entries(posts)
        .sort(([,a], [,b]) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 100);
    
    // Предзагружаем данные об огоньках пользователя
    const userFires = getUserFires();
    
    // Создаем HTML для постов
    let postsHTML = '';
    let postCount = 0;
    
    sortedPosts.forEach(([postId, post]) => {
        postCount++;
        const fireCount = post.fires || 0;
        const isFired = userFires.includes(`wall_${userId}_${postId}`);
        const canDelete = isOwnWall || (currentUser && currentUser.uid === post.authorId);
        
        postsHTML += createWallPostHTML(postId, post, userId, fireCount, isFired, canDelete);
    });
    
    console.log(`Отображено ${postCount} постов`);
    postsContainer.innerHTML = postsHTML;
    
    // Добавляем обработчики событий для кнопок
    attachWallPostEventListeners();
}

// Создание HTML для поста стены
function createWallPostHTML(postId, post, userId, fireCount, isFired, canDelete) {
    const authorName = escapeHtml(post.authorName || 'Пользователь');
    const content = escapeHtml(post.content || '').replace(/\n/g, '<br>');
    const date = new Date(post.timestamp).toLocaleString('ru-RU');
    const avatar = post.authorAvatar || (authorName ? authorName.charAt(0).toUpperCase() : 'U');
    
    return `
        <div class="wall-post card" data-post-id="${postId}">
            <div class="post-header">
                <div class="post-header-left">
                    <div class="post-avatar">${avatar}</div>
                    <div class="post-author">
                        <div class="post-author-name">${authorName}</div>
                        <div class="post-date">${date}</div>
                    </div>
                </div>
                ${canDelete ? `
                    <div class="post-actions-right">
                        <button class="delete-post-btn" data-post-id="${postId}" data-user-id="${userId}" title="Удалить запись">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="post-content">${content}</div>
            <div class="post-actions">
                <button class="post-fire-btn ${isFired ? 'fired' : ''}" 
                        data-post-id="${postId}" 
                        data-user-id="${userId}"
                        ${!currentUser ? 'disabled' : ''}>
                    <i class="fas fa-fire"></i>
                    <span class="fire-count">${fireCount}</span>
                </button>
            </div>
        </div>
    `;
}

// Экранирование HTML для безопасности
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Привязка обработчиков событий к постам стены
function attachWallPostEventListeners() {
    // Удаляем старые обработчики
    document.querySelectorAll('.post-fire-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Добавляем новые обработчики для огоньков
    document.querySelectorAll('.post-fire-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id');
            const userId = this.getAttribute('data-user-id');
            if (postId && userId) {
                toggleWallFire(postId, userId);
            }
        });
    });
    
    // Добавляем новые обработчики для удаления
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id');
            const userId = this.getAttribute('data-user-id');
            if (postId && userId) {
                deleteWallPost(postId, userId);
            }
        });
    });
}

// Добавление поста на стену
async function addWallPost() {
    const contentInput = document.getElementById('wall-post-content');
    const content = contentInput?.value.trim();
    
    if (!content) {
        showNotification('Введите текст поста', 'error');
        return;
    }
    
    if (!currentUser || !db) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    try {
        // Показываем уведомление о публикации
        showNotification('Публикация поста...', 'warning');
        
        const postId = db.ref().child('wall').push().key;
        const postData = {
            content: content,
            timestamp: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            authorUsername: currentUser.username,
            fires: 0
        };
        
        await db.ref('wall/' + currentUser.uid + '/' + postId).set(postData);
        
        // Очищаем форму
        const postForm = document.getElementById('wall-post-form');
        if (postForm) postForm.reset();
        
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.textContent = '0';
        
        // Очищаем кэш для этого пользователя
        wallPostsCache.delete(`wall_${currentUser.uid}`);
        
        showNotification('Пост опубликован!', 'success');
        
        // НЕМЕДЛЕННО обновляем отображение постов
        setTimeout(() => {
            loadWallPosts(currentUser.uid);
        }, 100);
        
    } catch (error) {
        console.error('Ошибка публикации поста:', error);
        showNotification('Ошибка публикации поста: ' + error.message, 'error');
    }
}

// Удаление поста со стены
async function deleteWallPost(postId, userId) {
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    // Проверяем права на удаление
    const canDelete = userId === currentUser.uid;
    
    if (!canDelete) {
        showNotification('Вы не можете удалить этот пост', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
        return;
    }
    
    try {
        await db.ref('wall/' + userId + '/' + postId).remove();
        
        // Очищаем кэш
        wallPostsCache.delete(`wall_${userId}`);
        
        showNotification('Пост удален', 'success');
        
        // НЕМЕДЛЕННО обновляем отображение постов
        setTimeout(() => {
            loadWallPosts(userId);
        }, 100);
        
    } catch (error) {
        console.error('Ошибка удаления поста:', error);
        showNotification('Ошибка удаления поста', 'error');
    }
}

// Переключение огонька для поста на стене
async function toggleWallFire(postId, userId) {
    if (!currentUser) {
        showNotification('Войдите в систему, чтобы ставить огоньки', 'error');
        return;
    }
    
    const fireKey = `wall_${userId}_${postId}`;
    const userFires = getUserFires();
    const isFired = userFires.includes(fireKey);
    const button = document.querySelector(`.post-fire-btn[data-post-id="${postId}"]`);
    
    if (!button) {
        console.error('Кнопка огонька не найдена');
        return;
    }
    
    const countElement = button.querySelector('.fire-count');
    
    try {
        let currentCount = parseInt(countElement?.textContent) || 0;
        
        if (isFired) {
            // Убираем огонек
            currentCount = Math.max(0, currentCount - 1);
            removeUserFire(fireKey);
            button.classList.remove('fired');
        } else {
            // Добавляем огонек
            currentCount++;
            addUserFire(fireKey);
            button.classList.add('fired');
        }
        
        // Обновляем счетчик в базе
        await db.ref('wall/' + userId + '/' + postId + '/fires').set(currentCount);
        
        // Обновляем отображение
        if (countElement) {
            countElement.textContent = currentCount;
        }
        
        // Очищаем кэш для обновления данных
        wallPostsCache.delete(`wall_${userId}`);
        
        // ОБНОВЛЯЕМ ОБЩЕЕ КОЛИЧЕСТВО ОГОНЬКОВ ПОЛЬЗОВАТЕЛЯ
        await recalculateUserFires(userId);
        
    } catch (error) {
        console.error('Ошибка обновления огонька:', error);
        showNotification('Ошибка обновления огонька', 'error');
    }
}

// ==================== СИСТЕМА ПРОФИЛЯ ====================

function initProfileSystem() {
    console.log('Инициализация системы профиля...');
    
    // Защита от дублирования событий
    if (profileEventListeners.has('initialized')) {
        console.log('Система профиля уже инициализирована');
        return;
    }
    
    // Обработчик для кнопки входа/профиля в навигации
    const authLink = document.getElementById('auth-link');
    if (authLink && !profileEventListeners.has('auth-link')) {
        authLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser) {
                showSection('profile');
                setActiveNavLink(this);
            } else {
                showLoginModal();
            }
        });
        profileEventListeners.add('auth-link');
    }

    // Кнопки на странице профиля
    const editBtn = document.getElementById('profile-edit-btn');
    if (editBtn && !profileEventListeners.has('edit-btn')) {
        editBtn.addEventListener('click', showEditProfileSection);
        profileEventListeners.add('edit-btn');
    }
    
    const logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn && !profileEventListeners.has('logout-btn')) {
        logoutBtn.addEventListener('click', logoutUser);
        profileEventListeners.add('logout-btn');
    }
    
    const editCancelBtn = document.getElementById('edit-profile-cancel-btn');
    if (editCancelBtn && !profileEventListeners.has('edit-cancel-btn')) {
        editCancelBtn.addEventListener('click', showProfileSection);
        profileEventListeners.add('edit-cancel-btn');
    }
    
    const cancelEditBtn = document.getElementById('profile-cancel-edit-btn');
    if (cancelEditBtn && !profileEventListeners.has('cancel-edit-btn')) {
        cancelEditBtn.addEventListener('click', showProfileSection);
        profileEventListeners.add('cancel-edit-btn');
    }
    
    // Форма редактирования профиля
    const editForm = document.getElementById('profile-edit-form');
    if (editForm && !profileEventListeners.has('edit-form')) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
        profileEventListeners.add('edit-form');
    }
    
    // Проверка username в реальном времени
    const usernameInput = document.getElementById('profile-edit-username');
    if (usernameInput && !profileEventListeners.has('username-input')) {
        usernameInput.addEventListener('input', function() {
            clearTimeout(usernameTimeout);
            usernameTimeout = setTimeout(() => {
                checkUsernameAvailability(this.value, 'profile-username-availability');
            }, 500);
        });
        profileEventListeners.add('username-input');
    }
    
    profileEventListeners.add('initialized');
    console.log('Система профиля инициализирована');
}

function showProfileSection() {
    console.log('Показ раздела профиля');
    
    document.getElementById('edit-profile-section')?.classList.add('hidden');
    document.getElementById('wall-section')?.classList.add('hidden');
    document.querySelector('.profile-card')?.classList.remove('hidden');
    updateProfilePageDisplay();
}

function showEditProfileSection() {
    console.log('Показ формы редактирования профиля');
    
    document.querySelector('.profile-card')?.classList.add('hidden');
    document.getElementById('wall-section')?.classList.add('hidden');
    document.getElementById('edit-profile-section')?.classList.remove('hidden');
    populateProfileEditForm();
}

// Обновление отображения страницы профиля
function updateProfilePageDisplay() {
    if (!currentUser) {
        // Если пользователь не авторизован, показываем форму входа
        showLoginModal();
        showSection('home');
        return;
    }
    
    // Основная информация
    document.getElementById('profile-page-name').textContent = currentUser.name || 'Пользователь';
    const usernameElement = document.getElementById('profile-page-username');
    usernameElement.textContent = currentUser.username ? `@${currentUser.username}` : 'Без username';
    usernameElement.className = currentUser.username ? 'profile-username' : 'profile-username empty';
    
    document.getElementById('profile-page-reg-date').textContent = 
        currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ru-RU') : '-';
    
    // Статистика
    const stats = currentUser.stats || {};
    document.getElementById('profile-page-fires').textContent = stats.totalFires || 0;
    document.getElementById('profile-page-friends-count').textContent = Object.keys(friendsData).length;
    
    // Аватар
    updateAvatarDisplay();
    
    // Обновляем кнопку в навигации
    const authLink = document.getElementById('auth-link');
    authLink.innerHTML = '<i class="fas fa-user"></i><span>Профиль</span>';
}

// Обновление отображения аватара
function updateAvatarDisplay() {
    const avatarElement = document.getElementById('profile-page-avatar');
    const avatarText = document.getElementById('profile-avatar-text');
    
    if (!avatarElement) return;
    
    if (currentUser.avatar) {
        // Emoji аватар
        avatarElement.style.backgroundImage = 'none';
        avatarElement.className = 'profile-avatar-large emoji';
        if (avatarText) {
            avatarText.style.display = 'flex';
            avatarText.textContent = currentUser.avatar;
            avatarText.style.fontSize = '3.5rem';
        }
    } else {
        // Аватар по умолчанию - первая буква имени
        avatarElement.style.backgroundImage = 'none';
        avatarElement.className = 'profile-avatar-large';
        if (avatarText) {
            avatarText.style.display = 'flex';
            avatarText.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
            avatarText.style.fontSize = '3rem';
        }
    }
}

// Заполнение формы редактирования
function populateProfileEditForm() {
    if (!currentUser) return;
    
    document.getElementById('profile-edit-name').value = currentUser.name || '';
    document.getElementById('profile-edit-username').value = currentUser.username || '';
    
    // Сбрасываем статус проверки username
    const availabilityElement = document.getElementById('profile-username-availability');
    availabilityElement.textContent = 'Оставьте пустым, если не хотите устанавливать username';
    availabilityElement.className = 'username-availability info';
}

// Проверка доступности username в реальном времени
async function checkUsernameAvailability(username, elementId) {
    const availabilityElement = document.getElementById(elementId);
    
    if (!username) {
        availabilityElement.textContent = 'Оставьте пустым, если не хотите устанавливать username';
        availabilityElement.className = 'username-availability info';
        return;
    }
    
    // Валидация username (только если он не пустой)
    if (!isValidUsername(username)) {
        availabilityElement.textContent = 'Только латинские буквы, цифры и _ (3-20 символов)';
        availabilityElement.className = 'username-availability username-taken';
        return;
    }
    
    availabilityElement.textContent = 'Проверка...';
    availabilityElement.className = 'username-availability username-checking';
    
    try {
        const isTaken = await isUsernameTaken(username);
        
        if (isTaken && username !== (currentUser.username || '')) {
            availabilityElement.textContent = 'Username уже занят';
            availabilityElement.className = 'username-availability username-taken';
        } else {
            availabilityElement.textContent = 'Username доступен';
            availabilityElement.className = 'username-availability username-available';
        }
    } catch (error) {
        console.error('Ошибка проверки username:', error);
        availabilityElement.textContent = 'Ошибка проверки';
        availabilityElement.className = 'username-availability username-taken';
    }
}

// Сохранение изменений профиля
async function saveProfileChanges() {
    const name = document.getElementById('profile-edit-name').value.trim();
    const username = document.getElementById('profile-edit-username').value.trim();
    
    console.log('Сохранение профиля:', { name, username, currentUser });
    
    if (!name) {
        showNotification('Имя не может быть пустым', 'error');
        return;
    }
    
    // Username теперь опциональный
    if (username && !isValidUsername(username)) {
        showNotification('Username может содержать только латинские буквы, цифры и нижнее подчеркивание (3-20 символов)', 'error');
        return;
    }
    
    try {
        showNotification('Сохранение...', 'warning');
        
        // ПРОСТОЙ ПОДХОД: обновляем только данные пользователя
        await db.ref('users/' + currentUser.uid).update({
            name: name,
            username: username || null
        });
        
        // Обновляем локальные данные
        currentUser.name = name;
        currentUser.username = username || null;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Профиль успешно обновлен', 'success');
        
        // Возвращаемся к просмотру профиля
        showProfileSection();
        
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        showNotification('Ошибка обновления профиля: ' + error.message, 'error');
    }
}

// ==================== СИСТЕМА EMOJI АВАТАРОВ ====================

function initAvatarSystem() {
    // Кнопка смены аватара
    document.getElementById('profile-change-avatar-btn').addEventListener('click', showAvatarPicker);
    
    // Закрытие модального окна аватара
    document.querySelector('#avatar-picker-modal .close-modal').addEventListener('click', function() {
        closeAvatarPicker();
    });
    
    // Клик вне модального окна
    document.getElementById('avatar-picker-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAvatarPicker();
        }
    });
    
    // Загрузка аватаров в сетку
    loadAvatarGrid();
}

// Показ модального окна выбора аватара
function showAvatarPicker() {
    const modal = document.getElementById('avatar-picker-modal');
    modal.classList.remove('hidden');
    
    // Показываем текущий выбранный аватар
    highlightCurrentAvatar();
}

// Закрытие модального окна
function closeAvatarPicker() {
    document.getElementById('avatar-picker-modal').classList.add('hidden');
}

// Загрузка сетки аватаров
function loadAvatarGrid() {
    const avatarGrid = document.getElementById('avatar-grid');
    avatarGrid.innerHTML = '';
    
    defaultAvatars.forEach((avatar, index) => {
        const avatarOption = document.createElement('div');
        avatarOption.className = 'avatar-option';
        avatarOption.setAttribute('data-avatar', avatar);
        avatarOption.setAttribute('data-index', index);
        
        avatarOption.innerHTML = `
            <div class="avatar-preview">${avatar}</div>
        `;
        
        avatarOption.addEventListener('click', function() {
            selectAvatar(avatar);
        });
        
        avatarGrid.appendChild(avatarOption);
    });
}

// Выбор аватара
function selectAvatar(avatar) {
    updateUserAvatar(avatar);
    closeAvatarPicker();
    showNotification('Аватар успешно обновлен! 🎉', 'success');
}

// Подсветка текущего аватара в сетке
function highlightCurrentAvatar() {
    // Сбрасываем все выделения
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    if (currentUser && currentUser.avatar) {
        // Находим и подсвечиваем текущий аватар
        const currentAvatarOption = document.querySelector(`.avatar-option[data-avatar="${currentUser.avatar}"]`);
        if (currentAvatarOption) {
            currentAvatarOption.classList.add('selected');
            
            // Прокручиваем к выбранному аватару
            currentAvatarOption.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

// Обновление аватара пользователя
function updateUserAvatar(avatar) {
    if (!currentUser) return;
    
    console.log('Обновление аватара на:', avatar);
    
    // Обновляем локальные данные
    currentUser.avatar = avatar;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Сохраняем в Firebase
    saveAvatarToFirebase(avatar)
        .then(() => {
            console.log('Аватар сохранен в Firebase');
        })
        .catch(error => {
            console.error('Ошибка сохранения аватара в Firebase:', error);
        });
    
    // Обновляем отображение
    updateProfilePageDisplay();
}

// Сохранение аватара в Firebase
async function saveAvatarToFirebase(avatar) {
    if (!currentUser || !db) return;
    
    try {
        await db.ref('users/' + currentUser.uid + '/avatar').set(avatar);
        console.log('Emoji аватар сохранен в Firebase:', avatar);
    } catch (error) {
        console.error('Ошибка сохранения аватара в Firebase:', error);
        throw error;
    }
}

// ==================== СИСТЕМА АУТЕНТИФИКАЦИИ ====================

function initAuthModals() {
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Клик вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Переключение между логином и регистрацией
    document.getElementById('switch-to-register').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('register-modal').classList.remove('hidden');
    });
    
    document.getElementById('switch-to-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('register-modal').classList.add('hidden');
        document.getElementById('auth-modal').classList.remove('hidden');
    });
    
    // Форма входа
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginUser(email, password);
    });
    
    // Форма регистрации
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        registerUser(name, email, password);
    });
}

function showLoginModal() {
    closeAllModals();
    document.getElementById('auth-modal').classList.remove('hidden');
}

function showRegisterModal() {
    closeAllModals();
    document.getElementById('register-modal').classList.remove('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// Регистрация пользователя
async function registerUser(name, email, password) {
    try {
        showNotification('Регистрация...', 'warning');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Выбираем случайный emoji аватар
        const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
        
        // Сохраняем данные пользователя в базу
        await db.ref('users/' + user.uid).set({
            name: name,
            username: null,
            email: email,
            avatar: randomAvatar,
            createdAt: new Date().toISOString(),
            stats: {
                totalFires: 0
            }
        });
        
        showNotification(`Регистрация успешна! Ваш аватар: ${randomAvatar}`, 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

// Проверка занятости username
async function isUsernameTaken(username) {
    try {
        if (!username) return false;
        
        const snapshot = await db.ref('usernames/' + username).once('value');
        const exists = snapshot.exists();
        console.log(`Username "${username}" ${exists ? 'занят' : 'свободен'}`);
        return exists;
    } catch (error) {
        console.error('Ошибка проверки username:', error);
        throw error;
    }
}

// Валидация username
function isValidUsername(username) {
    if (!username || username.length < 3 || username.length > 20) {
        return false;
    }
    
    // Разрешаем только латинские буквы, цифры и нижнее подчеркивание
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
}

// Вход пользователя
async function loginUser(email, password) {
    try {
        showNotification('Вход...', 'warning');
        
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Вход успешен!', 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

// Выход пользователя
async function logoutUser() {
    try {
        await auth.signOut();
        showNotification('Вы вышли из системы', 'success');
        // Возвращаем на главную страницу
        showSection('home');
        setActiveNavLink(document.querySelector('.nav-link[href="#home"]'));
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showNotification('Ошибка при выходе', 'error');
    }
}

// Обработка ошибок аутентификации
function getAuthErrorMessage(error) {
    const errorCode = error.code;
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'Этот email уже используется';
        case 'auth/invalid-email':
            return 'Неверный формат email';
        case 'auth/weak-password':
            return 'Пароль слишком слабый';
        case 'auth/user-not-found':
            return 'Пользователь не найден';
        case 'auth/wrong-password':
            return 'Неверный пароль';
        default:
            return 'Произошла ошибка. Попробуйте еще раз';
    }
}

// ==================== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ====================

async function initSystems() {
    try {
        console.log('Загрузка данных из Firebase...');
        
        if (!db) {
            throw new Error('Firebase не инициализирован');
        }
        
        // Инициализация аутентификации
        initAuth();
        
        // Собираем все статьи в карту
        collectAllArticles();
        
        // Загружаем данные из Firebase
        await loadDataFromFirebase();
        
        // Инициализируем счетчики во всех статьях
        initAllViewsCounters();
        initAllFireButtons();
        
        // Запускаем отслеживание просмотров
        startViewTracking();
        
        // Слушаем реальные обновления из Firebase
        startRealtimeUpdates();

        initMarketplace();
        
        console.log('Все системы инициализированы');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Используем локальное хранилище
        initWithLocalStorage();
    }
}

// Инициализация аутентификации
function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Пользователь вошел в систему
            const userData = await getUserData(user.uid);
            currentUser = {
                uid: user.uid,
                email: user.email,
                ...userData
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateProfilePageDisplay();
            
            // Загружаем систему друзей после входа
            loadFriendsData();

            loadUserBalance();
            
            console.log('Пользователь вошел:', currentUser);
        } else {
            // Пользователь вышел
            currentUser = null;
            localStorage.removeItem('currentUser');
            const authLink = document.getElementById('auth-link');
            authLink.innerHTML = '<i class="fas fa-user"></i><span>Войти</span>';
            console.log('Пользователь вышел');
            
            // Если мы на странице профиля или друзей, переходим на главную
            if (window.location.hash === '#profile' || window.location.hash === '#friends' || window.location.hash === '#friend-profile') {
                showSection('home');
                setActiveNavLink(document.querySelector('.nav-link[href="#home"]'));
            }
        }
    });
    
    // Проверяем локальное хранилище
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateProfilePageDisplay();
        loadFriendsData();
    }
}

// Получение данных пользователя
async function getUserData(uid) {
    try {
        const snapshot = await db.ref('users/' + uid).once('value');
        const userData = snapshot.val() || {};
        
        // Для emoji аватаров просто возвращаем строку
        if (userData.avatar && typeof userData.avatar === 'string') {
            userData.avatar = userData.avatar;
        } else {
            userData.avatar = null;
        }
        
        return userData;
    } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        return {};
    }
}

// Собираем все статьи со всех разделов
function collectAllArticles() {
    console.log('Сбор всех статей...');
    
    const allArticles = document.querySelectorAll('.article');
    articlesMap.clear();
    
    allArticles.forEach(article => {
        const articleId = article.getAttribute('data-article-id');
        if (articleId) {
            if (!articlesMap.has(articleId)) {
                articlesMap.set(articleId, []);
            }
            articlesMap.get(articleId).push(article);
        }
    });
    
    console.log(`Найдено статей: ${articlesMap.size}`, Array.from(articlesMap.keys()));
}

// Загрузка данных из Firebase
async function loadDataFromFirebase() {
    return new Promise((resolve, reject) => {
        console.log('Загрузка данных...');
        
        // Загружаем огоньки
        db.ref('fires').once('value')
            .then((snapshot) => {
                firesData = snapshot.val() || {};
                console.log('Огоньки загружены:', firesData);
                
                // Загружаем просмотры
                return db.ref('views').once('value');
            })
            .then((snapshot) => {
                viewsData = snapshot.val() || {};
                console.log('Просмотры загружены:', viewsData);
                resolve();
            })
            .catch((error) => {
                console.error('Ошибка загрузки данных:', error);
                reject(error);
            });
    });
}

// Запуск реальных обновлений из Firebase
function startRealtimeUpdates() {
    // Слушаем изменения просмотров
    db.ref('views').on('value', (snapshot) => {
        const newViewsData = snapshot.val() || {};
        viewsData = newViewsData;
        
        // Обновляем все счетчики просмотров
        updateAllViewsCounters();
        console.log('Просмотры обновлены в реальном времени');
    });
    
    // Слушаем изменения огоньков
    db.ref('fires').on('value', (snapshot) => {
        const newFiresData = snapshot.val() || {};
        firesData = newFiresData;
        
        // Обновляем все счетчики огоньков
        updateAllFiresCounters();
        console.log('Огоньки обновлены в реальном времени');
    });
}

// Реальное обновление счетчика просмотров
async function incrementViewInFirebase(articleId) {
    try {
        // Используем транзакцию для атомарного увеличения
        const ref = db.ref('views/' + articleId);
        await ref.transaction((currentViews) => {
            return (currentViews || 0) + 1;
        });
        console.log(`Просмотр для ${articleId} увеличен в Firebase`);
    } catch (error) {
        console.error('Ошибка увеличения просмотра:', error);
        throw error;
    }
}

// Реальное обновление счетчика огоньков
async function updateFiresInFirebase(articleId, newCount) {
    try {
        await db.ref('fires/' + articleId).set(newCount);
        console.log(`Огоньки для ${articleId} обновлены: ${newCount}`);
    } catch (error) {
        console.error('Ошибка обновления огоньков:', error);
        throw error;
    }
}

// Инициализация счетчиков просмотров во всех статьях
function initAllViewsCounters() {
    console.log('Инициализация счетчиков просмотров во всех статьях...');
    
    articlesMap.forEach((articles, articleId) => {
        const viewsCount = viewsData[articleId] || 0;
        updateViewsCounterForArticle(articleId, viewsCount);
    });
}

// Обновление всех счетчиков просмотров при изменении данных
function updateAllViewsCounters() {
    articlesMap.forEach((articles, articleId) => {
        const viewsCount = viewsData[articleId] || 0;
        updateViewsCounterForArticle(articleId, viewsCount);
    });
}

// Обновление счетчика просмотров для конкретной статьи во всех местах
function updateViewsCounterForArticle(articleId, count) {
    const articles = articlesMap.get(articleId);
    if (articles) {
        articles.forEach(article => {
            const viewsElement = article.querySelector('.views-count');
            if (viewsElement) {
                viewsElement.textContent = formatViews(count);
            }
        });
    }
}

function startViewTracking() {
    console.log('Запуск отслеживания просмотров...');
    
    // Отслеживаем скролл для регистрации просмотров
    let timeoutId;
    let trackedArticles = new Set();
    
    const trackVisibleArticles = () => {
        const allArticles = document.querySelectorAll('.article');
        let foundVisible = false;
        
        allArticles.forEach(article => {
            if (isElementInViewport(article)) {
                const articleId = article.getAttribute('data-article-id');
                if (articleId && !trackedArticles.has(articleId)) {
                    registerView(articleId);
                    trackedArticles.add(articleId);
                    foundVisible = true;
                }
            }
        });
        
        if (foundVisible) {
            console.log('Найдены новые статьи для отслеживания');
        }
    };
    
    window.addEventListener('scroll', function() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(trackVisibleArticles, 500);
    });
    
    // Проверяем видимые статьи сразу при загрузке
    setTimeout(trackVisibleArticles, 2000);
    
    // Также проверяем при смене разделов
    document.addEventListener('sectionChanged', trackVisibleArticles);
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Элемент считается видимым, если хотя бы 30% его высоты в области видимости
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const elementHeight = rect.height;
    const visibilityRatio = visibleHeight / elementHeight;
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight * 1.5 &&
        rect.right <= windowWidth &&
        visibilityRatio >= 0.3
    );
}

// Регистрация просмотра
async function registerView(articleId) {
    if (!articleId) {
        console.log('No article ID');
        return;
    }
    
    console.log(`Регистрируем просмотр статьи: ${articleId}`);
    
    try {
        // Увеличиваем счетчик локально
        const currentViews = viewsData[articleId] || 0;
        viewsData[articleId] = currentViews + 1;
        
        // Обновляем отображение ВО ВСЕХ МЕСТАХ
        updateViewsCounterForArticle(articleId, viewsData[articleId]);
        
        // Сохраняем в Firebase
        await incrementViewInFirebase(articleId);
        
        console.log(`Просмотр статьи ${articleId} зарегистрирован. Всего: ${viewsData[articleId]}`);
        
    } catch (error) {
        console.error('Ошибка регистрации просмотра в Firebase:', error);
        // Пробуем сохранить локально
        registerViewLocal(articleId);
    }
}

// Инициализация кнопок огоньков во всех статьях
function initAllFireButtons() {
    console.log('Инициализация системы огоньков во всех статьях...');
    
    articlesMap.forEach((articles, articleId) => {
        articles.forEach(article => {
            const button = article.querySelector('.fire-btn[data-article="' + articleId + '"]');
            if (button) {
                initFireButton(button, articleId);
            }
        });
    });
}

// Обновление всех счетчиков огоньков при изменении данных
function updateAllFiresCounters() {
    articlesMap.forEach((articles, articleId) => {
        const firesCount = firesData[articleId] || 0;
        const userFires = getUserFires();
        const isFired = userFires.includes(articleId);
        
        articles.forEach(article => {
            const button = article.querySelector('.fire-btn[data-article="' + articleId + '"]');
            const countElement = button ? button.querySelector('.fire-count') : null;
            
            if (countElement) {
                countElement.textContent = firesCount;
            }
            
            if (button) {
                if (isFired) {
                    button.classList.add('fired');
                } else {
                    button.classList.remove('fired');
                }
            }
        });
    });
}

// Инициализация отдельной кнопки огонька
function initFireButton(button, articleId) {
    const countElement = button.querySelector('.fire-count');
    
    // Устанавливаем начальное значение
    const firesCount = firesData[articleId] || 0;
    countElement.textContent = firesCount;
    
    // Проверяем, ставил ли текущий пользователь огонек этой статье
    const userFires = getUserFires();
    if (userFires.includes(articleId)) {
        button.classList.add('fired');
    }
    
    // Добавляем обработчик клика
    button.addEventListener('click', async () => {
        await handleFireClick(articleId, button, countElement);
    });
}

// Обработка клика по огоньку
async function handleFireClick(articleId, button, countElement) {
    const userFires = getUserFires();
    let currentCount = parseInt(countElement.textContent) || 0;
    let isFired = button.classList.contains('fired');
    
    console.log(`Огонек для статьи ${articleId}: ${isFired ? 'удаляем' : 'добавляем'}`);
    
    if (isFired) {
        // Убираем огонек
        currentCount = Math.max(0, currentCount - 1);
        removeUserFire(articleId);
    } else {
        // Добавляем огонек
        currentCount++;
        addUserFire(articleId);
    }
    
    // Обновляем данные
    firesData[articleId] = currentCount;
    
    // Обновляем ВСЕ кнопки огонька для этой статьи
    updateFireButtonsForArticle(articleId, currentCount);
    
    // Сохраняем в Firebase
    try {
        await updateFiresInFirebase(articleId, currentCount);
        console.log(`Огонек сохранен для статьи ${articleId}: ${currentCount}`);
    } catch (error) {
        console.error('Ошибка сохранения огонька в Firebase:', error);
        saveToLocalStorage();
    }
}

// Обновление всех кнопок огонька для конкретной статьи
function updateFireButtonsForArticle(articleId, count) {
    const articles = articlesMap.get(articleId);
    const userFires = getUserFires();
    const isFired = userFires.includes(articleId);
    
    if (articles) {
        articles.forEach(article => {
            const button = article.querySelector('.fire-btn[data-article="' + articleId + '"]');
            const countElement = button ? button.querySelector('.fire-count') : null;
            
            if (countElement) {
                countElement.textContent = count;
            }
            
            if (button) {
                if (isFired) {
                    button.classList.add('fired');
                } else {
                    button.classList.remove('fired');
                }
            }
        });
    }
}

// ==================== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ====================

function initWithLocalStorage() {
    console.log('Используем локальное хранилище...');
    
    viewsData = JSON.parse(localStorage.getItem('viewsData') || '{}');
    firesData = JSON.parse(localStorage.getItem('firesData') || '{}');
    
    collectAllArticles();
    initAllViewsCounters();
    initAllFireButtons();
    startViewTracking();
}

function registerViewLocal(articleId) {
    if (!articleId) return;
    
    viewsData[articleId] = (viewsData[articleId] || 0) + 1;
    updateViewsCounterForArticle(articleId, viewsData[articleId]);
    
    saveToLocalStorage();
}

function saveToLocalStorage() {
    localStorage.setItem('viewsData', JSON.stringify(viewsData));
    localStorage.setItem('firesData', JSON.stringify(firesData));
    console.log('Данные сохранены в localStorage');
}

// Работа с просмотренными статьями
function getViewedArticles() {
    return JSON.parse(localStorage.getItem('viewedArticles') || '[]');
}

function addToViewedArticles(articleId) {
    const viewedArticles = getViewedArticles();
    if (!viewedArticles.includes(articleId)) {
        viewedArticles.push(articleId);
        localStorage.setItem('viewedArticles', JSON.stringify(viewedArticles));
    }
}

// Работа с огоньками пользователя
function getUserFires() {
    return JSON.parse(localStorage.getItem('userFires') || '[]');
}

function addUserFire(articleId) {
    const userFires = getUserFires();
    if (!userFires.includes(articleId)) {
        userFires.push(articleId);
        localStorage.setItem('userFires', JSON.stringify(userFires));
    }
}

function removeUserFire(articleId) {
    let userFires = getUserFires();
    userFires = userFires.filter(id => id !== articleId);
    localStorage.setItem('userFires', JSON.stringify(userFires));
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Форматирование числа просмотров
function formatViews(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

// Update current date
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('ru-RU', options);
    }
}

// Show section function
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        
        // Создаем событие смены раздела
        const event = new CustomEvent('sectionChanged', {
            detail: { sectionId: sectionId }
        });
        document.dispatchEvent(event);
    }
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Set active navigation link
function setActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    activeLink.classList.add('active');
}

// Initialize videos
function initVideos() {
    document.querySelectorAll('video').forEach(video => {
        video.addEventListener('play', function() {
            // Pause other videos when one is playing
            document.querySelectorAll('video').forEach(v => {
                if (v !== video && !v.paused) v.pause();
            });
        });
    });
}

// Create image modal
function createImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 40px;
        cursor: pointer;
        z-index: 1001;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    `;
    
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
        img.style.transform = 'scale(1)';
    }, 10);
    
    // Close modal on click
    const closeModal = () => {
        modal.style.opacity = '0';
        img.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            if (modal.parentElement) {
                document.body.removeChild(modal);
            }
            document.body.style.overflow = '';
        }, 300);
    };
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target === closeBtn) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// Check mobile menu
function checkMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navList = document.querySelector('nav ul');
    
    if (window.innerWidth <= 768) {
        mobileMenuButton.style.display = 'flex';
        navList.classList.remove('show');
    } else {
        mobileMenuButton.style.display = 'none';
        navList.classList.remove('show');
    }
}

// Уведомления
let notificationTimeout;
function showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    // Очищаем предыдущий таймаут
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    notificationTimeout = setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}


// ==================== СИСТЕМА МАРКЕТПЛЕЙСА 3.0 ====================

function initMarketplace() {
    console.log('Инициализация маркетплейса...');
    
    // Загрузка товаров
    if (db) {
        db.ref('marketplace/items').on('value', (snapshot) => {
            marketplaceItems = snapshot.val() || {};
            updateMarketplaceDisplay();
            updateMarketplaceStats();
            updateHotItemsPreview();
        });
        
        // Загрузка баланса пользователя
        if (currentUser) {
            loadUserBalance();
        }
    }
    
    // Инициализация обработчиков событий
    initMarketplaceEventHandlers();
    initMarketplaceForm();
}

function initMarketplaceEventHandlers() {
    // Кнопка добавления товара
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', showAddItemModal);
    }
    
    // Форма добавления товара
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }
    
    // Кнопка отмены добавления
    const cancelAddItem = document.getElementById('cancel-add-item');
    if (cancelAddItem) {
        cancelAddItem.addEventListener('click', closeAddItemModal);
    }
    
    // Поиск товаров
    const searchBtn = document.getElementById('marketplace-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchItems);
    }
    
    const searchInput = document.getElementById('marketplace-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchItems();
        });
    }
    
    // Фильтры
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateMarketplaceDisplay);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', updateMarketplaceDisplay);
    }
    
    // Счетчик символов в описании
    const itemDescription = document.getElementById('item-description');
    if (itemDescription) {
        itemDescription.addEventListener('input', function() {
            const counter = document.getElementById('item-desc-count');
            if (counter) counter.textContent = this.value.length;
        });
    }

    const closeModalButtons = document.querySelectorAll('#add-item-modal .close-modal, #buy-item-modal .close-modal');
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });
    
    // Закрытие по клику вне модального окна
    const modals = document.querySelectorAll('#add-item-modal, #buy-item-modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });
}

function showAddItemModal() {
    if (!currentUser) {
        showNotification('Войдите в систему для добавления товаров', 'error');
        showLoginModal();
        return;
    }
    
    document.getElementById('add-item-modal').classList.remove('hidden');
}

function closeAddItemModal() {
    document.getElementById('add-item-modal').classList.add('hidden');
    document.getElementById('add-item-form').reset();
    
    const counter = document.getElementById('item-desc-count');
    if (counter) counter.textContent = '0';
    
    // Сброс шагов формы
    currentStep = 1;
    updateFormSteps();
}

async function handleAddItem(e) {
    e.preventDefault();
    
    if (!currentUser || !db) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    // ДОБАВЬТЕ ЭТУ ПРОВЕРКУ:
    if (!currentUser.uid) {
        showNotification('Ошибка: ID пользователя не найден', 'error');
        return;
    }
    
    const title = document.getElementById('item-title').value.trim();
    const description = document.getElementById('item-description').value.trim();
    const price = parseInt(document.getElementById('item-price').value);
    const category = document.getElementById('item-category').value;
    const condition = document.getElementById('item-condition').value;
    
    if (!title || !description || !price) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    if (price < 1 || price > 100000) {
        showNotification('Цена должна быть от 1 до 100000 монет', 'error');
        return;
    }
    
    try {
        showNotification('Добавление товара...', 'warning');
        
        const itemId = db.ref().child('marketplace/items').push().key;
        const itemData = {
            id: itemId,
            title: title,
            description: description,
            price: price,
            category: category,
            condition: condition,
            sellerId: currentUser.uid,
            sellerName: currentUser.name,
            sellerAvatar: currentUser.avatar,
            status: 'active',
            createdAt: new Date().toISOString(),
            views: 0,
            likes: 0
        };
        
        await db.ref('marketplace/items/' + itemId).set(itemData);
        
        showNotification('Товар успешно размещен!', 'success');
        closeAddItemModal();
        
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        
        // ДОБАВЬТЕ ЭТУ ОБРАБОТКУ ОШИБКИ:
        if (error.code === 'PERMISSION_DENIED') {
            showNotification('Ошибка доступа. Проверьте правила безопасности Firebase', 'error');
        } else {
            showNotification('Ошибка добавления товара: ' + error.message, 'error');
        }
    }
}

function updateMarketplaceDisplay() {
    const container = document.getElementById('marketplace-items');
    if (!container) return;
    
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const sortFilter = document.getElementById('sort-filter')?.value || 'newest';
    const searchTerm = document.getElementById('marketplace-search')?.value.toLowerCase() || '';
    
    let items = Object.values(marketplaceItems);
    
    // Фильтрация по категории
    if (categoryFilter !== 'all') {
        items = items.filter(item => item.category === categoryFilter);
    }
    
    // Поиск
    if (searchTerm) {
        items = items.filter(item => 
            item.title.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Сортировка
    items.sort((a, b) => {
        switch (sortFilter) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'popular':
                return (b.likes || 0) - (a.likes || 0);
            case 'newest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    // Отображение
    if (items.length === 0) {
        container.innerHTML = `
            <div class="no-items" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Товары не найдены</p>
                ${searchTerm ? '<p class="hint">Попробуйте изменить параметры поиска</p>' : ''}
            </div>
        `;
        return;
    }
    
    let html = '';
    items.forEach(item => {
        if (item.status !== 'active') return;
        
        const isOwnItem = currentUser && item.sellerId === currentUser.uid;
        const canBuy = currentUser && !isOwnItem && userBalance >= item.price;
        
        html += `
            <div class="marketplace-item card" data-item-id="${item.id}">
                <div class="item-image">
                    <i class="fas fa-${getItemIcon(item.category)}"></i>
                    <div class="item-badge">${getCategoryName(item.category)}</div>
                </div>
                <div class="item-content">
                    <div class="item-header">
                        <div class="item-title">${escapeHtml(item.title)}</div>
                        <div class="item-price">${item.price} <i class="fas fa-coins"></i></div>
                    </div>
                    <div class="item-description">${escapeHtml(item.description)}</div>
                    <div class="item-meta">
                        <div class="item-seller">
                            <div class="seller-avatar">${item.sellerAvatar || (item.sellerName ? item.sellerName.charAt(0).toUpperCase() : 'U')}</div>
                            <span>${escapeHtml(item.sellerName)}</span>
                        </div>
                        <div class="item-date">${new Date(item.createdAt).toLocaleDateString('ru-RU')}</div>
                    </div>
                    <div class="item-actions">
                        ${isOwnItem ? `
                            <button class="btn-secondary" onclick="editItem('${item.id}')" style="flex: 1;">
                                <i class="fas fa-edit"></i> Редактировать
                            </button>
                            <button class="btn-danger" onclick="deleteItem('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <button class="btn-buy" onclick="buyItem('${item.id}')" ${!canBuy ? 'disabled' : ''}>
                                ${canBuy ? '<i class="fas fa-shopping-cart"></i> Купить' : 'Недостаточно средств'}
                            </button>
                            <button class="btn-secondary" onclick="likeItem('${item.id}')">
                                <i class="fas fa-heart"></i> ${item.likes || 0}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getItemIcon(category) {
    const icons = {
        'digital': 'laptop',
        'physical': 'box',
        'services': 'hands-helping'
    };
    return icons[category] || 'tag';
}

function getCategoryName(category) {
    const names = {
        'digital': 'Цифровой',
        'physical': 'Физический',
        'services': 'Услуга'
    };
    return names[category] || 'Товар';
}

function updateMarketplaceStats() {
    const items = Object.values(marketplaceItems);
    const activeItems = items.filter(item => item.status === 'active').length;
    const soldItems = items.filter(item => item.status === 'sold').length;
    const totalSales = items
        .filter(item => item.status === 'sold')
        .reduce((sum, item) => sum + (item.price || 0), 0);
    
    document.getElementById('total-items').textContent = items.length;
    document.getElementById('active-items').textContent = activeItems;
    document.getElementById('sold-items').textContent = soldItems;
    document.getElementById('total-sales').textContent = totalSales;
}

function updateHotItemsPreview() {
    const container = document.getElementById('hot-items-preview');
    if (!container) return;
    
    const items = Object.values(marketplaceItems)
        .filter(item => item.status === 'active')
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 3);
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Пока нет товаров</p>';
        return;
    }
    
    let html = '';
    items.forEach(item => {
        html += `
            <div class="hot-item" onclick="showSection('marketplace')">
                <div class="hot-item-image">
                    <i class="fas fa-${getItemIcon(item.category)}"></i>
                </div>
                <div class="hot-item-title">${escapeHtml(item.title)}</div>
                <div class="hot-item-price">${item.price} <i class="fas fa-coins"></i></div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function searchItems() {
    updateMarketplaceDisplay();
}

async function buyItem(itemId) {
    if (!currentUser) {
        showNotification('Войдите в систему для покупки товаров', 'error');
        showLoginModal();
        return;
    }
    
    const item = marketplaceItems[itemId];
    if (!item) {
        showNotification('Товар не найден', 'error');
        return;
    }
    
    if (item.sellerId === currentUser.uid) {
        showNotification('Вы не можете купить свой собственный товар', 'error');
        return;
    }
    
    if (userBalance < item.price) {
        showNotification('Недостаточно средств для покупки', 'error');
        return;
    }
    
    // Показываем модальное окно подтверждения
    showBuyConfirmationModal(item);
}

function showBuyConfirmationModal(item) {
    const modal = document.getElementById('buy-item-modal');
    const infoContainer = document.getElementById('buy-item-info');
    
    infoContainer.innerHTML = `
        <div class="buy-item-details">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description)}</p>
            <div class="buy-item-price" style="font-size: 1.5rem; color: var(--fire); margin: 1rem 0;">
                ${item.price} <i class="fas fa-coins"></i>
            </div>
            <div class="buy-item-seller">
                <strong>Продавец:</strong> ${escapeHtml(item.sellerName)}
            </div>
            <div class="buy-item-balance" style="margin: 1rem 0; padding: 1rem; background: var(--dark-surface); border-radius: var(--border-radius);">
                <strong>Ваш баланс:</strong> ${userBalance} <i class="fas fa-coins"></i>
                <br>
                <strong>После покупки:</strong> ${userBalance - item.price} <i class="fas fa-coins"></i>
            </div>
        </div>
    `;
    
    const confirmBtn = document.getElementById('confirm-buy-item');
    const cancelBtn = document.getElementById('cancel-buy-item');
    
    // Удаляем старые обработчики
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Добавляем новые обработчики
    newConfirmBtn.addEventListener('click', () => confirmPurchase(item.id));
    newCancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    
    modal.classList.remove('hidden');
}

async function confirmPurchase(itemId) {
    const item = marketplaceItems[itemId];
    
    try {
        // Обновляем статус товара
        await db.ref('marketplace/items/' + itemId).update({
            status: 'sold',
            soldAt: new Date().toISOString(),
            buyerId: currentUser.uid,
            buyerName: currentUser.name
        });
        
        // Создаем запись о транзакции
        const transactionId = db.ref().child('marketplace/transactions').push().key;
        await db.ref('marketplace/transactions/' + transactionId).set({
            id: transactionId,
            itemId: itemId,
            itemTitle: item.title,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            buyerId: currentUser.uid,
            buyerName: currentUser.name,
            price: item.price,
            createdAt: new Date().toISOString()
        });
        
        // Обновляем балансы (в реальном приложении здесь была бы более сложная логика)
        userBalance -= item.price;
        updateBalanceDisplay();
        
        showNotification('Поздравляем с покупкой!', 'success');
        document.getElementById('buy-item-modal').classList.add('hidden');
        
    } catch (error) {
        console.error('Ошибка покупки товара:', error);
        showNotification('Ошибка при покупке товара', 'error');
    }
}

function likeItem(itemId) {
    if (!currentUser) {
        showNotification('Войдите в систему чтобы оценить товар', 'error');
        return;
    }
    
    const item = marketplaceItems[itemId];
    if (!item) return;
    
    const newLikes = (item.likes || 0) + 1;
    
    db.ref('marketplace/items/' + itemId + '/likes').set(newLikes)
        .then(() => {
            showNotification('Спасибо за оценку!', 'success');
        })
        .catch(error => {
            console.error('Ошибка оценки товара:', error);
        });
}

function loadUserBalance() {
    // В реальном приложении баланс загружался бы из базы данных
    // Здесь используем фиксированный начальный баланс + вычисления
    if (db && currentUser) {
        db.ref('marketplace/transactions').once('value')
            .then(snapshot => {
                const transactions = snapshot.val() || {};
                const userTransactions = Object.values(transactions).filter(t => 
                    t.buyerId === currentUser.uid
                );
                
                const spent = userTransactions.reduce((sum, t) => sum + t.price, 0);
                userBalance = Math.max(0, 1000 - spent); // Начальный баланс 1000
                updateBalanceDisplay();
            })
            .catch(error => {
                console.error('Ошибка загрузки баланса:', error);
                userBalance = 1000;
                updateBalanceDisplay();
            });
    }
}

function updateBalanceDisplay() {
    const balanceElement = document.getElementById('balance-amount');
    if (balanceElement) {
        balanceElement.textContent = userBalance;
    }
    
    // Обновляем мини-баланс в хедере
    const headerUser = document.getElementById('header-user');
    if (headerUser && currentUser) {
        headerUser.innerHTML = `
            <div class="user-balance-mini">
                <i class="fas fa-coins"></i> ${userBalance}
            </div>
            <div>${currentUser.name}</div>
        `;
    }
}


function editItem(itemId) {
    showNotification('Функция редактирования в разработке', 'warning');
}

function deleteItem(itemId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    if (db && currentUser) {
        db.ref('marketplace/items/' + itemId).remove()
            .then(() => {
                showNotification('Товар удален', 'success');
            })
            .catch(error => {
                console.error('Ошибка удаления товара:', error);
                showNotification('Ошибка удаления товара', 'error');
            });
    }
}

// Функция для обновления топа продавцов
function updateTopSellers() {
    const container = document.getElementById('top-sellers');
    if (!container) return;
    
    // Простая заглушка - в реальном приложении здесь была бы сложная логика
    container.innerHTML = `
        <div class="top-seller">
            <div class="seller-rank">1</div>
            <div class="seller-info">
                <div class="seller-name">Лидер продаж</div>
                <div class="seller-stats">10 товаров</div>
            </div>
        </div>
        <div class="top-seller">
            <div class="seller-rank">2</div>
            <div class="seller-info">
                <div class="seller-name">Активный продавец</div>
                <div class="seller-stats">7 товаров</div>
            </div>
        </div>
        <div class="top-seller">
            <div class="seller-rank">3</div>
            <div class="seller-info">
                <div class="seller-name">Новичок</div>
                <div class="seller-stats">3 товара</div>
            </div>
        </div>
    `;
}

// Обновляем топ продавцов при загрузке
function updateTopSellers() {
    const container = document.getElementById('top-sellers');
    if (!container) return;
    
    const sellers = {};
    
    // Считаем товары по продавцам
    Object.values(marketplaceItems).forEach(item => {
        if (item.status === 'active') {
            if (!sellers[item.sellerId]) {
                sellers[item.sellerId] = {
                    name: item.sellerName,
                    avatar: item.sellerAvatar,
                    count: 0
                };
            }
            sellers[item.sellerId].count++;
        }
    });
    
    // Сортируем по количеству товаров
    const topSellers = Object.entries(sellers)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 3);
    
    if (topSellers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Пока нет продавцов</p>';
        return;
    }
    
    let html = '';
    topSellers.forEach(([sellerId, seller], index) => {
        html += `
            <div class="top-seller">
                <div class="seller-rank">${index + 1}</div>
                <div class="seller-avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">
                    ${seller.avatar || (seller.name ? seller.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div class="seller-info">
                    <div class="seller-name">${escapeHtml(seller.name)}</div>
                    <div class="seller-stats">${seller.count} товаров</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Обновляем топ продавцов при изменении данных
function updateMarketplaceStats() {
    const items = Object.values(marketplaceItems);
    const activeItems = items.filter(item => item.status === 'active').length;
    const soldItems = items.filter(item => item.status === 'sold').length;
    const totalSales = items
        .filter(item => item.status === 'sold')
        .reduce((sum, item) => sum + (item.price || 0), 0);
    
    document.getElementById('total-items').textContent = items.length;
    document.getElementById('active-items').textContent = activeItems;
    document.getElementById('sold-items').textContent = soldItems;
    document.getElementById('total-sales').textContent = totalSales;
    
    // ДОБАВЬТЕ ЭТУ СТРОЧКУ:
    updateTopSellers();
}


// ==================== МНОГОШАГОВАЯ ФОРМА ДОБАВЛЕНИЯ ТОВАРА ====================

function initMarketplaceForm() {
    // Инициализация многошаговой формы
    updateFormSteps();
    setupFormEventHandlers();
}

function setupFormEventHandlers() {
    // Навигация по шагам
    document.getElementById('next-step').addEventListener('click', nextStep);
    document.getElementById('prev-step').addEventListener('click', prevStep);
    
    // Выбор категории
    document.querySelectorAll('.category-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('item-category').value = this.dataset.category;
        });
    });
    
    // Выбор состояния
    document.querySelectorAll('.condition-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.condition-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('item-condition').value = this.dataset.condition;
        });
    });
    
    // Предложенные цены
    document.querySelectorAll('.price-suggestion').forEach(btn => {
        btn.addEventListener('click', function() {
            const price = this.dataset.price;
            document.getElementById('item-price').value = price;
            document.getElementById('price-range').value = Math.min(price, 1000);
            updatePricePreview();
        });
    });
    
    // Слайдер цены
    document.getElementById('price-range').addEventListener('input', function() {
        document.getElementById('item-price').value = this.value;
        updatePricePreview();
    });
    
    // Ввод цены вручную
    document.getElementById('item-price').addEventListener('input', function() {
        const price = Math.min(Math.max(1, this.value), 100000);
        document.getElementById('price-range').value = Math.min(price, 1000);
        updatePricePreview();
    });
    
    // Обновление превью в реальном времени
    document.getElementById('item-title').addEventListener('input', updatePricePreview);
    document.getElementById('item-description').addEventListener('input', updatePricePreview);
}

function nextStep() {
    if (validateStep(currentStep)) {
        currentStep++;
        updateFormSteps();
    }
}

function prevStep() {
    currentStep--;
    updateFormSteps();
}

function validateStep(step) {
    switch (step) {
        case 1:
            const title = document.getElementById('item-title').value.trim();
            const description = document.getElementById('item-description').value.trim();
            
            if (!title) {
                showNotification('Введите название товара', 'error');
                return false;
            }
            if (!description) {
                showNotification('Введите описание товара', 'error');
                return false;
            }
            return true;
            
        case 2:
            const category = document.getElementById('item-category').value;
            if (!category) {
                showNotification('Выберите категорию товара', 'error');
                return false;
            }
            return true;
            
        case 3:
            const price = parseInt(document.getElementById('item-price').value);
            if (!price || price < 1 || price > 100000) {
                showNotification('Укажите корректную цену (1-100000 монет)', 'error');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

function updateFormSteps() {
    // Обновляем прогресс-бар
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= currentStep);
    });
    
    document.querySelector('.progress-fill').style.width = `${(currentStep / totalSteps) * 100}%`;
    
    // Показываем/скрываем шаги
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
    });
    
    // Обновляем кнопки навигации
    document.getElementById('prev-step').style.display = currentStep > 1 ? 'flex' : 'none';
    document.getElementById('next-step').style.display = currentStep < totalSteps ? 'flex' : 'none';
    document.getElementById('submit-form').style.display = currentStep === totalSteps ? 'flex' : 'none';
    
    // Обновляем превью на последнем шаге
    if (currentStep === 3) {
        updatePricePreview();
    }
}

function updatePricePreview() {
    const title = document.getElementById('item-title').value.trim() || 'Название товара';
    const description = document.getElementById('item-description').value.trim() || 'Описание товара появится здесь';
    const price = document.getElementById('item-price').value || '100';
    
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-description').textContent = description;
    document.getElementById('preview-price').textContent = price;
}

// Обновите функцию showAddItemModal
function showAddItemModal() {
    if (!currentUser) {
        showNotification('Войдите в систему для добавления товаров', 'error');
        showLoginModal();
        return;
    }
    
    // Сброс формы
    currentStep = 1;
    document.getElementById('add-item-form').reset();
    document.querySelectorAll('.category-option, .condition-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.category-option[data-category="digital"]').classList.add('selected');
    document.querySelector('.condition-option[data-condition="new"]').classList.add('selected');
    document.getElementById('item-category').value = 'digital';
    document.getElementById('item-condition').value = 'new';
    document.getElementById('item-price').value = '100';
    document.getElementById('price-range').value = '100';
    
    updateFormSteps();
    document.getElementById('add-item-modal').classList.remove('hidden');
}

console.log('Firebase script with FIXED FRIEND STATISTICS loaded successfully');
