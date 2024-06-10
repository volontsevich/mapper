import { initializeMap, applySearchParams, handleSearchClick } from './map.js';
import { loadPlaceTypes } from './placeTypes.js';
import { getSearchParams, generateShareableURL, copyToClipboard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = getSearchParams();
    if (params.has('lat') && params.has('lng')) {
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
            data: params => ({ q: params.term }),
            processResults: data => ({
                results: data.placeTypes.map(type => ({ id: type, text: type.replace('_', ' ') }))
            }),
            cache: true
        }
    });

    document.getElementById('shareBtn').addEventListener('click', () => {
        const url = generateShareableURL();
        copyToClipboard(url);
        alert('Shareable URL copied to clipboard');
    });

    if (window.location.search) {
        applySearchParams();
    }

    loadPlaceTypes();
    document.getElementById('searchBtn').addEventListener('click', handleSearchClick);
});
