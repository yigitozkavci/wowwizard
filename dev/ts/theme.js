class Theme {
    constructor(wizard) {
        this._allowedSchemas = ['pomegranate', 'blueberry'];
        this._defaultSchema = 'pomegranate';
        this._wizard = wizard;
    }
    addColorSchema(name, schema) {
        this._colors[name] = schema;
    }
    addStyleSchema(name, schema) {
        this._styles[name] = schema;
    }
    selectSchema(name) {
        this._selectedSchema = this._colors[name];
    }
    selectStyle(name) {
        this._selectedStyle = this._styles[name];
    }
    getSelectedSchema() {
        return this._selectedSchema;
    }
    getSelectedStyle() {
        return this._selectedStyle;
    }
    apply(step_html) {
        let selectedSchema = this._wizard.settings.theme;
        let choice;
        if (selectedSchema) {
            if (this._allowedSchemas.indexOf(selectedSchema) === -1) {
                this._wizard.warning("Theme choice " + selectedSchema + " doesn't exist in the plugin.");
                this.selectSchema(this._defaultSchema);
            }
            else {
                this.selectSchema(selectedSchema);
            }
        }
        else {
            this._wizard.warning("You should specify a custom theme of your taste.");
            this.selectSchema(this._defaultSchema);
        }
        step_html.find(".wow-wizard-step-indicator.visited .step-id").css('background-color', choice.circleColor);
        step_html.find(".wow-wizard-step-indicator").css('color', choice.activeIndicatorTextColor);
        step_html.find(".wow-wizard-step-indicator.visited").css('background-color', choice.activeIndicatorBackgroundColor);
        step_html.find(".wow-wizard-step-indicator").filter(function (index) {
            return !$(this).hasClass('visited');
        }).css('color', choice.textColor);
        step_html.find('.wow-wizard-step-indicators').css('border-bottom', '2px solid ' + choice.lineColor);
        step_html.find('#wow-wizard-next-step, .single-choice-button').css('background-color', choice.activeButtonBackgroundColor);
        step_html.find('#wow-wizard-next-step, .single-choice-button').css('color', choice.buttonTextColor);
        step_html.find('.multiple-image-choice .circle-select .background').css('background-color', choice.imageChoiceCircleBackgroundColor);
        step_html.find('.multiple-image-choice, .multiple-image-choice .circle-select').css('border', '2px solid ' + choice.imageChoiceBorderColor);
        step_html.find('.fancy-checkbox .button').css('background-color', choice.passiveButtonBackgroundColor);
        step_html.find('.fancy-checkbox .button.active').css('background-color', choice.activeButtonBackgroundColor);
        step_html.find('.multiple-image-choice .circle-select .background').css('background-color');
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
        if (this._wizard.settings.style) {
            step_html.find('input, textarea, button, #wow-wizard-next-step, .multiple-image-choice, .single-choice-button, .wow-wizard-step-indicator, #wow-alert').css('border-radius', this.getSelectedStyle().borderRadius);
        }
        step_html.find('.loader').css('background-image', "url('" + this._wizard.settings.loader + "')");
    }
}
//# sourceMappingURL=theme.js.map