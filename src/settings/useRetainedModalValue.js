import { useEffect, useState } from "react";

export default function useRetainedModalValue(value) {
  const [retainedValue, setRetainedValue] = useState(value);

  useEffect(() => {
    if (value) {
      setRetainedValue(value);
    }
  }, [value]);

  return retainedValue;
}
