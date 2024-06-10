let map;
let searchCirclePreview;

function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

async function loadPlaceTypes() {
    const response = await fetch('/api/placeTypes');
    const data = await response.json();
    const placeTypes = data.placeTypes;

    const placeTypeDropdown = document.getElementById('placeType');
    placeTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.replace('_', ' ');
        placeTypeDropdown.appendChild(option);
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has('placeTypes')) {
        const placeTypesFromParams = params.get('placeTypes').split(',');
        $('#placeType').val(placeTypesFromParams).trigger('change');
    }
}

function initializeMap() {
    if (map != undefined) {
        map.remove(); // Remove the existing map instance
    }

    map = L.map('map').setView([43.4305294, -80.5587154], 12);
    L.gridLayer.googleMutant({type: 'roadmap'}).addTo(map);

    let markers = [];
    let searchCircles = [];

    const radiusInput = document.getElementById('radius');
    const minRatingInput = document.getElementById('rating');
    const radiusValueDisplay = document.getElementById('radiusValue');
    const ratingValueDisplay = document.getElementById('ratingValue');

    // Draw the initial circle with the default radius value
    const drawCircle = () => {
        const center = map.getCenter();
        const radius = parseInt(radiusInput.value) * 1000;

        if (searchCirclePreview) {
            map.removeLayer(searchCirclePreview);
        }

        searchCirclePreview = L.circle([center.lat, center.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.2,
            radius: radius,
            dashArray: '5, 10'
        }).addTo(map);
        radiusValueDisplay.textContent = radiusInput.value;
    };

    const updateRatingValue = () => {
        ratingValueDisplay.textContent = minRatingInput.value;
    };

    // Initial draw
    drawCircle();

    radiusInput.addEventListener('input', drawCircle);
    minRatingInput.addEventListener('input', updateRatingValue);

    // Update circle position when the map is moved
    map.on('moveend', drawCircle);

    document.getElementById('searchBtn').addEventListener('click', () => {
        const center = map.getCenter();
        const lat = center.lat;
        const lng = center.lng;
        const radius = parseInt(radiusInput.value) * 1000;
        const placeTypes = $('#placeType').val();
        const minRating = parseFloat(minRatingInput.value);
        const minVotes = parseInt(document.getElementById('votes').value);
        const keyword = document.getElementById('keyword').value;
        const combineResults = document.getElementById('combineResults').checked;

        fetchPlaces(lat, lng, radius, placeTypes, minRating, minVotes, keyword, combineResults);
    });

    async function fetchPlaces(lat, lng, radius, placeTypes, minRating, minVotes, keyword, combineResults) {
        const location = `${lat},${lng}`;
        let allPlaces = [];

        if (!combineResults) {
            markers.forEach(marker => marker.remove());
            markers = [];
            searchCircles.forEach(circle => circle.remove());
            searchCircles = [];
        }

        const searchCircle = L.circle([lat, lng], {
            color: 'blue',
            fillColor: '#30f',
            fillOpacity: 0.2,
            radius: radius
        }).addTo(map);
        searchCircles.push(searchCircle);

        document.getElementById('progress').style.display = 'block';
        document.getElementById('progressBar').value = 0;

        for (const placeType of placeTypes) {
            const url = `/api/places?location=${location}&type=${placeType}&radius=${radius}&keyword=${keyword}`;
            await fetchPage(url);
        }

        async function fetchPage(pageUrl) {
            try {
                const response = await fetch(pageUrl);
                const data = await response.json();

                const filteredPlaces = data.results.filter(place => place.rating >= minRating && place.user_ratings_total >= minVotes);
                allPlaces = allPlaces.concat(filteredPlaces);

                document.getElementById('progressBar').value += 33;

                if (data.next_page_token) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await fetchPage(`/api/places?pagetoken=${data.next_page_token}`);
                }
            } catch (error) {
                console.error('Error fetching places:', error);
            }
        }

        allPlaces.forEach(place => {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;
            const name = place.name;
            const rating = place.rating;
            const reviews = place.user_ratings_total;
            const placeId = place.place_id;

            console.log(`Adding marker for ${name} at [${lat}, ${lng}]`);

            let link;
            if (isMobile()) {
                link = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeId}`;
            } else {
                link = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
            }

            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<b>${name}</b><br>Rating: ${rating}<br>Reviews: ${reviews}<br><a href="${link}" target="_blank">View on Google Maps</a>`);
            markers.push(marker);
        });

        document.getElementById('progress').style.display = 'none';
        document.getElementById('progressBar').value = 0;
    }

    loadPlaceTypes();
}

function generateShareableURL() {
    const params = new URLSearchParams();
    const center = map.getCenter();
    params.append('lat', center.lat);
    params.append('lng', center.lng);
    params.append('radius', document.getElementById('radius').value);
    params.append('placeTypes', $('#placeType').val().join(','));
    params.append('rating', document.getElementById('rating').value);
    params.append('votes', document.getElementById('votes').value);
    params.append('keyword', document.getElementById('keyword').value);
    params.append('combineResults', document.getElementById('combineResults').checked);

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function copyToClipboard(text) {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.value = text;
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
}

function applySearchParams() {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const radius = params.get('radius');
    const placeTypes = params.get('placeTypes').split(',');
    const rating = params.get('rating');
    const votes = params.get('votes');
    const keyword = params.get('keyword');
    const combineResults = params.get('combineResults') === 'true';

    map.setView([lat, lng], 12);
    document.getElementById('radius').value = radius;
    document.getElementById('rating').value = rating;
    document.getElementById('votes').value = votes;
    document.getElementById('keyword').value = keyword;
    document.getElementById('combineResults').checked = combineResults;
    document.getElementById('radiusValue').textContent = radius;
    document.getElementById('ratingValue').textContent = rating;

    $('#placeType').one('select2:open', () => {
        $('#placeType').val(placeTypes).trigger('change');
    });

    setTimeout(() => {
        document.getElementById('searchBtn').click();
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();

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
            data: function (params) {
                return {
                    q: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.placeTypes.map(type => ({id: type, text: type.replace('_', ' ')}))
                };
            },
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
});
