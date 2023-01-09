"use strict";

var queue = {};
var timer = 0;
var ctx = null;
var WIDTH = 90;
var HEIGHT = 300;
var badges = {};

Component({
  properties: {
    count: {
      type: Number,
      value: 0,
      observer: "likeChange"
    }
  },
  methods: {
    likeChange: function likeChange(newVal, oldVal) {
      if (newVal - oldVal > 0) {
        this.likeClick();
      }
    },
    likeClick: function likeClick() {
      var image1 = "./images/1.png";
      var image2 = "./images/2.png";
      var image3 = "./images/3.png";
      var image4 = "./images/4.png";
      var image5 = "./images/5.png";
      var anmationData = {
        id: new Date().getTime(),
        timer: 0,
        opacity: 0,
        pathData: this.generatePathData(),
        image: [image1, image2, image3, image4, image5],
        imageIndex: Math.floor(Math.random() * (4 - 0 + 1)) + 0,
        factor: {
          speed: 0.01, // 运动速度，值越小越慢
          t: 0 //  贝塞尔函数系数
        }
      };
      if (Object.keys(queue).length > 0) {
        queue[anmationData.id] = anmationData;
      } else {
        queue[anmationData.id] = anmationData;
        this.bubbleAnimate();
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
    bubbleAnimate: function bubbleAnimate() {
      var _this = this;

      Object.keys(queue).forEach(function (key) {
        var anmationData = queue[+key];

        var _updatePath = _this.updatePath(anmationData.pathData, anmationData.factor),
            x = _updatePath.x,
            y = _updatePath.y;

        var speed = anmationData.factor.speed;
        anmationData.factor.t += speed;
        // console.log('imageIndex=>', anmationData.imageIndex);
        ctx.drawImage(anmationData.image[anmationData.imageIndex], x, y, 30, 30);
        if (anmationData.factor.t > 1) {
          delete queue[anmationData.id];
        }
      });
      ctx.draw();
      if (Object.keys(queue).length > 0) {
        timer = setTimeout(function () {
          _this.bubbleAnimate();
        }, 20);
      } else {
        clearTimeout(timer);
        ctx.draw(); // 清空画面
      }
    }
  },

  ready: function ready() {
    ctx = swan.createCanvasContext("bubble", this);
  },
  detached: function detached() {
    if (timer) {
      clearTimeout(timer);
    }
  }
});