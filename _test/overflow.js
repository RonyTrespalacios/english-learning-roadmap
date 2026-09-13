setTimeout(function () {
  var W = innerWidth;
  var bad = Array.prototype.slice.call(document.querySelectorAll("body *")).filter(function (e) {
    var r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0;
  }).slice(0, 15).map(function (e) {
    var r = e.getBoundingClientRect();
    return e.tagName + "." + String(e.className) + " w=" + Math.round(r.width) + " r=" + Math.round(r.right);
  });
  var msg = ("W=" + W + " sw=" + document.documentElement.scrollWidth + " || " + bad.join(" | ")); document.body.setAttribute("data-overflow", msg); try { parent.postMessage(msg, "*"); } catch (e) {}
}, 1500);
