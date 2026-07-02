import {useCallback, useState} from "react";

export default function useModal() {

  const [isShow, setIsShow] = useState<boolean>(false);

  const onShow = useCallback(() => setIsShow(true), []);
  const onHide = useCallback(() => setIsShow(false), []);

  return {isShow, onShow, onHide}
}