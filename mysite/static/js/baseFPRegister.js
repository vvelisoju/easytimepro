
/**
 * ----------------------------------------------------------common start--------------------------------------------------------------
*/
//采集指纹次数
var FINGERPRINT_NUMBER = 3;
//胁迫指纹数--胁迫指纹时，在普通指纹上加的数
var DURESS_FINGER_NUM = 16;
//胁迫指纹标记
var duressFingerFlag = null;
//是否显示胁迫指纹(用户登记指纹时，不需要胁迫指纹)，默认显示胁迫指纹
var duressFingerShowFlag = false;
//手指标记数组
var fingerIdArray = new Array();//[]
//手指删除标记数组
var delfingerIdArray = new Array();//[]
//指纹模板数据数组
var templateDataArray = new Array();//[]
//定时器--关闭setTimeOut时用到
var timer = null;
//判断当前手指是否正在采集中
var collectFlag = false;
//当前点击的手指标记
var fpIdNum = null;

var fingerIdDBArray = new Array();  //数据库中的指纹
var duressFingerIdDBArray = new Array();  //数据库中的指纹类型(普通指纹 or 胁迫指纹)
var canConnection = false; //是否可以访问指纹驱动
var layerIndex = null;
/**
 * ------------canvas start--------------------
*/
/**
 * 初始化绘画手指、手掌、圆弧的起始坐标,并做成json格式
 * @author wenxin
 * @create 2013-06-15 15:40:31 pm
 */
function initCoordJson()
{
	var coordJson = [{"num" : 0, "coord" : {"x" : x + 3, "y" : y - 37}},
		             {"num" : 1, "coord" : {"x" : x + 25, "y" : y - 37}},
		             {"num" : 2, "coord" : {"x" : x + 47, "y" : y - 34}},
		             {"num" : 3, "coord" : {"x" : x + 67, "y" : y - 26}},
		             {"num" : 4, "coord" : {"x" : x + 77, "y" : y + 18}},
		             {"num" : 5, "coord" : {"x" : x + 153, "y" : y + 34}},
		             {"num" : 6, "coord" : {"x" : x + 159, "y" : y - 19}},
		             {"num" : 7, "coord" : {"x" : x + 177, "y" : y - 30}},
		             {"num" : 8, "coord" : {"x" : x + 198, "y" : y - 36}},
		             {"num" : 9, "coord" : {"x" : x + 220, "y" : y - 36}},
		             {"num" : 10, "coord" : {"x" : x, "y" : y}},
		             {"num" : 11, "coord" : {"x" : x + 170, "y" : y + 12}},
		             {"num" : 12, "coord" : {"x" : x + 210, "y" : y - 346}}];
	return coordJson;
}
/**
 * 采集完指纹后渲染手指
 * @author wenxin
 * @create 2013-05-18 11:33:31 am
 * @param context 2d画布上下文
 * @param num 当前需要渲染的手指编号
 * @param fillColor 采集完后填充颜色
 * @param successOrNot 采集是否成功--布尔值 true:采集成功；false:采集失败
 */
function renderAfterColl(context, num, fillColor, successOrNot)
{
	var canvas = document.getElementById("canvas");
//	var localContext = canvas.getContext("2d");
	var localContext = getCanvasContext(canvas);
	var coordArray = new Array();
	//初始化起始坐标,并返回json格式数据
	var coordJson = initCoordJson();
	//进来页面，点击删除
	if(num == null)
	{
		num = fpIdNum;
	}
	//点击的手指编号和json中num相等
	if(coordJson[num].num == num)
	{
		//初始化坐标数组和绘画手指
		initCoordAndDrawFinger(context, coordArray, coordJson[num].coord.x, coordJson[num].coord.y, num);
	}

	//采集成功，填充颜色(红、绿)
	if(successOrNot)
	{
		if(duressFingerFlag)
		{
			localContext.fillStyle = "red";//fillColor
			localContext.fill();
			fpModifyFlag = true;
		}
		else
		{
			localContext.fillStyle = "rgb(122,193,66)";//fillColor
			localContext.fill();
			fpModifyFlag = true;
		}
	}
	else
	{
		//采集失败，填充背景色--消除颜色(黄)
		localContext.fillStyle = fillColor;
		localContext.fill();
	}
}
/**
 * 坐标点对象
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 */
var Coord = function(x, y)
{
	this.x = x;
	this.y = y;
}
/**
 * 初始化坐标数组和绘画手指--获取当前的context
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 * @param context 2d画布上下文
 * @param pointArray 坐标点数组
 * @param x,y 绘画当前手指的起始坐标
 * @param num 手指标记
 */
function initCoordAndDrawFinger(context, coordArray, x, y, num)
{
	coordArray = initCoordArray(coordArray, x, y, num);
	new renderFinger(context, coordArray).drawFinger(strokeStyle, fingerBorderColor);
}
/**
 * 绘画手指
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 * @param context 2d画布上下文
 * @param pointArray 坐标点数组
 * @param renderFlag 渲染标记 stroke:绘画边线；fill:填充
 * @param color 渲染颜色
 */
var renderFinger = function(context, pointArray)
{
	this.context = context;
	this.pointArray = pointArray;
	this.isClick = false;
	this.drawFinger = function(renderFlag, color)
	{
		if(renderFlag == "stroke")
		{
			this.context.strokeStyle = color;
		}
		else if(renderFlag == "fill")
		{
			this.context.fillStyle = color;
		}
		this.context.lineWidth = 1;
		this.context.beginPath();
		for(var i=0; i<this.pointArray.length; i++)
		{
			if(i == 0)
			{
				this.context.moveTo(this.pointArray[0].x, this.pointArray[0].y);
			}
			else
			{
				this.context.lineTo(this.pointArray[i].x, this.pointArray[i].y);
			}
		}
		if(renderFlag == "stroke")
		{
			this.context.stroke();
		}
		else if(renderFlag == "fill")
		{
			this.context.fill();
		}
	};
};
/**
 * 绘画手掌
 * @author wenxin
 * @create 2013-06-01 09:01:33 am
 * @param context 2d画布上下文
 * @param pointArray 坐标点数组
 * @param color 渲染颜色
 */
