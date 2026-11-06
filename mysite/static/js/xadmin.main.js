// sourceURL=xadmin.main.js
;(function ($) {
  // noinspection JSUnusedLocalSymbols
  $.fn.exform = function () {
    this.each(function () {
      var form = $(this);
      for (var i = $.fn.exform.renders.length - 1; i >= 0; i--) {
        $.fn.exform.renders[i](form)
      }
      form.addClass('rended');
    })
  };
  $.fn.exform.renders = [];
  $(function () {
    $('.exform:not(.rended)').exform();
  });

  //dropdown submenu plugin
  $(document)
    .on('click.dropdown touchstart.dropdown', '.dropdown-submenu', function (e) {
      e.stopPropagation();
    })
    .on('click.xa.dropdown.data-api', function (/*e*/) {
      $('.dropdown-submenu.open').removeClass('open');
    });

  if ('ontouchstart' in document.documentElement) {
    $('.dropdown-submenu a').on('click.xa.dropdown.data-api', function (/*e*/) {
      $(this).parent().toggleClass('open');
    });
  } else {
    var $sub_menu = $('.dropdown-submenu');
    $sub_menu.on('click.dropdown mouseover.dropdown', function (e) {
      // console.log('this', $(this));
      $(this).parent().find('li.dropdown-submenu.open').removeClass('open');
      // console.log($(this).parent().find('>.dropdown-submenu.open'));
      // console.log($(this).parent().find('.dropdown-submenu.open'));
      $(this).addClass('open');
      e.stopPropagation();
    });
    // $sub_menu.on('click mouseover.dropdown', function (/*e*/) {
    //   console.log('this', $(this));
    //   $(this).parent().find('li.dropdown-submenu.open').removeClass('open');
    //   // console.log($(this).parent().find('>.dropdown-submenu.open'));
    //   // console.log($(this).parent().find('.dropdown-submenu.open'));
    //   $(this).addClass('open');
    // });

  }

  //toggle class button
  $('body').on('click.xa.togglebtn.data-api', '[data-toggle=class]', function (e) {
    var $this = $(this), href;
    var target = $this.attr('data-target')
      || e.preventDefault()
      || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); //strip for ie7
    var className = $this.attr('data-class-name');
    $(target).toggleClass(className)
  });


  //.nav-content bar nav-menu
  $('.navbar-xs .navbar-nav > li')
    .on('shown.bs.dropdown', function (/*e*/) {
      $(this).find('>.dropdown-menu').css('max-height', $(window).height() - 120);
      $(this).parent().find('>li').addClass('hidden-xs');
      $(this).removeClass('hidden-xs');
    })
    .on('hidden.bs.dropdown', function (/*e*/) {
      $(this).parent().find('>li').removeClass('hidden-xs');
    });

  // dashboard widget
  $('.widget-form').each(function (/*e*/) {
    var el = $(this);
    el.find('.btn-remove').click(function () {
      el.find('input[name=_delete]').val('on');
      el.submit();
    });
  });

  // g-search
  $('#g-search .dropdown-menu a').click(function () {
    $('#g-search').attr('action', $(this).data('action')).submit();
  });

})(jQuery);
