

<template>
  <div class="container" ref="container"></div>
</template>

<script setup>
import {onMounted, onUnmounted,ref} from "vue";
import * as THREE from 'three';
import * as d3 from "d3-geo";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";



//场景初始化
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
camera.position.z = 50;



const renderer = new THREE.WebGLRenderer({
  //设置抗锯齿
  antialias: true,
  //对数深度缓冲区
  logarithmicDepthBuffer: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );


const container = ref();


//添加控制器
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;



const render = () => {
  controls.update();
  renderer.render(scene, camera);
  //moveOnCurve();
  requestAnimationFrame(render);
};

onMounted(() => {
  container.value?.appendChild(renderer.domElement);
  render();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", () => {});
});


const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper )


fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json').then(res => res.json()).then(data => {
  initMap(data)
})



let curve = null;

const initMap =(chinaJson) =>{
   const map = new THREE.Object3D();
  // 墨卡托投影转换
  const projection = d3.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0]);

  chinaJson.features.forEach(elem => {
    // 定一个省份3D对象
    const province = new THREE.Object3D();
    // 每个的 坐标 数组
    const coordinates = elem.geometry.coordinates;
    // 循环坐标数组
    coordinates.forEach(multiPolygon => {
      const points = [];
      const shape = new THREE.Shape();
      if(elem.geometry.type === 'MultiPolygon'){

        multiPolygon.forEach(polygon => {
          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);
            points.push(new THREE.Vector3(x, -y, 4.01));
          }
        })
      }else {
        for (let i = 0; i < multiPolygon.length; i++) {
          const [x, y] = projection(multiPolygon[i]);
          if (i === 0) {
            shape.moveTo(x, -y);
          }
          shape.lineTo(x, -y);
          points.push(new THREE.Vector3(x, -y, 4.01));
        }
      }

      const lineMaterial = new THREE.LineBasicMaterial({ color: '#87FEFF' });
      const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
      const extrudeSettings = {depth: 4,bevelEnabled: false};
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      const material = new THREE.MeshBasicMaterial({ color: '#161E46', transparent: true, opacity: 0.8 })
      const mesh = new THREE.Mesh(geometry, material)
      const line = new THREE.Line(lineGeometry, lineMaterial)
      province.add(mesh)
      province.add(line)



      // curve = new THREE.CatmullRomCurve3(points)
      // curve.curveType = "catmullrom";
      // curve.closed = true;//设置是否闭环
      // curve.tension =  0.5;
      //
      //
      //
      // const pointsx = curve.getPoints(1500);
      //
      //
      // const geometrys = new THREE.BufferGeometry().setFromPoints(pointsx);
      // const materials = new THREE.LineBasicMaterial({ color: 0xffffff });
      //
      // // Create the final object to add to the scene
      // const curveObject = new THREE.Line(geometrys, materials);
      //
      // province.add(curveObject)

    })
    // 将geo的属性放到省份模型中
    province.properties = elem.properties;
    map.add(province);
  })
   scene.add( map )
 }
// 物体沿线移动方法

let progress = 0; // 物体运动时在运动路径的初始位置，范围0~1
const velocity = 0.02; // 影响运动速率的一个值，范围0~1，需要和渲染频率结合计算才能得到真正的速率
const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const model = new THREE.Mesh( geometry, material );
scene.add(model)
function moveOnCurve() {
  if (curve == null || model == null) {
    console.log("Loading")
  } else {
    if (progress <= 1 - velocity) {
      const point = curve.getPointAt(progress) //获取样条曲线指定点坐标

      const pointBox = curve.getPointAt(progress + velocity) //获取样条曲线指定点坐标

      if (point && pointBox) {
        model.position.set(point.x, point.y, point.z)
      }

      progress += velocity
    } else {
      progress = 0
    }
  }

}


</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;

  overflow: hidden;
}
</style>

