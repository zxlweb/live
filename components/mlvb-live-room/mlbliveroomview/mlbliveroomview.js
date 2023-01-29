/*
 * @Author: qingjiaowomissp zxlweb@163.com
 * @Date: 2022-12-29 16:01:56
 * @LastEditors: qingjiaowomissp zxlweb@163.com
 * @LastEditTime: 2023-01-29 14:46:04
 * @FilePath: \htd-live\components\mlvb-live-room\mlbliveroomview\mlbliveroomview.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var _this = null;
var liveroom = require('./mlvbliveroomcore.js');
Component({
    properties: {
        roomNo: {
            type: String, value: '', observer: function (newVal, oldVal) {
                this.data.roomNo = newVal;
            }
        },
    },
    data: {
        roomNo: '',
        playerContext: null,
        pullFlowUrl: '',//拉流地址
        nickName: '',//昵称
        resLiveRoomGoodsDto: null, //主推商品
        liveOverModal: false,//直播结束弹框N
        videoUrl: ''//回放地址


    },
    methods: {
        createPlayerContext: function () {
            this.setData({
                playerContext: wx.createLivePlayerContext("player")
            })
        },
        onRecvRoomTextMsg(ret) {
            var self = _this;
            console.log("onRecvRoomTextMsg called, ret: ", ret)
            self.triggerEvent('RoomEvent', {
                tag: 'recvTextMsg',
                code: 0,
                detail: ret
            })
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
            console.log('enter room width roomNo: ', self.data.roomNo);
            //监听IM事件
            liveroom.setListener({
                onRecvRoomTextMsg: this.onRecvRoomTextMsg,
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