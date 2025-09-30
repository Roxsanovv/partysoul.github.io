// Конфигурация Firebase - ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ
const firebaseConfig = {
    apiKey: "AIzaSyC5FKXH7a06_jXk5rkj_vsplGkga_CQ1aQ",
    authDomain: "partysoul-64201.firebaseapp.com",
    databaseURL: "https://partysoul-64201-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "partysoul-64201",
    storageBucket: "partysoul-64201.firebasestorage.app",
    messagingSenderId: "71365640479",
    appId: "1:71365640479:web:d5653d89f4a858a14c702a"
};

// Данные авторов
const authorsData = {
    'Немятов Артём': {
        id: 'nemyatov-artem',
        name: 'Немятов Артём',
        role: 'Главный редактор',
        bio: 'Основатель газеты «Душа компании». Увлекаюсь писательством и веб-разработкой.',
        avatar: 'img/authors/artem.jpg',
        joinDate: '2025',
        articles: ['article1'],
        photos: [],
        videos: []
    },
    'Иванова Анастасия': {
        id: 'ivanova-anastasia',
        name: 'Иванова Анастасия',
        role: 'Корреспондент',
        bio: 'Активный участник школьных мероприятий. Увлекаюсь танцами и творчеством.',
        avatar: 'img/authors/nastya.jpg',
        joinDate: '2025',
        articles: ['article2'],
        photos: ['podnos.jpg'],
        videos: []
    },
    'Дябденко Богдан': {
        id: 'dyabdenko-bogdan',
        name: 'Дябденко Богдан',
        role: 'Фоторепортёр',
        bio: 'Ответственный за выпуски и фоторепортажи. Люблю квас и публичные выступления.',
        avatar: 'img/authors/bogdan.jpg',
        joinDate: '2025',
        articles: ['article3', 'article4'],
        photos: ['art_bogdan.jpg', 'IMG_20250913_183602_536.jpg', 'pest.jpg', 'pest2.jpg', 'pest3.jpg', 'pest4.jpg', 'skate3.jpg', 'skate2.jpg', 'skate.jpg', 'photo_2025-04-07_23-40-13.jpg', 'photo_2025-04-08_21-45-35.jpg', 'photo_2025-04-09_19-34-08.jpg', 'photo_2025-04-09_19-34-14.jpg'],
        videos: ['video_2025-04-06_23-25-54']
    }
};

