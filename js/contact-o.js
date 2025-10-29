(function($) {

    "use strict";

    // Form
    var contactForm = function() {
        if ($('#contactForm').length > 0 ) {
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
                /* submit via ajax */
                submitHandler: function(form) {		
                    var $submit = $('.submitting'),
                        waitText = 'Submitting...';

                    $.ajax({   	
                        type: "POST",
                        url: "php/sendEmail.php",
                        data: $(form).serialize(),

                        beforeSend: function() { 
                            $submit.css('display', 'block').text(waitText);
                        },
                        success: function(msg) {
                            if (msg == 'OK') {
                                $('#form-message-warning').hide();

                                // Slide in #message-success
                                var $msgSuccess = $('#message-success');
                                $msgSuccess.addClass('show');

                                setTimeout(function(){
                                    $msgSuccess.removeClass('show');
                                }, 2500); // Show for 2.5 seconds

                                setTimeout(function(){
                                    $submit.css('display', 'none').text(waitText);  
                                }, 1400);

                                setTimeout(function(){
                                    $('#contactForm').fadeOut();
                                }, 1000);

                            } else {
                                $('#form-message-warning').html(msg);
                                $('#form-message-warning').fadeIn();
                                $submit.css('display', 'none');
                            }
                        },
                        error: function() {
                            $('#form-message-warning').html("Something went wrong. Please try again.");
                            $('#form-message-warning').fadeIn();
                            $submit.css('display', 'none');
                        }
                    });    		
                } // end submitHandler

            });
        }

          };
    contactForm();

})(jQuery);