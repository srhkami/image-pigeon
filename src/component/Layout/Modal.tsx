import {useRef, useEffect, ReactNode} from "react";

type Props = {
  isShow: boolean,
  onHide: () => void,
  closeButton?: boolean,
  backdrop?: boolean, // 可點擊背景關閉
  children: ReactNode,
}

export default function Modal({isShow, onHide, closeButton = false, backdrop = true, children}: Props) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isShow) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isShow]);

  // 當使用者按 ESC 或點外部關閉時觸發
  // const handleClose = () => {
  //   onHide();
  // };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onHide}>
      <div className="modal-box">
        {closeButton &&
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onHide}>✕</button>}
        {children}
        {/*<div className="modal-action">*/}
        {/*  <button className="btn" onClick={onHide}>關閉</button>*/}
        {/*</div>*/}
      </div>
      <form method="dialog" className={backdrop ? "modal-backdrop" : ""}>
        <button>close</button>
      </form>
    </dialog>
  );
};