// Rotating health warnings, like the ones that cycle on real packs.
(function () {
  var warnings = [
    "These games are in poor taste.",
    "Playing may cause you to laugh at things you shouldn't.",
    "Contains satire. Satire contains truth. Truth is bad for you.",
    "Side effects include mild guilt and sending this to a friend.",
    "Made by people who read the comments.",
    "Free to play. Hard to explain to your mum.",
    "The news did this to us.",
    "No subscriptions. No paywalls. No taste.",
    "Not suitable for anyone who is easily offended or currently in charge."
  ];

  // Hide the header logo while the hero stamp is visible, so the logo isn't shown twice
  var stamp = document.querySelector(".hero-stamp");
  if (stamp && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle("stamp-in-view", entries[0].isIntersecting);
    }, { rootMargin: "-60px 0px 0px 0px" }).observe(stamp);
  }

  var button = document.getElementById("warning");
  var text = document.getElementById("warning-text");
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
  if (!button || !text) return;

  var index = 0;
  button.addEventListener("click", function () {
    index = (index + 1) % warnings.length;
    text.textContent = warnings[index];
    button.classList.remove("is-swapping");
    void button.offsetWidth; // restart the animation
    button.classList.add("is-swapping");
  });
})();
