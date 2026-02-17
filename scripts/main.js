document.addEventListener('DOMContentLoaded', () => {
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const whatsappNumber = '918607650047';
    const callNumber = '+918607650047';

    const readText = (element) => (element?.textContent || '').trim();
    const readFieldValue = (form, selector) => (form.querySelector(selector)?.value || '').trim();
    const toNumber = (value) => {
        const parsed = Number.parseFloat(String(value || '').replace(/[^0-9.]/g, ''));
        return Number.isFinite(parsed) ? parsed : Number.NaN;
    };

    const formatPrice = (value) => {
        if (!Number.isFinite(value)) {
            return 'NA';
        }
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
    };

    const updateProductCount = (cards) => {
        const countEl = document.querySelector('[data-product-count]');
        if (!countEl || !cards) {
            return;
        }

        const visibleCount = cards.filter((card) => card.style.display !== 'none').length;
        countEl.textContent = `${visibleCount} product${visibleCount === 1 ? '' : 's'}`;
    };

    const readProductMeta = (card) => {
        const info = card?.querySelector('.product-info');
        const name = readText(info?.querySelector('h3'));
        const details = readText(info?.querySelector('p'));
        const priceMatch = details.match(/price\s*:\s*(\d+(?:\.\d+)?)/i);
        const packMatch = details.match(/packaging\s*:\s*([^\n]+)/i);

        const price = priceMatch ? Number.parseFloat(priceMatch[1]) : Number.NaN;
        const packaging = packMatch ? packMatch[1].trim() : 'NA';

        return {
            name,
            details,
            price,
            priceLabel: Number.isFinite(price) ? formatPrice(price) : 'NA',
            packaging,
        };
    };

    // Highlight active nav links.
    document.querySelectorAll('.navbar .nav-link').forEach((link) => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (!href || href.startsWith('#')) {
            return;
        }

        const targetPage = href.split('#')[0] || 'index.html';
        const isHome = currentPage === '' || currentPage === 'index.html';
        if ((isHome && targetPage === 'index.html' && href === 'index.html') || targetPage === currentPage) {
            link.classList.add('active-page');
        }
    });

    document.querySelectorAll('.dropdown-item').forEach((item) => {
        const href = (item.getAttribute('href') || '').toLowerCase();
        if (!href) {
            return;
        }

        const targetPage = href.split('#')[0];
        if (targetPage === currentPage) {
            item.classList.add('active-page');
            const parentNavLink = document.querySelector('#offeringsDropdown');
            if (parentNavLink) {
                parentNavLink.classList.add('active-page');
            }
        }
    });

    const productGrid = document.querySelector('[data-product-grid]');
    const productCards = Array.from(document.querySelectorAll('[data-product-card], .product-section .product'));
    const categoryCards = Array.from(document.querySelectorAll('#Products .card'));
    const section = document.querySelector('.product-section') || document.querySelector('#Products');
    const searchInput = document.querySelector('.search-box input[type="search"]');

    let activeSearchQuery = '';
    let activePriceFilter = 'all';
    let emptyState = null;

    // Add product chips and metadata for sorting/filtering.
    if (productCards.length > 0) {
        productCards.forEach((card) => {
            const info = card.querySelector('.product-info');
            const meta = readProductMeta(card);
            card.dataset.price = Number.isFinite(meta.price) ? String(meta.price) : '';
            card.dataset.name = meta.name.toLowerCase();
            card.dataset.packaging = meta.packaging.toLowerCase();

            if (info && !info.querySelector('.product-badges') && (Number.isFinite(meta.price) || meta.packaging !== 'NA')) {
                const badgeWrap = document.createElement('div');
                badgeWrap.className = 'product-badges';

                if (Number.isFinite(meta.price)) {
                    const priceChip = document.createElement('span');
                    priceChip.className = 'meta-chip price';
                    priceChip.textContent = `Price: INR ${meta.priceLabel}`;
                    badgeWrap.appendChild(priceChip);
                }

                if (meta.packaging !== 'NA') {
                    const packChip = document.createElement('span');
                    packChip.className = 'meta-chip pack';
                    packChip.textContent = `Pack: ${meta.packaging}`;
                    badgeWrap.appendChild(packChip);
                }

                info.insertBefore(badgeWrap, info.querySelector('p'));
            }
        });

        updateProductCount(productCards);
    }

    const matchesProductSearch = (card, query) => {
        if (!query) {
            return true;
        }

        const searchable = [
            readText(card.querySelector('h3')),
            readText(card.querySelector('.product-info p')),
            card.dataset.packaging || '',
        ].join(' ').toLowerCase();

        return searchable.includes(query);
    };

    const matchesPriceFilter = (card, priceFilter) => {
        if (priceFilter === 'all') {
            return true;
        }

        const price = toNumber(card.dataset.price);
        if (!Number.isFinite(price)) {
            return false;
        }

        if (priceFilter === 'budget') {
            return price <= 170;
        }
        if (priceFilter === 'standard') {
            return price > 170 && price <= 300;
        }
        if (priceFilter === 'premium') {
            return price > 300;
        }

        return true;
    };

    const filterCategoryCards = () => {
        let visible = 0;
        categoryCards.forEach((card) => {
            const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
            const isVisible = !activeSearchQuery || title.includes(activeSearchQuery);
            const col = card.closest('.col-md-3') || card.closest('[class*="col-"]') || card;
            col.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visible += 1;
            }
        });
        return visible;
    };

    const filterProductCards = () => {
        let visible = 0;
        productCards.forEach((card) => {
            const isVisible = matchesProductSearch(card, activeSearchQuery) && matchesPriceFilter(card, activePriceFilter);
            card.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visible += 1;
            }
        });
        updateProductCount(productCards);
        return visible;
    };

    const syncEmptyState = (visibleCount) => {
        if (!emptyState) {
            return;
        }
        emptyState.style.display = activeSearchQuery && visibleCount === 0 ? 'block' : 'none';
    };

    // Product sorting controls.
    const sortSelect = document.querySelector('.product-sort');
    const defaultOrder = productCards.slice();
    if (sortSelect && productGrid && productCards.length > 0) {
        sortSelect.addEventListener('change', (event) => {
            const mode = event.target.value;
            const sorted = productCards.slice();

            if (mode === 'price-low') {
                sorted.sort((a, b) => (toNumber(a.dataset.price) - toNumber(b.dataset.price)));
            } else if (mode === 'price-high') {
                sorted.sort((a, b) => (toNumber(b.dataset.price) - toNumber(a.dataset.price)));
            } else if (mode === 'name-asc') {
                sorted.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || ''));
            } else {
                defaultOrder.forEach((card) => productGrid.appendChild(card));
                return;
            }

            sorted.forEach((card) => productGrid.appendChild(card));
        });
    }

    // Quick price filter chips for product pages.
    if (productCards.length > 0) {
        const controls = document.querySelector('.product-controls');
        if (controls) {
            const chipWrap = document.createElement('div');
            chipWrap.className = 'filter-chip-wrap';
            chipWrap.setAttribute('role', 'toolbar');
            chipWrap.setAttribute('aria-label', 'Quick price filters');
            chipWrap.innerHTML = `
                <button type="button" class="filter-chip is-active" data-price-filter="all">All</button>
                <button type="button" class="filter-chip" data-price-filter="budget">Budget (<=170)</button>
                <button type="button" class="filter-chip" data-price-filter="standard">Standard (171-300)</button>
                <button type="button" class="filter-chip" data-price-filter="premium">Premium (301+)</button>
            `;
            controls.appendChild(chipWrap);

            chipWrap.querySelectorAll('.filter-chip').forEach((chip) => {
                chip.addEventListener('click', () => {
                    activePriceFilter = chip.dataset.priceFilter || 'all';
                    chipWrap.querySelectorAll('.filter-chip').forEach((item) => item.classList.toggle('is-active', item === chip));
                    const visible = filterProductCards();
                    syncEmptyState(visible);
                });
            });
        }
    }

    // Search behavior across category and product listings.
    if (searchInput && (productCards.length > 0 || categoryCards.length > 0)) {
        emptyState = document.createElement('p');
        emptyState.className = 'section-subtitle search-empty-state';
        emptyState.textContent = 'No matches found. Try a different keyword.';
        emptyState.style.display = 'none';

        if (section) {
            section.appendChild(emptyState);
        }

        searchInput.addEventListener('input', (event) => {
            activeSearchQuery = event.target.value.trim().toLowerCase();
            const productVisible = filterProductCards();
            const categoryVisible = filterCategoryCards();
            syncEmptyState(productVisible + categoryVisible);
        });
    }

    // Initial visibility sync on first paint.
    if (productCards.length > 0 || categoryCards.length > 0) {
        const productVisible = filterProductCards();
        const categoryVisible = filterCategoryCards();
        syncEmptyState(productVisible + categoryVisible);
    }

    const messageField = document.querySelector('#footer textarea');
    const footerAnchor = document.querySelector('#footer');
    const scrollToEnquiry = () => {
        if (footerAnchor) {
            footerAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Quick order modal with direct WhatsApp + call actions.
    let quickOrderModal = null;
    let quickOrderModalInstance = null;
    const ensureQuickOrderModal = () => {
        if (quickOrderModal) {
            return quickOrderModal;
        }

        quickOrderModal = document.createElement('div');
        quickOrderModal.className = 'modal fade order-modal';
        quickOrderModal.id = 'quickOrderModal';
        quickOrderModal.tabIndex = -1;
        quickOrderModal.setAttribute('aria-labelledby', 'quickOrderTitle');
        quickOrderModal.setAttribute('aria-hidden', 'true');
        quickOrderModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="quickOrderTitle" class="modal-title h5">Quick Product Enquiry</h2>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="order-modal-product" data-order-product></p>
                        <p class="order-modal-meta" data-order-meta></p>
                        <p class="order-modal-note">Choose your preferred contact method to continue.</p>
                        <div class="order-modal-actions">
                            <a href="#" target="_blank" rel="noopener" class="btn btn-primary" data-order-whatsapp>Continue on WhatsApp</a>
                            <a href="tel:${callNumber}" class="btn btn-outline-brand">Call Now</a>
                            <button type="button" class="btn btn-soft" data-order-enquiry>Fill Enquiry Form</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(quickOrderModal);

        if (window.bootstrap && window.bootstrap.Modal) {
            quickOrderModalInstance = new window.bootstrap.Modal(quickOrderModal);
        }

        const enquiryButton = quickOrderModal.querySelector('[data-order-enquiry]');
        enquiryButton?.addEventListener('click', () => {
            if (quickOrderModalInstance) {
                quickOrderModalInstance.hide();
            }
            scrollToEnquiry();
            messageField?.focus();
        });

        return quickOrderModal;
    };

    document.querySelectorAll('.product .product-info button').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.product');
            const meta = readProductMeta(card);
            const safeName = meta.name || 'selected product';
            const productLine = `${safeName} (${meta.packaging})`;
            const orderMessage = `Hello Nav Vedic Herbals, I want to order ${safeName}. Price: INR ${meta.priceLabel}. Packaging: ${meta.packaging}. Please share availability and order process.`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

            if (messageField && meta.name) {
                messageField.value = `I am interested in ${meta.name}. Please share availability and order details.`;
            }

            const modal = ensureQuickOrderModal();
            const productEl = modal.querySelector('[data-order-product]');
            const metaEl = modal.querySelector('[data-order-meta]');
            const whatsappEl = modal.querySelector('[data-order-whatsapp]');

            if (productEl) {
                productEl.textContent = productLine;
            }
            if (metaEl) {
                metaEl.textContent = `Price: INR ${meta.priceLabel} | Pack: ${meta.packaging}`;
            }
            if (whatsappEl) {
                whatsappEl.setAttribute('href', whatsappUrl);
            }

            if (quickOrderModalInstance) {
                quickOrderModalInstance.show();
            } else {
                window.open(whatsappUrl, '_blank', 'noopener');
                scrollToEnquiry();
            }
        });
    });

    // Handle footer form submit via WhatsApp for practical static-site usage.
    document.querySelectorAll('footer form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const name = readFieldValue(form, 'input[aria-label="Name"]');
            const email = readFieldValue(form, 'input[aria-label="Email"]');
            const phone = readFieldValue(form, 'input[aria-label="Contact number"]');
            const location = readFieldValue(form, 'input[aria-label="Location"]');
            const userMessage = readFieldValue(form, 'textarea[aria-label="Message"]');
            const pageLabel = document.title.replace('Nav Vedic Herbals | ', '') || 'Website';

            const enquiryLines = [
                `Hello Nav Vedic Herbals, I want to submit an enquiry from the ${pageLabel} page.`,
                `Name: ${name || 'NA'}`,
                `Email: ${email || 'NA'}`,
                `Contact: ${phone || 'NA'}`,
                `Location: ${location || 'NA'}`,
                `Message: ${userMessage || 'NA'}`,
            ];

            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(enquiryLines.join('\n'))}`;
            window.open(whatsappUrl, '_blank', 'noopener');

            let feedback = form.querySelector('.form-feedback');
            if (!feedback) {
                feedback = document.createElement('p');
                feedback.className = 'form-feedback';
                form.appendChild(feedback);
            }
            feedback.textContent = 'Thanks. We opened WhatsApp with your enquiry details.';
            form.reset();
        });
    });

    // Add floating quick-contact actions.
    if (!document.querySelector('.floating-actions')) {
        const quickActions = document.createElement('div');
        quickActions.className = 'floating-actions';
        quickActions.innerHTML = `
            <a class="floating-action call" href="tel:${callNumber}" aria-label="Call Nav Vedic Herbals">Call Now</a>
            <a class="floating-action chat" href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">WhatsApp</a>
        `;
        document.body.appendChild(quickActions);
    }

    // Lightweight reading progress bar.
    if (!document.querySelector('.scroll-progress')) {
        const progress = document.createElement('div');
        progress.className = 'scroll-progress';
        progress.innerHTML = '<span></span>';
        document.body.appendChild(progress);

        const progressFill = progress.querySelector('span');
        const syncProgress = () => {
            const doc = document.documentElement;
            const scrollable = doc.scrollHeight - doc.clientHeight;
            const ratio = scrollable > 0 ? (doc.scrollTop / scrollable) : 0;
            progressFill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
        };

        window.addEventListener('scroll', syncProgress, { passive: true });
        window.addEventListener('resize', syncProgress);
        syncProgress();
    }

    // Lazy-load non-hero images that do not already define loading behavior.
    document.querySelectorAll('img').forEach((img) => {
        if (!img.classList.contains('bgimage') && !img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });

    // Professional reveal animations with reduced-motion respect.
    if (!prefersReducedMotion) {
        document.body.classList.add('motion-enabled');

        const revealTargets = Array.from(document.querySelectorAll(
            '.about-content, .value-card, #Products .card, #productCarousel .card, .quick-trust-item, [data-product-card], .medical-note p, .faq-shell .accordion-item, .cta-band-inner, .page-hero, .process-step, .reach-card'
        ));

        revealTargets.forEach((el, index) => {
            el.classList.add('reveal');
            const delay = Math.min((index % 10) * 55, 420);
            el.style.setProperty('--reveal-delay', `${delay}ms`);
        });

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -8% 0px',
        });

        revealTargets.forEach((el) => revealObserver.observe(el));
    }

    // Animated reach counters.
    const metricEls = Array.from(document.querySelectorAll('[data-count]'));
    const setMetricFinal = (el) => {
        const target = Number.parseInt(el.dataset.count || '0', 10);
        const suffix = el.dataset.suffix || '';
        el.textContent = `${target.toLocaleString('en-IN')}${suffix}`;
    };

    if (metricEls.length > 0) {
        if (prefersReducedMotion) {
            metricEls.forEach(setMetricFinal);
        } else {
            const animateMetric = (el) => {
                const target = Number.parseInt(el.dataset.count || '0', 10);
                const suffix = el.dataset.suffix || '';
                const duration = 1300;
                const start = performance.now();

                const step = (now) => {
                    const progress = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const value = Math.round(target * eased);
                    el.textContent = `${value.toLocaleString('en-IN')}${suffix}`;
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    } else {
                        setMetricFinal(el);
                    }
                };

                window.requestAnimationFrame(step);
            };

            const metricObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateMetric(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            metricEls.forEach((el) => metricObserver.observe(el));
        }
    }

    // Back-to-top control.
    const topButton = document.createElement('button');
    topButton.type = 'button';
    topButton.className = 'back-to-top';
    topButton.textContent = 'Top';
    document.body.appendChild(topButton);

    const toggleTopButton = () => {
        if (window.scrollY > 420) {
            topButton.classList.add('is-visible');
        } else {
            topButton.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', toggleTopButton, { passive: true });
    toggleTopButton();

    topButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