var renderHand = function(context, pointArray)
{
	this.context = context;
	this.pointArray = pointArray;
	this.isClick = false;
	this.drawHand = function(color)
	{
		this.context.strokeStyle = color;
		this.context.lineWidth = 1;
		this.context.beginPath();
		for(var i=0; i<this.pointArray.length; i++)
		{
			if(i == 0)
			{
				this.context.moveTo(this.pointArray[0].x, this.pointArray[0].y);
			}
			else
			{
				this.context.lineTo(this.pointArray[i].x, this.pointArray[i].y);
			}
		}
		this.context.stroke();
	};
};
/**
 * 将绘画的坐标点放入数组
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 * @param coordArray 传入的数组，放入坐标后，返回
 * @param x, y 绘画手指的起点的坐标
 * @param num 手指、手掌编号0-9：手指编号；10：左手掌，11：右手掌,12:圆弧。
 */
function initCoordArray(coordArray, x, y, num)
{
	if(num == 0)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 2, y - 35);
		coordArray[2] = new Coord(x + 5, y - 40);
		coordArray[3] = new Coord(x + 11, y - 42);
		coordArray[4] = new Coord(x + 16, y - 40);
		coordArray[5] = new Coord(x + 18, y - 35);
		coordArray[6] = new Coord(x + 18, y + 1);
		coordArray[7] = new Coord(x + 15, y + 5);
		coordArray[8] = new Coord(x + 9, y + 7);
		coordArray[9] = new Coord(x + 3, y + 5);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 1)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 8, y - 50);
		coordArray[2] = new Coord(x + 12, y - 54);
		coordArray[3] = new Coord(x + 19, y - 55);
		coordArray[4] = new Coord(x + 22, y - 53);
		coordArray[5] = new Coord(x + 24, y - 49);
		coordArray[6] = new Coord(x + 18, y + 1);
		coordArray[7] = new Coord(x + 15, y + 6);
		coordArray[8] = new Coord(x + 8, y + 7);
		coordArray[9] = new Coord(x + 3, y + 4);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 2)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 14, y - 54);
		coordArray[2] = new Coord(x + 16, y - 57);
		coordArray[3] = new Coord(x + 23, y - 58);
		coordArray[4] = new Coord(x + 28, y - 55);
		coordArray[5] = new Coord(x + 29, y - 50);
		coordArray[6] = new Coord(x + 17, y + 4);
		coordArray[7] = new Coord(x + 13, y + 8);
		coordArray[8] = new Coord(x + 6, y + 9);
		coordArray[9] = new Coord(x + 1, y + 5);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 3)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 19, y - 37);
		coordArray[2] = new Coord(x + 21, y - 39);
		coordArray[3] = new Coord(x + 28, y - 39);
		coordArray[4] = new Coord(x + 32, y - 36);
		coordArray[5] = new Coord(x + 33, y - 31);
		coordArray[6] = new Coord(x + 17, y + 6);
		coordArray[7] = new Coord(x + 12, y + 10);
		coordArray[8] = new Coord(x + 6, y + 10);
		coordArray[9] = new Coord(x + 1, y + 6);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 4)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 30, y - 18);
		coordArray[2] = new Coord(x + 34, y - 17);
		coordArray[3] = new Coord(x + 37, y - 14);
		coordArray[4] = new Coord(x + 39, y - 11);
		coordArray[5] = new Coord(x + 39, y - 8);
		coordArray[6] = new Coord(x + 38, y - 6);
		coordArray[7] = new Coord(x + 12, y + 15);
		coordArray[8] = new Coord(x + 8, y + 17);
		coordArray[9] = new Coord(x + 2, y + 14);
		coordArray[10] = new Coord(x - 2, y + 8);
		coordArray[11] = new Coord(x, y);
	}
	else if(num == 5)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 26, y - 21);
		coordArray[2] = new Coord(x - 27, y - 24);
		coordArray[3] = new Coord(x - 26, y - 30);
		coordArray[4] = new Coord(x - 21, y - 34);
		coordArray[5] = new Coord(x - 16, y - 34);
		coordArray[6] = new Coord(x + 12, y - 18);
		coordArray[7] = new Coord(x + 15, y - 10);
		coordArray[8] = new Coord(x + 13, y - 3);
		coordArray[9] = new Coord(x + 7, y + 1);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 6)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 17, y - 46);
		coordArray[2] = new Coord(x - 17, y - 50);
		coordArray[3] = new Coord(x - 13, y - 56);
		coordArray[4] = new Coord(x - 6, y - 56);
		coordArray[5] = new Coord(x - 3, y - 54);
		coordArray[6] = new Coord(x + 15, y - 11);
		coordArray[7] = new Coord(x + 15, y - 4);
		coordArray[8] = new Coord(x + 11, y + 2);
		coordArray[9] = new Coord(x + 4, y + 2);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 7)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 12, y - 54);
		coordArray[2] = new Coord(x - 10, y - 58);
		coordArray[3] = new Coord(x - 5, y - 62);
		coordArray[4] = new Coord(x + 1, y - 61);
		coordArray[5] = new Coord(x + 4, y - 58);
		coordArray[6] = new Coord(x + 18, y - 4);
		coordArray[7] = new Coord(x + 16, y + 1);
		coordArray[8] = new Coord(x + 11, y + 5);
		coordArray[9] = new Coord(x + 5, y + 4);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 8)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 5, y - 50);
		coordArray[2] = new Coord(x - 2, y - 54);
		coordArray[3] = new Coord(x + 3, y - 57);
		coordArray[4] = new Coord(x + 9, y - 55);
		coordArray[5] = new Coord(x + 11, y - 52);
		coordArray[6] = new Coord(x + 18, y - 1);
		coordArray[7] = new Coord(x + 14, y + 4);
		coordArray[8] = new Coord(x + 9, y + 6);
		coordArray[9] = new Coord(x + 4, y + 5);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 9)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x, y - 37);
		coordArray[2] = new Coord(x + 3, y - 41);
		coordArray[3] = new Coord(x + 7, y - 43);
		coordArray[4] = new Coord(x + 13, y - 41);
		coordArray[5] = new Coord(x + 15, y - 37);
		coordArray[6] = new Coord(x + 17, y + 1);
		coordArray[7] = new Coord(x + 15, y + 3);
		coordArray[8] = new Coord(x + 10, y + 6);
		coordArray[9] = new Coord(x + 3, y + 4);
		coordArray[10] = new Coord(x, y);
	}
	else if(num == 10)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 2, y - 8);
		coordArray[2] = new Coord(x + 6, y - 16);
		coordArray[3] = new Coord(x + 13, y - 23);
		coordArray[4] = new Coord(x + 27, y - 27);
		coordArray[5] = new Coord(x + 37, y - 25);
		coordArray[6] = new Coord(x + 43, y - 23);
		coordArray[7] = new Coord(x + 64, y - 16);
		coordArray[8] = new Coord(x + 69, y - 11);
		coordArray[9] = new Coord(x + 73, y - 3);

		coordArray[10] = new Coord(x + 73, y + 10);
		coordArray[11] = new Coord(x + 71, y + 18);
		coordArray[12] = new Coord(x + 57, y + 40);
		coordArray[13] = new Coord(x + 50, y + 46);
		coordArray[14] = new Coord(x + 41, y + 49);
		coordArray[15] = new Coord(x + 34, y + 49);
		coordArray[16] = new Coord(x + 14, y + 43);
		coordArray[17] = new Coord(x + 10, y + 41);
		coordArray[18] = new Coord(x + 6, y + 36);
		coordArray[19] = new Coord(x + 2, y + 29);
		coordArray[20] = new Coord(x, y);
	}
	else if(num == 11)
	{
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 2, y - 10);
		coordArray[2] = new Coord(x + 1, y - 20);
		coordArray[3] = new Coord(x + 14, y - 31);
		coordArray[4] = new Coord(x + 47, y - 39);
		coordArray[5] = new Coord(x + 55, y - 38);
		coordArray[6] = new Coord(x + 61, y - 34);
		coordArray[7] = new Coord(x + 68, y - 26);
		coordArray[8] = new Coord(x + 72, y - 16);
		coordArray[9] = new Coord(x + 72, y + 13);

		coordArray[10] = new Coord(x + 68, y + 22);
		coordArray[11] = new Coord(x + 62, y + 29);
		coordArray[12] = new Coord(x + 60, y + 30);
		coordArray[13] = new Coord(x + 39, y + 36);
		coordArray[14] = new Coord(x + 34, y + 36);
		coordArray[15] = new Coord(x + 20, y + 33);
		coordArray[16] = new Coord(x + 16, y + 29);
		coordArray[17] = new Coord(x, y);
	}
	else if(num == 12)
	{
		coordArray[0] = new Coord(x - 10, y);
		coordArray[1] = new Coord(x + 212, y);
		coordArray[2] = new Coord(x + 212, y + 129);
		coordArray[3] = new Coord(x + 201, y + 130);
		coordArray[4] = new Coord(x + 191, y + 131);
		coordArray[5] = new Coord(x + 174, y + 131);
		coordArray[6] = new Coord(x + 159, y + 129);
		coordArray[7] = new Coord(x + 142, y + 127);
		coordArray[8] = new Coord(x + 133, y + 125);
		coordArray[9] = new Coord(x + 114, y + 120);

		coordArray[10] = new Coord(x + 97, y + 113);
		coordArray[11] = new Coord(x + 86, y + 108);
		coordArray[12] = new Coord(x + 72, y + 100);
		coordArray[13] = new Coord(x + 52, y + 87);
		coordArray[14] = new Coord(x + 40, y + 76);
		coordArray[15] = new Coord(x + 29, y + 64);
		coordArray[16] = new Coord(x + 16, y + 48);
		coordArray[17] = new Coord(x + 5, y + 30);
		coordArray[18] = new Coord(x - 10, y);
	}
	return coordArray;
}
/**
 * 绘画页面右上角的圆弧并填充颜色
 * @author wenxin
 * @create 2013-05-15 17:12:21 pm
 * @param context 2d画布上下文
 * @param x, y 绘画圆弧的起点的坐标
 * @param color 绘画多边形的填充颜色--右上角的圆弧区域
 */
