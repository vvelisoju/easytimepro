$(function(){
    var showConfirmDialog = function(formData){
        if (!valid_date())
            return;
        var confirm_options = {
            icon: 3,
            title: gettext('提示'),
            skin: 'action-dialog',
            btn: [gettext("确定"), gettext("取消")]
        };
        layer.confirm(gettext("统计的时间可能会较长，请耐心等待"), confirm_options, function(index){
            layer.close(index);
            var actionUrl = '/att/attCalc/';
            $.ajax({
                type: "POST",
                url: actionUrl,
                data: formData,
                timeout: 600000,    //10分钟
                dataType: "json",
                success: function(r_data) {
                    if(r_data.ret == 'ok'){
                        onProcess();
                    }else if(r_data.ret == 1){
                        onProcess(r_data);
                    }else{
                        var alert_options = {
                            icon: 3,
                            title: gettext('提示'),
                            skin: 'action-dialog',
                            btn: [gettext("确定"), gettext("取消")]
                        };
                        layer.confirm("System Error.", alert_options, function(index) {
                            layer.close(index);
                        }, function(index){
                            layer.close(index);
                        });
                    }
                }
            });
        }, function(index){
            layer.close(index);
            return ;
        });
    };

    layui.use(['form', 'laydate'], function() {
        var form = layui.form;
        var laydate = layui.laydate;
        $("form.layui-form input.layui-date").each(function(){
            laydate.render({elem: this, type: 'date'});
        });
        form.on('submit(form-calc)', function(data){
            var formData = data.field;
            showConfirmDialog(formData);
        });
        form.render();
    });
});

var processInterval = null;
var processLayer = null;
var processLayerIndex = null;
var requestStamp = '';
var dataTotal = 0;
var onCalculateProcessRefresh = function(){
    var stamp0 = new Date().getTime();
    $.ajax({
        url: '/att/calculate_progressbar/?stamp='+requestStamp,
        type:'GET',
        dataType:'json',
        timeout: 6 * 1000,
        success: function(data){
            var title = '<h1><i class="icon-spinner icon-spin icon-2x pull-left"></i><span style="line-height: 36px;font-size:35px;"><b>Processing...</b></span></h1><br/><font color="red">*Please keep this window untill finished.</font>';
            var total = data['total_len'];
            dataTotal = total;
            var calculator = data['calculator'];
            var processed = data['processed'];
            var pending = data['pending'];
            var process_range = data['process_range'];
            var process_time = data['process_time'];
            var processed_time = data['processed_time'];
            var tp = data['tp'];
            var fp = data['fp'];
            if(processLayer.find("#process_title").html() == ""){
                processLayer.find("#process_title").html(title);
            }
            processLayer.find("#process_range").html("Range:"+process_range);
            processLayer.find("#id_total").html("Total:"+total);
            processLayer.find("#id_operator").html("Operator:"+calculator);
            processLayer.find("#id_process_time").html("Process At:"+process_time);
            processLayer.find("#id_processed_time").html("Used:"+processed_time);
            processLayer.find("#id_done").html("Calculated:"+processed);
            processLayer.find("#id_pending").html("Pending:"+pending);
            processLayer.find("#spaceuseddetail").progressBar(tp, {increment:100,barImage: '/media/images/progressbg_green.gif?'+stamp0});
            processLayer.find("#spaceusedtol").progressBar(fp, {increment:100,barImage: '/media/images/progressbg_green.gif?'+stamp0});
            if(fp >= 100 || pending == 0){
                clearInterval(processInterval);
                layer.close(processLayerIndex);
            }
        },
        error:function(){
        }
    });
};

var onProcess = function(data){
    var vbox=""
        +"<div id='processWindow'><div id='gz_processStatus' style='background-color:#000000;'></div>"
        +"<div id='show_process_status'>"
        +"  <div id='process_title' style='padding: 5px 0 15px 5px;width:420px;'></div>"
        +"  <div id='detail_process' style='margin-bottom:3px;width:420px;'>"
        +"      <table align='center' style='border:1'>"
        +"      <tr>"
        +"          <td colspan='2'><label id='process_range'></label></td>"
        +"      </tr>"
        +"      <tr>"
        +"          <td width='200px'><label id='id_total'></label></td>"
        +"          <td width='200px'><label id='id_operator'></label></td>"
        +"      </tr>"
        +"      <tr>"
        +"          <td width='200px'><label id='id_process_time'></label></td>"
        +"          <td width='200px'><label id='id_processed_time'></label></td>"
        +"      </tr>"
        +"      <tr>"
        +"          <td width='200px'><label id='id_done'></label></td>"
        +"          <td width='200px'><label id='id_pending'></label></td>"
        +"      </tr>"
        +"</table>"
        +"  </div>"
        +"  <div id='total_process' style='margin-bottom:15px;width:420px;'>"
        +"      <table align='center'><tr>"
        +"          <td colspan='2' height='30px' align='center' style='padding-top:3px;'>"
        +"              <span class='progressBar' id='spaceusedtol'>0%</span>"
        +"          </td>"
        +"      </tr>"
        +"<table>"
        +"  </div>"
        +"</div></div>";
    var options = {
        title: gettext("温馨提示"),
        area: ['auto', '300px'],
        skin: 'option_dialog',
        shadeClose: false,
        success: function(layero, index){
            var stamp0 = new Date().getTime();
            processLayer = layero;
            processLayerIndex = index;
            if(data){
                layero.find("#process_title").html('<font color="red">' + gettext("当前考勤计算已经有人在统计,请稍后再做统计！")+'</font>');
                processLayer.find("#process_range").html("Range:"+data.process_range);
                processLayer.find("#id_total").html("Total:"+data.total);
                processLayer.find("#id_operator").html("Operator:"+data.calculator);
                processLayer.find("#id_process_time").html("At:"+data.process_time);
                processLayer.find("#id_processed_time").html("Used:"+data.processed_time);
                processLayer.find("#id_done").html("Calculated:"+data.processed);
                processLayer.find("#id_pending").html("Pending:"+data.pending);
                processLayer.find("#spaceuseddetail").progressBar(data.tp, {increment:100,barImage: '/media/images/progressbg_green.gif?'+stamp0});
                processLayer.find("#spaceusedtol").progressBar(data.fp, {increment:100,barImage: '/media/images/progressbg_green.gif?'+stamp0});
            }else{
                processInterval = window.setInterval('onCalculateProcessRefresh()', 3000);
            }
        },
        cancel: function(index){
            layer.close(index);
            clearInterval(processInterval);
        }
    };
    $(vbox).layerDialog(options);
};
    
var valid_date = function(){  //验证选择日期的有效性
    if ($("#id_start_date").val()=="" || $("#id_end_date").val()==""){
        alert(gettext("请选择开始日期和结束日期"));
        return false;
    }
    var st = new Date($("#id_start_date").val().replace(/-/g,"/"));
    var et = new Date($("#id_end_date").val().replace(/-/g,"/"));
    if(st > et){
        alert(gettext("开始日期不能大于结束日期"));
        return false;
    }
    if(et>new Date()){
        alert(gettext("结束日期不能大于今天"));
        return false;
    }
    return true
}

