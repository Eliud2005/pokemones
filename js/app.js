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
// Banner de instalación PWA
// ============================================
let deferredPrompt = null;
const installBanner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const installClose = document.getElementById('install-close');

const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const dismissed = localStorage.getItem('install-banner-dismissed');
    if (!isStandalone && !dismissed && installBanner) {
        installBanner.classList.remove('hidden');
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Instalación:', outcome);
        deferredPrompt = null;
        if (installBanner) installBanner.classList.add('hidden');
    });
}

if (installClose) {
    installClose.addEventListener('click', () => {
        if (installBanner) installBanner.classList.add('hidden');
        localStorage.setItem('install-banner-dismissed', 'true');
    });
}

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada');
    if (installBanner) installBanner.classList.add('hidden');
    deferredPrompt = null;
});