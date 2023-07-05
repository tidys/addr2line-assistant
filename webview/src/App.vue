<template>
  <div class="root">
    <button @click="onClick">test</button>
    <Chart :data="polyPoints" :width="500" :height="500"></Chart>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import Chart from "./Chart.vue"
export default defineComponent({
  name: "main",
  components: { Chart },
  setup(props, ctx) {
    const polyPoints = ref<Array<number>>([]);
    let index = 0;

    for (let i = 0; i < 80; i++) {
      polyPoints.value.push(Math.random() * 300);
    }
    setInterval(() => {
      const y = Math.random() * 500;
      // const y = index * 1.4;
      polyPoints.value.push(y);
    }, 500)
    return {
      polyPoints,
      onClick() {
        const arr = [100, 50, 200, 20, 30, 0];
        const y = arr[index++];
        polyPoints.value.push(y);
      },
      onClickScrollEnd() {

      }
    };
  },
})
</script>



<style scoped></style>