var FillArc = function(context, pointArray)
{
	this.context = context;
	this.pointArray = pointArray;
	this.drawArc = function(color)
	{
		this.context.fillStyle = color;
		this.context.beginPath();
		for(var i=0; i<this.pointArray.length; i++)
		{
			if(i == 0)
			{
				this.context.moveTo(this.pointArray[0].x, this.pointArray[0].y);
			}
			else
			{
				this.context.lineTo(this.pointArray[i].x, this.pointArray[i].y);
			}
		}
		//this.context.stroke();
		this.context.fill();
	};
};
//清除画布内容
CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }
};


/**
 * 显示框--显示采集次数、采集成功、失败等信息
 * @author wenxin
 * @create 2013-05-16 16:56:31 pm
 * @param context 2d画布上下文
 * @param text  显示信息内容
 * @param browserFlag 浏览器标记或比对验证标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 * --verification:指纹验证标记
 */
function collectTips(context, text, browserFlag)
{
	if(browserFlag == "simple")
	{
		$("#showCollInfoDiv").html("<span style='color:rgb(122,193,66); font-size: 13px;word-break: break-all; word-wrap: break-word;'>"+text+"</span>");
	}
	else if(browserFlag == "html5")
	{
		context.fillStyle = bgColor;//bgColor;
		context.fillRect(140, 18, 310, 16);

		//文字右对齐
		context.fillStyle = "rgb(122,193,66)";
		context.font ="13px Times New Roman";
		//context.shadowColor = 'white';
	    //context.shadowBlur = 10;
	    //context.strokeText(text, 230, 30);
		context.textAlign = "end";
		context.fillText(text, 440, 30);
	}
	else if(browserFlag == "verification")
	{
		//#6BA5D7
		context.fillStyle = "#F3F5F0";//#6BA5D7
		context.fillRect(2, 8, 600, 30);
		//获取canvas对象
		var canvas = document.getElementById("canvas");
//		canvas.width = canvas.width;
		//返回一个文本的度量信息对象metrics
		var metrics = context.measureText(text);
		//文本宽度
		var textWidth = metrics.width;
		//canvas宽度
		canvas != null?canvasWidth = canvas.width:canvasWidth = 450;
		//文本开始x坐标
		var x = textWidth/2 + (canvasWidth - textWidth)/2;


		//context.fillStyle = bgColor;
		//context.fillRect(0, 18, 445, 16);

		//文字右对齐
		context.fillStyle = "rgb(122,193,66)";
		context.font ="24px Times New Roman";
		context.textAlign = "center";
		//自动换行
		autoWordBreak(context,text,canvasWidth,x);
		context.restore();
	}
	else if(browserFlag == "verifyForSimple")
	{
		$("#showCollInfoDiv").html("<span style='color:yellow;align:center;font-size: 18px;word-break: break-all; word-wrap: break-word;'>"+text+"</span>");
	}
}

