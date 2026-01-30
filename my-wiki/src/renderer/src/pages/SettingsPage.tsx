import { Settings } from '../components/Default/Settings'
import { Database, FolderGit2, AlertTriangle } from 'lucide-react'

interface SettingsPageProps {
  onImportComplete: () => void
}

export const SettingsPage = ({ onImportComplete }: SettingsPageProps) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="mb-10 border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="text-blue-500" />
          시스템 설정 (Settings)
        </h2>
        <p className="text-slate-400 mt-2">
          옵시디언 볼트 연동 및 데이터베이스 초기화 설정을 관리합니다.
        </p>
      </div>

      {/* 설정 카드 영역 */}
      <div className="space-y-6">
        {/* 1. 데이터 연동 카드 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <FolderGit2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Obsidian Vault 연동</h3>
              <p className="text-sm text-slate-400 mt-1">
                로컬에 있는 옵시디언 폴더를 선택하여 데이터를 파싱합니다. <br />
                기존 데이터는 덮어씌워지며, 이미지 파일도 자동으로 변환됩니다.
              </p>
            </div>
          </div>

          {/* 기존 컴포넌트 재사용 */}
          <div className="bg-slate-950/50 p-6 rounded-lg border border-slate-800/50">
            <Settings onImportComplete={onImportComplete} />
          </div>
        </div>

        {/* 2. 주의사항 카드 (장식용) */}
        <div className="bg-amber-900/10 border border-amber-900/30 rounded-xl p-6 flex gap-4">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
          <div className="text-amber-200/80 text-sm">
            <strong className="block text-amber-500 mb-1">데이터 동기화 주의사항</strong>
            Obsidian에서 문서를 수정한 후에는 반드시 이곳에서 <strong>[데이터 덤프]</strong>를 다시
            실행해야 변경 사항이 반영됩니다. 실시간 동기화는 현재 지원하지 않습니다.
          </div>
        </div>
      </div>
    </div>
  )
}
