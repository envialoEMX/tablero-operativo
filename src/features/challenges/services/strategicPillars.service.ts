import { supabase } from '@/lib/supabase/client'
import type { StrategicPillar } from '../types'

const PILLAR_SELECT = 'id,code,nombre,descripcion,sort_order,activo'

export const strategicPillarsService = {
  async listActive(): Promise<StrategicPillar[]> {
    const { data, error } = await supabase
      .from('strategic_pillars')
      .select(PILLAR_SELECT)
      .eq('activo', true)
      .order('sort_order', { ascending: true })
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data ?? []) as StrategicPillar[]
  },

  async mapByIds(ids: string[]): Promise<Record<string, Pick<StrategicPillar, 'id' | 'code' | 'nombre'>>> {
    const unique = [...new Set(ids.filter(Boolean))]
    if (unique.length === 0) return {}
    const { data, error } = await supabase
      .from('strategic_pillars')
      .select('id,code,nombre')
      .in('id', unique)
    if (error) throw error
    return Object.fromEntries(
      ((data ?? []) as Array<{ id: string; code: string; nombre: string }>).map((row) => [row.id, row])
    )
  },
}
