
/* Show and Hide Password */
function viewPassword(id)
{
  var input = document.getElementById(id);
  var icon_id = id + "_icon";
  var icon = document.getElementById(icon_id);
  var input_type = input.getAttribute("type");
 
 
  if(input_type == 'password'){
  input.setAttribute("type","text");   
  icon.setAttribute("class","fa fa-eye easy-icon easy-icon-pass");  
  }
  else{
    input.setAttribute("type","password");
  icon.setAttribute("class","fa fa-eye-slash easy-icon easy-icon-pass");   
  } 
}
var windowOriginalWidth = $(window).width();
// alert(windowOriginalWidth);
$(document).ready(function(){
  if ( $(window).width() < 1780 ) {
    $('#easyLoginForm').removeClass('col-lg-8 col-lg-offset-2');
    $('#easyLoginForm').addClass('col-lg-10 col-lg-offset-1');
    $('#easyLoginTab').removeClass('col-lg-10 col-lg-offset-1');
    $('#easyLoginTab').addClass('col-lg-12');    
  }
});
$(window).on('resize', function() {
  if ( $(window).width() < 1780 ) {
    $('#easyLoginForm').removeClass('col-lg-8 col-lg-offset-2');
    $('#easyLoginForm').addClass('col-lg-10 col-lg-offset-1');
    $('#easyLoginTab').removeClass('col-lg-10 col-lg-offset-1');
    $('#easyLoginTab').addClass('col-lg-12');    
  }

else {
  $('#easyLoginForm').removeClass('col-lg-10 col-lg-offset-1');
  $('#easyLoginForm').addClass('col-lg-8 col-lg-offset-2');
  $('#easyLoginTab').removeClass('col-lg-12');   
  $('#easyLoginTab').addClass('col-lg-10 col-lg-offset-1'); 

}
});
// Active Admin Login Button
$(".admin-password").click(function(){
  if( $('.admin-email').val().length !== 0 && $('.admin-password').val().length !== 0   ) {
    $('.admin-login-btn').addClass('easy-login-btn-active');
  }
  else {
    $('.admin-login-btn').hasClass('easy-login-btn-active');
    $('.admin-login-btn').removeClass('easy-login-btn-active');
  }
});
$(".admin-password").keypress(function(){

  if( $('.admin-email').val().length !== 0 && $('.admin-password').val().length !== 0   ) {
    $('.admin-login-btn').addClass('easy-login-btn-active');
  }
  else {
    $('.admin-login-btn').hasClass('easy-login-btn-active');
    $('.admin-login-btn').removeClass('easy-login-btn-active');
  }
 
});
// Active Admin Icon
$(".admin-email").click(function(){
  $('.easy-icon-email').addClass('easy-icon-active');
  $('.easy-icon-pass').removeClass('easy-icon-active');   
});
$(".admin-password").click(function(){
  $('.easy-icon-pass').addClass('easy-icon-active');
  $('.easy-icon-email').removeClass('easy-icon-active');
   
});


// Active Employee Login Button
$(".emp-password").click(function(){
  if( $('.emp-email').val().length !== 0 && $('.emp-password').val().length !== 0   ) {
    $('.emp-login-btn').addClass('easy-login-btn-active');
  }
  else {
    $('.emp-login-btn').hasClass('easy-login-btn-active');
    $('.emp-login-btn').removeClass('easy-login-btn-active');
  }
});
$(".emp-password").keypress(function(){
  if( $('.emp-email').val().length !== 0 && $('.emp-password').val().length !== 0   ) {
    $('.emp-login-btn').addClass('easy-login-btn-active');
  }
  else {
    $('.emp-login-btn').hasClass('easy-login-btn-active');
    $('.emp-login-btn').removeClass('easy-login-btn-active');
  }
});
// Active Employee Icon
$(".emp-email").click(function(){
  $('.easy-icon-email').addClass('easy-icon-active');
  $('.easy-icon-pass').removeClass('easy-icon-active');   
});
$(".emp-password").click(function(){
  $('.easy-icon-pass').addClass('easy-icon-active');
  $('.easy-icon-email').removeClass('easy-icon-active');
   
});
//Active Reset Password Button 
$(".registered-email").click(function(){
  $('.easy-icon-email').addClass('easy-icon-active');
  if( $('.registered-email').val().length !== 0) {
    $('.reset-login-btn').addClass('easy-login-btn-active');
  }
  else {
    $('.reset-login-btn').hasClass('easy-login-btn-active');
    $('.reset-login-btn').removeClass('easy-login-btn-active');
  }
});
$(".registered-email").keypress(function(){

  $('.reset-login-btn').addClass('easy-login-btn-active');
 
});
// Carousel Js
var myCarousel = document.querySelector('#easyCarousel');
var carousel = new bootstrap.Carousel(myCarousel, {
    interval: 5000,
    pause: false
});
// 