/**
 * 画布文本自动换行
 * @author chenpf
 * @create 2015-03-10 16:56:31 pm
 * @param context 2d画布上下文
 * @param text  显示信息内容
 * @param CWidth 画布宽度
 * @param x 文本X坐标值
 *
 */
function autoWordBreak(context,text,CWidth,x){
	context.clear();
	var rownum = CWidth / 10;
	var len = text.length;
	if (rownum > len)
	{
		context.fillText(text, x, 30);
	}
	else
	{
		var endInd = rownum<text.length?rownum:text.length;
		var beginInd = 0;
		var endTemp=0;
		for (var i = 0; i <= text.length / rownum; i++)
		{
			endTemp = text.substr(beginInd, endInd).lastIndexOf(" ");
			if(endTemp!=-1)
				endInd=beginInd+endTemp;
			context.fillText(text.substr(beginInd, endInd), x, (i + 1) * 30);
			beginInd = endInd+1;
			if(beginInd>=text.length)
				break;
			endInd = beginInd + rownum;
		}
	}
}

/**
 * 画进度条
 * @author wenxin
 * @create 2013-05-16 16:56:31 pm
 * @param context 2d画布上下文
 * @param x,y,width,height 进度条底框的坐标和宽度、高度
 */
function drawProgressBar(context, collCount)
{
	var x = 300;
	var y = 60;
	var width = 90;
	var height = 20;
	context.fillStyle = bgColor;
	context.fillRect(x, y, width, height);
	if(collCount == 0)
	{
		context.fillStyle = "rgb(175,181,185)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillRect(x + 46, y + 2, width -52, height - 4);
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	}
	else if(collCount == 1)
	{
		context.fillStyle = "rgb(122,193,66)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillStyle = "rgb(175,181,185)";
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	}
	else if(collCount == 2)
	{
		context.fillStyle = "rgb(122,193,66)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillStyle = "rgb(175,181,185)";
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	}
	else if(collCount == 3)
	{
		context.fillStyle = "rgb(122,193,66)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	}
}
/**
 * -----------------------------------canvas end----------------------------
 */
/**
 * 清空指纹图像
 * @author wenxin
 * @create 2013-09-05 15:15:11 pm
 */
function clearFPImage(context, browserFlag)
{
	if(browserFlag == "verification")
	{
//		showImage(context, "/media/images/abroad_att/base_fpVerify_clearImage.png", "clearForVerify");
	}
	else if(browserFlag == "register")
	{
		showImage(context, "/media/images/abroad_att/base_fpVerify_clearImage.png", "clearForRegister");
	}
	else if(browserFlag == "verifyForSimple" || browserFlag == "registerForSimple")
	{
		showImage(null, "", "clearForSimple");
	}
}
/**
 * 显示指纹图像
 * @author wenxin
 * @create 2013-05-18 11:22:31 am
 * @param context 2d画布上下文
 * @param browserFlag 浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
function showImage(context, base64FPImg, browserFlag)
{
	var img;
	var imgSrc = "data:image/jpg;base64,"+base64FPImg;
	if(browserFlag == "html5"){
		img = new Image();
		img.src = "";
		img.src = imgSrc;
		img.onload=function() {
			// 保存当前的绘图状态
			context.save();
			// 开始创建路径
			context.beginPath();
			// 画一个椭圆
			context.oval(125, 142, 112, 145);
			// 关闭路径
			context.closePath();
			// 剪切路径
			context.clip();
			//将图片画到画布上
	        context.drawImage(img, 70, 70, 112, 145);
			//调用restore最后一次存储的状态会被恢复
	        context.restore();
	    }
	}
	else if(browserFlag == "verification")
	{
		img = new Image();
		img.src = "";
		img.src = imgSrc;
		img.onload=function() {
			// 保存当前的绘图状态
			context.save();
			// 开始创建路径
			context.beginPath();
			// 画一个椭圆
			context.oval(92, 159, 100, 128);
			// 关闭路径
			context.closePath();
			// 剪切路径
			context.clip();
			//将图片画到画布上
	        context.drawImage(img, 37, 90, 112, 145);
			//调用restore最后一次存储的状态会被恢复
	        context.restore();
	    }
	}
	else if(browserFlag == "clearForVerify" || browserFlag == "clearForRegister")
	{
		img = new Image();
		img.src = "";
		img.src = base64FPImg;
		img.onload=function() {
			// 保存当前的绘图状态
			context.save();
			// 开始创建路径
			context.beginPath();
			// 画一个椭圆
			if(browserFlag == "clearForVerify")
			{
				context.oval(91, 160, 112, 145);
			}
			else if(browserFlag == "clearForRegister")
			{
				context.oval(125, 142, 132, 165);
			}
			// 关闭路径
			context.closePath();
			// 剪切路径
			context.clip();
			//将图片画到画布上
			if(browserFlag == "clearForVerify")
			{
				context.drawImage(img, 12, 54, 160, 213);
			}
	        else if(browserFlag == "clearForRegister")
	        {
	        	context.drawImage(img, 60, 60, 132, 165);
	        }
			//调用restore最后一次存储的状态会被恢复
	        context.restore();
	    }
	}
	else if(browserFlag == "simple")
	{
		$("#showFPImageDiv").html("<img src="+imgSrc+" width='112' height='145' />");
	}
	else if(browserFlag == "verifySimple")
	{
		$("#showSeachingDiv").show();
//		$("#showSeachingDiv").html("&nbsp;&nbsp;<img src=\"/public/images/searching.gif\" width='20' height='20'/></br><label style='color:yellow;align:center;font-size: 14px;'>${base_fp_waiting}</label>");
	}
	else if(browserFlag == "clearForSimple")
	{
		$("#showFPImageDiv").html("");
	}
}
/**
 * 页面加载和重画时渲染手指
 * @author wenxin
 * @create 2013-05-13 15:26:31 pm
 * @param context 2d画布上下文
 * @param num 当前需要渲染的手指编号
 * @param browserFlag 浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
function renderInit(context, num, browserFlag)
{
	var fingerId;
	for(var i=0; i<fingerIdArray.length; i++)
	{
		fingerId = eval(fingerIdArray[i]);
		if(fingerId >= DURESS_FINGER_NUM)
		{
			fingerId = fingerId -DURESS_FINGER_NUM;
			if(browserFlag == "html5")
			{
				if(fingerId == num)
			    {
					context.fillStyle = "red";
					context.fill();
			    }
			}
		}
		else
		{
			if(browserFlag == "html5"){
				if(fingerId == num)
				{
					context.fillStyle = "rgb(122,193,66)";
					context.fill();
				}
			}
		}
		if(browserFlag == "simple")
		{
			document.getElementById("finger" + fingerId).checked = true;
		}
	}
}
/**
 * 删除数组元素 -- 从dx下标开始，删除一个元素
 * @author wenxin
 * @create 2013-05-15 11:11:31 am
 * @param dx 要删除元素的下标
 */
function removeItem(array, dx)
{
   array.splice(dx, 1);
}
/**
 * 点击已经采集指纹的手指时，弹出框删除数据
 * 删除时的回调函数
 * @author wenxin
 * @create 2013-05-14 17:12:21 pm
 * @param result 弹出框选择确定还是取消
 * @param context 2d画布上下文
 * @param browserFlag 浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
var delFPData = function(result, context, browserFlag)
{
	var fingerId;
	if(result)
	{
		//将数组中的指定元素删除
		for(var i=0; i<fingerIdArray.length; i++)
		{
			fingerId = eval(fingerIdArray[i]);
			if(fingerId >= DURESS_FINGER_NUM)
			{
				fingerId = fingerId - DURESS_FINGER_NUM;
			}
            if(fingerId == fpIdNum)
            {
            	delfingerIdArray.push(fingerIdArray[i]);
                removeItem(fingerIdArray, i);
                removeItem(templateDataArray, i);
            }
		}
		if(browserFlag == "simple")
		{
			document.getElementById("finger" + fingerId).checked = false;
		}
		else if(browserFlag == "html5")
		{
			//将手指颜色改变--重画时也要判断
			context.fillStyle = bgColor;
			context.fill();
			if(lastFPIdNum != null && lastFPIdNum != lastFPIdNum)
			{
				//消除原来手指的颜色
				renderAfterColl(globalContext, lastFPIdNum, bgColor, false);
			}
			//消除需要删除的手指颜色
			renderAfterColl(globalContext, fpIdNum, bgColor, false);
		}
		fpModifyFlag = true;
		$("#duressFinger").attr("disabled", false);
		$("#submitButtonId").attr("disabled", false);
	}
	else
	{
		if(browserFlag == "simple")
		{
			document.getElementById("finger" + fpIdNum).checked = true
			collectFlag = true;
		}
		else if(browserFlag == "html5")
		{
			//消除原来手指的颜色--有问题，如果原来手指和现在的一样，有问题
			//renderAfterColl(globalContext, lastFPIdNum, bgColor, false);
		}
	}
}
/**
 * 判断当前手指是否在fingerIdArray中，如果在，则说明此手指已经采集指纹
 * @author wenxin
 * @create 2013-05-15 16:26:31 pm
 * @param num 手指编号
 * @param fingerIdArray 存放手指编号的数组
 * @return 返回boolean值 true:num包含在fingerIdArray中；false:没有包含
 */
function isContains(fingerIdArray, num)
{
	var fingerId;
	var isCollected = false;
	for(var j=0; j<fingerIdArray.length; j++)
	{
		fingerId = eval(fingerIdArray[j]);
		if(fingerId >= DURESS_FINGER_NUM)
		{
			fingerId = fingerId -DURESS_FINGER_NUM;
		}
		if(fingerId == num)
		{
			isCollected = true;
		}
	}
	return isCollected;
}
/**
 * 将指纹数据保存到页面
 * @author wenxin
 * @create 2013-05-24 16:12:21 pm
 */
function storeDataToHtml()
{
    var fingerDelArray = new Array();
    for(var i=0; i< fingerIdDBArray.length; i++){
        var fdbid = fingerIdDBArray[i];
        var match =false;
        for(var j=0; j<fingerIdArray.length;j++){
            var fid= fingerIdArray[j];
            if(fdbid == fid){
                match = true
            }
        }
        if(match){
            var index = fingerIdArray.indexOf(fdbid);
            if(delfingerIdArray.indexOf(fdbid) > -1){
            	fingerDelArray.push(fdbid);
			}else{
            	removeItem(fingerIdArray, index);
            	removeItem(templateDataArray, index)
			}
        }else{
            if(fdbid >= DURESS_FINGER_NUM){
                fdbid = fdbid - DURESS_FINGER_NUM;
            }
            fingerDelArray.push(fdbid);
        }
    }
    $("#id_del_fps").val(fingerDelArray.toString());
	//没有手指标记数据
	if(fingerIdArray.length == 0)
	{
		$("#id_fps").val("");
	}
	else
	{
        var ftype = new Array();
        var fIdArray = new Array();
        for(var i=0; i < fingerIdArray.length; i++){
            var fdbid = fingerIdArray[i];
            var ftypecode = 1;
            if(fdbid >= DURESS_FINGER_NUM){
                fdbid = fdbid - DURESS_FINGER_NUM;
                ftypecode = 3;
            }
            ftype.push(ftypecode);
            fIdArray.push(fdbid);
        }
        //将手指类型数据保存到页面
        $("#id_fp_type").val(ftype.toString());
		//将手指标记数据保存到页面
		$("#id_fps").val(fIdArray.toString());
	}
	//没有指纹模板数据
	if(templateDataArray.length == 0)
	{
		$("#id_templates").val("");
	}
	else
	{
		//将指纹模板数据保存到页面
		$("#id_templates").val(templateDataArray.toString());
	}
}
/**
 * 判断指纹数量--页面加载时，没有计算。只是在采集完指纹后计算指纹数量
 * @author wenxin
 * @create 2013-04-22 21:26:31 pm
 */
function showFPCount()
{
	$("#fpCount").val(fingerIdArray.length);
	// $("#div_id_finngerT").html(tip4 + fingerIdArray.length);
	// $("#div_id_finngerT").show();
}
/**
 * 获取页面的指纹数据
 * @author wenxin
 * @create 2013-05-13 10:18:31 am
 * @param
 */
function getDataFromPage()
{
    for(var i=0;i < duressFingerIdDBArray.length; i++){
        var duress_index = fingerIdDBArray.indexOf(duressFingerIdDBArray[i]);
        if(duress_index!= -1)
            fingerIdDBArray[duress_index] = parseInt(duressFingerIdDBArray[i]) + DURESS_FINGER_NUM;
    }
    var fingerDel = $("#id_del_fps").val(); //删除的指纹ID
    var fingerDelArray = new Array();
    if($.trim(fingerDel) != ""){
        fingerDelArray = fingerDel.split(",");
    }
    var fingerId = $("#id_fps").val();
    var fingerTemplate = $("#id_templates").val();
    //如果有数据
    if($.trim(fingerId) != "")
    {
//	    fingerId = fingerId.substr(1, fingerId.length-2);
//	    fingerTemplate = fingerTemplate.substr(1, fingerTemplate.length-2);
	    fingerIdArray = fingerId.split(",");
	    templateDataArray = fingerTemplate.split(",");
    }else{
    	fingerIdArray=new Array();
    	templateDataArray=new Array();
    }
    for(var i=0;i<fingerIdDBArray.length;i++){
        var dbfid = fingerIdDBArray[i];
        var match = false
        for (var j = 0; j < fingerIdArray.length; j++) {
            var fid = fingerIdArray[j];
            if (dbfid == fid) {
                match = true;
            }
        }
        if (!match) {
            for(var k=0; k<fingerDelArray.length;k++){
                var fid = fingerDelArray[j];
                if (dbfid == fid || dbfid == (fid + DURESS_FINGER_NUM)) {
                    match = true;
                }
            }
        }
        if (!match) {
            fingerIdArray.push(dbfid);
            templateDataArray.push("");
        }
    }
}
/**
 * 检测指纹是否可用
 */
function checkFPReader(context, browserFlag) {
    if (browserFlag == "html5") {
        var setting = {};
        setting.url = "/beginCapture?type=1&random="+getRandomNum();
        setting.async = false;
        setting.callback = function (result){
            //返回码
            var ret = null;
            ret = result.ret;
            //接口调用成功返回时
            if (ret == 0) {
                //显示框--采集提示
                collectTips(context, tip1, "html5");
            }
            else if (ret == -2001) {
                //显示框--采集提示
                collectTips(context, tip2, "html5");
            }
            else if (ret == -2002) {
                getWebServerInfo(null, "1");
            }
            else if (ret == -2005) {
                //显示框--采集提示
                collectTips(context, tip1, "html5");
            }
            collectFlag = true;
            //取消采集
            cancelFPRegister();
        }
        excute(setting);
    }
}
/**
 * 获取webserver信息的回调函数
 * @author wenxin
 * @create 2013-08-09 17:24:31 pm
 */
function getWebServerInfoCallBack(result, isFPLogin)
{
	//返回码
	var ret = null;
	ret = result.ret;
	//接口调用成功返回时
	if(ret == 0)
	{
		if(isFPLogin)
		{
			//显示指纹登录
			showFPVerify();
		}
		else
		{
			//显示登记--可以点击采集指纹
			showRegister();
			//计算指纹数量${pers_person_templateCount}:指纹数
//			showFPCountInit();
			// 对比指纹驱动
//			if (result.data&&result.data.server_version){
//			    compareFPDriver(result.data.server_version);
//			}
		}
	}
}
/**
 * 获取webserver的信息
 * @author wenxin
 * @param
 * @param paramArray 存放国际化元素的数组
 * @param isFPLogin 是否是指纹登录 true:是；false:否
 * @param type 0 表示发送完请求后,还有别的操作。1 表示发送完请求后，没有其余的操作了
 * @create 2013-08-09 17:24:31 pm
 */
function getWebServerInfo(isFPLogin, type)
{
    var setting = {}
    setting.url = "/info";
    setting.async = true;
    setting.callback = function(result){
        //检查驱动
			if(type == "0")
			{
				getWebServerInfoCallBack(result, isFPLogin);
			}
			//检查动态库连接
			else if(type == "1")
			{
				getDLLConnectCallBack(result);
			}
    }
    excute(setting);
}
/**
 * ----------------------------------------------------------FPDriver start--------------------------------------------------------------
 */
//驱动访问地址
var ISSOnlineUrl = "http://127.0.0.1:24008/ISSOnline";
/**
 * 驱动类初始化
 * @returns {FPDriver}
 */
function initFPDriver(){
    var FPDriver = function(){}
    FPDriver.prototype.dealFPDriverResponse = function(result) {
        this.dealResult(result);
    }
    FPDriver.prototype.ajaxAccess = function(url, async){
        var result = null;
		var parent = this;
        var xhr = getXMLRequest();
        xhr.open("GET", ISSOnlineUrl+url, async);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4){ //请求完成
                if(xhr.status == 200){
                    var resultData = xhr.responseText;
                    resultData = resultData.replace(/\\/g,"/");
                    result = JSON.parse(resultData);
                    parent.dealFPDriverResponse(result);
                }else{
                }
            }
        }
        xhr.send();
    }
    //IE8、IE9访问服务
	FPDriver.prototype.xDomainAccess = function(url, async)
	{
		var parent = this;
		var xDomainRequest = new XDomainRequest();
		if (xDomainRequest)
		{
			xDomainRequest.timeout=10000;
			xDomainRequest.open('GET', ISSOnlineUrl+url, async);
			xDomainRequest.onload = function()
			{
				var resultData = xDomainRequest.responseText;
				resultData = resultData.replace(/\\/g,"/");
                var obj = JSON.parse(resultData);
				parent.dealFPDriverResponse(obj);
			};
			xDomainRequest.onerror = function()
			{
				//用完后，将对象置为空
				xDomainRequest = null;
			};
			xDomainRequest.ontimeout = function()
			{
				//用完后，将对象置为空
				xDomainRequest = null;
			};
			xDomainRequest.send();
		}
	}
    var browserFlag = getBrowserType() || "";
    FPDriver.prototype.accessDriver = function(){
        if(browserFlag == "html5" )
		{
			this.ajaxAccess(this.url, this.async);
		}
		else if(browserFlag == "simple")
		{
			this.xDomainAccess(this.url, this.async);
		}
		else
		{
			if(window.console)
			{
				console.error("browserFlag is missing");
			}
		}
    }
    FPDriver.prototype.createDriver = function(setting){
        var Driver = function(){};
        var driver = this.initSetting(Driver, setting);
        return driver;
    }
    FPDriver.prototype.initSetting = function (Driver, setting){
        ZK.extend(Driver, FPDriver, {
            url: setting.url,
            async: setting.async,
            dealResult:setting.callback
        })
        return new Driver();
    }
    FPDriver.prototype.getFPDriver = function(setting){
        var driver = new FPDriver();
        var mydriver = driver.createDriver(setting);
        mydriver.accessDriver();
    }
    return new FPDriver();
}
/**
 * 发送请求
 * @type {FPDriver}
 */
