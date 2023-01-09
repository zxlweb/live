/*
 * @Author: qingjiaowomissp zxlweb@163.com
 * @Date: 2022-12-29 17:17:09
 * @LastEditors: qingjiaowomissp zxlweb@163.com
 * @LastEditTime: 2023-01-04 10:45:52
 * @FilePath: \htd-live\components\mlvb-live-room\mlbliveroomview\mlvbliveroomcore.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var TIM = require('tim_wx.js');
var timHandler = require('tim_handler.js');
var tim = null;
var accountInfo = {
    userID: '',			// 用户ID
    userName: '',		// 用户昵称
    userAvatar: '',		// 用户头像URL
    userSig: '',		// IM登录凭证
    sdkAppID: '',		// IM应用ID

};
// 房间信息
roomInfo = {
    roomID: '',			// 视频位房间ID
    roomInfo: '',		// 房间名称
    mixedPlayURL: '', 	// 混流地址
    isCreator: false,	// 是否为创建者
    pushers: [],		// 当前用户信息
    isLoginIM: false,	// 是否登录IM
    isJoinGroup: false,	// 是否加入群
    isDestory: false,	// 是否已解散
    hasJoinAnchor: false,
    roomStatusCode: 0
};
/**
 * [setListener 设置监听事件]
 * @param {options}
 *   onRoomDestroy: 群解散通知
 *   onRecvRoomTextMsg: 消息通知
 */
// 事件
var event = {
    receiveMsg: function () { },
    joinGroup: function () { }


};

function setListener(options) {
    if (!options) { console.log('setListener参数错误', options); return; }
    event.receiveMsg = options.receiveMsg || function () { };

}
/**
 * [enterRoom 进入房间]
 * @param {options}
 *   data: {
 *   	roomID: 房间ID
 *   }
 *   success: 成功回调
 *   fail: 失败回调
 */
function enterRoom(options) {
    roomInfo.isCreator = false;
    roomInfo.isJoinGroup = false;
    if (!options || !options.data.roomID) {
        console.log('enterRoom参数错误', options);
        options.fail && options.fail({
            errCode: -9,
            errMsg: 'enterRoom参数错误'
        });
        return;
    }
    roomInfo.roomID = options.data.roomID;
    proto_enterRoom({
        success: function (ret) {
            options.success && options.success(ret);
            var userInfo = {
                userName: accountInfo.userName,
                userAvatar: accountInfo.userAvatar
            }
            addAudience({
                data: {
                    roomID: options.data.roomID,
                    userID: accountInfo.userID,
                    userInfo: JSON.stringify(userInfo)
                }
            })
        },
        fail: options.fail
    });
}
function proto_enterRoom(options) {
    console.log('开始IM: ', roomInfo.roomID);
    timHandler.applyJoinBigGroup(roomInfo.roomID, afterJoinBigGroup, {
        success: function (ret) {
            // getAnchors({
            //     data: {
            //         roomID: roomInfo.roomID
            //     },
            //     success: function (ret) {
            //         console.log(ret, '进入房间成功')
            //         roomInfo.roomID = ret.data.roomID;
            //         roomInfo.roomInfo = ret.data.roomInfo;
            //         roomInfo.roomCreator = ret.data.roomCreator;
            //         roomInfo.mixedPlayURL = ret.data.mixedPlayURL;
            //         options.success && options.success({
            //             roomID: roomInfo.roomID,
            //             roomCreator: roomInfo.roomCreator,
            //             mixedPlayURL: roomInfo.mixedPlayURL,
            //             pushers: ret.data.pushers
            //         });
            //     },
            //     fail: function (ret) {
            //         options.fail && options.fail({
            //             errCode: ret.errCode,
            //             errMsg: ret.errMsg || '拉取主播信息失败'
            //         });
            //     }
            // });

            // let groupPromise = tim.joinGroup({
            //     groupID: this.data.roomNo,
            //     type: TIM.TYPES.GRP_AVCHATROOM,
            // });
            // groupPromise.then((groupRes) => {
            //     let self = this;
            //     let tim = this.data.tim

            //     let message = tim.createTextMessage({
            //         to: this.data.roomNo,
            //         type: TIM.TYPES.MSG_TEXT,
            //         conversationType: TIM.TYPES.CONV_GROUP,
            //         payload: {
            //             text: JSON.stringify({
            //                 code: '103',
            //                 data: { useName: this.data.nickName, msg: '进入直播间' },
            //             }),
            //         },
            //     });
            //     let res = await tim.sendMessage(message);
            //     console.log('登陆后加入群组````````````````', groupRes.data)

            // }).catch((imError) => {
            //     log.error('joinGroup imError')

            // })


            //xxxx 加入群聊
        },

        fail: options.fail
    });
}

