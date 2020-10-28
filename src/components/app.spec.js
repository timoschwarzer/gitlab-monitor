import { mount } from '@vue/test-utils'
import App from './app.vue'

describe('Mounted App', () => {
  const wrapper = mount(App);

  it('renders the healthcheck response', () => {
    expect(wrapper.html()).toContain('OK')
  })
})

