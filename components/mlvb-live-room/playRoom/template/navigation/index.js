/*
 * @Author: error: git config user.name && git config user.email & please set dead value or install git
 * @Date: 2022-05-18 10:00:11
 * @LastEditors: qingjiaowomissp zxlweb@163.com
 * @LastEditTime: 2022-11-30 17:17:30
 * @FilePath: \saas-miniprogram\template\navigation\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const app = getApp()

function updateStyle(el, styleObj) {

    for (sname in styleObj) {

        setProp(el, sname, '');
    }
}
function toObject(arr) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
        if (arr[i]) {
            Object.assign(res, arr[i]);
        }
    }
    return res
}
/*  */

var cssVarRE = /^--/;
var importantRE = /\s*!important$/;
var setProp = function (el, name, val) {
    /* istanbul ignore if */
    if (cssVarRE.test(name)) {
        el.style.setProperty(name, val);
    } else if (importantRE.test(val)) {
        el.style.setProperty(hyphenate(name), val.replace(importantRE, ''), 'important');
    } else {
        var normalizedName = normalize(name);
        if (Array.isArray(val)) {
            // Support values array created by autoprefixer, e.g.
            // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
            // Set them one by one, and the browser will only set those it can recognize
            for (var i = 0, len = val.length; i < len; i++) {
                el.style[normalizedName] = val[i];
            }
        } else {
            el.style[normalizedName] = val;
        }
    }
};
/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
});
/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps(options, vm) {
    var props = options.props;
    if (!props) { return }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
        i = props.length;
        while (i--) {
            val = props[i];
            if (typeof val === 'string') {
                name = camelize(val);
                res[name] = { type: null };
            } else {
                warn('props must be strings when using array syntax.');
            }
        }
    } else if (isPlainObject(props)) {
        for (var key in props) {
            val = props[key];
            name = camelize(key);
            res[name] = isPlainObject(val)
                ? val
                : { type: val };
        }
    } else {
        warn(
            "Invalid value for option \"props\": expected an Array or an Object, " +
            "but got " + (toRawType(props)) + ".",
            vm
        );
    }
    options.props = res;
}
/**
 * Create a cached version of a pure function.
 */
function cached(fn) {
    var cache = Object.create(null);
    return (function cachedFn(str) {
        var hit = cache[str];
        return hit || (cache[str] = fn(str))
    })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        headData: {
            type: Object,
            value: null,
        },
        styleInfo: {
            type: Object,
            value: null
        },
        headTmpName: {
            type: String,
            value: ''
        },
        fullScreen: {
            type: Boolean,
            value: false
        }

    },
    observers: {

        styleInfo(newVal) {
            var hyphenateRE = /\B([A-Z])/g;
            let resultString = '';
            if (newVal === null) {
                newVal = {}
            }

            let navStyle = Object.assign({ height: app.globalData.navBarHeight + 'px', backgroundColor: 'transparent' }, newVal)
            for (let item in navStyle) {
                let val = navStyle[item]
                if (hyphenateRE.test(item)) {
                    item = item.replace(/\B([A-Z])/g, '-$1').toLowerCase();
                }
                resultString += `${item}:${val};`
            }
            this.setData({
                styleString: resultString
            })

        },
        fullScreen(fullScreen) {
            console.log(fullScreen, 'fullScreen')
            this.setData({
                innerFullScreen: fullScreen
            })

        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        menuRight: '', // 胶囊距右方间距（方保持左、右间距一致）
        menuBotton: '',
        menuHeight: '',
        navPaddingRight: '',
        styleObj: {},
        styleString: '',
        innerFullScreen: false
    },
    lifetimes: {
        created: function () {

            //在组件实例刚刚被创建时执行
        },
        attached: function () {
            //在组件实例进入页面节点树时执行
        },
        ready: function () {
            this.setData({
                navBarHeight: app.globalData.navBarHeight,
                menuRight: app.globalData.menuRight,
                menuBotton: app.globalData.menuBotton,
                menuHeight: app.globalData.menuHeight,
                navPaddingRight: app.globalData.navPaddingRight,

            })
        },
        moved: function () {
            // 在组件实例被移动到节点树另一个位置时执行
        },
        detached: function () {
            // 在组件实例被从页面节点树移除时执行
        },
        error: function () {
            // 每当组件方法抛出错误时执行
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        goAnchorPage() {
            this.triggerEvent('extFullScreen')

            console.log('主播地址', `/pages/anchorHomepage/anchorHomepage?roomNo=${this.data.headData.roomNo}&memberId=${this.data.headData.memberId}&liveRecordNo=${this.data.headData.liveRecordNo}`)

            wx.navigateTo({
                url: `/pages/anchorHomepage/anchorHomepage?roomNo=${this.data.headData.roomNo}&memberId=${this.data.headData.memberId}&liveRecordNo=${this.data.headData.liveRecordNo}`
            })
        },
        showRankList() {
            this.triggerEvent('showRankList')

        },
        goback() {

            let pages = getCurrentPages() //获取加载的页面
            if (pages.length == 1 || pages.length == 2) {
                //扫码进入
                wx.navigateTo({
                    url: '/pages/index/index'
                })

            } else {
                //直播回放页特殊处理 返回首页
                if (this.data.headData.title == '直播回放' || this.data.headData.title == '直播间') {
                    wx.navigateTo({
                        url: '/pages/index/index'
                    })
                }
                else {
                    wx.navigateBack({
                        delta: 1
                    })
                }


            }


        },
        liveRoomGoback() {
            this.triggerEvent('exitLiveRoom')
            this.triggerEvent('extFullScreen')
            this.goback()
        }


    }
})