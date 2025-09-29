// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "ВАШ_API_KEY",
    authDomain: "ВАШ_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://ВАШ_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "ВАШ_PROJECT_ID",
    storageBucket: "ВАШ_PROJECT_ID.appspot.com",
    messagingSenderId: "ВАШ_SENDER_ID",
    appId: "ВАШ_APP_ID"
};

// Инициализация Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log('Firebase инициализирован');
} catch (error) {
    console.error('Ошибка инициализации Firebase:', error);
}

// Глобальные переменные для хранения данных
let viewsData = {};
let likesData = {};
let articlesMap = new Map(); // Хранит все элементы статей по их ID

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
    
    // Initialize
    showSection('home');
    
    // Check mobile menu on resize
    window.addEventListener('resize', checkMobileMenu);
    checkMobileMenu();
});

// ==================== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ====================

async function initSystems() {
    try {
        console.log('Загрузка данных из Firebase...');
        
        if (!db) {
            throw new Error('Firebase не инициализирован');
        }
        
        // Собираем все статьи в карту
        collectAllArticles();
        
        // Загружаем данные из Firebase
        await loadDataFromFirebase();
        
        // Инициализируем счетчики во всех статьях
        initAllViewsCounters();
        initAllLikeButtons();
        
        // Запускаем отслеживание просмотров
        startViewTracking();
        
        // Слушаем реальные обновления из Firebase
        startRealtimeUpdates();
        
        console.log('Все системы инициализированы');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Используем локальное хранилище
        initWithLocalStorage();
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

// ==================== FIREBASE FUNCTIONS ====================

// Загрузка данных из Firebase
async function loadDataFromFirebase() {
    return new Promise((resolve, reject) => {
        console.log('Загрузка данных...');
        
        // Загружаем лайки
        db.ref('likes').once('value')
            .then((snapshot) => {
                likesData = snapshot.val() || {};
                console.log('Лайки загружены:', likesData);
                
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
    
    // Слушаем изменения лайков
    db.ref('likes').on('value', (snapshot) => {
        const newLikesData = snapshot.val() || {};
        likesData = newLikesData;
        
        // Обновляем все счетчики лайков
        updateAllLikesCounters();
        console.log('Лайки обновлены в реальном времени');
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

// Реальное обновление счетчика лайков
async function updateLikesInFirebase(articleId, newCount) {
    try {
        await db.ref('likes/' + articleId).set(newCount);
        console.log(`Лайки для ${articleId} обновлены: ${newCount}`);
    } catch (error) {
        console.error('Ошибка обновления лайков:', error);
        throw error;
    }
}

// ==================== СИСТЕМА ПРОСМОТРОВ ====================

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

// ==================== СИСТЕМА ЛАЙКОВ ====================

// Инициализация кнопок лайков во всех статьях
function initAllLikeButtons() {
    console.log('Инициализация системы лайков во всех статьях...');
    
    articlesMap.forEach((articles, articleId) => {
        articles.forEach(article => {
            const button = article.querySelector('.like-btn[data-article="' + articleId + '"]');
            if (button) {
                initLikeButton(button, articleId);
            }
        });
    });
}

// Обновление всех счетчиков лайков при изменении данных
function updateAllLikesCounters() {
    articlesMap.forEach((articles, articleId) => {
        const likesCount = likesData[articleId] || 0;
        const userLikes = getUserLikes();
        const isLiked = userLikes.includes(articleId);
        
        articles.forEach(article => {
            const button = article.querySelector('.like-btn[data-article="' + articleId + '"]');
            const countElement = button ? button.querySelector('.like-count') : null;
            
            if (countElement) {
                countElement.textContent = likesCount;
            }
            
            if (button) {
                if (isLiked) {
                    button.classList.add('liked');
                } else {
                    button.classList.remove('liked');
                }
            }
        });
    });
}

// Инициализация отдельной кнопки лайка
function initLikeButton(button, articleId) {
    const countElement = button.querySelector('.like-count');
    
    // Устанавливаем начальное значение
    const likesCount = likesData[articleId] || 0;
    countElement.textContent = likesCount;
    
    // Проверяем, лайкал ли текущий пользователь эту статью
    const userLikes = getUserLikes();
    if (userLikes.includes(articleId)) {
        button.classList.add('liked');
    }
    
    // Добавляем обработчик клика
    button.addEventListener('click', async () => {
        await handleLikeClick(articleId, button, countElement);
    });
}

// Обработка клика по лайку
async function handleLikeClick(articleId, button, countElement) {
    const userLikes = getUserLikes();
    let currentCount = parseInt(countElement.textContent) || 0;
    let isLiked = button.classList.contains('liked');
    
    console.log(`Лайк для статьи ${articleId}: ${isLiked ? 'удаляем' : 'добавляем'}`);
    
    if (isLiked) {
        // Убираем лайк
        currentCount = Math.max(0, currentCount - 1);
        removeUserLike(articleId);
    } else {
        // Добавляем лайк
        currentCount++;
        addUserLike(articleId);
    }
    
    // Обновляем данные
    likesData[articleId] = currentCount;
    
    // Обновляем ВСЕ кнопки лайка для этой статьи
    updateLikeButtonsForArticle(articleId, currentCount);
    
    // Сохраняем в Firebase
    try {
        await updateLikesInFirebase(articleId, currentCount);
        console.log(`Лайк сохранен для статьи ${articleId}: ${currentCount}`);
    } catch (error) {
        console.error('Ошибка сохранения лайка в Firebase:', error);
        saveToLocalStorage();
    }
}

// Обновление всех кнопок лайка для конкретной статьи
function updateLikeButtonsForArticle(articleId, count) {
    const articles = articlesMap.get(articleId);
    const userLikes = getUserLikes();
    const isLiked = userLikes.includes(articleId);
    
    if (articles) {
        articles.forEach(article => {
            const button = article.querySelector('.like-btn[data-article="' + articleId + '"]');
            const countElement = button ? button.querySelector('.like-count') : null;
            
            if (countElement) {
                countElement.textContent = count;
            }
            
            if (button) {
                if (isLiked) {
                    button.classList.add('liked');
                } else {
                    button.classList.remove('liked');
                }
            }
        });
    }
}

// ==================== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ (ЗАПАСНОЙ ВАРИАНТ) ====================

function initWithLocalStorage() {
    console.log('Используем локальное хранилище...');
    
    viewsData = JSON.parse(localStorage.getItem('viewsData') || '{}');
    likesData = JSON.parse(localStorage.getItem('likesData') || '{}');
    
    collectAllArticles();
    initAllViewsCounters();
    initAllLikeButtons();
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
    localStorage.setItem('likesData', JSON.stringify(likesData));
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

// Работа с лайками пользователя
function getUserLikes() {
    return JSON.parse(localStorage.getItem('userLikes') || '[]');
}

function addUserLike(articleId) {
    const userLikes = getUserLikes();
    if (!userLikes.includes(articleId)) {
        userLikes.push(articleId);
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
    }
}

function removeUserLike(articleId) {
    let userLikes = getUserLikes();
    userLikes = userLikes.filter(id => id !== articleId);
    localStorage.setItem('userLikes', JSON.stringify(userLikes));
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

console.log('Firebase script with global tracking loaded successfully');
