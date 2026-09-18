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
