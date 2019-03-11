<template>
  <svg :style="{width: size + 'px', height: size + 'px'}">
    <use
      v-bind="{
        'href': require('../assets/icons.svg') + '#' + name,
        'xlink:href': require('../assets/icons.svg') + '#' + name
      }"
    >
    </use>
  </svg>
</template>

<script>
  export default {
    name: 'gitlab-icon',
    props: {
      'name': {},
      'size': {
        default: 16
      }
    }
  }
</script>

<style lang="scss" scoped>
  svg {
    fill: currentColor;
  }
</style>
