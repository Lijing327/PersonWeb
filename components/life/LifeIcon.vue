<template>
  <svg
    class="life-icon"
    :class="`life-icon--${name}`"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <g
      stroke="currentColor"
      stroke-width="1.35"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="name === 'leaf'">
        <path d="M8 24c8-2 12-8 14-16-8 1-14 6-16 14Z" />
        <path d="M10 22c4-4 8-8 12-14" />
      </template>

      <template v-else-if="name === 'branch'">
        <path d="M6 26c6-8 8-12 10-20" />
        <path d="M14 12c-3-1-5 1-7 3" />
        <path d="M16 16c3-1 5 1 7 4" />
        <path d="M15 10c2-3 4-4 7-5" />
      </template>

      <template v-else-if="name === 'sneaker'">
        <path d="M5 20.5h16.5c2 0 3.5-1.2 3.5-3 0-2.4-2-3.2-4.2-3.6L18 12H11l-6 6.2V20.5Z" />
        <path d="M11 12.2v3.6M14.2 12.2v3.4M17.2 12.4v2.8" />
        <path d="M5 20.5h17" />
      </template>

      <template v-else-if="name === 'cards'">
        <rect x="8.5" y="8" width="12" height="16" rx="1.4" transform="rotate(-10 14.5 16)" />
        <rect x="10.5" y="8" width="12" height="16" rx="1.4" />
        <path d="M16.5 13.2v5.6M13.7 16h5.6" />
      </template>

      <template v-else-if="name === 'bike'">
        <circle cx="9" cy="21" r="4.2" />
        <circle cx="23" cy="21" r="4.2" />
        <path d="M9 21h6.2l3.2-7.2h3.6" />
        <path d="M15.2 21 12.4 12.6H9.6" />
        <path d="M18.4 13.8h4.2" />
      </template>

      <template v-else-if="name === 'bubble'">
        <path d="M8 10.5h16c1.4 0 2.5 1.1 2.5 2.5v7.2c0 1.4-1.1 2.5-2.5 2.5h-6.2L10.2 26v-3.3H8c-1.4 0-2.5-1.1-2.5-2.5V13c0-1.4 1.1-2.5 2.5-2.5Z" />
        <path d="M12 16h8M12 19h5" />
      </template>

      <template v-else-if="name === 'pencil'">
        <path d="M20.8 6.8 25.2 11.2 12.4 24H8v-4.4L20.8 6.8Z" />
        <path d="M18.6 9 23 13.4" />
        <path d="M8 19.6 12.4 24" />
      </template>

      <template v-else-if="name === 'vase'">
        <path d="M13 7.5c0 2.4-1.6 3.8-1.6 6.2 0 3.6 2.2 7.8 4.6 7.8s4.6-4.2 4.6-7.8c0-2.4-1.6-3.8-1.6-6.2" />
        <path d="M13 7.5h6" />
        <path d="M16 7.5c1.2-2.2 3.6-3.2 5.4-2.2" />
        <path d="M16 21.5v3.2" />
        <path d="M13.4 26.2h5.2" />
      </template>

      <template v-else>
        <path d="M8 24c8-2 12-8 14-16-8 1-14 6-16 14Z" />
        <path d="M10 22c4-4 8-8 12-14" />
      </template>
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  name?: string
}>(), {
  name: 'leaf'
})
</script>
