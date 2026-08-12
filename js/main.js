/**
 * A.P INDUSTRIES - Main JavaScript
 * Handles interactivity, mobile navigation, and scroll animations.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Logic ---
    const mobileToggle = document.getElementById('mobile-menu-open');
    const mobileClose = document.getElementById('mobile-menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.mobile-menu ul li a');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
    };

    mobileToggle.addEventListener('click', toggleMenu);
    mobileClose.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // --- Sticky Header Effect ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '5px 0';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.padding = '15px 0';
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    });

    // --- Scroll Reveal Animations ---
    // Using Intersection Observer for premium entry effects
    const revealElements = document.querySelectorAll('.feature-card, .product-card, .about-content, .about-image');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        // Initial state for JS-driven reveal
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        revealOnScroll.observe(el);
    });

    // --- Form Submissions with Resend.com API ---
    const inquiryForms = document.querySelectorAll('#message-form, .category-inquiry-form, .newsletter-form');

    inquiryForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get submit button
            const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

            // Ensure response banner container exists
            let banner = form.querySelector('.form-response-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.className = 'form-response-banner';
                form.insertBefore(banner, form.firstChild);
            }

            // Reset banner state
            banner.className = 'form-response-banner';
            banner.style.display = 'none';
            banner.textContent = '';

            // Extract input values safely
            const getValue = (selector) => {
                const el = form.querySelector(selector);
                return el ? el.value.trim() : '';
            };

            const name = getValue('#contact-name') || getValue('#name') || getValue('input[placeholder*="Name"]');
            const company = getValue('#contact-company') || getValue('#company') || getValue('input[placeholder*="Company"]');
            const email = getValue('#contact-email') || getValue('#email') || getValue('input[type="email"]');
            const phone = getValue('#contact-phone') || getValue('#phone') || getValue('input[type="tel"]');

            const subjectSelect = form.querySelector('#contact-subject');
            let subject = '';
            if (subjectSelect) {
                if (subjectSelect.tagName === 'SELECT' && subjectSelect.options && subjectSelect.selectedIndex >= 0) {
                    subject = subjectSelect.options[subjectSelect.selectedIndex].text;
                } else if (subjectSelect.value) {
                    subject = subjectSelect.value.trim();
                }
            }
            if (!subject || subject.includes('Select Subject')) {
                subject = document.title.split('-')[0].trim() || 'General Inquiry';
            }

            const message = getValue('#contact-message') || getValue('#message') || getValue('textarea') || 'Newsletter subscription request.';

            const showBanner = (isSuccess, htmlContent) => {
                banner.className = 'form-response-banner show ' + (isSuccess ? 'success' : 'error');
                banner.innerHTML = htmlContent;
                banner.style.display = 'block';
                banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };

            // Client-side quick check
            if (!name || !phone) {
                showBanner(false, 'Please fill out your Name and Phone Number before submitting.');
                return;
            }

            // Set loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('btn-loading');
                submitBtn.innerHTML = '<span class="btn-text">Sending...</span>';
            }

            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        company,
                        email,
                        phone,
                        subject,
                        message,
                        page: window.location.pathname || document.title
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    let bannerHtml = '<strong>Success!</strong> Your inquiry has been sent to our team at <strong>info.apindustries14@gmail.com</strong>.';
                    if (email) {
                        if (result.clientEmailSent) {
                            bannerHtml += ' A confirmation email has also been sent to <strong>' + email + '</strong>.';
                        } else {
                            bannerHtml += '<br><span style="font-size: 0.9em; opacity: 0.9;">(Note: Confirmation email to <strong>' + email + '</strong> failed. ' + 
                                (result.clientEmailWarning ? 'Resend API message: ' + result.clientEmailWarning : 'Please check domain verification in Resend') + ')</span>';
                        }
                    }
                    showBanner(true, bannerHtml);
                    form.reset();
                } else {
                    showBanner(false, '<strong>Unable to send:</strong> ' + (result.error || 'Please try again later or contact us directly at info.apindustries14@gmail.com.'));
                }
            } catch (err) {
                console.error('Submission Error:', err);
                showBanner(false, '<strong>Network Error:</strong> Unable to connect to the email server. Please try again or email us directly at <a href="mailto:info.apindustries14@gmail.com">info.apindustries14@gmail.com</a>.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('btn-loading');
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    });

    // --- Smooth Anchor Navigation ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Dynamic Copyright Year ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
