const WEATHER_API_KEY = '824ab592ae91e865c5f7f51a146fa395';
const CITY = 'Ajalpan';

class WeatherManager {
    constructor() {
        this.weatherData = null;
        this.updateInterval = 300000; // 5 minutes
    }

    async init() {
        await this.fetchWeatherData();
        this.startUpdateCycle();
    }

    async fetchWeatherData() {
        try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${CITY}&aqi=no`
            );
            const data = await response.json();
            this.weatherData = this.processWeatherData(data);
            this.updateUI();
            this.updateBackground();
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    }

    processWeatherData(data) {
        const current = data.current;
        const isDay = current.is_day === 1;
        const condition = current.condition.text.toLowerCase();

        return {
            temperature: current.temp_c,
            humidity: current.humidity,
            isNight: !isDay,
            isRainy: condition.includes('rain') || condition.includes('drizzle'),
            isCloudy: condition.includes('cloud') || condition.includes('overcast'),
            lightLevel: isDay ? (100 - current.cloud) : 0
        };
    }

    updateUI() {
        if (!this.weatherData) return;

        // Update temperature
        const tempElement = document.getElementById('temperature');
        if (tempElement) {
            tempElement.textContent = `${this.weatherData.temperature}°C`;
        }

        // Update humidity
        const humidityElement = document.getElementById('humidity');
        if (humidityElement) {
            humidityElement.textContent = `${this.weatherData.humidity}%`;
        }

        // Update light level
        const lightElement = document.getElementById('light');
        if (lightElement) {
            lightElement.textContent = `${this.weatherData.lightLevel}%`;
        }
    }

    updateBackground() {
        if (typeof updateWeatherEffect === 'function') {
            updateWeatherEffect(this.weatherData);
        }
    }

    startUpdateCycle() {
        setInterval(() => this.fetchWeatherData(), this.updateInterval);
    }
}

// Initialize weather manager
const weatherManager = new WeatherManager();
weatherManager.init();