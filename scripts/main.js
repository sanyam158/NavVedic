document.addEventListener('DOMContentLoaded', () => {
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

    // Highlight active nav link.
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

    const searchInput = document.querySelector('.search-box input[type="search"]');
    const productCards = Array.from(document.querySelectorAll('.product-section .product'));
    const categoryCards = Array.from(document.querySelectorAll('#Products .card'));

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
                    const details = (card.querySelector('p')?.textContent || '').toLowerCase();
                    const isVisible = !query || name.includes(query) || details.includes(query);
                    card.style.display = isVisible ? '' : 'none';
                    if (isVisible) {
                        visibleCount += 1;
                    }
                });
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
