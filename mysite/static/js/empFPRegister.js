/**
 * Created by Arvin on 2015-05-20.
 */
//绘画双手的起点横坐标
var x = 28;
//绘画双手的起点纵坐标
var y = 346;
//存放画手指函数的数组
var fingerList = [];
//保存当前正在采集的手指标记--删除时，消除当前正在采集的手指颜色时用到
var lastFPIdNum = null;
//全局2d画笔
var globalContext = null;
//绘画手指的边框颜色
var fingerBorderColor = "rgb(71,75,79)";
//页面背景色
var bgColor = "rgb(243, 245,240)";
//绘画的图形边框样式--边线绘图
var strokeStyle = "stroke";
//绘画的图形填充样式--填充绘图
var fillStyle = "fill";
//点击手指 的颜色
var fillFingerColor="rgb(71,75,79)";
//判断是否修改了数据(包括新增和删除)
var fpModifyFlag = false;
/**
 * 画椭圆 -- 给context添加绘画椭圆的属性
 * @author wenxin
 * @create 2013-05-15 10:11:21 am
 * @param x, y 椭圆定位的坐标
 * @param width, height 椭圆的宽度和高度
 */
CanvasRenderingContext2D.prototype.oval = function  (x, y, width, height)
{
    var k = (width/0.75)/2,w = width/2,h = height/2;
    this.strokeStyle = bgColor;
	this.beginPath();

	this.moveTo(x, y-h);
	this.bezierCurveTo(x+k, y-h, x+k, y+h, x, y+h);
	this.bezierCurveTo(x-k, y+h, x-k, y-h, x, y-h);
	this.closePath();
	this.stroke();
	return this;
}
/**
 * 画手指和手掌
 */
function drawFingerAndHand(context, coordArray, color, x, y, num){
    //初始化坐标
	coordArray = initCoordArray(coordArray, x, y, num);
	var drawObj = null;
    if(num < 10)
	{
		drawObj = "finger"+num;
		drawObj = new renderFinger(context, coordArray);
		drawObj.drawFinger(strokeStyle, color);
		//初始化时，渲染手指
		renderInit(context, num, "html5");
		//将绘画的手指实例放入数组，方便重画时用
		fingerList.push(drawObj);
	}
    //绘画双手掌心
	else if(num < 12)
	{
		new renderHand(context, coordArray).drawHand(color);
	}
    //绘画圆圈
    showImage(context, "/media/images/abroad_att/base_fpVerify_clearImage.png", "clearForRegister");
}
/**
 * 清除指纹显示
 */
function clearImageData(){
    clearFPImage(globalContext, 'register');
}
/**
 * 检查采集次数
 * @author wenxin
 * @create 2013-05-22 09:24:31 am
 * @param collCount 采集次数
 */
function checkCollCount()
{
	var base64FPImg = "";
	//返回码
	var ret = null;
    var resultDeal = function(result) {
        var collCount = 0;
        ret = result.ret;
        if(ret == 0)
        {
            collCount = result.data.enroll_index;
            base64FPImg = result.data.jpg_base64;
        }
        if(collCount != 3)
        {
            //第一次和第二次采集，显示采集次数、指纹图像、进度条
            if(collCount == 1 || collCount == 2)
            {
                //${common_fp_collCount}:按压指纹剩余次数:
                var text = tip3+":"+(FINGERPRINT_NUMBER - collCount);
                //显示框--采集提示
                collectTips(globalContext, text, "html5");
                //进度条
                drawProgressBar(globalContext, collCount);
                //显示指纹图像
                showImage(globalContext, base64FPImg, "html5");
                //清空图像
                setTimeout(function(){
                    clearImageData();
                }, 1000);
            }
            //定时器
            timer = setTimeout(function(){
                checkCollCount();
            }, 1000);
        }
        else
        {
            //显示指纹图像
            showImage(globalContext, base64FPImg, "html5");
            setTimeout(function(){
                clearImageData();
            }, 1000);
            //进度条
            drawProgressBar(globalContext, collCount);
            //获取指纹模板
            if(!getFPTemplate('register')){
                drawProgressBar(globalContext, 0);//进度条灰显
            };
            //如果胁迫指纹选中，则取消选中
            if(duressFingerFlag)
            {
                $("#duressFinger").attr("checked", false);
            }
            $("#duressFinger").attr("disabled", false);
            $("#submitButtonId").attr("disabled", false);
            $("#submitButtonId").attr('style', 'background-color:#7ac142');
            collectFlag = false;
            fpIdNum = -1;
            return collCount;
        }
    }
    getFPImage(resultDeal);
}
/**
 * 开始指纹仪取像
 */
