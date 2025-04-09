document.addEventListener('DOMContentLoaded', function() {
    // Показать главную страницу при загрузке
    showSection('home');
    
    // Обработка кликов по основной навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            setActiveNavLink(this);
            
            // Закрыть мобильное меню, если оно открыто
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });
    
    // Обработка кликов по ссылкам в сайдбаре
    document.querySelectorAll('.sidebar-link, .read-more').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            
            // Установка активной ссылки в основной навигации
            const navLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
            if (navLink) {
                setActiveNavLink(navLink);
            }
            
            // Плавная прокрутка к началу раздела
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Инициализация календаря
    initCalendar();
    
    // Добавление кнопки мобильного меню
    addMobileMenuButton();
});

function showSection(sectionId) {
    // Скрыть все разделы
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Показать выбранный раздел
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

function setActiveNavLink(activeLink) {
    // Убрать активный класс у всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('style');
    });
    
    // Добавить активный класс к выбранной ссылке
    activeLink.classList.add('active');
}

function initCalendar() {
    const days = document.querySelectorAll('.calendar .day');
    days.forEach(day => {
        day.addEventListener('click', function() {
            // Удаляем активный класс у всех дней
            days.forEach(d => d.classList.remove('active'));
            
            // Добавляем активный класс к выбранному дню
            this.classList.add('active');
            
            // Здесь можно добавить логику для отображения событий на выбранный день
        });
    });
}

function addMobileMenuButton() {
    // Создаем кнопку мобильного меню
    const nav = document.querySelector('nav');
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    menuButton.addEventListener('click', toggleMobileMenu);
    
    // Вставляем перед навигацией
    nav.parentNode.insertBefore(menuButton, nav);
}

function toggleMobileMenu() {
    const nav = document.querySelector('nav');
    const menuButton = document.querySelector('.mobile-menu-button');
    
    nav.classList.toggle('mobile-menu');
    menuButton.classList.toggle('active');
    
    if (nav.classList.contains('mobile-menu')) {
        // Меню открыто
        document.body.style.overflow = 'hidden';
    } else {
        // Меню закрыто
        document.body.style.overflow = '';
    }
}

// Добавляем обработчик для изображений в галерее
document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', function() {
        // Здесь можно добавить логику для открытия полноразмерного изображения
        console.log('Открыть изображение: ', this.src);
    });
});

// Анимация при прокрутке
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const header = document.querySelector('header');
    
    // Эффект параллакса для шапки
    if (header) {
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    }
    
    // Показываем/скрываем кнопку "Наверх"
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    if (scrollToTopButton) {
        if (scrollPosition > 300) {
            scrollToTopButton.classList.add('visible');
        } else {
            scrollToTopButton.classList.remove('visible');
        }
    }
});

// Добавляем кнопку "Наверх"
const scrollToTopButton = document.createElement('button');
scrollToTopButton.className = 'scroll-to-top';
scrollToTopButton.innerHTML = '↑';
scrollToTopButton.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
document.body.appendChild(scrollToTopButton);

// Добавляем стили для кнопки "Наверх" через JavaScript
const scrollToTopStyles = document.createElement('style');
scrollToTopStyles.textContent = `
    .scroll-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background-color: #ff0000;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 99;
    }
    
    .scroll-to-top.visible {
        opacity: 1;
        visibility: visible;
    }
    
    .scroll-to-top:hover {
        background-color: #cc0000;
        transform: translateY(-3px);
    }
    
    .mobile-menu-button {
        display: none;
        background: none;
        border: none;
        width: 40px;
        height: 40px;
        padding: 5px;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 101;
        cursor: pointer;
    }
    
    .mobile-menu-button span {
        display: block;
        width: 100%;
        height: 3px;
        background-color: #fff;
        margin: 5px 0;
        transition: all 0.3s ease;
    }
    
    .mobile-menu-button.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-button.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-button.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -7px);
    }
    
    @media (max-width: 768px) {
        .mobile-menu-button {
            display: block;
        }
        
        nav ul {
            position: fixed;
            top: 0;
            right: -100%;
            width: 80%;
            max-width: 300px;
            height: 100vh;
            background-color: #1a1a1a;
            flex-direction: column;
            padding: 80px 20px 20px;
            transition: right 0.3s ease;
            z-index: 100;
        }
        
        nav.mobile-menu ul {
            right: 0;
        }
        
        nav ul li {
            margin: 10px 0;
        }
        
        nav ul li a {
            padding: 12px;
            border-radius: 4px;
        }
    }
`;
document.head.appendChild(scrollToTopStyles);

// Добавляем обработчики для видео в галерее
document.querySelectorAll('.video-container video').forEach(video => {
    // Добавляем эффект при наведении
    video.addEventListener('mouseenter', function() {
        this.controls = true;
    });
    
    video.addEventListener('mouseleave', function() {
        if (!this.paused) {
            this.controls = true;
        } else {
            this.controls = false;
        }
    });
    
    // Автопауза при скролле
    window.addEventListener('scroll', function() {
        const videoRect = video.getBoundingClientRect();
        const isVisible = (videoRect.top < window.innerHeight) && (videoRect.bottom >= 0);
        
        if (!isVisible && !video.paused) {
            video.pause();
        }
    });
});

// Инициализация всех видео на странице
function initVideos() {
    document.querySelectorAll('video').forEach(video => {
        // Установка постеров
        if (!video.getAttribute('poster')) {
            video.setAttribute('poster', 'images/video-poster-default.jpg');
        }
        
        // Добавление класса при загрузке метаданных
        video.addEventListener('loadedmetadata', function() {
            this.parentElement.classList.add('loaded');
        });
    });
}

// Вызываем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', initVideos);
