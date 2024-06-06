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
}

function initializeMap() {
    if (map != undefined) {
        map.remove(); // Remove the existing map instance
    }

    map = L.map('map').setView([43.4305294, -80.5587154], 10);
    L.gridLayer.googleMutant({ type: 'roadmap' }).addTo(map);

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
        const placeType = document.getElementById('placeType').value;
        const minRating = parseFloat(minRatingInput.value);
        const minVotes = parseInt(document.getElementById('votes').value);
        const keyword = document.getElementById('keyword').value;
        const combineResults = document.getElementById('combineResults').checked;

        fetchPlaces(lat, lng, radius, placeType, minRating, minVotes, keyword, combineResults);
    });

    async function fetchPlaces(lat, lng, radius, placeType, minRating, minVotes, keyword, combineResults) {
        const location = `${lat},${lng}`;
        let url = `/api/places?location=${location}&type=${placeType}&radius=${radius}&keyword=${keyword}`;
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

        const fetchPage = async (pageUrl) => {
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
        };

        await fetchPage(url);

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
});