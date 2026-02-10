// Schema Selector - Chip-based UI for selecting analysis schemas
import { AnalysisSchema } from '../../types/analysis-schema'

interface SchemaSelectorProps {
  schemas: AnalysisSchema[]
  selectedSchemas: string[] // schema IDs
  onSelectionChange: (selectedIds: string[]) => void
  loading?: boolean
}

export const SchemaSelector = ({
  schemas,
  selectedSchemas,
  onSelectionChange,
  loading = false
}: SchemaSelectorProps) => {
  const toggleSchema = (schemaId: string) => {
    if (selectedSchemas.includes(schemaId)) {
      onSelectionChange(selectedSchemas.filter(id => id !== schemaId))
    } else {
      onSelectionChange([...selectedSchemas, schemaId])
    }
  }

  const getSchemaColor = (schemaId: string): string => {
    // Assign colors based on schema type
    const colorMap: Record<string, string> = {
      '결핍': 'pink',
      'TKI': 'blue',
      'D&D': 'purple',
      '성장': 'green',
      '방어': 'orange',
      '신념': 'cyan',
      '동기': 'yellow'
    }

    for (const [key, color] of Object.entries(colorMap)) {
      if (schemaId.includes(key)) return color
    }

    return 'slate'
  }

  const getColorClasses = (color: string, selected: boolean) => {
    const baseClasses = 'transition-all duration-200'
    
    if (selected) {
      switch (color) {
        case 'pink':
          return `${baseClasses} bg-pink-500/20 border-pink-500 text-pink-300 shadow-lg shadow-pink-500/20`
        case 'blue':
          return `${baseClasses} bg-blue-500/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20`
        case 'purple':
          return `${baseClasses} bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/20`
        case 'green':
          return `${baseClasses} bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/20`
        case 'orange':
          return `${baseClasses} bg-orange-500/20 border-orange-500 text-orange-300 shadow-lg shadow-orange-500/20`
        case 'cyan':
          return `${baseClasses} bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20`
        case 'yellow':
          return `${baseClasses} bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-lg shadow-yellow-500/20`
        default:
          return `${baseClasses} bg-slate-500/20 border-slate-500 text-slate-300 shadow-lg shadow-slate-500/20`
      }
    } else {
      return `${baseClasses} bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 hover:bg-slate-800/50`
    }
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-8 w-24 bg-slate-800 animate-pulse rounded-full"
          />
        ))}
      </div>
    )
  }

  if (schemas.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-lg">
        스키마 파일을 찾을 수 없습니다.<br />
        <span className="text-xs">77_Prompt_Library/1.Characters/캐릭터 엔진 스키마/ 경로를 확인해주세요.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {schemas.map(schema => {
        const isSelected = selectedSchemas.includes(schema.id)
        const color = getSchemaColor(schema.id)
        const colorClasses = getColorClasses(color, isSelected)

        return (
          <button
            key={schema.id}
            onClick={() => toggleSchema(schema.id)}
            className={`
              px-4 py-2 rounded-full text-xs font-bold border-2
              cursor-pointer select-none
              ${colorClasses}
            `}
            title={schema.description}
          >
            {schema.name}
          </button>
        )
      })}
    </div>
  )
}
