
export type CommonFieldProps<T> = {

    value: T,
    
    onChange: (val: T) => void,
    
    error?: string | undefined,
    
    onBlur?: () => void,

    disabled?: boolean,
}