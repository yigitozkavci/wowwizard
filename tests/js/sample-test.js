QUnit.test( "hello test", function( assert ) {
	assert.ok( 1 == "1", "Passed!" );
});

QUnit.test('jQuery Plugin Requirements', function (assert) {
	assert.ok($('.wow-wizard').wowWizard({
		theme: 'blueberry',
		style: 'material',
		title: 'Contact Form',
		nextButtonText: 'Next',
		loader: '../../img/loader.gif',
		steps: [
			{
				name: 'pokemon_choice',
				type: 'multiple_image_choice',
				indicatorName: 'Pokemon',
				questionTitle: 'Pokemon Selection',
				questionDescription: 'Select your pokemon!',
				answers: [
					{
						text: 'Squirtle',
						value: 'squirtle',
						imageUrl: '../img/1.png'
					},
					{
						text: 'Bulbasaur',
						value: 'bulbasaur',
						imageUrl: '../img/2.png'
					},
					{
						text: 'Charmander',
						value: 'charmander',
						imageUrl: '../img/3.png'
					},
				],
				errors: {
					required: "You should choose at least one of the choices."
				}
			},
			{
				name: 'details',
				type: 'textarea',
				indicatorName: 'Details',
				questionTitle: 'Details',
				questionDescription: "We. Want. All. Your. Data",
			},
			{
				name: 'estate_type',
				type: 'single_choice',
				indicatorName: 'Estate Status',
				questionTitle: 'You are buying an estate for sure. For rent or for sale?',
				questionDescription: 'Answer me!',
				answers: [
					{
						value: 'for_rent',
						text: 'For Rent'
					},
					{
						value: 'for_sale',
						text: 'For Sale'
					}
				]
			},
			{
				name: 'districts',
				type: 'multiple_choice',
				indicatorName: "Districts",
				questionTitle: 'Districts Choice?',
				questionDescription: "Where are you buying it?",
				answers: [
					{
						'value': 'alaska',
						'text': 'Alaska'
					},
					{
						'value': 'arizona',
						'text': 'Arizona'
					}
				]
			},
			{
				isDependent: true,
				indicatorName: "Extra Information",
				steps: [
					{
						name: 'extra_type_1',
						type: 'single_choice',
						questionTitle: 'Who are you?',
						questionDescription: "I'm asking this because you chose \"For Rent\" option before.",
						triggerStep: 2,
						triggerAnswer: 'for_rent',
						answers: [
							{
								value: 'nobody',
								text: 'Nobody'
							},
							{
								value: 'everybody',
								text: 'Everybody'
							},
						]
					},
					{
						name: 'extra_type_2',
						type: 'single_choice',
						questionTitle: 'Why would you buy it?',
						questionDescription: "I'm asking this because you chose \"For Sale\" option before.",
						triggerStep: 2,
						triggerAnswer: 'for_sale',
						answers: [
							{
								value: 'for_investment',
								text: 'For Investment'
							},
							{
								value: 'for_research_purposes',
								text: 'For Research Purposes'
							}
						]
					},
				]
			},
			{
				name: 'contact',
				type: 'form',
				indicatorName: "Contact",
				questionTitle: 'Contact Information',
				inputs: [
					{
						type: 'text',
						name: 'first_name',
						placeholder: 'First Name',
						required: true
					},
					{
						type: 'text',
						name: 'last_name',
						placeholder: 'Last Name',
						required: true
					},
					{
						type: 'text',
						name: 'phone',
						placeholder: 'Phone Number',
					},
					{
						type: 'email',
						name: 'email',
						placeholder: 'E-Mail',
					}
				],
				errors: {
					required: "Required fields cannot be empty."
				}
			},
		],
		onFinish: function(data) {
			console.log("Wizard is completed. Here is the data: ");
			console.log(data);
		},
		html: true
	}).addClass('test-class'), 'Can be chanied');
	
	assert.equal($('.wow-wizard').hasClass('test-class'), true, "Class was added correctly from chaining");
});