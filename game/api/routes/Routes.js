export const Routes = {}

Routes.root = {
  path: () => '/',
  template: 'title',
  label: () => 'title',
  load: async function () {
    return import('../../ui/title/title')
  }
}