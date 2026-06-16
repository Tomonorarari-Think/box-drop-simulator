/*
 * Box Drop Storage Simulator - core simulation engine.
 *
 * Faithful implementation of the documented simulation pseudocode.
 * Pure & immutable: simulate() takes a params object and returns a fresh
 * result object; it never mutates its input.
 *
 * Works both in the browser (attaches to window.BDS.simulation) and in Node
 * (module.exports) so the logic can be unit-tested headlessly.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.BDS = root.BDS || {};
  root.BDS.simulation = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Hard cap so a misconfigured (never-ending) scenario cannot hang the UI.
  var MAX_STAGES = 5000000;

  var DEFAULTS = Object.freeze({
    stageInterval: 205, // X: seconds per stage clear
    whiteCooldown: 300, // seconds
    blueCooldown: 600, // seconds
    inventoryLimit: 104, // items
    whiteStorageLimit: 15, // items
    blueStorageLimit: 10, // items
    whiteOpenTime: 0, // seconds to open one white box (auto-open into inventory)
    blueOpenTime: 0, // seconds to open one blue box
    cooldownResetMode: 'onDrop', // 'onDrop' | 'fixed'
    simultaneousPriority: 'white', // 'white' | 'blue'
    maxDropsPerClear: 1, // 1 | 2
    firstDropRule: 'fullCd', // 'fullCd' | 'instant'
    nonSelectedBehavior: 'wait', // 'wait' | 'reset'
    endCondition: 'either' // 'either' | 'both'
  });

  /**
   * Run the simulation.
   * @param {object} params - parameters (see DEFAULTS for shape).
   * @returns {object} result.
   */
  function simulate(params) {
    var p = Object.assign({}, DEFAULTS, params || {});

    var X = num(p.stageInterval);
    var whiteCd = num(p.whiteCooldown);
    var blueCd = num(p.blueCooldown);
    var whiteMax = num(p.whiteStorageLimit);
    var blueMax = num(p.blueStorageLimit);
    var invMax = num(p.inventoryLimit);
    var whiteOpen = num(p.whiteOpenTime);
    var blueOpen = num(p.blueOpenTime);
    var cdMode = p.cooldownResetMode;
    var priority = p.simultaneousPriority;
    var maxPerClear = num(p.maxDropsPerClear);
    var firstDrop = p.firstDropRule;
    var nonSelectedBehavior = p.nonSelectedBehavior;
    var endCondition = p.endCondition;

    // Mutable simulation state (local only).
    var state = {
      inv: 0,
      whiteStored: 0,
      blueStored: 0,
      whiteOpened: 0,
      blueOpened: 0,
      // Cumulative wall-clock overhead spent opening boxes. Opening only
      // happens for boxes that enter inventory (stored boxes stay unopened),
      // so this is fully accrued by the time inventory fills.
      openingAccum: 0,
      invFilledAt: null,
      whiteDoneAt: null,
      blueDoneAt: null,
      nextWhite: 0,
      nextBlue: 0,
      lastWhiteDrop: 0,
      lastBlueDrop: 0
    };

    // Cooldown bookkeeping initial values.
    if (cdMode === 'fixed') {
      if (firstDrop === 'instant') {
        state.nextWhite = 0;
        state.nextBlue = 0;
      } else {
        state.nextWhite = whiteCd;
        state.nextBlue = blueCd;
      }
    } else {
      if (firstDrop === 'instant') {
        state.lastWhiteDrop = -whiteCd;
        state.lastBlueDrop = -blueCd;
      } else {
        state.lastWhiteDrop = 0;
        state.lastBlueDrop = 0;
      }
    }

    function isReady(box, t) {
      if (cdMode === 'fixed') {
        return t >= (box === 'white' ? state.nextWhite : state.nextBlue);
      }
      var last = box === 'white' ? state.lastWhiteDrop : state.lastBlueDrop;
      var cd = box === 'white' ? whiteCd : blueCd;
      return t - last >= cd;
    }

    function updateCooldown(box, t) {
      if (cdMode === 'fixed') {
        var cd = box === 'white' ? whiteCd : blueCd;
        if (box === 'white') {
          state.nextWhite = state.nextWhite + cd;
          while (state.nextWhite <= t) state.nextWhite += cd;
        } else {
          state.nextBlue = state.nextBlue + cd;
          while (state.nextBlue <= t) state.nextBlue += cd;
        }
      } else {
        if (box === 'white') state.lastWhiteDrop = t;
        else state.lastBlueDrop = t;
      }
    }

    // Timeline of events for charting. Records cumulative stored/inv after
    // each drop. Starts with the origin point.
    var events = [{ t: 0, inv: 0, whiteStored: 0, blueStored: 0 }];
    var drops = []; // individual drop markers: { t, box, kind: 'inv'|'store' }

    var done = false;
    var doneAt = null;
    var stage = 0;
    var reachedCap = false;

    while (!done) {
      stage++;
      if (stage > MAX_STAGES) {
        reachedCap = true;
        break;
      }
      var t = stage * X;

      var whiteReady = isReady('white', t);
      var blueReady = isReady('blue', t);

      var dropQueue = [];
      if (whiteReady && blueReady) {
        if (maxPerClear === 2) {
          dropQueue = priority === 'white' ? ['white', 'blue'] : ['blue', 'white'];
        } else {
          var first = priority;
          var other = priority === 'white' ? 'blue' : 'white';
          dropQueue = [first];
          if (nonSelectedBehavior === 'reset') {
            updateCooldown(other, t);
          }
        }
      } else if (whiteReady) {
        dropQueue = ['white'];
      } else if (blueReady) {
        dropQueue = ['blue'];
      }

      for (var i = 0; i < dropQueue.length; i++) {
        var box = dropQueue[i];
        if (state.inv < invMax) {
          state.inv++;
          // Opening the box consumes time before its contents land in inventory.
          state.openingAccum += box === 'white' ? whiteOpen : blueOpen;
          if (box === 'white') state.whiteOpened++;
          else state.blueOpened++;
          updateCooldown(box, t);
          var rtInv = t + state.openingAccum;
          drops.push({ t: rtInv, box: box, kind: 'inv' });
          if (state.inv >= invMax && state.invFilledAt === null) {
            state.invFilledAt = rtInv;
          }
        } else {
          // Stored (unopened) boxes add no opening overhead.
          if (box === 'white') {
            state.whiteStored++;
            if (state.whiteStored >= whiteMax && state.whiteDoneAt === null) {
              state.whiteDoneAt = t + state.openingAccum;
            }
          } else {
            state.blueStored++;
            if (state.blueStored >= blueMax && state.blueDoneAt === null) {
              state.blueDoneAt = t + state.openingAccum;
            }
          }
          updateCooldown(box, t);
          drops.push({ t: t + state.openingAccum, box: box, kind: 'store' });
        }
        events.push({
          t: t + state.openingAccum,
          inv: state.inv,
          whiteStored: state.whiteStored,
          blueStored: state.blueStored
        });
      }

      // End condition check. Reported time = stage clock + opening overhead.
      if (endCondition === 'either') {
        if (state.whiteDoneAt !== null || state.blueDoneAt !== null) {
          done = true;
          doneAt = t + state.openingAccum;
        }
      } else {
        if (state.whiteDoneAt !== null && state.blueDoneAt !== null) {
          done = true;
          doneAt = t + state.openingAccum;
        }
      }

      // Guard against impossible configs (e.g. storage never reachable
      // because inventory limit is unreachable). If neither box can ever
      // store anything (both cooldowns make storage impossible) the cap
      // above will eventually trip; nothing more to do here.
    }

    var firstReached = null;
    if (state.whiteDoneAt !== null && state.blueDoneAt !== null) {
      firstReached = state.whiteDoneAt <= state.blueDoneAt ? 'white' : 'blue';
    } else if (state.whiteDoneAt !== null) {
      firstReached = 'white';
    } else if (state.blueDoneAt !== null) {
      firstReached = 'blue';
    }

    var storageTime = null;
    if (doneAt !== null && state.invFilledAt !== null) {
      storageTime = doneAt - state.invFilledAt;
    }

    return {
      completed: !reachedCap && doneAt !== null,
      reachedCap: reachedCap,
      doneAt: doneAt,
      totalStages: stage,
      invFilledAt: state.invFilledAt,
      storageTime: storageTime,
      openingTime: state.openingAccum,
      whiteOpened: state.whiteOpened,
      blueOpened: state.blueOpened,
      whiteStored: state.whiteStored,
      blueStored: state.blueStored,
      whiteDoneAt: state.whiteDoneAt,
      blueDoneAt: state.blueDoneAt,
      firstReached: firstReached,
      events: events,
      drops: drops,
      params: p
    };
  }

  function num(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  return { simulate: simulate, DEFAULTS: DEFAULTS, MAX_STAGES: MAX_STAGES };
});
