/* 
 *  Created on : 20160416, 14:11:50
 *  Modified on: 20181105, 17:38:20
 *  Author:
 *    tcavalin 2013 - 2016
 *    Boyce Gao 2018 -
 */

(function ($) {
  $.fn.multiSwitch = function (options) {
    var settings = $.extend({
      textChecked: 'Checked',
      textNotChecked: 'NotChecked',
      functionOnChange: function ($element) {
        console.log('# multi-switch callback: ', arguments);
      }
    }, options);

    // Create a base element
    var element = $('<div />').addClass('multi-switch');
    // Set width in the base element
    element.css('width', settings.width);
    // Create a content element
    var content = $('<div />').addClass('switch-content');
    // Insert a circle element
    content.append($('<div />').addClass('switch-circle'));
    // Append to base element
    element.append(content);

    // Store a main object
    var all_tri_state_input = this;

    all_tri_state_input.each(function () {
      var new_element = element.clone(),
        eventClick = true,
        $elem = $(this),
        $clone = $elem.clone();

      if ($elem.attr('checked-value') && !$elem.prop("disabled")) {

        var klass = 'initial';
        if ($elem.val() === $elem.attr('checked-value')) {
          klass = 'active';
        } else if ($elem.val() === $elem.attr('unchecked-value')) {
          klass = 'deactivated';
        }

        if (klass === 'initial') {
          var infoExclude = $('<span class="info-slide deactivated" title="' + settings.textNotChecked + '"/>');
          var infoFilter = $('<span class="info-slide active" title="' + settings.textChecked + '"/>');
          new_element.find('.switch-content').append(infoExclude);
          new_element.find('.switch-content').append(infoFilter);

          infoExclude.click(function () {
            var checkbox = $(new_element).find('input');
            checkbox.val($(checkbox).attr('checked-value'));

            $(new_element).find('span').html(settings.textChecked);
            $(new_element).find('.switch-content').addClass('active');
            $(new_element).find('.switch-content').removeClass('deactivated');

            eventClick = true;

            $(new_element).find('.info-slide').remove();
          });

          infoExclude.hover(function () {
            $(new_element).find('.switch-content').addClass('deactivated');
            $(new_element).find('.switch-content').removeClass('initial');
          }, function () {
            $(new_element).find('.switch-content').addClass('initial');
            $(new_element).find('.switch-content').removeClass('deactivated');
          });

          infoFilter.click(function () {
            var checkbox = $(new_element).find('input');
            checkbox.val($(checkbox).attr('unchecked-value'));

            $(new_element).find('span').html(settings.textChecked);
            $(new_element).find('.switch-content').addClass('deactivated');
            $(new_element).find('.switch-content').removeClass('active');

            eventClick = true;

            $(new_element).find('.info-slide').remove();
          });

          infoFilter.hover(function () {
            $(new_element).find('.switch-content').addClass('active');
            $(new_element).find('.switch-content').removeClass('initial');
          }, function () {
            $(new_element).find('.switch-content').addClass('initial');
            $(new_element).find('.switch-content').removeClass('active');
          });

          eventClick = false;
        }

        new_element.find('.switch-content')
          .addClass(klass)
          .addClass($elem.prop("disabled") ? 'disabled' : '');
        new_element.append($clone);

      } else {
        var isChecked = $elem.prop("checked");

        new_element.find('span').html(isChecked ? settings.textChecked : settings.textNotChecked);
        new_element.find('.switch-content')
          .addClass(isChecked ? 'active' : 'deactivated')
          .addClass($elem.prop("disabled") ? 'disabled' : '');
        new_element.append($clone);
      }

      new_element.click(function () {
        var $click_elem = $(this);

        if (!eventClick)
          return;

        var checkbox = $click_elem.find('input');

        if (checkbox.prop("disabled"))
          return;

        var status = null;
        if ($(checkbox).attr('checked-value')) {
          var checked = $click_elem.find('.switch-content').hasClass('active');
          status = !checked;
          if (checked) {
            checkbox.val($(checkbox).attr('unchecked-value'));
          } else {
            checkbox.val($(checkbox).attr('checked-value'));
          }
        } else {
          status = !checkbox.prop("checked");
          checkbox.prop('checked', status);
        }

        // callback function
        // settings.functionOnChange(checkbox);
        $click_elem.find('.switch-content').removeClass('initial');
        if (status) {
          $click_elem.find('span').html(settings.textChecked);
          $click_elem.find('.switch-content').addClass('active').removeClass('deactivated');
        } else {
          $click_elem.find('span').html(settings.textNotChecked);
          $click_elem.find('.switch-content').addClass('deactivated').removeClass('active');
        }

      });
      new_element.change(function () {
        var $change_elem = $(this);

        var checkbox = $change_elem.find('input');
        if (checkbox.prop("disabled"))
          return;

        var status = null;
        if ($(checkbox).attr('checked-value')) {
          var checked = $change_elem.find('.switch-content').hasClass('active');
          status = !checked;

          if (checked) {
            checkbox.val($(checkbox).attr('unchecked-value'));
          } else {
            checkbox.val($(checkbox).attr('checked-value'));
          }
        } else {
          status = !checkbox.prop("checked");
          checkbox.prop('checked', status);
        }

        // callback function
        // settings.functionOnChange(checkbox);
        $change_elem.find('.switch-content').removeClass('initial');
        if (status) {
          $change_elem.find('span').html(settings.textChecked);
          $change_elem.find('.switch-content').addClass('active');
          $change_elem.find('.switch-content').removeClass('deactivated');
        } else {
          $change_elem.find('span').html(settings.textNotChecked);
          $change_elem.find('.switch-content').addClass('deactivated');
          $change_elem.find('.switch-content').removeClass('active');
        }
      });


      var mutationObserver = new MutationObserver(function (mutations) {
        // console.log('mutations', mutations);
        mutations.forEach(function (mutation) {
          settings.functionOnChange($(mutation.target));
          // console.log(arguments);
        });
      });

      try {
        mutationObserver.observe($clone.get(0), {
          attributes: true,
          // characterData: true,
          // childList: true,
          // subtree: true,
          attributeOldValue: true,
          // characterDataOldValue: true,
          attributeFilter: ['value'],
        });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn(e);
        } else {
          throw e;
        }
      }
      // console.log('bind successfully.');

      $elem.after(new_element);
      $elem.remove();
      // $clone.removeClass("multi-switch-input");
    });
  };
}(jQuery));
