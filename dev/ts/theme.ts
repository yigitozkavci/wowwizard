///<reference path="theme.d.ts" />
class Theme {

	/**
	 * Keeps all color schemas stored as variable.
	 */
	private _colors: {[index: string]: colorSchema};

	/**
	 * Keeps all color schemas stored as variable.
	 */
	private _styles: {[index: string]: styleSchema};

	/**
	 * The wizard object. It will be required to access user-chosen wizard settings.
	 */
	private _wizard: any;

	/**
	 * By the user, or by default there will be a selected schema and style.
	 * These variables keep this information.
	 */
	private _selectedColorSchema: colorSchema;
	private _selectedStyleSchema: styleSchema;

	/**
	 * We will keep allowed schemas and styles here just in case user chooses an unknown
	 * schema or style.
	 */
	private _allowedColorSchemas = ['pomegranate', 'blueberry'];
	private _allowedStyleSchemas = ['material'];

	/**
	 * Self-explanatory.
	 */
	private _defaultColorSchema = 'pomegranate';
	private _defaultStyleSchema = 'material';

	private static _instance: Theme = new Theme();
	/**
	 * Predefined style and schemas.
	 * Constructors cannot have 'private modifier at the current version of TypeScript, but
	 * is planned in 2.0
	 * http://stackoverflow.com/questions/30174078/how-to-define-singleton-in-typescript#comment61843857_36978360
	 */
	constructor() {
		this._styles = {};
		this._colors = {};
		this.selectColorSchema(this._defaultColorSchema);
		this.selectStyleSchema(this._defaultStyleSchema);
		this.addPredefinedColorAndStyles();
	}

	public static construct(): Theme {
		return Theme._instance;
	}
	public setWizard(wizard: any) {
		this._wizard = wizard;
	}
	/**
	 * Adds a single color schema to this theme.
	 */
	public addColorSchema(name: string, schema: colorSchema): void {
		this._colors[name] = schema;
	}

	/**
	 * Adds a single color style to this theme.
	 */
	public addStyleSchema(name: string, schema: styleSchema): void {
		this._styles[name] = schema;
	}

	/**
	 * Selects a schema for this theme. Selected theme will be available via
	 * @getSelectedSchema().
	 */
	public selectColorSchema(name: string): void {
		this._selectedColorSchema = this._colors[name];
	}

	/**
	 * Selects a color for this theme. Selected color will be available via
	 * @getSelectedSchema().
	 */
	public selectStyleSchema(name: string): void {
		this._selectedStyleSchema = this._styles[name];
	}

	public getSelectedColorSchema(): colorSchema {
		return this._selectedColorSchema;
	}

	public getSelectedStyleSchema(): styleSchema {
		return this._selectedStyleSchema;
	}

