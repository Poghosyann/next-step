document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // Helpers
    // =========================================================
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const esc = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Only allow safe URL schemes in admin-provided links/images
    const safeUrl = (url) => {
        const u = String(url ?? '').trim();
        if (!u) return '';
        if (/^(https?:|mailto:|tel:|#|\/)/i.test(u)) return u;
        if (/^[\w.\-/]+$/.test(u)) return u; // relative paths like logo.png
        return '';
    };

    const safeIcon = (cls) => String(cls ?? '').replace(/[^\w\s-]/g, '').trim() || 'fa-solid fa-star';

    const parseYouTubeId = (url) => {
        if (!url) return null;
        const s = String(url).trim();
        const patterns = [
            /youtu\.be\/([A-Za-z0-9_-]{11})/,
            /youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{11})/,
            /^([A-Za-z0-9_-]{11})$/
        ];
        for (const p of patterns) {
            const m = s.match(p);
            if (m) return m[1];
        }
        return null;
    };

    const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    const setText = (el, text) => { if (el && text !== undefined && text !== null) el.textContent = text; };
    const list = (arr) => (Array.isArray(arr) ? arr : []);

    // =========================================================
    // Render admin-managed content
    // =========================================================
    let siteContent = null;

    const renderContent = (c) => {
        if (!c) return;
        siteContent = c;

        // --- Meta ---
        if (c.meta) {
            if (c.meta.title) document.title = c.meta.title;
            const metaDesc = $('meta[name="description"]');
            if (metaDesc && c.meta.description) metaDesc.setAttribute('content', c.meta.description);
        }

        // --- Header ---
        if (c.header) {
            const logo = $('.logo-img');
            if (logo && safeUrl(c.header.logo)) logo.src = safeUrl(c.header.logo);
            setText($('.header-actions .btn'), c.header.cta_text);
            const navList = $('.nav-list');
            if (navList && Array.isArray(c.header.nav)) {
                navList.innerHTML = list(c.header.nav).map(n =>
                    `<li><a href="${esc(safeUrl(n.href) || '#')}">${esc(n.label)}</a></li>`
                ).join('');
            }
        }

        // --- Hero ---
        if (c.hero) {
            const h1 = $('.hero-content h1');
            if (h1) {
                h1.innerHTML = `${esc(c.hero.title)}${c.hero.highlight ? ` <span class="highlight">${esc(c.hero.highlight)}</span>` : ''}`;
            }
            setText($('.hero-content p'), c.hero.subtitle);
            const heroBtns = $$('.hero-buttons a');
            setText(heroBtns[0], c.hero.primary_btn);
            setText(heroBtns[1], c.hero.secondary_btn);
            const mainImg = $('.instructor-img > img');
            if (mainImg && safeUrl(c.hero.image_main)) mainImg.src = safeUrl(c.hero.image_main);
            const secImg = $('.students-img img');
            const secWrap = $('.students-img');
            if (secImg && safeUrl(c.hero.image_secondary)) {
                secImg.src = safeUrl(c.hero.image_secondary);
                if (secWrap) secWrap.style.display = '';
            } else if (secWrap) {
                secWrap.style.display = 'none';
            }
            const statCard = $('.stat-card');
            if (statCard) {
                statCard.style.display = (c.hero.stat_value || c.hero.stat_label) ? '' : 'none';
                setText($('strong', statCard), c.hero.stat_value);
                setText($('span', statCard), c.hero.stat_label);
            }
        }

        // --- Features ---
        if (c.features) {
            setText($('#about .section-title'), c.features.title);
            const grid = $('.features-grid');
            if (grid) {
                grid.innerHTML = list(c.features.items).map(f => `
                    <div class="feature-card${f.highlight ? ' highlight-card' : ''}">
                        <div class="icon-box"><i class="${esc(safeIcon(f.icon))}"></i></div>
                        <h3>${esc(f.title)}</h3>
                    </div>`).join('');
            }
        }

        // --- Program & outcomes ---
        const programCols = $$('#program .program-column');
        if (c.program && programCols[0]) {
            setText($('.section-title', programCols[0]), c.program.title);
            const cards = $('.list-cards', programCols[0]);
            if (cards) {
                cards.innerHTML = list(c.program.items).map((it, i) => `
                    <div class="list-card">
                        <span class="step-num">${String(i + 1).padStart(2, '0')}</span>
                        <p>${esc(it.text)}</p>
                    </div>`).join('');
            }
        }
        if (c.outcomes && programCols[1]) {
            setText($('.section-title', programCols[1]), c.outcomes.title);
            const cards = $('.list-cards', programCols[1]);
            if (cards) {
                cards.innerHTML = list(c.outcomes.items).map(it => `
                    <div class="list-card">
                        <i class="fa-solid fa-check-circle text-primary"></i>
                        <p>${esc(it.text)}</p>
                    </div>`).join('');
            }
        }

        // --- Formats ---
        if (c.formats) {
            setText($('.format-section .section-title'), c.formats.title);
            const grid = $('.format-grid');
            if (grid) {
                grid.innerHTML = list(c.formats.items).map(f => `
                    <div class="format-card${f.wide ? ' wide-card' : ''}">
                        <i class="${esc(safeIcon(f.icon))}"></i>
                        <h3>${esc(f.title)}</h3>
                    </div>`).join('');
            }
        }

        // --- Gallery ---
        if (c.gallery) {
            setText($('#gallery .section-title'), c.gallery.title);
            setText($('.gallery-subtitle'), c.gallery.subtitle);
            const grid = $('#galleryGrid');
            if (grid) {
                const items = list(c.gallery.items).map(it => {
                    if (it.type === 'video') {
                        const id = parseYouTubeId(it.youtube_url);
                        if (!id) return '';
                        const thumb = safeUrl(it.image) || ytThumb(id);
                        return `
                        <div class="gallery-item" data-type="video" data-youtube="${esc(id)}" data-title="${esc(it.title)}">
                            <div class="gallery-media">
                                <img src="${esc(thumb)}" alt="${esc(it.title)}" loading="lazy">
                                <span class="gallery-badge badge-video"><i class="fa-solid fa-video"></i> Վիդեո</span>
                                <div class="gallery-overlay">
                                    <div class="gallery-action-icon"><i class="fa-solid fa-play"></i></div>
                                    <h4>${esc(it.title)}</h4>
                                </div>
                            </div>
                        </div>`;
                    }
                    const img = safeUrl(it.image);
                    if (!img) return '';
                    return `
                        <div class="gallery-item" data-type="photo" data-src="${esc(img)}" data-title="${esc(it.title)}">
                            <div class="gallery-media">
                                <img src="${esc(img)}" alt="${esc(it.title)}" loading="lazy">
                                <span class="gallery-badge badge-photo"><i class="fa-solid fa-camera"></i> Նկար</span>
                                <div class="gallery-overlay">
                                    <div class="gallery-action-icon"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                                    <h4>${esc(it.title)}</h4>
                                </div>
                            </div>
                        </div>`;
                }).join('');
                grid.innerHTML = items || '<p class="gallery-empty">Նյութեր դեռ չկան</p>';
                const activeTab = $('.gallery-tab.active');
                applyGalleryFilter(activeTab ? activeTab.getAttribute('data-filter') : 'all');
            }
        }

        // --- Instructors ---
        if (c.instructors) {
            const grid = $('#instructorsGrid');
            const section = $('#instructor');
            const items = list(c.instructors.items);
            if (section) section.style.display = items.length ? '' : 'none';
            if (grid) {
                grid.innerHTML = items.map(ins => `
                    <div class="instructor-box">
                        ${safeUrl(ins.photo) ? `
                        <div class="instructor-photo">
                            <img src="${esc(safeUrl(ins.photo))}" alt="${esc(ins.name)}" loading="lazy">
                            <div class="decor-box"></div>
                        </div>` : ''}
                        <div class="instructor-text">
                            <h3 class="instructor-name">${esc(ins.name)}</h3>
                            ${ins.role ? `<p class="instructor-role">${esc(ins.role)}</p>` : ''}
                            ${ins.bio ? `<p class="instructor-bio">${esc(ins.bio)}</p>` : ''}
                        </div>
                    </div>`).join('');
            }
        }

        // --- Stats ---
        if (c.stats) {
            const grid = $('.stats-grid');
            const section = $('.results-section');
            const items = list(c.stats.items);
            if (section) section.style.display = items.length ? '' : 'none';
            if (grid) {
                grid.innerHTML = items.map(s => `
                    <div class="stat-item">
                        <div class="stat-number">${esc(s.value)}</div>
                        <div class="stat-label">${esc(s.label)}</div>
                    </div>`).join('');
            }
        }

        // --- Reviews ---
        if (c.reviews) {
            setText($('#reviews .section-title'), c.reviews.title);
            const grid = $('.reviews-grid');
            if (grid) {
                const videos = list(c.reviews.videos).map(v => {
                    const id = parseYouTubeId(v.youtube_url);
                    const thumb = safeUrl(v.thumbnail) || (id ? ytThumb(id) : '');
                    return `
                    <div class="review-card video-review">
                        <div class="video-placeholder" ${id ? `data-youtube="${esc(id)}" data-title="${esc(v.title)}"` : ''}>
                            ${thumb ? `<img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy">` : ''}
                            ${id ? '<button type="button" class="play-btn" aria-label="Դիտել"><i class="fa-solid fa-play"></i></button>' : ''}
                        </div>
                        <div class="review-info">
                            <h4>${esc(v.title)}</h4>
                            ${v.text ? `<p>${esc(v.text)}</p>` : ''}
                        </div>
                    </div>`;
                }).join('');
                const texts = list(c.reviews.items).map(r => `
                    <div class="review-card text-review">
                        <div class="quote-icon"><i class="fa-solid fa-quote-right"></i></div>
                        <p class="review-text">${esc(r.text)}</p>
                        <div class="reviewer-profile">
                            ${safeUrl(r.photo) ? `<img src="${esc(safeUrl(r.photo))}" alt="${esc(r.name)}" loading="lazy">` : ''}
                            <div>
                                <h4>${esc(r.name)}</h4>
                                ${r.role ? `<span>${esc(r.role)}</span>` : ''}
                            </div>
                        </div>
                    </div>`).join('');
                grid.innerHTML = videos + texts;
                const section = $('#reviews');
                if (section) section.style.display = (videos + texts) ? '' : 'none';
            }
        }

        // --- FAQ ---
        if (c.faq) {
            setText($('.faq-header h2'), c.faq.title);
            setText($('.faq-header p'), c.faq.subtitle);
            const acc = $('.faq-accordion');
            if (acc) {
                acc.innerHTML = list(c.faq.items).map(f => `
                    <div class="accordion-item">
                        <div class="accordion-header">
                            <h3>${esc(f.question)}</h3>
                            <i class="fa-solid fa-chevron-down"></i>
                        </div>
                        <div class="accordion-body">
                            <p>${esc(f.answer)}</p>
                        </div>
                    </div>`).join('');
            }
        }

        // --- Registration ---
        if (c.registration) {
            setText($('#register .section-title'), c.registration.title);
            setText($('#register .form-subtitle'), c.registration.subtitle);
            setText($('#registrationForm button[type="submit"]'), c.registration.submit_text);
            const select = $('#course_direction');
            const courses = list(c.registration.courses).filter(x => x && x.name);
            if (select && courses.length) {
                select.innerHTML = courses.map(x => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
            }
        }

        // --- Contact ---
        if (c.contact) {
            const ct = c.contact;
            setText($('.contact-info .section-title'), ct.title);
            const contactList = $('.contact-list');
            if (contactList) {
                const phoneHref = (ct.phone || '').replace(/[^\d+]/g, '');
                const socials = [
                    ['facebook', 'fa-facebook-f'],
                    ['instagram', 'fa-instagram'],
                    ['whatsapp', 'fa-whatsapp'],
                    ['telegram', 'fa-telegram']
                ].filter(([key]) => safeUrl(ct[key]))
                    .map(([key, icon]) => `<a href="${esc(safeUrl(ct[key]))}" target="_blank" rel="noopener noreferrer" class="social-btn ${key}"><i class="fa-brands ${icon}"></i></a>`)
                    .join('');
                contactList.innerHTML = `
                    ${ct.address ? `
                    <div class="contact-item">
                        <div class="contact-icon"><i class="fa-solid fa-location-dot"></i></div>
                        <div>
                            <h4>Հասցե</h4>
                            <p>${safeUrl(ct.address_url)
                                ? `<a href="${esc(safeUrl(ct.address_url))}" target="_blank" rel="noopener noreferrer" class="address-link">${esc(ct.address)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.85em; margin-left: 4px;"></i></a>`
                                : esc(ct.address)}</p>
                        </div>
                    </div>` : ''}
                    ${ct.phone ? `
                    <div class="contact-item">
                        <div class="contact-icon"><i class="fa-solid fa-phone"></i></div>
                        <div>
                            <h4>${esc(ct.phone_label || 'Հեռախոս')}</h4>
                            <p><a href="tel:${esc(phoneHref)}">${esc(ct.phone)}</a></p>
                        </div>
                    </div>` : ''}
                    ${ct.email ? `
                    <div class="contact-item">
                        <div class="contact-icon"><i class="fa-solid fa-envelope"></i></div>
                        <div>
                            <h4>Էլ. փոստ</h4>
                            <p><a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a></p>
                        </div>
                    </div>` : ''}
                    ${socials ? `<div class="social-links">${socials}</div>` : ''}`;
            }
        }

        // --- Callback ---
        if (c.callback) {
            setText($('.floating-callback-btn span'), c.callback.button_text);
            setText($('#callbackModal .custom-modal-header h3'), c.callback.title);
            setText($('#callbackModal .custom-modal-header p'), c.callback.subtitle);
        }

        // --- Footer ---
        if (c.footer) {
            setText($('.footer-bottom > p'), c.footer.copyright);
            const links = $('.footer-links');
            if (links) {
                const linkItems = list(c.footer.links).filter(l =>
                    l && l.label && l.label.trim() &&
                    !/գաղտնի|պայման|privacy|term/i.test(l.label)
                );
                if (linkItems.length > 0) {
                    links.style.display = '';
                    links.innerHTML = linkItems.map(l =>
                        `<a href="${esc(safeUrl(l.href) || '#')}">${esc(l.label)}</a>`
                    ).join('');
                } else {
                    links.style.display = 'none';
                    links.innerHTML = '';
                }
            }
        }
    };

    // =========================================================
    // Mobile Menu Toggle
    // =========================================================
    const mobileToggle = $('.mobile-toggle');
    const nav = $('.nav');

    const setMenuIcon = (open) => {
        const icon = mobileToggle && $('i', mobileToggle);
        if (!icon) return;
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-xmark', open);
    };

    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            setMenuIcon(nav.classList.contains('active'));
        });
    }

    // =========================================================
    // Header Scroll Effect
    // =========================================================
    const header = $('.header');
    window.addEventListener('scroll', () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.style.boxShadow = 'var(--shadow-md)';
            header.style.padding = '0';
        } else {
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    });

    // =========================================================
    // Delegated click handling (works for re-rendered content)
    // =========================================================
    const galleryLightbox = $('#galleryLightbox');
    const lightboxMediaContainer = $('#lightboxMediaContainer');
    const lightboxCaption = $('#lightboxCaption');

    const openLightbox = ({ youtube, src, title }) => {
        if (!galleryLightbox || !lightboxMediaContainer) return;
        lightboxMediaContainer.innerHTML = '';
        if (youtube) {
            const wrap = document.createElement('div');
            wrap.className = 'lightbox-video';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}?autoplay=1&rel=0`;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.title = title || 'YouTube video';
            wrap.appendChild(iframe);
            lightboxMediaContainer.appendChild(wrap);
        } else if (src) {
            const img = document.createElement('img');
            img.src = src;
            img.alt = title || '';
            lightboxMediaContainer.appendChild(img);
        }
        if (lightboxCaption) lightboxCaption.textContent = title || '';
        galleryLightbox.classList.add('active');
    };

    const closeGalleryModal = () => {
        if (!galleryLightbox) return;
        galleryLightbox.classList.remove('active');
        if (lightboxMediaContainer) lightboxMediaContainer.innerHTML = '';
    };

    function applyGalleryFilter(filter) {
        $$('.gallery-item').forEach(item => {
            const type = item.getAttribute('data-type');
            item.classList.toggle('hidden', !(filter === 'all' || filter === type));
        });
    }

    document.addEventListener('click', (e) => {
        // Close mobile menu on nav link click
        const navLink = e.target.closest('.nav-list a');
        if (navLink && nav && nav.classList.contains('active')) {
            nav.classList.remove('active');
            setMenuIcon(false);
        }

        // Smooth scrolling for anchor links
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
            const targetId = anchor.getAttribute('href');
            if (targetId && targetId !== '#') {
                let targetElement = null;
                try { targetElement = document.querySelector(targetId); } catch (_) { targetElement = null; }
                if (targetElement) {
                    e.preventDefault();
                    const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        }

        // FAQ accordion
        const accHeader = e.target.closest('.accordion-header');
        if (accHeader) {
            const item = accHeader.parentElement;
            const isActive = item.classList.contains('active');
            $$('.accordion-item').forEach(accItem => {
                accItem.classList.remove('active');
                const body = $('.accordion-body', accItem);
                if (body) body.style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                const body = $('.accordion-body', item);
                if (body) body.style.maxHeight = body.scrollHeight + 'px';
            }
        }

        // Gallery tabs
        const tab = e.target.closest('.gallery-tab');
        if (tab) {
            $$('.gallery-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            applyGalleryFilter(tab.getAttribute('data-filter'));
        }

        // Gallery item / video review → lightbox
        const galleryItem = e.target.closest('.gallery-item');
        if (galleryItem) {
            openLightbox({
                youtube: galleryItem.getAttribute('data-youtube'),
                src: galleryItem.getAttribute('data-src'),
                title: galleryItem.getAttribute('data-title')
            });
        }
        const videoReview = e.target.closest('.video-placeholder[data-youtube]');
        if (videoReview) {
            openLightbox({
                youtube: videoReview.getAttribute('data-youtube'),
                title: videoReview.getAttribute('data-title')
            });
        }
    });

    const closeLightboxBtn = $('#closeLightbox');
    if (closeLightboxBtn && galleryLightbox) {
        closeLightboxBtn.addEventListener('click', closeGalleryModal);
        galleryLightbox.addEventListener('click', (e) => {
            if (e.target === galleryLightbox) closeGalleryModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeGalleryModal();
    });

    // =========================================================
    // Registration Form
    // =========================================================
    const registrationForm = $('#registrationForm');
    const formMessage = $('#formMessage');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = $('button[type="submit"]', registrationForm);
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ուղարկվում է...';
            btn.disabled = true;

            const name = $('#name').value;
            const phone = $('#phone').value;
            const direction = $('#course_direction')?.value || '';
            const format = $('input[name="format"]:checked').value;

            try {
                const res = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: name,
                        phone: phone,
                        course_direction: direction,
                        course_format: format === 'online' ? 'Օնլայն' : 'Օֆլայն',
                        status: 'Նոր',
                        source: 'Landing Page'
                    })
                });

                if (!res.ok) throw new Error('API Error');
                registrationForm.reset();
                formMessage.style.display = 'block';
                formMessage.style.color = '#10b981';
                formMessage.textContent = siteContent?.registration?.success_text || 'Շնորհակալություն, հայտը ընդունված է! Մենք շուտով կկապվենք Ձեզ հետ։';
            } catch (err) {
                formMessage.style.display = 'block';
                formMessage.style.color = '#ef4444';
                formMessage.textContent = 'Սխալ առաջացավ, փորձեք կրկին։';
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                setTimeout(() => { formMessage.style.display = 'none'; }, 5000);
            }
        });
    }

    // =========================================================
    // Callback Request Modal
    // =========================================================
    const callbackModal = $('#callbackModal');
    const closeCallbackBtn = $('#closeCallbackModal');
    const callbackForm = $('#callbackForm');
    const callbackMessage = $('#callbackMessage');

    $$('.open-callback-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbackModal) callbackModal.classList.add('active');
        });
    });

    if (closeCallbackBtn && callbackModal) {
        closeCallbackBtn.addEventListener('click', () => callbackModal.classList.remove('active'));
        callbackModal.addEventListener('click', (e) => {
            if (e.target === callbackModal) callbackModal.classList.remove('active');
        });
    }

    if (callbackForm) {
        callbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = $('button[type="submit"]', callbackForm);
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ուղարկվում է...';
            submitBtn.disabled = true;

            const name = $('#cb_name').value;
            const phone = $('#cb_phone').value;
            const preferredTime = $('#cb_time').value;

            try {
                const res = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: name,
                        phone: phone,
                        preferred_time: preferredTime || null,
                        urgent_notes: preferredTime ? `Պատվիրված զանգ (${preferredTime})` : 'Պատվիրված զանգ',
                        comment: preferredTime ? `Պատվիրել է հետզանգ։ Նախընտրելի ժամ՝ ${preferredTime}` : 'Պատվիրել է հետզանգ կայքից',
                        status: 'Նոր',
                        source: 'Callback Request'
                    })
                });

                if (!res.ok) throw new Error('API Error');
                callbackForm.reset();
                callbackMessage.style.display = 'block';
                callbackMessage.style.color = '#065f46';
                callbackMessage.textContent = siteContent?.callback?.success_text || 'Շնորհակալություն! Մենք շուտով կզանգահարենք Ձեզ։';
                setTimeout(() => {
                    callbackMessage.style.display = 'none';
                    callbackModal.classList.remove('active');
                }, 2500);
            } catch (err) {
                callbackMessage.style.display = 'block';
                callbackMessage.style.color = '#ef4444';
                callbackMessage.textContent = 'Սխալ առաջացավ, խնդրում ենք փորձել կրկին։';
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // =========================================================
    // Load content, then reveal the page
    // =========================================================
    const reveal = () => document.documentElement.classList.remove('cms-loading');
    const contentPromise = window.__siteContentPromise
        || fetch('/api/site-content', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    contentPromise
        .then((data) => {
            try { renderContent(data); } catch (err) { console.error('Site content render error:', err); }
        })
        .finally(reveal);

    // =========================================================
    // Vanta.js Three.js Animation for Hero
    // =========================================================
    if (typeof VANTA !== 'undefined') {
        VANTA.NET({
            el: "#hero",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xf25b18,
            backgroundColor: 0xffffff,
            points: 12.00,
            maxDistance: 20.00,
            spacing: 16.00
        });
    }
});
