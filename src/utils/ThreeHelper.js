import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {deepMerge, isType} from "./index.js";

export default class ThreeHelper {
    constructor(options = {}) {
        let defaultOptions = {
            isFull: true,
            container: null,
            width: window.innerWidth,
            height: window.innerHeight,
            bgColor: 0x000000,
            materialColor: 0xff0000,
            controls: {
                visible: true, // 是否开启
                enableDamping: true, // 阻尼
                autoRotate: false, // 自动旋转
                maxPolarAngle: Math.PI, // 相机垂直旋转角度的上限
            },
            statsVisible: true,
            axesVisible: true,
            axesHelperSize: 250, // 左边尺寸
        }

        this.options = deepMerge(defaultOptions,options)
        this.container = document.querySelector(this.options.container)
        this.options.width = this.container.offsetWidth;
        this.options.height = this.container.offsetHeight;
        this.scene = new THREE.Scene(); // 场景
        this.camera = null; // 相机
        this.renderer = null; // 渲染器
        this.mesh = null; // 网格
        this.animationStop = null; // 用于停止动画
        this.controls = null; // 轨道控制器
        this.stats = null; // 统计
        this.init();
    }

    init(){
        this.initStats();
        // 初始化相机
        this.initCamera();
        this.initModel()
        this.initRenderer()
        this.initLight()
        this.initAxes()
        this.initControls()

        // let gl = this.renderer.domElement.getContext('webgl');
        // gl && gl.getExtension('WEBGL_lose_context').loseContext();
        // console.log(this.renderer.info);
    }

    initStats(){
        if (!this.options.statsVisible) return false;
        this.stats = new Stats();
        this.container.appendChild(this.stats.dom);
    }

    initCamera(){
        let { width, height } = this.options;
        let rate = width / height;
        // 设置45°的透视相机,更符合人眼观察
        this.camera = new THREE.PerspectiveCamera(45, rate, 0.1, 1500);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    async initModel() {}

    /**
     * 初始化渲染器
     */
    initRenderer() {
        let { width, height, bgColor } = this.options;
        let renderer = new THREE.WebGLRenderer({
            antialias: true, // 锯齿
            //对数深度缓冲区
            logarithmicDepthBuffer: true,
        });
        // 设置canvas的分辨率
        renderer.setPixelRatio(window.devicePixelRatio);
        // 设置canvas 的尺寸大小
        renderer.setSize(width, height);
        // 设置背景色
        renderer.setClearColor(bgColor, 1);
        // 插入到dom中
        this.container.appendChild(renderer.domElement);
        this.renderer = renderer;
    }

    initLight() {
        //   平行光1
        let directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight1.position.set(400, 200, 200);
        //   平行光2
        let directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight2.position.set(-400, -200, -300);
        // 环境光
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        // 将光源添加到场景中
        this.addObject(directionalLight1);
        this.addObject(directionalLight2);
        this.addObject(ambientLight);
    }

    initAxes() {
        if (!this.options.axesVisible) return false;
        const axes = new THREE.AxesHelper(this.options.axesHelperSize);
        this.addObject(axes);
    }

    initControls() {
        try {
            let {
                controls: { enableDamping, autoRotate, visible, maxPolarAngle },
            } = this.options;
            if (!visible) return false;
            // 轨道控制器，使相机围绕目标进行轨道运动（旋转|缩放|平移）
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.maxPolarAngle = maxPolarAngle;
            this.controls.autoRotate = autoRotate;
            this.controls.enableDamping = enableDamping;
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * 添加对象到场景
     * @param {*} object  {} []
     */
    addObject(object) {
        if (isType('Array', object)) {
            this.scene.add(...object);
        } else {
            this.scene.add(object);
        }
    }


    /**
     * 运行
     */
    run() {
        this.loop();
    }
    // 循环
    loop() {
        this.animationStop = window.requestAnimationFrame(() => {
            this.loop();
        });
        // 这里是你自己业务上需要的code
        this.renderer.render(this.scene, this.camera);
        // 控制相机旋转缩放的更新
        if (this.options.controls.visible) this.controls.update();
        // 统计更新
        if (this.options.statsVisible) this.stats.update();

        //TWEEN.update();
    }


    /**
     * 重置
     */
    resize() {
        // 重新设置宽高
        this.options.width = this.container.innerWidth || window.innerWidth;
        this.options.height = this.container.innerHeight || window.innerHeight;

        this.renderer.setSize(this.options.width, this.options.height);
        // 重新设置相机的位置
        // 必須設置相機的比例，重置的時候才不会变形
        this.camera.aspect = this.options.width / this.options.height;

        // 渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
        // 但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
        // 如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
        this.camera.updateProjectionMatrix();
    }
}
