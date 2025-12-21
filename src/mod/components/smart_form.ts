// src/mod/components/smart_form.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Component } from '../core/component';
    import { html } from '@je-es/vdom';
    import type { FormFieldOption, VNode } from '../../types';
    import { css } from '../core/styles';
    import { state } from '../core/decorators';
    import { api } from '@je-es/capi';
    import type { FormFieldConfig, ValidationRule } from '../../types';
import { t } from '../services/i18n';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type { FormFieldConfig, ValidationRule };

    export interface FormConfig {
        fields: FormFieldConfig[];
        endpoint?: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        onSubmit?: (data: Record<string, unknown>, event: Event) => void | Promise<void>;
        onSuccess?: (data: unknown) => void;
        onError?: (error: unknown) => void;
        onValidationError?: (errors: Record<string, string>) => void;
        submitButton?: {
            label?: string;
            loadingLabel?: string;
            className?: string;
        };
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

        constructor(props: FormConfig) {
            super(props);

            // Initialize fields immediately in constructor
            this.fields = this.props.fields.map((field: FormFieldConfig) => ({
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
                return html`
                    <label for=${field.name}>
                        <i class="fa ${field.icon}"></i>
                        ${field.label ? html`<span>${field.label}</span>` : ''}
                    </label>
                ` as VNode;
            }

            return html`<label for=${field.name}>${field.label}</label>` as VNode;
        }

        /**
         * Render form field
         */
        renderField(field: FormField): VNode {
            const value = this.formData[field.name] || '';
            const labelNode = this.renderLabel(field);

            switch (field.type) {
                case 'textarea': {
                    return html`
                        <div class="bb_formField ${field.className || ''}">
                            ${labelNode}
                            <textarea
                                id=${field.name}
                                name=${field.name}
                                placeholder=${field.placeholder || ''}
                                disabled=${String(field.disabled || this.isSubmitting)}
                                oninput=${(e: Event) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    this.handleChange(field.name, target.value);
                                }}
                                onblur=${() => this.handleBlur(field.name)}
                                class="bb_formFieldTextarea"
                            >${String(value)}</textarea>
                            ${field.error && field.touched ? html`
                                <span class="field-error">${field.error}</span>
                            ` : ''}
                        </div>
                    ` as VNode;
                }

                case 'select': {
                    const options = field.options || [];
                    const optionNodes = options.map((opt: FormFieldOption) => {
                        const isSelected = String(opt.value) === String(value);
                        return html`<option value=${String(opt.value)} selected=${isSelected}>${opt.label}</option>`;
                    });

                    return html`
                        <div class="bb_formField ${field.className || ''}">
                            ${labelNode}
                            <select
                                id=${field.name}
                                name=${field.name}
                                disabled=${String(field.disabled || this.isSubmitting)}
                                onchange=${(e: Event) => {
                                    const target = e.target as HTMLSelectElement;
                                    this.handleChange(field.name, target.value);
                                }}
                                onblur=${() => this.handleBlur(field.name)}
                                class="bb_formFieldSelect"
                            >
                                <option value="" selected=${String(value) === ''}>${t('global.please_select', {}, 'Select...')}</option>
                                ${optionNodes}
                            </select>
                            ${field.error && field.touched ? html`
                                <span class="field-error">${field.error}</span>
                            ` : ''}
                        </div>
                    ` as VNode;
                }

                case 'checkbox': {
                    const isChecked = Boolean(value);
                    return html`
                        <div class="bb_formField bb_formField-checkbox ${field.className || ''}">
                            <label>
                                <input
                                    type="checkbox"
                                    id=${field.name}
                                    name=${field.name}
                                    checked=${isChecked}
                                    disabled=${String(field.disabled || this.isSubmitting)}
                                    onchange=${(e: Event) => {
                                        const target = e.target as HTMLInputElement;
                                        this.handleChange(field.name, target.checked);
                                    }}
                                    class="bb_formFieldCheckbox"
                                />
                                ${field.icon ? html`<i class="fa ${field.icon}"></i>` : ''}
                                ${field.label || ''}
                            </label>
                            ${field.error && field.touched ? html`
                                <span class="field-error">${field.error}</span>
                            ` : ''}
                        </div>
                    ` as VNode;
                }

                default: {
                    return html`
                        <div class="bb_formField ${field.className || ''}">
                            ${labelNode}
                            <input
                                type="${field.type || 'text'}"
                                id="${field.name}"
                                name="${field.name}"
                                placeholder="${field.placeholder || ''}"
                                value="${String(value)}"
                                disabled="${field.disabled || this.isSubmitting}"
                                oninput=${(e: Event) => {
                                    const target = e.target as HTMLInputElement;
                                    this.handleChange(field.name, target.value);
                                }}
                                onblur=${() => this.handleBlur(field.name)}
                                class="bb_formFieldInput"
                            />
                            ${field.error && field.touched ? html`
                                <span class="field-error">${field.error}</span>
                            ` : ''}
                        </div>
                    ` as VNode;
                }
            }
        }

        render(): VNode {
            const submitButton = this.props.submitButton || {};

            // Render all fields into an array first
            const fieldNodes = this.fields.map((field: FormField) => this.renderField(field));

            return html`
                <form
                    class="smart_form ${this.props.className || ''}"
                    onsubmit=${(e: Event) => this.handleSubmit(e)}
                >
                    ${this.submitError ? html`
                        <div class="alert alert-error">${this.submitError}</div>
                    ` : ''}

                    ${this.submitSuccess ? html`
                        <div class="alert alert-success">${t('global.loading')}</div>
                    ` : ''}

                    ${fieldNodes}

                    <button
                        type="submit"
                        class="submit-button ${submitButton.className || ''}"
                        disabled=${String(this.isSubmitting)}
                    >
                        ${this.isSubmitting
                            ? (submitButton.loadingLabel || t('global.loading'))
                            : (submitButton.label || t('global.loading'))
                        }
                    </button>
                </form>
            ` as VNode;
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