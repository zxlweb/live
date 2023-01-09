/*
 * @Author: qingjiaowomissp zxlweb@163.com
 * @Date: 2022-12-29 16:01:56
 * @LastEditors: qingjiaowomissp zxlweb@163.com
 * @LastEditTime: 2022-12-29 17:53:48
 * @FilePath: \htd-live\components\mlvb-live-room\mlbliveroomview\mlbliveroomview.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var _this = null;
var liveroom = require('./mlvbliveroomcore.js');
Component({
    properties: {
        roomid: {
            type: String, value: '', observer: function (newVal, oldVal) {
                this.data.roomID = newVal;
            }
        },
    },
    data: {
        roomID: '',
        playerContext: null,
        pullFlowUrl: '',//拉流地址
        nickName: '',//昵称
        resLiveRoomGoodsDto: null, //主推商品
        liveOverModal: false,//直播结束弹框
        videoUrl: ''//回放地址


    },
    methods: {
        createPlayerContext: function () {
            this.setData({
                playerContext: wx.createLivePlayerContext("player")
            })
        },
        // 接受消息处理
        async receiveMsg(data) {
            console.log('==================有人发消息', data.data[0])
            console.log('系统通知了2222222222222222222222222222222')
            let self = this;
            let msg = { code: '0' };
            data.data.forEach(async (v) => {
                if (v.payload.text) {
                    msg = JSON.parse(v.payload.text);
                    if (msg.code == '100') {
                        //  商品主推getLiveRoomMainPageInfo
                        let mainDataRes = await this.getLiveRoomMainPageInfo();
                        if (mainDataRes.code == 0) {
                            let mainData = mainDataRes.data;
                            let resLiveRoomGoodsDto = null

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
                            self.setData({
                                resLiveRoomGoodsDto,

                            })
                        }
                    } else if (msg.code * 1 == 101) {
                        // 取消商品主推
                        self.setData({
                            resLiveRoomGoodsDto: null,
                        })
                    } else if (msg.code * 1 == 102) {

                        // 聊天消息
                        let bulletData = this.data.bulletData
                        let dmData = this.data.dmData
                        bulletData.push({
                            nick: msg.data.useName,
                            message: msg.data.msg,
                        });
                        dmData.unshift({
                            nick: msg.data.useName,
                            message: msg.data.msg,
                        })
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
                        let rollId = `chat${self.data.bulletData.length - 1}`;
                        self.setData({
                            rollId, bulletData, dmData
                        })
                        self.setDM()
                    } else if (msg.code * 1 == 103) {
                        // 进入直播间
                        self.setData({
                            isBuying: msg.data.useName + '进入直播间',
                            attractModel: true,

                        })
                        clearTimeout(self.data.buyTime);
                        let buyTime = setTimeout(function () {
                            self.setData({
                                attractModel: false
                            })

                        }, 5000);
                        self.setData({
                            buyTime
                        })

                    } else if (msg.code * 1 == 104) {
                        // 公告
                        self.setData({
                            notice_content: msg.data.content
                        })

                        if (msg.data.content) {
                            self.scrillText(msg.data.content);
                        }
                    } else if (msg.code * 1 == 106) {
                        let livePraiseList = msg.data.praiseList ? msg.data.praiseList : []
                        if (livePraiseList.length > 3) {
                            livePraiseList = livePraiseList.splice(0, 3)
                        }
                        // 前四排行榜/人气值
                        if (msg.data.praiseList) {
                            let headData = self.data.headData;
                            headData.livePraiseList = livePraiseList
                            self.setData({
                                headData
                            })

                        }

                    } else if (msg.code * 1 == 107) {
                        //  直播间商品数量
                        self.setData({
                            goodsNum: msg.data.goodsCount
                        })

                    } else if (msg.code * 1 == 108) {
                        //  点赞
                        // let count = this.data.count;
                        // count += 1;
                        // this.setData({
                        //     count
                        // })

                    } else if (msg.code * 1 == 109) {

                        // 人气值
                        // console.log('人气值变化-------------------------------', msg)

                        let headData = self.data.headData;
                        headData.popularity = msg.data.popularity
                        self.setData({
                            headData
                        })
                    } else if (msg.code * 1 == 110) {
                        // 抢购
                        // 昵称脱敏

                        self.setData({
                            isBuying: msg.data.useName + msg.data.msg,
                            attractModel: true
                        })
                        clearTimeout(self.data.buyTime);
                        let buyTime = setTimeout(function () {
                            self.setData({
                                attractModel: false
                            })
                        }, 5000);
                        self.setData({
                            buyTime
                        })
                    } else if (msg.code * 1 == 111) {
                        //冻结
                        self.setData({
                            frozen: true
                        })
                    } else if (msg.code * 1 == 114) {
                        // 主播断流  直播结束
                        if (msg.data.liveRecordNo != this.data.liveRecordNo) return
                        self.setData({
                            liveOverModal: true,
                            leaveType: 2
                        })

                    } else if (msg.code * 1 == 115) {
                        // console.log('恢复了~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', msg)
                        self.setData({
                            isCutOff: false
                        })

                    }
                } else {
                    // if (v.payload.operationType == 5) {
                    //     // 直播间被解散
                    //     wx.showModal({
                    //         title: '直播结束',
                    //         content: '当前直播已结束，敬请期待下次精彩',
                    //         showCancel: false,
                    //         confirmText: '返回首页',
                    //         success(res) {
                    //             if (res.confirm) {
                    //                 // console.log('用户点击确定')
                    //                 wx.reLaunch({
                    //                     url: '/pages/index/index',
                    //                 });
                    //             }
                    //         },
                    //     });
                    // }
                }
            });

        },

        async onSdkNotReady() {
            let tim = this.data.tim;
            // 如果想使用发送消息等功能，接入侧需驱动 SDK 进入 ready 状态，重新调用 login 接口即可，如下所示：
            let loginPromise = tim.login({
                userID: String(this.data.memberId),
                userSig: this.data.userSig,
            });
            loginPromise.then(() => {
                //加入群聊
                let groupPromise = tim.joinGroup({
                    groupID: this.data.roomNo,
                    type: TIM.TYPES.GRP_AVCHATROOM,
                });
                groupPromise.then((groupRes) => {
                    log.info("onSdkNotReady 重新调用login接口 重新加入直播")
                    console.log('登陆后加入群组````````````````', groupRes.data)

                }).catch((imError) => {
                    log.error('joinGroup imError')

                })


            }).catch((imError) => {
                log.error('login imError', imError)

            })

        },


        start() { },
        enter() {
            var self = this;
            console.log('enter room width roomid: ', self.data.roomID);
            //监听IM事件
            liveroom.setListener({
                receiveMsg: this.receiveMsg,
                onSdkNotReady: this.onSdkNotReady,
                joinGroup: this.joinGroup
            })
            //进入直播间
            liveroom.enterRoom({})
        },
        // 加入组织
        async joinGroup() {

            self.setData({
                isBuying: self.data.nickName + '进入直播间',
                attractModel: true
            })
            clearTimeout(self.data.buyTime);
            let buyTime = null;
            buyTime = setTimeout(function () {
                self.setData({
                    attractModel: false
                })
            }, 5000);
            self.setData({
                buyTime
            })

        },

        stop() {
            console.log('stop() called');
            var self = this;
            console.log('stop pusherContext：', self.data.playerContext);

            self.data.playerContext && self.data.playerContext.stop();
            var players = self.data.members;
            players && players.forEach(p => { p.context && p.context.stop() });
            // 重置信息
            self.setData({
                unload: 1,
                members: [{}],
                visualPlayer: [],
                pusherContext: null,
                playerContext: null,
                linkedPlayerContext: null,
            });
            self.exit();
            liveroom.setListener({});
        },
    },
    attached: function () { },
    detached() {
        var self = this;
        _this = null;
        self.stop()
    }


})