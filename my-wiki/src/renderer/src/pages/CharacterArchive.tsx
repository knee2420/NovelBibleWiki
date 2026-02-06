import { useState, useEffect, ReactElement } from 'react'
import { CharacterCard } from '../components/Character/CharacterCard'
import { CharacterDetail } from '../components/Character/CharacterDetail'
import { CharacterEntry } from '../types/wiki'
import { CharacterFieldConfig } from '../../../shared/types/field-config'

export default function CharacterArchive(): ReactElement {
  const [characters, setCharacters] = useState<CharacterEntry[]>([])
  const [config, setConfig] = useState<CharacterFieldConfig[]>([])
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)

  // 데이터 로드
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // @ts-ignore
        const [allData, configData] = await Promise.all([
             window.api.getWikiData(),
             window.api.getFieldConfig()
        ])
        
        const charData = (allData as CharacterEntry[]).filter((d) => d.type === 'character')
        setCharacters(charData)
        if (configData?.character) setConfig(configData.character)
      } catch (error) {
        console.error('Failed to fetch characters:', error)
      }
    }
    fetchData()
  }, [])
  const selectedCharacter = characters.find((c) => c.id === selectedCharId)

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Character Archive</h2>
        <p className="text-slate-400">인물 도감 및 상세 설정 데이터베이스</p>
      </header>

      {/* ▼ 1. 데이터가 없을 때 안내 메시지 */}
      {characters.length === 0 && (
        <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
          <p className="mb-4">데이터가 없습니다.</p>
          <p className="text-sm">
            사이드바 하단의
            <span className="text-blue-400 font-bold mx-1">[설정]</span>
            탭에서 데이터를 연동해주세요.
          </p>
        </div>
      )}

      {/* ▼ 2. 캐릭터 카드 리스트 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {characters.map((char) => (
          <CharacterCard key={char.id} data={char} config={config} onClick={setSelectedCharId} />
        ))}
      </div>

      {/* ▼ 3. 상세 보기 모달 */}
      {selectedCharacter && (
        <CharacterDetail data={selectedCharacter} config={config} onClose={() => setSelectedCharId(null)} />
      )}
    </div>
  )
}
