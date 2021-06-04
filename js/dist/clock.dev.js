"use strict";

document.addEventListener("DOMContentLoaded", function (event) {
  realTime();
});

function realTime() {
  var date = new Date();
  var hour = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  var halfday = "AM";
  halfday = hour >= 12 ? "PM" : "AM";
  hour = hour == 0 ? 12 : hour > 12 ? hour - 12 : hour;
  hour = update(hour);
  min = update(min);
  sec = update(sec);
  document.getElementById("h").innerText = hour;
  document.getElementById("m").innerText = min;
  document.getElementById("s").innerText = sec;
  document.getElementById("ap").innerText = halfday;
  setTimeout(realTime, 1000);
}

function update(k) {
  if (k < 10) {
    return "0" + k;
  } else {
    return k;
  }
}
//# sourceMappingURL=clock.dev.js.map
