import { useQuery } from '@tanstack/react-query'
import { strategicPillarsService } from '../services/strategicPillars.service'

const KEY = ['strategicPillars'] as const

export function useStrategicPillars() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => strategicPillarsService.listActive(),
    staleTime: 5 * 60_000,
  })
}
