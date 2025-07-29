import {useState} from "react";

export default function useModal() {

  const [isShow, setIsShow] = useState<boolean>(false);

  const onShow = () => setIsShow(true);
  const onHide = () => setIsShow(false);

  return {isShow, onShow, onHide}
}