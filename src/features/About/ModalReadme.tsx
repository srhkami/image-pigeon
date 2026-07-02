import {Button, Modal, ModalBody, ModalFooter} from "@/component";
import ReactMarkdown from 'react-markdown';
import readmePath from '../../../README.md?raw';
import {useModal} from "@/hooks";
import 'github-markdown-css/github-markdown.css';
import {useEffect} from "react";
import {AppVersion} from "@/utils/log.ts";

export default function ModalReadme() {

  const {isShow, onShow, onHide} = useModal()

  useEffect(() => {
    const isReadVersion = localStorage.getItem('readme') ?? '';
    if (isReadVersion !== AppVersion) {
      onShow();
    }
  }, [onShow]);

  const onClose = () => {
    localStorage.setItem('readme', AppVersion);
    onHide()
  }

  return (
    <>
      <button onClick={onShow}>功能介紹</button>
      <Modal isShow={isShow} onHide={onHide} size='xl'>
        <ModalBody>
          <div className="prose">
            <ReactMarkdown>{readmePath}</ReactMarkdown>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button style='outline' onClick={onClose}>不再顯示</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}