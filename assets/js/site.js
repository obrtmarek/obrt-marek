document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = carousel.querySelectorAll('img');
    const previous = carousel.querySelector('.left');
    const next = carousel.querySelector('.right');
    let current = 0;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('active', slideIndex === current);
        });
    };

    previous.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
});

document.querySelectorAll('[data-menu-toggle]').forEach((toggle) => {
    const menu = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!menu) return;

    const closeMenu = (returnFocus = false) => {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Otvori izbornik');
        if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
        const isOpen = menu.hidden;
        menu.hidden = !isOpen;
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Zatvori izbornik' : 'Otvori izbornik');
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
    });

    document.addEventListener('click', (event) => {
        if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
});
