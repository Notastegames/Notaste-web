/*
  The site menu's Hot Seat dropdown (styles in styles.css).
  A mouse opens it by hovering (CSS). A tap or click on "Hot Seat" opens and closes it instead of following the link;
  a tap anywhere else, or Escape, closes it. Without this script, "Hot Seat" simply goes to the scene list.
*/
(function () {
  var drops = document.querySelectorAll(".nav-hs");
  if (!drops.length) return;

  function set(drop, open) {
    drop.classList.toggle("open", open);
    drop.querySelector(".nav-hs-btn").setAttribute("aria-expanded", open ? "true" : "false");
  }

  drops.forEach(function (drop) {
    var btn = drop.querySelector(".nav-hs-btn");
    btn.setAttribute("role", "button");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      set(drop, !drop.classList.contains("open"));
    });
    // Keyboard: Space opens it like a button would
    btn.addEventListener("keydown", function (e) {
      if (e.key === " ") { e.preventDefault(); set(drop, !drop.classList.contains("open")); }
    });
  });

  document.addEventListener("click", function (e) {
    drops.forEach(function (drop) { if (!drop.contains(e.target)) set(drop, false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    drops.forEach(function (drop) {
      if (!drop.classList.contains("open") && !drop.contains(document.activeElement)) return;
      set(drop, false);
      if (drop.contains(document.activeElement)) document.activeElement.blur();   // focus inside also holds it open
    });
  });
})();