// Карта материалов для быстрого поиска
const materialsMap = {
    'article1': { type: 'article', title: 'Взросление', date: '21 сентября 2025', section: 'articles' },
    'article2': { type: 'news', title: 'Пребывание в лагере', date: '20 апреля 2025', section: 'news' },
    'article3': { type: 'article', title: 'Весна', date: '18 апреля 2025', section: 'articles' },
    'article4': { type: 'news', title: 'Публичное выступление', date: '6 апреля 2025', section: 'news' },
    'podnos.jpg': { type: 'photo', title: 'Расписные подносы', date: '20 апреля 2025', section: 'gallery' },
    'art_bogdan.jpg': { type: 'photo', title: 'Арт-фото Богдана', date: '2025', section: 'gallery' },
    'IMG_20250913_183602_536.jpg': { type: 'photo', title: 'Фото 9', date: '2025', section: 'gallery' },
    'pest.jpg': { type: 'photo', title: 'Фото 1', date: '2025', section: 'gallery' },
    'pest2.jpg': { type: 'photo', title: 'Фото 2', date: '2025', section: 'gallery' },
    'pest3.jpg': { type: 'photo', title: 'Фото 3', date: '2025', section: 'gallery' },
    'pest4.jpg': { type: 'photo', title: 'Фото 4', date: '2025', section: 'gallery' },
    'skate3.jpg': { type: 'photo', title: 'Скейт 1', date: '2025', section: 'gallery' },
    'skate2.jpg': { type: 'photo', title: 'Скейт 2', date: '2025', section: 'gallery' },
    'skate.jpg': { type: 'photo', title: 'Скейт 3', date: '2025', section: 'gallery' },
    'photo_2025-04-07_23-40-13.jpg': { type: 'photo', title: 'Фото с выступления', date: '7 апреля 2025', section: 'gallery' },
    'photo_2025-04-08_21-45-35.jpg': { type: 'photo', title: 'Фото 6', date: '8 апреля 2025', section: 'gallery' },
    'photo_2025-04-09_19-34-08.jpg': { type: 'photo', title: 'Фото 7', date: '9 апреля 2025', section: 'gallery' },
    'photo_2025-04-09_19-34-14.jpg': { type: 'photo', title: 'Фото 8', date: '9 апреля 2025', section: 'gallery' },
    'video_2025-04-06_23-25-54': { type: 'video', title: 'Публичное выступление', date: '6 апреля 2025', section: 'videos' }
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
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            setActiveNavLink(this);
            
            // Close mobile menu if open
            closeMobileMenu();
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

// ==================== МОБИЛЬНОЕ МЕНЮ ====================

function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (mobileMenuToggle && navMenu && overlay) {
        mobileMenuToggle.addEventListener('click', function() {
            toggleMobileMenu();
        });
        
        overlay.addEventListener('click', function() {
            closeMobileMenu();
        });
        
        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Закрытие меню при нажатии Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    mobileMenuToggle.classList.toggle('active');
    navMenu.classList.toggle('mobile-active');
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Блокировка скролла
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    mobileMenuToggle.classList.remove('active');
    navMenu.classList.remove('mobile-active');
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function checkMobileMenu() {
    // Автоматически закрываем мобильное меню при изменении размера на десктоп
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
}

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
        
        // Инициализируем систему профилей авторов
        initAuthorSystem();
        
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

// ==================== СИСТЕМА ПРОФИЛЕЙ АВТОРОВ ====================

// Инициализация системы профилей авторов
function initAuthorSystem() {
    console.log('Инициализация системы профилей авторов...');
    
    initAuthorProfiles();
    initAuthorsSection();
    initAuthorMiniatures();
}

// Инициализация кликабельных имен авторов
function initAuthorProfiles() {
    console.log('Инициализация профилей авторов...');
    
    // Добавляем кликабельные имена авторов ко всем статьям
    document.querySelectorAll('.article').forEach(article => {
        const authorElement = article.querySelector('.author');
        if (authorElement) {
            const authorName = authorElement.textContent.replace('Автор: ', '').trim();
            const authorData = authorsData[authorName];
            
            if (authorData) {
                // Заменяем обычный текст на кликабельный элемент
                const authorLink = createAuthorLink(authorData, false);
                authorElement.innerHTML = '';
                authorElement.appendChild(authorLink);
            }
        }
    });
}

// Инициализация раздела "Авторы"
function initAuthorsSection() {
    const authorsGrid = document.querySelector('.authors-grid');
    if (!authorsGrid) return;
    
    authorsGrid.innerHTML = '';
    
    Object.values(authorsData).forEach(author => {
        const stats = getAuthorStats(author);
        const authorCard = document.createElement('div');
        authorCard.className = 'author-card card';
        authorCard.setAttribute('data-author', author.id);
        
        authorCard.innerHTML = `
            <img src="${author.avatar || 'img/authors/default.jpg'}" 
                 alt="${author.name}" 
                 class="author-card-avatar"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iNDAiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTMwIDMwQzMwIDI1LjkyNDkgMzQuMDI1MSAyMSA0MCAyMUM0NS45NzQ5IDIxIDUwIDI1LjkyNDkgNTAgMzBDNTAgMzQuMDc1MSA0NS45NzQ5IDM5IDQwIDM5QzM0LjAyNTEgMzkgMzAgMzQuMDc1MSAzMCAzMFpNNTAgNDJDNTAgNDcuOTc0OSA0NS45NzQ5IDUzIDQwIDUzQzM0LjAyNTEgNTMgMzAgNDcuOTc0OSAzMCA0MkMzMCAzNi4wMjUxIDM0LjAyNTEgMzEgNDAgMzFDNDUuOTc0OSAzMSA1MCAzNi4wMjUxIDUwIDQyWiIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K'">
            <div class="author-card-name">${author.name}</div>
            <div class="author-card-role">${author.role}</div>
            <div class="author-card-stats">
                <div class="author-card-stat">
                    <span class="author-card-stat-number">${stats.articles}</span>
                    <span class="author-card-stat-label">Статьи</span>
                </div>
                <div class="author-card-stat">
                    <span class="author-card-stat-number">${stats.news}</span>
                    <span class="author-card-stat-label">Новости</span>
                </div>
                <div class="author-card-stat">
                    <span class="author-card-stat-number">${stats.photos}</span>
                    <span class="author-card-stat-label">Фото</span>
                </div>
                <div class="author-card-stat">
                    <span class="author-card-stat-number">${stats.videos}</span>
                    <span class="author-card-stat-label">Видео</span>
                </div>
            </div>
            <div class="author-card-bio">${author.bio}</div>
            <a href="#" class="author-card-link" data-author="${author.id}">
                <i class="fas fa-user-circle"></i>
                Посмотреть профиль
            </a>
        `;
        
        authorsGrid.appendChild(authorCard);
        
        // Добавляем обработчик клика
        authorCard.addEventListener('click', function(e) {
            if (!e.target.closest('.author-card-link')) {
                showAuthorProfile(author.id);
            }
        });
        
        const profileLink = authorCard.querySelector('.author-card-link');
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showAuthorProfile(author.id);
        });
    });
}

