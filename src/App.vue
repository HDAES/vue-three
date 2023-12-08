<template>
  <div class="container" id="app-32-map"></div>
</template>

<script setup>
import {onMounted, onUnmounted} from "vue";
import ThreeHelper from "./utils/ThreeHelper.js";

let chinaMap = null

onMounted(async () =>{
  class ChinaMap extends  ThreeHelper {
    constructor(props) {
      super(props);
    }
  }

  chinaMap = new ChinaMap({
     container: '#app-32-map',
     axesVisible: true,
     controls: {
       enableDamping: true, // 阻尼
       maxPolarAngle: (Math.PI / 2) * 0.98,
     },
  })

  chinaMap.run()
  window.addEventListener('resize', () =>  chinaMap.resize())
})

onUnmounted(() =>{
  window.removeEventListener('resize', () =>chinaMap.resize());
})

</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>