/**
 * [sendRoomTextMsg 发送文本消息]
 * @param {options}
 *   data: {
 *   	msg: 文本消息
 *   }
 */
function sendRoomTextMsg(options) {
    if (!options || !options.data.msg || !options.data.msg.replace(/^\s*|\s*$/g, '')) {
        console.log('sendRoomTextMsg参数错误', options);
        options.fail && options.fail({
            errCode: -9,
            errMsg: 'sendRoomTextMsg参数错误'
        });
        return;
    }
    timHandler.sendTextMessage({
        text: options.data.msg,
        to: options.data.roomID
    }, options);
}


/**
 * [loginIM 登录IM]
 * @param {options}
 *   data: {
 *   	roomID: 房间ID
 *   }
 *   success: 成功回调
 *   fail: 失败回调
 */
function loginIM(options) {
    tim = TIM.create({
        SDKAppID: accountInfo.sdkAppID
    })
    //初始化IM
    timHandler.init({
        // accountMode: accountInfo.accountMode,
        // accountType: '0',
        sdkAppID: accountInfo.sdkAppID,
        //  avChatRoomId: options.roomID || 0,
        //  selType: TIM.TYPES.CONV_GROUP,
        //  selToID: options.roomID || 0,
        //  selSess: null,//当前聊天会话
        tim: tim
    });

    //当前用户身份
    var loginInfo = {
        'sdkAppID': accountInfo.sdkAppID, //用户所属应用id,必填
        'userId': accountInfo.userID, //当前用户ID,必须是否字符串类型，选填
        'userName': accountInfo.userName, //当前用户昵称，选填
        'userSig': accountInfo.userSig, //当前用户身份凭证，必须是字符串类型，选填
        'appIDAt3rd': accountInfo.sdkAppID, //用户所属应用id，必填
        'accountType': "0", //用户所属应用帐号类型，填0
    };

    //监听事件
    initListener()
    timHandler.sdkLogin(loginInfo, roomId, afterLoginIM, options);
}
function afterLoginIM(options) {
    // tim登录成功
    console.log('tim登录成功');
    roomInfo.isLoginIM = true;
    options.callback.success && options.callback.success({
        userName: accountInfo.userName
    });
}
function afterJoinBigGroup(options) {
    if (options.errCode && options.errCode != 10025) {
        console.log('tim进群失败: ', options);
        options.callback.fail && options.callback.fail({
            errCode: -2,
            errMsg: 'IM进群失败'
        });
        return;
    }
    roomInfo.isJoinGroup = true;
    console.log('进入IM房间成功: ', roomInfo.roomID);
    options.callback.success && options.callback.success({});
}

//im 事件监听
function initListener() {
    unbind()
    bind()
}
function bind() {
    tim.on(TIM.EVENT.SDK_READY, onSdkReady);
    tim.on(TIM.EVENT.SDK_NOT_READY, onSdkNotReady);
    tim.on(TIM.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
    tim.on(TIM.EVENT.NET_STATE_CHANGE, onNetStateChange);
    tim.on(TIM.EVENT.ERROR, onError);
}

function unbind() {
    tim.off(TIM.EVENT.SDK_READY, onReadyStateUpdate)
    // SDK NOT READT
    tim.off(TIM.EVENT.SDK_NOT_READY, onReadyStateUpdate)
    //收到新消息
    tim.off(TIM.EVENT.MESSAGE_RECEIVED, onReceiveMessage)
    // 网络监测
    tim.off(TIM.EVENT.NET_STATE_CHANGE, onNetStateChange)
    // SDK内部出错
    tim.off(TIM.EVENT.ERROR, onError)
}
function onReceiveMessage() {
    event.receiveMsg()

}
function onNetStateChange(event) {
    log.info('IM onNetStateChange', event)
    console.log('IM onNetStateChange', event)
    // v2.5.0 起支持
    // event.data.state 当前网络状态，枚举值及说明如下：
    // TIM.TYPES.NET_STATE_CONNECTED - 已接入网络
    // TIM.TYPES.NET_STATE_CONNECTING - 连接中。很可能遇到网络抖动，SDK 在重试。接入侧可根据此状态提示“当前网络不稳定”或“连接中”
    // TIM.TYPES.NET_STATE_DISCONNECTED - 未接入网络。接入侧可根据此状态提示“当前网络不可用”。SDK 仍会继续重试，若用户网络恢复，SDK 会自动同步消息
    if (event.data.state == 'TIM.TYPES.NET_STATE_CONNECTING' || event.data.state == 'TIM.TYPES.NET_STATE_DISCONNECTED') {

        log.error('IM onNetStateChange', event)

    }

}
function onSdkReady() {
    console.log('直播ready')

}
function onError(event) {
    log.error('IM onERROR', event)
    console.log('IM onERROR', event)

}


