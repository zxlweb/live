/*
 * @Author: qingjiaowomissp zxlweb@163.com
 * @Date: 2022-12-29 17:17:09
 * @LastEditors: qingjiaowomissp zxlweb@163.com
 * @LastEditTime: 2023-01-29 17:50:42
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
    roomNo: '',			// 视频位房间ID
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
// 事件
var event = {
    onRecvRoomTextMsg: function () { },// 消息通知
};
/**
 * [setListener 设置监听事件]
 * @param {options}
 *   onRoomDestroy: 群解散通知
 *   onRecvRoomTextMsg: 消息通知
 */

function setListener(options) {
    if (!options) { console.log('setListener参数错误', options); return; }
    event.onRecvRoomTextMsg = options.onRecvRoomTextMsg || function () { };

}
/**
 * [login 初始化登录信息]
 * @param {options}
 *   data: {
 *    userID: 用户ID
 *    userSig: 用户sig
 *    sdkAppID: IM应用ID
 *    userName: 用户昵称
 *    userAvatar: 用户头像地址
 *   }
 *   success: 成功回调
 *   fail: 失败回调
 *
 * @return success
 *   userName: 用户昵称
 */
function login(options) {
    if (!options || !options.data.sdkAppID || !options.data.userID || !options.data.userSig) {
        console.log('init参数错误', options);
        options.fail && options.fail({
            errCode: -9,
            errMsg: 'init参数错误'
        });
        return;
    }
    accountInfo.userID = options.data.userID;
    accountInfo.userSig = options.data.userSig;
    accountInfo.sdkAppID = options.data.sdkAppID;
    accountInfo.userName = options.data.userName;
    accountInfo.userAvatar = options.data.userAvatar;
    // 登录IM
    loginIM({
        success: function (ret) {
            options.success && options.success({
                userID: accountInfo.userID,
                userName: accountInfo.userName
            });
        },
        fail: function (ret) {
            console.error("IM登录失败:", JSON.stringify(ret));
            options.fail && options.fail({
                errCode: -999,
                errMsg: "IM登录失败"
            });
        }
    });
}
/**
 * [enterRoom 进入房间]
 * @param {options}
 *   data: {
 *   	roomNo: 房间ID
 *   }
 *   success: 成功回调
 *   fail: 失败回调
 */
function enterRoom(options) {
    roomInfo.isCreator = false;
    roomInfo.isJoinGroup = false;
    if (!options || !options.data.roomNo) {
        console.log('enterRoom参数错误', options);
        options.fail && options.fail({
            errCode: -9,
            errMsg: 'enterRoom参数错误'
        });
        return;
    }
    roomInfo.roomNo = options.data.roomNo;
    proto_enterRoom({
        success: function (ret) {
            options.success && options.success(ret);

        },
        fail: options.fail
    });
}
/**
 * [proto_enterRoom 进入房间预处理]
 * @param {options}
 *   data: {
 *   	roomNo: 房间ID
 *   }
 *   success: 成功回调
 *   fail: 失败回调
 */
function proto_enterRoom(options) {
    console.log('开始IM: ', roomInfo.roomNo);
    timHandler.applyJoinBigGroup(roomInfo.roomNo, afterJoinBigGroup, {
        success: function (ret) {
            //加入群以后的操作
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
        to: options.data.roomNo
    }, options);
}


/**
 * [loginIM 登录IM]
 * @param {options}
 *   data: {
 *   	roomNo: 房间ID
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
        accountType: '0',
        sdkAppID: accountInfo.sdkAppID,
        avChatroomNo: accountInfo.roomNo || 0,
        selType: TIM.TYPES.CONV_GROUP,
        selToID: accountInfo.roomNo || 0,
        selSess: null,//当前聊天会话
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
    timHandler.sdkLogin(loginInfo, roomInfo.roomNo, afterLoginIM, options);
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
    console.log('进入IM房间成功: ', roomInfo.roomNo);
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
    event.onRecvRoomTextMsg()

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
/**
 * 对外暴露函数
 * @type {Object}
 */
module.exports = {
    login: login,//登录IM
    enterRoom: enterRoom,// 加入房间
    setListener: setListener,// 设置监听事件
}





