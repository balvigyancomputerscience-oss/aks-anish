// ============================================================
// AKS — site.js
// Fetches hero / about / contact / gallery / trips from Supabase
// and renders them. Falls back to the static HTML already in the
// page if Supabase isn't reachable, so the site never looks broken.
// ============================================================

let currentLightboxImages = [];
let currentLightboxIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initContactForm();
    initScrollAnimations();
    initTripModal();
    initLightbox();
    loadSiteSettings();
    loadGallery();
    loadTrips();
});

// ---------- Mobile menu ----------
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => menu.classList.toggle('hidden'));

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            menu.classList.add('hidden');
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ---------- Contact form (visual only — no backend table for enquiries yet) ----------
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = this.querySelector('button');
        const original = btn.textContent;
        btn.textContent = 'Sending your enquiry...';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = 'Enquiry Sent Successfully!';
            btn.classList.add('!bg-teal', '!text-white');
            this.reset();
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove('!bg-teal', '!text-white');
                btn.disabled = false;
            }, 3000);
        }, 1200);
    });
}

// ---------- Scroll reveal ----------
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'all .8s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '1';
    });
}

// ---------- Site settings (hero / about / contact / footer) ----------
async function loadSiteSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('site_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error || !data) return;

        setText('hero-title', data.hero_title);
        setText('hero-subtitle', data.hero_subtitle);
        setImg('hero-image', data.hero_image_url);

        setText('about-title', data.about_title);
        setText('about-text', data.about_text);
        setImg('about-image', data.about_image_url);

        setText('contact-phone', data.contact_phone);
        setText('contact-email', data.contact_email);
        setText('contact-address', data.contact_address);
        setText('contact-hours', data.contact_hours);

        setText('footer-text', data.footer_text);
        setText('footer-phone', data.contact_phone);
        setText('footer-email', data.contact_email);
        setText('footer-address', data.contact_address);
    } catch (err) {
        console.warn('Could not load site settings from Supabase, using defaults.', err);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
}
function setImg(id, url) {
    const el = document.getElementById(id);
    if (el && url) el.src = url;
}

// ---------- Gallery ----------
async function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    try {
        const limitAttr = grid.dataset.limit;
        let query = supabaseClient
            .from('gallery')
            .select('*')
            .order('sort_order', { ascending: true });

        if (limitAttr) {
            query = query.limit(parseInt(limitAttr, 10));
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center text-navy/50">Gallery coming soon.</p>`;
            return;
        }

        grid.innerHTML = data.map(item => `
            <div class="gallery-item relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group" data-gallery-id="${item.id}" data-gallery-title="${escapeHtml(item.title)}" data-gallery-subtitle="${escapeHtml(item.subtitle || '')}">
                <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="gallery-img w-full h-80 object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/10 to-transparent">
                    <div class="absolute bottom-6 left-6 right-6 text-white">
                        <h3 class="text-2xl font-bold mb-1 font-serif">${escapeHtml(item.title)}</h3>
                        ${item.subtitle ? `<p class="text-white/80">${escapeHtml(item.subtitle)}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.gallery-item').forEach(el => {
            el.addEventListener('click', () => {
                openAlbumModal('gallery_images', 'gallery_id', el.dataset.galleryId, el.dataset.galleryTitle, el.dataset.gallerySubtitle);
            });
        });
    } catch (err) {
        console.warn('Could not load gallery from Supabase.', err);
        grid.innerHTML = `<p class="col-span-full text-center text-navy/50">Gallery coming soon.</p>`;
    }
}

