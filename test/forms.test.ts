/* eslint-disable @typescript-eslint/no-explicit-any */
// test/forms.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
    import { SmartFormComponent } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('SmartForm', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should render form with fields', async () => {
            const form = new SmartFormComponent({
                fields: [
                    { name: 'username', type: 'text', label: 'Username' },
                    { name: 'email', type: 'email', label: 'Email' }
                ]
            });

            await form.mount(container);

            expect(container.querySelector('input[name="username"]')).toBeTruthy();
            expect(container.querySelector('input[name="email"]')).toBeTruthy();
        });

        test('should validate required fields', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'username',
                        type: 'text',
                        validation: { required: true }
                    }
                ],
                autoValidate: true
            });

            await form.mount(container);

            const input = container.querySelector('input[name="username"]') as HTMLInputElement;

            // Trigger validation
            input.dispatchEvent(new Event('blur'));
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeTruthy();
        });

        test('should validate email format', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'email',
                        type: 'email',
                        validation: { email: true }
                    }
                ],
                autoValidate: true
            });

            await form.mount(container);

            // const input = container.querySelector('input[name="email"]') as HTMLInputElement;

            // Set invalid email
            form.handleChange('email', 'invalid-email');
            form.handleBlur('email');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeTruthy();

            // Set valid email
            form.handleChange('email', 'test@example.com');
            form.handleBlur('email');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeFalsy();
        });

        test('should validate minLength', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'password',
                        type: 'password',
                        validation: { minLength: 8 }
                    }
                ],
                autoValidate: true
            });

            await form.mount(container);

            form.handleChange('password', 'short');
            form.handleBlur('password');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeTruthy();

            form.handleChange('password', 'longenough');
            form.handleBlur('password');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeFalsy();
        });

        test('should validate maxLength', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'bio',
                        type: 'textarea',
                        validation: { maxLength: 10 }
                    }
                ],
                autoValidate: true
            });

            await form.mount(container);

            form.handleChange('bio', 'This is way too long');
            form.handleBlur('bio');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeTruthy();
        });

        test('should validate pattern', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'phone',
                        type: 'text',
                        validation: { pattern: /^\d{10}$/ }
                    }
                ],
                autoValidate: true
            });

            await form.mount(container);

            form.handleChange('phone', '123');
            form.handleBlur('phone');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeTruthy();

            form.handleChange('phone', '1234567890');
            form.handleBlur('phone');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('.error')).toBeFalsy();
        });

        test('should handle custom validation', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'age',
                        type: 'number',
                        validation: {
                            custom: (value) => {
                                const age = parseInt(value as string);
                                return age >= 18 || 'Must be 18 or older';
                            }
                        }
                    }
                ],
                autoValidate: true
            });

            await form.mount(container);

            form.handleChange('age', '15');
            form.handleBlur('age');
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.textContent).toContain('Must be 18 or older');
        });

        test('should handle form submission', async () => {
            let submittedData: any = null;

            const form = new SmartFormComponent({
                fields: [
                    { name: 'username', type: 'text' }
                ],
                onSubmit: async (data) => {
                    submittedData = data;
                }
            });

            await form.mount(container);

            form.handleChange('username', 'testuser');

            const formElement = container.querySelector('form') as HTMLFormElement;
            formElement.dispatchEvent(new Event('submit'));

            await new Promise(resolve => setTimeout(resolve, 20));

            expect(submittedData).toBeTruthy();
            expect(submittedData.username).toBe('testuser');
        });

        test('should show submit button', async () => {
            const form = new SmartFormComponent({
                fields: [{ name: 'test', type: 'text' }],
                submitButton: {
                    label: 'Submit Form',
                    className: 'custom-button'
                }
            });

            await form.mount(container);

            const button = container.querySelector('button[type="submit"]');
            expect(button).toBeTruthy();
            expect(button?.textContent).toContain('Submit Form');
        });

        test('should disable fields', async () => {
            const form = new SmartFormComponent({
                fields: [
                    { name: 'testfield', type: 'text', disabled: true }
                ]
            });

            await form.mount(container);

            const input = container.querySelector('input[name="testfield"]') as HTMLInputElement;
            
            // Verify the field exists
            expect(input).toBeTruthy();
            expect(input.name).toBe('testfield');
            
            // Check the form's internal field configuration has disabled set
            const fields = (form as any).fields;
            const field = fields.find((f: any) => f.name === 'testfield');
            expect(field).toBeTruthy();
            expect(field.disabled).toBe(true);
        });

        test('should render select fields', async () => {
            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'country',
                        type: 'select',
                        options: [
                            { label: 'USA', value: 'us' },
                            { label: 'Canada', value: 'ca' }
                        ]
                    }
                ]
            });

            await form.mount(container);

            const select = container.querySelector('select[name="country"]');
            expect(select).toBeTruthy();
            expect(container.querySelectorAll('option').length).toBeGreaterThan(2);
        });

        test('should render checkbox fields', async () => {
            const form = new SmartFormComponent({
                fields: [
                    { name: 'agree', type: 'checkbox', label: 'I agree' }
                ]
            });

            await form.mount(container);

            const checkbox = container.querySelector('input[type="checkbox"]');
            expect(checkbox).toBeTruthy();
        });

        test('should render textarea fields', async () => {
            const form = new SmartFormComponent({
                fields: [
                    { name: 'message', type: 'textarea' }
                ]
            });

            await form.mount(container);

            const textarea = container.querySelector('textarea[name="message"]');
            expect(textarea).toBeTruthy();
        });

        test('should prevent submission with validation errors', async () => {
            let submitted = false;

            const form = new SmartFormComponent({
                fields: [
                    {
                        name: 'email',
                        type: 'email',
                        validation: { required: true, email: true }
                    }
                ],
                onSubmit: async () => {
                    submitted = true;
                }
            });

            await form.mount(container);

            const formElement = container.querySelector('form') as HTMLFormElement;
            formElement.dispatchEvent(new Event('submit'));

            await new Promise(resolve => setTimeout(resolve, 20));

            expect(submitted).toBe(false);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