import { useMemo } from "react"
import { useProjects } from "@/hooks/useProjects"

export function useKpis() {
  const { projects } = useProjects()
  const totalProjectValue = useMemo(
    () => projects.map(p => Number(p.project_value) || 0).reduce((a,b)=>a+b, 0),
    [projects]
  )
  return {
    entrepreneursRbq: 15247,
    appelsOffres: 47,
    licencesActives: 14892,
    licencesSuspendues: 355,
    totalProjectValue,
  }
}
