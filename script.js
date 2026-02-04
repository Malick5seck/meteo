// Clé API OpenWeatherMap - REMPLACEZ PAR VOTRE CLÉ
// Obtenez une clé gratuite sur: https://openweathermap.org/api
const API_KEY = 'f7528706cf086c23f3829d82320f23c7'; // Clé de test
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Éléments DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const currentWeather = document.getElementById('currentWeather');
const weatherDetails = document.getElementById('weatherDetails');
const forecastContainer = document.getElementById('forecastContainer');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const themeToggle = document.getElementById('themeToggle');
const unitButtons = document.querySelectorAll('.unit-btn');
const favoritesList = document.getElementById('favoritesList');
const favoriteInput = document.getElementById('favoriteInput');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');

// Icônes météo
const weatherIcons = {
    '01': '☀️', // ciel clair
    '02': '⛅', // peu nuageux
    '03': '☁️', // nuageux
    '04': '☁️', // très nuageux
    '09': '🌧️', // pluie légère
    '10': '🌦️', // pluie
    '11': '⛈️', // orage
    '13': '❄️', // neige
    '50': '🌫️'  // brouillard
};

// Villes favorites par défaut
const defaultFavorites = ['Paris', 'Lyon', 'Marseille', 'Londres', 'New York'];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    getWeather('Paris'); // Ville par défaut
    setupEventListeners();
    loadFavorites();
    setupTheme();
}

// Configuration des événements
function setupEventListeners() {
    // Recherche
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Localisation
    locationBtn.addEventListener('click', getLocationWeather);
    
    // Unités de température
    unitButtons.forEach(btn => {
        btn.addEventListener('click', handleUnitChange);
    });
    
    // Favoris
    addFavoriteBtn.addEventListener('click', addFavorite);
    favoriteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFavorite();
    });
    
    // Thème
    themeToggle.addEventListener('click', toggleTheme);
}

function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
}

function handleUnitChange(e) {
    const clickedBtn = e.currentTarget;
    const unit = clickedBtn.dataset.unit;
    
    // Mettre à jour les boutons actifs
    unitButtons.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    
    // Recharger les données avec les nouvelles unités
    const currentCity = document.querySelector('.city-name')?.textContent.split(',')[0] || 'Paris';
    getWeather(currentCity, unit);
}

// Obtenir la météo
async function getWeather(city, unit = null) {
    showLoading(true);
    hideError();
    
    // Utiliser l'unité sélectionnée ou la valeur par défaut
    if (!unit) {
        const activeBtn = document.querySelector('.unit-btn.active');
        unit = activeBtn ? activeBtn.dataset.unit : 'metric';
    }
    
    try {
        // Simulation de données si la clé API est la clé de test
        if (API_KEY === 'f7528706cf086c23f3829d82320f23c7') {
            console.log('Mode simulation activé - pour des données réelles, obtenez une clé API sur openweathermap.org');
            setTimeout(() => {
                displaySampleData(city, unit);
                showLoading(false);
            }, 500);
            return;
        }
        
        // Météo actuelle
        const weatherUrl = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}&lang=fr`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            if (weatherResponse.status === 404) {
                throw new Error('Ville non trouvée. Vérifiez le nom de la ville.');
            } else if (weatherResponse.status === 401) {
                throw new Error('Clé API invalide. Obtenez une clé gratuite sur openweathermap.org');
            } else {
                throw new Error(`Erreur ${weatherResponse.status}: ${weatherResponse.statusText}`);
            }
        }
        
        const weatherData = await weatherResponse.json();
        
        // Prévisions
        const forecastUrl = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}&lang=fr`;
        const forecastResponse = await fetch(forecastUrl);
        
        let forecastData = null;
        if (forecastResponse.ok) {
            forecastData = await forecastResponse.json();
        }
        
        // Afficher les données
        displayCurrentWeather(weatherData, unit);
        displayWeatherDetails(weatherData, unit);
        if (forecastData) {
            displayForecast(forecastData, unit);
        }
        
    } catch (error) {
        showError(error.message);
        console.error('Erreur:', error);
    } finally {
        showLoading(false);
    }
}

// Afficher la météo actuelle
function displayCurrentWeather(data, unit = 'metric') {
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const iconCode = data.weather[0].icon.substring(0, 2);
    const icon = weatherIcons[iconCode] || '🌈';
    const tempSymbol = unit === 'metric' ? '°C' : '°F';
    
    const date = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = date.toLocaleDateString('fr-FR', options);
    
    currentWeather.innerHTML = `
        <div class="city-header">
            <h2 class="city-name">${data.name}, ${data.sys.country}</h2>
            <p class="date-time">${formattedDate}</p>
        </div>
        
        <div class="weather-main">
            <div class="temperature-section">
                <div class="temperature">${temp}${tempSymbol}</div>
                <p class="feels-like">Ressenti ${feelsLike}${tempSymbol}</p>
            </div>
            
            <div class="weather-icon-container">
                <div class="weather-icon">${icon}</div>
                <p class="weather-description">${data.weather[0].description}</p>
            </div>
        </div>
    `;
    
    currentWeather.style.display = 'block';
}

