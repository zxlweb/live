const app = getApp();
const apiWork = require("../../utils/api");
const utils = require("../../utils/util")
const imgObj = require('../../utils/base64ImgFile');
const log = require("../../utils/log")
const liveroom = require("../mlbliveroomview/mlvbliveroomcore")


import TIM from 'tim-wx-sdk';
Page({

    data: {
        component: null,
        SDKAppID: '',
        liveRecordNo: '',
        roomNo: '',
        orgId: '',
        channelCode: '',
        memberId: '',
        introduceMemberId: '',
        styleArr: [{
            width: '200rpx',
            height: '200rpx',
            background: 'red'
        }],
        styleInfo: {},

        dmData: [],
        navBarHeight: '',//导航高度
        screenHeight: '',//屏幕高度

        //以下数据无需写入属性
        headData: {
            livePraiseList: [],
            title: '直播间',
            popularity: '',//人气值
            bizHeadImg: ''
        },//头部数据
        fullScreen: false,// '是否全屏'
        ctx: {},
        isBuying: '', //正在购买
        goodsNum: '', //商品列表数量
        resLiveRoomGoodsDto: null, //主推商品
        msg: '',//评论框输入的信息
        orgId: '', //组织id

        tim: null,//tim 对象
        userSig: '',//IM userSig
        memberId: '',//用户memberId
        SDKAppID: 1400528963,//IM SDKID
        roomNo: '',//直播间编号
        roomName: '',//直播间名称
        liveRecordNo: '', //直播间记录号
        lock: true,//直播间是否需要密码
        nickName: "张新玲", //微信用户信息


        codeurl: 'http://htd-government.oss-cn-shanghai.aliyuncs.com/base/1653285167553_57.28091779044622_6a0ffc99-3cdc-4056-8f1a-1c6700db4da3.png', //二维码
        goodPic: 'http://htd-government.oss-cn-shanghai.aliyuncs.com/base/1611110825920_31.831631001026217_6b675dac-b48d-47a7-bc85-cd8099cc813c.png', //商品图
        roomCoverUrl: '',//直播间封面信息

        attractModel: false,
        count: 0, //点赞
        rankingModel: false, //点赞排行榜
        goodsModel: false, //商品弹框
        isShowPopup1: false, //发送消息弹窗
        shareModel: false, //分享弹框
        shareInfo: {//分享数据
            roomName: '',
            shareUrl: '',
            roomCoverUrl: '',
            liveStartTime: ''
        },
        notice_content: '今天也要元气慢慢的哦',//直播间公告信息
        animationData: {}, //直播间公告动画
        tabIndex: '1', //1 点赞 2 排行榜
        goodLists: [],//直播间商品列表
        rankList: [],//直播间点赞排行榜
        specSkuId: '',//商品规格id
        isSaveImg: false,//
        isCanvasShow: false,
        saveShareImg: '',


        pullFlowUrl: '', // 拉流地址
        bulletData: [], // 直播弹幕
        dmData: [],//直播弹幕
        rollId: 'chat0', // 弹幕滚动id

        //12.27以后
        isFullScreen: false, // 是否为全面屏
        buyTime: null, // 购买显示时间




        isCutOff: false, // 直播间是否断流
        frozen: false,//直播间是否冻结
        pages: 1, // 商品列表分页
        checkPwdModal: false,//校验密码弹框

        type: 1,
        extralInfo: {},//传递给商品sku弹框的信息

        defaultGoodsImg: '',//默认商品图片
        initOver: false,//是否初始化完毕
        showBarrageCloud: false,//展示弹幕云
        liveMethod: '',//0 摄像头直播 dang1 视频直播 2 视频录播
        recordLiveVideoUrl: '',
        leaveType: 1,//断播的时候设置为1 避免重复发送退出直播间接口
        goodsLimit: false,//是否被限购
        selectedSkuId: '',//当前选中的skuId
        pim: ["push", "pop"],


    },
    onLoad: function (options) {

        if (app.globalData.initOver && ((options.wxShare && (options.orgId == wx.getStorageSync('orgId'))) || (!options.wxShare && !options.scene))) {
            //已经初始化的 不切店场景
            //1.分享进入且同一家【 orgId相等】
            //2.或者不是通过扫码进入也不是分享进入的
            this.onLoadCallback(options)
        } else {
            //扫码进入的都要切店 因为不知道orgId信息
            app.initAppData(options).then(() => {
                this.onLoadCallback(options)

            })
        }
    },
    onShow: function () {
        if (this.data.memberId && this.data.userSig) {
            if (this.data.tim) { this.readyMsg() }
            //  this.enterRoom();
            //优化 小窗口直播打开的时候如果直播关闭 需要弹出直播结束模态框
            this.getLiveRoomMainPageInfo().then((res) => {
                if (res.code == 0) {
                    // 直播间信息设置
                    switch (res.data.liveStatus) {
                        case '1001':
                            // 预告中

                            break;
                        case '1002':
                            // 直播中

                            // console.log('当前直播间拉流地址', this.pullFlowUrl)
                            break;
                        case '1003':
                            // 直播结束 
                            this.setData({
                                liveOverModal: true,
                                videoUrl: res.data.videoUrl
                            })

                            break;
                    }
                }

            })
        }

    },

    onHide: function () {
        this.tim && this.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this.receiveMsg);
        this.tim && this.tim.destroy();
        if (this.data.leaveType == 1 && this.data.liveStatus == '1002') {
            this.leaveRoom()
        }
    },
    onUnload: function () {
        this.tim && this.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this.receiveMsg);
        this.tim && this.tim.destroy();
        // if (this.data.leaveType == 1 && this.data.liveStatus == 2) {
        //     this.leaveRoom()
        // }

    },

    start: function () {
        var self = this;
        self.component = self.selectComponent("#id_liveroom")
        console.log('self.component: ', self.component)
        console.log('self:', self);
        self.component.start();
    },

    onLoadCallback(options) {
        console.log(options, 'options')
        if (options.scene) {
            this.isScanCode2(options).then((content) => {
                let { liveRecordNo, roomNo, introduceMemberId } = content.data;
                this.setData({
                    navBarHeight: app.globalData.navBarHeight + 20,
                    screenHeight: app.globalData.screenHeight,
                    liveRecordNo,
                    roomNo,
                    defaultGoodsImg: imgObj.defaultImgGoods,
                    introduceMemberId,
                    fullScreen: false,
                    extralInfo: {
                        liveRecordNo,
                        roomNo,
                        roomCoverUrl: ''
                    }
                })
                console.log(this.data, '直播间初始化数据')

                this.getToken(content.data)
            }).catch(() => {
                wx.showToast({
                    title: '获取扫码数据失败',
                    duration: 3000
                })
            })
        } else {
            let { liveRecordNo, roomNo } = options;
            this.setData({
                navBarHeight: app.globalData.navBarHeight + 20,
                screenHeight: app.globalData.screenHeight,
                liveRecordNo,
                roomNo,
                roomCoverUrl,
                defaultGoodsImg: imgObj.defaultImgGoods,
                introduceMemberId: options.introduceMemberId ? options.introduceMemberId : '',
                memberId: wx.getStorageSync('memberId'),
                fullScreen: false,
                extralInfo: {
                    liveRecordNo,
                    roomNo,
                    roomCoverUrl

                }
            })
            console.log(this.data, '直播间初始化数据')

            this.getToken(options)
        }


    },
    //限购查询
    checkLimitNum(skuId) {

        let params = {
            liveRecordNo: this.data.liveRecordNo,
            memberId: wx.getStorageSync('memberId'),
            skuId,
            num: 1
        }
        return new Promise((resolve, reject) => {
            apiWork.request('/order/front/SellOrderFront/checkLimitNum', 'post', params, (res) => {
                if (res.code == 0) {
                    let goodsLimit = res.data == 0 ? true : false;
                    resolve(goodsLimit)
                }
            }, (err) => {

                reject()
            })
        })

    },

    isScanCode2(options) {
        let url = `/base/front/miniProgram/getQrcodeSceneContent?sceneId=${options.scene}`;
        let method = "post";
        let param = {};
        return new Promise((resolve, reject) => {
            apiWork.request(url, method, param, (res) => {

                if (res.code == "0") {
                    let sceneContent = {};
                    sceneContent = JSON.parse(res.data.sceneContent);
                    if (sceneContent.introduceMemberId) {
                        wx.setStorageSync("introduceMemberId", sceneContent.introduceMemberId);

                    }
                    resolve({
                        code: '0',
                        data: sceneContent
                    })

                } else {
                    resolve({
                        code: '0'
                    })

                }
            }, () => {
                reject({
                    code: 1
                })
            });
        })

    },
    //获取小程序码
    getMiniCode() {

        let self = this
        let appId = wx.getStorageSync('extAppId')
        let url = `/base/front/miniProgram/getQrcodeUrl`

        let uniShareInfo = utils.getShareOrgInfoFromCache()
        let method = 'post'
        let extendObj = {
            introduceMemberId: uniShareInfo.introduceMemberId || '',
            liveRecordNo: this.data.liveRecordNo,
            orgId: uniShareInfo.orgId,
            orgName: uniShareInfo.orgName,
            channelCode: uniShareInfo.channelCode,
            roomNo: this.data.roomNo,

        }
        let param = {
            appId: appId,
            path: 'pages/playRoom/playRoom',//小程序路径
            toPath: 'pages/playRoom/playRoom', //webview 路径(可以不传递)
            extendParam: JSON.stringify(extendObj),//地址参数

        }
        apiWork.request(url, method, param, res => {
            if (res.code === '0') {
                self.setData({
                    codeurl: res.data
                })
                self.canvasDraw()
            } else {

            }
        })
    },
    shoRankModal() {
        this.setData({
            rankingModel: true,
            tabIndex: 1,
            rankList: []
        })
        //全屏
        this.exitFullScreen()


        this.likeListInit();
    },
    changeBarrageCloud(e) {
        let flag = e.currentTarget.dataset.item;
        let showBarrageCloud = flag == 'hide' ? false : true
        this.setData({
            showBarrageCloud
        })
    },
    setShareInfo() {
        let memberId = wx.getStorageSync('memberId')
        let params = {
            liveRecordNo: this.data.liveRecordNo,
            memberId
        }
        let shareInfo = {
            roomName: '',
            shareUrl: '',
            roomCoverUrl: '',
            liveStartTime: ''
        }
        let extralInfo = this.data.extralInfo;
        apiWork.request('/live/front/customer/liveRoom/getShareInfo', 'post', params, (res) => {
            if (res.code == 0) {
                shareInfo.roomName = res.data.roomName;
                shareInfo.roomCoverUrl = res.data.roomCoverUrl;
                shareInfo.liveStartTime = res.data.liveStartTime;
                extralInfo.roomCoverUrl = res.data.roomCoverUrl;
            }
            this.setData({
                shareInfo, extralInfo
            })

        }, () => { })
    },
    //直播间粉丝点赞
    handleLikeChange(e) {
        let parmas = {
            liveRecordNo: this.data.liveRecordNo,
            memberId: this.data.memberId,
            praiseNum: e.detail,
            roomNo: this.data.roomNo
        }
        //
        // let _self = this;
        // _self.sendMsg({ code: '108', data: { msg: '1', userName: 'like' } });
        apiWork.request('/live/front/customer/livePraise/saveLivePraise', 'post', parmas, (res) => {
            this.setData({
                count: 0
            })
            console.log(res, 'res')
        }, () => { })
    },
    async pwdIsRight() {
        let status = await this.getLiveRecordStatus();//判断状态 并且获取userSig
        if (status.code == 0 && status.data.liveStatus == '1002') {
            this.initRoom();

        }

        this.setData({
            checkPwdModal: false,
            lock: false
        })
    },

    closeCheckPwdModal() {
        this.setData({
            checkPwdModal: false
        })

    },
    //退出直播间
    exitRoom() {
        this.setData({
            liveOverModal: false
        })

        this.tim && this.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this.receiveMsg);
        this.tim && this.tim.destroy();



    },
    //获取直播状态接口 并且初始化userSign 
    getLiveRecordStatus() {
        let params = {
            liveRecordNo: this.data.liveRecordNo,
            memberId: this.data.memberId
        }

        return new Promise((resolve, reject) => {
            apiWork.request('/live/front/customer/liveRoom/getLiveRecordStatus', 'post', params, (res) => {

                if (res.code == '0') {
                    let { userSig } = res.data
                    //初始化userSign
                    this.setData({
                        userSig
                    })

                }
                resolve(res)

            }, (err) => {
                reject(err.message)
            })
        })

    },

    //到商品详情
    async goDetail(e) {
        let item = e.currentTarget.dataset.item;
        let param = {
            detailSkuId: item.skuId,
            detailType: 0,//直播商品默认为0
            orgId: wx.getStorageSync("orgId"),
            channelCode: wx.getStorageSync("channelCode"),
            toPath: 'goodsDetail',
            liveRecordNo: this.data.liveRecordNo,
            liveType: this.data.type,
            roomNo: this.data.roomNo,
            memberId: wx.getStorageSync('memberId')
        }
        let skuId = item.skuId;
        let url = '/goods/front/product/detail';
        let method = 'post';
        let fetchParam = {
            skuId: skuId,
            liveRecordNo: this.data.liveRecordNo
        };

        apiWork.request(url, method, fetchParam, (res) => {
            console.log(res);
            if (res.code == 0) {
                if (res.data.skus.length == 0) {
                    wx.hideLoading()
                    let timer = setTimeout(() => {

                        wx.showToast({
                            title: '商品已下架',
                            icon: 'none',
                            duration: 3000,
                            complete: function () {

                                clearTimeout(timer)
                            }
                        }, 2000)
                    })
                    //刷新列表
                    this.goodsListInit()
                } else {
                    this.exitFullScreen()
                    let urlParam = utils.getUrlFormatParams(param)
                    console.log(urlParam, 'urlParam')
                    wx.navigateTo({
                        url: "/pages/webViews/webViews?" + urlParam,
                    });

                }


            } else {

            }
        }, () => { })


    },
    getSkuId(e) {

        let item = e.currentTarget.dataset.item;
        let detailSkuId = item.skuId;
        this.setData({
            specSkuId: detailSkuId,
        });
    },
    createPlayerContext: function () {
        this.setData({
            ctx: wx.createLivePlayerContext("player")
        })
    },
    createVideoContext: function () {
        this.setData({
            videoCtx: wx.createVideoContext("video-player")
        })
    },
    // 处理弹幕位置
    setDM: function () {
        // 处理弹幕参数
        const dmArr = [];
        const _b = this.data.dmData;
        for (let i = 0; i < _b.length; i++) {
            if (!_b[i].time && !_b[i].top) {
                const time = Math.floor(Math.random() * 10);
                const _time = time < 6 ? 6 + i : time + i;
                const top = Math.floor(Math.random() * 80) + 2;
                const _p = {
                    id: Math.random(0, 1) * 100,
                    nick: _b[i].nick,
                    message: _b[i].message,
                    top,
                    time: _time,
                };
                dmArr.push(_p);
            } else {
                dmArr.push(_b[i]);
            }
        }

        this.setData({
            dmData: dmArr
        });
        console.log(this.data.dmData, '进入')
    },
    exitFullScreen() {
        let self = this
        let headData = this.data.headData;

        if (this.data.fullScreen) {
            headData.fullScreen = false
            this.data.ctx.exitFullScreen({
                success(e) {
                    self.setData({
                        fullScreen: false,
                        headData,

                        screenHeight: app.globalData.screenHeight,
                        navBarHeight: app.globalData.navBarHeight,
                        styleInfo: {

                        }
                    })
                },

            })
        }

    },

    //切换横竖屏
    onOrientationClick() {

        let self = this;
        let screenHeight = wx.getSystemInfoSync().screenWidth//横屏的屏幕高度
        let navBarHeight = app.globalData.navBarHeight / 2 + 40;
        let horizonNavarHeight = 70;
        console.log(screenHeight, 'screenHeight')
        let headData = this.data.headData;

        if (!this.data.fullScreen) {
            this.data.ctx.requestFullScreen({
                direction: 90,
                success(e) {
                    headData.fullScreen = true

                    self.setData({
                        fullScreen: true,
                        headData,

                        screenHeight,
                        navBarHeight: horizonNavarHeight,
                        styleInfo: {
                            height: horizonNavarHeight + 'px'
                        }
                    })
                },
                fail(err) {

                    console.log(err)
                    wx.showToast({
                        title: '没有权限',
                        icon: 'none',
                        duration: 3000
                    })
                }

            })
            if (this.data.liveMethod == 2) {
                headData.fullScreen = true
                this.data.videoCtx.requestFullScreen({
                    direction: 90,
                    success(e) {
                        self.setData({
                            fullScreen: true,
                            headData,

                            screenHeight,
                            navBarHeight: horizonNavarHeight,
                            styleInfo: {
                                height: horizonNavarHeight + 'px'
                            }
                        })
                    },
                    fail(err) {

                        console.log(err)
                        wx.showToast({
                            title: '没有权限',
                            icon: 'none',
                            duration: 3000
                        })
                    }

                })
            }


        } else {
            headData.fullScreen = false
            this.data.ctx.exitFullScreen({
                success(e) {
                    self.setData({
                        fullScreen: false,
                        headData,

                        screenHeight: app.globalData.screenHeight,
                        navBarHeight,
                        styleInfo: {

                        }
                    })
                },

            })
            if (this.data.liveMethod == 2) {
                this.data.videoCtx.exitFullScreen({
                    success(e) {
                        self.setData({
                            fullScreen: false,
                            headData,

                            screenHeight: app.globalData.screenHeight,
                            navBarHeight: app.globalData.navBarHeight,
                            styleInfo: {

                            }
                        })
                    },

                })
            }
        }
    },
    // 获取userName
    getNickName() {
        let token = wx.getStorageSync('token');
        if (token) {
            let url = '/goods/front/appraise/getMyFirstPageInfoByUserId';
            let method = 'post';
            let param = {};
            let _this = this;
            apiWork.request(url, method, param, (res) => {
                let d = res.data;
                if (res.code == '0') {
                    wx.setStorageSync('userNickName', d.username);
                    this.setData({
                        nickName: d.username
                    })

                }
            });
        }
    },
    // 获取token
    async getToken(option) {

        if (!utils.logined()) {
            var pages = getCurrentPages(); // 获取页面指针数组
            var currentPage = pages[pages.length - 1].route; // 获取当前页
            wx.setStorageSync('loginToPath', currentPage); //设置登录后要跳转的缓存
            wx.setStorageSync("loginToPathParams", JSON.stringify(option));//保存当前页面查询参数 
        }
        if (utils.isLogin()) {
            this.getNickName()
            let orgId = wx.getStorageSync('orgId');
            let memberId = wx.getStorageSync('memberId')

            this.setData({
                orgId,
                memberId,

            })
            const self = this;
            wx.getSystemInfo({
                success(res) {
                    let clientHeight = res.windowHeight;
                    let width = res.screenWidth;
                    let clientWidth = res.windowWidth;

                },
            });

            this.createPlayerContext();
            let status = await this.getLiveRecordStatus();//判断状态 并且获取userSig
            if (status.code == 0) {
                if (status.data.isLock == 1) {
                    //需要验证密码
                    this.setData({
                        checkPwdModal: true,
                        lock: true,
                        liveStatus: status.data.liveStatus
                    })

                } else if (status.data.isLock == 0) {
                    //不需要验证密码
                    if (status.code == 0 && status.data.liveStatus == '1002') {
                        this.initRoom();

                    }
                    this.setData({
                        checkPwdModal: false,
                        lock: false,
                        liveStatus: status.data.liveStatus
                    })
                }
            } else {
                wx.showToast({
                    title: 'getLiveRecordStatus接口异常'
                })
            }

        }
    },
    // 关闭输入弹框
    closeInpBox() {

        if (this.data.isShowPopup1) {
            this.setData({
                isShowPopup1: !this.data.isShowPopup1
            })
        }
        this.setData({
            goodsModel: false,
            shareModel: false,
            rankingModel: false

        })


    },

    // 获取直播分享二维码
    async getshareCode() {

        this.getMiniCode();

    },
    // 网络图片下载
    downloadImg(url) {

        let surl = '';
        if (url.indexOf('https') < 0) {
            surl = url.replace('http', 'https')
        } else {
            surl = url
        }
        //   console.log(surl, 'surl')
        return new Promise((resolve, reject) => {
            wx.getImageInfo({
                src: surl,
                success: function (res) {
                    // res.path = surl
                    resolve(res)
                    //   console.log('sucess', url, surl, res)
                }, fail: function (res) {

                    reject(res)
                    console.log('fail', url, surl)
                }
            });
        });
    },

    //扫码进入调用转译接口
    async scene2url(info) {
        let that = this;
        utils
            .post(api.agent.queryWxsence, { scene: info }, true)
            .then((res) => {
                this.setData({
                    orgId: this.getKey(res.data.data, 'orgId'),
                    liveRecordNo: this.getKey(res.data.data, 'liveRecordNo'),
                    fansAccountNo: this.getKey(res.data.data, 'fansAccountNo'),
                    inviteFlag: this.getKey(res.data.data, 'inviteFlag')
                })

            })
            .catch((e) => {
                console.log(e);
            });
    },
    //初始化直播间
    async initRoom() {
        let res = await this.getRoomInfo();
        if (res.code == 0) {
            this.setData({
                initOver: true
            })
            //     this.setShareInfo();//设置分享信息 
            this.saveFans(); // 保存粉丝
            this.establishLink(); // 去初始化IM连接
            //   this.enterRoom();

        } else {
            console.log('获取房间初始化失败')
        }

    },
    //进入直播间
    enterRoom() {
        let params = { liveRecordNo: this.data.liveRecordNo, roomNo: this.data.roomNo, memberId: this.data.memberId }
        return new Promise((resolve, reject) => {
            apiWork.request('/live/front/customer/liveRoom/enterLiveRoom',
                'post',
                params, (res) => {
                    resolve(res.data)
                }, (err) => { reject(err) })
        })
    },
    leaveRoom() {
        let params = { liveRecordNo: this.data.liveRecordNo, memberId: this.data.memberId }
        return new Promise((resolve, reject) => {
            apiWork.request('/live/front/customer/liveRoom/exitLiveRoom',
                'post',
                params, (res) => {
                    resolve(res.data)
                }, (err) => { reject(err) })
        })
    },

    getLiveRoomMainPageInfo() {
        let params = { liveRecordNo: this.data.liveRecordNo, roomNo: this.data.roomNo, memberId: this.data.memberId, orgId: wx.getStorageSync('orgId'), channelCode: wx.getStorageSync('channelCode') }
        return new Promise((resolve, reject) => {
            apiWork.request('/live/front/customer/liveRoom/getLiveRoomMainPageInfo',
                'post',
                params, (res) => {
                    if (res.code == 0) {
                        resolve(res)
                    } else {
                        reject(res)
                    }

                }, (err) => { reject(err) })
        })


    },
    getLiveRoomInfo() {
        //
        let params = { liveRecordNo: this.data.liveRecordNo, roomNo: this.data.roomNo, memberId: this.data.memberId, orgId: wx.getStorageSync('orgId') }
        return new Promise((resolve, reject) => {
            apiWork.request('/live/front/customer/liveRoom/getLiveRoomInfo',
                'post',
                params, (res) => {
                    if (res.code == 0) {
                        resolve(res)
                    } else {
                        reject(res)
                    }
                }, (err) => { reject(err) })
        })
    },
    // 获取直播间信息 
    getRoomInfo() {
        return new Promise(async (resolve, reject) => {

            let pullFlowUrl = '';
            let shareInfo = {};
            let extralInfo = this.data.extralInfo;
            let mainDataRes = await this.getLiveRoomMainPageInfo();


            if (mainDataRes.code == 0) {
                let mainData = mainDataRes.data;

                // 直播间信息设置
                switch (mainData.liveStatus) {
                    case '1001':
                        // 预告中
                        wx.navigateTo({
                            url: `/pages/live-noticing?orgName=${mainData.orgName}&bizHeadImg=${mainData.bizHeadImg}&liveRecordNo=${this.liveRecordNo}&trailerVedioUrl=${mainData.trailerVedioUrl}`,
                        });
                        break;
                    case '1002':
                        // 直播中
                        pullFlowUrl = mainData.pullFlowUrl;
                        // console.log('当前直播间拉流地址', this.pullFlowUrl)
                        break;
                    case '1003':
                        // 直播结束 
                        this.setData({
                            liveOverModal: true,
                            videoUrl: mainData.videoUrl
                        })

                        break;
                }
                // 直播信息设置
                let resLiveRoomGoodsDto = null
                shareInfo.roomName = mainData.roomName;
                shareInfo.roomCoverUrl = mainData.roomCoverUrl;
                shareInfo.liveStartTime = mainData.liveStartTime;
                extralInfo.roomCoverUrl = mainData.roomCoverUrl;

                if (mainData.hotGoodsDTO) {
                    resLiveRoomGoodsDto = {
                        skuId: mainData.hotGoodsDTO.skuId,
                        hotGoodsFlag: mainData.hotGoodsDTO.hotGoodsFlag,
                        sequenceNum: 1,
                        mainPictureUrl: mainData.hotGoodsDTO.picUrl,
                        goodsName: mainData.hotGoodsDTO.spuName,
                        retailPrice: mainData.hotGoodsDTO.livePrice,
                    }
                }
                if (mainData.liveMethod == 2) {
                    //视频录播
                    this.createVideoContext()
                }
                let livePraiseList = mainData.livePraiseList ? mainData.livePraiseList : []
                if (livePraiseList.length > 3) {
                    livePraiseList = livePraiseList.splice(0, 3)
                }

                this.setData({
                    pullFlowUrl,
                    liveRecordNo: mainData.liveRecordNo,
                    roomNo: mainData.roomNo,
                    orgName: mainData.orgName,
                    roomCoverUrl: mainData.roomCoverUrl,
                    goodPic: mainData.roomCoverUrl,
                    roomName: mainData.roomName,
                    notice_content: mainData.content,
                    goodsNum: mainData.goodsNum,
                    resLiveRoomGoodsDto,
                    type: mainData.type,
                    headData: {
                        liveRecordNo: mainData.liveRecordNo,
                        memberId: this.data.memberId,
                        roomNo: mainData.roomNo,
                        bizHeadImg: mainData.bizHeadImg,
                        orgName: mainData.orgName,
                        popularity: mainData.popularityTotal,
                        livePraiseList
                    },
                    liveMethod: mainData.liveMethod,
                    recordLiveVideoUrl: mainData.recordLiveVideoUrl,
                    shareInfo, extralInfo
                })

                //跑马灯

                if (mainData.content && mainData.content != '') {
                    this.scrillText(mainData.content);
                }

                if (mainData.resLiveRoomGoodsDto) {


                }
                resolve({
                    code: 0,
                    message: '直播间初始化成功'
                })

            }
        })

    },

    // 解析url上参数
    getKey(str, key) {
        const reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)');
        let matchStr = str.match(reg);
        return matchStr ? decodeURI(matchStr[2]) : '';
    },


    saveInput(e) {
        this.setData({
            msg: e.detail.value
        })

    },
    // 发送input消息
    async sendInpMsg(e) {
        let tim = this.data.tim
        let self = this;
        let bulletData = this.data.bulletData;
        let rollId = this.data.rollId;
        let dmData = bulletData.slice()
        if (!this.data.msg) {

            self.setData({
                isShowPopup1: false
            })
            return;
        }
        self.setData({
            isShowPopup1: false
        })
        let text = JSON.stringify({
            code: '102',
            data: { useName: this.data.nickName, msg: this.data.msg, role: '4' },
        })
        liveroom.sendRoomTextMsg({
            data: { roomID: this.data.roomNo, msg: text },
            success: () => {
                // 发送成功
                let msg = { code: '0' };
                if (res.data.message.payload.text) {
                    msg = JSON.parse(res.data.message.payload.text);
                }
                bulletData.push({ nick: msg.data.useName, message: msg.data.msg });//插入bulletData
                dmData.unshift({ nick: msg.data.useName, message: msg.data.msg });
                bulletData.forEach((v, index) => {
                    switch ((index + 3) % 3) {
                        case 0:
                            v.color = 'rgb(45,255,55)';
                            break;
                        case 1:
                            v.color = 'rgb(255,208,0)';
                            break;
                        case 2:
                            v.color = 'rgb(0,255,244)';
                            break;
                    }
                });
                rollId = `chat${bulletData.length - 1}`;

                self.setData({
                    bulletData,
                    dmData,
                    rollId,
                    msg: '',

                })
                self.setDM()


                console.log('成功发送消息：', res.data.message.payload)
            },
            fail: () => {
                // 消息发送失败，是否重新进入直播间
                //加个提示
                wx.showModal({
                    title: '提示',
                    content: '消息发送失败,请重新进入直播间吧~',
                    showCancel: false,
                    success(res) {
                        if (res.confirm) {
                            let pages = getCurrentPages(); // 获取页面指针数组
                            let currentPage = pages[pages.length - 1].route; // 获取当前页
                            let options = pages[pages.length - 1].options;
                            let queryString = utils.getUrlFormatParams(options)
                            wx.redirectTo({
                                url: `/${currentPage}?${queryString}`
                            })
                        }
                    }
                });
                log.error('sendMessage error:', imError)
                console.warn('sendMessage error:', imError);
            }
        })


    },

    // 发消息
    async sendMsg(text) {
        // let tim = this.data.tim
        // let message = tim.createTextMessage({
        //     to: this.data.roomNo,
        //     type: TIM.TYPES.MSG_TEXT,
        //     conversationType: TIM.TYPES.CONV_GROUP,
        //     payload: { text: JSON.stringify(text) },

        // });

        liveroom.sendRoomTextMsg({
            data: { roomID: this.data.roomNo, msg: text },
        })

    },
    // 分享好友
    onShareAppMessage(res) {
        let pages = getCurrentPages(); // 获取页面指针数组
        let currentPage = pages[pages.length - 1]; // 获取当前页
        let path = currentPage.route
        let uniShareInfo = utils.getShareOrgInfoFromCache();//通用分享信息
        let shareInfo = Object.assign({}, { wxShare: true }, uniShareInfo, { liveRecordNo: this.data.liveRecordNo, path: `/${path}`, roomNo: this.data.roomNo })
        let queryString = utils.getUrlFormatParams(shareInfo)
        console.log(path, 'shareInfo.path')
        console.log(queryString, 'shareInfo.queryString')
        return {
            title: this.data.shareInfo.roomName,
            path: `${path}?${queryString}`,
            imageUrl: this.data.shareInfo.roomCoverUrl,
        };

    },
    /**establish
  * 初始化加入群组
  */
    establishLink() {
        // let options = { SDKAppID: this.data.SDKAppID };
        // let tim = TIM.create(options);
        // tim.setLogLevel(1);//release级别，SDK 输出关键信息，生产环境时建议使用
        // // tim.on(TIM.EVENT.MESSAGE_RECEIVED, this.receiveMsg);
        // // tim.on(TIM.EVENT.SDK_NOT_READY, this.onSdkNotReady);
        // // tim.on(TIM.EVENT.NET_STATE_CHANGE, this.onNetStateChange);
        // // tim.on(TIM.EVENT.SDK_READY, this.onSdkReady);
        // // tim.on(TIM.EVENT.ERROR, this.onError);

        // this.setData({
        //     tim
        // })

        // let loginPromise = tim.login({
        //     userID: String(this.data.memberId),
        //     userSig: this.data.userSig,
        // });
        // loginPromise.then(() => {
        //     //加入群聊
        //     let groupPromise = tim.joinGroup({
        //         groupID: this.data.roomNo,
        //         type: TIM.TYPES.GRP_AVCHATROOM,
        //     });
        //     groupPromise.then((groupRes) => {
        //         this.readyMsg();
        //         console.log('登陆后加入群组````````````````', groupRes.data)

        //     }).catch((imError) => {
        //         log.error('joinGroup imError')

        //     })


        // }).catch((imError) => {
        //     log.error('login imError', imError)

        // })
    },
    statechange(e) {
        if (this.data.liveMethod == 2) {
            return
        }

        console.log('状态码', e.detail.code)
        let self = this;
        switch (e.detail.code) {
            case 2004:
                console.log('开始播放')
                break;
            case 2007:
                console.log('加载中。。。')
                break;

            case 2103:
                // // console.log("正在加载中，请稍后")
                break;
            case -2301:

                // tost("和远程服务断开连接");
                if (this.data.liveOverModal) {
                    return
                }
                wx.getNetworkType({
                    success: res => {
                        console.log(res.networkType)
                        // 判断用户自己 是否有网络 有就提示用户自己网络异常，没有就是主播的网络异常
                        if (res.networkType != "none") {

                            wx.showModal({
                                title: '错误',
                                content: '主播网络不佳，正在努力恢复',
                                showCancel: false,
                                success: res => {
                                    // 恢复拉流的画面
                                    this.data.ctx.play({
                                        success: function (ret) {
                                            console.log('start push success!')
                                        },
                                        fail: function () {
                                            // // console.log('start push failed!')
                                        },
                                        complete: function () {
                                            // // console.log('start push complete!')
                                        },
                                    });
                                }
                            })
                        } else {
                            wx.showModal({
                                title: '错误',
                                content: '请检查你的网络连接是否正常',
                                showCancel: false,
                                success: res => {
                                    // 恢复拉流的画面
                                    this.data.ctx.play({
                                        success: function (ret) {
                                            console.log('start push success!')
                                        },
                                        fail: function () {
                                            // // console.log('start push failed!')
                                        },
                                        complete: function () {
                                            // // console.log('start push complete!')
                                        },
                                    });
                                }
                            })
                        }
                    }
                })


                break;
        }
    },


    // 商品列表
    goodsList() {
        // if (!this.showChat) {return}
        if (this.data.fullScreen) {
            this.onOrientationClick()
        }
        this.setData({
            goodsModel: !this.data.goodsModel,
            goodLists: [],
            pages: 1,
        })


        this.goodsListInit();

    },
    // 聊天弹框失去焦点事件
    bindblur() {

        this.setData({
            isShowPopup1: false
        })
    },
    // 聊天弹框
    sendPop() {

        let isShowPopup1 = !this.data.isShowPopup1;
        this.setData({
            isShowPopup1
        })


    },
    // 分享
    share() {

        if (this.data.fullScreen) {
            this.onOrientationClick()
        }
        this.setData({
            shareModel: !this.data.shareModel
        })


    },

    shareClose() {

        this.setData({
            shareModel: false
        })
    },
    // 点赞
    likeClickHandler() {

        let count = this.data.count + 1;
        this.setData({
            count
        })
    },
    // 点赞排行榜

    // 排行榜tab
    tabClick(e) {

        let { tabindex } = e.currentTarget.dataset;

        this.setData({
            tabIndex: tabindex
        })

        if (this.data.tabIndex == 1) {
            this.likeListInit();
        } else if (this.data.tabIndex == 2) {
            this.inviteListInit();
        }

    },
    // 关闭排行榜
    close() {

        this.setData({
            rankingModel: false
        })
    },
    goodsClose() {
        this.setData({
            goodsModel: false
        })

    },
    // 绘制文字
    canvasToDrawText(ctx, canvasParam) {
        const {
            x,
            y,
            text,
            fontWeight = 'normal',
            fontSize = 40,
            lineHeight,
            maxWidth,
            textAlign = 'left',
            color = '#323233'
        } = canvasParam

        if (typeof text !== 'string') {
            return
        }

        // ctx.font = `normal ${fontWeight} ${fontSize}px sans-serif`
        ctx.setFontSize(fontSize)

        ctx.setFillStyle(color)
        ctx.textBaseline = 'middle'
        ctx.setTextAlign(textAlign)

        function drawLineText(lineText, __y) {
            let __lineText = lineText
            if (__lineText[0] === ' ') {
                __lineText = __lineText.substr(1)
            }
            ctx.fillText(__lineText, x, __y + fontSize / 2)
        }

        if (maxWidth) {
            const arrayText = text.split('')

            let lineText = ''
            let __y = y
            for (let index = 0; index < arrayText.length; index++) {
                const aryTextItem = arrayText[index]
                lineText += aryTextItem
                /**
               * 1. 计算当前文字加下一个文字的文本宽度
               * 2. 当文本宽度大于最大宽度时, 在画布上绘制被填充的文本
               * 3. __y + fontSize / 2 的问题
               * 4. 设置下一行文本的 y轴位置, 重置当前文本信息
               */
                const { width: textMetrics } = ctx.measureText(
                    lineText + (arrayText[index + 1] ?? '')
                )
                if (textMetrics > maxWidth) {
                    // 绘制一行文字, 如果第一个文字是空格，则删除
                    drawLineText(lineText, __y)
                    __y += lineHeight ?? fontSize
                    lineText = ''
                }
            }
            // 绘制最后一行文字, 如果第一个文字是空格，则删除
            drawLineText(lineText, __y)
            return
        }
        ctx.fillText(text, x, y + fontSize / 2)
    },

    // 画海报
    // 绘制保存至相册的图片
    canvasDraw(codeurl) {
        //拉起分享统计分享次数
        this.setData({
            isCanvasShow: true
        })
        wx.showLoading({
            title: '图片绘制中...',
        });
        let that = this;
        const W = wx.getSystemInfoSync().windowWidth;

        const rate = 750.0 / W;//当前设备与设计基准宽度比例 确保同比缩放
        console.log(rate)
        const textWidth = 360;//每行文本宽度
        const lineHeight = 40;
        let currentLineHeight = 1 / rate;
        const PadLeft = 40 / rate;
        let promiseArr = [];
        that.data.goodPic && promiseArr.push(this.downloadImg(that.data.goodPic));
        that.data.codeurl && promiseArr.push(this.downloadImg(that.data.codeurl));


        Promise.all(promiseArr)
            .then((results) => {
                console.log('有结果返回', results)
                let goodUrl = results[0].path;
                let codeurl = results[1].path;
                const scale1 = 620 / 880

                let drawW = 620, drawH = 880, mt = 20, ml = 20;
                let ctx = wx.createCanvasContext('saveImg');
                ctx.setFillStyle('#fff');
                ctx.fillRect(0, 0, drawW / rate, drawH / rate);
                ctx.setFontSize(32 / rate);


                // 画商品图片
                ctx.drawImage(goodUrl, 0, 0, drawW / rate, 620 / rate, 1, 1);

                ctx.restore();

                currentLineHeight += 650 / rate;

                //绘制二维码
                console.log(currentLineHeight, 'currentLineHeight')
                // 绘制头像

                // 图片的x坐标
                let bg_x = 450 / rate
                // 图片的y坐标
                let bg_y = currentLineHeight
                // 图片宽度
                let bg_w = 144 / rate
                // 图片高度
                let bg_h = 144 / rate
                // 图片圆角
                let bg_r = 72 / rate
                // 绘制海报背景图片圆角
                //保存当前的绘图上下文。 否则会丢失绘制的内容
                ctx.save()
                ctx.beginPath()
                console.log(bg_x, bg_y, bg_w, bg_h)
                ctx.arc(bg_x + bg_r, bg_y + bg_r, bg_r, Math.PI, Math.PI * 1.5)
                ctx.arc(bg_x + bg_w - bg_r, bg_y + bg_r, bg_r, Math.PI * 1.5, Math.PI * 2)
                ctx.arc(bg_x + bg_w - bg_r, bg_y + bg_h - bg_r, bg_r, 0, Math.PI * 0.5)
                ctx.arc(bg_x + bg_r, bg_y + bg_h - bg_r, bg_r, Math.PI * 0.5, Math.PI)
                ctx.clip()
                ctx.drawImage(codeurl, bg_x, bg_y, bg_w, bg_h)
                ctx.restore();

                // 恢复之前保存的绘图上下文
                //画直播间名称

                currentLineHeight += 40 / rate
                let roomName = this.data.shareInfo.roomName ? this.data.shareInfo.roomName : '';
                let chr = roomName.split(''); //这个方法是将一个字符串分割成字符串数组
                let temp = '';
                let row = [];
                ctx.setFontSize(32 / rate);
                ctx.setFillStyle('#000');

                for (var a = 0; a < chr.length; a++) {
                    //当文本的宽度 > textWidth 时，把已拼接的第一行字符插入新行文本数组中，临时字符重置为空，继续第二行文字宽度<textWidth时的字符拼接功能，以此类推第3行、第4行...
                    if (ctx.measureText(temp).width < textWidth / rate) {
                        temp += chr[a];
                    } else {
                        a--; //这里添加了a-- 是为了防止字符丢失
                        row.push(temp);

                        temp = '';
                    }
                }
                row.push(temp)
                if (row.length >= 2) {
                    //如果直播间超过两行 省略...
                    row = row.slice(0, 2)
                    row[1] = row[1].slice(0, row[1].length - 1) + '...'
                }
                for (var b = 0; b < row.length; b++) {
                    currentLineHeight += (b * lineHeight) / rate
                    console.log(currentLineHeight, 'currentLineHeight')
                    if (b < 3) {
                        ctx.fillText(row[b], PadLeft / rate, (currentLineHeight), textWidth / rate);
                    }
                }
                // let params = {
                //     x: 40 / rate,
                //     y: 1390 / rate,
                //     text: this.data.roomName,
                //     fontWeight: 'normal',
                //     fontSize: 68,
                //     lineHeight: 90,
                //     maxWidth: textWidth,
                //     textAlign: 'left',
                //     color: '#000'
                // }
                // this.canvasToDrawText(ctx, params)
                //绘制直播开播时间
                let marginTop = 20
                currentLineHeight += (lineHeight + marginTop) / rate;
                ctx.setFontSize(24 / rate);
                ctx.setFillStyle('#999');
                ctx.fillText('开播时间：', PadLeft / rate, currentLineHeight, textWidth / rate);

                let liveDate = this.data.shareInfo.liveStartTime ? this.data.shareInfo.liveStartTime : '';
                let chrliveDate = liveDate.split(''); //这个方法是将一个字符串分割成字符串数组
                let templiveDate = '';
                let rowliveDate = [];
                for (var a = 0; a < chrliveDate.length; a++) {
                    if (ctx.measureText(templiveDate).width < textWidth / rate) {
                        templiveDate += chrliveDate[a];
                    } else {
                        a--; //这里添加了a-- 是为了防止字符丢失
                        rowliveDate.push(templiveDate);
                        templiveDate = '';
                    }
                }
                rowliveDate.push(templiveDate);
                for (var b = 0; b < rowliveDate.length; b++) {
                    currentLineHeight += (b * lineHeight) / rate
                    if (b < 3) {
                        ctx.fillText(rowliveDate[b], PadLeft + 100 / rate, currentLineHeight, textWidth / rate);
                    }
                }
                currentLineHeight += 64 / rate
                ctx.restore();
                ctx.save()
                //绘制底部店铺名称
                let orgName = wx.getStorageSync('orgName')
                ctx.setFillStyle('#FB3E5A')
                ctx.fillRect(0, currentLineHeight, drawW, 30)
                ctx.setFontSize(28 / rate);
                ctx.setFillStyle('#fff');

                ctx.fillText(orgName, (drawW / 2 - ctx.measureText(orgName).width) / 2, currentLineHeight + 20, textWidth / rate);
                ctx.draw()
            })
            .then(() => {
                setTimeout(() => {
                    that.canvas2img();
                }, 2000);
            })
            .catch((e) => {
                wx.showToast({
                    title: '绘制失败',
                    duration: 3000
                })
            });
    },
    //canvas转图片
    canvas2img() {
        let that = this;

        wx.canvasToTempFilePath({

            canvasId: 'saveImg',
            success: (res) => {
                wx.hideLoading();
                console.log('生成了图片', res);
                that.setData({
                    saveShareImg: res.tempFilePath,
                    isCanvasShow: false,
                    isSaveImg: true

                })
                //    that.saveToAlbum();
            },
            fail: (err) => {
                console.log('canvas2img 失败了', err);
            },
        });
    },
    closeSaveBtn() {

        this.setData({
            isSaveImg: false
        })
    },
    //保存至相册
    saveToAlbum() {
        let that = this;
        wx.getImageInfo({
            src: that.data.saveShareImg,
            success: function (res) {
                let savepath = res.path;
                wx.saveImageToPhotosAlbum({
                    filePath: savepath,
                    success: (res) => {
                        wx.showModal({
                            title: '提示',
                            content: '图片已保存到相册，快去分享吧~',
                            showCancel: false,
                        });

                    },
                    fail: (err) => {
                        wx.showModal({
                            title: '提示',
                            content: '图片保存失败',
                            showCancel: false,
                        });


                    },
                    complete(res) {
                        that.setData({
                            isSaveImg: false
                        })
                    },
                });
            },
            fail: function (res) {
                // console.log(res);
            },
        });
    },
    // 点击蒙版取消保存
    toCancel() {
        this.isSaveImg = false;

    },
    toSave() {
        let that = this;
        //获取相册授权
        wx.getSetting({
            success(res) {
                if (!res.authSetting['scope.writePhotosAlbum']) {
                    wx.authorize({
                        scope: 'scope.writePhotosAlbum',
                        success() {
                            // console.log('授权成功');
                            that.saveToAlbum();
                        },
                    });
                } else {
                    that.saveToAlbum();
                }
            },
        });
    },
    // 保存粉丝
    saveFans() {
        // console.log('直播信息====================', this.userInfo.nickName)
        let url = '/live/front/customer/liveFans/saveLiveFans';
        let params = {
            inviteMemberId: this.data.introduceMemberId,
            liveRecordNo: this.data.liveRecordNo,
            memberId: this.data.memberId,
            roomNo: this.data.roomNo
        }
        apiWork.request(url, 'post', params, (res) => {
            console.log(res, '==============保存粉丝成功====================')
        }, () => { })

    },

    // 邀请排行榜
    inviteListInit() {
        this.rankList = [];

        let parmas = {
            liveRecordNo: this.data.liveRecordNo, //直播间记录号
            limitSize: 10,

        };
        apiWork.request('/live/front/customer/liveInviteList/getLiveInviteListLimit', 'post', parmas, (res) => {
            if (res.code == 0) {
                this.setData({
                    rankList: res.data
                })
            }
        }, () => { })
    },
    //  点赞排行榜
    likeListInit() {
        this.rankList = [];

        let parmas = {
            liveRecordNo: this.data.liveRecordNo, //直播间记录号
            limitSize: 10,

        };
        apiWork.request('/live/front/customer/livePraise/getLivePraiseListLimit', 'post', parmas, (res) => {
            if (res.code == 0) {
                this.setData({
                    rankList: res.data
                })
            }
        }, () => { })

    },



    // 获取直播间商品列表
    goodsListInit() {
        wx.showLoading();
        this.goodLists = []
        let parmas = {
            type: this.data.type,
            currentPage: 0,
            pageSize: 10,
            liveRecordNo: this.data.liveRecordNo, //直播间记录号
            channelCode: wx.getStorageSync('channelCode'),
            orgId: wx.getStorageSync('orgId')
        };

        apiWork.request('/goods/front/live/product/queryLiveRoomGoodsInfoList', 'post', parmas, (res) => {
            if (res.code == 0) {
                let goodLists = []
                res.data.data.forEach((v, index) => {
                    goodLists.push({
                        skuId: v.skuId,
                        hotGoodsFlag: v.hotGoodsFlag,
                        sequenceNum: index + 1,
                        mainPictureUrl: v.picUrl,
                        goodsName: v.spuName,
                        retailPrice: v.livePrice

                    })
                })
                this.setData({
                    goodLists,
                    goodsNum: res.data.total
                })
            }
        }, () => { })
    },
    // 商品列表点击更多
    seeMore() {
        this.setData({
            pages: this.data.pages + 1
        })

        //   this.goodsListInit();后期拿出来哦
    },


    // 跳转商品详情 马上抢
    goBuy(e) {
        if (this.data.fullScreen) {
            this.onOrientationClick()
        }
        let item = e.currentTarget.dataset.item;
        let id = e.currentTarget.dataset.id
        let detailSkuId = item.skuId;
        this.checkLimitNum(detailSkuId).then((res) => {

            item.goodsLimit = res;//是否限购

            if (id != 'goodLists') {
                this.setData({ resLiveRoomGoodsDto: item })
            } else {
                let index = e.currentTarget.dataset.index;
                let goodLists = this.data.goodLists;
                goodLists[index] = item;
                this.setData({
                    goodLists
                })
            }

            if (!res) {
                this.sendMsg({
                    code: '110',
                    data: { useName: this.data.nickName, msg: '正在购买' },
                });

                this.data.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this.receiveMsg);
                if (!detailSkuId) {
                    wx.showToast({
                        title: '商品skuId为空',
                        duration: 3000
                    })
                }
                let extralInfo = this.data.extralInfo;
                extralInfo = Object.assign({}, { liveType: this.data.type, roomNo: this.data.roomNo }, extralInfo)
                this.setData({
                    specSkuId: detailSkuId,
                    extralInfo
                });

            }
        })
    },


    //跑马灯
    scrillText(content) {
        this.initAnimation(content);

    },

    /**
     * 开启公告字幕滚动动画
     * @param  {String} announcementText 公告内容
     * @return {[type]}                  [description]
     */
    initAnimation(announcementText) {

        var that = this;
        //初始化动画
        var animation = wx.createAnimation({
            duration: 10000,
            timingFunction: 'linear',
        });
        // animation.translateX(-Number(announcementText.length * 12 + 25), 0).step();
        animation.translate(200, 0).step({ duration: 0 });
        let animationData = animation.export();
        this.setData({
            animationData
        })


        /****************************优化部分*******************************/
        // 重新开始动画
        that.restartAnimation = setInterval(
            function () {
                animation.translate(200, 0).step({ duration: 0 });
                let animationData = animation.export();
                this.setData({
                    animationData
                })

                // console.log('执行到你强逻辑')
                // 延迟5再执行下个动画
                that.sleep(5);
                animation
                    .translate(-Number(announcementText.length * 12 + 25), 0)
                    .step();
                animationData = animation.export();
                this.setData({
                    animationData
                })
            }.bind(this),
            0
        );
    },

    /**
    //  * 睡眠时间
    //  * @param  {Number} num 需要延迟的时间长度
    //  */
    sleep(num) {
        var nowTime = new Date();
        var exitTime = nowTime.getTime() + num;
        while (true) {
            nowTime = new Date();
            if (nowTime.getTime() > exitTime) return;
        }
    }

})