function base64encode(str) {
    var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var base64DecodeChars = new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

    var out, i, len;
    var c1, c2, c3;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
    c1 = str.charCodeAt(i++) & 0xff;
    if(i == len)
    {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt((c1 & 0x3) << 4);
        out += "==";
        break;
    }
    c2 = str.charCodeAt(i++);
    if(i == len)
    {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt((c2 & 0xF) << 2);
        out += "=";
        break;
    }
    c3 = str.charCodeAt(i++);
    out += base64EncodeChars.charAt(c1 >> 2);
    out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
    out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
    out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
    /* c1 */
    do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
    } while(i < len && c1 == -1);
    if(c1 == -1)
        break;

    /* c2 */
    do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
    } while(i < len && c2 == -1);
    if(c2 == -1)
        break;

    out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

    /* c3 */
    do {
        c3 = str.charCodeAt(i++) & 0xff;
        if(c3 == 61)
        return out;
        c3 = base64DecodeChars[c3];
    } while(i < len && c3 == -1);
    if(c3 == -1)
        break;

    out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

    /* c4 */
    do {
        c4 = str.charCodeAt(i++) & 0xff;
        if(c4 == 61)
        return out;
        c4 = base64DecodeChars[c4];
    } while(i < len && c4 == -1);
    if(c4 == -1)
        break;
    out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}

function utf16to8(str) {
    var out, i, len, c;

    out = "";
    len = str.length;
    for(i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i);
    } else if (c > 0x07FF) {
        out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
        out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F));
        out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
    } else {
        out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F));
        out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
    }
    }
    return out;
}

function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = str.length;
    i = 0;
    while(i < len) {
    c = str.charCodeAt(i++);
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += str.charAt(i-1);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = str.charCodeAt(i++);
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = str.charCodeAt(i++);
        char3 = str.charCodeAt(i++);
        out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}

function CharToHex(str) {
    if(str=="FFFFFFFFFFFF") return str;
    str=str.toString();
    var out, i, h;
    out = "";
    i = 0;
    while(i < str.length) 
    {
        h = str.charCodeAt(i++).toString(16);
       //out += "\\0x" + h;
       if ((h+'').length==1) {
                out+='0'
       }
       out+=h
       // out +=(i > 0 && i % 8 == 0)?"\r\n":", ";
    }
    return out.toUpperCase();
}

function zk_encrypt(key, str) {
	var s = [], j = 0, x, res = '';
	for (var i = 0; i < 256; i++) {
		s[i] = i;
	}
	for (i = 0; i < 256; i++) {
		j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
		x = s[i];
		s[i] = s[j];
		s[j] = x;
	}
	i = 0;
	j = 0;
	for (var y = 0; y < str.length; y++) {
		i = (i + 1) % 256;
		j = (j + s[i]) % 256;
		x = s[i];
		s[i] = s[j];
		s[j] = x;
		res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
	}
	return res;
}

function zkEncrypt(data,key){
    var tmp = zk_encrypt(key,data)
    var result = base64encode(tmp)
    return result;

}


/* end */
