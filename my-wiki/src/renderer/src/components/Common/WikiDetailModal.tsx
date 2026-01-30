import { WikiEntry, CharacterEntry, ItemEntry, LocationEntry, FactionEntry } from '../../types/wiki'
import { CharacterDetail } from '../Character/CharacterDetail'
import { ItemDetail } from '../Item/ItemDetail'
import { LocationDetail } from '../Location/LocationDetail'
import { FactionDetail } from '../Faction/FactionDetail'

interface Props {
  entry: WikiEntry
  onClose: () => void
}

export const WikiDetailModal = ({ entry, onClose }: Props) => {
  switch (entry.type) {
    case 'character':
      return <CharacterDetail data={entry as CharacterEntry} onClose={onClose} />
    case 'item':
      return <ItemDetail data={entry as ItemEntry} onClose={onClose} />
    case 'location':
      return <LocationDetail data={entry as LocationEntry} onClose={onClose} />
    case 'faction':
      return <FactionDetail data={entry as FactionEntry} onClose={onClose} />
    default:
      // 기본은 캐릭터 뷰어 사용 (혹은 간단한 기본 뷰어 제작 가능)
      return <CharacterDetail data={entry as CharacterEntry} onClose={onClose} />
  }
}
