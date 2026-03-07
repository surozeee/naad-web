/*!
 * Nepali Datepicker (jQuery) — Java logic parity
 * - Anchor: BS 2000-09-17 == AD 1944-01-01
 * - Single month-length source with overrides
 * - adToBS / bsToAD ported from Java version (forward/backward walk)
 */
(function ($) {
    'use strict';
  
  /*** ---------------- Options ---------------- ***/
  var defaults = {
    theme: 'light',
    language: 'nepali',          // 'nepali' | 'english'
    dateFormat: 'YYYY-MM-DD',
    placeholder: 'Select Date',
    showToday: true,
    autoClose: true,
    modal: false,
    onSelect: null,
    onOpen: null,
    onClose: null,
    readonly: false,
    minDate: null,               // Minimum selectable date (BS format: {year, month, day}, 'YYYY-MM-DD', or function)
    maxDate: null,               // Maximum selectable date (BS format: {year, month, day}, 'YYYY-MM-DD', or function)
    disabledDates: [],           // Array of disabled dates (BS format: [{year, month, day}, ...] or ['YYYY-MM-DD', ...])
    disabledDateRanges: [],      // Array of disabled date ranges (BS format: [{start: {year, month, day}, end: {year, month, day}}, ...])
    defaultDate: null,           // Default date to set on initialization (BS format: {year, month, day} or 'YYYY-MM-DD')
    showToday: true,             // Show/hide the today button
    showEnglishDateSubscript: true, // Show/hide English date subscripts
    range: false,                // Enable single-input range selection
    rangeSeparator: ' - '        // Separator for range input value
  };
  
    /*** ---------------- Labels ---------------- ***/
    var monthNames = {
      nepali: ['बैशाख','जेष्ठ','आषाढ','श्रावण','भाद्र','आश्विन','कार्तिक','मंसिर','पौष','माघ','फाल्गुन','चैत्र'],
      english:['Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra']
    };
    var dayNamesShort = {
      nepali: ['आइत','सोम','मंगल','बुध','बिहि','शुक्र','शनि'],
      english:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    };
    var englishMonthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
    /*** ---------------- BS Calendar (1970–2100) ---------------- ***/
    // Calendar data updated from official Nepali Datepicker v5.0.6
    // Source: https://nepalidatepicker.sajanmaharjan.com.np/v5/nepali.datepicker/js/nepali.datepicker.v5.0.6.min.js
    // Format: [Baishakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
    // Anchor: BS 2000-09-17 == AD 1944-01-01
    // This data matches the official v5.0.6 source exactly
    var bsCalendarData = {
        1970:[31,31,32,31,31,31,30,29,30,29,30,30],
        1971:[31,31,32,31,32,30,30,29,30,29,30,30],
        1972:[31,32,31,32,31,30,30,30,29,29,30,31],
        1973:[30,32,31,32,31,30,30,30,29,30,29,31],
        1974:[31,31,32,31,31,31,30,29,30,29,30,30],
        1975:[31,31,32,32,31,30,30,29,30,29,30,30],
        1976:[31,32,31,32,31,30,30,30,29,29,30,31],
        1977:[30,32,31,32,31,31,29,30,29,30,29,31],
        1978:[31,31,32,31,31,31,30,29,30,29,30,30],
        1979:[31,31,32,32,31,30,30,29,30,29,30,30],
        1980:[31,32,31,32,31,30,30,30,29,29,30,31],
        1981:[31,31,31,32,31,31,29,30,30,29,30,30],
        1982:[31,31,32,31,31,31,30,29,30,29,30,30],
        1983:[31,31,32,32,31,30,30,29,30,29,30,30],
        1984:[31,32,31,32,31,30,30,30,29,29,30,31],
        1985:[31,31,31,32,31,31,29,30,30,29,30,30],
        1986:[31,31,32,31,31,31,30,29,30,29,30,30],
        1987:[31,32,31,32,31,30,30,29,30,29,30,30],
        1988:[31,32,31,32,31,30,30,30,29,29,30,31],
        1989:[31,31,31,32,31,31,30,29,30,29,30,30],
        1990:[31,31,32,31,31,31,30,29,30,29,30,30],
        1991:[31,32,31,32,31,30,30,30,29,29,30,30],
        1992:[31,32,31,32,31,30,30,30,29,30,29,31],
        1993:[31,31,31,32,31,31,30,29,30,29,30,30],
        1994:[31,31,32,31,31,31,30,29,30,29,30,30],
        1995:[31,32,31,32,31,30,30,30,29,29,30,30],
        1996:[31,32,31,32,31,30,30,30,29,30,29,31],
        1997:[31,31,32,31,31,31,30,29,30,29,30,30],
        1998:[31,31,32,31,31,31,30,29,30,29,30,30],
        1999:[31,32,31,32,31,30,30,30,29,29,30,31],
        2000:[30,32,31,32,31,30,30,30,29,30,29,31],
        2001:[31,31,32,31,31,31,30,29,30,29,30,30],
        2002:[31,31,32,32,31,30,30,29,30,29,30,30],
        2003:[31,32,31,32,31,30,30,30,29,29,30,31],
        2004:[30,32,31,32,31,30,30,30,29,30,29,31],
        2005:[31,31,32,31,31,31,30,29,30,29,30,30],
        2006:[31,31,32,32,31,30,30,29,30,29,30,30],
        2007:[31,32,31,32,31,30,30,30,29,29,30,31],
        2008:[31,31,31,32,31,31,29,30,30,29,29,31],
        2009:[31,31,32,31,31,31,30,29,30,29,30,30],
        2010:[31,31,32,32,31,30,30,29,30,29,30,30],
        2011:[31,32,31,32,31,30,30,30,29,29,30,31],
        2012:[31,31,31,32,31,31,29,30,30,29,30,30],
        2013:[31,31,32,31,31,31,30,29,30,29,30,30],
        2014:[31,31,32,32,31,30,30,29,30,29,30,30],
        2015:[31,32,31,32,31,30,30,30,29,29,30,31],
        2016:[31,31,31,32,31,31,29,30,30,29,30,30],
        2017:[31,31,32,31,31,31,30,29,30,29,30,30],
        2018:[31,32,31,32,31,30,30,29,30,29,30,30],
        2019:[31,32,31,32,31,30,30,30,29,30,29,31],
        2020:[31,31,31,32,31,31,30,29,30,29,30,30],
        2021:[31,31,32,31,31,31,30,29,30,29,30,30],
        2022:[31,32,31,32,31,30,30,30,29,29,30,30],
        2023:[31,32,31,32,31,30,30,30,29,30,29,31],
        2024:[31,31,31,32,31,31,30,29,30,29,30,30],
        2025:[31,31,32,31,31,31,30,29,30,29,30,30],
        2026:[31,32,31,32,31,30,30,30,29,29,30,31],
        2027:[30,32,31,32,31,30,30,30,29,30,29,31],
        2028:[31,31,32,31,31,31,30,29,30,29,30,30],
        2029:[31,31,32,31,32,30,30,29,30,29,30,30],
        2030:[31,32,31,32,31,30,30,30,29,29,30,31],
        2031:[30,32,31,32,31,30,30,30,29,30,29,31],
        2032:[31,31,32,31,31,31,30,29,30,29,30,30],
        2033:[31,31,32,32,31,30,30,29,30,29,30,30],
        2034:[31,32,31,32,31,30,30,30,29,29,30,31],
        2035:[30,32,31,32,31,31,29,30,30,29,29,31],
        2036:[31,31,32,31,31,31,30,29,30,29,30,30],
        2037:[31,31,32,32,31,30,30,29,30,29,30,30],
        2038:[31,32,31,32,31,30,30,30,29,29,30,31],
        2039:[31,31,31,32,31,31,29,30,30,29,30,30],
        2040:[31,31,32,31,31,31,30,29,30,29,30,30],
        2041:[31,31,32,32,31,30,30,29,30,29,30,30],
        2042:[31,32,31,32,31,30,30,30,29,29,30,31],
        2043:[31,31,31,32,31,31,29,30,30,29,30,30],
        2044:[31,31,32,31,31,31,30,29,30,29,30,30],
        2045:[31,32,31,32,31,30,30,29,30,29,30,30],
        2046:[31,32,31,32,31,30,30,30,29,29,30,31],
        2047:[31,31,31,32,31,31,30,29,30,29,30,30],
        2048:[31,31,32,31,31,31,30,29,30,29,30,30],
        2049:[31,32,31,32,31,30,30,30,29,29,30,30],
        2050:[31,32,31,32,31,30,30,30,29,30,29,31],
        2051:[31,31,32,31,31,31,30,29,30,29,30,30],
        2052:[31,31,32,31,31,31,30,29,30,29,30,30],
        2053:[31,32,31,32,31,30,30,30,29,29,30,30],
        2054:[31,32,31,32,31,30,30,30,29,30,29,31],
        2055:[31,31,32,31,31,31,30,29,30,29,30,30],
        2056:[31,31,32,31,32,30,30,29,30,29,30,30],
        2057:[31,32,31,32,31,30,30,30,29,29,30,31],
        2058:[30,32,31,32,31,30,30,30,29,30,29,31],
        2059:[31,31,32,31,31,31,30,29,30,29,30,30],
        2060:[31,31,32,32,31,30,30,29,30,29,30,30],
        2061:[31,32,31,32,31,30,30,30,29,29,30,31],
        2062:[30,32,31,32,31,31,29,30,29,30,29,31],
        2063:[31,31,32,31,31,31,30,29,30,29,30,30],
        2064:[31,31,32,32,31,30,30,29,30,29,30,30],
        2065:[31,32,31,32,31,30,30,30,29,29,30,31],
        2066:[31,31,31,32,31,31,29,30,30,29,29,31],
        2067:[31,31,32,31,31,31,30,29,30,29,30,30],
        2068:[31,31,32,32,31,30,30,29,30,29,30,30],
        2069:[31,32,31,32,31,30,30,30,29,29,30,31],
        2070:[31,31,31,32,31,31,29,30,30,29,30,30],
        2071:[31,31,32,31,31,31,30,29,30,29,30,30],
        2072:[31,32,31,32,31,30,30,29,30,29,30,30],
        2073:[31,32,31,32,31,30,30,30,29,29,30,31],
        2074:[31,31,31,32,31,31,30,29,30,29,30,30],
        2075:[31,31,32,31,31,31,30,29,30,29,30,30],
        2076:[31,32,31,32,31,30,30,30,29,29,30,30],
        2077:[31,32,31,32,31,30,30,30,29,30,29,31],
        2078:[31,31,31,32,31,31,30,29,30,29,30,30],
        2079:[31,31,32,31,31,31,30,29,30,29,30,30],
        2080:[31,32,31,32,31,30,30,30,29,29,30,30],
        2081:[31,32,31,32,31,30,30,30,29,30,29,31],
        2082:[31,31,32,31,31,31,30,29,30,29,30,30],
        2083:[31,31,32,31,31,31,30,29,30,29,30,30],
        2084:[31,31,32,31,31,30,30,30,29,30,30,30],
        2085:[31,32,31,32,30,31,30,30,29,30,30,30],
        2086:[30,32,31,32,31,30,30,30,29,30,30,30],
        2087:[31,31,32,31,31,31,30,30,29,30,30,30],
        2088:[30,31,32,32,30,31,30,30,29,30,30,30],
        2089:[30,32,31,32,31,30,30,30,29,30,30,30],
        2090:[30,32,31,32,31,30,30,30,29,30,30,30],
        2091:[31,31,32,31,31,31,30,30,29,30,30,30],
        2092:[30,31,32,32,31,30,30,30,29,30,30,30],
        2093:[30,32,31,32,31,30,30,30,29,30,30,30],
        2094:[31,31,32,31,31,30,30,30,29,30,30,30],
        2095:[31,31,32,31,31,31,30,29,30,30,30,30],
        2096:[30,31,32,32,31,30,30,29,30,29,30,30],
        2097:[31,32,31,32,31,30,30,30,29,30,30,30],
        2098:[31,31,32,31,31,31,29,30,29,30,29,31],
        2099:[31,31,32,31,31,31,30,29,29,30,30,30],
        2100:[31,32,31,32,30,31,30,29,30,29,30,30]
      };
  
    /*** ---------------- Month length overrides ---------------- ***/
    // Only use when official table has known corrections.
    var BS_DAYS_OVERRIDE = {
      2061: { 6: 30 }, // Ashwin 2061 is 30 (not 31) - corrects official source data
      // 2082: { 4: 31 } // Shrawan 2082 is 31 (not 32) - corrects official source data
    };
  
    // Single source of truth
    function GetDaysInMonth(year, month) {
      year = Number(year); month = Number(month);
      if (BS_DAYS_OVERRIDE[year] && BS_DAYS_OVERRIDE[year][month] != null) {
        return Number(BS_DAYS_OVERRIDE[year][month]);
      }
      var row = bsCalendarData[year];
      if (!row || month < 1 || month > 12) {
        throw new Error('GetDaysInMonth: invalid year/month');
      }
      return Number(row[month - 1]);
    }
  
    function isYearValid(y){ return !!bsCalendarData[y]; }
    function toNepNum(str){
      var map=['०','१','२','३','४','५','६','७','८','९'];
      return String(str).replace(/\d/g, function(d){ return map[+d]; });
    }
    function fmt(settings, date){
      if(!date) return '';
      var y = settings.language==='nepali'? toNepNum(date.year) : date.year;
      var mm = String(date.month).padStart(2,'0');
      var dd = String(date.day).padStart(2,'0');
      if (settings.language==='nepali'){ mm = toNepNum(mm); dd = toNepNum(dd); }
      return settings.dateFormat.replace('YYYY',y).replace('MM',mm).replace('DD',dd);
    }
    function same(a,b){ return !!a && !!b && a.year===b.year && a.month===b.month && a.day===b.day; }
    function compareDates(a,b){
      if (!a || !b) return 0;
      var aNum = a.year * 10000 + a.month * 100 + a.day;
      var bNum = b.year * 10000 + b.month * 100 + b.day;
      if (aNum < bNum) return -1;
      if (aNum > bNum) return 1;
      return 0;
    }
    function isBefore(a,b){ return compareDates(a,b) < 0; }
    function isAfter(a,b){ return compareDates(a,b) > 0; }
    function isBetween(date, start, end){
      if (!date || !start || !end) return false;
      return isAfter(date, start) && isBefore(date, end);
    }
    
    // Date validation helper functions
    function isDateDisabled(date, settings) {
      if (!date) return false;
      
      // Check minDate (support both static and dynamic)
      var minDate = settings.minDate;
      if (typeof minDate === 'function') {
        minDate = parseDate(minDate());
      }
      if (minDate) {
        if (date.year < minDate.year) return true;
        if (date.year === minDate.year && date.month < minDate.month) return true;
        if (date.year === minDate.year && date.month === minDate.month && date.day < minDate.day) return true;
      }
      
      // Check maxDate (support both static and dynamic)
      var maxDate = settings.maxDate;
      if (typeof maxDate === 'function') {
        maxDate = parseDate(maxDate());
      }
      if (maxDate) {
        if (date.year > maxDate.year) return true;
        if (date.year === maxDate.year && date.month > maxDate.month) return true;
        if (date.year === maxDate.year && date.month === maxDate.month && date.day > maxDate.day) return true;
      }
      
      // Check disabledDates array
      if (settings.disabledDates && settings.disabledDates.length > 0) {
        for (var i = 0; i < settings.disabledDates.length; i++) {
          if (same(date, settings.disabledDates[i])) return true;
        }
      }
      
      // Check disabledDateRanges array
      if (settings.disabledDateRanges && settings.disabledDateRanges.length > 0) {
        for (var j = 0; j < settings.disabledDateRanges.length; j++) {
          var range = settings.disabledDateRanges[j];
          if (isDateInRange(date, range.start, range.end)) return true;
        }
      }
      
      return false;
    }
    
    function isDateInRange(date, startDate, endDate) {
      if (!date || !startDate || !endDate) return false;
      
      // Convert dates to comparable format (YYYYMMDD)
      var dateNum = date.year * 10000 + date.month * 100 + date.day;
      var startNum = startDate.year * 10000 + startDate.month * 100 + startDate.day;
      var endNum = endDate.year * 10000 + endDate.month * 100 + endDate.day;
      
      return dateNum >= startNum && dateNum <= endNum;
    }
    
    // Helper function to parse date strings or objects
    function parseDate(dateInput, dateType) {
      if (!dateInput) return null;
      
      var parsedDate = null;
      
      if (typeof dateInput === 'string') {
        // Parse string format 'YYYY-MM-DD'
        var match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateInput.trim());
        if (match) {
          parsedDate = {
            year: parseInt(match[1], 10),
            month: parseInt(match[2], 10),
            day: parseInt(match[3], 10)
          };
        }
      } else if (typeof dateInput === 'object' && dateInput.year && dateInput.month && dateInput.day) {
        parsedDate = {
          year: parseInt(dateInput.year, 10),
          month: parseInt(dateInput.month, 10),
          day: parseInt(dateInput.day, 10)
        };
      }
      
      if (!parsedDate) return null;
      
      // If dateType is specified and it's 'ad' (case insensitive), convert AD date to BS
      if (dateType && dateType.toLowerCase() === 'ad') {
        try {
          // Convert AD date to BS date
          var bsDate = window.adtobs(parsedDate);
          return bsDate;
        } catch (error) {
          console.error('Error converting AD date to BS:', error);
          return parsedDate; // Return original if conversion fails
        }
      }
      
      // If dateType is 'bs' or not specified, assume it's already BS
      return parsedDate;
    }
    
    // Helper function to normalize settings dates
    function normalizeSettingsDates(settings) {
      // Parse minDate (only if it's not a function)
      if (settings.minDate && typeof settings.minDate !== 'function') {
        settings.minDate = parseDate(settings.minDate);
      }
      
      // Parse maxDate (only if it's not a function)
      if (settings.maxDate && typeof settings.maxDate !== 'function') {
        settings.maxDate = parseDate(settings.maxDate);
      }
      
      // Parse disabledDates
      if (settings.disabledDates && Array.isArray(settings.disabledDates)) {
        settings.disabledDates = settings.disabledDates.map(function(date) {
          return parseDate(date);
        }).filter(function(date) {
          return date !== null;
        });
      }
      
      // Parse disabledDateRanges
      if (settings.disabledDateRanges && Array.isArray(settings.disabledDateRanges)) {
        settings.disabledDateRanges = settings.disabledDateRanges.map(function(range) {
          if (range && range.start && range.end) {
            return {
              start: parseDate(range.start),
              end: parseDate(range.end)
            };
          }
          return null;
        }).filter(function(range) {
          return range && range.start && range.end;
        });
      }
      
      // Parse defaultDate with optional dateType parameter
      if (settings.defaultDate) {
        if (settings.dateType) {
          // New format: defaultDate: '2024-01-15', dateType: 'AD'
          settings.defaultDate = parseDate(settings.defaultDate, settings.dateType);
        } else if (typeof settings.defaultDate === 'object' && settings.defaultDate.date && settings.defaultDate.type) {
          // Legacy object format: {date: '2024-01-15', type: 'ad'}
          settings.defaultDate = parseDate(settings.defaultDate.date, settings.defaultDate.type);
        } else {
          // Legacy format: just the date
          settings.defaultDate = parseDate(settings.defaultDate);
        }
      }
    }
  
    /*** ---------------- Conversion (Java parity) ---------------- ***/
    // Anchor pair (same as Java)
    var ANCHOR_BS = { year:2000, month:9, day:17 };
    var ANCHOR_AD = new Date(Date.UTC(1944,0,1)); // 1944-01-01 UTC
    var DAY_MS    = 24*60*60*1000;
  
    // BS -> AD (returns {year,month,day})
    function bsToAD(bsYear, bsMonth, bsDay) {
      // validate (throws on error)
      if (bsMonth < 1 || bsMonth > 12) throw new Error('Invalid BS month');
      var dim = GetDaysInMonth(bsYear, bsMonth);
      if (bsDay < 1 || bsDay > dim) throw new Error('Invalid BS day');
  
      var y1 = ANCHOR_BS.year, m1 = ANCHOR_BS.month, d1 = ANCHOR_BS.day;
      var y2 = bsYear,         m2 = bsMonth,        d2 = bsDay;
  
      // compute day offset by walking
      var days = 0, sign = 0;
      if (y1===y2 && m1===m2 && d1===d2){ sign = 0; }
      else if (y1<y2 || (y1===y2 && (m1<m2 || (m1===m2 && d1<d2)))) { sign = 1; }
      else { sign = -1; }
  
      var y=y1, m=m1, d=d1;
      if (sign >= 0) {
        while (!(y===y2 && m===m2 && d===d2)) {
          d++;
          var dm = GetDaysInMonth(y, m);
          if (d > dm) { d=1; m++; if (m>12){ m=1; y++; } }
          days++;
        }
      } else {
        while (!(y===y2 && m===m2 && d===d2)) {
          d--;
          if (d < 1) { m--; if (m<1){ m=12; y--; } d = GetDaysInMonth(y, m); }
          days++;
        }
        days = -days;
      }
  
      var t = ANCHOR_AD.getTime() + days*DAY_MS;
      var ad = new Date(t);
      return { year: ad.getUTCFullYear(), month: ad.getUTCMonth()+1, day: ad.getUTCDate() };
    }
  
    // AD -> BS (returns {year,month,day})
    function adToBS(input) {
      var y, m, d;
      if (input instanceof Date) {
        y = input.getUTCFullYear(); m = input.getUTCMonth()+1; d = input.getUTCDate();
      } else if (typeof input === 'string') {
        var mm = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input.trim());
        if (!mm) throw new Error('AD2BS: invalid string YYYY-MM-DD');
        y=+mm[1]; m=+mm[2]; d=+mm[3];
      } else if (input && typeof input==='object') {
        y=+input.year; m=+input.month; d=+input.day;
      } else { throw new Error('AD2BS: invalid input'); }
  
      var t0 = Date.UTC(1944,0,1);
      var t1 = Date.UTC(y, m-1, d);
      var daysFromAnchor = Math.round((t1 - t0) / DAY_MS);
  
      var by = ANCHOR_BS.year, bm = ANCHOR_BS.month, bd = ANCHOR_BS.day;
      if (daysFromAnchor >= 0) {
        while (daysFromAnchor > 0) {
          var daysInMonth = GetDaysInMonth(by, bm);
          var remainingInMonth = daysInMonth - bd;
          if (daysFromAnchor <= remainingInMonth) {
            bd += daysFromAnchor;
            daysFromAnchor = 0;
          } else {
            daysFromAnchor -= (remainingInMonth + 1);
            bd = 1;
            bm++;
            if (bm > 12) { bm = 1; by++; }
          }
        }
      } else {
        daysFromAnchor = -daysFromAnchor;
        while (daysFromAnchor > 0) {
          if (bd > 1) {
            var step = Math.min(bd - 1, daysFromAnchor);
            bd -= step;
            daysFromAnchor -= step;
          } else {
            bm--;
            if (bm < 1) { bm = 12; by--; }
            bd = GetDaysInMonth(by, bm);
            daysFromAnchor -= 1;
          }
        }
      }
      return { year: by, month: bm, day: bd };
    }
  
    function firstWeekday(bs){
      var ad = bsToAD(bs.year, bs.month, 1);
      return new Date(Date.UTC(ad.year, ad.month-1, ad.day)).getUTCDay(); // 0=Sun
    }
  
    /*** ---------------- Plugin ---------------- ***/
    var ACTIVE=null, ACTIVE_INPUT=null, INSTANCES=0, GLOBAL_BOUND=false;
  
    function bindGlobal(){
      if (GLOBAL_BOUND) return;
      GLOBAL_BOUND = true;
      $(document).on('mousedown.ndp-global', function(e){
        if (!ACTIVE) return;
        if ($(e.target).closest(ACTIVE).length) return;
        if ($(e.target).closest(ACTIVE_INPUT).length) return;
        var closeFn = $(ACTIVE).data('__ndp_close__');
        if (closeFn) closeFn();
      });
      $(window).on('resize.ndp-global scroll.ndp-global', function(){
        if (!ACTIVE) return;
        var pos = $(ACTIVE).data('__ndp_position__');
        if (pos) pos();
      });
    }
    function unbindGlobalIfIdle(){
      if (INSTANCES>0) return;
      $(document).off('.ndp-global'); $(window).off('.ndp-global'); GLOBAL_BOUND=false;
    }
  
    $.fn.nepaliDatepicker = function(options){
      bindGlobal();
      return this.each(function(){
        var $input = $(this);
        var settings = $.extend({}, defaults, options||{});
        
        // Normalize date settings (parse strings to objects)
        normalizeSettingsDates(settings);
        
        $input.attr('readonly', true).attr('placeholder', settings.placeholder);
  
        var todayAd = new Date();
        var today = adToBS(new Date(Date.UTC(
          todayAd.getFullYear(), todayAd.getMonth(), todayAd.getDate()
        )));
  
        // Use defaultDate if provided, otherwise use today
        var initialDate = settings.defaultDate || today;
        
        var state = {
          isOpen:false,
          selected: settings.range ? null : {year:initialDate.year, month:initialDate.month, day:initialDate.day},
          current: {year:initialDate.year, month:initialDate.month, day:initialDate.day},
          range: settings.range ? { start: null, end: null, phase: 'start' } : null,
          view:'month',
          $dp:null, $overlay:null, bound:false
        };
        INSTANCES++;
        if (!settings.range) {
          $input.val(fmt(settings, state.selected));
        } else {
          $input.val('');
        }

        function updateRangeInputValue(){
          if (!settings.range || !state.range) return;
          if (state.range.start && state.range.end) {
            $input.val(fmt(settings, state.range.start) + settings.rangeSeparator + fmt(settings, state.range.end));
          } else if (state.range.start) {
            $input.val(fmt(settings, state.range.start));
          } else {
            $input.val('');
          }
        }

        function buildRangePayload(){
          if (!settings.range || !state.range) return null;
          var payload = [];
          if (state.range.start) {
            payload.push({
              value: fmt(settings, state.range.start),
              year: state.range.start.year,
              month: state.range.start.month,
              day: state.range.start.day
            });
          }
          if (state.range.end) {
            payload.push({
              value: fmt(settings, state.range.end),
              year: state.range.end.year,
              month: state.range.end.month,
              day: state.range.end.day
            });
          }
          return payload;
        }

        function handleRangeSelection(date){
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
  
        function englishHeaderFor(yy, mm){
          var ad = bsToAD(yy, mm, 1);
          var nm = ad.month===12?1:ad.month+1;
          var ny = ad.month===12?ad.year+1:ad.year;
          return englishMonthNamesShort[ad.month-1]+' '+ad.year+' / '+englishMonthNamesShort[nm-1]+' '+ny;
        }
  
        function build(){
          if (state.$dp) return;
          var $dp = $('<div class="nepali-datepicker '+settings.theme+'" role="dialog" aria-label="Date Picker"></div>').hide();
          state.$dp = $dp;
          if (settings.modal){
            var $ov = $('<div class="nepali-datepicker-modal-overlay" role="dialog" aria-modal="true"></div>').hide();
            var $ct = $('<div class="nepali-datepicker-modal-content"></div>');
            $ct.append($dp); $ov.append($ct);
            $('body').append($ov); state.$overlay=$ov;
            $ov.on('click.ndp', function(e){ if (e.target===$ov[0]) close(); });
            $ct.on('click.ndp', function(e){ e.stopPropagation(); });
          } else {
            $('body').append($dp);
          }
          bindOnce();
        }
  
        // --- replace your existing open() with this ---
function open(){
  if (state.isOpen) return;

  // If another input's datepicker is open, fully close (destroy) it first
  if (ACTIVE && ACTIVE !== state.$dp?.[0]) {
    var closeFn = $(ACTIVE).data('__ndp_close__');
    if (typeof closeFn === 'function') closeFn();
    ACTIVE = null;
    ACTIVE_INPUT = null;
  }

  // Build fresh UI for this input and show it
  build();
  render();

  state.isOpen = true;
  ACTIVE = state.$dp[0];
  ACTIVE_INPUT = $input[0];

  if (settings.modal && state.$overlay){
    state.$overlay.css('display', 'flex');

    // If this input lives inside a Bootstrap/other modal, ensure proper stacking
    var parentModal = $input.closest('.modal');
    if (parentModal.length) state.$overlay.css('z-index', '10001');
  } else {
    position();
    state.$dp.show();
  }

  if (settings.onOpen) settings.onOpen.call($input[0]);
}

// --- replace your existing close() with this ---
// Close now DESTROYS the UI so next click recreates a fresh instance
function close(){
  // If nothing is open/rendered, do nothing
  if (!state.isOpen && !state.$dp && !state.$overlay) return;

  state.isOpen = false;

  // Clear global ACTIVE pointers when this was the active UI
  if (ACTIVE === state.$dp?.[0]) {
    ACTIVE = null;
    ACTIVE_INPUT = null;
  }

  // Remove datepicker DOM and unbind its internal handlers
  if (state.$dp){
    state.$dp.off('.ndp').remove();
    state.$dp = null;
  }
  if (settings.modal && state.$overlay){
    state.$overlay.off('.ndp').remove();
    state.$overlay = null;
  }

  // Let the host page know we closed
  if (settings.onClose) settings.onClose.call($input[0]);
}

        function position(){
          if (!state.isOpen || settings.modal || !state.$dp) return;
          var $dp=state.$dp, off=$input.offset(), ih=$input.outerHeight();
          var dh=$dp.outerHeight()||280, dw=$dp.outerWidth()||320;
          var $w=$(window), vh=$w.height(), vw=$w.width(), st=$w.scrollTop(), sl=$w.scrollLeft();
          var below=vh-(off.top-st)-ih, above=(off.top-st);
          var top, left;
          if (below>=dh+10) top=off.top+ih+5;
          else if (above>=dh+10) top=off.top-dh-5;
          else top=Math.min(off.top+ih+5, st+vh-dh-10);
          left=off.left; if (left+dw>sl+vw) left=sl+vw-dw-10; if (left<sl+10) left=sl+10;
          $dp.css({position:'absolute', top:top, left:left, zIndex:9999});
        }
  
        function render(){
          state.$dp.data('__ndp_close__', close);
          state.$dp.data('__ndp_position__', position);
          
          var cur=state.current, html='';
          if (state.view==='month'){
            var canPrevY=isYearValid(cur.year-1), canNextY=isYearValid(cur.year+1);
            html+='<div class="datepicker-header">';
            html+='<div class="nav-btn prev-year'+(canPrevY&&!settings.readonly?'':' disabled')+'" data-action="prev-year" role="button" tabindex="0">&#171;</div>';
            html+='<div class="nav-btn prev-month'+(!settings.readonly?'':' disabled')+'" data-action="prev-month" role="button" tabindex="0">&#8249;</div>';
            html+='<div class="month-year clickable-month-year" data-action="show-month-list" role="button" tabindex="0"><div class="nepali-date-display">';
            html+='<span class="month">'+monthNames[settings.language][cur.month-1]+'</span> ';
            html+='<span class="year">'+(settings.language==='english'?cur.year:toNepNum(cur.year))+'</span></div>';
            html+='<div class="english-date-header">'+englishHeaderFor(cur.year,cur.month)+'</div></div>';
            html+='<div class="nav-btn next-month'+(!settings.readonly?'':' disabled')+'" data-action="next-month" role="button" tabindex="0">&#8250;</div>';
            html+='<div class="nav-btn next-year'+(canNextY&&!settings.readonly?'':' disabled')+'" data-action="next-year" role="button" tabindex="0">&#187;</div>';
            html+='</div>';
  
            html+='<div class="datepicker-body"><div class="weekdays">';
            for(var i=0;i<7;i++) html+='<div class="weekday">'+dayNamesShort[settings.language][i]+'</div>';
            html+='</div><div class="days">';
  
            var first=firstWeekday(cur);
            var daysIn=GetDaysInMonth(cur.year, cur.month);
            var today=adToBS(new Date(Date.UTC(
              new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
            )));
  
            // prev month tail
            var pm=cur.month===1?12:cur.month-1, py=cur.month===1?cur.year-1:cur.year;
            var pmDim=GetDaysInMonth(py, pm);
            for (var p=first-1;p>=0;p--){
              var pd=pmDim-p, eP=bsToAD(py,pm,pd);
              html+='<div class="day other-month"><div class="nepali-date">'+(settings.language==='english'?pd:toNepNum(pd))+'</div>';
              if (settings.showEnglishDateSubscript) {
                html+='<div class="english-date-subscript">'+eP.day+'</div>';
              }
              html+='</div>';
            }
  
            // current month
            for (var d=1; d<=daysIn; d++){
              var bsDate={year:cur.year,month:cur.month,day:d};
              var isT=same(bsDate,today), isS=state.selected && same(bsDate,state.selected);
              var isDisabled = isDateDisabled(bsDate, settings);
              var isRangeStart = settings.range && state.range && state.range.start && same(bsDate, state.range.start);
              var isRangeEnd = settings.range && state.range && state.range.end && same(bsDate, state.range.end);
              var isRangeBetween = settings.range && state.range && state.range.start && state.range.end && isBetween(bsDate, state.range.start, state.range.end);
              var isRangeBlocked = settings.range && state.range && state.range.start && !state.range.end && isBefore(bsDate, state.range.start);
              var cls='day'+(isT?' today':'')+(isS?' selected':'')+(isRangeStart?' range-start':'')+(isRangeEnd?' range-end':'')+(isRangeBetween?' range-between':'')+((isDisabled||isRangeBlocked)?' disabled':'');
              var eD=bsToAD(cur.year,cur.month,d);
              var dataAction = (isDisabled||isRangeBlocked) ? '' : 'data-action="select-day"';
              var role = (isDisabled||isRangeBlocked) ? 'role="button" aria-disabled="true"' : 'role="button" tabindex="0"';
              html+='<div class="'+cls+'" '+dataAction+' data-day="'+d+'" '+role+'>';
              html+='<div class="nepali-date">'+(settings.language==='english'?d:toNepNum(d))+'</div>';
              if (settings.showEnglishDateSubscript) {
                html+='<div class="english-date-subscript">'+eD.day+'</div>';
              }
              html+='</div>';
            }
  
            // next month head (fill to 35)
            var filled=first+daysIn, need=35-filled, nm=cur.month===12?1:cur.month+1, ny=cur.month===12?cur.year+1:cur.year;
            for (var n=1;n<=need;n++){
              var eN=bsToAD(ny, nm, n);
              html+='<div class="day other-month"><div class="nepali-date">'+(settings.language==='english'?n:toNepNum(n))+'</div>';
              if (settings.showEnglishDateSubscript) {
                html+='<div class="english-date-subscript">'+eN.day+'</div>';
              }
              html+='</div>';
            }
  
            html+='</div>';
            if (settings.showToday){
              html+='<div class="datepicker-footer"><div class="btn-today" data-action="today" role="button" tabindex="0">Today</div></div>';
            }
            html+='</div>';
          } else if (state.view==='year'){
            var years = Object.keys(bsCalendarData).map(Number);
            var minY=Math.min.apply(Math,years), maxY=Math.max.apply(Math,years);
            
            // Calculate the start year for the current 12-year range
            // Ensure we start from the minimum year (1970) and show proper ranges
            var base=Math.floor(cur.year/12)*12;
            var start=Math.max(minY, base);
            
            // Ensure we don't go below the minimum year
            if (start < minY) {
              start = minY;
            }
            
            // Calculate the end year for this range (max 12 years)
            var endYear = Math.min(start + 11, maxY);
            var actualYears = endYear - start + 1;
            
            html+='<div class="datepicker-header">';
            // Disable prev-decade if we're at or near the minimum year
            var canGoPrev = (start > minY) && !settings.readonly;
            html+='<div class="nav-btn prev-decade'+(canGoPrev?'':' disabled')+'" data-action="prev-decade" role="button" tabindex="0">&#171;</div>';
            html+='<div class="year-range"><span>'+(settings.language==='english'?start:toNepNum(start))+' - '+(settings.language==='english'?endYear:toNepNum(endYear))+'</span></div>';
            // Disable next-decade if we're at or near the maximum year
            var canGoNext = (start+12<=maxY) && !settings.readonly;
            html+='<div class="nav-btn next-decade'+(canGoNext?'':' disabled')+'" data-action="next-decade" role="button" tabindex="0">&#187;</div>';
            html+='</div><div class="datepicker-body year-view">';
            
            // Show years in a grid, but handle cases where we have fewer than 12 years
            for (var y=start;y<=endYear;y++){
              var c='year-item'; if (y===cur.year) c+=' current'; if (state.selected && y===state.selected.year) c+=' selected';
              if (!isYearValid(y)||settings.readonly) c+=' disabled';
              html+='<div class="'+c+'" data-action="select-year" data-year="'+y+'" role="button" tabindex="0">'+(settings.language==='english'?y:toNepNum(y))+'</div>';
            }
            html+='</div>';
          } else if (state.view==='monthList'){
            var canPY=isYearValid(cur.year-1), canNY=isYearValid(cur.year+1);
            html+='<div class="datepicker-header">';
            html+='<div class="nav-btn prev-year'+(canPY?'':' disabled')+'" data-action="prev-year" role="button" tabindex="0">&#8249;</div>';
            html+='<div class="year-display"><div class="clickable-year" data-action="show-year-range" role="button" tabindex="0">'+(settings.language==='english'?cur.year:toNepNum(cur.year))+'</div></div>';
            html+='<div class="nav-btn next-year'+(canNY?'':' disabled')+'" data-action="next-year" role="button" tabindex="0">&#8250;</div>';
            html+='</div><div class="datepicker-body month-list-view">';
            for (var m=1;m<=12;m++){
              var cls2='month-item'+(m===cur.month?' current':'')+(state.selected&&m===state.selected.month?' selected':'');
              html+='<div class="'+cls2+'" data-action="select-month" data-month="'+m+'" role="button" tabindex="0">'+monthNames[settings.language][m-1]+'</div>';
            }
            html+='</div>';
          }
          state.$dp[0].innerHTML = html;
          state.$dp.data('__ndp_close__', close);
          state.$dp.data('__ndp_position__', position);
          
          // Bind event handlers after HTML is rendered
          bindEventHandlers();
        }
  
        function bindEventHandlers(){
          if (!state.$dp) return;
          
          // Remove any existing event handlers to avoid duplicates
          state.$dp.off('click.ndp keydown.ndp mousedown.ndp');

          state.$dp.on('click.ndp','[data-action]',function(e){
            e.preventDefault(); e.stopPropagation();
            var $t=$(this), action=$t.data('action');
            if ($t.hasClass('disabled')||$t.attr('aria-disabled')==='true') return;
            var cur=state.current;

            switch(action){
              case 'prev-year': if (isYearValid(cur.year-1)){ cur.year--; cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); render(); } break;
              case 'next-year': if (isYearValid(cur.year+1)){ cur.year++; cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); render(); } break;
              case 'prev-month':
                cur.month--; if (cur.month<1){ cur.month=12; cur.year--; }
                if (!isYearValid(cur.year)){ cur.year=Math.min.apply(Math,Object.keys(bsCalendarData).map(Number)); cur.month=1; }
                cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); render(); break;
              case 'next-month':
                cur.month++; if (cur.month>12){ cur.month=1; cur.year++; }
                if (!isYearValid(cur.year)){ cur.year=Math.max.apply(Math,Object.keys(bsCalendarData).map(Number)); cur.month=12; }
                cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); render(); break;
              case 'prev-decade':
                var minYear = Math.min.apply(Math,Object.keys(bsCalendarData).map(Number));
                if (isYearValid(cur.year-12)) {
                  cur.year-=12;
                } else {
                  cur.year = minYear; // Go to the minimum year (1970)
                }
                cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); render(); break;
              case 'next-decade':
                var maxYear = Math.max.apply(Math,Object.keys(bsCalendarData).map(Number));
                if (isYearValid(cur.year+12)) {
                  cur.year+=12;
                } else {
                  cur.year = maxYear; // Go to the maximum year
                }
                cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); render(); break;
              case 'select-year':
                var y=parseInt($t.data('year'),10);
                if (isYearValid(y)){ cur.year=y; cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); state.view='monthList'; render(); }
                break;
              case 'show-year-range': state.view='year'; render(); break;
              case 'show-month-list': state.view='monthList'; render(); break;
              case 'prev-year': 
                if (isYearValid(cur.year-1)) {
                  cur.year--; 
                  cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); 
                  render(); 
                }
                break;
              case 'next-year': 
                if (isYearValid(cur.year+1)) {
                  cur.year++; 
                  cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month)); 
                  render(); 
                }
                break;
              case 'select-month':
                cur.month=parseInt($t.data('month'),10);
                cur.day=Math.min(cur.day||1, GetDaysInMonth(cur.year,cur.month));
                state.view='month'; render(); break;
              case 'select-day':
                var d=parseInt($t.data('day'),10);
                var selectedDate = {year:cur.year,month:cur.month,day:d};
                
                // Check if the selected date is disabled
                if (isDateDisabled(selectedDate, settings)) {
                  return; // Don't select disabled dates
                }

                if (settings.range) {
                  handleRangeSelection(selectedDate);
                  render();
                  if (settings.onSelect) settings.onSelect.call($input[0], buildRangePayload());
                  if (settings.autoClose && state.range && state.range.start && state.range.end) close();
                  break;
                }
                
                state.selected = selectedDate;
                $input.val(fmt(settings, state.selected));
                if (settings.autoClose) close();
                if (settings.onSelect) settings.onSelect.call($input[0], state.selected, fmt(settings, state.selected));
                break;
              case 'today':
                var t = adToBS(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())));
                
                // Check if today's date is disabled
                if (isDateDisabled(t, settings)) {
                  return; // Don't select today if it's disabled
                }

                if (settings.range) {
                  handleRangeSelection({year:t.year,month:t.month,day:t.day});
                  render();
                  if (settings.onSelect) settings.onSelect.call($input[0], buildRangePayload());
                  if (settings.autoClose && state.range && state.range.start && state.range.end) close();
                  break;
                }
                
                state.current={year:t.year,month:t.month,day:t.day};
                state.selected={year:t.year,month:t.month,day:t.day};
                $input.val(fmt(settings, state.selected));
                if (settings.autoClose) close();
                if (settings.onSelect) settings.onSelect.call($input[0], state.selected, fmt(settings, state.selected));
                break;
            }
          });

          state.$dp.on('keydown.ndp','[data-action][role="button"]',function(e){
            if (e.key==='Enter'||e.key===' ') { e.preventDefault(); $(this).trigger('click'); }
          });
          state.$dp.on('mousedown.ndp', function(e){ e.stopPropagation(); });
        }

        function bindOnce(){
          if (state.bound || !state.$dp) return;
          state.bound=true;
          // Event handlers are now bound in bindEventHandlers() which is called from render()
        }
  
        // input triggers
        $input.off('click.ndp focus.ndp mousedown.ndp')
          .on('click.ndp focus.ndp', function(e){ e.preventDefault(); e.stopPropagation(); open(); })
          .on('mousedown.ndp', function(e){ e.stopPropagation(); });
  
        // public API
        $input.data('nepaliDatepicker', {
          show: open,
          hide: close,
          isOpen: function(){ return state.isOpen; },
          getDate: function(){ return state.selected; },
          getRange: function(){
            if (!settings.range || !state.range) return { start: null, end: null };
            return { start: state.range.start, end: state.range.end };
          },
          setDate: function(date){
            var bs;
            if (date && typeof date==='object' && 'year' in date) {
              bs = {year:+date.year, month:+date.month, day:+(date.day||1)};
            } else if (date instanceof Date) {
              bs = adToBS(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
            } else if (typeof date==='string') {
              var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date.trim());
              if (!m) throw new Error('setDate: invalid AD string');
              bs = adToBS(new Date(Date.UTC(+m[1], +m[2]-1, +m[3])));
            } else {
              var t = adToBS(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())));
              bs = t;
            }
            var dmax=GetDaysInMonth(bs.year, bs.month);
            if (bs.day<1) bs.day=1; if (bs.day>dmax) bs.day=dmax;
            if (settings.range && state.range) {
              state.range.start = {year:bs.year,month:bs.month,day:bs.day};
              state.range.end = null;
              state.range.phase = 'end';
              state.selected = {year:bs.year,month:bs.month,day:bs.day};
              state.current  = {year:bs.year,month:bs.month,day:bs.day};
              updateRangeInputValue();
            } else {
              state.selected={year:bs.year,month:bs.month,day:bs.day};
              state.current ={year:bs.year,month:bs.month,day:bs.day};
              $input.val(fmt(settings, state.selected));
            }
            if (state.$dp) render();
          },
          setRange: function(startDate, endDate){
            if (!settings.range || !state.range) return;
            var start = parseDate(startDate);
            var end = parseDate(endDate);
            state.range.start = start;
            state.range.end = end;
            state.range.phase = 'start';
            state.selected = end || start || null;
            if (state.selected) {
              state.current = { year: state.selected.year, month: state.selected.month, day: state.selected.day };
            }
            updateRangeInputValue();
            if (state.$dp) render();
          },
          clearRange: function(){
            if (!settings.range || !state.range) return;
            state.range.start = null;
            state.range.end = null;
            state.range.phase = 'start';
            state.selected = null;
            $input.val('');
            if (state.$dp) render();
          },
          clear: function(){
            if (settings.range && state.range) {
              state.range.start = null;
              state.range.end = null;
              state.range.phase = 'start';
            }
            state.selected=null;
            $input.val('');
            if (state.$dp) render();
          },
          destroy: function(){
            close();
            if (state.$dp){ state.$dp.off('.ndp').remove(); state.$dp=null; }
            if (state.$overlay){ state.$overlay.off('.ndp').remove(); state.$overlay=null; }
            $input.off('.ndp').removeData('nepaliDatepicker').removeAttr('readonly');
            INSTANCES--; if (INSTANCES<=0) unbindGlobalIfIdle();
          }
        });
      });
    };
  
    // expose converters if needed
    window.bs2ad = function(input, format){
      var bs = (typeof input==='string')
        ? (function(s){ var m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim()); return {year:+m[1],month:+m[2],day:+m[3]}; })(input)
        : input;
      var ad = bsToAD(bs.year, bs.month, bs.day);
      if (format==='string' || format===true){
        var pad=function(n){return (n<10?'0':'')+n;};
        return ad.year+'-'+pad(ad.month)+'-'+pad(ad.day);
      }
      return ad;
    };
    window.adtobs = function(input, format){
      var bs = adToBS(input);
      if (format==='string' || format===true){
        var pad=function(n){return (n<10?'0':'')+n;};
        return bs.year+'-'+pad(bs.month)+'-'+pad(bs.day);
      }
      return bs;
    };
    
    // Create nepaliFunction namespace and expose converters
    window.nepaliFunction = {
      bs2ad: function(input, format){
        var bs = (typeof input==='string')
          ? (function(s){ var m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim()); return {year:+m[1],month:+m[2],day:+m[3]}; })(input)
          : input;
        var ad = bsToAD(bs.year, bs.month, bs.day);
        if (format==='string' || format===true){
          var pad=function(n){return (n<10?'0':'')+n;};
          return ad.year+'-'+pad(ad.month)+'-'+pad(ad.day);
        }
        return ad;
      },
      ad2bs: function(input, format){
        var bs = adToBS(input);
        if (format==='string' || format===true){
          var pad=function(n){return (n<10?'0':'')+n;};
          return bs.year+'-'+pad(bs.month)+'-'+pad(bs.day);
        }
        return bs;
      }
    };
  
  })(jQuery);
  