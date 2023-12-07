<template>
  <div class="container" ref="container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'
import * as d3 from 'd3-geo'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

//场景初始化
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
camera.position.z = 50

const renderer = new THREE.WebGLRenderer({
  //设置抗锯齿
  antialias: true,
  //对数深度缓冲区
  logarithmicDepthBuffer: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)

const container = ref()

//添加控制器
const controls = new OrbitControls(camera, renderer.domElement)

controls.enableDamping = true

const render = () => {
  controls.update()
  renderer.render(scene, camera)
  //moveOnCurve()
  requestAnimationFrame(render)
}

onMounted(() => {
  container.value?.appendChild(renderer.domElement)
  render()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {})
})

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

fetch('./b.json')
  .then((res) => res.json())
  .then((data) => {
    initLine(data)
  })

fetch('./中华人民共和国.json')
  .then((res) => res.json())
  .then((data) => {
    //initMap(data)
  })

let curve = null
// 墨卡托投影转换
const projection = d3.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0])
const initMap = (chinaJson) => {
  const map = new THREE.Object3D()
  chinaJson.features.forEach((elem) => {
    // 定一个省份3D对象
    const province = new THREE.Object3D()
    // 每个的 坐标 数组
    const coordinates = elem.geometry.coordinates
    // 循环坐标数组
    coordinates.forEach((multiPolygon) => {
      const points = []
      const shape = new THREE.Shape()
      if (elem.geometry.type === 'MultiPolygon') {
        multiPolygon.forEach((polygon) => {
          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i])
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y)
            points.push(new THREE.Vector3(x, -y, 4.01))
          }
        })
      } else if (elem.geometry.type === 'Polygon') {
        for (let i = 0; i < multiPolygon.length; i++) {
          const [x, y] = projection(multiPolygon[i])
          if (i === 0) {
            shape.moveTo(x, -y)
          }
          shape.lineTo(x, -y)
          points.push(new THREE.Vector3(x, -y, 4.01))
        }
      }

      const lineMaterial = new THREE.LineBasicMaterial({ color: '#87FEFF' })
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const extrudeSettings = { depth: 4, bevelEnabled: false }
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      const material = new THREE.MeshBasicMaterial({ color: '#161E46', transparent: true, opacity: 0.8 })
      const mesh = new THREE.Mesh(geometry, material)
      const line = new THREE.Line(lineGeometry, lineMaterial)
      province.add(mesh)
      province.add(line)
    })
    // 将geo的属性放到省份模型中
    province.properties = elem.properties
    map.add(province)
  })
  scene.add(map)
}

const initLine = (chinaJson) => {
  const map = new THREE.Object3D()
  // 墨卡托投影转换
  const points = []
  chinaJson.features.forEach((elem) => {
    // 每个的 坐标 数组
    // const coordinates = elem.geometry.coordinates
    // if (elem.properties.NAME == '国界线' || elem.properties.NAME == '海岸线' || elem.properties.NAME == '未定国界') {
    //   // 循环坐标数组
    //   coordinates.forEach((multiPolygon) => {
    //     const [x, y] = projection(multiPolygon)
    //     points.push(new THREE.Vector3(x, -y, 4.01))
    //   })
    // }
    const [x, y] = projection(elem.geometry.coordinates)
    points.push(new THREE.Vector3(x, -y, 4.01))
  })
  curve = new THREE.CatmullRomCurve3(points)
  curve.curveType = 'catmullrom'
  curve.closed = false //设置是否闭环
  curve.tension = 0.5

  const pointss = curve.getPoints(1500)

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  var material = new THREE.LineBasicMaterial({
    color: 0x006666, //轨迹颜色
  })
  //线条模型对象
  var line = new THREE.Line(geometry, material)
  scene.add(line)

  // const ver = new Float32Array(points.length)

  // for (let i = 0; i < pointss.length; i++) {
  //   ver[i] = i
  // }
  // geometry.setAttribute('aIndex', new THREE.BufferAttribute(ver, 1))

  // const material = new THREE.ShaderMaterial({
  //   transparent: true,
  //   uniforms: {
  //     uTime: { value: 0 },
  //     uLength: {
  //       value: points.length,
  //     },
  //     uScale: {
  //       value: 0.1,
  //     },
  //   },
  //   vertexShader: `
  // attribute float aIndex;
  // uniform float uTime;
  // uniform float uLength;
  // uniform float uScale;
  // varying float vSize;
  // void main() {
  //   vec4 modelPosition = modelMatrix * vec4( position, 1.0 ); // 顶点坐标
  //   gl_Position =  projectionMatrix * viewMatrix * modelPosition;
  // // 当前点的大小减去当前时间,所有点会同时越来越小,当点小于0的时候,立即将该点目前的大小(负值)加上最大的点值
  //   float size = aIndex  - uTime;
  //   // 例如当前是第0个点,随着时间变大,点(负数+uLength)越来越小,
  //   // 例如当前是第10个点,随着时间变大点越来越小,当点成负数后(负数+uLength),会忽然变成最大值,然后再次越来越小,
  //   // 以此类推
  //   if(size < 0.0) {
  //     size = size + uLength;
  //   }
  //   // vSize = (size) * uScale;
  //   vSize = (size - uLength / 2.0) * uScale; // 设置前二分之一的点为不可见
  //   gl_PointSize = vSize;
  // }
  // `,
  //   fragmentShader: `
  // varying float vSize;
  // uniform float uTime;
  // uniform float uLength;
  // uniform float uScale;
  // void main(){
  //   // 小于或者等于0的点设置透明度为0;
  //   if(vSize <= 0.0){
  //     gl_FragColor = vec4(1,1,0,0);
  //   }else{
  //     // 根据点的大小设置透明度,点越小越透明
  //     float opacity = uLength / 2.0 * uScale;
  //     gl_FragColor = vec4(1,1,0,vSize / opacity);
  //   }
  // }
  // `,
  // })

  // gsap.to(material.uniforms.uTime, {
  //   value: points.length,
  //   duration: 5,
  //   repeat: -1,
  // })

  // // 创建飞线物体
  // const mesh = new THREE.Points(geometry, material)
  // scene.add(mesh)
  //onst pointsx = curve.getPoints(1500)

  // const geometrys = new THREE.BufferGeometry().setFromPoints(pointsx)
  // const materials = new THREE.LineBasicMaterial({ color: 0xffffff })

  // // Create the final object to add to the scene
  // const curveObject = new THREE.Line(geometrys, materials)
  // scene.add(curveObject)
}

// 物体沿线移动方法
let progress = 0 // 物体运动时在运动路径的初始位置，范围0~1
const velocity = 0.002 // 影响运动速率的一个值，范围0~1，需要和渲染频率结合计算才能得到真正的速率
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const model = new THREE.Mesh(geometry, material)
scene.add(model)

function moveOnCurve() {
  if (curve == null || model == null) {
    console.log('Loading')
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
