import { useState } from 'react'
import type { ReactElement } from 'react'
import { FolderOpen, RefreshCw, CheckCircle, Database } from 'lucide-react'

interface SettingsProps {
  onImportComplete: () => void
}

export const Settings = ({ onImportComplete }: SettingsProps): ReactElement => {
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelect = async () => {
    // @ts-ignore
    const selectedPath = await window.api.selectFolder()
    if (selectedPath) setPath(selectedPath)
  }

  const handleImport = async () => {
    if (!path) return
    setLoading(true)

    // 1. 경로 저장 (Main Process에 Vault 경로 등록)
    // @ts-ignore
    await window.api.importVault(path)

    // 2. 데이터 새로고침 알림
    setLoading(false)
    onImportComplete()
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          프로젝트 루트 연동 (Project Root)
        </h3>

        <p className="text-sm text-slate-400 mb-4">
          'NovelBibleWiki' 폴더(루트)를 선택해주세요. <br />
          <span className="text-xs text-slate-500">
            * 해당 경로 하위의 <code>10_Plot</code> 폴더와 <code>20_Wiki</code> 폴더를 자동으로
            인식합니다.
          </span>
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={path}
              readOnly
              placeholder="C:\...\NovelBibleWiki"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleSelect}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              경로 선택
            </button>
          </div>

          <button
            onClick={handleImport}
            disabled={!path || loading}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              !path
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {loading ? '데이터 분석 중...' : '전체 데이터 불러오기 (Load All)'}
          </button>
        </div>
      </div>
    </div>
  )
}