var is_first_time=1
var driver = null;
function excute(setting){
    if (is_first_time)
    {
        is_first_time = 0;
        driver = initFPDriver();

    }
    driver.getFPDriver(setting);
}
/**
 * 判断是否安装指纹驱动
 * @author wenxin
 * @create 2013-04-22 20:18:31 pm
 * @param browserFlag 浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 * @param paramArray 存放国际化元素的数组
 * @param isFPLogin 是否是指纹登录 true:是；false:否
 */
function checkDriver(isFPLogin)
{
    var browserFlag = getBrowserType() || "";
    if(browserFlag == "upgradeBrowser"){
        if(isFPLogin){
            $("#id_fp_identify").unbind();
            $("#id_fp_identify").attr({disabled:"true",title:gettext("当前浏览器不支持该功能,请升级或更换浏览器.")});
        }else{
            $("#id_fp_register").attr("onclick", "");
            $("#id_fp_register").attr({disabled:"true",title:gettext("当前浏览器不支持该功能,请升级或更换浏览器.")});
        }
    }
	else
	{
		// 发送一个请求，检查是否安装驱动
		getWebServerInfo(isFPLogin, "0");
	}
}
/**
 * 获取指纹图像
 */
function getFPImage(resultDeal) {
    var setting = {}
    setting.url = "/getImage?random="+getRandomNum();
    setting.async = false;
    setting.callback = resultDeal;
    excute(setting);
}
/**
 * 获取指纹模版
 */
