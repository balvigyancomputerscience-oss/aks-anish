// ============================================================
// AKS — admin.js
// Handles: login/logout, loading + saving site_settings,
// gallery CRUD, trips CRUD, and image uploads to Supabase Storage.
// ============================================================

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    initTabs();
    initImagePreview('hero_image_url');
    initImagePreview('about_image_url');

    document.getElementById('save-hero').addEventListener('click', () => saveSettings(['hero_title', 'hero_subtitle', 'hero_image_url'], 'Hero section saved!'));
    document.getElementById('save-about').addEventListener('click', () => saveSettings(['about_title', 'about_text', 'about_image_url'], 'About section saved!'));
    document.getElementById('save-contact').addEventListener('click', () => saveSettings(['contact_phone', 'contact_email', 'contact_address', 'contact_hours', 'footer_text'], 'Contact & footer saved!'));

    document.getElementById('add-gallery').addEventListener('click', addGalleryItem);
    document.getElementById('add-trip').addEventListener('click', addTripItem);
});

// ---------- Auth ----------
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btnText = document.getElementById('login-btn-text');
    const spinner = document.getElementById('login-spinner');

    errorEl.classList.add('hidden');
    btnText.textContent = 'Signing in...';
    spinner.classList.remove('hidden');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    btnText.textContent = 'Sign In';
    spinner.classList.add('hidden');

    if (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        return;
    }
    showDashboard();
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    showLogin();
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadSettingsIntoForm();
    loadGalleryList();
    loadTripsList();
}

// ---------- Tabs ----------
function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
        });
    });
}

function showToast(message) {
    const toast = document.getElementById('save-toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ---------- Site settings ----------
async function loadSettingsIntoForm() {
    const { data, error } = await supabaseClient.from('site_settings').select('*').eq('id', 1).single();
    if (error || !data) return;

    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input && input.tagName !== undefined) input.value = data[key] || '';
        const preview = document.getElementById(key + '-preview');
        if (preview && data[key]) {
            preview.src = data[key];
            preview.classList.remove('hidden');
        }
    });
}

async function saveSettings(fields, successMessage) {
    const update = {};
    fields.forEach(f => update[f] = document.getElementById(f).value);

    const { error } = await supabaseClient.from('site_settings').update(update).eq('id', 1);
    if (error) {
        alert('Error saving: ' + error.message);
        return;
    }
    showToast(successMessage);
}

// ---------- Image upload helper ----------
async function uploadImage(file) {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseClient.storage.from('aks-images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from('aks-images').getPublicUrl(fileName);
    return data.publicUrl;
}

function initImagePreview(fieldId) {
    const fileInput = document.getElementById(fieldId + '-file');
    if (!fileInput) return;
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const preview = document.getElementById(fieldId + '-preview');
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
        try {
            const url = await uploadImage(file);
            document.getElementById(fieldId).value = url;
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        }
    });
}

