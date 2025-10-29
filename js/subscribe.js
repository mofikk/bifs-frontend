(function ($) {
  "use strict";

  $(function () {
    const $form = $(".input-container");
    const $success = $(".success");
    const $error = $("#error");
    const $duplicate = $("#duplicate");

    if ($form.length > 0) {
      $form.on("submit", function (event) {
        event.preventDefault();

        const $button = $form.find("button[type='submit']");
        const email = $form.find("input[type='email']").val().trim();

        // Clear any previous messages
        $error.text("");
        $duplicate.text("");

        if (!email) {
          $error.text("⚠️ Please enter your business email.");
          return;
        }

        $button.prop("disabled", true);

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
              $duplicate.text("You’re already subscribed to our newsletter!");
            } else if (res.message === "Subscription successful") {
              $success.addClass("show");
              $form[0].reset();

              setTimeout(() => {
                $success.removeClass("show");
              }, 5000);
            } else {
              $error.text(" Something went wrong. Please try again.");
            }
          },

          error: function () {
            $error.text("Server error. Please try again later.");
          },

          complete: function () {
            $button.prop("disabled", false);
          },
        });
      });
    }
  });
})(jQuery);


