/*
 * @Author: error: git config user.name && git config user.email & please set dead value or install git
 * @Date: 2022-06-08 11:07:11
 * @LastEditors: error: git config user.name && git config user.email & please set dead value or install git
 * @LastEditTime: 2022-09-09 14:57:03
 * @FilePath: \saas-miniprogram\template\check-password\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */


const componentOptions = {
    // 组件选项
    options: {

    },
    behaviors: [],
    properties: {
        liveRecordNo: {
            type: String,
            value: ''
        },
        memberId: {
            type: Number,
            value: 0
        },
        roomName: {
            type: String,
            value: ''
        },
        roomNo: {
            type: String,
            value: ''
        },
        roomCoverUrl: {
            type: String,
            value: ''
        },
        videoUrl: {
            type: String,
            value: ''
        }

    },
    // 组件数据
    data: {
        recordPassword: ""
    },
    // 数据监听器
    observers: {},
    // 组件方法
    methods: {
        watchReplay() {

            wx.navigateTo({
                url: `/pages/liveReplay/liveReplay?roomNo=${this.data.roomNo}&liveRecordNo=${this.data.liveRecordNo}`,
            });
            this.triggerEvent('exitRoom')
        },
        closeModal() {

            let pages = getCurrentPages() //获取加载的页面
            // if (pages.length == 1) {
            //     //扫码进入
            //     wx.navigateTo({
            //         url: '/pages/index/index'
            //     })

            // } else {
            //     wx.navigateBack({
            //         delta: 1
            //     })
            // }

            wx.navigateTo({
                url: '/pages/index/index'
            })

            this.triggerEvent('exitRoom')
        }

    },
    // 组件生命周期
    lifetimes: {
        created() { },
        attached() {
            try {
                this.init()

            } catch (error) {

            }

        },
        ready() { },
        moved() { },
        detached() { },
    },

}

Component(componentOptions)