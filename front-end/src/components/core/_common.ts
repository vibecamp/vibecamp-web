
export type CommonFieldProps<T> = {

    label?: string,

    value: T,
    
    onChange: (val: T) => void,
    
    error?: string | undefined,
    
    onBlur?: () => void,

    disabled?: boolean,
}