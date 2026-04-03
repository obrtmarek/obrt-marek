const pricingForm = document.getElementById('pricing-form');
const serviceKvadraturaList = document.getElementById('service-kvadratura-list');
const totalPriceElement = document.getElementById('total-price');
const breakdownElement = document.getElementById('price-breakdown');
const contactError = document.getElementById('contact-error');

if (pricingForm) {
    const allCardInputs = pricingForm.querySelectorAll('.select-card input[type="checkbox"]');
    const serviceKvadraturaMap = {};

    const formatCurrency = (value) => value.toFixed(2);

    const getWeekendMultiplier = () => {
        const dateValue = document.getElementById('datum-ciscenja').value;

        if (!dateValue) {
            return 1;
        }

        const selectedDate = new Date(dateValue);
        const day = selectedDate.getDay();

        return day === 0 || day === 6 ? 1.2 : 1;
    };

    const getEarlyLateMultiplier = () => {
        const timeValue = document.getElementById('vrijeme-ciscenja').value;

        if (!timeValue) {
            return 1;
        }

        const hour = Number(timeValue.split(':')[0]);
        return hour < 8 || hour >= 18 ? 1.15 : 1;
    };

    const getSelectedCards = (name) => {
        return Array.from(pricingForm.querySelectorAll(`input[name="${name}"]:checked`));
    };

    const updateSelectedCardStyle = () => {
        allCardInputs.forEach((inputElement) => {
            const card = inputElement.closest('.select-card');
            card.classList.toggle('selected', inputElement.checked);
        });
    };

    const ensureServiceKvadraturaState = (baseServices) => {
        baseServices.forEach((serviceInput) => {
            if (typeof serviceKvadraturaMap[serviceInput.value] === 'undefined') {
                serviceKvadraturaMap[serviceInput.value] = 60;
            }
        });
    };

    const renderServiceKvadraturaSliders = () => {
        const baseServices = getSelectedCards('base-service');
        const activeKeys = new Set(baseServices.map((serviceInput) => serviceInput.value));

        Object.keys(serviceKvadraturaMap).forEach((serviceKey) => {
            if (!activeKeys.has(serviceKey)) {
                delete serviceKvadraturaMap[serviceKey];
            }
        });

        ensureServiceKvadraturaState(baseServices);
        serviceKvadraturaList.innerHTML = '';

        if (baseServices.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'slider-empty';
            emptyMessage.textContent = 'Odaberite glavne usluge kako biste postavili kvadraturu za svaku.';
            serviceKvadraturaList.appendChild(emptyMessage);
            return;
        }

        baseServices.forEach((serviceInput) => {
            const serviceKey = serviceInput.value;
            const currentValue = serviceKvadraturaMap[serviceKey] || 60;

            const item = document.createElement('div');
            item.className = 'service-kvadratura-item';

            const title = document.createElement('p');
            title.className = 'service-kvadratura-title';
            title.innerHTML = `${serviceInput.dataset.label}: <strong><span data-kv-value="${serviceKey}">${currentValue}</span> m²</strong>`;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '20';
            slider.max = '500';
            slider.step = '5';
            slider.value = String(currentValue);
            slider.className = 'service-kvadratura-slider';
            slider.dataset.serviceKey = serviceKey;

            slider.addEventListener('input', (event) => {
                const nextValue = Number(event.target.value);
                serviceKvadraturaMap[serviceKey] = nextValue;

                const valueElement = item.querySelector(`[data-kv-value="${serviceKey}"]`);
                if (valueElement) {
                    valueElement.textContent = String(nextValue);
                }

                calculatePrice();
            });

            item.appendChild(title);
            item.appendChild(slider);
            serviceKvadraturaList.appendChild(item);
        });
    };

    const calculatePrice = () => {
        const baseServices = getSelectedCards('base-service');
        const extraServices = getSelectedCards('extra-service');
        const weekendMultiplier = getWeekendMultiplier();
        const timeMultiplier = getEarlyLateMultiplier();

        let baseTotal = 0;
        let extrasTotal = 0;
        const breakdown = [];

        baseServices.forEach((serviceInput) => {
            const servicePrice = Number(serviceInput.dataset.price);
            const serviceKvadratura = Number(serviceKvadraturaMap[serviceInput.value] || 60);
            const itemTotal = servicePrice * serviceKvadratura;
            baseTotal += itemTotal;
            breakdown.push(`${serviceInput.dataset.label} (${serviceKvadratura} m²): ${formatCurrency(itemTotal)} €`);
        });

        extraServices.forEach((extraInput) => {
            const extraPrice = Number(extraInput.dataset.price);
            extrasTotal += extraPrice;
            breakdown.push(`${extraInput.dataset.label}: ${formatCurrency(extraPrice)} €`);
        });

        const subtotal = baseTotal + extrasTotal;
        const total = subtotal * weekendMultiplier * timeMultiplier;

        totalPriceElement.textContent = formatCurrency(total);
        breakdownElement.innerHTML = '';

        if (breakdown.length === 0) {
            const noSelection = document.createElement('li');
            noSelection.textContent = 'Odaberite barem jednu uslugu za izračun procjene.';
            breakdownElement.appendChild(noSelection);
            return;
        }

        breakdown.forEach((row) => {
            const item = document.createElement('li');
            item.textContent = row;
            breakdownElement.appendChild(item);
        });

        if (weekendMultiplier > 1) {
            const weekendItem = document.createElement('li');
            weekendItem.textContent = 'Vikend termin: +20%';
            breakdownElement.appendChild(weekendItem);
        }

        if (timeMultiplier > 1) {
            const timeItem = document.createElement('li');
            timeItem.textContent = 'Rani/kasni termin: +15%';
            breakdownElement.appendChild(timeItem);
        }
    };

    const validateContactOptions = () => {
        const emailValue = document.getElementById('email').value.trim();
        const phoneValue = document.getElementById('telefon').value.trim();

        if (!emailValue && !phoneValue) {
            contactError.textContent = 'Unesite email ili telefon.';
            return false;
        }

        contactError.textContent = '';
        return true;
    };

    pricingForm.querySelectorAll('input').forEach((inputElement) => {
        inputElement.addEventListener('change', () => {
            updateSelectedCardStyle();
            renderServiceKvadraturaSliders();
            calculatePrice();
        });
    });

    ['email', 'telefon'].forEach((id) => {
        const field = document.getElementById(id);
        field.addEventListener('input', validateContactOptions);
    });

    pricingForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const hasBaseService = getSelectedCards('base-service').length > 0;

        if (!hasBaseService) {
            contactError.textContent = 'Odaberite barem jednu glavnu uslugu.';
            return;
        }

        if (!validateContactOptions()) {
            return;
        }

        calculatePrice();
        alert('Upit je pripremljen. Kontaktirat ćemo vas uskoro.');
    });

    updateSelectedCardStyle();
    renderServiceKvadraturaSliders();
    calculatePrice();
}