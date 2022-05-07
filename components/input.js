import { h } from 'preact';
import { useState } from 'preact/hooks';


export default function Input(props) {
  switch (props.type) {
    case 'file':
      return <FileInput {...props} />;
    default:
      return <input type="text" {...props} />;
  }
}

function FileInput({ id, name, value, className, ...inputProps }) {
  const [url, setUrl] = useState(value);

  const handleChange = e => {
    const el = e.target;
    setUrl(URL.createObjectURL(el.files[0]));
  };
  return (
    <div>
      <input type="file" id={id} className={className} onChange={handleChange} />
      <input name={name} value={url} className={className} {...inputProps} type="text" />
    </div>
  );
}