document.addEventListener('DOMContentLoaded', () => {
    // 1. (Custom Cursor Removed)

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

    // 6. Form Submission (Web3Forms)
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'PROCESSING...';
            btn.disabled = true;

            const formData = new FormData(contactForm);

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    formStatus.textContent = 'DATA TRANSMITTED SUCCESSFULLY.';
                    formStatus.className = 'form-status success';
                    contactForm.reset();
                } else {
                    formStatus.textContent = 'SYSTEM ERROR. TRY AGAIN.';
                    formStatus.className = 'form-status error';
                    console.error('Web3Forms Error:', data);
                }
            } catch (error) {
                formStatus.textContent = 'CONNECTION ERROR.';
                formStatus.className = 'form-status error';
                console.error('Fetch Error:', error);
            }

            btn.innerHTML = originalText;
            btn.disabled = false;
            
            setTimeout(() => {
                formStatus.style.display = 'none';
                formStatus.className = 'form-status';
                setTimeout(() => { formStatus.style.display = ''; formStatus.textContent = ''; }, 50);
            }, 4000);
        });
    }

    // 7. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-answer').style.maxHeight = null;
            });
            
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});