// ---------- Gallery ----------
async function loadGalleryList() {
    const list = document.getElementById('gallery-list');
    const { data, error } = await supabaseClient.from('gallery').select('*').order('sort_order', { ascending: true });
    if (error) { list.innerHTML = `<p class="text-red-500">${error.message}</p>`; return; }
    if (!data || data.length === 0) { list.innerHTML = `<p class="text-navy/50">No gallery items yet.</p>`; return; }

    list.innerHTML = data.map(item => `
        <div class="card overflow-hidden">
            <img src="${item.image_url}" class="w-full h-40 object-cover">
            <div class="p-4">
                <h3 class="font-bold">${escapeHtml(item.title)}</h3>
                <p class="text-sm text-navy/50 mb-3">${escapeHtml(item.subtitle || '')}</p>
                <button class="btn-danger text-sm px-4 py-2 rounded-lg w-full" onclick="deleteGalleryItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function addGalleryItem() {
    const title = document.getElementById('gallery-title').value.trim();
    const subtitle = document.getElementById('gallery-subtitle').value.trim();
    const file = document.getElementById('gallery-file').files[0];
    const spinner = document.getElementById('gallery-add-spinner');

    if (!title || !file) { alert('Title and photo are required.'); return; }

    spinner.classList.remove('hidden');
    try {
        const imageUrl = await uploadImage(file);
        const { error } = await supabaseClient.from('gallery').insert({ title, subtitle, image_url: imageUrl, sort_order: 999 });
        if (error) throw error;
        document.getElementById('gallery-title').value = '';
        document.getElementById('gallery-subtitle').value = '';
        document.getElementById('gallery-file').value = '';
        loadGalleryList();
        showToast('Gallery photo added!');
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        spinner.classList.add('hidden');
    }
}

async function deleteGalleryItem(id) {
    if (!confirm('Delete this gallery photo?')) return;
    const { error } = await supabaseClient.from('gallery').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    loadGalleryList();
}

// ---------- Trips ----------
async function loadTripsList() {
    const list = document.getElementById('trips-list');
    const { data, error } = await supabaseClient.from('trips').select('*').order('sort_order', { ascending: true });
    if (error) { list.innerHTML = `<p class="text-red-500">${error.message}</p>`; return; }
    if (!data || data.length === 0) { list.innerHTML = `<p class="text-navy/50">No trips yet.</p>`; return; }

    list.innerHTML = data.map(trip => `
        <div class="card overflow-hidden">
            <img src="${trip.image_url}" class="w-full h-40 object-cover">
            <div class="p-4">
                <span class="text-teal text-xs font-bold">${escapeHtml(trip.category || '')}</span>
                <h3 class="font-bold">${escapeHtml(trip.title)}</h3>
                <p class="text-sm text-navy/50 mb-2">${escapeHtml(trip.description || '')}</p>
                <p class="font-bold mb-3">${escapeHtml(trip.price || '')}</p>
                <button class="bg-navy text-white text-sm px-4 py-2 rounded-lg w-full mb-2" onclick="togglePhotoManager('${trip.id}')">
                    <i class="fa-solid fa-images mr-1"></i> Manage Gallery Photos
                </button>
                <button class="btn-danger text-sm px-4 py-2 rounded-lg w-full" onclick="deleteTripItem('${trip.id}')">Delete Trip</button>

                <div id="photo-manager-${trip.id}" class="hidden mt-4 pt-4 border-t border-navy/10">
                    <div id="photo-thumbs-${trip.id}" class="grid grid-cols-3 gap-2 mb-3"></div>
                    <input type="file" id="photo-file-${trip.id}" accept="image/*" multiple class="w-full text-xs mb-2">
                    <button class="btn-primary text-sm px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2" onclick="uploadTripPhotos('${trip.id}')">
                        <span>Add Photos to Gallery</span><span id="photo-spinner-${trip.id}" class="spinner hidden"></span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ---------- Per-trip photo gallery management ----------
async function togglePhotoManager(tripId) {
    const panel = document.getElementById('photo-manager-' + tripId);
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        loadTripPhotos(tripId);
    }
}

async function loadTripPhotos(tripId) {
    const thumbs = document.getElementById('photo-thumbs-' + tripId);
    thumbs.innerHTML = `<p class="col-span-3 text-xs text-navy/40">Loading...</p>`;
    const { data, error } = await supabaseClient
        .from('trip_images')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order', { ascending: true });

    if (error) { thumbs.innerHTML = `<p class="col-span-3 text-xs text-red-500">${error.message}</p>`; return; }
    if (!data || data.length === 0) { thumbs.innerHTML = `<p class="col-span-3 text-xs text-navy/40">No gallery photos yet.</p>`; return; }

    thumbs.innerHTML = data.map(img => `
        <div class="relative group">
            <img src="${img.image_url}" class="w-full h-16 object-cover rounded">
            <button onclick="deleteTripImage('${img.id}', '${tripId}')" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
}

async function uploadTripPhotos(tripId) {
    const fileInput = document.getElementById('photo-file-' + tripId);
    const spinner = document.getElementById('photo-spinner-' + tripId);
    const files = Array.from(fileInput.files);
    if (files.length === 0) { alert('Select at least one photo first.'); return; }

    spinner.classList.remove('hidden');
    try {
        for (const file of files) {
            const imageUrl = await uploadImage(file);
            const { error } = await supabaseClient.from('trip_images').insert({ trip_id: tripId, image_url: imageUrl, sort_order: 999 });
            if (error) throw error;
        }
        fileInput.value = '';
        loadTripPhotos(tripId);
        showToast('Gallery photos added!');
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        spinner.classList.add('hidden');
    }
}

async function deleteTripImage(imageId, tripId) {
    if (!confirm('Remove this photo from the gallery?')) return;
    const { error } = await supabaseClient.from('trip_images').delete().eq('id', imageId);
    if (error) { alert(error.message); return; }
    loadTripPhotos(tripId);
}

async function addTripItem() {
    const category = document.getElementById('trip-category').value.trim();
    const title = document.getElementById('trip-title').value.trim();
    const description = document.getElementById('trip-description').value.trim();
    const price = document.getElementById('trip-price').value.trim();
    const file = document.getElementById('trip-file').files[0];
    const spinner = document.getElementById('trip-add-spinner');

    if (!title || !file) { alert('Trip title and photo are required.'); return; }

    spinner.classList.remove('hidden');
    try {
        const imageUrl = await uploadImage(file);
        const { error } = await supabaseClient.from('trips').insert({ category, title, description, price, image_url: imageUrl, sort_order: 999 });
        if (error) throw error;
        document.getElementById('trip-category').value = '';
        document.getElementById('trip-title').value = '';
        document.getElementById('trip-description').value = '';
        document.getElementById('trip-price').value = '';
        document.getElementById('trip-file').value = '';
        loadTripsList();
        showToast('Trip added!');
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        spinner.classList.add('hidden');
    }
}

async function deleteTripItem(id) {
    if (!confirm('Delete this trip?')) return;
    const { error } = await supabaseClient.from('trips').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    loadTripsList();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
