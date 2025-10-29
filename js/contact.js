(function($) {

  "use strict";

  $(function() { 
    if ($('#contactForm').length > 0) {
      $("#contactForm").validate({
        rules: {
          name: "required",
          subject: "required",
          email: {
            required: true,
            email: true
          },
          message: {
            required: true,
            minlength: 5
          }
        },
        messages: {
          name: "Please enter your name",
          subject: "Please enter your subject",
          email: "Please enter a valid email address",
          message: "Please enter a message"
        },

        submitHandler: function(form) {	
          var $submit = $('.submitting'),
              waitText = 'Submitting...';

          var formData = $(form).serializeArray().reduce(function(obj, item) {
            obj[item.name] = item.value;
            return obj;
          }, {});

          formData.date = new Date().toISOString().split("T")[0];

          $.ajax({   	
            type: "POST",
            url: "https://bifs-backend.onrender.com/messages",
            contentType: "application/json",
            data: JSON.stringify(formData),

            beforeSend: function() { 
              $submit.css('display', 'block').text(waitText);
            },

            success: function(msg) {
              console.log("✅ Server response:", msg);

              if (msg && msg.id) {
                $('#form-message-warning').hide();
                $('#message-success').addClass('show');



                form.reset();

                //timeout to remove the show class after 5 seconds

                setTimeout(function(){
                  $('#message-success').removeClass('show');
                }, 5000); 
                




                $submit.css('display', 'none').text(waitText);  
              } else {
                $('#form-message-warning').html("Something went wrong.");
                $('#form-message-warning').fadeIn();
                $submit.css('display', 'none');
              }
            },

            error: function() {
              $('#form-message-warning').html("Server error. Please try again.");
              $('#form-message-warning').fadeIn();
              $submit.css('display', 'none');
            }
          });

          return false; // 👈 prevents page reload
        }
      });
    }
  });

})(jQuery);