// Инициализация миниатюр авторов в сайдбаре
function initAuthorMiniatures() {
    const authorPreviews = document.querySelectorAll('.author-mini');
    authorPreviews.forEach(preview => {
        const authorName = preview.querySelector('span').textContent;
        const authorData = authorsData[authorName];
        
        if (authorData) {
            preview.addEventListener('click', function() {
                showAuthorProfile(authorData.id);
            });
        }
    });
}

// Создание кликабельной ссылки на автора
function createAuthorLink(authorData, isLarge = false) {
    const link = document.createElement('a');
    link.className = `author-profile ${isLarge ? 'large' : ''}`;
    link.href = '#';
    link.setAttribute('data-author', authorData.id);
    
    link.innerHTML = `
        <i class="fas fa-user"></i>
        <span>${authorData.name}</span>
        ${isLarge ? '<small>Профиль</small>' : ''}
    `;
    
    link.addEventListener('click', function(e) {
        e.preventDefault();
        showAuthorProfile(authorData.id);
    });
    
    return link;
}

// Показ профиля автора
function showAuthorProfile(authorId) {
    const author = Object.values(authorsData).find(a => a.id === authorId);
    if (!author) return;
    
    // Создаем модальное окно
    createAuthorModal(author);
}

// Создание модального окна автора
function createAuthorModal(author) {
    // Удаляем существующее модальное окно
    const existingModal = document.querySelector('.author-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'author-modal active';
    
    // Получаем статистику автора
    const stats = getAuthorStats(author);
    
    modal.innerHTML = `
        <div class="author-modal-content">
            <div class="author-modal-header">
                <h3>Профиль автора</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="author-modal-body">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <img src="${author.avatar || 'img/authors/default.jpg'}" 
                         alt="${author.name}" 
                         class="author-avatar"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTQ1IDQ1QzQ1IDM4LjkyNDkgNTAuMDI1MSAzNCA1NiAzNEM2MS45NzQ5IDM0IDY3IDM4LjkyNDkgNjcgNDVDNjcgNTEuMDc1MSA2MS45NzQ5IDU2IDU2IDU2QzUwLjAyNTEgNTYgNDUgNTEuMDc1MSA0NSA0NVpNNjcgNjJDNjcgNjcuOTc0OSA2MS45NzQ5IDczIDU2IDczQzUwLjAyNTEgNzMgNDUgNjcuOTc0OSA0NSA2MkM0NSA1Ni4wMjUxIDUwLjAyNTEgNTEgNTYgNTFDNjEuOTc0OSA1MSA2NyA1Ni4wMjUxIDY3IDYyWiIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K'">
                    <h4 style="margin: 0.5rem 0 0.25rem 0;">${author.name}</h4>
                    <p style="color: var(--text-muted); margin: 0;">${author.role}</p>
                </div>
                
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;">
                    ${author.bio}
                </p>
                
                <div class="author-quick-stats">
                    <div class="quick-stat">
                        <span class="number">${stats.articles}</span>
                        <span class="label">Статьи</span>
                    </div>
                    <div class="quick-stat">
                        <span class="number">${stats.news}</span>
                        <span class="label">Новости</span>
                    </div>
                    <div class="quick-stat">
                        <span class="number">${stats.photos}</span>
                        <span class="label">Фото</span>
                    </div>
                    <div class="quick-stat">
                        <span class="number">${stats.videos}</span>
                        <span class="label">Видео</span>
                    </div>
                </div>
                
                <div class="author-materials-list">
                    <h5 style="margin-bottom: 1rem;">Последние материалы</h5>
                    ${getAuthorMaterialsList(author).slice(0, 3).map(material => `
                        <div class="material-item" data-material="${material.id}" data-type="${material.type}">
                            <div class="material-item-header">
                                <span class="material-item-title">${material.title}</span>
                                <span class="material-item-type">${getMaterialTypeLabel(material.type)}</span>
                            </div>
                            <div class="material-item-date">${material.date}</div>
                        </div>
                    `).join('')}
                    
                    ${getAuthorMaterialsList(author).length > 3 ? `
                        <a href="#" class="view-all-materials" data-author="${author.id}">
                            Показать все материалы (${getAuthorMaterialsList(author).length})
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Обработчики событий
    const closeBtn = modal.querySelector('.close-modal');
    const viewAllBtn = modal.querySelector('.view-all-materials');
    const materialItems = modal.querySelectorAll('.material-item');
    
    closeBtn.addEventListener('click', closeAuthorModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAuthorModal();
        }
    });
    
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAuthorModal();
            showFullAuthorProfile(author.id);
        });
    }
    
    materialItems.forEach(item => {
        item.addEventListener('click', function() {
            const materialId = this.getAttribute('data-material');
            const materialType = this.getAttribute('data-type');
            closeAuthorModal();
            navigateToMaterial(materialId, materialType);
        });
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeAuthorModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// Закрытие модального окна автора
function closeAuthorModal() {
    const modal = document.querySelector('.author-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
            document.body.style.overflow = '';
        }, 300);
    }
}

