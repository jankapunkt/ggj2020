import { Game } from '../../api/game/Game'
import { History } from '../../api/history/History'
import { createCollection } from '../../api/factories/createCollection'
createCollection(Game)
createCollection(History)