// ---------- Upcoming Trips ----------
async function loadTrips() {
    const grid = document.getElementById('trips-grid');
    if (!grid) return;
    try {
        const { data, error } = await supabaseClient
            .from('trips')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center text-navy/50">New trips coming soon.</p>`;
            return;
        }

        grid.innerHTML = data.map(trip => `
            <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300">
                <div class="relative cursor-pointer trip-open-gallery" data-trip-id="${trip.id}" data-trip-title="${escapeHtml(trip.title)}" data-trip-category="${escapeHtml(trip.category || '')}">
                    <img src="${escapeHtml(trip.image_url)}" alt="${escapeHtml(trip.title)}" class="w-full h-64 object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/5 to-transparent">
                        <div class="absolute bottom-4 left-5 right-5 text-white">
                            ${trip.category ? `<span class="text-amber text-xs font-bold tracking-widest">${escapeHtml(trip.category)}</span>` : ''}
                            <h3 class="text-xl font-bold font-serif leading-tight">${escapeHtml(trip.title)}</h3>
                        </div>
                    </div>
                </div>
                <div class="p-8">
                    ${trip.description ? `<p class="text-navy/60 mb-4">${escapeHtml(trip.description)}</p>` : ''}
                    <div class="flex justify-between items-center gap-3">
                        <span class="text-navy font-bold text-lg">${escapeHtml(trip.price || '')}</span>
                        <a href="#contact" class="bg-amber text-navy text-sm font-bold px-6 py-2.5 rounded-full hover:bg-navy hover:text-white transition flex items-center gap-2 whitespace-nowrap">
                            Book Now <i class="fa-solid fa-arrow-right text-xs"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.trip-open-gallery').forEach(el => {
            el.addEventListener('click', () => {
                openAlbumModal('trip_images', 'trip_id', el.dataset.tripId, el.dataset.tripTitle, el.dataset.tripCategory);
            });
        });
    } catch (err) {
        console.warn('Could not load trips from Supabase.', err);
        grid.innerHTML = `<p class="col-span-full text-center text-navy/50">New trips coming soon.</p>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Album Modal — shows every photo for one specific trip OR gallery card
// ============================================================
function initTripModal() {
    const modal = document.getElementById('trip-modal');
    const backdrop = document.getElementById('trip-modal-backdrop');
    const closeBtn = document.getElementById('trip-modal-close');
    if (!modal) return;

    const close = () => modal.classList.add('hidden');
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}

async function openAlbumModal(table, foreignKey, id, title, subtitle) {
    const modal = document.getElementById('trip-modal');
    const grid = document.getElementById('trip-modal-grid');
    document.getElementById('trip-modal-title').textContent = title || '';
    document.getElementById('trip-modal-category').textContent = subtitle || '';
    grid.innerHTML = `<div class="col-span-full text-center text-white/60 py-10">Loading photos...</div>`;
    modal.classList.remove('hidden');

    try {
        const { data, error } = await supabaseClient
            .from(table)
            .select('*')
            .eq(foreignKey, id)
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            currentLightboxImages = [];
            grid.innerHTML = `<div class="col-span-full text-center text-white/60 py-10">No extra photos added yet.</div>`;
            return;
        }

        currentLightboxImages = data.map(img => img.image_url);

        grid.innerHTML = data.map((img, i) => `
            <div class="trip-modal-photo rounded-xl overflow-hidden cursor-pointer shadow-lg ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}" data-index="${i}">
                <img src="${escapeHtml(img.image_url)}" class="w-full h-full object-cover hover:scale-105 transition duration-500" style="min-height:160px;">
            </div>
        `).join('');

        grid.querySelectorAll('.trip-modal-photo').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index, 10);
                openLightbox(idx);
            });
        });
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-center text-white/60 py-10">Couldn't load photos right now.</div>`;
        console.warn(err);
    }
}

// ============================================================
// Lightbox — enlarges a single photo from the trip gallery
// ============================================================
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const backdrop = document.getElementById('lightbox-backdrop');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    if (!lightbox) return;

    const close = () => {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
    };

    const showPrev = (e) => {
        if (e) e.stopPropagation();
        if (currentLightboxImages.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
        document.getElementById('lightbox-img').src = currentLightboxImages[currentLightboxIndex];
    };

    const showNext = (e) => {
        if (e) e.stopPropagation();
        if (currentLightboxImages.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
        document.getElementById('lightbox-img').src = currentLightboxImages[currentLightboxIndex];
    };

    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', showPrev);
    if (nextBtn) nextBtn.addEventListener('click', showNext);

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });

    // Touch Swipe Navigation for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50; // minimum pixels to count as swipe
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe Left -> Next Image
            showNext();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe Right -> Previous Image
            showPrev();
        }
    }, { passive: true });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    currentLightboxIndex = index;
    document.getElementById('lightbox-img').src = currentLightboxImages[currentLightboxIndex];
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    
    updateLightboxArrows();
}

function updateLightboxArrows() {
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    if (!prevBtn || !nextBtn) return;
    if (currentLightboxImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = '';
        nextBtn.style.display = '';
    }
}
