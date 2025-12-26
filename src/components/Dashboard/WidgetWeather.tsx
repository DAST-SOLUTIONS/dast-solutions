/**
 * DAST Solutions - Widget Météo Construction
 * Utilise OpenWeatherMap API 2.5 (GRATUIT)
 */
import { useState, useEffect } from 'react'
import { Cloud, CloudRain, Sun, Wind, AlertTriangle, Droplets, Thermometer, Snowflake } from 'lucide-react'

interface WeatherData {
  location: string
  current: {
    temperature: number
    feels_like: number
    humidity: number
    wind_speed: number
    weather: string
    weather_icon: string
    description: string
  }
  forecast: Array<{
    date: string
    temp_min: number
    temp_max: number
    weather: string
    weather_icon: string
  }>
}

interface WidgetWeatherProps {
  projectAddress?: string
  latitude?: number
  longitude?: number
}

export function WidgetWeather({ projectAddress = 'Montreal,CA', latitude, longitude }: WidgetWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
        if (!apiKey) {
          setError('API key non configurée')
          return
        }

        let lat = latitude
        let lon = longitude

        // Si pas de coordonnées, géocoder l'adresse
        if (!lat || !lon) {
          const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(projectAddress)}&limit=1&appid=${apiKey}`
          const geoRes = await fetch(geoUrl)
          const geoData = await geoRes.json()
          
          if (!geoData || geoData.length === 0) {
            // Fallback: utiliser Montréal par défaut
            lat = 45.5017
            lon = -73.5673
          } else {
            lat = geoData[0].lat
            lon = geoData[0].lon
          }
        }

        // API 2.5 GRATUITE - Météo actuelle
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
        const currentRes = await fetch(currentUrl)
        const currentData = await currentRes.json()

        if (!currentRes.ok) {
          throw new Error(currentData.message || 'Erreur API météo')
        }

        // API 2.5 GRATUITE - Prévisions 5 jours
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
        const forecastRes = await fetch(forecastUrl)
        const forecastData = await forecastRes.json()

        // Transformer les données
        const transformedData: WeatherData = {
          location: currentData.name || projectAddress,
          current: {
            temperature: Math.round(currentData.main.temp),
            feels_like: Math.round(currentData.main.feels_like),
            humidity: currentData.main.humidity,
            wind_speed: Math.round(currentData.wind.speed * 3.6), // m/s → km/h
            weather: currentData.weather[0].main,
            weather_icon: currentData.weather[0].main,
            description: currentData.weather[0].description
          },
          forecast: []
        }

        // Extraire prévisions par jour (1 par jour, midi)
        if (forecastData.list) {
          const dailyMap = new Map<string, any>()
          forecastData.list.forEach((item: any) => {
            const date = item.dt_txt.split(' ')[0]
            const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0])
            // Prendre la prévision de midi
            if (hour === 12 && !dailyMap.has(date)) {
              dailyMap.set(date, item)
            }
          })

          transformedData.forecast = Array.from(dailyMap.values()).slice(0, 5).map((item: any) => ({
            date: new Date(item.dt * 1000).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric' }),
            temp_min: Math.round(item.main.temp_min),
            temp_max: Math.round(item.main.temp_max),
            weather: item.weather[0].main,
            weather_icon: item.weather[0].main
          }))
        }

        setWeather(transformedData)
      } catch (err) {
        console.error('Erreur météo:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Rafraîchir toutes les 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [projectAddress, latitude, longitude])

  const getWeatherIcon = (iconType: string, size: number = 32) => {
    const iconClass = size === 32 ? '' : 'w-5 h-5'
    switch (iconType) {
      case 'Clouds':
        return <Cloud className={`text-gray-400 ${iconClass}`} size={size} />
      case 'Rain':
      case 'Drizzle':
        return <CloudRain className={`text-blue-500 ${iconClass}`} size={size} />
      case 'Clear':
        return <Sun className={`text-yellow-500 ${iconClass}`} size={size} />
      case 'Snow':
        return <Snowflake className={`text-blue-300 ${iconClass}`} size={size} />
      case 'Thunderstorm':
        return <CloudRain className={`text-purple-500 ${iconClass}`} size={size} />
      default:
        return <Cloud className={`text-gray-400 ${iconClass}`} size={size} />
    }
  }

  // Alertes construction basées sur la météo
  const getConstructionAlerts = () => {
    if (!weather) return []
    const alerts: string[] = []
    
    if (weather.current.temperature < -10) {
      alerts.push('🥶 Température très froide - Précautions béton/maçonnerie')
    } else if (weather.current.temperature < 0) {
      alerts.push('❄️ Gel - Surveiller les matériaux sensibles')
    }
    if (weather.current.temperature > 30) {
      alerts.push('🔥 Chaleur intense - Hydratation obligatoire')
    }
    if (weather.current.wind_speed > 40) {
      alerts.push('💨 Vents forts - Travaux en hauteur déconseillés')
    }
    if (weather.current.weather === 'Rain' || weather.current.weather === 'Drizzle') {
      alerts.push('🌧️ Pluie - Reporter travaux extérieurs sensibles')
    }
    if (weather.current.weather === 'Snow') {
      alerts.push('🌨️ Neige - Sécuriser le chantier')
    }
    
    return alerts
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const isApiKeyError = error.includes('API key')
    return (
      <div className={`p-4 ${isApiKeyError ? 'bg-amber-50' : 'bg-red-50'}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={isApiKeyError ? 'text-amber-500' : 'text-red-500'} size={20} />
          <div>
            <p className={`text-sm font-medium ${isApiKeyError ? 'text-amber-800' : 'text-red-700'}`}>
              {error}
            </p>
            {isApiKeyError && (
              <div className="mt-2 text-xs text-amber-700 space-y-1">
                <p>Pour activer la météo construction:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-1">
                  <li>Créer un compte sur <a href="https://openweathermap.org/api" target="_blank" rel="noopener" className="underline hover:text-amber-900">openweathermap.org</a></li>
                  <li>Copier votre API key</li>
                  <li>Vercel → Settings → Environment Variables</li>
                  <li>Ajouter: <code className="bg-amber-100 px-1 rounded">VITE_OPENWEATHER_API_KEY</code></li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const alerts = getConstructionAlerts()

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Météo Construction</h3>
          <p className="text-xs text-gray-500">{weather.location}</p>
        </div>
        {getWeatherIcon(weather.current.weather_icon)}
      </div>

      {/* Température actuelle */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-4xl font-bold text-gray-900">{weather.current.temperature}°C</span>
        <span className="text-sm text-gray-500">Ressenti {weather.current.feels_like}°C</span>
      </div>
      <p className="text-sm text-gray-600 capitalize mb-3">{weather.current.description}</p>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-gray-50 rounded p-2 flex items-center gap-2">
          <Wind className="text-gray-400" size={16} />
          <span>{weather.current.wind_speed} km/h</span>
        </div>
        <div className="bg-gray-50 rounded p-2 flex items-center gap-2">
          <Droplets className="text-blue-400" size={16} />
          <span>{weather.current.humidity}%</span>
        </div>
      </div>

      {/* Alertes construction */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4">
          <p className="text-xs font-medium text-yellow-800 mb-1">⚠️ Alertes chantier</p>
          {alerts.map((alert, i) => (
            <p key={i} className="text-xs text-yellow-700">{alert}</p>
          ))}
        </div>
      )}

      {/* Prévisions */}
      {weather.forecast.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Prévisions</p>
          <div className="flex gap-1">
            {weather.forecast.map((day, i) => (
              <div key={i} className="flex-1 bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 mb-1">{day.date}</p>
                {getWeatherIcon(day.weather_icon, 20)}
                <p className="text-xs font-medium mt-1">{day.temp_max}°</p>
                <p className="text-xs text-gray-400">{day.temp_min}°</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WidgetWeather