function beginFPRegister() {
    var setting = {};
    setting.url = "/beginCapture?type=1&random="+getRandomNum();
    setting.async = true;
    setting.callback = function(result) {
        //返回码
        var ret = null;
        ret = result.ret;
        //接口调用成功返回时
        if(ret == 0)
        {
            //检查采集次数、显示图像
            checkCollCount();
        }
        else if(ret == -2001)
        {
            //${base_fp_connectFail}:连接指纹采集器失败
            //显示框--采集提示
            collectTips(globalContext, tip2, "html5");
        }
        else if(ret == -2002)
        {
            getWebServerInfo(null, "1");
        }
        else if(ret == -2005)
        {
            //取消采集
            cancelFPRegister();
            //切换手指后，渲染手指(消除原来手指的颜色)
            renderAfterColl(globalContext, fpIdNum, bgColor, false);
            //${base_fp_pressFinger}:请选择手指
            //显示框--采集提示
            collectTips(globalContext, tip1, "html5");
        }
    }
    excute(setting);
}
/**
 * 结束指纹仪取像
 */
function cancelFPRegister() {
    //当前有手指在采集指纹
	if(collectFlag){
        var setting = {}
        setting.url = "/cancelCapture?random="+getRandomNum();
        setting.async = false;
        //将定时器的递归调用关闭
		clearTimeout(timer);
        setting.callback = function() {
            //如果胁迫指纹选中，则取消选中
            if(duressFingerFlag)
            {
                $("#duressFinger").attr("checked", false);
            }
            if(fpModifyFlag)
            {
                $("#submitButtonId").attr("disabled", false);
            }
            $("#duressFinger").attr("disabled", false);
            if(fpIdNum != null)
            {
                //消除原来手指的颜色

                renderAfterColl(globalContext, lastFPIdNum, bgColor, false);
            }
            collectFlag = false;
        }
        excute(setting);
    }
}
/**
 * 发送请求到后台，进行比对
 * @author wenxin
 * @create 2013-08-05 16:20:31 pm
 * @param fpTemplate 指纹模板
 * @param templateArray 指纹模板数组
 * @param errorMsg ajax请求报错，错误信息
 */