// Afficher les détails
function displayWeatherDetails(data, unit = 'metric') {
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = Math.round(data.wind.speed * 3.6); // m/s to km/h
    const windDirection = getWindDirection(data.wind.deg);
    
    // Gestion des erreurs pour sunrise/sunset
    let sunrise = 'N/A';
    let sunset = 'N/A';
    if (data.sys && data.sys.sunrise) {
        sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    if (data.sys && data.sys.sunset) {
        sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    const visibility = data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A';
    const clouds = data.clouds ? data.clouds.all : 'N/A';
    
    weatherDetails.innerHTML = `
        <div class="detail-item">
            <div class="detail-icon">💧</div>
            <div class="detail-value">${humidity}%</div>
            <div class="detail-label">Humidité</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-icon">🎈</div>
            <div class="detail-value">${pressure} hPa</div>
            <div class="detail-label">Pression</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-icon">💨</div>
            <div class="detail-value">${windSpeed} km/h</div>
            <div class="detail-label">Vent ${windDirection}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-icon">👁️</div>
            <div class="detail-value">${visibility} km</div>
            <div class="detail-label">Visibilité</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-icon">☁️</div>
            <div class="detail-value">${clouds}%</div>
            <div class="detail-label">Nuages</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-icon">🌅</div>
            <div class="detail-value">${sunrise}</div>
            <div class="detail-label">Lever du soleil</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-icon">🌇</div>
            <div class="detail-value">${sunset}</div>
            <div class="detail-label">Coucher du soleil</div>
        </div>
    `;
}

// Afficher les prévisions
function displayForecast(data, unit = 'metric') {
    forecastContainer.innerHTML = '';
    
    if (!data.list || data.list.length === 0) {
        forecastContainer.innerHTML = '<p>Aucune prévision disponible</p>';
        return;
    }
    
    const tempSymbol = unit === 'metric' ? '°C' : '°F';
    
    // Prendre une prévision par jour (environ toutes les 24h)
    const forecastsByDay = {};
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayKey = date.toLocaleDateString('fr-FR');
        
        if (!forecastsByDay[dayKey]) {
            forecastsByDay[dayKey] = forecast;
        }
    });
    
    // Afficher les 5 prochains jours
    const dayKeys = Object.keys(forecastsByDay).slice(0, 5);
    
    dayKeys.forEach(dayKey => {
        const forecast = forecastsByDay[dayKey];
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        const dayNumber = date.getDate();
        const iconCode = forecast.weather[0].icon.substring(0, 2);
        const icon = weatherIcons[iconCode] || '🌈';
        const temp = Math.round(forecast.main.temp);
        const description = forecast.weather[0].description;
        
        const forecastElement = document.createElement('div');
        forecastElement.className = 'forecast-day';
        forecastElement.innerHTML = `
            <div class="forecast-date">${dayName} ${dayNumber}</div>
            <div class="forecast-icon">${icon}</div>
            <div class="forecast-temp">${temp}${tempSymbol}</div>
            <div class="forecast-desc">${description}</div>
        `;
        
        forecastContainer.appendChild(forecastElement);
    });
}

// Météo par géolocalisation
function getLocationWeather() {
    if (!navigator.geolocation) {
        showError('La géolocalisation n\'est pas supportée par votre navigateur');
        return;
    }
    
    showLoading(true);
    hideError();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const unit = document.querySelector('.unit-btn.active').dataset.unit;
                
                // Obtenir le nom de la ville par coordonnées
                const geocodeUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
                const geocodeResponse = await fetch(geocodeUrl);
                
                if (!geocodeResponse.ok) throw new Error('Erreur de géocodage');
                
                const locationData = await geocodeResponse.json();
                if (locationData.length > 0) {
                    const cityName = locationData[0].name;
                    cityInput.value = cityName;
                    getWeather(cityName, unit);
                } else {
                    throw new Error('Localisation non trouvée');
                }
                
            } catch (error) {
                showError('Impossible d\'obtenir la météo pour votre position: ' + error.message);
                showLoading(false);
            }
        },
        (error) => {
            let errorMsg = 'Permission de localisation refusée';
            if (error.code === error.POSITION_UNAVAILABLE) {
                errorMsg = 'Position indisponible';
            } else if (error.code === error.TIMEOUT) {
                errorMsg = 'La requête de localisation a expiré';
            }
            showError(errorMsg);
            showLoading(false);
        }
    );
}

