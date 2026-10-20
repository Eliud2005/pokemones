// ============================================
// Renderizar cards (espera a que pokemons.js cargue la API)
// ============================================
async function renderCards() {
    const container = document.querySelector('.grid-cards');
    if (!container) return;

    // Mostrar estado de carga
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Cargando Pokémon...</p>';

    // Esperar a que la API cargue (definida en pokemons.js)
    if (typeof window.loadPokemons === 'function') {
        await window.loadPokemons();
    }

    let htmlContent = '';

    pokemons.forEach((pokemon) => {
        htmlContent += `
            <div class="card">
                <img src="${pokemon.image}" alt="${pokemon.title}" loading="lazy">
                <div class="card-content">
                    <h3>${pokemon.title}</h3>
                    <p>${pokemon.description}</p>
                    <a class="btn-more" href="detalle.html?id=${pokemon.id}">Ver más</a>
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlContent || '<p style="grid-column: 1/-1; text-align: center;">No se pudieron cargar los Pokémon.</p>';
}

document.addEventListener('DOMContentLoaded', renderCards);

// ============================================
// Registro del Service Worker + Update flow
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./sw.js')
            .then((registration) => {
                console.log('✅ SW registrado:', registration.scope);

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            showUpdateBanner(newWorker);
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Error registrando SW:', error);
            });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    });
}

function showUpdateBanner(newWorker) {
    const banner = document.getElementById('update-banner');
    const btn = document.getElementById('update-btn');
    if (!banner || !btn) return;

    banner.classList.remove('hidden');
    btn.addEventListener('click', () => {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        banner.classList.add('hidden');
    });
}

// ============================================
// Instalación PWA — manejamos beforeinstallprompt
// ============================================
const installBtn = document.getElementById('install-btn');
const installModal = document.getElementById('install-modal');
const installConfirm = document.getElementById('install-confirm');
const installCancel = document.getElementById('install-cancel');
const toastEl = document.getElementById('toast');

let deferredPrompt = null;

// Detecta si la app ya está instalada o corriendo en modo standalone
function isAppInstalled() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.navigator.standalone === true
    );
}

// Muestra un toast breve al usuario
function showToast(message, duration = 3500) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
        toastEl.classList.add('hidden');
    }, duration);
}

// Ocultar botón si ya está instalada al cargar
if (isAppInstalled() && installBtn) {
    installBtn.classList.add('hidden');
}

// El navegador dispara este evento cuando la app es instalable
window.addEventListener('beforeinstallprompt', (e) => {
    // Evitamos el mini-infobar por defecto del navegador
    e.preventDefault();
    deferredPrompt = e;

    // Solo mostramos el botón si NO está instalada
    if (!isAppInstalled() && installBtn) {
        installBtn.classList.remove('hidden');
    }
    console.log('✅ beforeinstallprompt capturado — mostrando botón de instalación');
});

// Al hacer clic en el FAB → abrimos el modal de confirmación
if (installBtn) {
    installBtn.addEventListener('click', () => {
        if (!deferredPrompt) {
            showToast('La instalación no está disponible en este navegador.');
            return;
        }
        if (installModal) installModal.classList.remove('hidden');
    });
}

// Confirmar instalación → ejecutamos el prompt nativo
if (installConfirm) {
    installConfirm.addEventListener('click', async () => {
        if (!deferredPrompt) {
            if (installModal) installModal.classList.add('hidden');
            showToast('La instalación no está disponible.');
            return;
        }

        // Ocultamos el modal antes de mostrar el prompt nativo
        if (installModal) installModal.classList.add('hidden');

        // Mostramos el diálogo nativo del navegador
        deferredPrompt.prompt();

        // Esperamos la elección del usuario
        const { outcome } = await deferredPrompt.userChoice;
        console.log('📥 Resultado de instalación:', outcome);

        if (outcome === 'accepted') {
            showToast('¡Genial! La app se está instalando…');
            if (installBtn) installBtn.classList.add('hidden');
        } else {
            showToast('Instalación cancelada. Puedes intentarlo más tarde.');
        }

        // El prompt solo se puede usar una vez
        deferredPrompt = null;
    });
}

// Cancelar → cerramos el modal y avisamos
if (installCancel) {
    installCancel.addEventListener('click', () => {
        if (installModal) installModal.classList.add('hidden');
        showToast('Instalación cancelada.');
    });
}

// Cerrar modal al hacer clic fuera de la caja
if (installModal) {
    installModal.addEventListener('click', (e) => {
        if (e.target === installModal) {
            installModal.classList.add('hidden');
        }
    });
}

// Cuando la app se instala correctamente
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada correctamente');
    if (installBtn) installBtn.classList.add('hidden');
    if (installModal) installModal.classList.add('hidden');
    showToast('¡Pokémon PWA instalada con éxito! 🎉', 4000);
    deferredPrompt = null;
});