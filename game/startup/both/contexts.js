import { Game } from '../../api/game/Game'
import { createCollection } from '../../api/factories/createCollection'
import { createPublications } from '../../api/factories/createPublications'
import { createMethods } from '../../api/factories/createMethods'

createCollection(Game)
createMethods(Game.methods)
createPublications(Game.publications)