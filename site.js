// ============================================================
// AKS — site.js
// Fetches hero / about / contact / gallery / trips from Supabase
// and renders them. Falls back to the static HTML already in the
// page if Supabase isn't reachable, so the site never looks broken.
// ============================================================

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
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center text-navy/50">Gallery coming soon.</p>`;
            return;
        }

        grid.innerHTML = data.map(item => `
            <div class="gallery-item relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group">
                <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="gallery-img w-full h-80 object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/10 to-transparent">
                    <div class="absolute bottom-6 left-6 right-6 text-white">
                        <h3 class="text-2xl font-bold mb-1 font-serif">${escapeHtml(item.title)}</h3>
                        ${item.subtitle ? `<p class="text-white/80">${escapeHtml(item.subtitle)}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
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
                        <div class="flex items-center gap-2">
                            <button class="trip-open-gallery bg-white border-2 border-teal text-teal text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-teal hover:text-white transition" data-trip-id="${trip.id}" data-trip-title="${escapeHtml(trip.title)}" data-trip-category="${escapeHtml(trip.category || '')}">
                                <i class="fa-solid fa-images mr-1"></i> View Gallery
                            </button>
                            <a href="#contact" class="bg-amber text-navy p-3 rounded-full hover:bg-navy hover:text-white transition">
                                <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.trip-open-gallery').forEach(el => {
            el.addEventListener('click', () => {
                openTripModal(el.dataset.tripId, el.dataset.tripTitle, el.dataset.tripCategory);
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
// Trip Gallery Modal — shows every photo for one specific trip
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

async function openTripModal(tripId, title, category) {
    const modal = document.getElementById('trip-modal');
    const grid = document.getElementById('trip-modal-grid');
    document.getElementById('trip-modal-title').textContent = title || '';
    document.getElementById('trip-modal-category').textContent = category || '';
    grid.innerHTML = `<div class="col-span-full text-center text-white/60 py-10">Loading photos...</div>`;
    modal.classList.remove('hidden');

    try {
        const { data, error } = await supabaseClient
            .from('trip_images')
            .select('*')
            .eq('trip_id', tripId)
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-white/60 py-10">No extra photos added for this trip yet.</div>`;
            return;
        }

        grid.innerHTML = data.map((img, i) => `
            <div class="trip-modal-photo rounded-xl overflow-hidden cursor-pointer shadow-lg ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}" data-url="${escapeHtml(img.image_url)}">
                <img src="${escapeHtml(img.image_url)}" class="w-full h-full object-cover hover:scale-105 transition duration-500" style="min-height:160px;">
            </div>
        `).join('');

        grid.querySelectorAll('.trip-modal-photo').forEach(el => {
            el.addEventListener('click', () => openLightbox(el.dataset.url));
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
    if (!lightbox) return;

    const close = () => {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
    };
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}

function openLightbox(url) {
    const lightbox = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = url;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
}
