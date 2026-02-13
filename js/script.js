// DOM Elements
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelectorAll('.nav-menu a');
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.nav-menu');
const counters = document.querySelectorAll('.stat-number');
const filterButtons = document.querySelectorAll('.filter-btn');
const galleryGrid = document.getElementById('galleryGrid');
const galleryLoadMoreBtn = document.getElementById('galleryLoadMore');
const bookingForm = document.getElementById('bookingForm');
const whatsappBtn = document.querySelector('.whatsapp-btn');
const scrollTopBtn = document.querySelector('.scroll-top');

const GALLERY_PAGE_SIZE = 20;
const GALLERY_LOAD_STEP = 12;

const galleryCategoryLabels = {
    balloon: 'Balloon',
    'bridal-garland': 'Bridal Garland',
    'bridal-jada': 'Bridal Jada',
    'bridal-groom-making-ceremonies': 'Bridal & Groom Ceremonies',
    'door-decoration': 'Door Decoration',
    haldi: 'Haldi',
    mandaps: 'Mandaps',
    'reception-stages': 'Reception Stages'
};

let galleryItemsData = [];
let activeGalleryFilter = 'all';
let visibleGalleryCount = GALLERY_PAGE_SIZE;

const escapeHtml = (value = '') => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Sticky Navigation
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Update active navigation link
    const sections = document.querySelectorAll('section');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });

    if (scrollTopBtn) {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    }
});

// Mobile Menu Toggle
if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Animated Counters
const animateCounter = (counter) => {
    const target = parseInt(counter.getAttribute('data-target'), 10);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += step;
        if (current < target) {
            counter.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            counter.textContent = target;
        }
    };

    updateCounter();
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => {
    counterObserver.observe(counter);
});

// Scroll Animations
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, { threshold: 0.1 });

const observeRevealElement = (element) => {
    if (!element) {
        return;
    }
    scrollObserver.observe(element);
};

// Add animation classes to static elements
const staticRevealElements = document.querySelectorAll(
    '.service-card, .testimonial-card, .testimonial-item, .service-detail, .about-text, .contact-form, .stat-item, section h2'
);

staticRevealElements.forEach(el => {
    el.classList.add('fade-in');
    observeRevealElement(el);
});

const aboutImage = document.querySelector('.about-image');
if (aboutImage) {
    aboutImage.classList.add('slide-in-right');
    observeRevealElement(aboutImage);
}

const contactInfo = document.querySelector('.contact-info');
if (contactInfo) {
    contactInfo.classList.add('slide-in-left');
    observeRevealElement(contactInfo);
}

document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach((el, index) => {
    const delay = Math.min(index * 0.08, 0.6);
    el.style.transitionDelay = `${delay}s`;
});

// Dynamic Gallery Rendering + Filters + See More
const getFilteredGalleryItems = () => {
    if (activeGalleryFilter === 'all') {
        return galleryItemsData;
    }
    return galleryItemsData.filter(item => item.category === activeGalleryFilter);
};

const renderGallery = () => {
    if (!galleryGrid) {
        return;
    }

    const filteredItems = getFilteredGalleryItems();
    const visibleItems = filteredItems.slice(0, visibleGalleryCount);

    if (visibleItems.length === 0) {
        galleryGrid.innerHTML = '<p class="gallery-empty">No images available in this category.</p>';
    } else {
        galleryGrid.innerHTML = visibleItems.map((item) => {
            const safeAlt = escapeHtml(item.alt || 'Event decor image');
            const title = escapeHtml(galleryCategoryLabels[item.category] || 'Event Decor');

            return `
                <div class="gallery-item ${item.category}" data-gallery-src="${item.src}" data-gallery-alt="${safeAlt}">
                    <img src="${item.src}" alt="${safeAlt}" loading="lazy">
                    <div class="gallery-overlay">
                        <h4>${title}</h4>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (galleryLoadMoreBtn) {
        const hasMore = filteredItems.length > visibleGalleryCount;
        galleryLoadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
    }

    const renderedItems = galleryGrid.querySelectorAll('.gallery-item');
    renderedItems.forEach((item, index) => {
        item.classList.add('fade-in');
        item.style.transitionDelay = `${Math.min(index * 0.05, 0.5)}s`;
        observeRevealElement(item);
    });
};

const loadGalleryImages = async () => {
    if (!galleryGrid) {
        return;
    }

    try {
        const response = await fetch('/api/gallery-images');
        const payload = await response.json();

        if (!response.ok || !payload.items || !Array.isArray(payload.items)) {
            throw new Error('Failed to load gallery images.');
        }

        galleryItemsData = payload.items;
        renderGallery();
    } catch (error) {
        galleryGrid.innerHTML = '<p class="gallery-empty">Unable to load images right now.</p>';
        if (galleryLoadMoreBtn) {
            galleryLoadMoreBtn.style.display = 'none';
        }
    }
};

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        activeGalleryFilter = button.getAttribute('data-filter') || 'all';
        visibleGalleryCount = GALLERY_PAGE_SIZE;
        renderGallery();
    });
});

if (galleryLoadMoreBtn) {
    galleryLoadMoreBtn.addEventListener('click', () => {
        visibleGalleryCount += GALLERY_LOAD_STEP;
        renderGallery();
    });
}

// Form Validation and Submission
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const eventType = document.getElementById('eventType').value;
        const eventDate = document.getElementById('eventDate').value;
        const message = document.getElementById('message').value.trim();

        if (!name || !phone || !email || !eventType || !eventDate) {
            alert('Please fill in all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid phone number.');
            return;
        }

        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        fetch('/send-inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, eventType, eventDate, message })
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.ok) {
                    const errorMsg = data.error || 'Unable to send your inquiry right now.';
                    throw new Error(errorMsg);
                }
                alert('Thank you for your inquiry! We will contact you within 24 hours.');
                bookingForm.reset();
            })
            .catch((err) => {
                alert(err.message || 'Unable to send your inquiry right now.');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
    });
}

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// WhatsApp Button Animation
if (whatsappBtn) {
    whatsappBtn.addEventListener('mouseenter', () => {
        whatsappBtn.style.transform = 'scale(1.1) rotate(5deg)';
    });

    whatsappBtn.addEventListener('mouseleave', () => {
        whatsappBtn.style.transform = 'scale(1) rotate(0deg)';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');

    const homeSection = document.getElementById('home');
    if (homeSection && window.scrollY < 100) {
        const homeLink = document.querySelector('a[href="#home"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
    }

    loadGalleryImages();
});

// Gallery Lightbox (Event Delegation)
const openLightbox = (src, alt) => {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <img src="${src}" alt="${escapeHtml(alt)}">
            <span class="lightbox-close">&times;</span>
        </div>
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
            lightbox.remove();
        }
    });
};

if (galleryGrid) {
    galleryGrid.addEventListener('click', (event) => {
        const item = event.target.closest('.gallery-item');
        if (!item) {
            return;
        }

        const src = item.getAttribute('data-gallery-src');
        const alt = item.getAttribute('data-gallery-alt') || 'Event decor image';

        if (src) {
            openLightbox(src, alt);
        }
    });
}

// Add lightbox styles dynamically
const lightboxStyles = `
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    }
    .lightbox-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }
    .lightbox-content img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
    .lightbox-close {
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 40px;
        cursor: pointer;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = lightboxStyles;
document.head.appendChild(styleSheet);
