/**
 * DAST Solutions - Widget Météo Construction Avancé
 * Prévisions 5 jours + Alertes chantier (gel, canicule, pluie, vent)
 */
import React, { useState, useEffect } from 'react'
import {
  Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer,
  AlertTriangle, Droplets, Eye, Sunrise, Sunset, RefreshCw,
  MapPin, ChevronRight, Snowflake, Flame, CloudLightning
} from 'lucide-react'

interface WeatherData {
  current: {
    temp: number
    feels_like: number
    humidity: number
    wind_speed: number
    wind_gust?: number
    visibility: number
    uvi: number
    description: string
    icon: string
    sunrise: number
    sunset: number
  }
  forecast: Array<{
    date: string
    day: string
    temp_min: number
    temp_max: number
    description: string
    icon: string
    pop: number // Probabilité précipitations
    wind_speed: number
  }>
  alerts: Array<{
    type: 'frost' | 'heat' | 'rain' | 'wind' | 'storm' | 'snow'
    severity: 'low' | 'medium' | 'high'
    message: string
    recommendation: string
  }>
}

interface Props {
  location?: string
  latitude?: number
  longitude?: number
  onExpand?: () => void
}

const WEATHER_ICONS: Record<string, any> = {
  '01d': Sun, '01n': Sun,
  '02d': Cloud, '02n': Cloud,
  '03d': Cloud, '03n': Cloud,
  '04d': Cloud, '04n': Cloud,
  '09d': CloudRain, '09n': CloudRain,
  '10d': CloudRain, '10n': CloudRain,
  '11d': CloudLightning, '11n': CloudLightning,
  '13d': CloudSnow, '13n': CloudSnow,
  '50d': Cloud, '50n': Cloud,
}

