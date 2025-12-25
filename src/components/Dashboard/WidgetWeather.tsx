import React, { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, AlertTriangle, Droplets, Eye } from 'lucide-react'

interface WeatherData {
  location: string
  current: {
    temperature: number
    feels_like: number
    humidity: number
    wind_speed: number
    wind_direction: string
    visibility: number
    pressure: number
    weather: string
    weather_icon: string
    uv_index?: number
  }
  forecast: WeatherForecastDay[]
  alerts: WeatherAlertItem[]
}

interface WeatherForecastDay {
  date: string
  high: number
  low: number
  weather: string
  precipitation_chance: number
  wind_speed: number
}

interface WeatherAlertItem {
  id: string
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  start_time: string
  end_time: string
  impact_on_work: 'minimal' | 'moderate' | 'severe'
}

interface WidgetWeatherProps {
  projectAddress?: string
  latitude?: number
  longitude?: number
  onAlert?: (alert: WeatherAlertItem) => void
}

export function WidgetWeather({ projectAddress = 'Montréal, QC', latitude, longitude, onAlert }: WidgetWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        
        // Utiliser OpenWeatherMap API
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
        if (!apiKey) {
          setError('API key non configurée')
          return
        }

        let url: string
        if (latitude && longitude) {
          url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=fr`
        } else {
          // Géocoder l'adresse d'abord
          const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(projectAddress)}&limit=1&appid=${apiKey}`
          const geoRes = await fetch(geoUrl)
          const geoData = await geoRes.json()
          
          if (!geoData.length) {
            setError('Adresse non trouvée')
            return
          }

          const [lat, lon] = [geoData[0].lat, geoData[0].lon]
          url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
        }

        const res = await fetch(url)
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || 'Erreur API')

        // Transformer les données
        const transformedData: WeatherData = {
          location: projectAddress,
          current: {
            temperature: Math.round(data.current.temp),
            feels_like: Math.round(data.current.feels_like),
            humidity: data.current.humidity,
            wind_speed: Math.round(data.current.wind_speed * 3.6), // m/s → km/h
            wind_direction: getWindDirection(data.current.wind_deg),
            visibility: Math.round(data.current.visibility / 1000), // m → km
            pressure: data.current.pressure,
            weather: data.current.weather[0].description,
            weather_icon: data.current.weather[0].main,
            uv_index: data.current.uvi,
          },
          forecast: (data.daily || []).slice(1, 4).map((day: any) => ({
            date: new Date(day.dt * 1000).toLocaleDateString('fr-CA'),
            high: Math.round(day.temp.max),
            low: Math.round(day.temp.min),
            weather: day.weather[0].description,
            precipitation_chance: Math.round(day.pop * 100),
            wind_speed: Math.round(day.wind_speed * 3.6),
          })),
          alerts: (data.alerts || []).map((alert: any) => ({
            id: `${alert.start}-${alert.end}`,
            severity: alert.description.toLowerCase().includes('extreme') ? 'high' : 'medium',
            title: alert.event,
            description: alert.description,
            start_time: new Date(alert.start * 1000).toLocaleString('fr-CA'),
            end_time: new Date(alert.end * 1000).toLocaleString('fr-CA'),
            impact_on_work: getImpactOnWork(alert.event, Math.round(data.current.temp)),
          })),
        }

        setWeather(transformedData)
        
        // Déclencher callback pour alertes graves
        transformedData.alerts
          .filter(a => a.impact_on_work === 'severe')
          .forEach(a => onAlert?.(a))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()

    // Actualiser toutes les heures
    const interval = setInterval(fetchWeather, 3600000)
    return () => clearInterval(interval)
  }, [projectAddress, latitude, longitude])

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    )
  }

  if (error) {
    const isApiKeyError = error.includes('API key')
    return (
      <div className={`p-4 rounded-lg border ${isApiKeyError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
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
                  <li>Obtenir une API key gratuite (One Call API 3.0)</li>
                  <li>Ajouter dans Vercel: <code className="bg-amber-100 px-1 rounded">VITE_OPENWEATHER_API_KEY</code></li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const getWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case 'Clouds':
        return <Cloud className="text-gray-400" size={32} />
      case 'Rain':
        return <CloudRain className="text-blue-500" size={32} />
      case 'Clear':
        return <Sun className="text-yellow-500" size={32} />
      default:
        return <Cloud className="text-gray-400" size={32} />
    }
  }

  const isBadWeather = weather.alerts.length > 0 || 
                       weather.current.temperature < -5 || 
                       weather.current.temperature > 35 ||
                       weather.current.wind_speed > 40

  return (
    <div className={`card p-4 ${isBadWeather ? 'border-yellow-300 bg-yellow-50' : ''}`}>
      {/* Current Weather */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">{weather.location}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{weather.current.temperature}°C</span>
              <span className="text-sm text-gray-600">(ressenti: {weather.current.feels_like}°C)</span>
            </div>
          </div>
          {getWeatherIcon(weather.current.weather_icon)}
        </div>

        <p className="text-sm text-gray-700 capitalize mb-3">{weather.current.weather}</p>

        {/* Detailed metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Droplets size={14} /> Humidité
            </div>
            <div className="font-semibold text-gray-900">{weather.current.humidity}%</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Wind size={14} /> Vent
            </div>
            <div className="font-semibold text-gray-900">{weather.current.wind_speed} km/h</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Eye size={14} /> Visibilité
            </div>
            <div className="font-semibold text-gray-900">{weather.current.visibility} km</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-gray-600 mb-1">Pression</div>
            <div className="font-semibold text-gray-900">{weather.current.pressure} mb</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {weather.alerts.length > 0 && (
        <div className="mb-4 pt-4 border-t">
          <div className="space-y-2">
            {weather.alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-2 rounded-lg border-l-4 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                }`}
              >
                <div className="flex gap-2 items-start">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-xs opacity-90">{alert.description}</p>
                    <p className="text-xs opacity-75 mt-1">
                      Impact: <strong>{alert.impact_on_work === 'severe' ? '🔴 SEVERE' : '🟡 MODÉRÉ'}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast */}
      <div className="pt-4 border-t">
        <p className="text-xs font-semibold text-gray-700 mb-2">Prévisions 3 jours</p>
        <div className="space-y-1">
          {weather.forecast.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded">
              <span className="text-gray-600 w-16">{day.date}</span>
              <span className="text-gray-900 font-medium">
                {day.high}° / {day.low}°
              </span>
              <span className={`px-1.5 py-0.5 rounded ${day.precipitation_chance > 30 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                💧 {day.precipitation_chance}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Work impact warning */}
      {isBadWeather && (
        <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-xs text-red-700 font-semibold">
            ⚠️ Conditions météo défavorables pour les travaux de construction
          </p>
        </div>
      )}
    </div>
  )
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  return directions[Math.round(degrees / 22.5) % 16]
}

function getImpactOnWork(eventType: string, temp: number): 'minimal' | 'moderate' | 'severe' {
  if (eventType.toLowerCase().includes('extreme') || eventType.toLowerCase().includes('warning')) {
    return 'severe'
  }
  if (eventType.toLowerCase().includes('advisory') || Math.abs(temp) > 30) {
    return 'moderate'
  }
  return 'minimal'
}

export default WidgetWeather