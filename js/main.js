// ...existing code...
$(document).ready(function () {
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
                // Stagger each item's animation
                setTimeout(() => {
                    $(this).addClass('open');
                }, 100 * i); // 100ms delay between items
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




// ...existing code...










//PAGINATION



$(document).ready(function () {
    let itemsPerPage = 6; // Number of blog cards per page
    let $items = $(".blog-card");
    let totalItems = $items.length;
    let totalPages = Math.ceil(totalItems / itemsPerPage);
    let $pagination = $(".pagination ul");

    // Build pagination links dynamically
    $pagination.empty();
    for (let i = 1; i <= totalPages; i++) {
        $pagination.append('<a href="#"><li>' + i + '</li></a>');
    }

    // Function to show a specific page
    function showPage(page) {
        $items.hide();
        let start = (page - 1) * itemsPerPage;
        let end = start + itemsPerPage;
        $items.slice(start, end).show();

        $(".pagination a").removeClass("is-active");
        $(".pagination a").eq(page - 1).addClass("is-active");
    }

    // Handle click on pagination
    $pagination.on("click", "a", function (e) {
        e.preventDefault();
        let page = $(this).index() + 1;
        showPage(page);
    });

    // Initialize
    showPage(1);
});



//Animations

$(document).ready(function() {
    $('.hero_content').addClass('animate-in');
});


//PILLAR ITEMS IN HOME PAGE

$(document).ready(function() {
    function animatePillars() {
        $('.pillar-item').each(function() {
            var $this = $(this);
            var windowBottom = $(window).scrollTop() + $(window).height();
            var itemTop = $this.offset().top + 40; // 40px offset for earlier trigger
            if (windowBottom > itemTop) {
                $this.addClass('animate-in');
            }
        });
    }

    // Initial check
    animatePillars();

    // On scroll
    $(window).on('scroll', function() {
        animatePillars();
    });
});


//FOR BLOG CARDS


$(document).ready(function() {
    function animatePillars() {
        $('.blog-card').each(function() {
            var $this = $(this);
            var windowBottom = $(window).scrollTop() + $(window).height();
            var itemTop = $this.offset().top + 40; // 40px offset for earlier trigger
            if (windowBottom > itemTop) {
                $this.addClass('animate-in');
            }
        });
    }

    // Initial check
    animatePillars();

    // On scroll
    $(window).on('scroll', function() {
        animatePillars();
    });
});








// scaling North star vision


$(document).ready(function() {
    function scaleTnsvBox() {
        var $tnsvBox = $('.tnsv-box');
        if (!$tnsvBox.length) return; // Exit if element doesn't exist
        var windowBottom = $(window).scrollTop() + $(window).height();
        var boxTop = $tnsvBox.offset().top;
        var boxBottom = boxTop + $tnsvBox.outerHeight();

        // If tnsv-box is in viewport, add scale effect
        if (windowBottom > boxTop + 100 && $(window).scrollTop() < boxBottom - 100) {
            $tnsvBox.addClass('scale-bg');
        } else {
            $tnsvBox.removeClass('scale-bg');
        }
    }

    scaleTnsvBox();
    $(window).on('scroll', scaleTnsvBox);
});



$(document).ready(function() {
    function scaleAboutBox() {
        var $aboutBox = $('.about-box');
        if (!$aboutBox.length) return; // Exit if element doesn't exist
        var windowBottom = $(window).scrollTop() + $(window).height();
        var boxTop = $aboutBox.offset().top;
        var boxBottom = boxTop + $aboutBox.outerHeight();

      
        if (windowBottom > boxTop + 100 && $(window).scrollTop() < boxBottom - 100) {
            $aboutBox.addClass('scale-bg');
        } else {
            $aboutBox.removeClass('scale-bg');
        }
    }

    scaleAboutBox();
    $(window).on('scroll', scaleAboutBox);
});




$(document).ready(function() {
    $('#pg-content').addClass('animate-in');
});