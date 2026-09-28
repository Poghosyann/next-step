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
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulate sending data
            const btn = registrationForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ուղարկվում է...';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                registrationForm.reset();
                formMessage.style.display = 'block';
                
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }, 1500);
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
