
export type CommonFieldProps<T> = {

    label?: string,

    value: T,

    onChange: (val: T) => void,

    error?: string | undefined | false,

    onBlur?: () => void,

    disabled?: boolean,
}