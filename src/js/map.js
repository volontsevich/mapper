import { updateDisplayValues, isMobile } from './utils.js';

let map;
let searchCirclePreview;
let markers = [];
let searchCircles = [];
const API_KEY = 'AIzaSyC48nGG95v_4Fc1e9f6Q0yyGpXLEkoRXtI';

export const initializeMap = (center) => {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView(center, 12);
    L.gridLayer.googleMutant({ type: 'roadmap' }).addTo(map);

    setupEventListeners();
};

const setupEventListeners = () => {
    const radiusInput = document.getElementById('radius');
    const minRatingInput = document.getElementById('rating');

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
        updateDisplayValues();
    };

    drawCircle();

    radiusInput.addEventListener('input', drawCircle);
    minRatingInput.addEventListener('input', updateDisplayValues);

    map.on('moveend', drawCircle);
    map.on('popupopen', handlePopupOpen);

    drawCircle();
};

const handlePopupOpen = async (event) => {
    const marker = event.popup._source;
    const placeId = marker.options.placeId;
    const placeDetails = await fetchPlaceDetails(placeId);
    if (placeDetails && placeDetails.result && placeDetails.result.photos) {
        showPhotosCarousel(placeDetails.result.photos);
    }
};

export const applySearchParams = () => {
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
    updateDisplayValues();

    $('#placeType').one('select2:open', () => {
        $('#placeType').val(placeTypes).trigger('change');
    });

    setTimeout(() => {
        document.getElementById('searchBtn').click();
    }, 100);
};

export const handleSearchClick = () => {
    const center = map.getCenter();
    const lat = center.lat;
    const lng = center.lng;
    const radius = parseInt(document.getElementById('radius').value) * 1000;
    const placeTypes = $('#placeType').val();
    const minRating = parseFloat(document.getElementById('rating').value);
    const minVotes = parseInt(document.getElementById('votes').value);
    const keyword = document.getElementById('keyword').value;
    const combineResults = document.getElementById('combineResults').checked;

    fetchPlaces(lat, lng, radius, placeTypes, minRating, minVotes, keyword, combineResults);
};

const fetchPlaces = async (lat, lng, radius, placeTypes, minRating, minVotes, keyword, combineResults) => {
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
        await fetchPage(url, minRating, minVotes, allPlaces);
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

        const marker = L.marker([lat, lng], { placeId })
            .addTo(map)
            .bindPopup(`<b>${name}</b><br>Rating: ${rating}<br>Reviews: ${reviews}<br><a href="${link}" target="_blank">View on Google Maps</a>`);
        markers.push(marker);
    });

    document.getElementById('progress').style.display = 'none';
    document.getElementById('progressBar').value = 0;
};

const fetchPage = async (pageUrl, minRating, minVotes, allPlaces) => {
    try {
        const response = await fetch(pageUrl);
        const data = await response.json();

        const filteredPlaces = data.results.filter(place => place.rating >= minRating && place.user_ratings_total >= minVotes);
        allPlaces.push(...filteredPlaces);

        document.getElementById('progressBar').value += 33;

        if (data.next_page_token) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await fetchPage(`/api/places?pagetoken=${data.next_page_token}`, minRating, minVotes, allPlaces);
        }
    } catch (error) {
        console.error('Error fetching places:', error);
    }
};

const fetchPlaceDetails = async (placeId) => {
    const response = await fetch(`/api/placeDetails?place_id=${placeId}`);
    if (!response.ok) {
        console.error('Failed to fetch place details');
        return null;
    }
    return response.json();
};

const showPhotosCarousel = (photos) => {
    const carouselContainer = document.getElementById('carousel-container');
    const carouselInner = document.getElementById('carousel-inner');
    carouselInner.innerHTML = '';

    photos.forEach((photo, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`;
        imgElement.alt = `Photo ${index + 1}`;
        carouselInner.appendChild(imgElement);
    });

    carouselContainer.style.display = 'flex';
    initializeCarousel();
};

const initializeCarousel = () => {
    let currentIndex = 0;
    const images = document.querySelectorAll('#carousel-inner img');
    const totalImages = images.length;

    const showImage = (index) => {
        images.forEach((img, i) => {
            img.style.display = i === index ? 'block' : 'none';
        });
    };

    document.getElementById('carousel-prev').addEventListener('click', () => {
        currentIndex = (currentIndex === 0) ? totalImages - 1 : currentIndex - 1;
        showImage(currentIndex);
    });

    document.getElementById('carousel-next').addEventListener('click', () => {
        currentIndex = (currentIndex === totalImages - 1) ? 0 : currentIndex + 1;
        showImage(currentIndex);
    });

    document.getElementById('carousel-close').addEventListener('click', () => {
        document.getElementById('carousel-container').style.display = 'none';
    });

    showImage(currentIndex);
};

export { map, searchCircles, markers };