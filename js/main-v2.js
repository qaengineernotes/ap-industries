/**
 * A.P INDUSTRIES - Main JavaScript V2
 * Tailored for the Split-Layout and Dynamic Flex Cards.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sticky Header Logic ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            header.style.padding = '15px 0';
        } else {
            header.style.boxShadow = 'none';
            header.style.padding = '25px 0';
        }
    });

    // --- Category Card Interactions ---
    // The hover is CSS managed but we can add tap support for tablets
    const catBoxes = document.querySelectorAll('.cat-box');
    catBoxes.forEach(box => {
        box.addEventListener('touchstart', function() {
            catBoxes.forEach(b => b.style.flex = "1");
            this.style.flex = "2";
        });
    });

    // --- Intersection Observer for Fade-Ins ---
    const observerOptions = {
        threshold: 0.15
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, observerOptions);
    
    // Elements to reveal
    const targetElements = document.querySelectorAll('.feature-item, .cat-box, .about-content-v2, .about-image-v2');
    
    targetElements.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
        el.style.transition = "all 0.8s cubic-bezier(0.23, 1, 0.32, 1)";
        revealObserver.observe(el);
    });

    // Helper class for revealed state (added via JS to keep CSS clean)
    const style = document.createElement('style');
    style.innerHTML = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);
});
