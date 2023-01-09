// template/specs/specs.js
const apiWork = require('../../utils/api');
const reg = require('../../utils/reg');
const { isLogin } = require('../../utils/util');


const app = getApp()
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        specSpuId: {
            type: String,
            value: ''
        },
        btnValue: {
            type: String,
            value: '确定'
        },
        extralInfo: {
            type: Object,
            value: null
        }

    },
    observers: {
        specSpuId(value) {
            if (app.globalData.isIphoneX) {
                this.setData({
                    globalBottom: 34 //苹果x底部黑条高度
                })
            } else {
                this.setData({
                    globalBottom: 0
                })
            }
            this.setData({ goodsLimit: false })
            if (!value) return;
            this.getDetailInfo(value);
        },

    },

    /**
     * 组件的初始数据
     */
    data: {
        defaultGoodsImg: '../../assets/images/default_goods.png',
        buyCount: 1, //购买数量
        onShelvesFlag: true, //是否下架， 接口0 下架，1上架
        specTabIsShow: true, //是否有规格
        goodsInfo: {}, //商品信息
        currPrice: 0, //卖价
        originPrice: 0, //原价
        specsTxt: '1', //已选规格的
        mainPic: '', //商品图片
        currSpec: {}, //当前规格对象数据
        keys: [],
        selectSpec: {}, // 选择数据的对象
        specList: [],
        skuList: [],
        isShow: false,
        vipPrice: '',
        specSend: { picUrl: '' },
        goodsLimit: false
    },

    /**
     * 组件的方法列表
     */
    methods: {
        //获取商品详情数据
        getDetailInfo(id) {
            let _this = this;
            let param = {
                skuId: parseInt(id)
            };
            if (this.data.extralInfo && this.data.extralInfo.liveRecordNo) {
                param = Object.assign({}, { liveRecordNo: this.data.extralInfo.liveRecordNo, liveType: this.data.extralInfo.liveType }, param)
            }
            apiWork.request('/goods/front/product/detail', 'post', param, (res) => {
                let d = res;
                if (d.code == '0') {
                    _this.setData({
                        goodsInfo: d.data,
                        buyCount: 1,
                        isShow: true
                    });
                    _this.initData();
                    //普通
                    if (d.data.defaultSku.promotionFlag === 0) {
                        _this.setData({
                            currPrice: d.data.defaultSku.skuSalePrice,
                            originPrice: null
                        });
                        if (d.data.defaultSku.benefitPrice) {
                            _this.setData({
                                vipPrice: d.data.defaultSku.benefitPrice
                            });
                        }
                    } else if (d.data.defaultSku.promotionFlag === 5) {
                        //接龙
                        _this.setData({
                            currPrice: d.data.defaultSku.skuPromotionSalePrice,
                            originPrice: d.data.defaultSku.skuPromotionOrginPrice
                        });
                    } else {
                        _this.setData({
                            currPrice: d.data.defaultSku.skuPromotionSalePrice,
                            originPrice: d.data.defaultSku.skuPromotionOrginPrice
                        });
                    }
                    //判断有没有规格
                    let specsTxt = _this.data.specsTxt;
                    if (d.data.chooseSpecNames.length <= 0) {
                        //无规格
                        _this.setData({
                            specTabIsShow: false,
                            specsTxt: 1,
                            mainPic: d.data.picUrlList[0]
                        });
                    } else {
                        _this.setData({
                            specTabIsShow: true
                        });
                        if (this.data.mainPic == '') {
                            _this.setData({
                                mainPic: d.data.picUrlList[0]
                            });
                        }
                    }
                } else if (d.code == '-5') {
                    //商品不存在或者下架
                    wx.showToast({
                        title: d.message || '商品查询失败',
                        icon: 'none',
                        duration: 3000
                    });
                } else {
                    wx.showToast({
                        title: '商品查询失败',
                        icon: 'none',
                        duration: 3000
                    });
                }
            });
        },
        //初始化数据结构
        initData() {
            let self = this;
            let chooseSpecMap = self.data.goodsInfo.chooseSpecMap;
            let chooseSpecNames = self.data.goodsInfo.chooseSpecNames;
            let defaultSku = self.data.goodsInfo.defaultSku;
            let skus = self.data.goodsInfo.skus;
            let skuobj = {};
            // let arr = []
            //如果有default 将default放在第一个
            if (defaultSku) {
                for (let i = 0; i < skus.length; i++) {
                    if (skus[i].skuId == defaultSku.skuId) {

                        defaultSkuIndex = i;
                        break
                    }

                }
                let defaultSkuItem = skus.splice(defaultSkuIndex, 1);
                skus.unshift(defaultSkuItem[0])

            }

            for (let j = 0; j < chooseSpecNames.length; j++) {
                let skuArr = [];
                skuArr = skus.map((item) => item.spec[chooseSpecNames[j]]);
                skuobj[chooseSpecNames[j]] = Array.from(new Set(skuArr));
            }
            let specList = [];
            for (let i = 0; i < chooseSpecNames.length; i++) {
                let obj = {};
                obj.title = chooseSpecNames[i];
                obj.list = skuobj[chooseSpecNames[i]];
                specList.push(obj);
            }
            let defaultSkuIndex = ''

            for (let idx = 0; idx < skus.length; idx++) {
                skus[idx].spec = self.objToArr(chooseSpecNames, skus[idx].spec);
            }
            let selectSpec = {};
            specList.forEach((item) => {
                selectSpec[item.title] = item.list[0];
            });
            specList = specList.map((item) => {
                return {
                    title: item.title,
                    list: item.list.map((its) => {
                        return {
                            name: its,
                            able: true
                        };
                    })
                };
            });
            let skuList = skus;
            let currSpec = {};
            currSpec = skuList.find(
                (item) => JSON.stringify(item.spec.sort()) == JSON.stringify(skus[0].spec.sort())
            );

            self.setData({
                mainPic: skus[0].picUrl,
                specList: specList,
                skuList: skuList,
                selectSpec: selectSpec,
                selectSpecArr: skus[0].spec,
                specsTxt: skus[0].spec.join(','),
                currSpec: currSpec
            });
        },

        isAble(key, value) {
            let copySelectSpec = JSON.parse(JSON.stringify(this.data.selectSpec));
            copySelectSpec[key] = value;
            let flag = this.data.skuList.some((item) => {
                let i = 0;
                for (let k in copySelectSpec) {
                    if (copySelectSpec[k] != '' && item.spec.includes(copySelectSpec[k])) {
                        i++;
                    } else if (copySelectSpec[k] == '') {
                        i++;
                    }
                }
                return i == this.data.specList.length;
            });
            return flag;
        },
        objToArr(keyArr, obj) {
            let arr = [];
            for (let i = 0; i < keyArr.length; i++) {
                arr.push(obj[keyArr[i]]);
            }
            return arr;
        },

        //关闭规格弹框
        closeSpecs() {
            // this.triggerEvent('emitSpecsClose',false)
            this.setData({
                isShow: false,
                currSpec: {}
            });
        },
        //数量减少
        reduceNum() {
            let buyCount = Number(this.data.buyCount);
            buyCount--;
            if (buyCount < 1) {
                this.setData({
                    buyCount: 1
                });
                wx.showToast({
                    title: '购买数量不能少于1',
                    icon: 'none',
                    duration: 3000
                });
                return;
            }
            this.setData({
                buyCount: buyCount
            });
            if (!this.data.specTabIsShow) {
                //没有规格
                this.setData({
                    specsTxt: buyCount
                });
            } else {
                //有规格
            }
        },
        // //新增数量
        addNum() {
            let buyCount = Number(this.data.buyCount);
            buyCount++;
            //不能超过库存值
            if (buyCount > this.data.currSpec.availableNum ? this.data.currSpec.availableNum : 0) {
                this.setData({
                    buyCount: this.data.currSpec.availableNum ? this.data.currSpec.availableNum : 1
                });
                wx.showToast({
                    title: '购买数量不能超过库存数量',
                    icon: 'none',
                    duration: 3000
                });
                return;
            }
            this.setData({
                buyCount: buyCount
            });
            if (!this.data.specTabIsShow) {
                //没有规格
                this.setData({
                    specsTxt: buyCount
                });
            } else {
                //有规格
            }
        },
        //规格选择数量change事件
        selectNumChange(e) {
            let value = ''

            if (/\D|^0/g.test(e.detail.value)) {

                value = 0
            } else {
                value = e.detail.value

            }


            let buyCount = Number(value);
            if (buyCount > this.data.currSpec.availableNum ? this.data.currSpec.availableNum : 0) {
                this.setData({
                    buyCount: this.data.currSpec.availableNum ? this.data.currSpec.availableNum : 1
                });
                wx.showToast({
                    title: '购买数量不能超过库存数量',
                    icon: 'none',
                    duration: 3000
                });
                return;
            }
            if (buyCount == 0) {
                wx.showToast({
                    title: '购买数量不能为空或为0',
                    icon: 'none',
                    duration: 3000
                });

                return;
            }
            this.setData({
                buyCount: buyCount
            });
        },
        specificationBtn(e) {
            let key = e.target.dataset.key;
            let able = e.target.dataset.able;
            let value = e.target.dataset.value;
            let selectSpec = this.data.selectSpec;
            let specList = this.data.specList;
            if (!able) return;
            if (selectSpec[key] === value) {
                selectSpec[key] = value;
            } else {
                selectSpec[key] = value;
            }
            this.setData({
                selectSpec: selectSpec
            });
            specList.forEach((item) => {
                item.list.forEach((its) => {
                    its.able = this.isAble(item.title, its.name);
                });
            });
            this.setData({
                specList: specList
            });
            let flag = true;
            for (const key in selectSpec) {
                if (selectSpec[key] == '') {
                    flag = false;
                    return;
                }
            }
            if (flag) {
                // 说明都选中了匹配sku
                let selectSpecArr = [];
                for (const key in selectSpec) {
                    selectSpecArr.push(selectSpec[key]);
                }
                let currSpec = {};
                let onShelvesFlag = true;
                currSpec = this.data.skuList.find(
                    (item) =>
                        JSON.stringify(item.spec.sort()) == JSON.stringify(selectSpecArr.sort())
                );
                if (currSpec.onShelvesFlag === 0) {
                    //已下架
                    onShelvesFlag = false;
                } else {
                    //this.btnObj.joinShoppingCartComfirm = true;
                    onShelvesFlag = true;
                }
                this.setData({
                    currSpec: currSpec,
                    currPrice: currSpec.skuSalePrice,
                    specsTxt: selectSpecArr.join(','),
                    mainPic: currSpec.picUrl ? currSpec.picUrl : this.data.mainPic,
                    onShelvesFlag: onShelvesFlag
                });
            }
        },
        //确定按钮点击
        specsSure() {

            let _this = this;
            if (_this.data.specTabIsShow) {
                //有规格
                let selectSpec = _this.data.selectSpec;
                for (const key in selectSpec) {
                    if (selectSpec[key] === '') {
                        wx.showToast({
                            title: '请选择商品规格',
                            icon: 'none',
                            duration: 3000
                        });
                        return;
                    }
                }
                let currSpecKeys = Object.keys(_this.data.currSpec);
                if (currSpecKeys.length == 0) {
                    wx.showToast({
                        title: '请选择商品规格',
                        icon: 'none',
                        duration: 3000
                    });
                    return;
                }
            }

            if (_this.data.buyCount == 0) {
                wx.showToast({
                    title: '购买数量不能为空或为0',
                    icon: 'none',
                    duration: 3000
                });
                return;
            }
            if (!reg.positiveInteger.test(+this.data.buyCount)) {
                wx.showToast({
                    title: '请输入数字',
                    icon: 'none',
                    duration: 3000
                });
                return;
            }
            let param = {};
            if (_this.data.specTabIsShow) {
                param = {
                    num: _this.data.buyCount,
                    sellerId: wx.getStorageSync("orgId"),
                    sellerType: _this.data.goodsInfo.orgInfo.orgType,
                    skuId: _this.data.currSpec.skuId,
                    shopId: _this.data.goodsInfo.orgInfo.orgId
                };
            } else {
                param = {
                    num: _this.data.buyCount,
                    sellerId: wx.getStorageSync("orgId"),
                    sellerType: _this.data.goodsInfo.orgInfo.orgType,
                    skuId: _this.data.goodsInfo.defaultSku.skuId,
                    shopId: _this.data.goodsInfo.orgInfo.orgId
                };
            }

            apiWork.request(
                '/order/front/SellOrderShoppingcart/insertShoppingcart',
                'post',
                param,
                (res) => {
                    let d = res;
                    if (d.code == 0) {
                        _this.triggerEvent('getShoppingCartNum')
                        setTimeout(() => {
                            wx.showToast({
                                title: '加入购物车成功',
                                icon: 'none'
                            });
                        }, 300);

                        this.closeSpecs();
                        this.getShoppingCartNum();
                    }
                }
            );
        },
        buyNow() {

            let goodsInfo = this.data.goodsInfo;
            let defaultSku = goodsInfo.defaultSku
            let promotionFlag = defaultSku.promotionFlag;
            switch (promotionFlag) {
                //'普通商品'
                case 0:
                    this.goBuyDo(goodsInfo);
                    console.log('gg'); break;
                // '拼团商品'
                case 1: this.aloneBuyCkDo(goodsInfo); break;
                // '秒杀商品'
                case 2: ; break;
                //'套餐商品'
                case 3: this.aloneBuyMealDo(goodsInfo); break;
            }

            console.log('立即购买', goodsInfo)
            //立即下单
        },
        //限购查询
        checkLimitNum(num) {

            let params = {
                liveRecordNo: this.data.extralInfo.liveRecordNo,
                memberId: wx.getStorageSync('memberId'),
                skuId: this.data.currSpec.skuId,
                num

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
        //普通商品立即购买
        goBuyDo(goodsInfo) {
            let _this = this;

            if (isLogin()) {
                this.checkLimitNum(this.data.buyCount).then((res) => {
                    if (res && this.data.extralInfo.liveRecordNo) {
                        //直播商品--限购
                        let timer = null
                        wx.hideLoading()
                        timer = setTimeout(() => {
                            wx.showToast({
                                title: '已超过限购数量',
                                icon: 'none',
                                complete: function () {
                                    clearTimeout(timer)
                                }
                            })
                        })

                    } else {
                        //未限购
                        this.setData({
                            goodsLimit: false
                        })
                        let self = this;
                        let defaultSku = goodsInfo.defaultSku
                        let couponSend = {}
                        let specSend = this.data.specSend;
                        specSend.isLeader = 0; //是否为团长，1团长，0非团长
                        specSend.promotionAssembleInfoId = '';
                        specSend.isOriginal = 1; //是否单独购买 1是，0不是
                        specSend.promotionId = goodsInfo.defaultSku.promotionId;
                        specSend.skuPromotionSalePrice = goodsInfo.defaultSku.skuPromotionSalePrice;
                        //普通商品
                        //判断优惠券有没有
                        if (goodsInfo.defaultSku.couponFlag == 0) {
                            //没有
                            couponSend.couponPrefix = null;
                            couponSend.couponSuffix = null;
                        } else {
                            couponSend.couponPrefix = defaultSku.couponPrefix;
                            couponSend.couponSuffix = defaultSku.couponSuffix;
                        }

                        specSend.isOriginal = 1;
                        specSend.stockNum = this.data.buyCount;
                        specSend.skuPromotionSalePrice = defaultSku.skuPromotionSalePrice;
                        //判断sku图片，如果没有，取spu第一张
                        if (this.data.specSend.picUrl == '') {
                            //sku没有图片
                            if (goodsInfo.picUrlList.length > 0) {
                                //去spu第一张
                                specSend.picUrl = goodsInfo.picUrlList[0];
                            } else {
                                specSend.picUrl = this.data.defaultGoodsImg;
                            }
                        }

                        //普通商品，会员价需要传递 benefitPrice
                        specSend.benefitPrice = defaultSku.benefitPrice;
                        specSend = { ...specSend, ...couponSend };
                        this.setData({
                            specSend
                        })

                        //校验
                        let param = [
                            {
                                sellerType: goodsInfo.orgInfo.orgType,
                                sellerId: goodsInfo.orgInfo.orgId,
                                shopId: goodsInfo.orgInfo.orgId,
                                sellerName: null,
                                orderChannel: wx.getStorageSync('channelCode'),
                                skuId: _this.data.currSpec.skuId,
                                num: self.data.buyCount,
                                goodsSkuInfo: {
                                    spuId: goodsInfo.spuId,
                                    skuId: _this.data.currSpec.skuId,
                                    mainPicUrl: goodsInfo.defaultSku.picUrl,
                                    spuName: goodsInfo.spuName,
                                    typeOfProduct: 1,
                                    sellPoint: goodsInfo.sellPoint,
                                    categoryId: goodsInfo.categoryId,
                                    inputVat: null,
                                    outputVat: null,
                                    supplierId: null,
                                    orgId: goodsInfo.orgInfo.orgId,
                                    orgType: goodsInfo.orgInfo.orgType,
                                    orgName: null,
                                    skuSpec: null,
                                    labelInfoList: [],
                                    onShelvesFlag: goodsInfo.defaultSku.onShelvesFlag,
                                    stockNum: goodsInfo.defaultSku.stockNum,
                                    basePrice: 0.01,
                                    purchasePrice: null,
                                    limitPrice: null,
                                    skuSalePrice: goodsInfo.defaultSku.skuSalePrice,
                                    skuPromotionSalePrice:
                                        goodsInfo.defaultSku.skuPromotionSalePrice,
                                    couponInfo: {
                                        couponPrefix: goodsInfo.defaultSku.couponInfo.couponPrefix,
                                        couponSuffix: goodsInfo.defaultSku.couponInfo.couponSuffix
                                    },
                                    couponFlag: goodsInfo.defaultSku.couponFlag,
                                    promotionFlag: goodsInfo.defaultSku.promotionFlag,
                                    promotionId: goodsInfo.defaultSku.promotionId
                                },

                                checked: true,
                                isOriginal: 1 //是否单独购买
                            }
                        ];
                        if (self.data.extralInfo && self.data.extralInfo.liveRecordNo) {
                            param[0].liveRecordNo = self.data.extralInfo.liveRecordNo

                        }
                        apiWork.request('/order/front/SellOrderShoppingcart/examineShoppingcartList', 'post', param, (res) => {

                            if (res.code == '0') {
                                let miniDataParam = {
                                    isOriginal: 1, //是否单独购买
                                    skuId: _this.data.currSpec.skuId,
                                    stockNum: self.data.specSend.stockNum,
                                    distributionMemberId: self.data.distributionMemberId,
                                    distributionActivityId: self.data.distributionActivityId,
                                    newAward: self.data.newAward,
                                    transactionAward: self.data.transactionAward,

                                };
                                if (self.data.extralInfo && self.data.extralInfo.liveRecordNo) {
                                    //直播场景下单
                                    miniDataParam = Object.assign({}, miniDataParam, self.data.extralInfo, { memberId: wx.getStorageSync('memberId') })

                                }
                                let miniParams = JSON.stringify(miniDataParam);
                                wx.navigateTo({
                                    url:
                                        '/pages/order-web-view/index?miniParams=' +
                                        miniParams
                                });
                            } else if (res.code == '-1') {
                                let timer = null
                                wx.hideLoading()
                                timer = setTimeout(() => {
                                    wx.showToast({
                                        title: '库存不足' || '校验失败',
                                        icon: 'error',

                                        complete: function () {
                                            clearTimeout(timer)
                                        }
                                    })
                                })


                            }
                        })
                    }
                })

            }
        },
        //拼团商品立即购买
        aloneBuyCkDo(goodsInfo) {
            let self = this;
            let defaultSku = goodsInfo.defaultSku
            let couponSend = {}
            let specSend = this.data.specSend;
            specSend.isLeader = 0; //是否为团长，1团长，0非团长
            specSend.promotionAssembleInfoId = '';
            specSend.isOriginal = 1; //是否单独购买 1是，0不是
            specSend.promotionId = goodsInfo.defaultSku.promotionId;
            specSend.skuPromotionSalePrice = goodsInfo.defaultSku.skuPromotionSalePrice;
            //console.log(this.specSend );

            //校验
            let param = [
                {
                    //"id": 80,
                    sellerType: goodsInfo.orgInfo.orgType,
                    sellerId: goodsInfo.orgInfo.orgId,
                    shopId: goodsInfo.orgInfo.orgId,
                    sellerName: null,
                    //"memberId": 49,
                    orderChannel: JSON.parse(localStorage.getItem('cusObjInfo')).channelCode,
                    skuId: goodsInfo.defaultSku.skuId,
                    num: _this.buyNum,
                    goodsSkuInfo: {
                        spuId: goodsInfo.spuId,
                        skuId: goodsInfo.defaultSku.skuId,
                        mainPicUrl: goodsInfo.defaultSku.picUrl,
                        spuName: goodsInfo.spuName,
                        typeOfProduct: 1,
                        sellPoint: goodsInfo.sellPoint,
                        categoryId: goodsInfo.categoryId,
                        //"categoryName": "洗衣机",
                        //"brandId": 79746513764353,
                        //"brandName": "三星",
                        //"calcUnitId": 18,
                        //"calcUnitName": "台",
                        inputVat: null,
                        outputVat: null,
                        supplierId: null,
                        orgId: goodsInfo.orgInfo.orgId,
                        orgType: goodsInfo.orgInfo.orgType,
                        orgName: null,
                        skuSpec: null,
                        labelInfoList: [],
                        onShelvesFlag: goodsInfo.defaultSku.onShelvesFlag,
                        stockNum: goodsInfo.defaultSku.stockNum,
                        basePrice: 0.01,
                        purchasePrice: null,
                        limitPrice: null,
                        //"barcode": "22222222222222222",
                        skuSalePrice: goodsInfo.defaultSku.skuSalePrice,
                        skuPromotionSalePrice: goodsInfo.defaultSku.skuPromotionSalePrice,
                        couponInfo: {
                            couponPrefix: goodsInfo.defaultSku.couponInfo.couponPrefix,
                            couponSuffix: goodsInfo.defaultSku.couponInfo.couponSuffix
                        },
                        couponFlag: goodsInfo.defaultSku.couponFlag,
                        promotionFlag: goodsInfo.defaultSku.promotionFlag,
                        promotionId: goodsInfo.defaultSku.promotionId
                    },
                    checked: true,
                    isOriginal: 1 //是否单独购买
                }
            ];
            if (self.data.extralInfo && self.data.extralInfo.liveRecordNo) {
                param[0].liveRecordNo = self.data.extralInfo.liveRecordNo

            }
            this.$axios
                .post('/order/front/SellOrderShoppingcart/examineShoppingcartList', param)
                .then(res => {
                    let d = res.data;
                    if (d.code == '0') {
                        _this.$local.isWeChatMiniApp().then(res => {
                            if (res) {
                                //小程序环境
                                let miniDataParam = {
                                    isOriginal: 1, //是否单独购买
                                    skuId: _this.specSend.skuId,
                                    stockNum: _this.specSend.stockNum,
                                    distributionMemberId: this.specSend.distributionMemberId,
                                    distributionActivityId: this.specSend
                                        .distributionActivityId,
                                    newAward: this.specSend.newAward,
                                    transactionAward: this.specSend.transactionAward

                                };
                                if (self.data.extralInfo && self.data.extralInfo.liveRecordNo) {
                                    //直播场景下单
                                    miniDataParam = Object.assign({}, miniDataParam, self.data.extralInfo, { memberId: wx.getStorageSync('memberId') })

                                }
                                let miniParams = JSON.stringify(miniDataParam);
                                wx.miniProgram.navigateTo({
                                    url: '/pages/order-web-view/index?miniParams=' + miniParams
                                });
                            } else {
                                _this.$store.dispatch('saveConfirmGoods', _this.specSend);
                                _this.$router.push({
                                    path: '/orderConfirm'
                                });
                            }
                        });
                    } else if (d.code == '-1') {
                        wx.showToast({
                            title: d.message || '校验失败',
                            icon: 'error',
                            duration: 3000
                        })
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        },
        //套餐商品立即购买
        aloneBuyMealDo(goodsInfo) {
            let self = this;
            let defaultSku = goodsInfo.defaultSku
            let couponSend = {}
            let specSend = this.data.specSend;
            //判断优惠券有没有
            if (defaultSku.couponFlag == 0) {
                //没有
                couponSend.couponPrefix = null;
                couponSend.couponSuffix = null;
            } else {
                couponSend.couponPrefix = defaultSku.couponPrefix;
                couponSend.couponSuffix = defaultSku.couponSuffix;
            }
            specSend.isOriginal = 1; //是否单独购买 1是，0不是
            specSend.togetherNum = this.data.buyCount;
            specSend.promotionId = defaultSku.promotionId;
            specSend.skuPromotionSalePrice = defaultSku.skuPromotionSalePrice;
            specSend.picUrl = goodsInfo.picUrlList[0];
            specSend = { ...specSend, ...couponSend };
            this.setData({
                specSend
            })

            //console.log(this.specSend );
            //校验
            let param = [
                {
                    //"id": 80,
                    sellerType: goodsInfo.orgInfo.orgType,
                    sellerId: goodsInfo.orgInfo.orgId,
                    shopId: goodsInfo.orgInfo.orgId,
                    sellerName: null,
                    //"memberId": 49,
                    orderChannel: JSON.parse(localStorage.getItem('cusObjInfo')).channelCode,
                    skuId: goodsInfo.defaultSku.skuId,
                    num: this.data.buyCount,
                    goodsSkuInfo: {
                        spuId: goodsInfo.spuId,
                        skuId: goodsInfo.defaultSku.skuId,
                        mainPicUrl: goodsInfo.defaultSku.picUrl,
                        spuName: goodsInfo.spuName,
                        typeOfProduct: 1,
                        sellPoint: goodsInfo.sellPoint,
                        categoryId: goodsInfo.categoryId,
                        //"categoryName": "洗衣机",
                        //"brandId": 79746513764353,
                        //"brandName": "三星",
                        //"calcUnitId": 18,
                        //"calcUnitName": "台",
                        inputVat: null,
                        outputVat: null,
                        supplierId: null,
                        orgId: goodsInfo.orgInfo.orgId,
                        orgType: goodsInfo.orgInfo.orgType,
                        orgName: null,
                        skuSpec: null,
                        labelInfoList: [],
                        onShelvesFlag: goodsInfo.defaultSku.onShelvesFlag,
                        stockNum: goodsInfo.defaultSku.stockNum,
                        basePrice: 0.01,
                        purchasePrice: null,
                        limitPrice: null,
                        //"barcode": "22222222222222222",
                        skuSalePrice: goodsInfo.defaultSku.skuSalePrice,
                        skuPromotionSalePrice: goodsInfo.defaultSku.skuPromotionSalePrice,
                        couponInfo: {
                            couponPrefix: goodsInfo.defaultSku.couponInfo.couponPrefix,
                            couponSuffix: goodsInfo.defaultSku.couponInfo.couponSuffix
                        },
                        couponFlag: goodsInfo.defaultSku.couponFlag,
                        promotionFlag: goodsInfo.defaultSku.promotionFlag,
                        promotionId: goodsInfo.defaultSku.promotionId
                    },
                    checked: true,
                    isOriginal: 1 //是否单独购买
                }
            ];
            if (self.data.extralInfo && self.data.extralInfo.liveRecordNo) {
                param[0].liveRecordNo = self.data.extralInfo.liveRecordNo

            }

            this.$axios
                .post('/order/front/SellOrderShoppingcart/examineShoppingcartList', param)
                .then(res => {
                    let d = res.data;
                    if (d.code == '0') {
                        //小程序环境
                        let miniDataParam = {
                            isOriginal: 1, //是否单独购买
                            skuId: self.data.currSpec.skuId,
                            stockNum: self.data.buyCount,//购买的数量
                            distributionMemberId: '',
                            distributionActivityId: '',
                            newAward: '',
                            transactionAward: '',
                            togetherNum: self.data.buyCount,
                            liveRecordNo: self.data.extralInfo.liveRecordNo
                        };

                        if (self.data.extralInfo && self.data.extralInfo.liveRecordNo) {
                            //直播场景下单
                            miniDataParam = Object.assign({}, miniDataParam, self.data.extralInfo, { memberId: wx.getStorageSync('memberId') })

                        }
                        let miniParams = JSON.stringify(miniDataParam);
                        wx.miniProgram.navigateTo({
                            url: '/pages/order-web-view/index?miniParams=' + miniParams
                        });
                    } else if (d.code == '-1') {
                        wx.showToast({
                            message: d.message.split('#')[1],
                            icon: 'error',
                            duration: 3000
                        })

                    }
                })
                .catch(err => {
                    console.log(err);
                });
        },

        specsOk() {

            switch (this.data.btnValue) {
                case '确定': this.specsSure(); break;
                case '立即购买': this.buyNow(); break;
                default: break;

            }
        },
        //获取购物车数量
        getShoppingCartNum() {
            let _this = this;
            let token = wx.getStorageSync('token');
            let sellerId = wx.getStorageSync('orgId');
            if (token) {
                let param = {
                    sellerId
                };
                apiWork.request(
                    '/order/front/SellOrderShoppingcart/queryShoppingcartNum',
                    'post',
                    param,
                    (res) => {
                        if (res.code == '0') {
                            if (res.data > 0) {
                                this.setData({
                                    shoppingCarNum: res.data
                                })
                            } else {
                                this.setData({
                                    shoppingCarNum: 0
                                })
                            }
                        }
                    },
                    () => {
                        this.setData({
                            shoppingCarNum: 0
                        })
                    }
                );
            }
        }
    }
});