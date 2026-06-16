/*
 * Box Drop Storage Simulator - time & number formatting helpers.
 */
(function (root) {
  'use strict';

  function t(key) {
    return root.BDS && root.BDS.i18n ? root.BDS.i18n.t(key) : key;
  }

  // Format an integer with thousands separators (locale-independent).
  function withCommas(n) {
    if (n == null || !isFinite(n)) return '-';
    var sign = n < 0 ? '-' : '';
    var s = Math.abs(Math.round(n)).toString();
    return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Format a duration (seconds) as "X時間Y分Z秒" / "Xhr Ymin Zsec".
   * Omits leading zero units but always shows seconds.
   */
  function duration(totalSeconds) {
    if (totalSeconds == null || !isFinite(totalSeconds)) return '-';
    var s = Math.max(0, Math.round(totalSeconds));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;

    var parts = [];
    if (h > 0) parts.push(h + t('hours'));
    if (h > 0 || m > 0) parts.push(m + t('minutes'));
    parts.push(sec + t('seconds'));

    var lang = root.BDS && root.BDS.i18n ? root.BDS.i18n.getLang() : 'ja';
    // English units read better with a space between value+unit groups.
    return parts.join(lang === 'ja' ? '' : ' ');
  }

  // Combined "duration (12,345 sec)" string.
  function durationWithSeconds(totalSeconds) {
    if (totalSeconds == null || !isFinite(totalSeconds)) return t('not_reached');
    return duration(totalSeconds) + ' (' + withCommas(totalSeconds) + ' ' + t('seconds') + ')';
  }

  root.BDS = root.BDS || {};
  root.BDS.format = {
    withCommas: withCommas,
    duration: duration,
    durationWithSeconds: durationWithSeconds
  };
})(typeof self !== 'undefined' ? self : this);