	public apply(step_html: JQuery) {
		let selectedColorSchema: string = this._wizard.settings.theme;
		let selectedStyleSchema: string = this._wizard.settings.style;

		if(selectedColorSchema) {
			if(this._allowedColorSchemas.indexOf(selectedColorSchema) === -1) {
				this._wizard.warning("Theme choice " + selectedColorSchema + " doesn't exist in the plugin.");
				this.selectColorSchema(this._defaultColorSchema);
			} else {
				this.selectColorSchema(selectedColorSchema);
			}
		} else {
			this._wizard.warning("You should specify a custom theme of your taste.");
			this.selectColorSchema(this._defaultColorSchema);
		}

		if(selectedStyleSchema) {
			if(this._allowedStyleSchemas.indexOf(selectedStyleSchema) === -1) {
				this._wizard.warning("Style choice " + selectedStyleSchema + " doesn't exist in the plugin.");
				this.selectStyleSchema(this._defaultStyleSchema);
			} else {
				this.selectStyleSchema(selectedStyleSchema);
			}
		} else {
			this._wizard.warning("You should specify a custom style of your taste.");
			this.selectStyleSchema(this._defaultStyleSchema);
		}

		let colorSchemaChoice: colorSchema = this.getSelectedColorSchema();
		let styleSchemaChoice: styleSchema = this.getSelectedStyleSchema();

		// Step Indicators
		step_html.find(".wow-wizard-step-indicator.visited .step-id").css('background-color', colorSchemaChoice.circleColor);
		step_html.find(".wow-wizard-step-indicator").css('color', colorSchemaChoice.activeIndicatorTextColor);
		step_html.find(".wow-wizard-step-indicator.visited").css('background-color', colorSchemaChoice.activeIndicatorBackgroundColor);
		step_html.find(".wow-wizard-step-indicator").filter(function (index) {
				return !$(this).hasClass('visited');
		}).css('color', colorSchemaChoice.textColor);
		step_html.find('.wow-wizard-step-indicators').css('border-bottom', '2px solid ' + colorSchemaChoice.lineColor);

		// Next Step Button
		step_html.find('#wow-wizard-next-step, .single-choice-button').css('background-color', colorSchemaChoice.activeButtonBackgroundColor);
		step_html.find('#wow-wizard-next-step, .single-choice-button').css('color', colorSchemaChoice.buttonTextColor);

		// Single Image Choice
		step_html.find('.multiple-image-choice .circle-select .background').css('background-color', colorSchemaChoice.imageChoiceCircleBackgroundColor);
		step_html.find('.multiple-image-choice, .multiple-image-choice .circle-select').css('border', '2px solid ' + colorSchemaChoice.imageChoiceBorderColor);

		// Multiple Choice Buttons
		step_html.find('.fancy-checkbox .button').css('background-color', colorSchemaChoice.passiveButtonBackgroundColor);
		step_html.find('.fancy-checkbox .button.active').css('background-color', colorSchemaChoice.activeButtonBackgroundColor);

		// Multiple Image Choice
		step_html.find('.multiple-image-choice .circle-select .background').css('background-color');

		// Form Elements
		step_html.find('.input-col-6 .star-icon').css('color', colorSchemaChoice.outlineColor);
		step_html.find('input[type=text], textarea').css('outline', 'none');
		step_html.find('input[type=text]:focus, textarea:focus').css({
				'border': '2px solid ' + colorSchemaChoice.outlineColor,
				'box-shadow': '0px 0px 5px 0px rgba(244,74,85,1);'
		});
		step_html.find('input[type=text], input[type=email], textarea').focus(function () {
				$(this).css({
						'border': '1px solid ' + colorSchemaChoice.outlineColor,
						'-webkit-box-shadow': '0px 0px 5px 0px ' + colorSchemaChoice.outlineColor,
						'box-shadow': '0px 0px 5px 0px ' + colorSchemaChoice.outlineColor
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
				step_html.find('input, textarea, button, #wow-wizard-next-step, .multiple-image-choice, .single-choice-button, .wow-wizard-step-indicator, #wow-alert').css('border-radius', this.getSelectedStyleSchema().borderRadius);
		}

		// Loader
		step_html.find('.loader').css('background-image', "url('" + this._wizard.settings.loader + "')");
	}
	/**
	 * We have 2(and hopefully more in the future) predefined schemas and 1 style. This function will
	 * be called while theme object is constructed and will add those predefined stuff.
	 */
	private addPredefinedColorAndStyles() {
		let pomegranate: colorSchema = {
			activeIndicatorBackgroundColor: '#F44A56',
			activeIndicatorTextColor: '#FFF',
			questionAndAnswerTextColor: '#69181E',
			circleColor: '#C23640',
			outlineColor: '#F44A56',
			lineColor: '#F44A56',
			activeButtonBackgroundColor: '#F44A56',
			passiveButtonBackgroundColor: '#FFF',
			activeButtonTextColor: '#FFF',
			passiveButtonTextColor: '#000',
			buttonTextColor: '#FFF',
			imageChoiceBorderColor: "#F44A56",
			imageChoiceCircleBackgroundColor: "#FFB3B8",
			textColor: "#FFF"
		}
		this.addColorSchema('pomegranate', pomegranate);
		let blueberry: colorSchema = {
			activeIndicatorBackgroundColor: '#4068D6',
			activeIndicatorTextColor: '#FFF',
			questionAndAnswerTextColor: '#69181E',
			circleColor: '#204ABD',
			outlineColor: '#4068D6',
			lineColor: '#4068D6',
			activeButtonBackgroundColor: '#4068D6',
			passiveButtonBackgroundColor: '#FFF',
			activeButtonTextColor: '#FFF',
			passiveButtonTextColor: '#000',
			buttonTextColor: '#FFF',
			imageChoiceBorderColor: "#4068D6",
			imageChoiceCircleBackgroundColor: "#A2B5EB",
			textColor: "#FFF"
		}
		this.addColorSchema('blueberry', blueberry);
		let material: styleSchema = {
			borderRadius: "0.2px"
		}
		this.addStyleSchema('material', material);
	}
}
