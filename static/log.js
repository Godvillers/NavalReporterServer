// Generated by CoffeeScript 1.12.2
(function() {
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
    var div;
    if ((div = document.querySelector("#turn_pbar .p_bar")) != null) {
      div.title = "прогресс хода — " + (Math.round(value)) + "%";
      try {
        return div.getElementsByTagName("div")[0].style.width = value + "%";
      } catch (error) {}
    }
  };

  progressTimer = null;

  runProgressTimer = function(progress) {
    setProgress(progress);
    if (progressTimer != null) {
      clearInterval(progressTimer);
    }
    return progressTimer = every(500, function() {
      progress += 2.5;
      if (progress < 100 - 1e-5) {
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
    socket = new WebSocket("ws://" + location.host + location.pathname + "/ws");
    socket.onmessage = function(msg) {
      var map, response, scrollValue, url;
      response = JSON.parse(msg.data);
      if ((url = response.redirect) != null) {
        return location.replace(url);
      } else if (response.turn > getTurn()) {
        document.getElementById("alls").outerHTML = response.allies;
        map = document.getElementById("map_wrap");
        scrollValue = map.scrollLeft / map.scrollWidth;
        document.getElementById("s_map").outerHTML = response.map;
        map = document.getElementById("map_wrap");
        map.scrollLeft = scrollValue * map.scrollWidth;
        document.getElementById("m_fight_log").outerHTML = response.log;
        return runProgressTimer(Math.min(response.ago * 5, 100));
      }
    };
    return socket.onclose = function() {
      return setTimeout(connect, 3000);
    };
  };

  addEventListener("DOMContentLoaded", function() {
    runProgressTimer(initialProgress);
    return connect();
  });

}).call(this);
