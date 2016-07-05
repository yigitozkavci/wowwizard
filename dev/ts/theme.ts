interface colorSchema {
	activeIndicatorBackgroundColor: string,
	activeIndicatorTextColor: string,
	questionAndAnswerTextColor: string,
	circleColor: string,
	outlineColor: string,
	lineColor: string,
	activeButtonBackgroundColor: string,
	passiveButtonBackgroundColor: string,
	activeButtonTextColor: string,
	passiveButtonTextColor: string,
	buttonTextColor: string,
	imageChoiceBorderColor: string,
	imageChoiceCircleBackgroundColor: string,
	textColor: string
}

interface styleSchema {
	borderRadius: string
}

class Theme {
	private _colors: {[index: string]: colorSchema};
	private _styles: {[index: string]: styleSchema};
	private _wizard: any;
	private _selectedSchema: colorSchema;
	private _allowedSchemas = ['pomegranate', 'blueberry'];
	private _allowedStyles = ['material'];
	private _defaultSchema = 'pomegranate';
	private _defaultStyle = 'material';
	private _selectedStyle: styleSchema;

	constructor(wizard: any) {
		this._wizard = wizard;
		this._styles = {};
		this._colors = {};
		this.selectSchema(this._defaultSchema);
		this.selectStyle(this._defaultStyle);
	}

	public addColorSchema(name: string, schema: colorSchema): void {
		this._colors[name] = schema;
	}

	public addStyleSchema(name: string, schema: styleSchema): void {
		this._styles[name] = schema;
	}

	public selectSchema(name: string): void {
		this._selectedSchema = this._colors[name];
	}

	public selectStyle(name: string): void {
		this._selectedStyle = this._styles[name];
	}

	public getSelectedSchema(): colorSchema {
		return this._selectedSchema;
	}

	public getSelectedStyle(): styleSchema {
		return this._selectedStyle;
	}

	public apply(step_html: JQuery) {
		let selectedSchema: string = this._wizard.settings.theme;
		let selectedStyle: string = this._wizard.settings.style;

		if(selectedSchema) {
			if(this._allowedSchemas.indexOf(selectedSchema) === -1) {
				this._wizard.warning("Theme choice " + selectedSchema + " doesn't exist in the plugin.");
				this.selectSchema(this._defaultSchema);
			} else {
				this.selectSchema(selectedSchema);
			}
		} else {
			this._wizard.warning("You should specify a custom theme of your taste.");
			this.selectSchema(this._defaultSchema);
		}

		if(selectedStyle) {
			if(this._allowedStyles.indexOf(selectedStyle) === -1) {
				this._wizard.warning("Style choice " + selectedStyle + " doesn't exist in the plugin.");
				this.selectStyle(this._defaultStyle);
			} else {
				this.selectStyle(selectedStyle);
			}
		} else {
			this._wizard.warning("You should specify a custom style of your taste.");
			this.selectStyle(this._defaultStyle);
		}

		let choice: colorSchema = this.getSelectedSchema();
		let style: styleSchema = this.getSelectedStyle();

		// Step Indicators
		step_html.find(".wow-wizard-step-indicator.visited .step-id").css('background-color', choice.circleColor);
		step_html.find(".wow-wizard-step-indicator").css('color', choice.activeIndicatorTextColor);
		step_html.find(".wow-wizard-step-indicator.visited").css('background-color', choice.activeIndicatorBackgroundColor);
		step_html.find(".wow-wizard-step-indicator").filter(function (index) {
				return !$(this).hasClass('visited');
		}).css('color', choice.textColor);
		step_html.find('.wow-wizard-step-indicators').css('border-bottom', '2px solid ' + choice.lineColor);

		// Next Step Button
		step_html.find('#wow-wizard-next-step, .single-choice-button').css('background-color', choice.activeButtonBackgroundColor);
		step_html.find('#wow-wizard-next-step, .single-choice-button').css('color', choice.buttonTextColor);

		// Single Image Choice
		step_html.find('.multiple-image-choice .circle-select .background').css('background-color', choice.imageChoiceCircleBackgroundColor);
		step_html.find('.multiple-image-choice, .multiple-image-choice .circle-select').css('border', '2px solid ' + choice.imageChoiceBorderColor);

		// Multiple Choice Buttons
		step_html.find('.fancy-checkbox .button').css('background-color', choice.passiveButtonBackgroundColor);
		step_html.find('.fancy-checkbox .button.active').css('background-color', choice.activeButtonBackgroundColor);

		// Multiple Image Choice
		step_html.find('.multiple-image-choice .circle-select .background').css('background-color');

		// Form Elements
		step_html.find('.input-col-6 .star-icon').css('color', choice.outlineColor);
		step_html.find('input[type=text], textarea').css('outline', 'none');
		step_html.find('input[type=text]:focus, textarea:focus').css({
				'border': '2px solid ' + choice.outlineColor,
				'box-shadow': '0px 0px 5px 0px rgba(244,74,85,1);'
		});
		step_html.find('input[type=text], input[type=email], textarea').focus(function () {
				$(this).css({
						'border': '1px solid ' + choice.outlineColor,
						'-webkit-box-shadow': '0px 0px 5px 0px ' + choice.outlineColor,
						'box-shadow': '0px 0px 5px 0px ' + choice.outlineColor
				});
		});
		step_html.find('input[type=text], input[type=email], textarea').blur(function () {
				$(this).css({
						'border': '1px solid #BBB',
						'-webkit-box-shadow': 'none'
				});
		});

		// Design Style
		if (this._wizard.settings.style) {
				step_html.find('input, textarea, button, #wow-wizard-next-step, .multiple-image-choice, .single-choice-button, .wow-wizard-step-indicator, #wow-alert').css('border-radius', this.getSelectedStyle().borderRadius);
		}

		// Loader
		step_html.find('.loader').css('background-image', "url('" + this._wizard.settings.loader + "')");
	}
}