// Получение статистики автора
function getAuthorStats(author) {
    return {
        articles: author.articles.length,
        news: author.articles.filter(id => materialsMap[id]?.type === 'news').length,
        photos: author.photos.length,
        videos: author.videos.length
    };
}

// Получение списка материалов автора
function getAuthorMaterialsList(author) {
    const materials = [];
    
    // Статьи и новости
    author.articles.forEach(articleId => {
        const material = materialsMap[articleId];
        if (material) {
            materials.push({
                id: articleId,
                type: material.type,
                title: material.title,
                date: material.date
            });
        }
    });
    
    // Фото
    author.photos.forEach(photoId => {
        const material = materialsMap[photoId];
        if (material) {
            materials.push({
                id: photoId,
                type: 'photo',
                title: material.title,
                date: material.date
            });
        }
    });
    
    // Видео
    author.videos.forEach(videoId => {
        const material = materialsMap[videoId];
        if (material) {
            materials.push({
                id: videoId,
                type: 'video',
                title: material.title,
                date: material.date
            });
        }
    });
    
    // Сортируем по дате (новые сначала)
    return materials.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Полный профиль автора
function showFullAuthorProfile(authorId) {
    const author = Object.values(authorsData).find(a => a.id === authorId);
    if (!author) return;
    
    const stats = getAuthorStats(author);
    const materials = getAuthorMaterialsList(author);
    
    // Создаем HTML для полного профиля
    const profileHTML = `
        <section id="author-profile" class="content-section">
            <div class="author-profile-page">
                <a href="#home" class="back-to-home">
                    <i class="fas fa-arrow-left"></i>
                    Назад к статьям
                </a>
                
                <div class="author-header card">
                    <img src="${author.avatar || 'img/authors/default.jpg'}" 
                         alt="${author.name}" 
                         class="author-avatar"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTQ1IDQ1QzQ1IDM4LjkyNDkgNTAuMDI1MSAzNCA1NiAzNEM2MS45NzQ5IDM0IDY3IDM4LjkyNDkgNjcgNDVDNjcgNTEuMDc1MSA2MS45NzQ5IDU2IDU2IDU2QzUwLjAyNTEgNTYgNDUgNTEuMDc1MSA0NSA0NVpNNjcgNjJDNjcgNjcuOTc0OSA2MS45NzQ5IDczIDU2IDczQzUwLjAyNTEgNzMgNDUgNjcuOTc0OSA0NSA2MkM0NSA1Ni4wMjUxIDUwLjAyNTEgNTEgNTYgNTFDNjEuOTc0OSA1MSA2NyA1Ni4wMjUxIDY3IDYyWiIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K'">
                    <h2>${author.name}</h2>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1rem;">${author.role}</p>
                    <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">${author.bio}</p>
                    
                    <div class="author-stats">
                        <div class="stat-item">
                            <span class="stat-number">${stats.articles}</span>
                            <span class="stat-label">Статьи</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.news}</span>
                            <span class="stat-label">Новости</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.photos}</span>
                            <span class="stat-label">Фотографии</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.videos}</span>
                            <span class="stat-label">Видео</span>
                        </div>
                    </div>
                </div>
                
                <div class="author-materials">
                    <h3>Материалы автора</h3>
                    <div class="materials-grid">
                        ${materials.map(material => `
                            <div class="material-card" data-material="${material.id}" data-type="${material.type}">
                                ${getMaterialPreview(material)}
                                <div class="material-content">
                                    <span class="material-type ${material.type}">${getMaterialTypeLabel(material.type)}</span>
                                    <h4>${material.title}</h4>
                                    <div class="material-date">${material.date}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>
    `;
    
    // Скрываем текущую секцию и показываем профиль
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const mainContent = document.querySelector('.main-content');
    const existingProfile = document.getElementById('author-profile');
    if (existingProfile) {
        existingProfile.remove();
    }
    
    mainContent.insertAdjacentHTML('beforeend', profileHTML);
    
    // Добавляем обработчики для карточек материалов
    document.querySelectorAll('.material-card').forEach(card => {
        card.addEventListener('click', function() {
            const materialId = this.getAttribute('data-material');
            const materialType = this.getAttribute('data-type');
            navigateToMaterial(materialId, materialType);
        });
    });
    
    // Обновляем навигацию
    setActiveNavLink(document.querySelector('.nav-link[href="#home"]'));
}

// Получение превью материала
function getMaterialPreview(material) {
    switch (material.type) {
        case 'article':
            return `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 160px; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fas fa-pen-fancy" style="font-size: 3rem;"></i>
            </div>`;
        case 'news':
            return `<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); height: 160px; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fas fa-newspaper" style="font-size: 3rem;"></i>
            </div>`;
        case 'photo':
            const photoSrc = `img/${material.id}`;
            return `<img src="${photoSrc}" alt="${material.title}" class="material-image" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\"background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); height: 160px; display: flex; align-items: center; justify-content: center; color: white;\"><i class=\"fas fa-camera\" style=\"font-size: 3rem;\"></i></div>'">`;
        case 'video':
            return `<div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); height: 160px; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fas fa-video" style="font-size: 3rem;"></i>
            </div>`;
        default:
            return '';
    }
}

// Навигация к материалу
function navigateToMaterial(materialId, materialType) {
    const material = materialsMap[materialId];
    if (!material) return;
    
    // Показываем соответствующую секцию
    showSection(material.section);
    
    // Прокручиваем к материалу
    setTimeout(() => {
        let targetElement;
        
        switch (materialType) {
            case 'article':
            case 'news':
                targetElement = document.querySelector(`[data-article-id="${materialId}"]`);
                break;
            case 'photo':
                targetElement = document.querySelector(`img[src*="${materialId}"]`);
                break;
            case 'video':
                targetElement = document.querySelector(`video source[src*="${materialId}"]`)?.closest('.video-container');
                break;
        }
        
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Подсвечиваем элемент
            targetElement.style.boxShadow = '0 0 0 3px var(--primary)';
            setTimeout(() => {
                targetElement.style.boxShadow = '';
            }, 2000);
        }
    }, 500);
}

// Получение метки типа материала
function getMaterialTypeLabel(type) {
    const labels = {
        'article': 'Статья',
        'news': 'Новость',
        'photo': 'Фото',
        'video': 'Видео'
    };
    return labels[type] || type;
}

// ==================== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ (ЗАПАСНОЙ ВАРИАНТ) ====================

function initWithLocalStorage() {
    console.log('Используем локальное хранилище...');
    
    viewsData = JSON.parse(localStorage.getItem('viewsData') || '{}');
    likesData = JSON.parse(localStorage.getItem('likesData') || '{}');
    
    collectAllArticles();
    initAllViewsCounters();
    initAllLikeButtons();
    initAuthorSystem();
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
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (window.innerWidth <= 768) {
        mobileMenuToggle.style.display = 'block';
        navMenu.classList.add('mobile-menu-hidden');
    } else {
        mobileMenuToggle.style.display = 'none';
        navMenu.classList.remove('mobile-menu-hidden');
    }
}

// Добавьте отладочную информацию в консоль
console.log('Firebase script with mobile menu loaded successfully');

// Инициализация при полной загрузке страницы
window.addEventListener('load', function() {
    console.log('Страница полностью загружена');
    
    // Проверяем, есть ли элементы для инициализации
    const articles = document.querySelectorAll('.article');
    console.log(`Найдено статей на странице: ${articles.length}`);
    
    // Проверяем Firebase соединение
    if (db) {
        console.log('Firebase подключен успешно');
    } else {
        console.warn('Firebase не подключен, используется локальное хранилище');
    }
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Обработка отклоненных промисов
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
