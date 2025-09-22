document.addEventListener('DOMContentLoaded', function() {
    // Update current date
    updateCurrentDate();
    
    // Create mobile menu button
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.innerHTML = '<span></span><span></span><span></span>';
    document.querySelector('nav').prepend(mobileMenuButton);
    
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
    
    // Initialize likes system
    initLikesSystem();
    
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

// ==================== СИСТЕМА ЛАЙКОВ ====================

// Конфигурация - используем бесплатный JSONbin для хранения данных
const LIKES_CONFIG = {
    binId: '68d1908fae596e708ff78727', // Замените на свой ID после создания
    apiKey: '$2a$10$TRVnXVrm1wK4Aqfkr7DY8e0T3mJSQGnbt6w4fg3PVnS4mICoAae2m', // Ключ доступа
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

// Функция инициализации системы лайков
async function initLikesSystem() {
    try {
        // Загружаем данные о лайках
        const likesData = await loadLikesData();
        
        // Инициализируем кнопки лайков
        initLikeButtons(likesData);
        
        console.log('Система лайков загружена');
    } catch (error) {
        console.error('Ошибка загрузки системы лайков:', error);
        // Используем локальное хранилище как запасной вариант
        initLikeButtonsWithLocalStorage();
    }
}

// Загрузка данных о лайках с сервера
async function loadLikesData() {
    const response = await fetch(`${LIKES_CONFIG.baseUrl}/${LIKES_CONFIG.binId}/latest`, {
        headers: {
            'X-Master-Key': LIKES_CONFIG.apiKey,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
    }
    
    const data = await response.json();
    return data.record.likes || {};
}

// Сохранение данных о лайках на сервер
async function saveLikesData(likesData) {
    const response = await fetch(`${LIKES_CONFIG.baseUrl}/${LIKES_CONFIG.binId}`, {
        method: 'PUT',
        headers: {
            'X-Master-Key': LIKES_CONFIG.apiKey,
            'Content-Type': 'application/json',
            'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify({ likes: likesData })
    });
    
    if (!response.ok) {
        throw new Error('Ошибка сохранения данных');
    }
    
    return await response.json();
}

// Инициализация кнопок лайков
function initLikeButtons(likesData) {
    document.querySelectorAll('.like-btn').forEach(button => {
        const articleId = button.getAttribute('data-article');
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
            await handleLikeClick(articleId, button, countElement, likesData);
        });
    });
}

// Запасной вариант с локальным хранилищем
function initLikeButtonsWithLocalStorage() {
    let likesData = JSON.parse(localStorage.getItem('likesData') || '{}');
    
    document.querySelectorAll('.like-btn').forEach(button => {
        const articleId = button.getAttribute('data-article');
        const countElement = button.querySelector('.like-count');
        
        // Устанавливаем начальное значение
        const likesCount = likesData[articleId] || 0;
        countElement.textContent = likesCount;
        
        // Проверяем, лайкал ли текущий пользователь
        const userLikes = getUserLikes();
        if (userLikes.includes(articleId)) {
            button.classList.add('liked');
        }
        
        // Обработчик клика
        button.addEventListener('click', () => {
            handleLikeClickLocal(articleId, button, countElement, likesData);
        });
    });
}

// Обработка клика по лайку (серверная версия)
async function handleLikeClick(articleId, button, countElement, likesData) {
    const userLikes = getUserLikes();
    let currentCount = parseInt(countElement.textContent);
    let isLiked = button.classList.contains('liked');
    
    if (isLiked) {
        // Убираем лайк
        currentCount--;
        button.classList.remove('liked');
        removeUserLike(articleId);
        likesData[articleId] = (likesData[articleId] || 1) - 1;
    } else {
        // Добавляем лайк
        currentCount++;
        button.classList.add('liked');
        addUserLike(articleId);
        likesData[articleId] = (likesData[articleId] || 0) + 1;
    }
    
    countElement.textContent = currentCount;
    
    // Сохраняем на сервер
    try {
        await saveLikesData(likesData);
    } catch (error) {
        console.error('Ошибка сохранения лайка:', error);
        // Сохраняем в локальное хранилище как запасной вариант
        localStorage.setItem('likesData', JSON.stringify(likesData));
    }
}

// Обработка клика по лайку (локальная версия)
function handleLikeClickLocal(articleId, button, countElement, likesData) {
    const userLikes = getUserLikes();
    let currentCount = parseInt(countElement.textContent);
    let isLiked = button.classList.contains('liked');
    
    if (isLiked) {
        currentCount--;
        button.classList.remove('liked');
        removeUserLike(articleId);
    } else {
        currentCount++;
        button.classList.add('liked');
        addUserLike(articleId);
    }
    
    countElement.textContent = currentCount;
    likesData[articleId] = currentCount;
    localStorage.setItem('likesData', JSON.stringify(likesData));
}

// Работа с лайками пользователя в localStorage
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

// ==================== ОСТАЛЬНЫЕ ФУНКЦИИ ====================

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
