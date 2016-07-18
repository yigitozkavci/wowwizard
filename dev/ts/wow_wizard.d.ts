interface ErrorOption {
	required?: string;
	email?: string;
}
interface WizardStepAnswer {
	value: string;
	text: string;
	imageUrl?: string;
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
	isDependent?: boolean;
	steps?: WizardStep[];
	given_answer?: string|string[];
	errors?: ErrorOption;
	notes?: string;
}
interface WizardOptions {
	errors: {[index: string]: ErrorOption};
	steps: Array<WizardStep>;
	theme: string;
	loader: string;
	onNextStep: () => void;
	onPrevStep: () => void;
	onFinish: (data: string) => void;
}
