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
    document.querySelectorAll('.sidebar-link').forEach(link => {
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
    
    // Плавная прокрутка к началу
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function setActiveNavLink(activeLink) {
    // Убрать активный класс у всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Добавить активный класс к выбранной ссылке
    activeLink.classList.add('active');
}

// Отключение автовоспроизведения для всех iframe
document.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src');
    // Убедимся, что параметр autoplay отключен
    if (src.includes('youtube') && !src.includes('autoplay=0')) {
        iframe.setAttribute('src', src.split('?')[0] + '?autoplay=0');
    }
});
