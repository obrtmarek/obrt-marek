const pricingForm = document.getElementById('pricing-form');
const serviceKvadraturaList = document.getElementById('service-kvadratura-list');
const extraQuantityList = document.getElementById('extra-quantity-list');
const totalPriceElement = document.getElementById('total-price');
const breakdownElement = document.getElementById('price-breakdown');
const contactError = document.getElementById('contact-error');

if (pricingForm) {
    const allCardInputs = pricingForm.querySelectorAll('.select-card input[type="checkbox"]');
    const serviceKvadraturaMap = {};
    const extraQuantityMap = {};
    const serviceMaintenanceMap = {}; // Track maintenance level per service
    const serviceFrequencyMap = {}; // Track frequency discount per service
    const frequencyDiscountOptions = [
        { value: 'none', label: 'Jednokratno (bez popusta)', multiplier: 1, discountPercent: 0 },
        { value: 'daily', label: 'Svakodnevno', multiplier: 0.5, discountPercent: 50 },
        { value: 'weekly', label: 'Tjedno', multiplier: 0.7, discountPercent: 30 },
        { value: 'monthly', label: 'Mjesečno', multiplier: 0.8, discountPercent: 20 }
    ];

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
                delete serviceMaintenanceMap[serviceKey];
                delete serviceFrequencyMap[serviceKey];
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

            // Add maintenance level dropdown if service has maintenance levels
            const maintenanceLevelsJSON = serviceInput.dataset.maintenanceLevels;
            if (maintenanceLevelsJSON) {
                try {
                    const maintenanceLevels = JSON.parse(maintenanceLevelsJSON);
                    const maintenanceContainer = document.createElement('div');
                    maintenanceContainer.style.marginTop = '10px';
                    
                    const maintenanceLabel = document.createElement('label');
                    maintenanceLabel.style.display = 'block';
                    maintenanceLabel.textContent = 'Stanje prostora: ';
                    
                    const maintenanceSelect = document.createElement('select');
                    maintenanceSelect.dataset.serviceKey = serviceKey;
                    maintenanceSelect.className = 'maintenance-level-select';
                    maintenanceSelect.style.marginLeft = '5px';
                    
                    maintenanceLevels.forEach((level, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = `${level.label} (x${level.multiplier.toFixed(2)})`;
                        if (index === 0) {
                            option.selected = true; // Set first option as default
                        }
                        maintenanceSelect.appendChild(option);
                    });

                    // Initialize with first option selected
                    serviceMaintenanceMap[serviceKey] = 0;
                    
                    maintenanceSelect.addEventListener('change', calculatePrice);
                    
                    maintenanceLabel.appendChild(maintenanceSelect);
                    maintenanceContainer.appendChild(maintenanceLabel);
                    item.appendChild(maintenanceContainer);
                } catch (e) {
                    console.error('Failed to parse maintenance levels:', e);
                }
            }

            const frequencyContainer = document.createElement('div');
            frequencyContainer.style.marginTop = '10px';

            const frequencyLabel = document.createElement('label');
            frequencyLabel.style.display = 'block';
            frequencyLabel.textContent = 'Učestalost čišćenja: ';

            const frequencySelect = document.createElement('select');
            frequencySelect.dataset.serviceKey = serviceKey;
            frequencySelect.className = 'frequency-discount-select';
            frequencySelect.style.marginLeft = '5px';

            const selectedFrequency = serviceFrequencyMap[serviceKey] || 'none';
            frequencyDiscountOptions.forEach((optionData) => {
                const option = document.createElement('option');
                option.value = optionData.value;
                if (optionData.discountPercent > 0) {
                    option.textContent = `${optionData.label} (-${optionData.discountPercent}%)`;
                } else {
                    option.textContent = optionData.label;
                }
                option.selected = optionData.value === selectedFrequency;
                frequencySelect.appendChild(option);
            });

            serviceFrequencyMap[serviceKey] = selectedFrequency;

            frequencyLabel.appendChild(frequencySelect);
            frequencyContainer.appendChild(frequencyLabel);
            item.appendChild(frequencyContainer);

            serviceKvadraturaList.appendChild(item);
        });
    };

    const ensureExtraQuantityState = (extraServices) => {
        extraServices.forEach((extraInput) => {
            if (typeof extraQuantityMap[extraInput.value] === 'undefined') {
                extraQuantityMap[extraInput.value] = 1;
            }
        });
    };

    const renderExtraQuantitySliders = () => {
        if (!extraQuantityList) {
            return;
        }

        const extraServices = getSelectedCards('extra-service');
        const activeKeys = new Set(extraServices.map((extraInput) => extraInput.value));

        Object.keys(extraQuantityMap).forEach((extraKey) => {
            if (!activeKeys.has(extraKey)) {
                delete extraQuantityMap[extraKey];
            }
        });

        ensureExtraQuantityState(extraServices);
        extraQuantityList.innerHTML = '';

        if (extraServices.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'slider-empty';
            emptyMessage.textContent = 'Odaberite dodatne usluge kako biste postavili količinu.';
            extraQuantityList.appendChild(emptyMessage);
            return;
        }

        extraServices.forEach((extraInput) => {
            const extraKey = extraInput.value;
            const currentValue = extraQuantityMap[extraKey] || 1;
            const quantityLabel = extraInput.dataset.quantityLabel || 'Količina';
            const unitLabel = extraInput.dataset.unitLabel || 'jedinica';

            const item = document.createElement('div');
            item.className = 'service-kvadratura-item';

            const title = document.createElement('p');
            title.className = 'service-kvadratura-title';
            title.innerHTML = `${quantityLabel}: <strong><span data-extra-value="${extraKey}">${currentValue}</span> ${unitLabel}</strong>`;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '1';
            slider.max = '50';
            slider.step = '1';
            slider.value = String(currentValue);
            slider.className = 'service-kvadratura-slider';
            slider.dataset.extraKey = extraKey;

            slider.addEventListener('input', (event) => {
                const nextValue = Number(event.target.value);
                extraQuantityMap[extraKey] = nextValue;

                const valueElement = item.querySelector(`[data-extra-value="${extraKey}"]`);
                if (valueElement) {
                    valueElement.textContent = String(nextValue);
                }

                calculatePrice();
            });

            item.appendChild(title);
            item.appendChild(slider);
            extraQuantityList.appendChild(item);
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
            let itemTotal = servicePrice * serviceKvadratura;
            const breakdownDetails = [];
            
            // Apply per-service maintenance multiplier
            const maintenanceLevelsJSON = serviceInput.dataset.maintenanceLevels;
            if (maintenanceLevelsJSON) {
                try {
                    const maintenanceLevels = JSON.parse(maintenanceLevelsJSON);
                    const selectedMaintenanceIndex = serviceMaintenanceMap[serviceInput.value];
                    if (selectedMaintenanceIndex !== undefined && maintenanceLevels[selectedMaintenanceIndex]) {
                        const multiplier = maintenanceLevels[selectedMaintenanceIndex].multiplier;
                        itemTotal *= multiplier;
                        breakdownDetails.push(`Stanje: ${maintenanceLevels[selectedMaintenanceIndex].label}`);
                    }
                } catch (e) {
                    console.error('Failed to parse maintenance levels in price calculation:', e);
                }
            }

            const selectedFrequencyValue = serviceFrequencyMap[serviceInput.value] || 'none';
            const selectedFrequency = frequencyDiscountOptions.find((option) => option.value === selectedFrequencyValue) || frequencyDiscountOptions[0];
            itemTotal *= selectedFrequency.multiplier;
            if (selectedFrequency.discountPercent > 0) {
                breakdownDetails.push(`Učestalost: ${selectedFrequency.label} (-${selectedFrequency.discountPercent}%)`);
            }

            const detailsText = breakdownDetails.length > 0 ? ` - ${breakdownDetails.join(', ')}` : '';
            breakdown.push(`${serviceInput.dataset.label} (${serviceKvadratura} m²)${detailsText}: ${formatCurrency(itemTotal)} €`);
            
            baseTotal += itemTotal;
        });

        extraServices.forEach((extraInput) => {
            const extraPrice = Number(extraInput.dataset.price);
            const extraQuantity = Number(extraQuantityMap[extraInput.value] || 1);
            const unitLabel = extraInput.dataset.unitLabel || 'jedinica';
            const itemTotal = extraPrice * extraQuantity;
            extrasTotal += itemTotal;
            breakdown.push(`${extraInput.dataset.label} (${extraQuantity} ${unitLabel}): ${formatCurrency(itemTotal)} €`);
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
            renderExtraQuantitySliders();
            calculatePrice();
        });
    });

    // Delegate maintenance level changes
    pricingForm.addEventListener('change', (event) => {
        if (event.target.classList.contains('maintenance-level-select')) {
            const serviceKey = event.target.dataset.serviceKey;
            const selectedIndex = event.target.value;
            if (selectedIndex === '') {
                delete serviceMaintenanceMap[serviceKey];
            } else {
                serviceMaintenanceMap[serviceKey] = Number(selectedIndex);
            }
            calculatePrice();
        }

        if (event.target.classList.contains('frequency-discount-select')) {
            const serviceKey = event.target.dataset.serviceKey;
            serviceFrequencyMap[serviceKey] = event.target.value || 'none';
            calculatePrice();
        }
    });

    ['email', 'telefon'].forEach((id) => {
        const field = document.getElementById(id);
        field.addEventListener('input', validateContactOptions);
    });

    const prepareFormForSubmission = () => {
        // Remove existing hidden fields
        pricingForm.querySelectorAll('input[type="hidden"]').forEach((field) => {
            field.remove();
        });

        // Add hidden field for selected services
        const baseServices = getSelectedCards('base-service');
        const extraServices = getSelectedCards('extra-service');

        if (baseServices.length > 0) {
            const baseServicesData = baseServices.map((service) => {
                const kvadratura = serviceKvadraturaMap[service.value];
                const maintenance = serviceMaintenanceMap[service.value];
                const frequency = serviceFrequencyMap[service.value];
                let details = `${service.dataset.label} (${kvadratura} m²)`;
                
                // Add maintenance level if applicable
                if (maintenance !== undefined && service.dataset.maintenanceLevels) {
                    try {
                        const maintenanceLevels = JSON.parse(service.dataset.maintenanceLevels);
                        if (maintenanceLevels[maintenance]) {
                            details += ` - Stanje: ${maintenanceLevels[maintenance].label}`;
                        }
                    } catch (e) {
                        console.error('Failed to parse maintenance levels:', e);
                    }
                }
                
                // Add frequency if not default
                if (frequency && frequency !== 'none') {
                    const freq = frequencyDiscountOptions.find(f => f.value === frequency);
                    if (freq) details += ` - ${freq.label}`;
                }
                
                return details;
            }).join('; ');
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = 'Glavne usluge';
            hiddenField.value = baseServicesData;
            pricingForm.appendChild(hiddenField);
        }

        if (extraServices.length > 0) {
            const extraServicesData = extraServices.map((service) => {
                const quantity = extraQuantityMap[service.value];
                const unitLabel = service.dataset.unitLabel || 'kom';
                return `${service.dataset.label} (${quantity} ${unitLabel})`;
            }).join('; ');
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = 'Dodatne usluge';
            hiddenField.value = extraServicesData;
            pricingForm.appendChild(hiddenField);
        }

        // Add hidden field for total price
        const totalPriceField = document.createElement('input');
        totalPriceField.type = 'hidden';
        totalPriceField.name = 'Ukupna cijena';
        totalPriceField.value = totalPriceElement.textContent + ' €';
        pricingForm.appendChild(totalPriceField);

        // Add hidden field for date and time
        const dateField = document.getElementById('datum-ciscenja').value;
        const timeField = document.getElementById('vrijeme-ciscenja').value;
        if (dateField && timeField) {
            const hiddenDateTimeField = document.createElement('input');
            hiddenDateTimeField.type = 'hidden';
            hiddenDateTimeField.name = 'Termin čišćenja';
            hiddenDateTimeField.value = `${dateField} u ${timeField}`;
            pricingForm.appendChild(hiddenDateTimeField);
        }
        
        console.log('Form prepared with hidden fields:', {
            baseServices: baseServices.length,
            extraServices: extraServices.length,
            totalPrice: totalPriceElement.textContent,
            hiddenFieldsCount: pricingForm.querySelectorAll('input[type="hidden"]').length
        });
    };

    pricingForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const hasBaseService = getSelectedCards('base-service').length > 0;
        const hasExtraService = getSelectedCards('extra-service').length > 0;

        if (!hasBaseService && !hasExtraService) {
            contactError.textContent = 'Odaberite barem jednu uslugu.';
            return;
        }

        if (!validateContactOptions()) {
            return;
        }

        calculatePrice();
        prepareFormForSubmission();
        
        // Add a Message field with the full quote summary
        const messageContent = document.getElementById('price-breakdown').innerText || '';
        const messageField = document.createElement('input');
        messageField.type = 'hidden';
        messageField.name = 'Message';
        messageField.value = `Sažetak upta:\n\n${messageContent}\n\nUkupna cijena: ${totalPriceElement.textContent} €`;
        pricingForm.appendChild(messageField);
        
        console.log('Submitting form to Formspree...');
        // Submit the form to Formspree
        pricingForm.submit();
    });

    updateSelectedCardStyle();
    renderServiceKvadraturaSliders();
    renderExtraQuantitySliders();
    calculatePrice();
}