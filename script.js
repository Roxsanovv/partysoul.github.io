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
        });
    });
    
    // Инициализация календаря
    initCalendar();
    
    // Добавление кнопки мобильного меню
    addMobileMenuButton();
    
    // Инициализация видео элементов
    initVideos();
    
    // Инициализация формы
    initForm();
    
    // Добавление обработчика для текстового выделения
    initTextSelection();
});

// Функция показа раздела
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
    
    // Плавная прокрутка к началу
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Установка активной ссылки в навигации
function setActiveNavLink(activeLink) {
    // Убрать активный класс у всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('style');
    });
    
    // Добавить активный класс к выбранной ссылке
    activeLink.classList.add('active');
}

// Инициализация календаря
function initCalendar() {
    const days = document.querySelectorAll('.calendar .day');
    days.forEach(day => {
        day.addEventListener('click', function() {
            // Удаляем активный класс у всех дней
            days.forEach(d => d.classList.remove('active'));
            
            // Добавляем активный класс к выбранному дню
            this.classList.add('active');
        });
    });
}

// Добавление кнопки мобильного меню
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

// Переключение мобильного меню
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

// Инициализация видео элементов
function initVideos() {
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

        video.addEventListener('progress', function() {
            if (video.buffered.length > 0) {
                const percent = (video.buffered.end(0) / video.duration) * 100;
                progressBar.style.width = `${percent}%`;
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
}

// Инициализация формы
function initForm() {
    const form = document.getElementById('material-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Здесь можно добавить AJAX отправку формы
            alert('Форма отправлена! Мы свяжемся с вами в ближайшее время.');
            form.reset();
        });
    }
}

// Инициализация текстового выделения
function initTextSelection() {
    // Добавляем стили для выделения текста динамически
    const style = document.createElement('style');
    style.textContent = `
        ::selection {
            background-color: #ff0000;
            color: white;
            text-shadow: none;
        }
        
        ::-moz-selection {
            background-color: #ff0000;
            color: white;
            text-shadow: none;
        }
        
        h1::selection, h2::selection, h3::selection,
        p::selection, li::selection, a::selection {
            background-color: #cc0000;
            color: #fff;
        }
        
        input::selection, textarea::selection {
            background-color: #ff3333;
            color: #fff;
        }
    `;
    document.head.appendChild(style);
}

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

// Обработчик скролла для кнопки "Наверх"
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    
    if (scrollToTopButton) {
        if (scrollPosition > 300) {
            scrollToTopButton.classList.add('visible');
        } else {
            scrollToTopButton.classList.remove('visible');
        }
    }
    
    // Эффект параллакса для шапки
    const header = document.querySelector('header');
    if (header) {
        header.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    }
});

// Добавляем обработчик для изображений в галерее
document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', function() {
        // Создаем модальное окно для просмотра изображения
        createImageModal(this.src, this.alt);
    });
});

// Функция создания модального окна для изображений
function createImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(img);
    modal.appendChild(modalContent);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }
    });
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Добавляем стили для модального окна
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .modal {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
        }
        
        .modal img {
            max-width: 100%;
            max-height: 80vh;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
        }
        
        .close-modal {
            position: absolute;
            top: -40px;
            right: 0;
            color: white;
            font-size: 30px;
            cursor: pointer;
            transition: color 0.3s;
        }
        
        .close-modal:hover {
            color: #d90000;
        }
    `;
    document.head.appendChild(modalStyles);
}
