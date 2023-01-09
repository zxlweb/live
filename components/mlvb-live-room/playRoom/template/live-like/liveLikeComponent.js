var queue = {};
var timer = 0;
var ctx = null;
var canvas = null;
var WIDTH = 90;
var HEIGHT = 300;
var badges = {};
const DELAY = 2000;
const util = require('../../utils/util')


Component({
  properties: {
    count: {
      type: Number,
      value: 0,

    }
  },
  observers: {
    "count": function (newVal) {
      this.setData({
        parseNum: newVal
      })

      if (newVal == 0) return

      this.likeClick();
    }
  },
  data: {
    realWidth: '90',
    realHeight: '300',
    likeImgList: [],
    parseNum: 0,
    aniFrameId: null
  },
  methods: {

    likeClick: function likeClick() {

      let parseNum = this.data.parseNum;

      this.setData({
        parseNum
      })

      this.debounceInner()


      var anmationData = {
        id: new Date().getTime(),
        timer: 0,
        opacity: 0,
        pathData: this.generatePathData(),
        image: this.data.likeImgList,
        imageIndex: Math.floor(Math.random() * (4 - 0 + 1)) + 0,
        factor: {
          speed: this.getRandom(0.01, 0.014), // 运动速度，值越小越慢
          t: 0 //  贝塞尔函数系数
        },
        width: 30 * this.getRandom(0.9, 1.1)
      };
      if (Object.keys(queue).length > 0) {
        queue[anmationData.id] = anmationData;
      } else {
        queue[anmationData.id] = anmationData;

        this.bubbleAnimate()
        // let aniFrameId = canvas.requestAnimationFrame(() => {
        //   this.bubbleAnimate();
        // });
        // this.setData({
        //   aniFrameId
        // })
      }
    },
    getRandom: function getRandom(min, max) {
      return Math.random() * (max - min) + min;
    },
    getRandomInt: function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    generatePathData: function generatePathData() {
      var p0 = { x: 40, y: 400 };
      var p1 = {
        x: this.getRandom(20, 30),
        y: this.getRandom(200, 300)
      };
      var p2 = {
        x: this.getRandom(0, 80),
        y: this.getRandom(100, 200)
      };
      var p3 = {
        x: this.getRandom(0, 80),
        y: this.getRandom(0, 50)
      };
      return [p0, p1, p2, p3];
    },
    updatePath: function updatePath(data, factor) {
      var p0 = data[0]; // 三阶贝塞尔曲线起点坐标值
      var p1 = data[1]; // 三阶贝塞尔曲线第一个控制点坐标值
      var p2 = data[2]; // 三阶贝塞尔曲线第二个控制点坐标值
      var p3 = data[3]; // 三阶贝塞尔曲线终点坐标值

      var t = factor.t;

      /*计算多项式系数*/
      var cx1 = 3 * (p1.x - p0.x);
      var bx1 = 3 * (p2.x - p1.x) - cx1;
      var ax1 = p3.x - p0.x - cx1 - bx1;

      var cy1 = 3 * (p1.y - p0.y);
      var by1 = 3 * (p2.y - p1.y) - cy1;
      var ay1 = p3.y - p0.y - cy1 - by1;

      /*计算xt yt的值 */
      var x = ax1 * (t * t * t) + bx1 * (t * t) + cx1 * t + p0.x;
      var y = ay1 * (t * t * t) + by1 * (t * t) + cy1 * t + p0.y;
      return {
        x: x,
        y: y
      };
    },
    bubbleAnimate() {
      var { realWidth, realHeight } = this.data;
      Object.keys(queue).forEach(key => {
        const anmationData = queue[+key];
        const { x, y } = this.updatePath(
          anmationData.pathData,
          anmationData.factor
        );
        const speed = anmationData.factor.speed;
        anmationData.factor.t += speed;
        ctx.drawImage(anmationData.image[anmationData.imageIndex], x, y, 30, 30);
        if (anmationData.factor.t > 1) {
          delete queue[anmationData.id];
        }
        //当气泡超出画布边界，会产生截断的效果，需要删除气泡  防止内存泄漏
        if (y > realHeight) {

          delete queue[anmationData.id];
        }

        if (x < anmationData.width / 2) {

          delete queue[anmationData.id];
        }

      });


      if (Object.keys(queue).length > 0) {

        // timer = setTimeout(() => {
        //   ctx.clearRect(0, 0, realWidth, realHeight)
        //   this.bubbleAnimate();
        // }, 20);

        timer = canvas.requestAnimationFrame(() => {

          ctx.clearRect(0, 0, realWidth, realHeight)

          this.bubbleAnimate();
        });

      } else {
        // clearTimeout(timer);
        // ctx.clearRect(0, 0, realWidth, realHeight)
        ctx.clearRect(0, 0, realWidth, realHeight)
        queue = {}
        cancelAnimationFrame(timer)




      }
    },
    debounceOuter() {
      return util.debounce(this.handleLike, DELAY)
    },
    debounceInner() { },
    handleLike() {
      this.triggerEvent('likeOver', this.data.parseNum)
    },
  },
  lifetimes: {
    created: function () {

      //在组件实例刚刚被创建时执行
    },
    attached: function () {
      //在组件实例进入页面节点树时执行
    },
    ready: function () {

      // ctx = wx.createCanvasContext("bubble", this);
      this.debounceInner = this.debounceOuter()

      console.log(this.data.count, 'dd')
      const query = this.createSelectorQuery().in(this);
      query.select('#bubble').fields({ node: true, size: true }).exec((res) => {

        canvas = res[0].node;
        ctx = canvas.getContext('2d');

        // 缩放canvs画布解决高清屏幕模糊问题
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        this.setData({
          realHeight: res[0].height,
          realWidth: res[0].width
        })
        ctx.scale(dpr, dpr);
        var likeImgList = [];

        var imageSource = ["./images/1.png", "./images/2.png", "./images/3.png", "./images/4.png", "./images/5.png"]
        for (let i = 0; i < imageSource.length; i++) {
          var likeImgae = canvas.createImage();
          likeImgae.src = imageSource[i];
          likeImgae.onload = () => {
            likeImgList.push(likeImgae);
            this.setData({
              likeImgList
            })
            console.log('imglist', likeImgList)

          };
        }


      })

    },


    moved: function () {
      // 在组件实例被移动到节点树另一个位置时执行
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      if (timer) {
        clearTimeout(timer);
      }
      // const { realHeight, realWidth } = this.data;
      // if (this.data.aniFrameId) {
      //   ctx.clearRect(0, 0, realWidth, realHeight);
      //   canvas.cancelAnimationFrame(this.aniFrameId);
      //   this.setData({
      //     aniFrameId: null
      //   })

      // }
      // queue = null
    },
    error: function () {
      // 每当组件方法抛出错误时执行
    }
  }

});