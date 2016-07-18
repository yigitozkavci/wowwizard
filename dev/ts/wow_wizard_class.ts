///<reference path="wow_wizard.d.ts" />
class WowWizard {
	private _options: WizardOptions;
	private _currentStep: number;
	private _passedStepTracker: number;
	private _settings: WizardOptions;
	private _elem: JQuery;
	private _theme: Theme;
	private _checkboxBeautifier: CheckboxBeautifier;
	private _config = (function() {
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

	constructor() {
		this._currentStep = 0;
		this._passedStepTracker = 0;
		this._setDefaultOptions();
		this._settings = $.extend({}, $.fn.wowWizard.defaults, this._options);
		let theme = Theme.construct(); // Just practicing singleton design pattern. It seems to fit in here.
		theme.setWizard(this);
		this._theme = theme;
		this._checkboxBeautifier = new CheckboxBeautifier(this._theme);
	}
	private _setDefaultOptions(): void {
		this._options = {
			steps: [],
			theme: 'pomegranate',
			loader: '../../img/loader.gif',
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
			onFinish: function(data: any) {}
		};
	}
	private _syncStep(): void {
		let $step: WizardStep = this._settings.steps[this._currentStep];
		if($step.isDependent) {
			$step = this._getDependentStep($step);
		}
		if(!$step) {
			throw new Error("Wrong dependency accross the steps.");
		}
		else if(!this._config.isStepTypeAllowed($step)) {
			throw new Error("Step type is not allowed: "+$step.type);
		} else { // Step is validated.
			let $step_html = this._getStepHTML($step);

			this._elem.empty().append($step_html).find('.wow-wizard-content').css('opacity', '0'); // TODO: Check whether this works or not.
			this._prepareEventHandlers($step, $step_html);
			this._theme.apply($step_html);

			let loadingTime = $step.type == 'multiple_image_choice' ? 1000 : 300;
			setTimeout(function() {
				this._elem.find('.wow-wizard-content').animate({
					opacity:1
				}, 500);
				this._elem.find('.loader').fadeOut(200);
			}, loadingTime);

			this._reuseOldInput($step);
		}
		this._checkboxBeautifier.update();
	}
	private _reuseOldInput($step: WizardStep): void {
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
	private _getDependentStep($step: WizardStep): WizardStep {
		for(var i = 0; i < $step.steps.length; i++) {
			var step_steps = $step.steps[i];
			var $trigger_step = this._settings.steps[step_steps.triggerStep];
			if($trigger_step.given_answer == step_steps.triggerAnswer) {
				return step_steps;
			}
		}
	}
	private _getStepHTML($step: WizardStep) {
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
	private _prepareEventHandlers($step: WizardStep, $step_html: JQuery) {

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
}
