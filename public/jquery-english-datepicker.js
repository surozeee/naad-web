/*!
 * English Datepicker (jQuery) — Based on Nepali Datepicker
 * Features: min/max, disabled dates/ranges, range picker with OK/Clear, live highlight
 */
(function ($) {
    'use strict';

    /*** ---------------- Options ---------------- ***/
    var defaults = {
        theme: 'light',
      language: 'english',          // 'nepali' | 'english'
        dateFormat: 'YYYY-MM-DD',
        placeholder: 'Select Date',
      autoClose: true,
        modal: false,
        onSelect: null,
        onOpen: null,
        onClose: null,
        readonly: false,
      minDate: null,               // {y,m,d}, 'YYYY-MM-DD', Date, or function() -> same
      maxDate: null,               // {y,m,d}, 'YYYY-MM-DD', Date, or function() -> same
      disabledDates: [],           // Array of dates (object/string/Date)
      disabledDateRanges: [],      // [{start:.., end:..}]
      defaultDate: null,           // object/string/Date
      showToday: true,             // show footer Today
      showEnglishDateSubscript: true,
  
      // Range-related (single-input)
      range: false,
      rangeSeparator: ' - ',
      // Range-related (injected by range picker wrapper)
      enableRangeControls: false,
      getRange: null,              // function() -> {start, end}
      onApplyRange: null,          // function()
      onClearRange: null           // function()
    };
  
    /*** ---------------- Labels ---------------- ***/
    var monthNames = {
      nepali: ['बैशाख','जेष्ठ','आषाढ','श्रावण','भाद्र','आश्विन','कार्तिक','मंसिर','पौष','माघ','फाल्गुन','चैत्र'],
      english:['January','February','March','April','May','June','July','August','September','October','November','December']
    };
    var dayNamesShort = {
      nepali: ['आइत','सोम','मंगल','बुध','बिहि','शुक्र','शनि'],
      english:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    };

    /*** ---------------- Helpers ---------------- ***/
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }
    function getFirstDayOfMonth(year, month) {
        return new Date(year, month - 1, 1).getDay();
    }
    function formatDate(settings, date) {
        if (!date) return '';
        var y = date.year;
        var mm = String(date.month).padStart(2, '0');
        var dd = String(date.day).padStart(2, '0');
        return settings.dateFormat.replace('YYYY', y).replace('MM', mm).replace('DD', dd);
    }
    function same(a, b) { 
        return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day; 
    }
    function toNum(d){ return d ? (d.year*10000 + d.month*100 + d.day) : null; }
    function cmp(a,b){ var A=toNum(a),B=toNum(b); return (A==null||B==null)? null : (A<B?-1:(A>B?1:0)); }
    function isBefore(a,b){ return cmp(a,b)===-1; }
    function isAfter(a,b){ return cmp(a,b)===1; }
    function isBetweenInclusive(d,start,end){
      var n=toNum(d), s=toNum(start), e=toNum(end);
      return (n!=null && s!=null && e!=null && n>=s && n<=e);
    }
  
    // Parse date input (object/string/Date)
    function parseDate(dateInput) {
      if (!dateInput) return null;
      if (typeof dateInput === 'string') {
        var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateInput.trim());
        if (m) return { year:+m[1], month:+m[2], day:+m[3] };
        return null;
      } else if (dateInput instanceof Date) {
        return { year: dateInput.getFullYear(), month: dateInput.getMonth()+1, day: dateInput.getDate() };
      } else if (typeof dateInput === 'object' && dateInput.year && dateInput.month && dateInput.day) {
        return { year:+dateInput.year, month:+dateInput.month, day:+dateInput.day };
      }
      return null;
    }
  
    // Normalize date-like settings (minDate/maxDate/disabled arrays/defaultDate)
    function normalizeSettingsDates(settings) {
        if (settings.minDate && typeof settings.minDate !== 'function') {
            settings.minDate = parseDate(settings.minDate);
        }
        if (settings.maxDate && typeof settings.maxDate !== 'function') {
            settings.maxDate = parseDate(settings.maxDate);
        }
        if (settings.disabledDates && Array.isArray(settings.disabledDates)) {
        settings.disabledDates = settings.disabledDates.map(parseDate).filter(Boolean);
      }
        if (settings.disabledDateRanges && Array.isArray(settings.disabledDateRanges)) {
        settings.disabledDateRanges = settings.disabledDateRanges.map(function(r){
          if (r && r.start && r.end) {
            return { start: parseDate(r.start), end: parseDate(r.end) };
                }
                return null;
        }).filter(function(r){ return r && r.start && r.end; });
        }
        if (settings.defaultDate) {
            settings.defaultDate = parseDate(settings.defaultDate);
        }
    }

    // Check min/max/disabled lists/ranges
    function isDateDisabled(date, settings) {
      if (!date) return false;
      var minDate = settings.minDate;
      if (typeof minDate === 'function') minDate = parseDate(minDate());
      if (minDate) {
        if (isBefore(date, minDate)) return true;
      }
      var maxDate = settings.maxDate;
      if (typeof maxDate === 'function') maxDate = parseDate(maxDate());
      if (maxDate) {
        if (isAfter(date, maxDate)) return true;
      }
      if (settings.disabledDates && settings.disabledDates.length) {
        for (var i=0;i<settings.disabledDates.length;i++) {
          if (same(date, settings.disabledDates[i])) return true;
        }
      }
      if (settings.disabledDateRanges && settings.disabledDateRanges.length) {
        for (var j=0;j<settings.disabledDateRanges.length;j++) {
          var r = settings.disabledDateRanges[j];
          if (isBetweenInclusive(date, r.start, r.end)) return true;
        }
      }
      // If range-aware, enforce soft constraints visually as disabled:
      if (typeof settings.getRange === 'function') {
        var rng = settings.getRange();
        var isEndSide = (settings.__side === 'end');
        var isStartSide = (settings.__side === 'start');
        if (settings.range && rng && rng.phase === 'end' && rng.start && isBefore(date, rng.start)) return true;
        if (isStartSide && rng && rng.end && isAfter(date, rng.end)) return true;   // start > end
        if (isEndSide   && rng && rng.start && isBefore(date, rng.start)) return true; // end < start
      }
      return false;
    }
  
    /*** ---------------- Plugin Globals ---------------- ***/
    var ACTIVE = null, ACTIVE_INPUT = null, INSTANCES = 0, GLOBAL_BOUND = false;
  
    function bindGlobal() {
      if (GLOBAL_BOUND) return;
      GLOBAL_BOUND = true;
      $(document).on('mousedown.edp-global', function(e) {
        if (!ACTIVE) return;
        if ($(e.target).closest(ACTIVE).length) return;
        if ($(e.target).closest(ACTIVE_INPUT).length) return;
        var closeFn = $(ACTIVE).data('__edp_close__');
        if (closeFn) closeFn();
      });
      $(window).on('resize.edp-global scroll.edp-global', function() {
        if (!ACTIVE) return;
        var pos = $(ACTIVE).data('__edp_position__');
        if (pos) pos();
      });
    }
    function unbindGlobalIfIdle() {
      if (INSTANCES > 0) return;
      $(document).off('.edp-global'); $(window).off('.edp-global'); GLOBAL_BOUND = false;
    }
  
    /*** ---------------- Plugin ---------------- ***/
    $.fn.englishDatepicker = function(options) {
            bindGlobal();
        return this.each(function() {
            var $input = $(this);
            var settings = $.extend({}, defaults, options || {});
            normalizeSettingsDates(settings);
            
        if (settings.readonly !== false) $input.attr('readonly', true);
        $input.attr('placeholder', settings.placeholder);

            var today = new Date();
        var initial = settings.defaultDate || { year: today.getFullYear(), month: today.getMonth()+1, day: today.getDate() };
            
            var state = {
                isOpen: false,
          selected: settings.range ? null : (settings.defaultDate ? {year: initial.year, month: initial.month, day: initial.day} : null),
          current:  {year: initial.year, month: initial.month, day: initial.day},
          range: settings.range ? { start: null, end: null, phase: 'start' } : null,
                view: 'month',
          $dp: null, $overlay: null, bound: false
            };
            INSTANCES++;
        if (settings.range) {
          settings.getRange = function() {
            return state.range ? { start: state.range.start, end: state.range.end, phase: state.range.phase } : null;
          };
          // Sync range from input value if it exists (inline logic since syncRangeFromInput is defined later)
          var raw = ($input.val() || '').toString().trim();
          if (raw) {
            var parts = raw.split(settings.rangeSeparator || ' - ');
            var start = parts[0] ? parseDate(parts[0].trim()) : null;
            var end = parts[1] ? parseDate(parts[1].trim()) : null;
            if (start) {
              state.range.start = start;
              state.range.end = end;
              state.range.phase = end ? 'start' : 'end';
              // Navigate to start date month to show the range
              state.current = { year: start.year, month: start.month, day: start.day };
              var active = end || start;
              state.selected = active;
            }
          } else {
            $input.val('');
          }
        } else if (state.selected) {
          $input.val(formatDate(settings, state.selected));
        }

        function updateRangeInputValue() {
          if (!settings.range || !state.range) return;
          if (state.range.start && state.range.end) {
            $input.val(formatDate(settings, state.range.start) + settings.rangeSeparator + formatDate(settings, state.range.end));
          } else if (state.range.start) {
            $input.val(formatDate(settings, state.range.start));
          } else {
            $input.val('');
          }
        }

        function buildRangePayload() {
          if (!settings.range || !state.range) return null;
          var payload = [];
          if (state.range.start) {
            payload.push({
              value: formatDate(settings, state.range.start),
              year: state.range.start.year,
              month: state.range.start.month,
              day: state.range.start.day
            });
          }
          if (state.range.end) {
            payload.push({
              value: formatDate(settings, state.range.end),
              year: state.range.end.year,
              month: state.range.end.month,
              day: state.range.end.day
            });
          }
          return payload;
        }

        function handleRangeSelection(date) {
          if (!state.range) {
            state.range = { start: null, end: null, phase: 'start' };
          }

          if (!state.range.start || state.range.phase === 'start') {
            state.range.start = date;
            state.range.end = null;
            state.range.phase = 'end';
            state.selected = date;
            state.current = { year: date.year, month: date.month, day: date.day };
            updateRangeInputValue();
            return;
          }

          if (isBefore(date, state.range.start)) {
            return;
          }

          state.range.end = date;
          state.range.phase = 'start';
          state.selected = date;
          state.current = { year: date.year, month: date.month, day: date.day };
          updateRangeInputValue();
        }

        function syncRangeFromInput() {
          if (!settings.range) return;
          if (!state.range) {
            state.range = { start: null, end: null, phase: 'start' };
          }
          var raw = ($input.val() || '').toString().trim();
          if (!raw) {
            state.range.start = null;
            state.range.end = null;
            state.range.phase = 'start';
            return;
          }
          var parts = raw.split(settings.rangeSeparator || ' - ');
          var start = parts[0] ? parseDate(parts[0].trim()) : null;
          var end = parts[1] ? parseDate(parts[1].trim()) : null;
          if (start) {
            state.range.start = start;
            state.range.end = end;
            state.range.phase = end ? 'start' : 'end';
            // Navigate to start date month to show the range
            state.current = { year: start.year, month: start.month, day: start.day };
            var active = end || start;
            state.selected = active;
            updateRangeInputValue();
          }
        }

            function build() {
                if (state.$dp) return;
          var $dp = $('<div class="english-datepicker ' + settings.theme + '" role="dialog" aria-label="Date Picker"></div>').hide();
                state.$dp = $dp;
                if (settings.modal) {
            // Check if we're already inside a modal
            var $parentModal = $input.closest('.modal, .english-datepicker-modal-overlay');
            if ($parentModal.length > 0) {
              // We're inside a modal, create a backdrop and center the datepicker
              var $backdrop = $('<div class="datepicker-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;"></div>');
              $dp.css({
                'position': 'fixed',
                'z-index': '10001',
                'top': '50%',
                'left': '50%',
                'transform': 'translate(-50%, -50%)'
              });
              $('body').append($backdrop);
              $('body').append($dp);
              state.$backdrop = $backdrop;
              
              // Close on backdrop click
              $backdrop.on('click.edp', function(e) {
                if (e.target === $backdrop[0]) close();
                    });
                } else {
              // Create our own modal overlay
              var $ov = $('<div class="english-datepicker-modal-overlay" role="dialog" aria-modal="true"></div>').hide();
              var $ct = $('<div class="english-datepicker-modal-content"></div>');
              $ct.append($dp); $ov.append($ct);
              $('body').append($ov); state.$overlay = $ov;
              $ov.on('click.edp', function(e) { if (e.target === $ov[0]) close(); });
              $ct.on('click.edp', function(e) { e.stopPropagation(); });
              
              // Add keyboard support for modal
              $(document).on('keydown.edp-modal', function(e) {
                if (e.keyCode === 27) { // Escape key
                  close();
                }
              });
            }
          } else {
            $('body').append($dp);
                }
            }

            function open() {
                if (state.isOpen) return;

          // Close any other instance first
                if (ACTIVE && ACTIVE !== state.$dp?.[0]) {
                    var closeFn = $(ACTIVE).data('__edp_close__');
                    if (typeof closeFn === 'function') closeFn();
            ACTIVE = null; ACTIVE_INPUT = null;
                }

                if (settings.range) {
                  syncRangeFromInput();
                  // Ensure getRange function returns current state
                  settings.getRange = function() {
                    return state.range ? { start: state.range.start, end: state.range.end, phase: state.range.phase } : null;
                  };
                }

                build();
                render();
                
          state.isOpen = true;
                ACTIVE = state.$dp[0];
          ACTIVE_INPUT = $input[0];

                if (settings.modal && state.$overlay) {
            state.$overlay.css({
              'display': 'flex',
              'position': 'fixed',
              'top': '0',
              'left': '0',
              'width': '100%',
              'height': '100%',
              'background': 'rgba(0, 0, 0, 0.5)',
              'z-index': '9999',
              'align-items': 'center',
              'justify-content': 'center'
            });
            var parentModal = $input.closest('.modal');
            if (parentModal.length) state.$overlay.css('z-index', '10001');
          } else {
            position();
            state.$dp.show();
          }

                if (settings.onOpen) settings.onOpen.call($input[0]);
            }

            function close() {
                if (!state.isOpen && !state.$dp && !state.$overlay) return;
                state.isOpen = false;
          if (ACTIVE === state.$dp?.[0]) { ACTIVE = null; ACTIVE_INPUT = null; }
                if (state.$dp) {
            if (settings.modal && state.$overlay) {
              state.$overlay.fadeOut(200, function() {
                $(this).remove();
              });
            } else if (settings.modal && state.$backdrop) {
              state.$backdrop.fadeOut(200, function() {
                $(this).remove();
              });
              state.$dp.off('.edp').remove();
            } else {
                    state.$dp.off('.edp').remove();
            }
                    state.$dp = null;
                }
          if (settings.modal && state.$overlay) { 
            state.$overlay.off('.edp');
            $(document).off('keydown.edp-modal');
            state.$overlay = null; 
          }
          if (settings.modal && state.$backdrop) {
            state.$backdrop.off('.edp');
            state.$backdrop = null;
          }
                if (settings.onClose) settings.onClose.call($input[0]);
            }

            function position() {
                if (!state.isOpen || settings.modal || !state.$dp) return;
          var $dp = state.$dp, off = $input.offset(), ih = $input.outerHeight();
          var dh = $dp.outerHeight() || 280, dw = $dp.outerWidth() || 320;
          var $w = $(window), vh = $w.height(), vw = $w.width(), st = $w.scrollTop(), sl = $w.scrollLeft();
          
          // Check if input is inside a modal
          var $modal = $input.closest('.modal, .english-datepicker-modal-overlay');
          if ($modal.length > 0) {
            // Position relative to modal
            var modalOffset = $modal.offset();
            var modalTop = modalOffset.top;
            var modalLeft = modalOffset.left;
            
                $dp.css({
                    position: 'absolute',
              top: (off.top - modalTop + ih + 5) + 'px',
              left: (off.left - modalLeft) + 'px',
              zIndex: 10000
            });
            return;
          }
          var below = vh - (off.top - st) - ih, above = (off.top - st);
          var top, left;
          if (below >= dh + 10) top = off.top + ih + 5;
          else if (above >= dh + 10) top = off.top - dh - 5;
          else top = Math.min(off.top + ih + 5, st + vh - dh - 10);
          left = off.left; if (left + dw > sl + vw) left = sl + vw - dw - 10; if (left < sl + 10) left = sl + 10;
          $dp.css({position: 'absolute', top: top, left: left, zIndex: 9999});
            }

            function render() {
          var cur = state.current, html = '';
                if (state.view === 'month') {
                    html += '<div class="datepicker-header">';
                    html += '<div class="nav-btn prev-year" data-action="prev-year" role="button" tabindex="0">&#171;</div>';
                    html += '<div class="nav-btn prev-month" data-action="prev-month" role="button" tabindex="0">&#8249;</div>';
            html += '<div class="month-year clickable-month-year" data-action="show-month-list" role="button" tabindex="0"><div class="date-display">';
                    html += '<span class="month">' + monthNames[settings.language][cur.month - 1] + '</span> ';
            html += '<span class="year">' + cur.year + '</span></div></div>';
                    html += '<div class="nav-btn next-month" data-action="next-month" role="button" tabindex="0">&#8250;</div>';
                    html += '<div class="nav-btn next-year" data-action="next-year" role="button" tabindex="0">&#187;</div>';
                    html += '</div>';

                    html += '<div class="datepicker-body"><div class="weekdays">';
                    for (var i = 0; i < 7; i++) {
                        html += '<div class="weekday">' + dayNamesShort[settings.language][i] + '</div>';
                    }
                    html += '</div><div class="days">';

                    var first = getFirstDayOfMonth(cur.year, cur.month);
                    var daysIn = getDaysInMonth(cur.year, cur.month);

            // Prev-month fillers
                    var prevMonth = cur.month === 1 ? 12 : cur.month - 1;
                    var prevYear = cur.month === 1 ? cur.year - 1 : cur.year;
                    var prevDaysIn = getDaysInMonth(prevYear, prevMonth);
                    for (var p = first - 1; p >= 0; p--) {
                        var pd = prevDaysIn - p;
                        html += '<div class="day other-month"><div class="date">' + pd + '</div></div>';
                    }

                    // Current month days
            var todayObj = { year: new Date().getFullYear(), month: new Date().getMonth()+1, day: new Date().getDate() };
            var rng = (typeof settings.getRange === 'function') ? settings.getRange() : null;
                    for (var d = 1; d <= daysIn; d++) {
                        var adDate = {year: cur.year, month: cur.month, day: d};
              var isToday = same(adDate, todayObj);
                        var isSelected = state.selected && same(adDate, state.selected);
                        var isDisabled = isDateDisabled(adDate, settings);
  
              var isStart = rng && rng.start && same(adDate, rng.start);
              var isEnd   = rng && rng.end   && same(adDate, rng.end);
              // in-range should include dates between start and end, but not start/end themselves
              var inRange = rng && rng.start && rng.end && isBetweenInclusive(adDate, rng.start, rng.end) && !isStart && !isEnd;
  
              var cls = 'day'
                + (isToday ? ' today' : '')
                + (isSelected ? ' selected' : '')
                + (isDisabled ? ' disabled' : '')
                + (inRange ? ' in-range' : '')
                + (isStart ? ' range-start' : '')
                + (isEnd ? ' range-end' : '');
  
                        var dataAction = isDisabled ? '' : 'data-action="select-day"';
                        var role = isDisabled ? 'role="button" aria-disabled="true"' : 'role="button" tabindex="0"';
                        html += '<div class="' + cls + '" ' + dataAction + ' data-day="' + d + '" ' + role + '>';
              html += '<div class="date">' + d + '</div></div>';
                    }

            // Next-month fillers
                    var need = 42 - (first + daysIn);
                    for (var n = 1; n <= need; n++) {
                        html += '<div class="day other-month"><div class="date">' + n + '</div></div>';
                    }

                    html += '</div></div>';
  
            // Footer (Today + optional Range controls)
            html += '<div class="datepicker-footer">';
            if (settings.showToday) html += '<div class="btn-today" data-action="today" role="button" tabindex="0">Today</div>';
            if (settings.enableRangeControls) {
              var rng2 = settings.getRange ? settings.getRange() : {};
              var canApply = !!(rng2 && rng2.start && rng2.end && !isAfter(rng2.start, rng2.end));
              html += '<div class="range-controls">';
              html += '  <button class="btn-clear" data-action="clear-range" type="button">Clear</button>';
              html += '  <button class="btn-apply" data-action="apply-range" type="button" ' + (canApply ? '' : 'disabled') + '>OK</button>';
              html += '</div>';
            }
            html += '</div>';
          } else if (state.view === 'year') {
            var currentYear = cur.year;
            var startYear = Math.floor(currentYear / 12) * 12;
            var endYear = startYear + 11;
            html += '<div class="datepicker-header">';
            html += '<div class="nav-btn prev-decade" data-action="prev-decade" role="button" tabindex="0">&#171;</div>';
            html += '<div class="year-range"><span>' + startYear + ' - ' + endYear + '</span></div>';
            html += '<div class="nav-btn next-decade" data-action="next-decade" role="button" tabindex="0">&#187;</div>';
            html += '</div><div class="datepicker-body year-view">';
            for (var y = startYear; y <= endYear; y++) {
              var c = 'year-item';
              if (y === cur.year) c += ' current';
              if (state.selected && y === state.selected.year) c += ' selected';
              html += '<div class="' + c + '" data-action="select-year" data-year="' + y + '" role="button" tabindex="0">' + y + '</div>';
            }
            html += '</div>';
          } else if (state.view === 'monthList') {
            html += '<div class="datepicker-header">';
            html += '<div class="nav-btn prev-year" data-action="prev-year" role="button" tabindex="0">&#8249;</div>';
            html += '<div class="year-display"><div class="clickable-year" data-action="show-year-range" role="button" tabindex="0">' + cur.year + '</div></div>';
            html += '<div class="nav-btn next-year" data-action="next-year" role="button" tabindex="0">&#8250;</div>';
            html += '</div><div class="datepicker-body month-list-view">';
            for (var m = 1; m <= 12; m++) {
              var cls2 = 'month-item' + (m === cur.month ? ' current' : '') + (state.selected && m === state.selected.month ? ' selected' : '');
              html += '<div class="' + cls2 + '" data-action="select-month" data-month="' + m + '" role="button" tabindex="0">' + monthNames[settings.language][m - 1] + '</div>';
            }
            html += '</div>';
          }
  
          if (!state.$dp) return;
                state.$dp[0].innerHTML = html;
                state.$dp.data('__edp_close__', close);
                state.$dp.data('__edp_position__', position);
                bindEventHandlers();
            }

            function bindEventHandlers() {
                if (!state.$dp) return;
                state.$dp.off('click.edp keydown.edp mousedown.edp');

                state.$dp.on('click.edp', '[data-action]', function(e) {
            e.preventDefault(); e.stopPropagation();
            var $t = $(this), action = $t.data('action');
                    if ($t.hasClass('disabled') || $t.attr('aria-disabled') === 'true') return;
                    var cur = state.current;

                    switch (action) {
                        case 'prev-year':
                            cur.year--;
                            cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                render(); break;
                        case 'next-year':
                            cur.year++;
                            cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                render(); break;
                        case 'prev-month':
                if (cur.month === 1) { cur.month = 12; cur.year--; } else { cur.month--; }
                            cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                render(); break;
                        case 'next-month':
                if (cur.month === 12) { cur.month = 1; cur.year++; } else { cur.month++; }
                cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                render(); break;
              case 'prev-decade':
                cur.year -= 12;
                cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                render(); break;
              case 'next-decade':
                cur.year += 12;
                cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                render(); break;
              case 'select-year':
                var y = parseInt($t.data('year'), 10);
                cur.year = y;
                cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                state.view = 'monthList';
                render(); break;
              case 'show-year-range':
                state.view = 'year';
                render(); break;
              case 'show-month-list':
                state.view = 'monthList';
                render(); break;
              case 'select-month':
                cur.month = parseInt($t.data('month'), 10);
                            cur.day = Math.min(cur.day || 1, getDaysInMonth(cur.year, cur.month));
                state.view = 'month';
                render(); break;
              case 'select-day': {
                            var d = parseInt($t.data('day'), 10);
                            var selectedDate = {year: cur.year, month: cur.month, day: d};
                if (isDateDisabled(selectedDate, settings)) return;
                if (settings.range) {
                  handleRangeSelection(selectedDate);
                  render();
                  if (settings.onSelect) settings.onSelect.call($input[0], buildRangePayload());
                  if (settings.autoClose && state.range && state.range.start && state.range.end) close();
                  break;
                }
                            state.selected = selectedDate;
                            $input.val(formatDate(settings, state.selected));
                if (settings.autoClose && !settings.enableRangeControls) close(); // in range mode, OK handles close
                            if (settings.onSelect) settings.onSelect.call($input[0], state.selected, formatDate(settings, state.selected));
                break; }
              case 'today': {
                var now = new Date();
                var todayDate = { year: now.getFullYear(), month: now.getMonth()+1, day: now.getDate() };
                if (isDateDisabled(todayDate, settings)) return;
                if (settings.range) {
                  handleRangeSelection({year: todayDate.year, month: todayDate.month, day: todayDate.day});
                  render();
                  if (settings.onSelect) settings.onSelect.call($input[0], buildRangePayload());
                  if (settings.autoClose && state.range && state.range.start && state.range.end) close();
                  break;
                }
                            state.current = {year: todayDate.year, month: todayDate.month, day: todayDate.day};
                            state.selected = {year: todayDate.year, month: todayDate.month, day: todayDate.day};
                            $input.val(formatDate(settings, state.selected));
                if (settings.autoClose && !settings.enableRangeControls) close();
                if (settings.onSelect) settings.onSelect.call($input[0], state.selected, formatDate(settings, state.selected));
                break; }
              case 'apply-range':
                if (settings.onApplyRange) settings.onApplyRange();
                            if (settings.autoClose) close();
                break;
              case 'clear-range':
                if (settings.onClearRange) settings.onClearRange();
                render();
                            break;
                    }
                });

                state.$dp.on('keydown.edp', '[data-action][role="button"]', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(this).trigger('click'); }
          });
          state.$dp.on('mousedown.edp', function(e) { e.stopPropagation(); });
        }
  
        // input triggers
            $input.off('click.edp focus.edp mousedown.edp')
          .on('click.edp focus.edp', function(e) { e.preventDefault(); e.stopPropagation(); open(); })
          .on('mousedown.edp', function(e) { e.stopPropagation(); });
  
        // public API
            $input.data('englishDatepicker', {
                show: open,
                hide: close,
                isOpen: function() { return state.isOpen; },
                getDate: function() { return state.selected; },
                setDate: function(date) {
                    var ad = parseDate(date);
                    if (ad) {
              // If range-aware, block invalid picks against the counterpart
              if (typeof settings.getRange === 'function') {
                var rng = settings.getRange();
                var isEndSide = (settings.__side === 'end');
                var isStartSide = (settings.__side === 'start');
                if (isStartSide && rng && rng.end && isAfter(ad, rng.end)) return;
                if (isEndSide   && rng && rng.start && isBefore(ad, rng.start)) return;
              }
                        var dmax = getDaysInMonth(ad.year, ad.month);
                        if (ad.day < 1) ad.day = 1;
                        if (ad.day > dmax) ad.day = dmax;
                        state.selected = {year: ad.year, month: ad.month, day: ad.day};
              state.current  = {year: ad.year, month: ad.month, day: ad.day};
                        $input.val(formatDate(settings, state.selected));
                        if (state.$dp) render();
                    }
                },
          clear: function() {
            if (settings.range && state.range) {
              state.range.start = null; state.range.end = null; state.range.phase = 'start';
            }
            state.selected = null;
            $input.val('');
            if (state.$dp) render();
          },
                destroy: function() {
                    close();
                    if (state.$dp) { state.$dp.off('.edp').remove(); state.$dp = null; }
                    if (state.$overlay) { state.$overlay.off('.edp').remove(); state.$overlay = null; }
            $input.off('.edp').removeData('englishDatepicker').removeAttr('readonly');
            INSTANCES--; if (INSTANCES <= 0) unbindGlobalIfIdle();
                }
            });
        });
    };

    /*** ---------------- Range Picker Wrapper ---------------- ***/
    function createDateRangePicker($startInput, $endInput, options) {
      var range = { start: null, end: null, phase: 'start' }; // 'start' or 'end'
  
      function getRange(){ return { start: range.start, end: range.end }; }
      function setInputs(){
        var sInst = $startInput.data('englishDatepicker');
        var eInst = $endInput.data('englishDatepicker');
        if (sInst) {
          if (range.start) sInst.setDate(range.start); else sInst.clear();
        }
        if (eInst) {
          if (range.end) eInst.setDate(range.end); else eInst.clear();
        }
      }
  
      var shared = $.extend({}, options, {
        enableRangeControls: true,
        getRange: getRange,
        onApplyRange: function(){
          if (options && typeof options.onRangeSelect === 'function' && range.start && range.end) {
            options.onRangeSelect(
              range.start, formatDate(options, range.start),
              range.end,   formatDate(options, range.end)
            );
          }
        },
        onClearRange: function(){
          range.start = null; range.end = null; range.phase = 'start';
          setInputs();
          rebuildPickers();
        }
      });
  
      function startMin(){ return options?.minDate || null; }
      function startMax(){ return range.end || options?.maxDate || null; }
      function endMin(){  return range.start || options?.minDate || null; }
      function endMax(){  return options?.maxDate || null; }
  
      function buildStartOptions(){
        var o = $.extend({}, shared, {
          __side: 'start',
          minDate: startMin,
          maxDate: startMax,
          onSelect: function(date, formatted){
            // If end exists and new start is after end → block silently
            if (range.end && isAfter(date, range.end)) return;
  
            // If both existed and user clicks same start again → reset range from scratch
            if (range.start && range.end && same(date, range.start)) {
              range.end = null;
            }
  
            range.start = date;
            if (!range.end) range.phase = 'end';
  
            rebuildPickers();
            if (options && options.onStartSelect) options.onStartSelect(date, formatted);
          }
        });
        return o;
      }
  
      function buildEndOptions(){
        var o = $.extend({}, shared, {
          __side: 'end',
          minDate: endMin,
          maxDate: endMax,
          onSelect: function(date, formatted){
            if (range.start && isBefore(date, range.start)) return; // enforce end >= start
            range.end = date;
            range.phase = 'start';
            rebuildPickers();
            if (options && options.onEndSelect) options.onEndSelect(date, formatted);
          }
        });
        return o;
      }
  
      function rebuildPickers(){
        var sInst = $startInput.data('englishDatepicker');
        var eInst = $endInput.data('englishDatepicker');
        if (sInst) sInst.destroy();
        if (eInst) eInst.destroy();
  
        $startInput.englishDatepicker(buildStartOptions());
        $endInput.englishDatepicker(buildEndOptions());
        setInputs();
      }
  
      if (options && options.defaultStart) range.start = parseDate(options.defaultStart);
      if (options && options.defaultEnd)   range.end   = parseDate(options.defaultEnd);
      rebuildPickers();
  
      return {
        destroy: function(){
          $startInput.englishDatepicker('destroy');
          $endInput.englishDatepicker('destroy');
        },
        getRange: getRange,
        setRange: function(startDate, endDate){
          var s = parseDate(startDate);
          var e = parseDate(endDate);
          if (s && e && !isAfter(s,e)) {
            range.start = s; range.end = e; range.phase = 'start';
            rebuildPickers();
          }
        },
        clear: function(){
          range.start = null; range.end = null; range.phase = 'start';
          rebuildPickers();
        }
      };
    }
  
    // jQuery API to create a range picker with exactly two inputs
    $.fn.englishDateRangePicker = function(options) {
      var $startInput = this.first();
      var $endInput = this.last();
      if (this.length !== 2) { console.error('englishDateRangePicker requires exactly 2 input elements'); return null; }
      return createDateRangePicker($startInput, $endInput, options);
    };
  
    // Expose utilities
    window.EnglishDatepickerUtils = {
      createDateRangePicker: createDateRangePicker,
      parseDate: parseDate,
      formatDate: formatDate,
      getDaysInMonth: getDaysInMonth,
      isBefore: isBefore,
      isAfter: isAfter
    };
  
})(jQuery);
