// src/mod/components/smart_form.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Component } from '../core/component';
    import { div, label, input, select, option, span, textarea, button, form } from '@je-es/vdom';
    import type { FormFieldOption, VNode, FieldButtonConfig } from '../../types';
    import { css } from '../core/styles';
    import { state } from '../core/decorators';
    import { api } from '@je-es/capi';
    import type { FormFieldConfig, ValidationRule } from '../../types';
    import { t } from '../services/i18n';
    import { bbMap, CM } from '../../main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ STYLE MAP ════════════════════════════════════════╗

    // Style map for form components
    interface StyleMapForm {
        form: string;
        field: string;
        fieldCheckbox: string;
        fieldInput: string;
        fieldInputContainer: string;
        fieldInputButtons: string;
        fieldInputButton: string;
        fieldInputButtonRules: string;
        fieldInputButtonRulesContent: string;
        fieldTextarea: string;
        fieldSelect: string;
        fieldLabel: string;
        fieldError: string;
        buttonsContainer: string;
        button: string;
        alert: string;
        alertError: string;
        alertSuccess: string;
    }

    const FORM_STYLES: StyleMapForm = {
        form: 'bb_form',
        field: 'bb_formField',
        fieldCheckbox: 'bb_formFieldCheckbox',
        fieldInput: 'bb_formFieldInput',
        fieldInputContainer: 'bb_formFieldInputContainer',
        fieldInputButtons: 'bb_formFieldInputButtons',
        fieldInputButton: 'bb_formFieldInputButton',
        fieldInputButtonRules: 'bb_formFieldInputButtonRules',
        fieldInputButtonRulesContent: 'bb_formFieldInputButtonRulesContent',
        fieldTextarea: 'bb_formFieldTextarea',
        fieldSelect: 'bb_formFieldSelect',
        fieldLabel: 'bb_formFieldLabel',
        fieldError: 'bb_formFieldError',
        buttonsContainer: 'bb_formButtonsContainer',
        button: 'bb_formButton',
        alert: 'bb_formAlert',
        alertError: 'bb_formAlert-error',
        alertSuccess: 'bb_formAlert-success',
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type { FormFieldConfig, ValidationRule };

    export interface ButtonConfig {
        label: string;
        className?: string;
        icon?: string;
        loadingLabel?: string;
        onClick?: 'submit' | (() => void | Promise<void>);
    }

    export interface FormConfig {
        fields: (FormFieldConfig | (FormFieldConfig | VNode)[])[];
        endpoint?: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        onSubmit?: (data: Record<string, unknown>, event: Event) => void | Promise<void>;
        onSuccess?: (data: unknown) => void;
        onError?: (error: unknown) => void;
        onValidationError?: (errors: Record<string, string>) => void;
        buttons?: Record<string, ButtonConfig>;
        className?: string;
        autoValidate?: boolean;
    }

    export interface FormField extends FormFieldConfig {
        error?: string;
        touched?: boolean;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * SmartForm Component
     * Auto-validation, CSRF protection, API submission
     */
    export class SmartFormComponent extends Component<FormConfig> {
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state fields: FormField[] = [];
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state formData: Record<string, unknown> = {};
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state isSubmitting = false;
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state submitError = '';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state submitSuccess = false;
        
        // Simple object for tracking password visibility (no state needed)
        passwordVisibility: Record<string, boolean> = {};

        constructor(props: FormConfig) {
            super(props);

            // Extract all FormFieldConfig objects from fields (including grouped fields)
            const allFields: FormFieldConfig[] = [];
            for (const item of this.props.fields) {
                if (Array.isArray(item)) {
                    // Handle grouped fields - extract only FormFieldConfig objects
                    for (const groupItem of item) {
                        if (groupItem && typeof groupItem === 'object' && 'name' in groupItem && 'type' in groupItem) {
                            allFields.push(groupItem as FormFieldConfig);
                        }
                    }
                } else {
                    // Handle individual field
                    allFields.push(item as FormFieldConfig);
                }
            }

            // Initialize fields immediately in constructor
            this.fields = allFields.map((field: FormFieldConfig) => ({
                ...field,
                error: undefined,
                touched: false,
            })) as FormField[];

            // Initialize form data
            for (const field of this.fields) {
                this.formData[field.name] = field.value || '';
            }
        }

        onMount(): void {
            // console.log('📝 SmartForm mounted with', this.fields.length, 'fields');
        }

        /**
         * Handle field change
         */
        handleChange(fieldName: string, value: unknown): void {
            this.formData[fieldName] = value;

            // Auto-validate if enabled
            const field = this.fields.find(f => f.name === fieldName);
            if (field && this.props.autoValidate) {
                field.error = this.validateField(field, value);
                field.touched = true;
            }

            this.update();
        }

        /**
         * Handle field blur
         */
        handleBlur(fieldName: string): void {
            const field = this.fields.find(f => f.name === fieldName);
            if (field) {
                field.touched = true;
                field.error = this.validateField(field, this.formData[fieldName]);
                this.update();
            }
        }

        /**
         * Validate single field
         */
        validateField(field: FormField, value: unknown): string | undefined {
            const validation = field.validation;
            if (!validation) return undefined;

            // Required
            if (validation.required && !value) {
                return validation.message || `${field.label || field.name} is required`;
            }

            if (!value) return undefined;

            // Convert to string for string validations
            const stringValue = String(value);

            // Min length
            if (validation.minLength && stringValue.length < validation.minLength) {
                return validation.message || `Minimum ${validation.minLength} characters required`;
            }

            // Max length
            if (validation.maxLength && stringValue.length > validation.maxLength) {
                return validation.message || `Maximum ${validation.maxLength} characters allowed`;
            }

            // Min value
            if (validation.min !== undefined && Number(value) < validation.min) {
                return validation.message || `Minimum value is ${validation.min}`;
            }

            // Max value
            if (validation.max !== undefined && Number(value) > validation.max) {
                return validation.message || `Maximum value is ${validation.max}`;
            }

            // Pattern
            if (validation.pattern && !validation.pattern.test(stringValue)) {
                return validation.message || 'Invalid format';
            }

            // Email
            if (validation.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
                return validation.message || 'Invalid email format';
            }

            // URL
            if (validation.url && !/^https?:\/\/.+/.test(stringValue)) {
                return validation.message || 'Invalid URL format';
            }

            // Custom validation
            if (validation.custom) {
                const result = validation.custom(value);
                if (result !== true) {
                    return typeof result === 'string' ? result : undefined;
                }
            }

            return undefined;
        }

        /**
         * Validate all fields
         */
        validateForm(): boolean {
            let isValid = true;
            const errors: Record<string, string> = {};

            for (const field of this.fields) {
                const error = this.validateField(field, this.formData[field.name]);
                field.error = error;
                field.touched = true;

                if (error) {
                    isValid = false;
                    errors[field.name] = error;
                }
            }

            this.update();

            // Call validation error callback
            if (!isValid && this.props.onValidationError) {
                this.props.onValidationError(errors);
            }

            return isValid;
        }

        /**
         * Handle form submission
         */
        async handleSubmit(event: Event): Promise<void> {
            event.preventDefault();

            // Validate form
            if (!this.validateForm()) {
                // Focus first error field
                const firstErrorField = this.fields.find(f => f.error);
                if (firstErrorField) {
                    const element = document.querySelector(`[name="${firstErrorField.name}"]`) as HTMLElement;
                    element?.focus();
                }
                return;
            }

            this.isSubmitting = true;
            this.submitError = '';
            this.submitSuccess = false;
            this.update();

            try {
                // Custom submit handler
                if (this.props.onSubmit) {
                    await this.props.onSubmit(this.formData, event);
                }
                // API submission
                else if (this.props.endpoint) {
                    const response = await api({
                        method: this.props.method || 'POST',
                        url: this.props.endpoint,
                        data: this.formData,
                    });

                    this.submitSuccess = true;

                    if (this.props.onSuccess) {
                        this.props.onSuccess(response.data);
                    }
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('global.loading');
                this.submitError = errorMessage;

                if (this.props.onError) {
                    this.props.onError(error);
                }
            } finally {
                this.isSubmitting = false;
                this.update();
            }
        }

        /**
         * Render label with optional icon
         */
        renderLabel(field: FormField): VNode | string {
            if (!field.label && !field.icon) return '';

            if (field.icon) {
                return label(
                    { for: field.name },
                    span(CM.fa(field.icon)),
                    field.label ? span(bbMap.form.fieldTitle, field.label) : ''
                ) as VNode;
            }

            return label({ for: field.name }, field.label) as VNode;
        }

        /**
         * Get field buttons configuration
         */
        getFieldButtons(field: FormField): FieldButtonConfig[] {
            const buttons: FieldButtonConfig[] = [];

            if (!field.fieldButtons && !field.showValidationRules) {
                return buttons;
            }

            // Add password toggle button
            if (field.type === 'password' && (field.fieldButtons?.includes('togglePassword') || field.fieldButtons?.some(b => (b as FieldButtonConfig)?.type === 'togglePassword'))) {
                buttons.push({
                    type: 'togglePassword',
                    icon: 'eye',
                    tooltip: t('form.showPassword', {}, 'Show Password'),
                });
            }

            // Add auto validation rules button
            if ((field.showValidationRules === true || field.fieldButtons?.includes('rules')) && field.validation) {
                buttons.push({
                    type: 'rules',
                    icon: 'list-check',
                });
            }

            // Add custom buttons
            if (field.fieldButtons) {
                for (const btn of field.fieldButtons) {
                    if (typeof btn === 'object' && btn.type === 'custom') {
                        buttons.push(btn);
                    }
                }
            }

            return buttons;
        }

        /**
         * Handle field button click
         */
        handleFieldButton(field: FormField, buttonType: string): void {
            if (buttonType === 'togglePassword') {
                // Toggle visibility state
                this.passwordVisibility[field.name] = !this.passwordVisibility[field.name];
                const isVisible = this.passwordVisibility[field.name];
                
                // Directly manipulate the input element's type
                const inputElement = document.querySelector(`input[name="${field.name}"]`) as HTMLInputElement;
                if (inputElement) {
                    inputElement.type = isVisible ? 'text' : 'password';
                }
                
                // Update the button icon
                const buttonContainer = inputElement?.closest(`.${FORM_STYLES.fieldInputContainer}`)
                    ?.querySelector(`.${FORM_STYLES.fieldInputButtons}`);
                const toggleBtn = buttonContainer?.querySelector('button') as HTMLButtonElement;
                if (toggleBtn) {
                    // Update the icon class
                    const iconSpan = toggleBtn.querySelector('span');
                    if (iconSpan) {
                        // Remove all fa-* classes
                        iconSpan.className = iconSpan.className.replace(/fa-eye(-slash)?/, isVisible ? 'fa-eye-slash' : 'fa-eye');
                    }
                    // Update title
                    toggleBtn.title = isVisible 
                        ? t('form.hidePassword', {}, 'Hide Password')
                        : t('form.showPassword', {}, 'Show Password');
                }
            }
        }

        /**
         * Render validation rules popup
         */
        renderValidationRules(field: FormField): VNode | string {
            if (!field.validation) return '';

            const rules: string[] = [];

            if (field.validation.required) {
                rules.push(t('form.rule.required', {}, 'This field is required'));
            }
            if (field.validation.minLength) {
                rules.push(t('form.rule.minLength', { length: String(field.validation.minLength) }, `Minimum ${field.validation.minLength} characters`));
            }
            if (field.validation.maxLength) {
                rules.push(t('form.rule.maxLength', { length: String(field.validation.maxLength) }, `Maximum ${field.validation.maxLength} characters`));
            }
            if (field.validation.min !== undefined) {
                rules.push(t('form.rule.min', { value: String(field.validation.min) }, `Minimum value: ${field.validation.min}`));
            }
            if (field.validation.max !== undefined) {
                rules.push(t('form.rule.max', { value: String(field.validation.max) }, `Maximum value: ${field.validation.max}`));
            }
            if (field.validation.email) {
                rules.push(t('form.rule.email', {}, 'Valid email format required'));
            }
            if (field.validation.url) {
                rules.push(t('form.rule.url', {}, 'Valid URL format required'));
            }
            if (field.validation.pattern) {
                rules.push(t('form.rule.pattern', {}, 'Pattern does not match'));
            }

            if (rules.length === 0) return '';

            return div(
                { class: FORM_STYLES.fieldInputButtonRulesContent },
                ...rules.map(rule => div({}, rule))
            ) as VNode;
        }

        /**
         * Render field input buttons
         */
        renderFieldButtons(field: FormField): VNode | string {
            const buttons = this.getFieldButtons(field);
            if (buttons.length === 0) return '';

            const buttonElements: VNode[] = [];

            for (const btn of buttons) {
                if (btn.type === 'rules') {
                    // Rules button with hover popup
                    buttonElements.push(
                        div(
                            { class: FORM_STYLES.fieldInputButtonRules, title: btn.tooltip },
                            button(
                                {
                                    type: 'button',
                                    class: FORM_STYLES.fieldInputButton,
                                    tabindex: -1,
                                    onclick: (e: Event) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    },
                                },
                                span(CM.fa(btn.icon || 'fa-circle-info'))
                            ),
                            this.renderValidationRules(field)
                        ) as VNode
                    );
                } else {
                    // Standard button
                    buttonElements.push(
                        button(
                            {
                                type: 'button',
                                class: FORM_STYLES.fieldInputButton,
                                title: btn.tooltip,
                                tabindex: -1,
                                onclick: (e: Event) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (btn.type === 'togglePassword') {
                                        this.handleFieldButton(field, btn.type);
                                    } else if (btn.onClick) {
                                        btn.onClick();
                                    }
                                },
                            },
                            span(CM.fa(btn.icon || 'fa-gear'))
                        ) as VNode
                    );
                }
            }

            return div({ class: FORM_STYLES.fieldInputButtons }, ...buttonElements) as VNode;
        }

        /**
         * Render form field
         */
        renderField(field: FormField): VNode {
            const value = this.formData[field.name] || '';
            const labelNode = this.renderLabel(field);
            const fieldClass = [FORM_STYLES.field, field.className].filter(Boolean).join(' ');
            const errorMsg = field.error && field.touched ? span({ class: FORM_STYLES.fieldError }, field.error) : '';

            switch (field.type) {
                case 'textarea':
                    return div(
                        { class: fieldClass },
                        labelNode,
                        div(
                            { class: FORM_STYLES.fieldInputContainer },
                            textarea(
                                {
                                    id: field.name,
                                    name: field.name,
                                    placeholder: field.placeholder || '',
                                    disabled: field.disabled || this.isSubmitting,
                                    oninput: (e: Event) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        this.handleChange(field.name, target.value);
                                    },
                                    onblur: () => this.handleBlur(field.name),
                                    class: FORM_STYLES.fieldTextarea,
                                },
                                String(value)
                            ),
                            this.renderFieldButtons(field)
                        ),
                        errorMsg
                    ) as VNode;

                case 'select': {
                    const options = field.options || [];
                    const optionNodes = options.map((opt: FormFieldOption) =>
                        option(
                            { value: String(opt.value), selected: String(opt.value) === String(value) },
                            opt.label
                        )
                    );

                    return div(
                        { class: fieldClass },
                        labelNode,
                        div(
                            { class: FORM_STYLES.fieldInputContainer },
                            select(
                                {
                                    id: field.name,
                                    name: field.name,
                                    disabled: field.disabled || this.isSubmitting,
                                    onchange: (e: Event) => {
                                        const target = e.target as HTMLSelectElement;
                                        this.handleChange(field.name, target.value);
                                    },
                                    onblur: () => this.handleBlur(field.name),
                                    class: FORM_STYLES.fieldSelect,
                                },
                                option({ value: '', selected: String(value) === '' }, t('form.select_placeholder', {}, 'Select...')),
                                ...optionNodes
                            ),
                            this.renderFieldButtons(field)
                        ),
                        errorMsg
                    ) as VNode;
                }

                case 'checkbox': {
                    const isChecked = Boolean(value);
                    const checkboxClass = [FORM_STYLES.field, FORM_STYLES.fieldCheckbox, field.className].filter(Boolean).join(' ');
                    return div(
                        { class: checkboxClass },
                        input(
                            {
                                type: 'checkbox',
                                id: field.name,
                                name: field.name,
                                checked: isChecked,
                                disabled: field.disabled || this.isSubmitting,
                                onchange: (e: Event) => {
                                    const target = e.target as HTMLInputElement;
                                    this.handleChange(field.name, target.checked);
                                },
                                class: FORM_STYLES.fieldCheckbox,
                            }
                        ),
                        label(
                            { for: field.name },
                            field.icon ? span(CM.fa(field.icon)) : '',
                            field.label || ''
                        ),
                        errorMsg
                    ) as VNode;
                }

                default: {
                    const isPasswordField = field.type === 'password';
                    const inputType = isPasswordField && this.passwordVisibility[field.name] ? 'text' : field.type || 'text';

                    return div(
                        { class: fieldClass },
                        labelNode,
                        div(
                            { class: FORM_STYLES.fieldInputContainer },
                            input(
                                {
                                    type: inputType,
                                    id: field.name,
                                    name: field.name,
                                    placeholder: field.placeholder || '',
                                    value: String(value),
                                    disabled: field.disabled || this.isSubmitting,
                                    oninput: (e: Event) => {
                                        const target = e.target as HTMLInputElement;
                                        this.handleChange(field.name, target.value);
                                    },
                                    onblur: () => this.handleBlur(field.name),
                                    class: FORM_STYLES.fieldInput,
                                }
                            ),
                            this.renderFieldButtons(field)
                        ),
                        errorMsg
                    ) as VNode;
                }
            }
        }

        /**
         * Render buttons section
         */
        renderButtons(): VNode {
            const buttons = this.props.buttons || {
                submit: {
                    label: t('form.submit', {}, 'Submit'),
                    onClick: 'submit'
                }
            };

            const buttonElements: VNode[] = [];

            for (const [buttonKey, buttonConfig] of Object.entries(buttons)) {
                const isSubmitButton = buttonConfig.onClick === 'submit' || buttonKey === 'submit';
                const isDisabled = this.isSubmitting && isSubmitButton;
                const buttonLabel = this.isSubmitting && isSubmitButton
                    ? (buttonConfig.loadingLabel || buttonConfig.label)
                    : buttonConfig.label;

                buttonElements.push(button(
                    {
                        type: isSubmitButton ? 'submit' : 'button',
                        class: [FORM_STYLES.button, buttonConfig.className].filter(Boolean).join(' '),
                        disabled: isDisabled,
                        onclick: !isSubmitButton ? async (e: Event) => {
                            e.preventDefault();
                            if (typeof buttonConfig.onClick === 'function') {
                                try {
                                    this.isSubmitting = true;
                                    this.update();
                                    await buttonConfig.onClick();
                                } finally {
                                    this.isSubmitting = false;
                                    this.update();
                                }
                            }
                        } : undefined,
                    },
                    buttonConfig.icon ? span(CM.fa(buttonConfig.icon), ' ') : '',
                    buttonLabel
                ) as VNode);
            }

            return div({ class: FORM_STYLES.buttonsContainer }, ...buttonElements) as VNode;
        }

        render(): VNode {
            // Render all fields/groups into an array first
            const fieldNodes: VNode[] = [];

            for (const item of this.props.fields) {
                if (Array.isArray(item)) {
                    // Handle grouped fields
                    const groupItems: VNode[] = [];
                    for (const groupItem of item) {
                        if (groupItem && typeof groupItem === 'object' && 'name' in groupItem && 'type' in groupItem) {
                            // It's a FormFieldConfig
                            const field = this.fields.find(f => f.name === (groupItem as FormFieldConfig).name);
                            if (field) {
                                groupItems.push(this.renderField(field));
                            }
                        } else {
                            // It's a VNode
                            groupItems.push(groupItem as VNode);
                        }
                    }
                    // Wrap grouped items in a container
                    fieldNodes.push(div({ class: 'bb_formFieldGroup' }, ...groupItems) as VNode);
                } else {
                    // Handle individual field
                    const field = this.fields.find(f => f.name === (item as FormFieldConfig).name);
                    if (field) {
                        fieldNodes.push(this.renderField(field));
                    }
                }
            }

            const formClass = [FORM_STYLES.form, this.props.className].filter(Boolean).join(' ');

            return form(
                { class: formClass, onsubmit: (e: Event) => this.handleSubmit(e) },
                this.submitError ? div({ class: [FORM_STYLES.alert, FORM_STYLES.alertError].join(' ') }, this.submitError) : '',
                this.submitSuccess ? div({ class: [FORM_STYLES.alert, FORM_STYLES.alertSuccess].join(' ') }, t('form.success', {}, 'Success')) : '',
                ...fieldNodes,
                this.renderButtons()
            ) as VNode;
        }

        styles() { return css``; }
    }

    /**
     * SmartForm helper function
     */
    export function SmartForm(config: FormConfig): VNode {
        const form = new SmartFormComponent(config);
        return form.render();
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