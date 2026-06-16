/*
 * Box Drop Storage Simulator - i18n resources & helpers.
 *
 * All UI strings live here as plain objects (never hardcoded in markup).
 * Classic script (no fetch / no ES modules) so the app runs from file://
 * by simply double-clicking index.html.
 */
(function (root) {
  'use strict';

  var RESOURCES = {
    ja: {
      app_title: '箱ドロップ保管シミュレーター',
      language: '言語',
      theme: 'テーマ',
      theme_light: 'ライト',
      theme_dark: 'ダーク',

      basic_params: '基本パラメーター',
      stage_interval: 'ステージクリア間隔',
      white_box: '白箱',
      blue_box: '青箱',
      cooldown: 'クールタイム',
      open_time: '開封時間',
      storage_limit: '保管上限',
      inventory_limit: 'インベントリ上限',

      calculate: '計算する',
      reset_defaults: 'デフォルトに戻す',

      result_title: 'シミュレーション結果',
      inventory_filled: 'インベントリ満杯まで',
      storage_time: '箱保管の追加時間',
      total_time: '合計時間',
      opening_total: '開封による満杯遅延',
      stored_count: '保管数',
      reached_limit_first: '先に上限到達',
      seconds: '秒',
      unit_items: '個',
      hours: '時間',
      minutes: '分',

      settings_rules: 'ルール設定',
      cd_reset_mode: 'クールダウンリセット方式',
      cd_on_drop: 'ドロップ時リセット',
      cd_fixed: '固定間隔',
      simultaneous_priority: '同時ドロップ時の優先',
      white_first: '白優先',
      blue_first: '青優先',
      max_drops_per_clear: '1クリアあたりの最大ドロップ数',
      one_per_clear: '1個',
      two_per_clear: '2個（同時ドロップ可）',
      first_drop_rule: '初回ドロップの扱い',
      full_cd_required: 'フルクールダウン必要',
      instant_first: '即ドロップ可',
      non_selected_behavior: '非選択側の扱い',
      keep_waiting: '待機のまま',
      reset_non_selected: 'クールダウンリセット',
      end_condition: '保管終了条件',
      either_limit: 'いずれか片方が上限到達',
      both_limit: '両方が上限到達',

      // Tooltips
      tip_cd_reset_mode:
        '「ドロップ時リセット」＝ドロップした時刻からクールダウンを再計測。「固定間隔」＝ドロップの有無に関係なく一定周期でクールダウンが回る。',
      tip_simultaneous_priority:
        '白箱・青箱の両方がクールダウン完了している場合にどちらを先にドロップするか。',
      tip_max_drops_per_clear:
        '2個の場合、白・青が両方条件を満たしていれば1回のクリアで両方ドロップする。',
      tip_first_drop_rule:
        '「即ドロップ可」の場合、ゲーム開始後の最初のステージクリアで即座にドロップ可能。',
      tip_non_selected_behavior:
        '両方成立→1個だけドロップの場合、ドロップしなかった方のクールダウンをどうするか。「待機のまま」＝次のクリアですぐドロップ。「リセット」＝ドロップしていないのにクールダウンがリセットされる。',
      tip_end_condition: 'シミュレーションの終了判定。',
      tip_stage_interval: 'ステージ1回あたりの所要時間。',
      tip_white_cooldown: '白箱がドロップ可能になるまでの間隔。',
      tip_blue_cooldown: '青箱がドロップ可能になるまでの間隔。',
      tip_inventory_limit: 'インベントリの最大容量。',
      tip_white_storage: '白箱の最大保管数。',
      tip_blue_storage: '青箱の最大保管数。',
      tip_white_open:
        '白箱を1つ開封（中身を取り出して空にする）のにかかる時間。インベントリに入る箱のみ対象で、保管された箱は開封されないため加算されません。0なら従来通り。',
      tip_blue_open:
        '青箱を1つ開封（中身を取り出して空にする）のにかかる時間。インベントリに入る箱のみ対象で、保管された箱は開封されないため加算されません。0なら従来通り。',

      // Charts & misc
      chart_storage_title: '保管数の推移',
      chart_axis_time: '時間',
      chart_axis_count: '保管数',
      timeline_title: '進捗フェーズ',
      phase_fill: 'インベントリ充填',
      phase_store: '箱保管',
      legend_white: '白箱保管',
      legend_blue: '青箱保管',
      result_placeholder: '「計算する」を押すと結果が表示されます。',
      both_reached: '両方の到達時刻',
      total_stages: 'クリア回数',
      unit_stages: '回',
      error_invalid: '入力値が正しくありません。0以上の数値を入力してください。',
      error_no_finish:
        '上限到達前に計算が打ち切られました。パラメーターを見直してください（クールダウンが長すぎる等）。',
      not_reached: '未到達'
    },
    en: {
      app_title: 'Box Drop Storage Simulator',
      language: 'Language',
      theme: 'Theme',
      theme_light: 'Light',
      theme_dark: 'Dark',

      basic_params: 'Basic parameters',
      stage_interval: 'Stage clear interval',
      white_box: 'White box',
      blue_box: 'Blue box',
      cooldown: 'Cooldown',
      open_time: 'Open time',
      storage_limit: 'Storage limit',
      inventory_limit: 'Inventory limit',

      calculate: 'Calculate',
      reset_defaults: 'Reset to defaults',

      result_title: 'Simulation results',
      inventory_filled: 'Inventory filled at',
      storage_time: 'Additional storage time',
      total_time: 'Total time',
      opening_total: 'Opening fill delay',
      stored_count: 'Stored count',
      reached_limit_first: 'Reached limit first',
      seconds: 'sec',
      unit_items: 'items',
      hours: 'hr',
      minutes: 'min',

      settings_rules: 'Rule settings',
      cd_reset_mode: 'Cooldown reset mode',
      cd_on_drop: 'Reset on drop',
      cd_fixed: 'Fixed interval',
      simultaneous_priority: 'Simultaneous drop priority',
      white_first: 'White first',
      blue_first: 'Blue first',
      max_drops_per_clear: 'Max drops per clear',
      one_per_clear: '1',
      two_per_clear: '2 (simultaneous)',
      first_drop_rule: 'First drop rule',
      full_cd_required: 'Full cooldown required',
      instant_first: 'Instant drop',
      non_selected_behavior: 'Non-selected box behavior',
      keep_waiting: 'Keep waiting',
      reset_non_selected: 'Reset cooldown',
      end_condition: 'End condition',
      either_limit: 'Either reaches limit',
      both_limit: 'Both reach limit',

      // Tooltips
      tip_cd_reset_mode:
        '"Reset on drop" = cooldown is re-measured from the moment of the drop. "Fixed interval" = cooldown ticks on a fixed cycle regardless of drops.',
      tip_simultaneous_priority:
        'When both white and blue boxes have finished cooldown, which one drops first.',
      tip_max_drops_per_clear:
        'With 2, if both white and blue meet the condition, both drop in a single clear.',
      tip_first_drop_rule:
        'With "Instant drop", a drop is possible on the very first stage clear after the game starts.',
      tip_non_selected_behavior:
        'When both are ready but only one drops, what happens to the cooldown of the one that did not drop. "Keep waiting" = it can drop on the next clear. "Reset" = its cooldown resets even though it did not drop.',
      tip_end_condition: 'Simulation end determination.',
      tip_stage_interval: 'Time required for one stage clear.',
      tip_white_cooldown: 'Interval before a white box can drop.',
      tip_blue_cooldown: 'Interval before a blue box can drop.',
      tip_inventory_limit: 'Maximum inventory capacity.',
      tip_white_storage: 'Maximum number of stored white boxes.',
      tip_blue_storage: 'Maximum number of stored blue boxes.',
      tip_white_open:
        'Time to open one white box (empty its contents). Applies only to boxes that enter inventory; stored boxes stay unopened and add nothing. 0 = original behavior.',
      tip_blue_open:
        'Time to open one blue box (empty its contents). Applies only to boxes that enter inventory; stored boxes stay unopened and add nothing. 0 = original behavior.',

      // Charts & misc
      chart_storage_title: 'Stored count over time',
      chart_axis_time: 'Time',
      chart_axis_count: 'Stored',
      timeline_title: 'Progress phases',
      phase_fill: 'Inventory fill',
      phase_store: 'Box storage',
      legend_white: 'White stored',
      legend_blue: 'Blue stored',
      result_placeholder: 'Press "Calculate" to see results.',
      both_reached: 'Both reach times',
      total_stages: 'Clears',
      unit_stages: 'x',
      error_invalid: 'Invalid input. Please enter numbers >= 0.',
      error_no_finish:
        'Calculation was aborted before reaching the limit. Review the parameters (e.g. cooldown too long).',
      not_reached: 'Not reached'
    }
  };

  var current = 'ja';

  function detectDefault() {
    try {
      var saved = root.localStorage && root.localStorage.getItem('bds.lang');
      if (saved === 'ja' || saved === 'en') return saved;
    } catch (e) {}
    var loc = (root.navigator && (root.navigator.language || root.navigator.userLanguage)) || 'en';
    return /^ja/i.test(loc) ? 'ja' : 'en';
  }

  function setLang(lang) {
    if (!RESOURCES[lang]) return;
    current = lang;
    try {
      root.localStorage && root.localStorage.setItem('bds.lang', lang);
    } catch (e) {}
  }

  function getLang() {
    return current;
  }

  function t(key) {
    var table = RESOURCES[current] || RESOURCES.en;
    return table[key] != null ? table[key] : key;
  }

  root.BDS = root.BDS || {};
  root.BDS.i18n = {
    RESOURCES: RESOURCES,
    detectDefault: detectDefault,
    setLang: setLang,
    getLang: getLang,
    t: t
  };
})(typeof self !== 'undefined' ? self : this);
