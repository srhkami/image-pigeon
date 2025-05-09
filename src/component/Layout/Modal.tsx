import {useRef, useEffect, ReactNode} from "react";

type Props = {
  isShow: boolean,
  onHide: () => void,
  closeButton?: boolean,
  backdrop?: boolean, // 可點擊背景關閉
  children: ReactNode,
}

export default function Modal({isShow, onHide, closeButton = false, backdrop = true, children}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isShow) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isShow]);

  return (
    <dialog ref={dialogRef} className="modal" onClose={onHide}>
      <div className="modal-box">
        {closeButton &&
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onHide}>✕</button>}
        {children}
      </div>
      <form method="dialog" className={backdrop ? "modal-backdrop" : ""}>
        <button>close</button>
      </form>
    </dialog>
  );
};