function getFPTemplate(flag) {
    var setting = {};
    setting.url = "/getTemplate?random="+getRandomNum();
    setting.async = false;
    var fpTemplate = "";
	var collectSuccessFlag = false;
    setting.callback= function(result) {
        //返回码
        var ret = null;
        ret = result.ret;
        if(ret == 0)
        {
            fpTemplate = result.data.template;
        }
        if(ret == 0) {
            collectSuccessFlag = true;
            if (flag == "register") {
                //判断手指是否已经采集指纹
                var compareRet = "";
                //如果前面已经录入指纹
//                if(templateDataArray.length > 0)
//                {
//                    //发送请求，进行后台指纹比对
//                    compareRet = fpComparision(fpTemplate, templateDataArray);
//                }
                compareRet = fpComparision(fpTemplate, templateDataArray);
                if($.trim(compareRet) == "dllNotExist")
                {
                    //采集完指纹，渲染手指
                    renderAfterColl(globalContext, fpIdNum, bgColor, false);//bgColor判断
                    //显示框--采集提示
                    collectTips(globalContext, tip7, "html5");
                }else{
                    if(compareRet == "noFingerServer")
                    {
                        //采集完指纹，渲染手指
                        renderAfterColl(globalContext, fpIdNum, bgColor, false);//bgColor判断
                        //显示框--采集提示
                        collectTips(globalContext, tip9, "html5");
                    }
                    else if(compareRet == "noLicences"){
                        //采集完指纹，渲染手指
                        renderAfterColl(globalContext, fpIdNum, bgColor, false);//bgColor判断
                        //显示框--采集提示
                        collectTips(globalContext, tip11, "html5");
                    }
                    else
                    {
                        //此手指未采集指纹
                        if(compareRet != "ok")
                        {
                            //采集完指纹，渲染手指
                            renderAfterColl(globalContext, fpIdNum, bgColor, true);//bgColor判断
                            //显示框--采集提示
                            collectTips(globalContext, tip6, "html5");
                            //胁迫指纹
                            if(duressFingerFlag)
                            {
                                //将手指标记保存到数组中
                                fingerIdArray[fingerIdArray.length] = fpIdNum + DURESS_FINGER_NUM;
                            }
                            else
                            {
                                //将手指标记保存到数组中
                                fingerIdArray[fingerIdArray.length] = fpIdNum;
                            }
                            //将指纹模板保存到数组中
                            templateDataArray[templateDataArray.length] = fpTemplate;
                        }
                        else
                        {
                            //采集完指纹，渲染手指
                            renderAfterColl(globalContext, fpIdNum, bgColor, false);//bgColor判断
                            //Please don't repeat input fingerprint!
                            //显示框--采集提示
                            collectTips(globalContext, tip8, "html5");
                        }
                    }
                }
            }
            else if(flag == "verification")
            {
                verifyFlag = false;
                //指纹比对
                fpComparison(fpTemplate);
            }
        }
        else if(ret == -2003)
        {
            //采集完指纹，渲染手指
            renderAfterColl(globalContext, fpIdNum, bgColor, false);
            //显示框--采集提示
            collectTips(globalContext, tip10, "html5");
        }
    }
    excute(setting);
    return collectSuccessFlag;
}
/**
 * ---------------------------------------------------html----------------------------------------------------------------
 */