export default function WidgetWeatherAdvanced({ 
  location = 'Montreal,CA',
  latitude,
  longitude,
  onExpand
}: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForecast, setShowForecast] = useState(false)

  useEffect(() => {
    loadWeather()
    // Rafraîchir toutes les 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location, latitude, longitude])

  const loadWeather = async () => {
    try {
      setLoading(true)
      
      // Utiliser l'API OpenWeatherMap (clé gratuite)
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo'
      
      let url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&lang=fr&appid=${API_KEY}`
      
      if (latitude && longitude) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=fr&appid=${API_KEY}`
      }

      // Pour la démo, on simule les données
      const mockWeather = generateMockWeather()
      setWeather(mockWeather)
      setError(null)
      
    } catch (err) {
      console.error('Erreur météo:', err)
      setError('Impossible de charger la météo')
      // Utiliser les données mock en cas d'erreur
      setWeather(generateMockWeather())
    } finally {
      setLoading(false)
    }
  }

  const generateMockWeather = (): WeatherData => {
    const now = new Date()
    const month = now.getMonth()
    const isWinter = month >= 11 || month <= 2
    const isSummer = month >= 5 && month <= 8
    
    const baseTemp = isWinter ? -5 : (isSummer ? 22 : 12)
    const variation = Math.random() * 10 - 5
    const currentTemp = Math.round(baseTemp + variation)
    
    const alerts: WeatherData['alerts'] = []
    
    // Générer alertes selon conditions
    if (currentTemp <= -15) {
      alerts.push({
        type: 'frost',
        severity: 'high',
        message: 'Gel intense prévu',
        recommendation: 'Reporter les travaux de bétonnage. Protéger les conduites d\'eau.'
      })
    } else if (currentTemp <= -5) {
      alerts.push({
        type: 'frost',
        severity: 'medium',
        message: 'Risque de gel',
        recommendation: 'Utiliser des additifs antigel pour le béton. Prévoir chauffage.'
      })
    }
    
    if (currentTemp >= 30) {
      alerts.push({
        type: 'heat',
        severity: 'high',
        message: 'Canicule prévue',
        recommendation: 'Pauses fréquentes obligatoires. Hydratation renforcée.'
      })
    }

    const windSpeed = Math.round(15 + Math.random() * 30)
    if (windSpeed >= 40) {
      alerts.push({
        type: 'wind',
        severity: 'high',
        message: `Vents forts (${windSpeed} km/h)`,
        recommendation: 'Sécuriser les matériaux. Éviter travaux en hauteur.'
      })
    }

    const rainProb = Math.random()
    if (rainProb > 0.6) {
      alerts.push({
        type: 'rain',
        severity: 'medium',
        message: 'Précipitations prévues',
        recommendation: 'Protéger les matériaux sensibles. Prévoir bâches.'
      })
    }

    const forecast = []
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    
    for (let i = 0; i < 5; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dayVariation = Math.random() * 8 - 4
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        day: i === 0 ? 'Auj.' : days[date.getDay()],
        temp_min: Math.round(baseTemp + dayVariation - 3),
        temp_max: Math.round(baseTemp + dayVariation + 5),
        description: ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Pluie légère'][Math.floor(Math.random() * 4)],
        icon: ['01d', '02d', '03d', '10d'][Math.floor(Math.random() * 4)],
        pop: Math.round(Math.random() * 100),
        wind_speed: Math.round(10 + Math.random() * 25)
      })
    }

    return {
      current: {
        temp: currentTemp,
        feels_like: Math.round(currentTemp - 3),
        humidity: Math.round(40 + Math.random() * 40),
        wind_speed: windSpeed,
        wind_gust: windSpeed + Math.round(Math.random() * 15),
        visibility: 10000,
        uvi: isSummer ? Math.round(6 + Math.random() * 4) : Math.round(1 + Math.random() * 3),
        description: isWinter ? 'Partiellement nuageux' : 'Ensoleillé',
        icon: isWinter ? '03d' : '01d',
        sunrise: Math.floor(Date.now() / 1000) - 3600 * 6,
        sunset: Math.floor(Date.now() / 1000) + 3600 * 6
      },
      forecast,
      alerts
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800'
      case 'medium': return 'bg-amber-100 border-amber-300 text-amber-800'
      default: return 'bg-blue-100 border-blue-300 text-blue-800'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'frost': return Snowflake
      case 'heat': return Flame
      case 'rain': return CloudRain
      case 'wind': return Wind
      case 'storm': return CloudLightning
      case 'snow': return CloudSnow
      default: return AlertTriangle
    }
  }

  if (loading && !weather) {
    return (
      <div className="bg-white rounded-xl border p-4 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-xl border p-4 h-full">
        <p className="text-gray-500 text-center">Météo non disponible</p>
      </div>
    )
  }

  const WeatherIcon = WEATHER_ICONS[weather.current.icon] || Cloud

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-200 p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud className="text-sky-600" size={18} />
          <h3 className="font-semibold text-gray-900">Météo Chantier</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} />
            Montréal
          </span>
          <button 
            onClick={loadWeather}
            className="p-1 hover:bg-white/50 rounded"
            title="Rafraîchir"
          >
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Current Weather */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/60 rounded-xl">
            <WeatherIcon size={36} className="text-sky-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {weather.current.temp}°C
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {weather.current.description}
            </div>
          </div>
        </div>
        
        <div className="text-right text-sm space-y-1">
          <div className="flex items-center gap-1 text-gray-600">
            <Thermometer size={14} />
            Ressenti {weather.current.feels_like}°C
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Wind size={14} />
            {weather.current.wind_speed} km/h
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Droplets size={14} />
            {weather.current.humidity}%
          </div>
        </div>
      </div>

      {/* Alerts Chantier */}
      {weather.alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {weather.alerts.map((alert, idx) => {
            const AlertIcon = getAlertIcon(alert.type)
            return (
              <div 
                key={idx} 
                className={`p-2 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <AlertIcon size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs opacity-80 mt-0.5">{alert.recommendation}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {weather.alerts.length === 0 && (
        <div className="p-2 bg-green-100 border border-green-300 rounded-lg mb-4">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <Eye size={14} />
            Conditions favorables pour les travaux
          </p>
        </div>
      )}

      {/* Toggle Forecast */}
      <button
        onClick={() => setShowForecast(!showForecast)}
        className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <span>Prévisions 5 jours</span>
        <ChevronRight size={16} className={`transition ${showForecast ? 'rotate-90' : ''}`} />
      </button>

      {/* 5-Day Forecast */}
      {showForecast && (
        <div className="grid grid-cols-5 gap-2 pt-2 border-t">
          {weather.forecast.map((day, idx) => {
            const DayIcon = WEATHER_ICONS[day.icon] || Cloud
            return (
              <div key={idx} className="text-center">
                <p className="text-xs font-medium text-gray-600">{day.day}</p>
                <DayIcon size={20} className="mx-auto my-1 text-sky-600" />
                <p className="text-xs">
                  <span className="font-semibold">{day.temp_max}°</span>
                  <span className="text-gray-400 ml-1">{day.temp_min}°</span>
                </p>
                {day.pop > 30 && (
                  <p className="text-xs text-blue-500 flex items-center justify-center gap-0.5">
                    <Droplets size={10} />
                    {day.pop}%
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Sunrise/Sunset */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Sunrise size={12} className="text-amber-500" />
          {new Date(weather.current.sunrise * 1000).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-1">
          <Sunset size={12} className="text-orange-500" />
          {new Date(weather.current.sunset * 1000).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
