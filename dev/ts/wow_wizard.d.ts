interface ErrorOption {
	required?: string;
	email?: string;
}
interface WizardStepAnswer {
	value: string;
	text: string;
}
interface WizardStepInput {
	type: string;
	name: string;
	placeholder: string;
	required: boolean;
}
interface WizardStep {
	name: string;
	type: string;
	indicatorName: string;
	questionTitle: string;
	questionDescription: string;
	answers?: WizardStepAnswer[];
	triggerStep?: number;
	triggerAnswer?: string;
	inputs?: WizardStepInput[];
}
interface WizardOptions {
	errors: {[index: string]: ErrorOption};
	steps: WizardStep[];
	theme: string;
	loader: string;
	onNextStep: () => any;
	onPrevStep: () => any;
	onFinish: (data: string) => any;
}
