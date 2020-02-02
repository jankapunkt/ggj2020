import { Game } from '../../api/game/Game'
import { History } from '../../api/history/History'

import { createMethods } from '../../api/factories/createMethods'
import { createPublications } from '../../api/factories/createPublications'

createMethods(Game.methods)
createMethods(History.methods)

createPublications(Game.publications)
createPublications(History.publications)