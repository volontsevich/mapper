import {initializeMap, applySearchParams, handleSearchClick} from './map.js';
import {loadPlaceTypes} from './placeTypes.js';
import {getSearchParams, generateShareableURL, copyToClipboard} from './utils.js';

let deferredPrompt;

document.addEventListener('DOMContentLoaded', async () => {
    const params = getSearchParams();

    await loadPlaceTypes();

    if (params.has('lat') && params.has('lng')) {
        const center = [parseFloat(params.get('lat')), parseFloat(params.get('lng'))];
        initializeMap(center);
        applySearchParams();
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const center = [position.coords.latitude, position.coords.longitude];
                initializeMap(center);
            }, () => {
                initializeMap([43.4305294, -80.5587154]);
            });
        } else {
            initializeMap([43.4305294, -80.5587154]);
        }
    }

    const toggleButton = document.getElementById('toggle-controls');
    const controlsContent = document.getElementById('control-content');

    toggleButton.addEventListener('click', () => {
        if (controlsContent.style.display === 'none') {
            controlsContent.style.display = 'block';
            toggleButton.style.marginBottom = '5px';
        } else {
            controlsContent.style.display = 'none';
            toggleButton.style.marginBottom = '0px';
        }
    });

    $('#placeType').select2({
        placeholder: 'Select Place Types',
        multiple: true,
        ajax: {
            url: '/api/placeTypes',
            dataType: 'json',
            delay: 250,
            data: params => ({q: params.term}),
            processResults: data => ({
                results: data.placeTypes.map(type => ({id: type, text: type.replace('_', ' ')}))
            }),
            cache: true
        }
    });

    document.getElementById('shareBtn').addEventListener('click', () => {
        const url = generateShareableURL();
        copyToClipboard(url);
        alert('Shareable URL copied to clipboard');
    });

    document.getElementById('searchBtn').addEventListener('click', handleSearchClick);

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/assets/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

    const installBtn = document.getElementById('install');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.hidden = false;

        installBtn.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                installBtn.hidden = true;
            });
        });
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
    });
});
