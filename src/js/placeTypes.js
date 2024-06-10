export const loadPlaceTypes = async () => {
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
};
