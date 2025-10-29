async function loadComponent(id, file, callback) {
  try {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id "${id}" not found`);
      return;
    }
    const res = await fetch(file);
    const html = await res.text();
    element.innerHTML = html;

    if (callback) callback(); // Run dropdown JS after injection
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
  }
}

// Load navbar with dropdown script
loadComponent("navbar", "navbar.html", () => {
  const $menuBtn = $('.menu-btn');
  const $hamburger = $('.menu-btn_burger');
  const $dropMenu = $('.dropdown-menu');
  const $menuItems = $('.dropdown-menu_items');

  let showMenu = false;

  $menuBtn.on('click', function () {
    if (!showMenu) {
      $hamburger.addClass('open');
      $dropMenu.addClass('open');
      $menuItems.each(function (i) {
        setTimeout(() => {
          $(this).addClass('open');
        }, 100 * i);
      });
      showMenu = true;
    } else {
      $hamburger.removeClass('open');
      $dropMenu.removeClass('open');
      $menuItems.removeClass('open');
      showMenu = false;
    }
  });
});

// Footer doesn’t need extra JS
loadComponent("footer", "footer.html");
