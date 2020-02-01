export const Routes = {}

Routes.root = {
  path: () => '/',
  template: 'title',
  label: () => 'title',
  load: async function () {
    return import('../../ui/title/title')
  }
}

Routes.game = {
  path: (gameId = ':gameId') => `/game/${gameId}`,
  template: 'game',
  label: () => 'game',
  load: async function () {
    return import('../../ui/game/game')
  }
}
