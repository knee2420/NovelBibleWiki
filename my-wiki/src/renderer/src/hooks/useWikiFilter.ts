import { useState, useMemo } from 'react'
import { WikiEntry, CharacterEntry } from '../types/wiki'

// 필터 상태 인터페이스
export interface FilterState {
  grades: string[]
  statuses: string[]
  affiliations: string[]
  roles: string[]
  tags: string[]
}

export const useWikiFilter = (data: WikiEntry[]) => {
  const [filters, setFilters] = useState<FilterState>({
    grades: [],
    statuses: [],
    affiliations: [],
    roles: [],
    tags: []
  })

  // 1. 필터 옵션 추출 (데이터 기반 동적 생성)
  const options = useMemo(() => {
    const grades = new Map<string, number>()
    const statuses = new Map<string, number>()
    const affiliations = new Map<string, number>()
    const roles = new Map<string, number>()
    const tags = new Map<string, number>()

    data.forEach((entry) => {
      if (entry.type === 'character') {
        const char = entry as CharacterEntry
        const info = char.info || {}

        // Grade
        if (info.grade) {
          grades.set(info.grade, (grades.get(info.grade) || 0) + 1)
        }
        // Status
        if (info.status) {
          statuses.set(info.status, (statuses.get(info.status) || 0) + 1)
        }
        // Affiliation
        if (info.affiliation) {
          affiliations.set(info.affiliation, (affiliations.get(info.affiliation) || 0) + 1)
        }
        // Role
        if (info.role) {
          roles.set(info.role, (roles.get(info.role) || 0) + 1)
        }
      }

      // Tags (Common)
      if (entry.tags) {
        entry.tags.forEach((tag) => {
          tags.set(tag, (tags.get(tag) || 0) + 1)
        })
      }
    })

    return {
      grades: Array.from(grades.entries()).map(([value, count]) => ({ value, count })),
      statuses: Array.from(statuses.entries()).map(([value, count]) => ({ value, count })),
      affiliations: Array.from(affiliations.entries()).map(([value, count]) => ({ value, count })),
      roles: Array.from(roles.entries()).map(([value, count]) => ({ value, count })),
      tags: Array.from(tags.entries()).map(([value, count]) => ({ value, count }))
    }
  }, [data])

  // 2. 필터링 로직
  const filteredData = useMemo(() => {
    return data.filter((entry) => {
      // 태그 필터 (Common)
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) => entry.tags?.includes(tag))
        if (!hasTag) return false
      }

      // 캐릭터 전용 필터
      if (entry.type === 'character') {
        const char = entry as CharacterEntry
        const info = char.info || {}

        if (filters.grades.length > 0 && !filters.grades.includes(info.grade || '')) return false
        if (filters.statuses.length > 0 && !filters.statuses.includes(info.status || ''))
          return false
        if (filters.affiliations.length > 0 && !filters.affiliations.includes(info.affiliation || ''))
          return false
        if (filters.roles.length > 0 && !filters.roles.includes(info.role || '')) return false
      }

      return true
    })
  }, [data, filters])

  // 3. 필터 조작 핸들러
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category]
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      return { ...prev, [category]: next }
    })
  }

  const resetFilters = () => {
    setFilters({
      grades: [],
      statuses: [],
      affiliations: [],
      roles: [],
      tags: []
    })
  }

  return {
    filters,
    options,
    filteredData,
    toggleFilter,
    resetFilters
  }
}
