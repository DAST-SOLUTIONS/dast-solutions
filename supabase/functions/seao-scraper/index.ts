// supabase/functions/seao-scraper/index.ts
// Edge Function pour récupérer les appels d'offres SEAO
// Déployer avec: supabase functions deploy seao-scraper

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Catégories SEAO ciblées avec leurs codes UNSPSC
const CATEGORIES_CIBLES = {
  batiment: {
    label: 'Bâtiments',
    unspsc: ['72101500', '72102900', '72103300', '72111000', '72121000', '72131000', '72141000', '72151000'],
    keywords: ['bâtiment', 'batiment', 'construction', 'rénovation', 'agrandissement', 'école', 'hôpital', 
               'édifice', 'immeuble', 'maçonnerie', 'toiture', 'structure', 'fondation', 'charpente']
  },
  genie_civil: {
    label: 'Ouvrages de génie civil',
    unspsc: ['72141100', '72141200', '72141300', '72141400', '72141500'],
    keywords: ['génie civil', 'infrastructure', 'route', 'pont', 'aqueduc', 'égout', 'voirie', 
               'excavation', 'terrassement', 'asphaltage', 'drainage', 'conduite', 'station', 'usine']
  },
  architecture: {
    label: "Services d'architecture et d'ingénierie",
    unspsc: ['81101500', '81101600', '81101700', '81102200', '81102201'],
    keywords: ['architecture', 'ingénierie', 'ingenierie', 'conception', 'plans', 'études', 'design', 
               'architectural', 'structural', 'mécanique', 'électrique', 'civil', 'consultant', 'professionnel']
  },
  services: {
    label: 'Services de soutien professionnel',
    unspsc: ['80101500', '80101600', '80111600', '80111700'],
    keywords: ['estimation', 'gestion de projet', 'surveillance', 'contrôle', 'coût', 'cout', 'budget', 
               'planification', 'coordination', 'soutien', 'administratif', 'expert', 'conseil']
  }
}

// URL de recherche SEAO
const SEAO_SEARCH_URL = 'https://seao.ca/OpportunitiesAdvancedSearch/OpportunitiesAdvancedSearchPage.aspx'
const SEAO_BASE_URL = 'https://seao.ca'

interface AppelOffre {
  numero_seao: string
  titre: string
  description: string
  organisme: string
  organisme_type: string
  categorie: string
  sous_categorie: string
  region: string
  ville: string
  date_publication: string
  date_fermeture: string
  estimation_min: number | null
  estimation_max: number | null
  budget_affiche: string
  exigences_rbq: string[]
  url_seao: string
  status: string
}

// Fonction pour déterminer la catégorie
function categoriserAppel(titre: string, description: string, unspscCode?: string): string {
  const texte = `${titre} ${description}`.toLowerCase()
  
  // Vérifier par code UNSPSC d'abord
  if (unspscCode) {
    for (const [cat, config] of Object.entries(CATEGORIES_CIBLES)) {
      if (config.unspsc.some(code => unspscCode.startsWith(code.substring(0, 4)))) {
        return cat
      }
    }
  }
  
  // Sinon par mots-clés
  for (const [cat, config] of Object.entries(CATEGORIES_CIBLES)) {
    if (config.keywords.some(kw => texte.includes(kw.toLowerCase()))) {
      return cat
    }
  }
  
  return 'autre'
}

