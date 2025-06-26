import React, { useState } from 'react';
import ModalBasic from './ModalBasic';

const RoomList = () => {

  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  }

  return (
    <div>
      <button onClick={handleOpenModal}>방 생성</button>
      {modalOpen && <ModalBasic setModalOpen={setModalOpen}/>}
    </div>
  );
};

export default RoomList;