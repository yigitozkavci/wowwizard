///<reference path="jquery.d.ts" />
///<reference path="wow_wizard.d.ts" />
///<reference path="theme.ts" />
///<reference path="checkbox_beautifier.ts" />
(function($: JQueryStatic) {
	$.fn.wowWizard = function(options: WizardOptions) {
		// Default values in which case user does not gives a custom data.
		let defaultOptions: WizardOptions = {
			steps: [],
			theme: 'pomegranate',
			loader: '../../img/loader.gif',
			nextButtonText: 'Next',
			errors: {
				form: {
					required: "You have to fill in all required fields.",
					email: "Wrong e-mail format."
				},
				multiple_choice: {
					required: "You have to choose at least one of the choices.",
				},
				single_choice: {
					required: "You have to fill in all required fields.",
				}
			},
			onNextStep: function() {},
			onPrevStep: function() {},
			onFinish: function(data: any) {},
		};

		$.fn.wowWizard.defaults = defaultOptions;

		// For DRY purposes.
		this.warning = function(message: string){
		    console.error("Warning: " + message);
		}

		// Wizard settings
		let settings: WizardOptions = $.extend({}, $.fn.wowWizard.defaults, options);
		settings.errors = $.extend({}, $.fn.wowWizard.defaults.errors, options.errors);
		let wizard = this; // Global wizard variable which is going to be used in all plugin functions.
		wizard.settings = settings;

		let theme = Theme.construct(); // Just practicing singleton design pattern. It seems to fit in here.
		theme.setWizard(wizard);

		wizard.checkboxBeautifier = new CheckboxBeautifier(theme);
		wizard.update = function() {
			_syncStep();
		}
		// Wizard configuration consisting of constants and private methods.
		let CONFIG = (function() {
			var privateFields = {
				'shouldHaveNextButton': ['form', 'multiple_choice', 'multiple_image_choice', 'textarea'],
				'allowedStepTypes': ['single_choice', 'form', 'multiple_choice', 'multiple_image_choice', 'textarea']
			};
			return {
				shouldHaveNextButton: function($step: any) {
					return privateFields.shouldHaveNextButton.indexOf($step.type) != -1;
				},
				isStepTypeAllowed: function($step: any) {
					return privateFields.allowedStepTypes.indexOf($step.type) != -1;
				},
				debug: false
			};
		})();

		// Global current step and max-reached step trackers.
		let currentStep = 0;
		let passedStepTracker = 0;

		// Starting by syncing the step.
		_syncStep();

		// Synchronizes the step. Parses the html, creates the event handlers,
		// looks if user has answered this step and if so, uses those answers again.
		function _syncStep(): void {
			let $step: WizardStep = wizard.settings.steps[currentStep];
			if($step.isDependent) {
				$step = _getDependentStep($step);
			}
			if(!$step) {
				throw new Error("Wrong dependency accross the steps.");
			}
			else if(!CONFIG.isStepTypeAllowed($step)) {
				throw new Error("Step type is not allowed: "+$step.type);
			} else { // Step is validated.
				let $step_html = _getStepHTML($step);

				wizard.html($step_html).find('.wow-wizard-content').css('opacity', '0');
				_prepareEventHandlers($step, $step_html);
				theme.apply($step_html);

				let loadingTime = $step.type == 'multiple_image_choice' ? 1000 : 300;
				setTimeout(function() {
					wizard.find('.wow-wizard-content').animate({
						opacity:1
					}, 500);
					wizard.find('.loader').fadeOut(200);
				}, loadingTime);

				_reuseOldInput($step);
			}
			wizard.checkboxBeautifier.update();
		}

		// If the step is dependent, gets in the "steps" array of it and
		// pulls the step that needs to be triggered.
		function _getDependentStep($step: WizardStep): WizardStep {
			for(var i = 0; i < $step.steps.length; i++) {
				var step_steps = $step.steps[i];
				var $trigger_step = wizard.settings.steps[step_steps.triggerStep];
				if($trigger_step.given_answer == step_steps.triggerAnswer) {
					return step_steps;
				}
			}
		}

		// Prepares the click events on the document.
		function _prepareEventHandlers($step: WizardStep, $step_html: JQuery) {

			// Step indicator buttons click trigger
			var $step_buttons = $step_html.find(".wow-wizard-step-indicator");
			$step_buttons.each(function(index: any) {
				var step_id = $(this).data("step");
				if(passedStepTracker > step_id) {
					$(this).find(".step-id").html('<div class="check"></div>');
				}
				if(currentStep == step_id){
					$(this).addClass('visited');
				}
				$(this).click(function() {
					_goToStep($(this));
				});
			});

			// Fading out alert field at the time we parse the step.
			var $alert_area = $step_html.find("#wow-alert");
			$alert_area.fadeOut(0);

			// Next step and single-choice buttons trigger.
			var $next_step_button = $step_html.find("#wow-wizard-next-step");
			$next_step_button.click(function() {
				_nextStep();
			});
			$("div.single-choice-button").click(function() {
				$(this).data('selected', true);
				$(this).data('selected');
				_nextStep();
			});

			// Binding ENTER key press event if this step is suitable.
			if($step.type == 'form') {
				$(wizard).bind('keypress', function(e: any) {
					var code = e.keyCode || e.which;
					if(code == 13) { //Enter keycode
						_nextStep();
					}
				});
			}

			// Single image choice handler.
			if($step.type == 'multiple_image_choice') {
				var $multiple_image_choices = wizard.find('.multiple-image-choice');
				$multiple_image_choices.each(function(index: any) {
					var $multiple_image_choice = $(this);
					$multiple_image_choice.data('isAvailable', true);
					$multiple_image_choice.click(function() {
						if($multiple_image_choice.data('selected')) {
							_unSelectElement('multiple_image_choice', $multiple_image_choice);
						} else {
							_selectElement('multiple_image_choice', $multiple_image_choice);
						}
					});
				});
			}
		}

		// Progresses to the next step.
		function _nextStep() {
			let $step: WizardStep = wizard.settings.steps[currentStep];
			if($step.isDependent) {
				$step = _getDependentStep($step);
			}

			// Updating the data regarding current step.
			if(!_recordStepData($step)) {
				return false;
			}

			// Checking if this is the last scene of the wizard.
			if(++currentStep >= wizard.settings.steps.length) {
				currentStep--;
				_finalStep();
			} else {
				// There is no problem, passing to the next step.
				if(currentStep > passedStepTracker)
					passedStepTracker++;
				_syncStep();
				wizard.settings.onNextStep();
			}
			return true;
		}

		// Records the given step data and stores it into its relative given_answer field.
		function _recordStepData($step: WizardStep) {
			let alertMessage: string;
			let answer: string;
			let answers: string[] = [];
			switch($step.type) {
				case 'single_choice':
					wizard.find(".single-choice-button").each(function() {
						if($(this).data('selected')) {
							answer = $(this).data('value');
						}
					});
					$step.given_answer = answer;
					if(CONFIG.debug) console.log($step.given_answer);
					return true;
				case 'multiple_choice':

					wizard.find(".multiple-choice-choice").each(function() {
						if($(this).hasClass('active')) {
							answers.push($(this).data('value'));
						}
					});
					if(answers.length == 0) {
						alertMessage = $step.errors && $step.errors.required ? $step.errors.required : wizard.settings.errors.multiple_choice.required;
						return _stepFailed($step, alertMessage);
					}
					$step.given_answer = answers;
					if(CONFIG.debug) console.log($step.given_answer);
					return true;
				case 'form':
					let $inputs: JQuery = wizard.find("input");

					var stepFailed = false;

					$inputs.each(function(index: any) {
						if($(this).val() != "") {

							answers[index] = $(this).val();
						} else if($(this).data('required')) {
							stepFailed = true;
							alertMessage = $step.errors && $step.errors.required ? $step.errors.required : wizard.settings.errors.form.required;
							$(this).css('border-color', 'red');
							return true; // Works as a "continue" statement in jQuery each loop.
						}
						if($(this).attr('type') == 'email') {
							var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i; // E-Mail regex
							if(!re.test($(this).val())) {
								stepFailed = true;
								$(this).css('border-color', 'red');
								alertMessage = $step.errors && $step.errors.email ? $step.errors.email : wizard.settings.errors.form.email;
							}
							return true; // Works as a "continue" statement in jQuery each loop.
						}
					});

					$step.given_answer = answers;
					if(CONFIG.debug) console.log($step.given_answer);
					return stepFailed ? _stepFailed($step, alertMessage) : true;
				case 'multiple_image_choice':

					let $konut_tipi_choices: JQuery = wizard.find(".multiple-image-choice");
					$konut_tipi_choices.each(function() {
						if($(this).data('selected')) {
							answers.push($(this).data('slug'));
						}
					});

					if(answers.length != 0) {
						$step.given_answer = answers;
						if(CONFIG.debug) console.log($step.given_answer);
						return true;
					} else {
						alertMessage = $step.errors && $step.errors.required ? $step.errors.required : wizard.settings.errors.multiple_image_choice.required;
						return _stepFailed($step, alertMessage);
					}
				case 'textarea':
					answer = $("textarea").val();
					$step.given_answer = answer;

					if(CONFIG.debug) console.log($step.given_answer);
					return true; // We are not checking answer in details section.
			}
		}

		// Goes to the step of which reference is given as a parameter.
		function _goToStep(stepIndicator: JQuery): void {
			var destinationStep = stepIndicator.data("step");

			// Checking if this is the first scene of the wizard.
			if(destinationStep > passedStepTracker || currentStep == destinationStep) {
				return;
			}

			var $step = wizard.settings.steps[destinationStep];
			currentStep = destinationStep;
			_syncStep();

			wizard.settings.onPrevStep();
		}

		// Takes the action when a step is failed.
		function _stepFailed($step: WizardStep, alertMessage: string): boolean {
			var $alert_area = wizard.find("#wow-alert");
			$alert_area.html(alertMessage);
			$alert_area.fadeIn(300);
			setTimeout(() => {
				$alert_area.fadeOut(300);
			}, 1500);
			return false;
		}

		// Checks if user already answered this step. If so, puts values again.
		function _reuseOldInput($step: WizardStep): void {
			if($step.given_answer) {
				switch($step.type) {
					case 'single_choice':
						$(".single-choice-button").each(function() {
							if($step.given_answer == $(this).data('value')) {
								$(this).find('i').fadeIn(200);
							}
						});
						break;
					case 'multiple_choice':
						$(".fancy-checkbox").each(function() {
							var $button = $(this).find("button");
							if($step.given_answer.indexOf($button.data('value')) != -1) {
								wizard.checkboxBeautifier.selectButton($button);
							}
						});
						break;
					case 'form':
						$("input").each(function(index: any) {
							if($step.given_answer[index]) {
								$(this).val($step.given_answer[index]);
							}
						});
						break;
					case 'multiple_image_choice':
						var $konut_choices = wizard.find('.multiple-image-choice');
						$konut_choices.each(function(index: any) {
							if($step.given_answer.indexOf($(this).data('slug')) != -1) {
								var $temp = $(this);
								$temp.data('isAvailable', true);
								_selectElement('multiple_image_choice', $temp);
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
		function _finalStep(): void {

			// Rendering the last step.
			wizard.html(_renderLastStep());

			// Preparing the eventual data.
			var data: any = {};
			$.each(wizard.settings.steps, function(k: any, step: WizardStep) {
				var answer = step.given_answer;
				var step_name: any = step.name;
				if(step.isDependent) {
					for(var i = 0; i < step.steps.length; i++) {
						var substep = step.steps[i];
						if(substep.given_answer) {
							answer = substep.given_answer;
							step_name = substep.name;
							break;
						}
					};
				}
				data[step_name] = answer;
			});

			// Calling the onFinish function with data as parameter.
			wizard.settings.onFinish(data);
		}

		// Creates the HTML document from the step information given to the plugin instance.
		function _getStepHTML($step: WizardStep) {
			let $parsed_step: JQuery = $('<div class="wow-wizard-step" type="'+$step.type+'"></div>');

			// Preparing questions and answers div according to whether note is exists or not.
			let $q_and_a: JQuery;
			if($step.notes) {
				$q_and_a = $('<div class="col-xs-9 wow-wizard-content"></div>');
				let $notes = $('<div class="col-xs-3 wow-wizard-content"></div>');
				$notes.html($step.notes);
				$parsed_step.append($notes);
			} else {
				$q_and_a = $('<div class="col-xs-12 wow-wizard-content"></div>');
			}

			// Adding the loader
			$parsed_step.append($('<div class="loader"></div>'));

			// Preparing the question
			let $question = $('<div class="wow-wizard-step-question"></div>');
			$question.append($('<h2 class="wow-wizard-step-question-title">'+$step.questionTitle+'</h2>'));
			$step.questionDescription ? $question.append($('<p class="wow-wizard-step-question-description">'+$step.questionDescription+'</p>')) : null;

			// Preparing answers
			let $answers: JQuery = $('<div class="wow-wizard-step-answers"></div>');
			switch($step.type) {
				case 'single_choice':
					$.each($step.answers, function(_: any, v: any) {
						$answers.append($('<div class="single-choice-button" data-name="'+$step.name+'" data-value="'+v.value+'"><i class="fa fa-check"></i>'+v.text+'</div>'));
					});
					break;
				case 'multiple_choice':
					try {
						let $multiple_choice_choices = $('<div class="multiple-choice-choices"></div>');
						$.each($step.answers, function(_: any, v: any) {
							let $button_checkbox = $('<span class="fancy-checkbox"></span>');
							$button_checkbox.append($('<button type="button" data-value="'+v.value+'" class="button multiple-choice-choice" data-checked="false" style="margin-right:10px;" data-color="info">'+v.text+'</button>'));
							$button_checkbox.append($('<input style="display:none;" type="checkbox" name="'+v.value+'">'));
							$multiple_choice_choices.append($button_checkbox);
						});
						$answers.append($multiple_choice_choices);
					} catch(err) {
						console.log(err);
					}
					break;
				case 'form':
					try {
						let $inputRow = $('<div class="input-row"></div>');
						for(let i = 0; i < $step.inputs.length; i++) {
							let currInput = $step.inputs[i];
							let $input = $('<input class="pull-left" name="'+currInput.name+'" type="'+currInput.type+'">');
							currInput.placeholder ? $input.attr('placeholder', currInput.placeholder) : null;
							let $inputCol6 = $('<div class="input-col-6"></div>');
							$inputCol6.append($input);
							if(currInput.required) {
								$inputCol6.prepend($('<div class="star-icon">*</div>'));
								$input.data('required', true);
							}
							$inputRow.append($inputCol6);
						}
						$answers.append($inputRow);
					} catch(err) {
						throw new Error("Input array of a step type \"form\" cannot be empty.");
					}
					break;
				case 'multiple_image_choice':
					try {
						let $choices = $('<div class="multiple-image-choices"></div>');
						for(var i = 0; i < $step.answers.length; i++) {
							let choice_info = $step.answers[i];
							var $choice = $('<div class="multiple-image-choice" data-slug="'+choice_info.value+'"></div>');
							var $choice_image = $('<div class="multiple-image-container" style="background-image:url(\''+choice_info.imageUrl+'\')"/>');
							var $choice_text = $('<p>'+choice_info.text+'</p>');
							var $circle_select = $('<div class="circle-select"><div class="background"></div><div class="inner-circle-icon"></div></div>');

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
			let $parsed_step = $('<div class="wow-wizard-last-step"><h1>Thanks for using WowWizard!</h1><p>We\'ve got all your information. Will reach you soon.</p><a href="#">RETURN HOME</a></div>');
			return $parsed_step;
		}

		// Selects the given element choice.
		function _selectElement(type: any, $element: JQuery) {
			if($element.data('isAvailable')) {
				switch(type) {
					case 'room_choice':
						if(!$element.data('isCustom'))
							$element.data('isAvailable', false);
						$element.css('color', 'white');
						$element.find("i").fadeIn(200, function() {
							$element.data('isAvailable', true);
							$element.data('selected', true);
						});
						$element.animate({
							backgroundColor: '#59BAFF'
						}, 200, null);
						if($element.data('isCustom')) {
							var $inputs = $element.find("input");
							$inputs.css('color', 'white');
							$inputs.css('border-bottom', '1px solid white');
						}
						break;
					case 'multiple_image_choice':
						$element.find(".circle-select").addClass('selected');
						$element.find(".circle-select .background").fadeIn(200);
						$element.find(".circle-select .inner-circle-icon").fadeIn(200);
						$element.data('selected', true);
						break;
				}
			}
		}

		// Unselects the given room choice.
		function _unSelectElement(type: any, $element: JQuery) {
			if($element.data('isAvailable')) {
				switch(type) {
					case 'room_choice':
						if(!$element.data('isCustom'))
							$element.data('isAvailable', false);
						$element.css('color', '#59BAFF');
						$element.animate({
							backgroundColor: 'transparent'
						}, 200, null);
						$element.find("i").fadeOut(200, function() {
							$element.data('isAvailable', true);
							$element.data('selected', false);
						});
						if($element.data('isCustom')) {
							$element.find("input").css('color', '#59BAFF');
							$element.find("input").css('border-bottom', '1px solid #59BAFF');
						}
						break;
					case 'multiple_image_choice':
						$element.find(".circle-select").removeClass('selected');
						$element.find(".circle-select .background").fadeOut(200);
						$element.find(".circle-select .inner-circle-icon").fadeOut(200);
						$element.data('selected', false);
						break;
				}
			}
		}

		return wizard;
	};
})(jQuery);
