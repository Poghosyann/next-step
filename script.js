document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Toggle ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-list a');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    });

    // --- Header Scroll Effect ---
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = 'var(--shadow-md)';
            header.style.padding = '0';
        } else {
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    });

    // --- FAQ Accordion ---
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-item').forEach(accItem => {
                accItem.classList.remove('active');
                accItem.querySelector('.accordion-body').style.maxHeight = null;
            });

            // Open clicked item if it wasn't already open
            if (!isActive) {
                item.classList.add('active');
                const body = item.querySelector('.accordion-body');
                body.style.maxHeight = body.scrollHeight + "px";
            }
        });
    });

    // --- Form Submission Simulation ---
    const registrationForm = document.getElementById('registrationForm');
    const formMessage = document.getElementById('formMessage');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = registrationForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ուղարկվում է...';
            btn.disabled = true;

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const direction = document.getElementById('course_direction')?.value || 'Ֆինանսական հաշվառում';
            const format = document.querySelector('input[name="format"]:checked').value;

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

                if (res.ok) {
                    registrationForm.reset();
                    formMessage.style.display = 'block';
                    formMessage.style.color = '#10b981';
                    formMessage.textContent = 'Շնորհակալություն, հայտը ընդունված է! Մենք շուտով կկապվենք Ձեզ հետ։';
                } else {
                    throw new Error('API Error');
                }
            } catch (err) {
                formMessage.style.display = 'block';
                formMessage.style.color = '#ef4444';
                formMessage.textContent = 'Սխալ առաջացավ, փորձեք կրկին։';
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }
        });
    }

    // --- Smooth Scrolling for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Callback Request Modal ---
    const callbackModal = document.getElementById('callbackModal');
    const openCallbackBtns = document.querySelectorAll('.open-callback-modal');
    const closeCallbackBtn = document.getElementById('closeCallbackModal');
    const callbackForm = document.getElementById('callbackForm');
    const callbackMessage = document.getElementById('callbackMessage');

    openCallbackBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (callbackModal) callbackModal.classList.add('active');
        });
    });

    if (closeCallbackBtn && callbackModal) {
        closeCallbackBtn.addEventListener('click', () => {
            callbackModal.classList.remove('active');
        });
        callbackModal.addEventListener('click', (e) => {
            if (e.target === callbackModal) callbackModal.classList.remove('active');
        });
    }

    if (callbackForm) {
        callbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = callbackForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ուղարկվում է...';
            submitBtn.disabled = true;

            const name = document.getElementById('cb_name').value;
            const phone = document.getElementById('cb_phone').value;
            const preferredTime = document.getElementById('cb_time').value;

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

                if (res.ok) {
                    callbackForm.reset();
                    callbackMessage.style.display = 'block';
                    callbackMessage.style.color = '#065f46';
                    callbackMessage.textContent = 'Շնորհակալություն! Մենք շուտով կզանգահարենք Ձեզ։';
                    setTimeout(() => {
                        callbackMessage.style.display = 'none';
                        callbackModal.classList.remove('active');
                    }, 2500);
                } else {
                    throw new Error('API Error');
                }
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

    // --- Media Gallery Tabs & Lightbox ---
    const galleryTabs = document.querySelectorAll('.gallery-tab');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryLightbox = document.getElementById('galleryLightbox');
    const closeLightbox = document.getElementById('closeLightbox');
    const lightboxMediaContainer = document.getElementById('lightboxMediaContainer');
    const lightboxCaption = document.getElementById('lightboxCaption');

    galleryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            galleryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const type = item.getAttribute('data-type');
                if (filter === 'all' || filter === type) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            if (!galleryLightbox || !lightboxMediaContainer) return;
            const type = item.getAttribute('data-type');
            const src = item.getAttribute('data-src');
            const title = item.getAttribute('data-title') || '';

            lightboxMediaContainer.innerHTML = '';
            if (type === 'video') {
                const video = document.createElement('video');
                video.src = src;
                video.controls = true;
                video.autoplay = true;
                lightboxMediaContainer.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = src;
                img.alt = title;
                lightboxMediaContainer.appendChild(img);
            }
            if (lightboxCaption) lightboxCaption.textContent = title;
            galleryLightbox.classList.add('active');
        });
    });

    const closeGalleryModal = () => {
        if (!galleryLightbox) return;
        galleryLightbox.classList.remove('active');
        if (lightboxMediaContainer) lightboxMediaContainer.innerHTML = '';
    };

    if (closeLightbox && galleryLightbox) {
        closeLightbox.addEventListener('click', closeGalleryModal);
        galleryLightbox.addEventListener('click', (e) => {
            if (e.target === galleryLightbox) closeGalleryModal();
        });
    }

    // --- Vanta.js Three.js Animation for Hero ---
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