function fpComparision(fpTemplate, templateArray)
{
	var ret = "";
	var templates = templateArray.toString();
	//特殊字符转义
	fpTemplate = encodeContent(fpTemplate);
	templates = encodeContent(templates);
	$.ajax( {
		type : "POST",
		url : "/accounts/finger_matching/",
		data : "template10="+fpTemplate+"&templates="+templates+"&checkObj=emp",
		dataType : "json",
		async: false,
		success : function(result)
		{
			if(result.ret == "ok")
			{
				ret = "ok";
			}
			if(result.msg == "noFingerServer")
			{
				ret = "noFingerServer";
			}
			if(result.msg == "dllNotExist")
			{
				ret = "dllNotExist";
			}
            if(result.msg == "noLicences")
			{
				ret = "noLicences";
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown)
		{
	    }
	});
	return ret;
}
 /**
 * 查动态库连接回调函数
 * @author wenxin
 * @create 2013-05-15 17:12:21 pm
 * @param ${pers_person_templateCount}:指纹数
 */
function getDLLConnectCallBack(result)
{
	 if(globalContext == null)
	 {
//		 globalContext = document.getElementById("canvas").getContext("2d");
		 var canvas = document.getElementById("canvas");
         globalContext = getCanvasContext(canvas);
	 }
	//返回码
	var ret = null;
	ret = result.ret;
	//接口调用成功返回时
	if(ret == 0)
	{
		//连接指纹采集器失败
		collectTips(globalContext, gettext("fpRegister_connectionError_failed"), "html5");
	}
	else
	{
		//加载ZKFinger10失败
		collectTips(globalContext, gettext("fpRegister_connectionError_loadFP10failed"), "html5");
	}
}
/**
 * 重画
 * @param x
 * @param y
 */
function redraw(x, y){
    var canvas = document.getElementById("canvas");
    var context = getCanvasContext(canvas);
    if (context) {
//        var context = canvas.getContext("2d");
        var isInFingerArea = false;
        for(var i=0; i< fingerList.length; i++){
            var finger = fingerList[i];
			finger.drawFinger(strokeStyle, fingerBorderColor);
			if (context.isPointInPath(x, y))
			{
				isInFingerArea = true;
				break;
			}
        }
        outerloop:
        for(var i=0; i< fingerList.length; i++){
            if(collectFlag)
			{
				//当点击的是同一个手指时，如何判断?(编辑指纹时，有问题)
				if(fpIdNum == i)
				{
					//切换手指后，渲染手指(消除原来手指的颜色)
					renderAfterColl(globalContext, fpIdNum, bgColor, false);
				}
			}
            var finger = fingerList[i];
			finger.drawFinger(strokeStyle, fingerBorderColor);
            if (context.isPointInPath(x, y)) {
                globalContext = context;
                //两次是否点击的同一个手指进行采集。如果是，则第二次点击时取消采集。
                var iaSameFinger = false;
				if(fpIdNum == i && collectFlag)
				{
					iaSameFinger = true;
				}
                //判断该手指是否已经有指纹
				var isCollected = false;
                isCollected = isContains(fingerIdArray, i);
				fpIdNum = i;
				if(!isCollected)
				{
					//保存当前正在采集的手指标记
					lastFPIdNum = fpIdNum;
				}
                if(isCollected){
                    //取消采集
					cancelFPRegister();
                    if(confirm(tip5))
					{
						delFPData(true, context, "html5");
					}
					else
					{
						delFPData(false, context, "html5");
					}
                    break outerloop;
                }
                else{
                    if(iaSameFinger){
                        //取消采集
						cancelFPRegister();
                        //取消采集后重新提示请选择手指
						collectTips(globalContext, tip1, "html5");
						//取消采集后重新绘制进度条
						drawProgressBar(context, 0);
						fpIdNum = -1;
                    }else{
                        //取消采集
						cancelFPRegister();
                        context.fillStyle = fillFingerColor;
				        context.fill();
                        collectFlag = true;//需要判断，当重复点击时，颜色改变
                        $("#duressFinger").attr("disabled", true);
						$("#submitButtonId").attr("disabled", true);
						$("#submitButtonId").attr('style', 'background-color: grey');
                        var text = tip3+":"+ FINGERPRINT_NUMBER;
                        drawProgressBar(globalContext, 0);
                        collectTips(globalContext, text, 'html5');
                        //开始采集
                        beginFPRegister();
                    }
                }
            }
            else{
                context.fillStyle = bgColor;
				context.fill();
				renderInit(context, i, "html5");
				if(collectFlag)
				{
					if(fpIdNum == i && !isInFingerArea)
					{
						context.fillStyle = "yellow";
						context.fill();
					}
				}
			}
        }
    }
}
/**
 *
 * @param context
 * @param x
 * @param y
 * @param color
 */
function draw(context, color) {
    if(fingerList.length > 0){
        fingerList = new Array();
    }
    var coordArray = new Array();
	//初始化起始坐标,并返回json格式数据
	var coordJson = initCoordJson();
    for(var i=0;i < coordJson.length; i++){
        drawFingerAndHand(context, coordArray, color, coordJson[i].coord.x, coordJson[i].coord.y, i);
        coordArray = null;
        coordArray = new Array();
    }
    //检查指纹采集器
	checkFPReader(context, "html5");
    //进度条
    drawProgressBar(context, 0);
    //将确定按钮置灰
	$("#submitButtonId").attr("disabled", true);
};
/**
 * 根据后台传过来的参数初始化指纹登记相关参数
 */
function paramInit(){
    var use_duress = $("#id_forceavalidflag").val(); //显示登记胁迫指纹
    if(use_duress == 1){
        duressFingerShowFlag = true;
    }
    if(!duressFingerShowFlag){
        $("#duressFingerDiv").hide(); //隐藏胁迫指纹选择框
    }
    var fingerIdDb = $("#id_fps").val(); //数据库指纹ID
    if($.trim(fingerIdDb) != ""){
        fingerIdDBArray = fingerIdDb.split(",");
    }
    var ftype = $("#id_fp_type").val()//数据库指纹类型
    if($.trim(ftype) != ""){
        var ftypecode = ftype.split(",");
        for(var i=0;i < ftypecode.length; i++){
            if(parseInt(ftypecode[i])== 3 ){ //类型 3 为胁迫指纹
                duressFingerIdDBArray.push(fingerIdDBArray[i]);
            }
        }
    }
}
function pageInit(){
    paramInit();
    var canvas = document.getElementById("canvas");
//	var context = canvas.getContext("2d");
	var context = getCanvasContext(canvas);
    fpIdNum = null;
	//获取页面的指纹数据
	getDataFromPage();
	//绘画
	draw(context, fingerBorderColor);
    //jquery在ie下实现cors跨域请求
	jQuery.support.cors = true;
    canvas.onmousedown = function(event){
        var event = event || window.event; //兼容IE IE没有event,有window.event
		if(event.which && event.which == 1)
		{
			var pageInfo = canvas.getBoundingClientRect();
			var x = event.clientX - pageInfo.left;
			var y = event.clientY - pageInfo.top;

			duressFingerFlag = $("#duressFinger").attr("checked");
			//重画
			redraw(x, y);
		}else if(event.button && event.button == 1 ){
            var pageInfo = canvas.getBoundingClientRect();
			var x = event.clientX - pageInfo.left;
			var y = event.clientY - pageInfo.top;

			duressFingerFlag = $("#duressFinger").attr("checked");
			//重画
			redraw(x, y);
        }
	}
}
$.fn.layerDialog = function(opt){
		var dialog_content = $(this).html();
		var default_options = {
			type: 1
      ,area: ['auto', 'auto']
      ,title: ""
      ,content: dialog_content
			,maxmin: false
      ,closeBtn: 1
      ,shadeClose: true
			,zIndex: 1003
		};
		var options = opt || {};
		$.extend(default_options, options);
		top.layer.open(default_options);
};
/**
 * 显示指纹登记页面
 */
function showFPRegister() {
    var template = document.createElement('div');
    var canvas = document.createElement('canvas');
    $(canvas).attr('id', 'canvas');
    $(canvas).attr('style', 'background:rgb(243, 245,240)');
    canvas.height=450;
    canvas.width=450;
    $(template).append(canvas);
    var buttons = ''
        +'<div id="duressFingerDiv" style="position: absolute; left: 310px; top: 300px; width: 140px; height: 28px; diaplay: block;">'
        +'  <input type="checkbox" id="duressFinger" name="checkboxName">&nbsp;'
        +'      <span style="font-size: 11px;">'+gettext("fpRegister_duress_fingerprint")+'</span>'
        +'</input></div>'
        +'<div style="position: absolute; left: 310px; top: 325px; width: 70px; height: 28px; diaplay: block;">'
        +'  <button type="button" id="submitButtonId" class="enroll-button" name="makeSureName" style="background-color: grey;" onclick="submitEvent();">'
        +'      '+gettext('btn_confirm')
        +'  </button>'
        +'</div>'
        +'<div style="position: absolute; left: 310px; top: 365px; width: 70px; height: 28px; diaplay: block;">'
        +'  <button type="button" id="closeButton" class="enroll-button" name="closeButton" onclick="cancelEvent()">'
        +'      '+gettext('btn_cancel')
        +'  </button>'
        +'</div>'
    $(template).append(buttons);
    var options = {
        title: gettext("fpRegister_fingerprint_register"),
        skin: 'option_dialog',
        success: function(layero, index){
            layerIndex = index;
            if(collectFlag){
                cancelFPRegister();
                clearTimeout(timer);//将定时器的递归调用关闭
            }
        }
    };
    $(template).layerDialog(options);
};
/**
 * 确定按钮
 */
function submitEvent()
{
	saveFPData(true);
}
/**
 * 点击取消按钮时，触发事件
 * @author wenxin
 * @create 2013-05-15 17:21:13 pm
 * @param "${base_fp_save}":确认保存当前修改吗?
 */
function cancelEvent()
{
	if(!fpModifyFlag)
	{
		if(collectFlag)
		{
			//取消采集
			cancelFPRegister();
			//将定时器的递归调用关闭
			clearTimeout(timer);
		}
		closeWindow();
	}
	else
	{
        saveFPData(false);
	}
}
function showRegister(){
    canConnection = true;
    // $("#id_fp_register").addClass('linkStyle');
    // $("#id_fp_register").removeAttr('style');
    // $("#id_fp_register").removeAttr('title');
}
/**
 * 指纹登记
 */
function submitRegister() {
    var index = layer.load(4);
    if(!canConnection){
        var msg = gettext('please_install_driver_or_start_service') + '<br /><a href="https://www.zklicense.com/files/help/Fingerprint Reader Driver.exe" style="color:red;">Download Driver</a>'

        layer.msg(msg, {
            icon: 5,
            time: 0,
            closeBtn: 2,
            title: gettext('pop_window_title')
        });

        layer.close(index);
        return false;
    }
    showFPRegister();
    pageInit();
    layer.close(index);
}
$(function(){
    // $("#id_fp_help a").attr("href", "/data/system/help/?p=/file/"+$("#id_lng").val()+"/help/fingerprintDriverInstall.html");
    $("#id_fp_help a").attr("href", "files/help/fingerprintDriverInstall.html");
    checkDriver(false);
})
