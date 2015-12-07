(function($) {
	$.fn.wowWizard = function(options) {
		
		// Standart values in which case user does not gives a custom data.
		$.fn.wowWizard.defaults = {
			steps: [],
			theme: 'pomegranate',
			errors: {
				'form': "Bu alan boş bırakılamaz.",
				'multiple_choice': "Seçeneklerden en az birini seçmelisiniz.",
				'single_choice': "Seçeneklerden birini seçmelisiniz.",
			},
			onNextStep: function() {},
			onPrevStep: function() {},
			onFinish: function(data) {},
		};

		// Wizard settings
		settings = $.extend({}, $.fn.wowWizard.defaults, options);
		settings.errors = $.extend({}, $.fn.wowWizard.defaults.errors, options.errors);
		this.settings = settings;
		wizard = this; // Global wizard variable which is going to be used in all plugin functions.

		// Creates theme colors and getter/setters for them.
		var THEME = (function() {
			var colors = {
				pomegranate: {
					activeIndicatorBackgroundColor: 'F44A56',
					activeIndicatorTextColor: '#FFF',
					questionAndAnswerTextColor: '#69181E',
					circleColor: '#C23640',
					outlineColor: '#F44A56',
					lineColor: '#F44A56',
					buttonBackgroundColor: '#F44A56',
					buttonTextColor: '#FFF',
					imageChoiceBorderColor: "#F44A56",
					imageChoiceCircleBackgroundColor: "#FFB3B8"
				}
			};
			var apply = function($step_html) {
					var choice = colors[wizard.settings.theme];
					$step_html.find(".wow-wizard-step-indicator.visited .step-id").css('background-color', choice.circleColor);
					$step_html.find(".wow-wizard-step-indicator").css('color', choice.activeIndicatorTextColor);
					$step_html.find(".wow-wizard-step-indicator.visited").css('background-color', choice.activeIndicatorBackgroundColor);
					$step_html.find(".wow-wizard-step-indicator").filter(function(index) {
						return !$(this).hasClass('visited');
					}).css('color', choice.textColor);
					$step_html.find('.wow-wizard-step-indicators').css('border-bottom', '2px solid '+choice.lineColor);
					$step_html.find('#wow-wizard-next-step, .single-choice-button').css('background-color', choice.buttonBackgroundColor);
					$step_html.find('#wow-wizard-next-step, .single-choice-button').css('color', choice.buttonTextColor);
					$step_html.find('input[type=text], textarea').css('outline', 'none');

					// Single Image Choice
					$step_html.find('.single-image-choice, .single-image-choice .circle-select').css('border', '2px solid '+choice.imageChoiceBorderColor);
					$step_html.find('input[type=text]:focus, textarea:focus').css({
							'border': '2px solid '+choice.outlineColor,
							'box-shadow': '0px 0px 5px 0px rgba(244,74,85,1);'
						});
					$step_html.find('input[type=text], input[type=email], textarea').focus(function() {
						$(this).css({
							'border': '1px solid '+choice.outlineColor,
							'-webkit-box-shadow': '0px 0px 5px 0px '+choice.outlineColor,
							'box-shadow': '0px 0px 5px 0px '+choice.outlineColor
						});
					});
					$step_html.find('input[type=text], input[type=email], textarea').blur(function() {
						$(this).css({
							'border': '1px solid #BBB',
							'-webkit-box-shadow': 'none'
						});
					}); 
				}
			return {
				apply: apply,
				colors: colors[wizard.settings.theme]
			};
		})();

		// Wizard configuration consisting of constants and private methods.
		var CONFIG = (function() {
			var private = {
				'shouldHaveNextButton': ['form', 'multiple_choice', 'single_image_choice', 'textarea'],
				'allowedStepTypes': ['single_choice', 'form', 'multiple_choice', 'single_image_choice', 'textarea']
			};
			return {
				shouldHaveNextButton: function($step) {
					return private.shouldHaveNextButton.indexOf($step.type) != -1;
				},
				isStepTypeAllowed: function($step) {
					return private.allowedStepTypes.indexOf($step.type) != -1;
				}
			};
		})();

		// Global current step and max-reached step trackers.
		currentStep = 0;
		passedStepTracker = 0;

		// Starting by syncing the step.
		_syncStep(this);

		// Synchronizes the step. Parses the html, creates the event handlers, 
		// looks if user has answered this step and if so, uses those answers again.
		function _syncStep() {
			var $step = wizard.settings.steps[currentStep];
			if($step.isDependent) {
				$step = _getDependentStep($step);
			}
			if(!$step) {
				throw new Error("Wrong dependency accross the steps.");
			}
			else if(!CONFIG.isStepTypeAllowed($step)) {
				throw new Error("Step type is not allowed: "+$step.type);
				return;
			} else { // Step is validated.
				var $step_html = _getStepHTML($step);
			
				// Changing html and giving fadeout - fadein effect to wizard content.
				wizard.html($step_html);
				wizard.find('.wow-wizard-content').first().fadeOut(0).fadeIn(200);

				_prepareEventHandlers($step, $step_html);
				THEME.apply($step_html);
				_reuseOldInput($step);
			}
		}

		// If the step is dependent, gets in the "steps" array of it and 
		// pulls the step that needs to be triggered.
		function _getDependentStep($step) {
			for(var i = 0; i < $step.steps.length; i++) {
				var step_steps = $step.steps[i];
				var $trigger_step = wizard.settings.steps[step_steps.triggerStep];
				if($trigger_step.given_answer == step_steps.triggerAnswer) {
					return step_steps;
				}
			}
		}
		
		// Prepares the click events on the document.
		function _prepareEventHandlers($step, $step_html) {

			// Step indicator buttons click trigger
			var $step_buttons = $step_html.find(".wow-wizard-step-indicator");
			$step_buttons.each(function(index) {
				step_id = $(this).data("step");
				if(passedStepTracker > step_id) {
					$(this).find(".step-id").html('<i class="fa fa-check"></i>');
				}
				if(currentStep == step_id){
					$(this).addClass('visited');
				}
				$(this).click(function() {
					_goToStep($(this));
				});
			});

			// Fading out alert field at the time we parse the step.
			$alert_area = $step_html.find("#wow-alert");
			$alert_area.fadeOut(0);

			// Next step and single-choice buttons trigger.
			var $next_step_button = $step_html.find("#wow-wizard-next-step");
			$next_step_button.click(function() {
				_nextStep();
			});
			$("div.single-choice-button").click(function() {
				$(this).data('selected', true);
				console.log($(this).data('selected'));
				_nextStep();
			});

			// Binding ENTER key press event if this step is suitable.
			if($step.type == 'form') {
				$(wizard).bind('keypress', function(e) {
					var code = e.keyCode || e.which;
					if(code == 13) { //Enter keycode
						_nextStep();
					}
				});
			}

			// Konut tipi seçimi handler.
			if($step.type == 'single_image_choice') {
				var $konut_choices = wizard.find('.single-image-choice');
				$konut_choices.each(function(index) {
					var $konut_tipi = $(this);
					$konut_tipi.find("i").fadeOut(0);
					$konut_tipi.isAvailable = true;
					$konut_tipi.click(function() {
						console.log("CLICKED!!");
						if($konut_tipi.data('selected')) {
							_unSelectElement('konut_tipi', $konut_tipi);
						} else {
							_selectElement('konut_tipi', $konut_tipi);
						}
					});
				});
			}
		}

		// Progresses to the next step.
		function _nextStep() {
			var $step = wizard.settings.steps[currentStep];
			if($step.isDependent) {
				$step = _getDependentStep($step);
			}
			// Updating the data regarding current step.
			if(!_recordStepData($step)) {
				console.log($step);
				return false;
			}

			// Checking if this is the last scene of the wizard.
			if(++currentStep >= wizard.settings.steps.length) {
				currentStep--;
				_finalStep(wizard); 
			} else {
				// There is no problem, passing to the next step.
				if(currentStep > passedStepTracker)
					passedStepTracker++;
				_syncStep(wizard);
				wizard.settings.onNextStep();
			}
			return true;
		}

		// Records the given step data and stores it into its relative given_answer field.
		function _recordStepData($step) {
			switch($step.type) {
				case 'single_choice':
					
					wizard.find(".single-choice-button").each(function(k) {
						if($(this).data('selected')) {
							answer = $(this).data('value');
						}
					});
					$step.given_answer = answer;
					return true;
				case 'multiple_choice':
					var answers = wizard.find("input:checked");
					if(answers.length == 0) {
						return _stepFailed($step);
					}
					clean_answers = [];
					$.each(answers, function(k, answer) {
						clean_answers.push(answer.value);
					});
					$step.given_answer = clean_answers;
					return true;
				case 'form':
					var inputs = wizard.find("input");
					var answers = [];
					inputs.each(function(index) {
						if($(this).val() != "") {
							answers[index] = $(this).val();
						}
					});
					if(answers.length != 0) {
						$step.given_answer = answers;
					} else {
						return _stepFailed($step);
					}
					return true;
				case 'single_image_choice':
					var answers = [];

					$konut_tipi_choices = wizard.find(".single-image-choice");
					$konut_tipi_choices.each(function(index) {
						if($(this).data('selected')) {
							answers.push($(this).data('slug'));
						}
					});
					if(answers.length != 0) {
						$step.given_answer = answers;
						return true;
					} else {
						return _stepFailed($step);
					}
				case 'textarea':
					var answer = $("textarea").val() ;
					console.log(answer);
					if(answer) {
						$step.given_answer = answer;
					} else {
						$step.given_answer = "";
					}
					return true; // We are not checking answer in details section.
			}
			console.log($step.given_answer);
		}

		// Goes to the step of which reference is given as a parameter.
		function _goToStep(stepIndicator) {
			destinationStep = stepIndicator.data("step");

			// Checking if this is the first scene of the wizard.
			if(destinationStep > passedStepTracker || currentStep == destinationStep) {
				return;
			}

			var $step = wizard.settings.steps[destinationStep];
			currentStep = destinationStep;
			_syncStep(wizard);
			wizard.settings.onPrevStep();
		}

		// Takes the action when a step is failed.
		function _stepFailed($step) {
			$alert_area.html(wizard.settings.errors[$step.type]);
			$alert_area.fadeIn(300);
			setTimeout(function() {
				$alert_area.fadeOut(300);
			}, 1500);
			return false;
		}

		// Checks if user already answered this step. If so, puts values again.
		function _reuseOldInput($step) {
			if($step.given_answer) {
				switch($step.type) {
					case 'single_choice':
						$(".single-choice-button").each(function(k) {
							if($step.given_answer == $(this).data('value')) {
								$(this).find('i').fadeIn(200);
							}
						});
						break;
					case 'multiple_choice':
						$("input").each(function(k) {
							if($step.given_answer.indexOf($(this).val()) != -1)
								$(this).attr('checked', true);
						});
						break;
					case 'form':
						$("input").each(function(index) {
							if($step.given_answer[index]) {
								$(this).val($step.given_answer[index]);
							}
						});
						break;
					case 'single_image_choice':
						var $konut_choices = wizard.find('.single-image-choice');
						$konut_choices.each(function(index) {
							if($step.given_answer.indexOf($(this).data('slug')) != -1) {
								var $temp = $(this);
								$temp.isAvailable = true;
								_selectElement('konut_tipi', $temp);
							}
						});
						break;
					case 'textarea':
						wizard.find("textarea").val($step.given_answer);
						break;
				}
			}
		}

		// Renders the last step and finishes the wizard with the collected data.
		function _finalStep() {

			// Rendering the last step.
			wizard.html(_renderLastStep());
			
			// Preparing the eventual data.
			data = [];
			$.each(wizard.settings.steps, function(k, step) {
				data.push(step.given_answer);
			});

			// Calling the onFinish function with data as parameter.
			wizard.settings.onFinish(data);
		}

		// Creates the HTML document from the step information given to the plugin instance.
		function _getStepHTML($step) {
			var $parsed_step = $('<div class="wow-wizard-step"></div>');

			// Preparing questions and answers div according to whether note is exists or not.
			if($step.notes) {
				var $q_and_a = $('<div class="col-xs-9 wow-wizard-content"></div>');
				$notes = $('<div class="col-xs-3 wow-wizard-content"></div>');
				$notes.html($step.notes);
				$parsed_step.append($notes);
			} else {
				var $q_and_a = $('<div class="col-xs-12 wow-wizard-content"></div>');
			}
			
			// Preparing the question
			var $question = $('<div class="wow-wizard-step-question"></div>');
			$question.append($('<h2 class="wow-wizard-step-question-title">'+$step.questionTitle+'</h2>'));
			$step.questionDescription ? $question.append($('<p class="wow-wizard-step-question-description">'+$step.questionDescription+'</p>')) : null;
			
			// Preparing answers
			var $answers = $('<div class="wow-wizard-step-answers"></div>');
			switch($step.type) {
				case 'single_choice':
					$.each($step.answers, function(k, v) {
						$answers.append($('<div class="single-choice-button" data-name="'+$step.name+'" data-value="'+v.value+'"><i class="fa fa-check"></i>'+v.text+'</div>'));
					});
					break;
				case 'multiple_choice':
					try {
						$.each($step.answers, function(k, v) {
							$button_checkbox = $('<span class="checkboxescheckbox"></div>');
							$answers.append($('<label name="'+$step.name+'">'+v.text+'</label>'));
							$button_checkbox.append($('<input type="checkbox" name="'+$step.name+'" value="'+v.value+'">'));
							$answers.append($button_checkbox);
						});
					} catch(err) {
						throw new Error("Answers of a step cannot be empty.");
					}
					break;
				case 'form':
					try {
						var $wowRow = $('<div class="wow-row"></div>');
						for(var i = 0; i < $step.inputs.length; i++) {
							currInput = $step.inputs[i];
							$input = $('<input class="pull-left" name="'+currInput.name+'" type="'+currInput.type+'">');
							currInput.placeholder ? $input.attr('placeholder', currInput.placeholder) : null;
							var $wowCol6 = $('<div class="wow-col-6"></div>');
							$wowCol6.append($input);
							$wowRow.append($wowCol6);
						}
						$answers.append($wowRow);
					} catch(err) {
						throw new ("Input array of a step type \"form\" cannot be empty.");
					}
					break;
				case 'single_image_choice':
					try {
						var $choices = $('<div class="single-image-choices"></div>');
						for(var i = 0; i < $step.choices.length; i++) {
							var choice_info = $step.choices[i];
							var $choice = $('<div class="single-image-choice" data-slug="'+choice_info.slug+'"></div>');
							var $choice_image = $('<img src="'+choice_info.imageUrl+'"/>');
							var $choice_text = $('<p>'+choice_info.name+'</p>');
							var $circle_select = $('<div class="circle-select"><i class="fa fa-check"></i></div>');

							$choice.append($choice_image);
							$choice.append($choice_text);
							$choice.append($circle_select);
							$choices.append($choice);

						}
						$answers.append($choices);
					} catch(err) {
						console.log(err.message);
					}
					break;
				case 'textarea':
					$answers.append('<textarea name="'+$step.name+'"></textarea>');
					break;
			}

			// Preparing the question and answer div.
			$q_and_a.append($question);
			$q_and_a.append($answers);
			if(CONFIG.shouldHaveNextButton($step)) {
				$q_and_a.append($('<div id="wow-wizard-next-step" class="pull-right">'+wizard.settings.nextButtonText+'</div>'));
			}
			$q_and_a.append($('<div id="wow-alert" style="display:none;"></div>'));

			// Preparing the step indicators.
			var $step_indicators = $('<div class="wow-wizard-step-indicators col-xs-12"></div>');
			for(var i = 0; i < wizard.settings.steps.length; i++) {
				var $step_indicator = $('<div class="wow-wizard-step-indicator" data-step="'+(i)+'"><div class="step-id"><span>'+(i+1)+'</span></div><b>'+wizard.settings.steps[i].indicatorName+'</b></div>');
				$step_indicators.append($step_indicator);
			}

			// Merges the questions, answers and navigation step indicators.
			$parsed_step.prepend($q_and_a);
			$parsed_step.prepend($step_indicators);

			return $parsed_step;
		}

		// Renders the last(success) step of the wizard.
		function _renderLastStep() {
			$parsed_step = $('<div class="wow-wizard-last-step">THIS IS THE LAST STEP!</div>');
			return $parsed_step;
		}
		
		// Selects the given element choice.
		function _selectElement(type, $element) {
			if($element.isAvailable) {
				switch(type) {
					case 'room_choice':
						if(!$element.isCustom)
							$element.isAvailable = false;
						$element.css('color', 'white');
						$element.find("i").fadeIn(200, function() {
							$element.isAvailable = true;
							$element.data('selected', true);
						});		
						$element.animate({
							backgroundColor: '#59BAFF'
						}, 200, null);
						if($element.isCustom) {
							var $inputs = $element.find("input");
							$inputs.css('color', 'white');
							$inputs.css('border-bottom', '1px solid white');
						}
						break;
					case 'konut_tipi':
						$element.find(".circle-select").animate({
							backgroundColor: THEME.colors.imageChoiceCircleBackgroundColor
						}, 200, null);
						$element.find("i").fadeIn(200);
						$element.data('selected', true);
						break;
				}	
			}
		}

		// Unselects the given room choice.
		function _unSelectElement(type, $element) {
			if($element.isAvailable) {
				switch(type) {
					case 'room_choice':
						if(!$element.isCustom)
							$element.isAvailable = false;
						$element.css('color', '#59BAFF');
						$element.animate({
							backgroundColor: 'transparent'
						}, 200, null);
						$element.find("i").fadeOut(200, function() {
							$element.isAvailable = true;
							$element.data('selected', false);
						});
						if($element.isCustom) {
							$element.find("input").css('color', '#59BAFF');
							$element.find("input").css('border-bottom', '1px solid #59BAFF');
						}
						break;
					case 'konut_tipi':
						$element.find(".circle-select").animate({
							backgroundColor: 'white'
						}, 200, null);
						$element.find("i").fadeOut(200);
						$element.data('selected', false);
						break;
				}
			}
		}
	};
})(jQuery);