// Scraper la liste des appels d'offres
async function scrapeSeaoList(): Promise<AppelOffre[]> {
  const appels: AppelOffre[] = []
  
  try {
    // Construire l'URL avec les filtres pour nos catégories
    // Types de contrats: Construction (1), Services professionnels (3)
    const searchParams = new URLSearchParams({
      'ContractType': '1,3', // Construction et Services
      'Status': '1', // Ouvert
      'SortColumn': 'ClosingDate',
      'SortOrder': 'ASC'
    })
    
    const response = await fetch(`${SEAO_SEARCH_URL}?${searchParams}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) {
      throw new Error('Impossible de parser le HTML')
    }
    
    // Chercher les lignes du tableau des résultats
    const rows = doc.querySelectorAll('table.results-table tr, .opportunity-row, [data-opportunity-id]')
    
    for (const row of rows) {
      try {
        // Extraire les données de chaque ligne
        const cells = row.querySelectorAll('td')
        if (cells.length < 4) continue
        
        const linkElement = row.querySelector('a[href*="OpportunityDetailPage"]')
        if (!linkElement) continue
        
        const href = linkElement.getAttribute('href') || ''
        const numeroMatch = href.match(/OpportunityId=(\d+)/)
        const numero = numeroMatch ? `SEAO-${numeroMatch[1]}` : ''
        
        if (!numero) continue
        
        const titre = linkElement.textContent?.trim() || ''
        const organisme = cells[1]?.textContent?.trim() || ''
        const region = cells[2]?.textContent?.trim() || ''
        const dateFermetureText = cells[3]?.textContent?.trim() || ''
        
        // Parser la date de fermeture
        let dateFermeture = new Date()
        dateFermeture.setDate(dateFermeture.getDate() + 30)
        
        const dateMatch = dateFermetureText.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/)
        if (dateMatch) {
          dateFermeture = new Date(dateMatch[0])
        }
        
        // Catégoriser
        const categorie = categoriserAppel(titre, '', '')
        
        // Filtrer: garder seulement nos catégories
        if (categorie === 'autre') continue
        
        appels.push({
          numero_seao: numero,
          titre,
          description: '',
          organisme,
          organisme_type: determinerTypeOrganisme(organisme),
          categorie,
          sous_categorie: CATEGORIES_CIBLES[categorie as keyof typeof CATEGORIES_CIBLES]?.label || '',
          region: normaliserRegion(region),
          ville: '',
          date_publication: new Date().toISOString(),
          date_fermeture: dateFermeture.toISOString(),
          estimation_min: null,
          estimation_max: null,
          budget_affiche: '',
          exigences_rbq: [],
          url_seao: `${SEAO_BASE_URL}${href}`,
          status: 'ouvert'
        })
        
      } catch (err) {
        console.error('Erreur parsing row:', err)
        continue
      }
    }
    
  } catch (error) {
    console.error('Erreur scraping SEAO:', error)
  }
  
  return appels
}

// Scraper les détails d'un appel d'offres
async function scrapeSeaoDetails(url: string): Promise<Partial<AppelOffre>> {
  const details: Partial<AppelOffre> = {}
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    })
    
    if (!response.ok) return details
    
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) return details
    
    // Extraire description
    const descElement = doc.querySelector('.description, #description, [data-field="description"]')
    if (descElement) {
      details.description = descElement.textContent?.trim() || ''
    }
    
    // Extraire budget estimé
    const budgetElement = doc.querySelector('.budget, #estimatedValue, [data-field="budget"]')
    if (budgetElement) {
      const budgetText = budgetElement.textContent || ''
      const numbers = budgetText.match(/[\d,]+/g)
      if (numbers && numbers.length >= 1) {
        details.estimation_min = parseInt(numbers[0].replace(/,/g, ''))
        details.estimation_max = numbers[1] ? parseInt(numbers[1].replace(/,/g, '')) : details.estimation_min
        details.budget_affiche = budgetText.trim()
      }
    }
    
    // Extraire exigences RBQ
    const rbqElements = doc.querySelectorAll('.rbq-requirement, [data-field="rbq"]')
    const exigences: string[] = []
    rbqElements.forEach(el => {
      const text = el.textContent?.trim()
      if (text) exigences.push(text)
    })
    if (exigences.length > 0) {
      details.exigences_rbq = exigences
    }
    
  } catch (error) {
    console.error('Erreur scraping details:', error)
  }
  
  return details
}

// Helpers
function determinerTypeOrganisme(nom: string): string {
  const nomLower = nom.toLowerCase()
  if (nomLower.includes('ville') || nomLower.includes('municipal')) return 'Municipal'
  if (nomLower.includes('ministère') || nomLower.includes('gouvernement')) return 'Provincial'
  if (nomLower.includes('canada') || nomLower.includes('fédéral')) return 'Fédéral'
  if (nomLower.includes('ciusss') || nomLower.includes('cisss') || nomLower.includes('scolaire') || 
      nomLower.includes('université') || nomLower.includes('cégep')) return 'Parapublic'
  return 'Autre'
}

function normaliserRegion(region: string): string {
  const regions: Record<string, string> = {
    'mtl': 'Montréal', 'montreal': 'Montréal',
    'qc': 'Québec', 'quebec': 'Québec',
    'laval': 'Laval',
    'monteregie': 'Montérégie', 'montérégie': 'Montérégie',
    'laurentides': 'Laurentides',
    'lanaudiere': 'Lanaudière', 'lanaudière': 'Lanaudière',
    'outaouais': 'Outaouais',
    'estrie': 'Estrie',
    'mauricie': 'Mauricie',
    'centre-du-quebec': 'Centre-du-Québec', 'centre-du-québec': 'Centre-du-Québec',
    'chaudiere-appalaches': 'Chaudière-Appalaches',
    'saguenay': 'Saguenay–Lac-Saint-Jean',
    'bas-saint-laurent': 'Bas-Saint-Laurent',
    'abitibi': 'Abitibi-Témiscamingue',
    'cote-nord': 'Côte-Nord', 'côte-nord': 'Côte-Nord',
    'nord-du-quebec': 'Nord-du-Québec',
    'gaspesie': 'Gaspésie–Îles-de-la-Madeleine'
  }
  
  const regionLower = region.toLowerCase().trim()
  return regions[regionLower] || region || 'Québec'
}

// Handler principal
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
    const detailUrl = url.searchParams.get('url')
    
    let data: any = null
    
    if (action === 'details' && detailUrl) {
      // Récupérer les détails d'un appel spécifique
      data = await scrapeSeaoDetails(detailUrl)
    } else {
      // Récupérer la liste des appels d'offres
      data = await scrapeSeaoList()
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        count: Array.isArray(data) ? data.length : 1,
        data,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    console.error('Erreur:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