var closeWindow = function(){
	layer.close(layerIndex);
  //$(".layui-layer-close").click();
}
var saveFPData = function(result)
{
	if(collectFlag)
	{
		//取消采集
		cancelFPRegister();
		//将定时器的递归调用关闭
		clearTimeout(timer);
	}
	if(result)
	{
    showFPCount();
		storeDataToHtml();
		closeWindow();
	}
	else
	{
		clearImageData();
		closeWindow();
	}
}
/**
 * 提示安装驱动
 */
function alertDialog(){
    var msg = gettext('请安装指纹驱动或启动该服务!');
    var message = '<div>'
        +'<div id="msg" class="alertDialog"><span>'+msg+'</span></div>'
        +'</div>';

    $(message).dialog({
        title:gettext("提示"),
        on_load:function(obj){
                $(message).find("#msg").css({width:(msg.length*10+100)+'px'});
        }
    });
}
/**
 * --------------------提示信息-----------------
 */
var tip1 = gettext("fpRegister_alert_fingerNotSelect");
var tip2 = gettext("fpRegister_alert_readerNotDetect"); //ret = -2001
var tip3 = gettext("fpRegister_tip_pressRemaining");
var tip4 = gettext("fpRegister_tip_fingerprintRegistered");
var tip5 = gettext("fpRegister_alert_deleteSelectedFingerprint");
var tip6 = gettext("fpRegister_tip_registerSuccessful");
var tip7 = gettext("fpRegister_alert_loadDLLFailed");
var tip8 = gettext("fpRegister_alert_fingerprintDuplicate");
var tip9 = gettext("fpRegister_alert_serviceStop");
var tip10 = gettext("fpRegister_alert_pressAgain");
var tip11 = gettext("fpRegister_alert_licenseFailed");
