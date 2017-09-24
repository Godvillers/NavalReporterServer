// Generated by CoffeeScript 1.12.2
(function() {
  "use strict";
  var connect, every, getTurn, progressTimer, runProgressTimer, setProgress, socket;

  every = function(ms, action) {
    return setInterval(action, ms);
  };

  getTurn = function() {
    try {
      return +document.querySelector("#m_fight_log .block_h .block_title").data.match(/\d+/)[0];
    } catch (error) {
      return 0;
    }
  };

  setProgress = function(value) {
    try {
      return document.querySelector("#turn_pbar .p_bar div").style.width = value + "%";
    } catch (error) {}
  };

  progressTimer = null;

  runProgressTimer = function(ago) {
    var basePoint;
    basePoint = Date.now();
    if (progressTimer != null) {
      clearInterval(progressTimer);
    }
    setProgress(Math.min(ago *= 5, 100));
    return progressTimer = every(250, function() {
      var progress;
      if ((progress = ago + (Date.now() - basePoint) * .005) < 100 - 1e-5) {
        return setProgress(progress);
      } else {
        setProgress(100);
        clearInterval(progressTimer);
        return progressTimer = null;
      }
    });
  };

  socket = null;

  connect = function() {
    var justConnected;
    socket = new WebSocket("ws://" + location.host + location.pathname + "/ws");
    justConnected = true;
    socket.onmessage = function(msg) {
      var map, response, scrollValue, url;
      response = JSON.parse(msg.data);
      if ((url = response.redirect) != null) {
        location.replace(url);
      } else if (response.turn > getTurn()) {
        document.getElementById("alls").outerHTML = response.allies;
        map = document.getElementById("map_wrap");
        scrollValue = map.scrollLeft / map.scrollWidth;
        document.getElementById("s_map").outerHTML = response.map;
        map = document.getElementById("map_wrap");
        map.scrollLeft = scrollValue * map.scrollWidth;
        document.getElementById("m_fight_log").outerHTML = response.log;
        runProgressTimer(justConnected ? response.ago : 0);
      }
      return justConnected = false;
    };
    return socket.onclose = function() {
      return setTimeout(connect, 3000);
    };
  };

  addEventListener("DOMContentLoaded", function() {
    runProgressTimer(updatedAgo);
    return connect();
  });

}).call(this);
