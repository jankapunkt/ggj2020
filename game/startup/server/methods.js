import { createMethods } from '../../api/factories/createMethods'
import { Game } from '../../api/game/Game'
import { createPublications } from '../../api/factories/createPublications'

createMethods(Game.methods)
createPublications(Game.publications)