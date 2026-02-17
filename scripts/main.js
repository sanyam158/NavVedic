document.addEventListener('DOMContentLoaded', () => {
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateProductCount = (cards) => {
        const countEl = document.querySelector('[data-product-count]');
        if (!countEl || !cards) {
            return;
        }

        const visibleCount = cards.filter((card) => card.style.display !== 'none').length;
        countEl.textContent = `${visibleCount} product${visibleCount === 1 ? '' : 's'}`;
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

    // Add product chips and metadata for sorting.
    if (productCards.length > 0) {
        productCards.forEach((card) => {
            const info = card.querySelector('.product-info');
            const metaText = info?.querySelector('p')?.textContent || '';
            const priceMatch = metaText.match(/price\s*:\s*(\d+(?:\.\d+)?)/i);
            const packMatch = metaText.match(/packaging\s*:\s*([^\n]+)/i);

            const priceValue = priceMatch ? Number.parseFloat(priceMatch[1]) : Number.POSITIVE_INFINITY;
            card.dataset.price = Number.isFinite(priceValue) ? String(priceValue) : '';
            card.dataset.name = (info?.querySelector('h3')?.textContent || '').trim().toLowerCase();

            if (info && !info.querySelector('.product-badges') && (priceMatch || packMatch)) {
                const badgeWrap = document.createElement('div');
                badgeWrap.className = 'product-badges';

                if (priceMatch) {
                    const priceChip = document.createElement('span');
                    priceChip.className = 'meta-chip price';
                    priceChip.textContent = `Price: INR ${priceMatch[1]}`;
                    badgeWrap.appendChild(priceChip);
                }

                if (packMatch) {
                    const packChip = document.createElement('span');
                    packChip.className = 'meta-chip pack';
                    packChip.textContent = `Pack: ${packMatch[1].trim()}`;
                    badgeWrap.appendChild(packChip);
                }

                info.insertBefore(badgeWrap, info.querySelector('p'));
            }
        });

        updateProductCount(productCards);
    }

    // Product sorting controls.
    const sortSelect = document.querySelector('.product-sort');
    const defaultOrder = productCards.slice();
    if (sortSelect && productGrid && productCards.length > 0) {
        sortSelect.addEventListener('change', (event) => {
            const mode = event.target.value;
            const sorted = productCards.slice();

            if (mode === 'price-low') {
                sorted.sort((a, b) => (Number.parseFloat(a.dataset.price || 'Infinity') - Number.parseFloat(b.dataset.price || 'Infinity')));
            } else if (mode === 'price-high') {
                sorted.sort((a, b) => (Number.parseFloat(b.dataset.price || '-Infinity') - Number.parseFloat(a.dataset.price || '-Infinity')));
            } else if (mode === 'name-asc') {
                sorted.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || ''));
            } else {
                defaultOrder.forEach((card) => productGrid.appendChild(card));
                return;
            }

            sorted.forEach((card) => productGrid.appendChild(card));
        });
    }

    // Search behavior.
    const searchInput = document.querySelector('.search-box input[type="search"]');
    if (searchInput && (productCards.length > 0 || categoryCards.length > 0)) {
        const emptyState = document.createElement('p');
        emptyState.className = 'section-subtitle search-empty-state';
        emptyState.textContent = 'No matches found. Try a different keyword.';
        emptyState.style.display = 'none';

        const section = document.querySelector('.product-section') || document.querySelector('#Products');
        if (section) {
            section.appendChild(emptyState);
        }

        searchInput.addEventListener('input', (event) => {
            const query = event.target.value.trim().toLowerCase();
            let visibleCount = 0;

            if (productCards.length > 0) {
                productCards.forEach((card) => {
                    const name = (card.querySelector('h3')?.textContent || '').toLowerCase();
                    const details = (card.querySelector('.product-info p')?.textContent || '').toLowerCase();
                    const isVisible = !query || name.includes(query) || details.includes(query);
                    card.style.display = isVisible ? '' : 'none';
                    if (isVisible) {
                        visibleCount += 1;
                    }
                });
                updateProductCount(productCards);
            }

            if (categoryCards.length > 0) {
                categoryCards.forEach((card) => {
                    const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
                    const isVisible = !query || title.includes(query);
                    const col = card.closest('.col-md-3') || card.closest('[class*="col-"]') || card;
                    col.style.display = isVisible ? '' : 'none';
                    if (isVisible) {
                        visibleCount += 1;
                    }
                });
            }

            emptyState.style.display = query && visibleCount === 0 ? 'block' : 'none';
        });
    }

    // Prefill enquiry from Buy Now button.
    const messageField = document.querySelector('#footer textarea');
    const footerAnchor = document.querySelector('#footer');
    document.querySelectorAll('.product .product-info button').forEach((button) => {
        button.addEventListener('click', () => {
            const productName = button.closest('.product')?.querySelector('h3')?.textContent?.trim();
            if (messageField && productName) {
                messageField.value = `I am interested in ${productName}. Please share availability and order details.`;
            }
            if (footerAnchor) {
                footerAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Handle footer form submit gracefully for static site.
    document.querySelectorAll('footer form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (!submitBtn) {
                return;
            }

            const originalLabel = submitBtn.textContent;
            submitBtn.textContent = 'Thanks. We will contact you soon.';
            submitBtn.disabled = true;
            form.reset();

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalLabel;
            }, 2200);
        });
    });

    // Add floating quick-contact actions.
    if (!document.querySelector('.floating-actions')) {
        const quickActions = document.createElement('div');
        quickActions.className = 'floating-actions';
        quickActions.innerHTML = `
            <a class="floating-action call" href="tel:+918607650047" aria-label="Call Nav Vedic Herbals">Call Now</a>
            <a class="floating-action chat" href="https://wa.me/918607650047" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">WhatsApp</a>
        `;
        document.body.appendChild(quickActions);
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
            '.about-content, .value-card, #Products .card, #productCarousel .card, .quick-trust-item, [data-product-card], .medical-note p, .faq-shell .accordion-item, .cta-band-inner, .page-hero'
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
