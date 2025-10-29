(function ($) {
  "use strict";

  $(function () {
    const $form = $(".sub-form.search-form");
    const $error = $("#error");
    const $success = $("#success");

    if ($form.length > 0) {
      $form.on("submit", function (event) {
        event.preventDefault();

        const $button = $form.find("button");
        const email = $form.find("input[type='email']").val().trim();

        // Clear any previous messages
        $error.text("");
        $success.text("");

        if (!email) {
          $error.text(" Please enter your email address");
          return;
        }

        $button.prop("disabled", true);
        $button.html('<span class="fa fa-spinner fa-spin"></span> Subscribing...');

        const formData = {
          email: email,
          createdAt: new Date().toISOString(),
        };

        $.ajax({
          type: "POST",
          url: "https://bifs-backend.onrender.com/api/subscribers",
          contentType: "application/json",
          data: JSON.stringify(formData),

          success: function (res) {
            console.log("Newsletter response:", res);

            if (res.message === "You are already subscribed") {
              $error.text("This email is already subscribed to our newsletter!");
              $error.css({
                'color': '#007bff',
                'margin-bottom': '10px',
                'display': 'block'
              });
            } else if (res.message === "Subscription successful") {
              $form[0].reset();
              $success.text("Thank you for subscribing to our newsletter!");
              $success.css({
                'color': '#28a745',
                'margin-bottom': '10px',
                'display': 'block'
              });

              // Clear success message after 5 seconds
              setTimeout(() => {
                $success.text("");
              }, 5000);
            } else {
              $error.text("❌ Something went wrong. Please try again.");
              $error.css({
                'color': '#dc3545',
                'margin-bottom': '10px',
                'display': 'block'
              });
            }
          },

          error: function (xhr) {
            let errorMessage = "❌ Server error. Please try again later.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
              errorMessage = "❌ " + xhr.responseJSON.message;
            }
            $error.text(errorMessage);
            $error.css({
              'color': '#dc3545',
              'margin-bottom': '10px',
              'display': 'block'
            });
          },

          complete: function () {
            $button.prop("disabled", false);
            $button.html('Subscribe <span></span>');
          },
        });
      });
    }
  });
})(jQuery);