// Gestion des favoris
function loadFavorites() {
    // Charger depuis localStorage ou utiliser les valeurs par défaut
    const savedFavorites = localStorage.getItem('weatherFavorites');
    const favorites = savedFavorites ? JSON.parse(savedFavorites) : defaultFavorites;
    
    favorites.forEach(city => {
        addFavoriteToDOM(city);
    });
}

function addFavorite() {
    const city = favoriteInput.value.trim();
    if (city) {
        addFavoriteToDOM(city);
        saveFavorites();
        favoriteInput.value = '';
    }
}

function addFavoriteToDOM(city) {
    // Vérifier si la ville existe déjà
    const existing = Array.from(favoritesList.children).some(item => 
        item.querySelector('span').textContent === city
    );
    
    if (existing) {
        showError(`${city} est déjà dans les favoris`);
        return;
    }
    
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.innerHTML = `
        <span>${city}</span>
        <button class="remove-favorite" title="Supprimer des favoris">×</button>
    `;
    
    // Cliquer sur la ville
    favoriteItem.querySelector('span').addEventListener('click', () => {
        cityInput.value = city;
        getWeather(city);
    });
    
    // Bouton de suppression
    favoriteItem.querySelector('.remove-favorite').addEventListener('click', (e) => {
        e.stopPropagation();
        favoriteItem.remove();
        saveFavorites();
    });
    
    favoritesList.appendChild(favoriteItem);
}

function saveFavorites() {
    const favorites = Array.from(favoritesList.children).map(item => 
        item.querySelector('span').textContent
    );
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
}

// Gestion du thème
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Fonctions utilitaires
function getWindDirection(degrees) {
    if (degrees === undefined) return '';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    if (show) {
        currentWeather.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Masquer l'erreur après 5 secondes
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Fonction de simulation pour tester sans clé API
function displaySampleData(city, unit = 'metric') {
    console.log('Affichage des données de simulation pour', city);
    
    const tempSymbol = unit === 'metric' ? '°C' : '°F';
    const temp = unit === 'metric' ? 15 : 59;
    const feelsLike = unit === 'metric' ? 14 : 57;
    
    const mockWeatherData = {
        name: city,
        sys: { country: 'FR', sunrise: Date.now()/1000 - 21600, sunset: Date.now()/1000 + 21600 },
        main: {
            temp: temp,
            feels_like: feelsLike,
            humidity: 65,
            pressure: 1013
        },
        weather: [{ 
            description: 'partiellement nuageux', 
            icon: '02d',
            main: 'Clouds'
        }],
        wind: { speed: 3.6, deg: 180 }, // 3.6 m/s = ~13 km/h
        visibility: 10000,
        clouds: { all: 40 },
        dt: Date.now()/1000
    };
    
    // Météo actuelle
    const date = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = date.toLocaleDateString('fr-FR', options);
    
    currentWeather.innerHTML = `
        <div class="city-header">
            <h2 class="city-name">${city}, FR</h2>
            <p class="date-time">${formattedDate}</p>
        </div>
        
        <div class="weather-main">
            <div class="temperature-section">
                <div class="temperature">${temp}${tempSymbol}</div>
                <p class="feels-like">Ressenti ${feelsLike}${tempSymbol}</p>
            </div>
            
            <div class="weather-icon-container">
                <div class="weather-icon">⛅</div>
                <p class="weather-description">partiellement nuageux</p>
            </div>
        </div>
    `;
    currentWeather.style.display = 'block';
    
    // Détails
    displayWeatherDetails(mockWeatherData, unit);
    
    // Prévisions simulées
    const mockForecastData = {
        list: [
            { dt: Date.now()/1000 + 86400, main: { temp: 16 }, weather: [{ description: 'ensoleillé', icon: '01d' }] },
            { dt: Date.now()/1000 + 172800, main: { temp: 14 }, weather: [{ description: 'nuageux', icon: '03d' }] },
            { dt: Date.now()/1000 + 259200, main: { temp: 12 }, weather: [{ description: 'pluie légère', icon: '10d' }] },
            { dt: Date.now()/1000 + 345600, main: { temp: 17 }, weather: [{ description: 'éclaircies', icon: '02d' }] },
            { dt: Date.now()/1000 + 432000, main: { temp: 18 }, weather: [{ description: 'ensoleillé', icon: '01d' }] }
        ]
    };
    
    displayForecast(mockForecastData, unit);
    
    // Afficher un message d'avertissement
    showError('Mode simulation - Obtenez une clé API gratuite sur openweathermap.org pour des données réelles');
}

// Gestion des erreurs réseau
window.addEventListener('online', () => {
    if (errorMessage.textContent.includes('réseau')) {
        hideError();
    }
});

window.addEventListener('offline', () => {
    showError('Vous êtes hors ligne. Vérifiez votre connexion Internet.');
});