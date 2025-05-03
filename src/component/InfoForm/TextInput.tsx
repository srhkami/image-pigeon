type Props = {
  readonly name: string,
  readonly label: string,
  readonly placeholder?: string,
  readonly type?: 'text' | 'date' | 'datetime-local' | 'number',
  readonly register: any,
}

export default function TextInput({name, label, placeholder = '', type = 'text', register}: Props) {
  return (
    <>
      <label htmlFor={name} className="label">{label}</label>
      <input type={type} placeholder={placeholder} id={name}
             className="input input-sm" {...register(name, {required: true})}/>
    </>
  )
}