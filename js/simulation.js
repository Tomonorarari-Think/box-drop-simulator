/*
 * Box Drop Storage Simulator - core simulation engine.
 *
 * Lifecycle of every box (clarified game flow):
 *   drop -> storage buffer (保管) -> auto-opened in order -> inventory.
 *
 * - White and blue each have their own opener, running in parallel and
 *   concurrently with stage clearing (one box at a time per colour, FIFO).
 * - Opening deposits the loot into the SHARED inventory (capacity invMax).
 *   Once the inventory is full, opening stops depositing, so boxes pile up in
 *   their colour's storage buffer.
 * - "Stored count" = boxes dropped but not yet opened into inventory. The run
 *   ends when a colour's storage reaches its cap (per the end condition).
 *
 * Consequence: while a colour's opener keeps up with its drop rate, opening
 * time barely affects timing; it only bites when opening cannot keep up.
 *
 * Implemented as a small discrete-event simulation. Pure: simulate() returns a
 * fresh result and never mutates its input. Works in the browser (window.BDS)
 * and in Node (module.exports) for headless testing.
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
    whiteOpenTime: 0, // seconds to open one white box
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

    // --- Cooldown bookkeeping (drives the drop schedule) ---
    var cd = {
      nextWhite: 0,
      nextBlue: 0,
      lastWhiteDrop: 0,
      lastBlueDrop: 0
    };
    if (cdMode === 'fixed') {
      if (firstDrop === 'instant') { cd.nextWhite = 0; cd.nextBlue = 0; }
      else { cd.nextWhite = whiteCd; cd.nextBlue = blueCd; }
    } else {
      if (firstDrop === 'instant') { cd.lastWhiteDrop = -whiteCd; cd.lastBlueDrop = -blueCd; }
      else { cd.lastWhiteDrop = 0; cd.lastBlueDrop = 0; }
    }

    function isReady(box, t) {
      if (cdMode === 'fixed') {
        return t >= (box === 'white' ? cd.nextWhite : cd.nextBlue);
      }
      var last = box === 'white' ? cd.lastWhiteDrop : cd.lastBlueDrop;
      return t - last >= (box === 'white' ? whiteCd : blueCd);
    }

    function updateCooldown(box, t) {
      if (cdMode === 'fixed') {
        var c = box === 'white' ? whiteCd : blueCd;
        if (box === 'white') {
          cd.nextWhite += c;
          while (cd.nextWhite <= t) cd.nextWhite += c;
        } else {
          cd.nextBlue += c;
          while (cd.nextBlue <= t) cd.nextBlue += c;
        }
      } else {
        if (box === 'white') cd.lastWhiteDrop = t;
        else cd.lastBlueDrop = t;
      }
    }

    // Drop generator: yields the next drop { t, box } in time order, or null
    // once the stage cap is hit. Preserves the original cooldown/priority rules.
    var stage = 0;
    var pending = [];
    function nextDrop() {
      while (pending.length === 0) {
        stage++;
        if (stage > MAX_STAGES) return null;
        var t = stage * X;
        var wr = isReady('white', t);
        var br = isReady('blue', t);
        var dq = [];
        if (wr && br) {
          if (maxPerClear === 2) {
            dq = priority === 'white' ? ['white', 'blue'] : ['blue', 'white'];
          } else {
            var first = priority;
            var other = priority === 'white' ? 'blue' : 'white';
            dq = [first];
            if (nonSelectedBehavior === 'reset') updateCooldown(other, t);
          }
        } else if (wr) {
          dq = ['white'];
        } else if (br) {
          dq = ['blue'];
        }
        for (var i = 0; i < dq.length; i++) {
          updateCooldown(dq[i], t);
          pending.push({ t: t, box: dq[i] });
        }
      }
      return pending.shift();
    }

    // --- Discrete-event state ---
    var inv = 0; // loot items currently in the shared inventory
    var invFilledAt = null; // time inventory becomes full of opened loot
    var invReserveClock = null; // stage-clock time the invMax-th box drops (instant-open reference)
    var startedTotal = 0; // opens started so far (reserves a slot; capped at invMax)
    var depositedWhite = 0, depositedBlue = 0; // boxes opened into inventory
    var storageWhite = 0, storageBlue = 0; // dropped but not yet opened into inventory
    var whiteWait = [], blueWait = []; // arrival times of boxes not yet picked by the opener
    var compWhite = null, compBlue = null; // scheduled open-completion time per colour
    var freeWhite = 0, freeBlue = 0; // time each opener becomes free
    var droppedTotal = 0;
    var whiteDoneAt = null, blueDoneAt = null;

    function startOpener(color) {
      if (color === 'white') {
        if (compWhite !== null || startedTotal >= invMax || whiteWait.length === 0) return;
        var arr = whiteWait.shift();
        compWhite = Math.max(freeWhite, arr) + whiteOpen;
        freeWhite = compWhite;
        startedTotal++;
      } else {
        if (compBlue !== null || startedTotal >= invMax || blueWait.length === 0) return;
        var arr2 = blueWait.shift();
        compBlue = Math.max(freeBlue, arr2) + blueOpen;
        freeBlue = compBlue;
        startedTotal++;
      }
    }

    // Timeline for charting: stored counts after each drop, plus the origin.
    var events = [{ t: 0, inv: 0, whiteStored: 0, blueStored: 0 }];
    var drops = []; // { t, box, kind: 'inv' | 'store' }

    var done = false;
    var doneAt = null;
    var reachedCap = false;
    var nd = nextDrop();

    while (!done) {
      // Start any opens that can begin right now.
      startOpener('white');
      startOpener('blue');

      var dropT = nd ? nd.t : Infinity;
      var compT = Math.min(
        compWhite === null ? Infinity : compWhite,
        compBlue === null ? Infinity : compBlue
      );

      if (compT === Infinity && dropT === Infinity) {
        // No drops left and nothing opening: scenario cannot complete.
        reachedCap = true;
        break;
      }

      if (compT <= dropT) {
        // --- Open completion: deposit loot into the inventory ---
        var color = (compWhite !== null && compWhite === compT) ? 'white' : 'blue';
        if (color === 'white') { compWhite = null; depositedWhite++; storageWhite--; }
        else { compBlue = null; depositedBlue++; storageBlue--; }
        inv++;
        if (inv >= invMax && invFilledAt === null) invFilledAt = compT;
      } else {
        // --- Drop: box enters its colour's storage buffer ---
        var dt = nd.t;
        var dbox = nd.box;
        droppedTotal++;
        if (droppedTotal === invMax && invReserveClock === null) invReserveClock = dt;
        var kind = startedTotal < invMax ? 'inv' : 'store';
        if (dbox === 'white') {
          storageWhite++;
          whiteWait.push(dt);
          if (storageWhite >= whiteMax && whiteDoneAt === null) whiteDoneAt = dt;
        } else {
          storageBlue++;
          blueWait.push(dt);
          if (storageBlue >= blueMax && blueDoneAt === null) blueDoneAt = dt;
        }
        drops.push({ t: dt, box: dbox, kind: kind });
        events.push({ t: dt, inv: inv, whiteStored: storageWhite, blueStored: storageBlue });

        if (endCondition === 'either') {
          if (whiteDoneAt !== null || blueDoneAt !== null) { doneAt = dt; done = true; }
        } else {
          if (whiteDoneAt !== null && blueDoneAt !== null) { doneAt = dt; done = true; }
        }
        if (!done) nd = nextDrop();
      }
    }

    var firstReached = null;
    if (whiteDoneAt !== null && blueDoneAt !== null) {
      firstReached = whiteDoneAt <= blueDoneAt ? 'white' : 'blue';
    } else if (whiteDoneAt !== null) {
      firstReached = 'white';
    } else if (blueDoneAt !== null) {
      firstReached = 'blue';
    }

    // Additional storage time: from inventory full to completion. Clamped at 0
    // for the pathological case where storage overflows before inventory fills.
    var storageTime = null;
    if (doneAt !== null && invFilledAt !== null) {
      storageTime = Math.max(0, doneAt - invFilledAt);
    }

    // How much opening pushed inventory-full back vs an instant-open ideal
    // (i.e. vs the moment the invMax-th box dropped). ~0 when openers keep up.
    var openingDelay = null;
    if (invFilledAt !== null && invReserveClock !== null) {
      openingDelay = Math.max(0, invFilledAt - invReserveClock);
    }

    return {
      completed: !reachedCap && doneAt !== null,
      reachedCap: reachedCap,
      doneAt: doneAt,
      totalStages: stage,
      invFilledAt: invFilledAt,
      invFilledClock: invReserveClock,
      storageTime: storageTime,
      openingDelay: openingDelay,
      whiteOpened: depositedWhite,
      blueOpened: depositedBlue,
      whiteStored: storageWhite,
      blueStored: storageBlue,
      whiteDoneAt: whiteDoneAt,
      blueDoneAt: blueDoneAt,
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
