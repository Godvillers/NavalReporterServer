// Generated by LiveScript 1.5.0
(function(){
  "use strict";
  var $id, $q, contains, format02d, formatTime, after, every, timeIt, decompress, getStep, setProgress, progressTimer, runProgressTimer, updatePage, checksumCache, calcSymbolChecksum, shouldUseCustomFont, undrawableChecksum, postprocessPage, socket, retryEvery, retryCount, disconnect, connect;
  $id = function(it){
    return document.getElementById(it);
  };
  $q = function(it){
    return document.querySelector(it);
  };
  contains = function(haystack, needle){
    return !!~haystack.indexOf(needle);
  };
  format02d = function(n){
    return ("0" + n).slice(-2);
  };
  formatTime = function(minutes){
    return format02d(Math.floor(minutes / 60)) + ":" + format02d(minutes % 60);
  };
  after = function(seconds, action){
    return setTimeout(action, seconds * 1000);
  };
  every = function(seconds, action){
    return setInterval(action, seconds * 1000);
  };
  timeIt = function(title, action){
    console.time(title);
    try {
      return action();
    } finally {
      console.timeEnd(title);
    }
  };
  decompress = window.TextDecoder != null
    ? function(data){
      return new TextDecoder().decode(pako.inflate(data));
    }
    : function(data){
      return pako.inflate(data, {
        to: 'string'
      });
    };
  getStep = function(){
    var e;
    try {
      return +/\d+/.exec($q('#m_fight_log .block_h .block_title').textContent)[0];
    } catch (e$) {
      e = e$;
      return 0;
    }
  };
  setProgress = function(value){
    try {
      $q('#turn_pbar .p_bar div').style.width = value + "%";
    } catch (e$) {}
  };
  progressTimer = null;
  runProgressTimer = function(ago, stepDuration){
    var percentsPerMillisecond, basePoint;
    percentsPerMillisecond = 0.1 / stepDuration;
    basePoint = Date.now();
    if (progressTimer != null) {
      clearInterval(progressTimer);
    }
    setProgress(Math.min(ago *= percentsPerMillisecond * 1000, 100));
    progressTimer = every(0.25, function(){
      var progress;
      if ((progress = ago + (Date.now() - basePoint) * percentsPerMillisecond) < 100 - 1e-5) {
        setProgress(progress);
      } else {
        setProgress(100);
        clearInterval(progressTimer);
        progressTimer = null;
      }
    });
  };
  updatePage = function(arg$){
    var allies, map, chronicle, x$, scrollValue, y$;
    allies = arg$.allies, map = arg$.map, chronicle = arg$.chronicle;
    $id('alls').outerHTML = allies;
    x$ = $id('map_wrap');
    scrollValue = x$.scrollLeft / x$.scrollWidth;
    $id('s_map').outerHTML = map;
    y$ = $id('map_wrap');
    y$.scrollLeft = scrollValue * y$.scrollWidth;
    $id('m_fight_log').outerHTML = chronicle;
  };
  checksumCache = {};
  calcSymbolChecksum = function(c){
    var that, canvas, context, x$, img, result, i$, y$, ref$, len$;
    if ((that = checksumCache[c]) != null) {
      return that;
    }
    canvas = document.createElement('canvas');
    if (!(canvas.getContext != null && (context = canvas.getContext('2d')) != null && context.fillText != null)) {
      return 0;
    }
    x$ = context;
    x$.textBaseline = 'top';
    x$.font = "32px Arial";
    x$.fillText(c, 0, 0);
    img = x$.getImageData(0, 0, 32, 32);
    if (img == null) {
      return 0;
    }
    result = 0;
    for (i$ = 0, len$ = (ref$ = img.data).length; i$ < len$; ++i$) {
      y$ = ref$[i$];
      result += y$;
    }
    return checksumCache[c] = result;
  };
  shouldUseCustomFont = window.MSStream == null && /iP[ao]d|iPhone/.test(navigator.userAgent)
    ? function(){
      return false;
    }
    : (contains(navigator.userAgent, 'Firefox') && !contains(navigator.userAgent, 'Macintosh')) || !(undrawableChecksum = calcSymbolChecksum('\uFFFF'))
      ? function(){
        return true;
      }
      : function(it){
        return it && (contains("↖↗←→↙↘↑↓", it) || calcSymbolChecksum(it) === undrawableChecksum);
      };
  postprocessPage = function(){
    var offset, i$, ref$, len$, node, that, ref1$, tile, text;
    offset = new Date().getTimezoneOffset();
    for (i$ = 0, len$ = (ref$ = document.getElementsByClassName('d_time')).length; i$ < len$; ++i$) {
      node = ref$[i$];
      if ((that = /(\d*)\s*:\s*(\d*)/.exec(node.textContent)) != null) {
        node.textContent = formatTime((((+that[1] * 60 + +that[2] - offset) % (ref1$ = 24 * 60) + ref1$) % ref1$));
      }
    }
    for (i$ = 0, len$ = (ref$ = document.getElementsByClassName('tile')).length; i$ < len$; ++i$) {
      tile = ref$[i$];
      if ((text = tile.getElementsByTagName('text')[0]) != null && shouldUseCustomFont(text.textContent.trim())) {
        tile.classList.add('em_font');
      }
    }
  };
  socket = null;
  retryEvery = 3;
  retryCount = 0;
  disconnect = function(){
    if (socket != null) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
  };
  connect = function(){
    var justConnected;
    if (socket != null) {
      console.warn("An old socket still existed");
      disconnect();
    }
    socket = new WebSocket("" + (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + location.pathname + "/ws" + location.search + "");
    socket.onclose = function(){
      socket = null;
      after(3, connect);
    };
    justConnected = 1;
    socket.binaryType = 'arraybuffer';
    socket.onmessage = function(msg){
      var response, url;
      response = timeIt("Decompression", function(){
        return JSON.parse(decompress(msg.data));
      });
      if (response.stayHere) {
        disconnect();
        retryEvery = response.retryEvery, retryCount = response.retryCount;
        after(response.retryAfter, connect);
      } else if ((url = response.redirect) != null) {
        if (--retryCount > 0) {
          disconnect();
          after(retryEvery, connect);
        } else {
          location.replace(url);
        }
      } else if (response.step > getStep()) {
        retryCount = 0;
        updatePage(response);
        postprocessPage();
        runProgressTimer(justConnected && response.ago, response.stepDuration);
      }
      justConnected = 0;
    };
  };
  addEventListener('unload', disconnect);
  addEventListener('DOMContentLoaded', function(){
    postprocessPage();
    runProgressTimer(gUpdatedAgo, gStepDuration);
    connect();
  });
}).call(this);
