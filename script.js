document.addEventListener('DOMContentLoaded', () => {
    // 1. Custom Retro Cursor
    const cursor = document.getElementById('cursor-retro');
    const hoverElements = document.querySelectorAll('a, button, input, select, textarea');
    
    // Only enable cursor logic if not on mobile/touch
    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursor.style.left = `${e.clientX}px`;
                cursor.style.top = `${e.clientY}px`;
            });
        });

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    }

    // 2. Preloader Elegant
    const preloader = document.getElementById('preloader-elegant');
    
    // Wait for the logo animation to finish, then fade out
    setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        
        setTimeout(() => {
            document.body.classList.remove('loading');
            
            // Trigger first reveals immediately after load
            document.querySelectorAll('#hero .reveal-up').forEach((el, index) => {
                setTimeout(() => el.classList.add('active'), index * 150);
            });
        }, 800);
    }, 2500);

    // 3. Reveal Animations on Scroll
    const revealElements = document.querySelectorAll('.reveal-up:not(#hero .reveal-up)');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));

    // 4. Header Scroll
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // 5. Mobile Navigation
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    navMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // 6. Form Submission Simulation
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = 'PROCESSING...';
        btn.disabled = true;

        setTimeout(() => {
            formStatus.textContent = 'DATA TRANSMITTED SUCCESSFULLY.';
            formStatus.className = 'form-status success';
            contactForm.reset();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            setTimeout(() => {
                formStatus.style.display = 'none';
                formStatus.className = 'form-status';
            }, 4000);
        }, 1200);
    });
});
