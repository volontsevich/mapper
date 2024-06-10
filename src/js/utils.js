export const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);

export const copyToClipboard = (text) => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.value = text;
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
};

export const getSearchParams = () => new URLSearchParams(window.location.search);

export const updateDisplayValues = () => {
    document.getElementById('radiusValue').textContent = document.getElementById('radius').value;
    document.getElementById('ratingValue').textContent = document.getElementById('rating').value;
};

export const generateShareableURL = () => {
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
};
