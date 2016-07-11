interface ICheckboxBeautifierSettings {
  'on': {'icon': string};
  'off': {'icon': string};
}
class CheckboxBeautifier {
  private _settings: ICheckboxBeautifierSettings = {
    on: {
      icon: 'glyphicon glyphicon-check'
    },
    off: {
      icon: 'glyphicon glyphicon-unchecked'
    }
  };
	private _theme: Theme;
	constructor(theme: Theme) {
		this._theme = theme;
	}
	public update() {
		this.sync();
	}
	public selectButton($button: JQuery) {
		this.sync();
		$button.triggerHandler('click');
	}
  private _updateDisplay($button: JQuery, $checkbox: JQuery) {
    let isChecked = $checkbox.is(':checked');

    // Set the button's state
    if(isChecked) {
      $button.data('state', 'on');

      // Set the button's icon
      $button.find('.state-icon')
        .removeClass()
        .addClass('state-icon ' + this._settings.on.icon);
    } else {
      $button.data('state', 'off');

      // Set the button's icon
      $button.find('.state-icon')
        .removeClass()
        .addClass('state-icon ' + this._settings.off.icon);
    }
    /*
    let buttonState: buttonStateEnum = isChecked ? buttonStateEnum.on : buttonStateEnum.off;
    let selectedState = this._settings[buttonState];
    let selectedIcon: string = this._settings[buttonState].icon;
    */

    // Update the button's color
    if (isChecked) {
      $button
        .addClass('active')
        .css('background-color', this._theme.getSelectedColorSchema().activeButtonBackgroundColor)
        .css('color', this._theme.getSelectedColorSchema().activeButtonTextColor);
    }
    else {
      $button
        .removeClass('active')
        .css('background-color', this._theme.getSelectedColorSchema().passiveButtonBackgroundColor)
        .css('color', this._theme.getSelectedColorSchema().passiveButtonTextColor);
    }
  }

  private sync() {
    var self = this;
    $('.fancy-checkbox').each((index: number, value: Element) => {
      var $widget = $(value),
        $button = $widget.find('button'),
        $checkbox = $widget.find('input:checkbox'),
        color = $button.data('color');

      // Event Handlers
      $button.unbind().on('click', () => {
        $checkbox.data('checked', !$checkbox.is(':checked'));
        $checkbox.prop('checked', !$checkbox.is(':checked'));
        this._updateDisplay($button, $checkbox);
      });
      $checkbox.on('change', () => {
        this._updateDisplay($button, $checkbox);
      });

			this._updateDisplay($button, $checkbox);
      let iconClass: string;
      if($button.data('state') === 'on') {
        iconClass = this._settings.on.icon;
      } else {
        iconClass = this._settings.off.icon;
      }
			// Inject the icon if applicable
			if ($button.find('.state-icon').length == 0) {
				$button.prepend('<i class="state-icon ' + iconClass + '"></i> ');
			}
    });
  }
};
